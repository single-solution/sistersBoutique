import type { IntentSurfaceKey } from "@store/shared";
import { isVariantInStock } from "@store/shared";

import { regenerateIntentSurface } from "@/lib/seo/regenerateIntentSurface";

/** Refresh the brand intent surface after catalog drift. */
export async function syncIntentSurfacesForProduct(
	product: {
		categorySlug: string;
		brandSlug: string;
		variants: Array<{ quantity?: number; forceOutOfStock?: boolean }>;
	},
	categoryDescription?: string,
): Promise<void> {
	const hasStock = product.variants.some((variant) => isVariantInStock(variant));
	if (!hasStock) {
		return;
	}

	const key: IntentSurfaceKey = {
		categorySlug: product.categorySlug,
		brandSlug: product.brandSlug,
	};
	await regenerateIntentSurface(key, categoryDescription);
}
