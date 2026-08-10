import { hasNonIndexableListingFilters, parseIndexableIntentSurface } from "@store/shared";

import type { ProductFilters } from "@/lib/core";

/** Filter listing pages with active non-whitelisted params should not be indexed. */
export function shouldNoindexFilteredCategoryPage(
	rawSearchParams: Record<string, string | string[] | undefined>,
	categorySlug: string,
	filters: ProductFilters,
): boolean {
	const hasFilters = Object.keys(rawSearchParams).some((key) => rawSearchParams[key] !== undefined);
	if (!hasFilters) {
		return false;
	}

	const intentKey = parseIndexableIntentSurface(rawSearchParams, categorySlug);
	if (intentKey && !hasNonIndexableListingFilters(filters)) {
		return false;
	}

	return true;
}

/** Async wrapper kept for call sites that already await robots policy. */
export async function shouldNoindexFilteredCategoryPageAsync(
	rawSearchParams: Record<string, string | string[] | undefined>,
	categorySlug: string,
	filters: ProductFilters,
): Promise<boolean> {
	return shouldNoindexFilteredCategoryPage(rawSearchParams, categorySlug, filters);
}
