/**
 * Wire types shared between admin API routes and admin client components.
 * When the Mongoose schema changes, update this file, serializers, and UI in lockstep.
 */
import type { AttributeVisibility, IconName, SeoMeta, StoredImage, StructuredContent } from "@store/shared";

export interface AdminBrand {
	id: string;
	slug: string;
	name: string;
	categorySlugs: string[];
	isActive: boolean;
	/** Default size chart inherited by this brand's products. */
	defaultSizeChartId?: string;
	seo?: SeoMeta;
	createdAt: string;
	updatedAt: string;
}

export interface AdminCategory {
	id: string;
	slug: string;
	label: string;
	description: string;
	icon: IconName;
	isActive: boolean;
	sortOrder: number;
	content: StructuredContent;
	/** Default size chart inherited by this category's products. */
	defaultSizeChartId?: string;
	seo?: SeoMeta;
	createdAt: string;
	updatedAt: string;
}


export interface AdminSizeChartMeasurementKey {
	key: string;
	label: string;
}

export interface AdminSizeChartRow {
	sizeValue: string;
	label: string;
	/** Measurement key -> inches (canonical). */
	values: Record<string, number>;
}

export interface AdminSizeChart {
	id: string;
	name: string;
	unitPrimary: "in" | "cm";
	measurementKeys: AdminSizeChartMeasurementKey[];
	rows: AdminSizeChartRow[];
	fitAdvice: string;
	notes: string;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
}

export type AdminAttributeCardPosition = "image-overlay" | "title-chips";

export interface AdminAttributeOption {
	/** Canonical slug (derived from label + attribute unit on save). */
	value: string;
	label: string;
}

export interface AdminAttribute {
	id: string;
	categorySlug: string;
	slug: string;
	label: string;
	/** Shared unit for all options (e.g. "gb"). */
	unit?: string;
	options: AdminAttributeOption[];
	visibility?: AttributeVisibility;
	cardPosition: AdminAttributeCardPosition;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
}

// ============================================================================
// Products
// ============================================================================

export interface AdminVariant {
	id: string;
	priceRupees: number;
	quantity: number;
	warrantyDays?: number;
	/** Storefront sold-out override — stock stays in `quantity`. */
	forceOutOfStock: boolean;
	/**
	 * Per-attribute chosen option value. Keys are `Attribute.slug` (per the
	 * product's category); values are option `value` strings.
	 */
	attributes: Record<string, string | string[]>;
	/** Labels for product-only custom attribute values. */
	attributeDisplay?: Record<string, string>;
}

export interface AdminProductSummary {
	id: string;
	slug: string;
	name: string;
	brand: { slug: string; name: string };
	categorySlug: string;
	isFeatured: boolean;
	isActive: boolean;
	isArchived: boolean;
	variantCount: number;
	inStockCount: number;
	totalStockQuantity: number;
	minPriceRupees?: number;
	maxPriceRupees?: number;
	/** First product image, or `null` when the gallery is empty. */
	heroImage: StoredImage | null;
	/** True when the product gallery has at least one image. */
	hasImages: boolean;
	seo?: SeoMeta;
	seoScore?: number;
	createdAt: string;
	updatedAt: string;
}

export interface AdminProduct extends AdminProductSummary {
	/** Ordered product gallery (shared across every variant). */
	images: StoredImage[];
	/** Optional product video URL (upload or external link). */
	video?: string;
	/** Optional rich HTML description shown on the PDP under the title. */
	descriptionHtml?: string;
	variants: AdminVariant[];
	/** Category attribute slugs this product uses. */
	attributeSlugs?: string[];
	attributeOptionPool?: Record<string, string[]>;
	attributeCustomOptions?: Record<string, Array<{ value: string; label: string }>>;
	attributeDefaults?: Record<string, string>;
	/** Explicit size-chart override id; absent = inherit from brand/category. */
	sizeChartId?: string;
	/** When true, suppress any inherited size guide on the PDP. */
	hideSizeGuide?: boolean;
	seo?: SeoMeta;
}

// ============================================================================
// Customers
// ============================================================================

export interface AdminCustomerAddress {
	id: string;
	label?: string;
	recipientName: string;
	phoneNumber: string;
	city: string;
	area?: string;
	street?: string;
	postalCode?: string;
	isDefault: boolean;
}

export interface AdminCustomerSummary {
	id: string;
	name: string;
	phoneNumber: string;
	city: string;
	isLoyaltyMember: boolean;
	loyaltyBalance: number;
	loyaltyLifetimeEarned: number;
	orderCount: number;
	lifetimeSpendRupees: number;
	lastOrderAt?: string;
	createdAt: string;
	updatedAt: string;
}

