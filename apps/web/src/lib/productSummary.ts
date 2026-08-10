/**
 * Pure helpers for default variant, in-stock flags, and display values from a storefront `Product`.
 */

import type { Product, StoredImage, Variant } from "@store/shared";
import { formatPrice, isVariantInStock } from "@store/shared";

/**
 * Sensible "starting" variant for any product. Picks the cheapest in-stock
 * variant; falls back to the overall cheapest when nothing is in stock.
 */
export function getDefaultVariant(product: Product): Variant {
	const variants = product.variants;
	if (variants.length === 0) {
		return {
			id: "",
			priceRupees: 0,
			quantity: 0,
			forceOutOfStock: false,
			warrantyDays: 0,
			attributes: {},
		};
	}
	const inStock = variants.filter(isVariantInStock);
	const pool = inStock.length > 0 ? inStock : variants;
	return [...pool].sort((left, right) => {
		const priceDelta = left.priceRupees - right.priceRupees;
		if (priceDelta !== 0) {
			return priceDelta;
		}
		return left.id.localeCompare(right.id);
	})[0];
}

export function isProductInStock(product: Product): boolean {
	return product.variants.some(isVariantInStock);
}

export interface ProductPriceRange {
	min: number;
	max: number;
}

/** Min/max variant prices on a product (in-stock not required). */
export function getProductPriceRange(product: Product): ProductPriceRange | null {
	const prices = product.variants.map((variant) => variant.priceRupees).filter((price) => price > 0);
	if (prices.length === 0) {
		return null;
	}
	return {
		min: Math.min(...prices),
		max: Math.max(...prices),
	};
}

/** Hero image for a product — first entry in the shared product gallery. */
export function resolveProductHeroImage(product: Product): StoredImage | undefined {
	return product.images?.[0];
}

/** Variant to link from shop cards. */
export function resolveListingVariant(product: Product): Variant {
	return getDefaultVariant(product);
}

export function formatProductPriceLead(product: Product): string {
	const range = getProductPriceRange(product);
	if (!range) {
		return "";
	}
	return formatPrice(range.min);
}

export function countInStockVariants(product: Product): number {
	return product.variants.filter(isVariantInStock).length;
}

function prettifyAttributeValue(value: string): string {
	return value
		.replace(/[-_]+/g, " ")
		.trim()
		.replace(/\b\w/g, (char) => char.toUpperCase());
}

/** Distinct variant attribute values across a product, prettified for listing chips. */
export function getListingAttributeChips(product: Product, limit = 4): string[] {
	const seen = new Set<string>();
	const chips: string[] = [];
	for (const variant of product.variants) {
		for (const raw of Object.values(variant.attributes)) {
			const values = Array.isArray(raw) ? raw : [raw];
			for (const value of values) {
				const label = prettifyAttributeValue(value);
				const dedupeKey = label.toLowerCase();
				if (!label || seen.has(dedupeKey)) {
					continue;
				}
				seen.add(dedupeKey);
				chips.push(label);
				if (chips.length >= limit) {
					return chips;
				}
			}
		}
	}
	return chips;
}
