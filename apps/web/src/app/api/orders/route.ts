/**
 * Authenticated storefront order placement.
 *
 * Critical security/UX rules:
 *
 *   - **Never trust client prices.** Every line's `unitPriceRupees` is
 *     re-read from the DB and re-computed server-side. Client-supplied price
 *     hints are ignored.
 *   - **Stock is reserved at placement.** Every line's variant `quantity` is
 *     atomically decremented under a `>= requested` guard (the oversell
 *     guard); the order carries `inventoryReserved: true`. Stock returns to
 *     the pool only when the order is cancelled / refunded / returned.
 *   - **Placement is idempotent.** A client-supplied `idempotencyKey` makes a
 *     retried submission return the original order instead of duplicating it.
 *   - **Customer identity comes from the session.** The client can submit a
 *     display name/address, but never chooses the customer record.
 *   - **Order numbers are unique even under contention.** A retry loop
 *     handles the rare same-second collision.
 *   - **Body & rate limits.** parseBody enforces a fixed body cap;
 *     enforcePublicRateLimit caps placements per signed-in customer within the
 *     short-burst window (see SHORT_BURST_WINDOW_MS).
 *
 * Loyalty points are earned only when the order transitions to `delivered`;
 * redeemed points are debited atomically here at placement, and refunded if
 * order creation fails.
 */

import { type Types } from "mongoose";

import {
	connectDB,
	createWithUniqueOrderNumber,
	Customer,
	decrementOfferUsageCounts,
	incrementOfferUsageCounts,
	isMongoDuplicateKeyError,
	LoyaltyAccount,
	Offer as OfferModel,
	Order as OrderModel,
	Product as ProductModel,
	releaseStock,
	reserveStock,
	getStoreSettings,
	fireOrderEventNotifications,
	getIntegrationSettings,
	type StockLine,
	type CustomerAddressAttributes,
	type DeliveryMethod,
	type OfferAttributes,
	type OrderDoc,
	type OrderStatus,
	type PaymentMethod,
	type ProductAttributes,
	type VariantAttributes,
} from "@store/db";
import {
	FIELD_LIMITS,
	badRequest,
	conflict,
	created,
	evaluateCartOffers,
	isValidId,
	isValidationError,
	logger,
	isVariantInStock,
	LOYALTY_MIN_REDEEM,
	maxRedeemable,
	normalizePhoneNumber,
	parseBody,
	phoneFingerprint,
	pointsEarnedFor,
	pointsToRupees,
	serverError,
	SHORT_BURST_WINDOW_MS,
	unauthorized,
	validateString,
	validateSubmittedCatalogOfferLock,
	computeCodSurchargeRupees,
	computeCourierShippingRupees,
	computeMemberDiscountRupees,
	getPaymentMethods,
	isOfferEligible,
	isOnlineCardCheckoutReady,
	orderPaymentToCheckoutId,
	toActiveOffer,
	type EvaluatableItem,
} from "@store/shared";

import { enforcePublicRateLimit } from "@/lib/api/publicRateLimit";
import { enforceSameOrigin } from "@/lib/api/sameOrigin";
import { findVariantOnProduct } from "@/lib/cart/reconcileCartLines";
import { applyCatalogVisibility, resolveCatalogVisibility } from "@/lib/core/queries";
import { getVerifiedCustomer } from "@/lib/server/customerSession";
import { startOrderOnlineCheckout, toOnlineCheckoutApiResponse } from "@/lib/payments/startOnlineCheckout";

const ALLOWED_DELIVERY: ReadonlyArray<DeliveryMethod> = ["pickup", "courier"];
const ALLOWED_PAYMENT: ReadonlyArray<PaymentMethod> = ["bank-transfer", "cod", "card"];

const isDeliveryMethod = (value: unknown): value is DeliveryMethod => typeof value === "string" && (ALLOWED_DELIVERY as readonly string[]).includes(value);
const isPaymentMethod = (value: unknown): value is PaymentMethod => typeof value === "string" && (ALLOWED_PAYMENT as readonly string[]).includes(value);

const MAX_LINES_PER_ORDER = 20;
/** Inclusive minimum quantity per cart line — anything below is a bad-request. */
const MIN_QUANTITY_PER_LINE = 1;
const MAX_QUANTITY_PER_LINE = 10;
/** Max order placements per IP+phone per `SHORT_BURST_WINDOW_MS`. */
const MAX_ORDERS_PER_WINDOW = 5;

/** Inclusive minimum length for the customer's full name on checkout. */
const MIN_NAME_CHARS = 2;
/** Inclusive minimum length for a customer phone number — short enough to
 *  accept landline-style sequences while rejecting obvious typos. */
const MIN_PHONE_CHARS = 7;
const DEFAULT_CUSTOMER_CITY = "—";

interface OrderItemBody {
	productId?: unknown;
	variantId?: unknown;
	quantity?: unknown;
	attributes?: unknown;
	appliedOfferId?: unknown;
	appliedOfferLockedAt?: unknown;
}