export interface AdminCustomer extends AdminCustomerSummary {
	notes?: string;
	addresses: AdminCustomerAddress[];
}

// ============================================================================
// Orders
// ============================================================================

interface AdminOrderLineItem {
	id: string;
	productId: string;
	variantId: string;
	productName: string;
	variantSummary: string;
	unitPriceRupees: number;
	quantity: number;
	isNewCustom?: boolean;
}

interface AdminOrderTimelineEntry {
	id: string;
	status: string;
	occurredAt: string;
	note?: string;
}

export interface AdminOrderSummary {
	id: string;
	orderNumber: string;
	customer: { id: string; name: string; phoneNumber: string; city: string };
	status: string;
	totalRupees: number;
	itemCount: number;
	payment: string;
	delivery: string;
	placedAt: string;
}

export interface AdminOrder extends AdminOrderSummary {
	items: AdminOrderLineItem[];
	totals: {
		subtotalRupees: number;
		shippingRupees: number;
		discountRupees: number;
		paymentSurchargeRupees?: number;
		totalRupees: number;
	};
	address?: {
		recipientName: string;
		phoneNumber: string;
		city: string;
		area?: string;
		street?: string;
		postalCode?: string;
	};
	timeline: AdminOrderTimelineEntry[];
	trackingNote?: string;
	dispatchVideoUrl?: string;
	estimatedDeliveryAt?: string;
	pointsEarned: number;
	pointsRedeemed: number;
	bankTransferDetails?: {
		bankName: string;
		bankAccountTitle: string;
		bankAccountNumber: string;
		bankIban: string;
	};
	createdAt: string;
	updatedAt: string;
}

export interface AdminOrderEditPayload {
	items: AdminOrderLineItem[];
	address: AdminOrder["address"] | null;
	payment: AdminOrder["payment"];
	delivery: AdminOrder["delivery"];
}

// ============================================================================
// Loyalty
// ============================================================================

interface AdminLoyaltyTransaction {
	id: string;
	kind: "earn" | "redeem" | "bonus" | "expire" | "adjust";
	amount: number;
	occurredAt: string;
	reason: string;
	orderRef?: string;
}

export interface AdminLoyaltyAccount {
	id: string;
	customerId: string;
	customerName: string;
	balance: number;
	lifetimeEarned: number;
	pendingFromShipping: number;
	transactions: AdminLoyaltyTransaction[];
	createdAt: string;
	updatedAt: string;
}

// ============================================================================
// Offers
// ============================================================================

import type { OfferCondition, OfferAction, OfferSchedule, OfferConstraints } from "@store/shared";

export interface AdminOffer {
	id: string;
	slug: string;
	title: string;
	description: string;
	discountLabel: string;
	badgeLabel: string;
	color: string;
	bannerImage: StoredImage | null;
	isActive: boolean;
	sortOrder: number;
	content: StructuredContent;
	seo?: SeoMeta;
	conditions: OfferCondition[];
	action: OfferAction;
	schedule: OfferSchedule;
	constraints: OfferConstraints;
	createdAt: string;
	updatedAt: string;
}

// ============================================================================
// Settings & store config
// ============================================================================

export interface AdminSetting {
	id: string;
	key: string;
	value: unknown;
	description?: string;
	group?: string;
	updatedById?: string;
	createdAt: string;
	updatedAt: string;
}

// ============================================================================
// Team & users
// ============================================================================

export type AdminUserRole = "owner" | "business_manager" | "product_manager" | "marketing_manager" | "support_staff";

export interface AdminUser {
	id: string;
	name: string;
	email: string;
	phoneNumber?: string;
	role: AdminUserRole;
	isSuperAdmin: boolean;
	isActive: boolean;
	lastSignInAt?: string;
	createdAt: string;
	updatedAt: string;
}

// ============================================================================
// Activity log
// ============================================================================

export type AdminActivityResourceType =
	| "product"
	| "brand"
	| "category"
	| "attribute"
	| "order"
	| "customer"
	| "loyalty"
	| "inquiry"
	| "offer"
	| "sizeChart"
	| "team"
	| "settings"
	| "auth";

export interface AdminActivityEntry {
	id: string;
	actorUserId?: string;
	actorName: string;
	actorRole: string;
	action: string;
	resourceType: AdminActivityResourceType;
	resourceId?: string;
	resourceLabel: string;
	detail?: string;
	createdAt: string;
	updatedAt: string;
}
