"use client";

/**
 * Production PDP — same Vertical Runway grammar as `/concepts/pdp/vertical-runway`,
 * wired to live catalog, URL attributes, offers, and cart.
 */

import { useMemo, useState } from "react";
import { formatPrice, isVariantInStock, type Product, type SizeChart } from "@store/shared";

import { SizeAndFit } from "./SizeAndFit";
import { PdpStudyLookStage } from "@/app/concepts/pdp/PdpStudyLookStage";
import {
	PdpStudyBreadcrumbs,
	PdpStudyBuyBar,
	PdpStudyCommerce,
	PdpStudyMoreFrom,
	PdpStudyProductTitle,
} from "@/app/concepts/pdp/PdpStudyShared";
import type { PdpStudyLook } from "@/app/concepts/pdp/pdpStudySample";
import styles from "@/app/concepts/pdp/pdpStudy.module.css";
import { useToast } from "@/components/ui/Toast";
import { useVariantSelection } from "@/components/shared/VariantContext";
import { buildDimensions } from "@/components/shared/variantSelectorDimensions";
import { findVariantBySelection, getRequiredAttributeSlugsForProduct, isPdpSelectionComplete } from "@/lib/catalog/pdpSelection";
import { categoryHref, productHref } from "@/lib/catalog/productPaths";
import { useProductAttributeScope } from "@/lib/catalog/productAttributeScope";
import { CART_MAX_LINES } from "@/lib/cart/store";
import { useCart } from "@/lib/cart/useCart";
import { buildEvaluatableItemWithQuantity, resolveOfferMinQuantity, resolvePdpOfferUnitPrice } from "@/lib/pricing/cartOfferPricing";
import { resolveVariantCatalogDealOffers } from "@/lib/pricing/productOfferMatch";
import { useActiveOffers } from "@/lib/pricing/useActiveOffers";

const ADD_TO_CART_FLASH_MS = 1_500;
const PDP_DELIVERY_NOTE = "In-store pickup or doorstep delivery · Cash on delivery available";

interface VerticalRunwayProductPdpProps {
	product: Product;
	brandName: string;
	categorySlug: string;
	categoryLabel: string;
	brandFilterHref: string;
	related: Product[];
	/** Effective size chart resolved server-side (product → brand → category). */
	sizeChart: SizeChart | null;
}

function buildLooks(product: Product): PdpStudyLook[] {
	return (product.images ?? []).map((image, imageIndex) => ({
		id: `look-${imageIndex}`,
		label: `Look ${String(imageIndex + 1).padStart(2, "0")}`,
		src: image.variants.detail,
		alt: image.alt || product.name,
	}));
}