interface AddressBody {
	recipientName?: unknown;
	area?: unknown;
	street?: unknown;
	postalCode?: unknown;
}

interface CustomerBody {
	name?: unknown;
	/** Guest checkout only — signed-in customers are keyed off their session. */
	phoneNumber?: unknown;
}

interface OrderBody {
	customer?: CustomerBody;
	items?: unknown;
	delivery?: unknown;
	payment?: unknown;
	address?: AddressBody;
	loyalty?: {
		redeemPoints?: unknown;
	};
	idempotencyKey?: unknown;
}

/** Max length we accept for a client-supplied idempotency key. */
const MAX_IDEMPOTENCY_KEY_CHARS = 80;

interface ResolvedItem {
	productDoc: ProductAttributes & { _id: Types.ObjectId };
	variant: VariantAttributes & { _id: Types.ObjectId };
	quantity: number;
	appliedOfferId?: string;
	appliedOfferTitle?: string;
	appliedOfferLockedAt?: Date;
}

/** The subset of a Customer this route needs to place (and price) an order. */
interface OrderCustomer {
	_id: Types.ObjectId;
	name: string;
	phoneNumber: string;
	city?: string;
	addresses?: CustomerAddressAttributes[];
	isMember?: boolean;
}

/**
 * Match or create a Customer for a guest checkout, keyed on the canonical phone
 * number so repeat guests thread onto one record. Never sets member/password
 * fields — a guest can't self-promote to member.
 */
async function resolveGuestCustomer(customer: CustomerBody | undefined): Promise<OrderCustomer | { error: string } | null> {
	const nameResult = validateString(customer?.name, { label: "Name", min: MIN_NAME_CHARS, max: FIELD_LIMITS.personName });
	if (isValidationError(nameResult)) {
		return { error: nameResult.error };
	}
	const phoneResult = validateString(customer?.phoneNumber, { label: "Phone", min: MIN_PHONE_CHARS, max: FIELD_LIMITS.phoneNumber });
	if (isValidationError(phoneResult)) {
		return { error: phoneResult.error };
	}
	const phoneNumber = normalizePhoneNumber(phoneResult);
	if (!phoneNumber) {
		return { error: "Enter a valid Pakistan mobile number." };
	}
	const doc = await Customer.findOneAndUpdate(
		{ phoneNumber },
		{ $setOnInsert: { phoneNumber, name: nameResult, city: DEFAULT_CUSTOMER_CITY, addresses: [], isLoyaltyMember: false, isMember: false } },
		{ new: true, upsert: true },
	).lean<OrderCustomer>();
	// A registered member owns this phone. Guests must not thread onto — and thus
	// overwrite the name/addresses of — a member's account; send them to sign in.
	if (doc?.isMember) {
		return { error: "This number belongs to a member account. Please sign in to place your order." };
	}
	return doc;
}

/**
 * Log — but never rethrow — a failed rollback step. A rollback runs while we're
 * already unwinding a failed placement; if a compensating write also fails we
 * surface it for manual reconciliation instead of masking the original error.
 */
function logRollbackFailure(step: string, error: unknown, orderNumber?: string): void {
	logger.warn({ error, step, orderNumber }, "Order rollback step failed");
}

interface ValidatedLine {
	productId: string;
	variantId: string;
	quantity: number;
	attributes: Record<string, string | string[]>;
	appliedOfferId?: string;
	appliedOfferLockedAt?: Date;
}

/**
 * Validate each raw cart line and merge duplicate product+variant pairs into a
 * single line with a combined quantity, so two qty-1 lines for the same variant
 * can't each slip past an individual "1 in stock" check and oversell. Collects
 * the product IDs so the caller can resolve them in one `find($in)` round-trip.
 */
function parseAndMergeLines(items: unknown[]): { error: string } | { lines: ValidatedLine[]; productIds: string[] } {
	const productIds = new Set<string>();
	const mergedLines = new Map<string, ValidatedLine>();
	for (const raw of items) {
		// Each element still arrives as a freshly-parsed JSON value, so we type
		// it through the all-`unknown` `OrderItemBody` shape and validate below.
		const line = raw as OrderItemBody;
		if (!isValidId(line.productId)) {
			return { error: "Each item must include a valid productId." };
		}
		if (!isValidId(line.variantId)) {
			return { error: "Each item must include a valid variantId." };
		}
		const quantity = typeof line.quantity === "number" ? line.quantity : Number(line.quantity);
		if (!Number.isFinite(quantity) || quantity < MIN_QUANTITY_PER_LINE) {
			return { error: `Item quantity must be at least ${MIN_QUANTITY_PER_LINE}.` };
		}
		const key = `${line.productId}:${line.variantId}`;
		const existing = mergedLines.get(key);
		const combined = (existing?.quantity ?? 0) + Math.floor(quantity);
		if (combined > MAX_QUANTITY_PER_LINE) {
			return { error: `Quantity per line cannot exceed ${MAX_QUANTITY_PER_LINE}.` };
		}
		const appliedOfferId = typeof line.appliedOfferId === "string" && isValidId(line.appliedOfferId) ? line.appliedOfferId : existing?.appliedOfferId;
		let appliedOfferLockedAt: Date | undefined = existing?.appliedOfferLockedAt;
		if (typeof line.appliedOfferLockedAt === "string" && line.appliedOfferLockedAt.trim().length > 0) {
			const parsedLock = new Date(line.appliedOfferLockedAt);
			if (!Number.isNaN(parsedLock.getTime())) {
				appliedOfferLockedAt = parsedLock;
			}
		}
		const attributes =
			line.attributes && typeof line.attributes === "object" && !Array.isArray(line.attributes)
				? (line.attributes as Record<string, string | string[]>)
				: (existing?.attributes ?? {});
		productIds.add(line.productId);
		mergedLines.set(key, {
			productId: line.productId,
			variantId: line.variantId,
			quantity: combined,
			attributes,
			appliedOfferId,
			appliedOfferLockedAt,
		});
	}
	return { lines: Array.from(mergedLines.values()), productIds: Array.from(productIds) };
}

