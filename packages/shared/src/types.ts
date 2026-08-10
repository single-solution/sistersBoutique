/**
 * Public storefront types. Categories, brands, and attributes are
 * admin-authored slug-keyed entities — resolve labels via reference collections.
 */

import type { SeoMeta } from "./seo/seoMeta";
import type { StoredImage } from "./storage/types";
import type { StructuredContent } from "./structuredContent";

// ============================================================================
// Brands
// ============================================================================

export interface Brand {
	slug: string;
	name: string;
	/** Number of in-stock products that reference this brand. */
	productCount: number;
	/** Optional admin SEO overrides (auto-filled when absent). */
	seo?: SeoMeta;
}

export interface AttributeOptionDescriptor {
	value: string;
	label: string;
}

export type AttributeCardPosition = "image-overlay" | "title-chips";

/** Legacy `none` maps to `title-chips` — hidden-on-cards placement was removed. */
export function normalizeAttributeCardPosition(value: string | undefined): AttributeCardPosition {
	return value === "image-overlay" ? "image-overlay" : "title-chips";
}

import type { AttributeVisibility } from "./attributeVisibility";

export type { AttributeVisibility, AttributeVisibilityType } from "./attributeVisibility";

export interface AttributeDescriptor {
	categorySlug: string;
	slug: string;
	label: string;
	/** Shared unit for all options (e.g. "gb"). */
	unit?: string;
	options: AttributeOptionDescriptor[];
	visibility?: AttributeVisibility;
	cardPosition: AttributeCardPosition;
}

// ============================================================================
// Variants & products
// ============================================================================

export interface Variant {
	id: string;
	priceRupees: number;
	/** Current in-stock count. `>0` is "available". */
	quantity: number;
	/** When true, storefront treats variant as sold out; `quantity` is unchanged. */
	forceOutOfStock: boolean;
	/** Warranty length in whole days (authoring + storefront). */
	warrantyDays?: number;
	/**
	 * Per-attribute chosen option value. Keys are `Attribute.slug`
	 * (scoped by the product's category); values are the option `value`
	 * string. Render labels by joining against the Attribute collection.
	 */
	attributes: Record<string, string | string[]>;
	/** Display labels for product-only custom attribute values (keyed by attribute slug). */
	attributeDisplay?: Record<string, string>;
}

export interface Product {
	id: string;
	slug: string;
	name: string;
	brandSlug: string;
	brandName: string;
	categorySlug: string;
	isFeatured: boolean;
	/** Ordered product gallery — index `0` is the hero, shown everywhere
	 *  (PDP, cards, search, OG, JSON-LD). Always populated by the serializer. */
	images: StoredImage[];
	/**
	 * Optional product video (upload or YouTube / direct URL). PDP gallery
	 * lists it first; the first image stays selected until the shopper picks the video.
	 */
	video?: string;
	/**
	 * Optional rich HTML product description for the PDP title-column card.
	 * Empty / whitespace-only HTML is treated as missing on the storefront.
	 */
	descriptionHtml?: string;
	variants: Variant[];
	/**
	 * Category attribute slugs this product uses. Populated on every product
	 * after the legacy data migration.
	 */
	attributeSlugs?: string[];
	/** Allowed global option values per attribute slug (subset of category options). */
	attributeOptionPool?: Record<string, string[]>;
	/** Product-only custom options per attribute slug. */
	attributeCustomOptions?: Record<string, Array<{ value: string; label: string }>>;
	/** Pre-fill for new variants — values must be in the matching option pool. */
	attributeDefaults?: Record<string, string>;
	/** Optional admin SEO overrides (auto-filled when absent). */
	seo?: SeoMeta;
}

// ============================================================================
// Size charts
// ============================================================================

/** One ordered measurement column, e.g. `{ key: "bust", label: "Bust" }`. */
export interface SizeChartMeasurementKey {
	key: string;
	label: string;
}

/** One size row. `values` maps each measurement key to inches (canonical). */
export interface SizeChartRow {
	/** Mirrors a `size` attribute option value (`xs`..`xl`). */
	sizeValue: string;
	label: string;
	values: Record<string, number>;
}

/** Customer-facing size chart resolved for a PDP (never exposes internal flags). */
export interface SizeChart {
	id: string;
	name: string;
	unitPrimary: "in" | "cm";
	measurementKeys: SizeChartMeasurementKey[];
	rows: SizeChartRow[];
	fitAdvice?: string;
	notes?: string;
}

// ============================================================================
// Offers
// ============================================================================

export interface Offer {
	id: string;
	slug: string;
	title: string;
	description: string;
	discountLabel: string;
	/** When the offer's active window closes — derived from `schedule.endDate`.
	 *  Absent for open-ended offers (drives the storefront countdown only). */
	expiresAt?: string;
	/** Accent color — hex (`#RRGGBB`) authored in the admin offer drawer. */
	color: string;
	badgeLabel: string;
	bannerImage?: StoredImage;
	/** Optional structured copy (summary + icon-tagged bullets). */
	content?: StructuredContent;
	/** Optional admin SEO overrides (auto-filled when absent). */
	seo?: SeoMeta;
}