export function VerticalRunwayProductPdp({
	product,
	brandName,
	categorySlug,
	categoryLabel,
	brandFilterHref,
	related,
	sizeChart,
}: VerticalRunwayProductPdpProps) {
	const looks = useMemo(() => buildLooks(product), [product]);
	const { selectedVariantId, currentSelection, pick } = useVariantSelection();
	const cart = useCart();
	const { toast } = useToast();
	const [hasJustBeenAdded, setHasJustBeenAdded] = useState(false);
	const { config: productAttributeConfig, attributes: categoryAttributes } = useProductAttributeScope(product);
	const attributeSlugs = useMemo(() => categoryAttributes.map((row) => row.slug), [categoryAttributes]);
	const requiredAttributeSlugs = useMemo(() => getRequiredAttributeSlugsForProduct(product, attributeSlugs), [product, attributeSlugs]);
	const dimensions = useMemo(() => buildDimensions(product, categoryAttributes, productAttributeConfig), [product, categoryAttributes, productAttributeConfig]);

	const selected = useMemo(() => {
		if (isPdpSelectionComplete(currentSelection, requiredAttributeSlugs)) {
			return findVariantBySelection(product.variants, currentSelection) ?? null;
		}
		if (!selectedVariantId) {
			return null;
		}
		return product.variants.find((variant) => variant.id === selectedVariantId) ?? null;
	}, [currentSelection, product.variants, requiredAttributeSlugs, selectedVariantId]);

	const inStock = selected ? isVariantInStock(selected) : false;
	const stockQuantity = Math.max(0, selected?.quantity ?? 0);
	const quantityInCart = selected?.id ? (cart.items.find((line) => line.id === `${product.id}:${selected.id}`)?.quantity ?? 0) : 0;
	const remainingStock = Math.max(0, stockQuantity - quantityInCart);

	const { offers } = useActiveOffers();
	const variantOffers = useMemo(() => {
		if (!selected) {
			return [];
		}
		return resolveVariantCatalogDealOffers(product, selected, offers);
	}, [offers, product, selected]);
	const selectedOffer = variantOffers[0] ?? null;

	const offerMinQuantity = useMemo(() => {
		if (!selectedOffer || !inStock) {
			return 1;
		}
		const requiredQuantity = resolveOfferMinQuantity(selectedOffer);
		if (requiredQuantity <= 1 || remainingStock < requiredQuantity) {
			return 1;
		}
		return requiredQuantity;
	}, [selectedOffer, inStock, remainingStock]);

	const orderQuantity = remainingStock > 0 ? Math.min(Math.max(1, offerMinQuantity), remainingStock) : Math.max(1, offerMinQuantity);
	const listUnitPriceRupees = selected?.priceRupees ?? product.variants[0]?.priceRupees ?? 0;
	const pricedItem = useMemo(() => {
		if (!selected) {
			return null;
		}
		return buildEvaluatableItemWithQuantity(product, selected, orderQuantity);
	}, [orderQuantity, product, selected]);
	const { unitPriceRupees: saleUnitPriceRupees } = useMemo(() => {
		if (!pricedItem) {
			return { unitPriceRupees: listUnitPriceRupees };
		}
		return resolvePdpOfferUnitPrice(listUnitPriceRupees, pricedItem, selectedOffer);
	}, [listUnitPriceRupees, pricedItem, selectedOffer]);

	const heroImage = product.images?.[0];
	const canAdd = Boolean(selected?.id && heroImage && inStock && remainingStock > 0);

	const buyDimensions = useMemo(
		() =>
			dimensions
				.map((dimension) => {
					const isLocked = dimension.options.length === 1;
					return {
						key: dimension.key,
						label: dimension.label,
						value: isLocked ? dimension.options[0]?.key ?? "" : currentSelection[dimension.key] ?? "",
						disabled: isLocked,
						options: dimension.options.map((option) => ({ key: option.key, label: option.label })),
						onChange: (value: string) => pick(dimension.key, value),
					};
				})
				// Single-choice (locked) attributes sit left of the selectable ones.
				.sort((left, right) => Number(right.disabled) - Number(left.disabled)),
		[currentSelection, dimensions, pick],
	);

	const garmentType = useMemo<"stitched" | "unstitched">(() => {
		const rawType = selected?.attributes?.type ?? product.variants[0]?.attributes?.type;
		const typeValue = (Array.isArray(rawType) ? rawType[0] : rawType) ?? "";
		return typeValue.toLowerCase() === "unstitched" ? "unstitched" : "stitched";
	}, [product.variants, selected]);

	const selectedVariantSize = Array.isArray(selected?.attributes?.size) ? selected?.attributes?.size[0] : selected?.attributes?.size;
	const selectedSizeValue = currentSelection.size ?? selectedVariantSize ?? null;

	const dimensionLabel = (key: string): string | undefined => {
		const dimension = dimensions.find((entry) => entry.key === key);
		if (!dimension) {
			return undefined;
		}
		const value = currentSelection[key] ?? dimension.options[0]?.key;
		return dimension.options.find((option) => option.key === value)?.label ?? value;
	};

	// Stitched needs a resolved chart to be useful; unstitched always offers tailoring guidance.
	const showSizeAndFit = garmentType === "unstitched" || Boolean(sizeChart);
	const sizeAndFit = showSizeAndFit ? (
		<SizeAndFit
			garmentType={garmentType}
			chart={sizeChart}
			selectedSizeValue={selectedSizeValue}
			onSelectSize={(sizeValue) => pick("size", sizeValue)}
			fabricLabel={dimensionLabel("fabric")}
			piecesLabel={dimensionLabel("pieces")}
		/>
	) : null;

	const relatedItems = useMemo(
		() =>
			related.map((relatedProduct) => ({
				id: relatedProduct.id,
				name: relatedProduct.name,
				href: productHref(relatedProduct),
				src: relatedProduct.images[0]?.variants.card ?? "",
				alt: relatedProduct.images[0]?.alt || relatedProduct.name,
				priceRupees: relatedProduct.variants[0]?.priceRupees ?? 0,
			})).filter((item) => item.src.length > 0),
		[related],
	);

	const handleAddToCart = () => {
		if (!selected?.id || !heroImage || !inStock || remainingStock <= 0) {
			return;
		}
		const added = cart.addItem({
			productId: product.id,
			variantId: selected.id,
			productName: product.name,
			brandSlug: product.brandSlug,
			brandName,
			image: heroImage,
			unitPriceRupees: selected.priceRupees,
			categorySlug: product.categorySlug,
			productSlug: product.slug,
			attributes: selected.attributes ?? {},
			quantity: orderQuantity,
			maxQuantity: stockQuantity,
			...(selectedOffer
				? {
						appliedOffer: {
							id: selectedOffer.id,
							title: selectedOffer.title,
							lockedAt: new Date().toISOString(),
						},
					}
				: {}),
		});
		if (!added) {
			toast(`Cart is full — you can hold up to ${CART_MAX_LINES} different items.`, { tone: "info" });
			return;
		}
		setHasJustBeenAdded(true);
		window.setTimeout(() => setHasJustBeenAdded(false), ADD_TO_CART_FLASH_MS);
		toast(`${product.name} added to cart`);
	};

	return (
		<div className={styles.study}>
			<PdpStudyBreadcrumbs
				crumbs={[
					{ label: "Home", href: "/" },
					{ label: categoryLabel, href: categoryHref(categorySlug) },
				]}
				current={product.name}
			/>
			<PdpStudyProductTitle name={product.name} />
			{looks.length > 0 ? <PdpStudyLookStage looks={looks} /> : null}
			{product.descriptionHtml ? <PdpStudyCommerce eyebrow="The details" descriptionHtml={product.descriptionHtml} /> : null}
			{garmentType === "unstitched" && sizeAndFit ? <div className={styles.studyShellPad}>{sizeAndFit}</div> : null}
			{relatedItems.length > 0 ? (
				<PdpStudyMoreFrom brandName={brandName} brandHref={brandFilterHref} items={relatedItems} emptyMessage="" />
			) : null}
			<PdpStudyBuyBar
				dimensions={buyDimensions}
				priceRupees={saleUnitPriceRupees}
				originalPriceRupees={saleUnitPriceRupees < listUnitPriceRupees ? listUnitPriceRupees : undefined}
				offerLabel={selectedOffer?.title}
				onAddToBag={handleAddToCart}
				addDisabled={!canAdd}
				addLabel={hasJustBeenAdded ? "Added" : "Add to bag"}
				sizeGuideTrigger={sizeAndFit}
				productName={product.name}
				thumbnailSrc={heroImage?.variants.card}
				thumbnailAlt={heroImage?.alt || product.name}
				stockNote={selected && inStock && remainingStock > 0 && remainingStock <= 5 ? `Only ${remainingStock} left` : undefined}
				deliveryNote={PDP_DELIVERY_NOTE}
			/>
		</div>
	);
}