/**
 * Match each validated line to a live product+variant and enforce availability
 * (exists, not out of stock, enough quantity). Returns a customer-facing
 * conflict message on the first line that can't be honored.
 */
function resolveOrderItems(
	lines: ValidatedLine[],
	productMap: Map<string, ProductAttributes & { _id: Types.ObjectId }>,
): { conflict: string } | { items: ResolvedItem[] } {
	const resolvedItems: ResolvedItem[] = [];
	for (const line of lines) {
		const product = productMap.get(line.productId);
		if (!product) {
			return { conflict: "One or more products in your cart are no longer available. Remove them and add fresh items from the shop." };
		}
		const variant =
			product.variants.find((candidate) => candidate._id?.toString() === line.variantId) ??
			findVariantOnProduct(product, { variantId: line.variantId, attributes: line.attributes });
		if (!variant) {
			return {
				conflict: `${product.name} in your cart is out of date. Remove it from your cart, open the product page again, and add it back before placing your order.`,
			};
		}
		if (!isVariantInStock({ quantity: variant.quantity, forceOutOfStock: variant.forceOutOfStock === true })) {
			return { conflict: `${product.name} is sold out.` };
		}
		if (variant.quantity < line.quantity) {
			return { conflict: `${product.name} has only ${variant.quantity} in stock.` };
		}
		// `lean()` returns embedded subdocs without `_id` typed as ObjectId; the
		// variant came from the same query as its parent, so the cast is a no-op.
		resolvedItems.push({
			productDoc: product,
			variant: variant as VariantAttributes & { _id: Types.ObjectId },
			quantity: line.quantity,
			appliedOfferId: line.appliedOfferId,
			appliedOfferLockedAt: line.appliedOfferLockedAt,
		});
	}
	return { items: resolvedItems };
}

/**
 * Idempotent replay: if this key already produced an order, return that order
 * instead of placing a new one. For a still-unpaid card order we re-open its
 * online checkout session so a retried submit lands back on the payment page.
 * Returns null when no prior order exists (caller proceeds to place a new one).
 */
async function findIdempotentReplay(idempotencyKey: string, customerId: Types.ObjectId): Promise<Response | null> {
	const priorOrder = await OrderModel.findOne({ idempotencyKey, customerId }).lean<{
		_id: Types.ObjectId;
		orderNumber: string;
		payment: PaymentMethod;
		status: OrderStatus;
		totals: { totalRupees: number };
		pointsEarned: number;
		pointsRedeemed: number;
	}>();
	if (!priorOrder) {
		return null;
	}
	const base = {
		id: priorOrder._id.toString(),
		orderNumber: priorOrder.orderNumber,
		totalRupees: priorOrder.totals.totalRupees,
		pointsEarned: priorOrder.pointsEarned,
		pointsRedeemed: priorOrder.pointsRedeemed,
	};
	if (priorOrder.payment !== "card" || priorOrder.status !== "pending-payment") {
		return created(base);
	}
	const orderDoc = await OrderModel.findById(priorOrder._id);
	if (!orderDoc) {
		return created(base);
	}
	try {
		const [integration, storeSettings] = await Promise.all([getIntegrationSettings(), getStoreSettings()]);
		const checkout = await startOrderOnlineCheckout({
			order: orderDoc,
			integration,
			storeName: storeSettings.siteName,
			publicSiteUrl: storeSettings.publicSiteUrl,
		});
		return created({ ...base, ...toOnlineCheckoutApiResponse(checkout) });
	} catch (error) {
		logger.warn({ error, orderNumber: priorOrder.orderNumber }, "Idempotent replay: re-opening online checkout failed; returning order without a checkout session");
		return created(base);
	}
}

