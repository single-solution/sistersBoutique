/**
 * Product image limits.
 *
 * The persisted source of truth is `Product.images` — a flat ordered
 * gallery applied to every variant. The storefront look ribbon renders
 * every photo (even or odd counts); even counts park the opposite look
 * behind the hero so left/right stay balanced.
 */

/** Minimum photos when a gallery is required (product with variants). */
export const MIN_PRODUCT_IMAGES = 1;

/** Hard cap for upload / persist validation. */
export const MAX_PRODUCT_IMAGES = 20;

/**
 * Returns a clear operator-facing error when `count` is not a valid
 * product gallery size, otherwise `null`.
 */
export function productGalleryCountMessage(count: number): string | null {
	if (count < MIN_PRODUCT_IMAGES) {
		return `Add at least ${MIN_PRODUCT_IMAGES} product photo. You currently have ${count}.`;
	}
	if (count > MAX_PRODUCT_IMAGES) {
		return `Product cannot have more than ${MAX_PRODUCT_IMAGES} photos.`;
	}
	return null;
}
