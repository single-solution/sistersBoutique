/**
 * Intent surface rules for category × brand filter landings (`?brand=`).
 */

import { truncateSerpDescription, truncateSerpTitle } from "./productSeoFacts";

export interface IntentSurfaceKey {
	categorySlug: string;
	brandSlug: string;
}

export interface IntentSurfaceComboStats {
	categorySlug: string;
	brandSlug: string;
	productCount: number;
	inStockVariantCount: number;
	minPriceRupees?: number;
	maxPriceRupees?: number;
}

export interface IntentSurfaceListingFilters {
	categorySlug?: string;
	brandSlugs?: string[];
	attributes?: Record<string, string[]>;
	minPriceRupees?: number;
	maxPriceRupees?: number;
	search?: string;
	inStockOnly?: boolean;
	page?: number;
	sort?: string;
}

export const INTENT_SURFACE_ELIGIBILITY = {
	minInStockVariants: 3,
	minProducts: 2,
} as const;

const INDEXABLE_QUERY_KEYS = new Set(["brand"]);

export function buildIntentSurfaceKey(key: IntentSurfaceKey): string {
	return `${key.categorySlug}:${key.brandSlug}`;
}

/** Canonical query string for a brand landing. */
export function buildIntentSurfaceCanonicalQuery(brandSlug: string): string {
	const params = new URLSearchParams();
	params.set("brand", brandSlug);
	return `?${params.toString()}`;
}

export function buildIntentSurfacePath(categorySlug: string, brandSlug: string): string {
	return `/${categorySlug}${buildIntentSurfaceCanonicalQuery(brandSlug)}`;
}

function readMultiValues(source: Record<string, string | string[] | undefined>, key: string): string[] {
	const raw = source[key];
	if (!raw) {
		return [];
	}
	const values = Array.isArray(raw) ? raw : [raw];
	const collected: string[] = [];
	for (const entry of values) {
		for (const part of entry.split(",")) {
			const trimmed = part.trim();
			if (trimmed) {
				collected.push(trimmed);
			}
		}
	}
	return collected;
}

/** True when URL params are exactly one brand (no other filters). */
export function parseBrandOnlyFilter(
	rawSearchParams: Record<string, string | string[] | undefined>,
	categorySlug: string,
): { categorySlug: string; brandSlug: string } | null {
	for (const [key, value] of Object.entries(rawSearchParams)) {
		if (value === undefined) {
			continue;
		}
		if (key !== "brand") {
			return null;
		}
	}

	const brandSlugs = readMultiValues(rawSearchParams, "brand");
	if (brandSlugs.length !== 1) {
		return null;
	}

	return { categorySlug, brandSlug: brandSlugs[0]! };
}

export interface IntentSurfaceStoredCopy {
	title: string;
	description: string;
	headline: string;
	intro: string;
	titleOverride?: string;
	descriptionOverride?: string;
	headlineOverride?: string;
	introOverride?: string;
}

/** Human override fields win over formula/AI base copy at read time. */
export function resolveEffectiveIntentSurfaceCopy(
	stored: IntentSurfaceStoredCopy,
): Pick<IntentSurfaceStoredCopy, "title" | "description" | "headline" | "intro"> {
	return {
		title: stored.titleOverride?.trim() || stored.title,
		description: stored.descriptionOverride?.trim() || stored.description,
		headline: stored.headlineOverride?.trim() || stored.headline,
		intro: stored.introOverride?.trim() || stored.intro,
	};
}

/** True when URL params are exactly one brand (no other filters). */
export function parseIndexableIntentSurface(
	rawSearchParams: Record<string, string | string[] | undefined>,
	categorySlug: string,
): IntentSurfaceKey | null {
	for (const [key, value] of Object.entries(rawSearchParams)) {
		if (value === undefined) {
			continue;
		}
		if (!INDEXABLE_QUERY_KEYS.has(key)) {
			return null;
		}
	}

	const brandSlugs = readMultiValues(rawSearchParams, "brand");
	if (brandSlugs.length !== 1) {
		return null;
	}

	return {
		categorySlug,
		brandSlug: brandSlugs[0]!,
	};
}

export function hasNonIndexableListingFilters(filters: IntentSurfaceListingFilters): boolean {
	if (filters.attributes && Object.keys(filters.attributes).length > 0) {
		return true;
	}
	if (typeof filters.minPriceRupees === "number" || typeof filters.maxPriceRupees === "number") {
		return true;
	}
	if (filters.search?.trim()) {
		return true;
	}
	if (filters.inStockOnly) {
		return true;
	}
	if (filters.page && filters.page > 1) {
		return true;
	}
	if (filters.sort && filters.sort !== "newest") {
		return true;
	}
	return false;
}

export function passesIntentSurfaceEligibility(
	stats: Pick<IntentSurfaceComboStats, "productCount" | "inStockVariantCount">,
	hasCopy: boolean,
): boolean {
	if (stats.inStockVariantCount < INTENT_SURFACE_ELIGIBILITY.minInStockVariants) {
		return false;
	}
	if (stats.productCount < INTENT_SURFACE_ELIGIBILITY.minProducts) {
		return false;
	}
	if (!hasCopy) {
		return false;
	}
	return true;
}

export function buildIntentSurfaceFormulaTitle(input: {
	brandName: string;
	categoryLabel: string;
	storeName: string;
}): string {
	const { brandName, categoryLabel, storeName } = input;
	return truncateSerpTitle(`${brandName} ${categoryLabel} | ${storeName}`);
}

export function buildIntentSurfaceFormulaHeadline(input: {
	brandName: string;
	categoryLabel: string;
}): string {
	return `${input.brandName} ${input.categoryLabel}`;
}

export function buildIntentSurfaceFormulaDescription(input: {
	brandName: string;
	categoryLabel: string;
	productCount: number;
	inStockVariantCount: number;
	minPriceRupees?: number;
	maxPriceRupees?: number;
	storeName: string;
}): string {
	const { brandName, categoryLabel, productCount, inStockVariantCount, minPriceRupees, maxPriceRupees, storeName } = input;
	const priceLead =
		typeof minPriceRupees === "number" && typeof maxPriceRupees === "number"
			? minPriceRupees === maxPriceRupees
				? `from Rs. ${minPriceRupees.toLocaleString("en-PK")}`
				: `from Rs. ${minPriceRupees.toLocaleString("en-PK")} to Rs. ${maxPriceRupees.toLocaleString("en-PK")}`
			: typeof minPriceRupees === "number"
				? `from Rs. ${minPriceRupees.toLocaleString("en-PK")}`
				: "";
	const countLead = `${productCount} ${productCount === 1 ? "design" : "designs"}, ${inStockVariantCount} in-stock configurations`;
	const priceSegment = priceLead ? `${priceLead}. ` : "";
	return truncateSerpDescription(
		`Shop ${brandName} ${categoryLabel.toLowerCase()}. ${priceSegment}${countLead} at ${storeName}.`,
	);
}

export function buildIntentSurfaceFormulaIntro(input: {
	brandName: string;
	categoryLabel: string;
	productCount: number;
	storeName: string;
}): string {
	return `Browse ${input.productCount} ${input.productCount === 1 ? "listing" : "listings"} of ${input.brandName} ${input.categoryLabel.toLowerCase()} at ${input.storeName}. Every piece has clear size and fabric details.`;
}