export async function POST(request: Request) {
	const csrf = enforceSameOrigin(request);
	if (csrf) {
		return csrf;
	}

	// Guests may check out; a signed-in member also unlocks the member discount.
	const actor = await getVerifiedCustomer();

	const parsed = await parseBody<OrderBody>(request);
	if (parsed instanceof Response) {
		return parsed;
	}
	const body = parsed;

	const guestPhoneRaw = !actor && typeof body.customer?.phoneNumber === "string" ? body.customer.phoneNumber : "";
	const limited = enforcePublicRateLimit(request, {
		scope: "storefront-order",
		identifier: actor?.phoneNumber ?? actor?.id ?? phoneFingerprint(guestPhoneRaw) ?? undefined,
		max: MAX_ORDERS_PER_WINDOW,
		windowMs: SHORT_BURST_WINDOW_MS,
	});
	if (limited) {
		return limited;
	}

	if (!isDeliveryMethod(body.delivery)) {
		return badRequest(`delivery must be one of: ${ALLOWED_DELIVERY.join(", ")}.`);
	}
	const delivery = body.delivery;
	if (!isPaymentMethod(body.payment)) {
		return badRequest(`payment must be one of: ${ALLOWED_PAYMENT.join(", ")}.`);
	}
	const payment = body.payment;

	if (payment === "card") {
		const integration = await getIntegrationSettings();
		if (!isOnlineCardCheckoutReady(integration)) {
			return badRequest("Online payment is not available right now. Choose bank transfer or cash on delivery.");
		}
	}

	const items = body.items;

	// Items: at least one, at most MAX_LINES_PER_ORDER.
	if (!Array.isArray(items) || items.length === 0) {
		return badRequest("Cart cannot be empty.");
	}
	if (items.length > MAX_LINES_PER_ORDER) {
		return badRequest(`Cart cannot contain more than ${MAX_LINES_PER_ORDER} lines.`);
	}

	const idempotencyKey =
		typeof body.idempotencyKey === "string" && body.idempotencyKey.trim().length > 0 ? body.idempotencyKey.trim().slice(0, MAX_IDEMPOTENCY_KEY_CHARS) : undefined;

	if (!idempotencyKey) {
		return badRequest("Missing idempotency key. Refresh checkout and try again.");
	}

	await connectDB();

	// Resolve who this order belongs to. A signed-in customer keeps their record
	// (a member also unlocks the member discount); a guest is matched/created by
	// their phone number so the order still threads onto a real Customer.
	const existingCustomer = actor ? await Customer.findById(actor.id).lean<OrderCustomer>() : await resolveGuestCustomer(body.customer);
	if (!existingCustomer) {
		return actor ? unauthorized() : badRequest("Enter your name and a valid phone number to place a guest order.");
	}
	if ("error" in existingCustomer) {
		return badRequest(existingCustomer.error);
	}
	const customerObjectId = existingCustomer._id;
	// Only an authenticated member earns the discount — never a guest whose typed
	// phone happens to match a member record.
	const isMember = Boolean(actor) && existingCustomer.isMember === true;
	const allowLoyalty = Boolean(actor);

	// Idempotency: a retried submission (double-click, flaky network, second
	// tab) reuses its key — return the original order instead of placing a new
	// one. The unique index closes the simultaneous-request race at create time.
	const replay = await findIdempotentReplay(idempotencyKey, customerObjectId);
	if (replay) {
		return replay;
	}

	const customerNameInput = typeof body.customer?.name === "string" && body.customer.name.trim().length > 0 ? body.customer.name : existingCustomer.name;
	const nameResult = validateString(customerNameInput, {
		label: "Name",
		min: MIN_NAME_CHARS,
		max: FIELD_LIMITS.personName,
	});
	if (isValidationError(nameResult)) {
		return badRequest(nameResult.error);
	}

	const phoneResult = validateString(existingCustomer.phoneNumber, {
		label: "Phone",
		min: MIN_PHONE_CHARS,
		max: FIELD_LIMITS.phoneNumber,
	});
	if (isValidationError(phoneResult)) {
		return badRequest(phoneResult.error);
	}

	const cityResult = resolveCustomerCity(existingCustomer.city);

	// Address required for courier deliveries — we never ship without one.
	let addressInput: ResolvedAddress | undefined;
	if (delivery === "courier") {
		addressInput = parseAddress(body.address, {
			fallbackName: nameResult,
			fallbackPhone: phoneResult,
			fallbackCity: cityResult,
		});
		if ("error" in addressInput) {
			return badRequest(addressInput.error);
		}
	}

	// Validate + merge cart lines (dedupes product+variant to prevent oversell),
	// then resolve every product in one `find($in)` round-trip.
	const merged = parseAndMergeLines(items);
	if ("error" in merged) {
		return badRequest(merged.error);
	}
	const { lines: validatedLines, productIds } = merged;
	const productFilter: Record<string, unknown> = {
		_id: { $in: productIds },
		isActive: true,
		isArchived: { $ne: true },
	};
	applyCatalogVisibility(productFilter, await resolveCatalogVisibility());
	const products = await ProductModel.find(productFilter).lean<(ProductAttributes & { _id: Types.ObjectId })[]>();
	const productMap = new Map(products.map((doc) => [doc._id.toString(), doc]));

	const resolved = resolveOrderItems(validatedLines, productMap);
	if ("conflict" in resolved) {
		return conflict(resolved.conflict);
	}
	const resolvedItems = resolved.items;

	// Totals — server-authoritative. Discount % and free-delivery threshold are
	// resolved from `StoreSettings` so the admin can change them without a deploy.
	const settings = await getStoreSettings();
	const checkoutPaymentId = orderPaymentToCheckoutId(payment);
	if (!checkoutPaymentId || !getPaymentMethods(settings).some((method) => method.id === checkoutPaymentId)) {
		return badRequest("This payment method is not available right now.");
	}
	const subtotalRupees = resolvedItems.reduce((sum, line) => sum + line.variant.priceRupees * line.quantity, 0);

	// Promotional offers — server-authoritative. The client computes the same
	// numbers for display, but the discount that actually bills the customer is
	// re-evaluated here from live offer documents so a tampered cart can't claim
	// a discount that doesn't apply. Schedule/usage-limit gating happens inside
	// `evaluateOffers`.
	const evaluatableItems: EvaluatableItem[] = resolvedItems.map((line) => ({
		id: `${line.productDoc._id.toString()}:${line.variant._id.toString()}`,
		productId: line.productDoc._id.toString(),
		variantId: line.variant._id.toString(),
		categorySlug: line.productDoc.categorySlug,
		brandSlug: line.productDoc.brandSlug,
		price: line.variant.priceRupees,
		quantity: line.quantity,
		attributes: line.variant.attributes ?? {},
	}));
	const lineOfferIds = Object.fromEntries(resolvedItems.filter((line) => line.appliedOfferId).map((line) => [`${line.productDoc._id.toString()}:${line.variant._id.toString()}`, line.appliedOfferId]));

	const lockedOfferIds = Array.from(new Set(resolvedItems.map((line) => line.appliedOfferId).filter((offerId): offerId is string => Boolean(offerId))));
	const lockedOfferDocs =
		lockedOfferIds.length > 0
			? await OfferModel.find({ _id: { $in: lockedOfferIds }, isActive: true }).lean<(OfferAttributes & { _id: Types.ObjectId })[]>()
			: [];
	if (lockedOfferIds.length !== lockedOfferDocs.length) {
		return badRequest("One or more applied offers are invalid.");
	}
	const lockedCatalogOffers = lockedOfferDocs.map(toActiveOffer).filter((offer) => isOfferEligible(offer));
	const lockedOfferById = new Map(lockedCatalogOffers.map((offer) => [offer.id, offer]));

	for (const line of resolvedItems) {
		if (!line.appliedOfferId) {
			continue;
		}
		const item = evaluatableItems.find((entry) => entry.id === `${line.productDoc._id.toString()}:${line.variant._id.toString()}`);
		if (!item) {
			return badRequest("Could not validate applied offer for a cart line.");
		}
		const offer = lockedOfferById.get(line.appliedOfferId);
		const validationError = validateSubmittedCatalogOfferLock(line.appliedOfferId, item, offer, {
			cartTotal: item.price * item.quantity,
		});
		if (validationError) {
			return badRequest(validationError);
		}
		line.appliedOfferTitle = offer?.title;
	}

	const offerDocs = await OfferModel.find({ isActive: true }).sort({ sortOrder: 1, createdAt: -1 }).lean<(OfferAttributes & { _id: Types.ObjectId })[]>();
	const offerPricing = evaluateCartOffers(evaluatableItems, offerDocs.map(toActiveOffer), {
		paymentMethod: orderPaymentToCheckoutId(payment),
		lineOfferIds,
		lockedCatalogOffers,
	});
	const offerDiscountRupees = Math.round(offerPricing.totalDiscount);
	if (offerDiscountRupees > subtotalRupees) {
		return badRequest("Invalid offer discount for this cart.");
	}

	for (const line of resolvedItems) {
		if (line.appliedOfferId && !offerPricing.appliedOfferIds.includes(line.appliedOfferId)) {
			return badRequest("One or more applied offers could not be honored on this order.");
		}
	}

	const subtotalAfterOffersRupees = subtotalRupees - offerDiscountRupees;
	// Member discount stacks after promotional offers, before shipping/fees.
	const memberDiscountRupees = computeMemberDiscountRupees({
		isMember,
		subtotalAfterOffersRupees,
		memberDiscountPercent: settings.memberDiscountPercent,
	});
	const subtotalAfterMemberRupees = subtotalAfterOffersRupees - memberDiscountRupees;
	const paymentSurchargeRupees =
		payment === "cod" ? computeCodSurchargeRupees(subtotalAfterMemberRupees, settings.codSurchargePercent) : 0;
	const discountRupees = offerDiscountRupees + memberDiscountRupees;
	const shippingRupees = computeCourierShippingRupees({
		isCourierDelivery: delivery === "courier",
		subtotalAfterOffersRupees: subtotalAfterMemberRupees,
		freeDeliveryThresholdRupees: settings.freeDeliveryThresholdRupees,
		courierFlatFeeRupees: settings.courierFlatFeeRupees,
		offerGrantsFreeShipping: offerPricing.freeShipping,
	});
	const requestedRedeemPoints = Number(body.loyalty?.redeemPoints ?? 0);
	if (!Number.isFinite(requestedRedeemPoints) || requestedRedeemPoints < 0) {
		return badRequest("Redeemed points must be a positive number.");
	}
	if (!allowLoyalty && requestedRedeemPoints > 0) {
		return badRequest("Sign in to redeem loyalty points.");
	}
	const loyaltyAccount = allowLoyalty && requestedRedeemPoints > 0 ? await LoyaltyAccount.findOne({ customerId: customerObjectId }) : null;
	if (requestedRedeemPoints > 0 && !loyaltyAccount) {
		return badRequest("No loyalty balance is available for this customer.");
	}
	const pointsRedeemed = requestedRedeemPoints ? Math.floor(requestedRedeemPoints) : 0;
	if (pointsRedeemed > 0 && pointsRedeemed < LOYALTY_MIN_REDEEM) {
		return badRequest(`Redeem at least ${LOYALTY_MIN_REDEEM} points or leave redemption off.`);
	}
	if (pointsRedeemed > 0 && !offerPricing.isLoyaltyPointsAllowed) {
		return badRequest("Loyalty points can't be combined with the current offers.");
	}
	const maxRedeemablePoints = loyaltyAccount ? maxRedeemable(subtotalAfterMemberRupees, loyaltyAccount.balance) : 0;
	if (pointsRedeemed > maxRedeemablePoints) {
		return badRequest(`You can redeem up to ${maxRedeemablePoints} points on this order.`);
	}
	const pointsRedeemedRupees = pointsToRupees(pointsRedeemed);
	const totalRupees = Math.max(0, subtotalAfterMemberRupees + shippingRupees + paymentSurchargeRupees - pointsRedeemedRupees);

	const nextAddresses = addressInput && "value" in addressInput ? mergeCheckoutAddress(existingCustomer.addresses ?? [], addressInput.value) : (existingCustomer.addresses ?? []);

	// Reserve stock up front — this is the oversell guard. `reserveStock` rolls
	// its own partial reservations back, so a failure leaves inventory untouched.
	const stockLines: StockLine[] = resolvedItems.map((line) => ({
		productId: line.productDoc._id,
		variantId: line.variant._id,
		quantity: line.quantity,
	}));

	let createdOrder: OrderDoc | null = null;
	let reservation: { ok: boolean } | null = null;
	let customerDoc: { _id: Types.ObjectId; isLoyaltyMember: boolean } | null = null;
	let offerUsageReserved = false;
	// Tracks whether loyalty points were actually debited. The catch block must
	// only restore points it removed — otherwise a failure before the debit (or a
	// duplicate-key loser) would credit points that were never spent.
	let loyaltyDebited = false;
	const reservedOfferIds = offerPricing.appliedOfferIds;
	try {
		customerDoc = await Customer.findByIdAndUpdate(
			existingCustomer._id,
			{
				name: nameResult,
				city: cityResult,
				isLoyaltyMember: true,
				...(addressInput && "value" in addressInput ? { addresses: nextAddresses } : {}),
			},
			{ new: true, runValidators: true },
		).lean<{ _id: Types.ObjectId; isLoyaltyMember: boolean }>();

		if (!customerDoc) {
			logger.error("Customer upsert returned null — cannot continue");
			return badRequest("Could not place order.");
		}

		// Earn on the payable order total (merchandise after offers + fees − redemption).
		const pointsEarned = pointsEarnedFor(totalRupees, settings.loyaltyEarnPercent);

		reservation = await reserveStock(stockLines);
		if (!reservation.ok) {
			return conflict("Some items just sold out. Please review your cart and try again.");
		}

		if (reservedOfferIds.length > 0) {
			const usageOk = await incrementOfferUsageCounts(reservedOfferIds);
			if (!usageOk) {
				await releaseStock(stockLines);
				return conflict("One or more offers are no longer available. Refresh your cart and try again.");
			}
			offerUsageReserved = true;
		}

		// COD is confirmed on placement — customer pays cash on delivery.
		// Bank transfer and card stay pending until admin confirms or gateway pays.
		const initialStatus: OrderStatus = payment === "cod" ? "confirmed" : "pending-payment";
		const placedAt = new Date();
		const placementNote =
			payment === "cod"
				? "Cash on delivery order placed."
				: payment === "bank-transfer"
					? "Order placed — transfer payment and send screenshot on WhatsApp."
					: "Order placed — complete online payment.";

		createdOrder = await createWithUniqueOrderNumber<OrderDoc>((orderNumber) =>
			OrderModel.create({
				orderNumber,
				customerId: customerDoc!._id,
				customerSnapshot: {
					name: nameResult,
					phoneNumber: phoneResult,
					city: cityResult,
				},
				status: initialStatus,
				items: resolvedItems.map((line) => ({
					productId: line.productDoc._id,
					variantId: line.variant._id,
					productName: line.productDoc.name,
					variantSummary: buildVariantSummary(line.variant),
					unitPriceRupees: line.variant.priceRupees,
					quantity: line.quantity,
					...(line.appliedOfferId
						? {
								appliedOfferId: line.appliedOfferId,
								appliedOfferTitle: line.appliedOfferTitle,
								appliedOfferLockedAt: line.appliedOfferLockedAt ?? new Date(),
							}
						: {}),
				})),
				delivery,
				payment,
				address: addressInput && "value" in addressInput ? addressInput.value : undefined,
				totals: {
					subtotalRupees,
					shippingRupees,
					discountRupees,
					paymentSurchargeRupees,
					totalRupees,
				},
				timeline: [
					payment === "cod"
						? {
								status: "confirmed",
								occurredAt: placedAt,
								note: placementNote,
							}
						: {
								status: "pending-payment",
								occurredAt: placedAt,
								note: placementNote,
							},
				],
				pointsEarned,
				pointsRedeemed,
				inventoryReserved: true,
				idempotencyKey,
				placedAt,
			}),
		);

		// Debit redeemed points atomically — the `balance >= pointsRedeemed` guard
		// prevents two concurrent checkouts from overspending the same balance.
		if (pointsRedeemed > 0) {
			const debited = await LoyaltyAccount.findOneAndUpdate(
				{ customerId: customerDoc!._id, balance: { $gte: pointsRedeemed } },
				{
					$inc: { balance: -pointsRedeemed },
					$push: {
						transactions: {
							kind: "redeem",
							amount: pointsRedeemed,
							occurredAt: new Date(),
							reason: "Redeemed during storefront checkout.",
							orderRef: createdOrder.orderNumber,
						},
					},
				},
			);
			if (!debited) {
				await createdOrder.deleteOne();
				await releaseStock(stockLines);
				return conflict("Your loyalty balance changed. Please review your points and try again.");
			}
			loyaltyDebited = true;
		}

		const placedOrderNumber = createdOrder.orderNumber;
		void fireOrderEventNotifications({
			event: "placed",
			order: createdOrder,
			nextStatus: initialStatus,
		}).catch((error: unknown) => {
			logger.warn({ error, orderNumber: placedOrderNumber }, "Order notifications failed");
		});

		if (payment === "card") {
			const integration = await getIntegrationSettings();
			try {
				const checkout = await startOrderOnlineCheckout({
					order: createdOrder,
					integration,
					storeName: settings.siteName,
					publicSiteUrl: settings.publicSiteUrl,
				});
				return created({
					id: createdOrder._id.toString(),
					orderNumber: createdOrder.orderNumber,
					totalRupees,
					pointsEarned,
					pointsRedeemed,
					...toOnlineCheckoutApiResponse(checkout),
				});
			} catch (gatewayError) {
				logger.error({ error: gatewayError, orderNumber: createdOrder.orderNumber }, "Online checkout session failed");
				await createdOrder.deleteOne().catch((rollbackError) => logRollbackFailure("card-gateway:delete-order", rollbackError, createdOrder?.orderNumber));
				if (pointsRedeemed > 0) {
					await LoyaltyAccount.findOneAndUpdate(
						{ customerId: customerDoc!._id },
						{
							$inc: { balance: pointsRedeemed },
							$push: {
								transactions: {
									kind: "adjust",
									amount: pointsRedeemed,
									occurredAt: new Date(),
									reason: "Checkout payment setup failed — points restored.",
									orderRef: createdOrder.orderNumber,
								},
							},
						},
					).catch((rollbackError) => logRollbackFailure("card-gateway:restore-points", rollbackError, createdOrder?.orderNumber));
				}
				await releaseStock(stockLines);
				if (offerUsageReserved) {
					await decrementOfferUsageCounts(reservedOfferIds).catch((rollbackError) => logRollbackFailure("card-gateway:decrement-offers", rollbackError, createdOrder?.orderNumber));
				}
				return serverError("Could not start card payment. Please try again or choose bank transfer or cash on delivery.");
			}
		}

		return created({
			id: createdOrder._id.toString(),
			orderNumber: createdOrder.orderNumber,
			totalRupees,
			pointsEarned,
			pointsRedeemed,
		});
	} catch (error) {
		// Unwind everything this attempt did so a failure never leaves stock held
		// or a half-created order behind.
		if (createdOrder) {
			await createdOrder.deleteOne().catch((rollbackError) => logRollbackFailure("delete-order", rollbackError, createdOrder?.orderNumber));
		}
		if (reservation?.ok) {
			await releaseStock(stockLines);
		}
		if (offerUsageReserved) {
			await decrementOfferUsageCounts(reservedOfferIds).catch((rollbackError) => logRollbackFailure("decrement-offers", rollbackError, createdOrder?.orderNumber));
		}
		if (loyaltyDebited && customerDoc) {
			await LoyaltyAccount.findOneAndUpdate(
				{ customerId: customerDoc._id },
				{
					$inc: { balance: pointsRedeemed },
					$push: {
						transactions: {
							kind: "adjust",
							amount: pointsRedeemed,
							occurredAt: new Date(),
							reason: "Order placement failed — points restored.",
							orderRef: createdOrder?.orderNumber,
						},
					},
				},
			).catch((rollbackError) => logRollbackFailure("restore-points", rollbackError, createdOrder?.orderNumber));
		}

		// A duplicate idempotency key means a parallel submission won the race —
		// return that order instead of surfacing an error.
		if (isMongoDuplicateKeyError(error) && idempotencyKey) {
			const winner = await OrderModel.findOne({
				idempotencyKey,
				customerId: customerDoc?._id ?? existingCustomer._id,
			}).lean<{ _id: Types.ObjectId; orderNumber: string; totals: { totalRupees: number }; pointsEarned: number; pointsRedeemed: number }>();
			if (winner) {
				return created({
					id: winner._id.toString(),
					orderNumber: winner.orderNumber,
					totalRupees: winner.totals.totalRupees,
					pointsEarned: winner.pointsEarned,
					pointsRedeemed: winner.pointsRedeemed,
				});
			}
		}

		logger.error({ error }, "Failed to create storefront order");
		return serverError("Could not place order. Please try again.");
	}
}

interface ResolvedAddressOk {
	value: {
		recipientName: string;
		phoneNumber: string;
		city: string;
		area?: string;
		street?: string;
		postalCode?: string;
	};
}
interface ResolvedAddressError {
	error: string;
}
type ResolvedAddress = ResolvedAddressOk | ResolvedAddressError;

interface AddressFallbacks {
	fallbackName: string;
	fallbackPhone: string;
	fallbackCity: string;
}

function parseAddress(input: AddressBody | undefined, fallbacks: AddressFallbacks): ResolvedAddress {
	if (!input) {
		return { error: "Delivery address is required for courier orders." };
	}
	const recipient = validateString(input.recipientName || fallbacks.fallbackName, {
		label: "Recipient name",
		min: 2,
		max: FIELD_LIMITS.recipientName,
	});
	if (isValidationError(recipient)) {
		return { error: recipient.error };
	}

	let area: string | undefined;
	if (typeof input.area === "string" && input.area.trim().length > 0) {
		const result = validateString(input.area, {
			label: "Area",
			max: FIELD_LIMITS.addressArea,
			required: false,
		});
		if (isValidationError(result)) {
			return { error: result.error };
		}
		area = result;
	}
	let street: string | undefined;
	if (typeof input.street === "string" && input.street.trim().length > 0) {
		const result = validateString(input.street, {
			label: "Street",
			max: FIELD_LIMITS.addressStreet,
			required: false,
		});
		if (isValidationError(result)) {
			return { error: result.error };
		}
		street = result;
	}
	let postalCode: string | undefined;
	if (typeof input.postalCode === "string" && input.postalCode.trim().length > 0) {
		const result = validateString(input.postalCode, {
			label: "Postal code",
			max: FIELD_LIMITS.postalCode,
			required: false,
		});
		if (isValidationError(result)) {
			return { error: result.error };
		}
		postalCode = result;
	}

	if (!street || street.length < 2) {
		return { error: "Street address is required for courier delivery (at least 2 characters)." };
	}

	return {
		value: {
			recipientName: recipient,
			phoneNumber: fallbacks.fallbackPhone,
			city: fallbacks.fallbackCity,
			area,
			street,
			postalCode,
		},
	};
}

function resolveCustomerCity(city: string | undefined): string {
	const trimmed = city?.trim();
	if (!trimmed || trimmed === "—") {
		return DEFAULT_CUSTOMER_CITY;
	}
	return trimmed.slice(0, FIELD_LIMITS.city);
}

function mergeCheckoutAddress(addresses: CustomerAddressAttributes[], checkoutAddress: ResolvedAddressOk["value"]): CustomerAddressAttributes[] {
	const nextAddress: CustomerAddressAttributes = {
		...checkoutAddress,
		label: "Checkout",
		isDefault: true,
	};
	if (addresses.length === 0) {
		return [nextAddress];
	}
	const defaultIndex = addresses.findIndex((address) => address.isDefault);
	const replaceIndex = defaultIndex >= 0 ? defaultIndex : 0;
	return addresses.map((address, index) =>
		index === replaceIndex
			? nextAddress
			: {
					...address,
					isDefault: false,
				},
	);
}

/**
 * Build a human-readable variant summary for the order item — admins read
 * this in the admin order list, customers see it on their receipt.
 * Variant differentiators come from the admin-defined `attributes` map.
 */

function buildVariantSummary(variant: VariantAttributes): string {
	const parts: string[] = [];
	const attributes = variant.attributes ?? {};
	for (const value of Object.values(attributes)) {
		if (typeof value === "string" && value.trim().length > 0) {
			parts.push(value);
		} else if (Array.isArray(value)) {
			for (const entry of value) {
				if (typeof entry === "string" && entry.trim().length > 0) {
					parts.push(entry);
				}
			}
		}
	}
	const display = variant.attributeDisplay ?? {};
	for (const label of Object.values(display)) {
		if (typeof label === "string" && label.trim().length > 0 && !parts.includes(label)) {
			parts.push(label);
		}
	}
	return parts.join(" · ").slice(0, FIELD_LIMITS.shortText);
}

