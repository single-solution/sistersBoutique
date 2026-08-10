import mongoose, { Schema, type HydratedDocument, type Model } from "mongoose";

import { slugify } from "@store/shared";
import type { SeoMeta, StoredImage } from "@store/shared";

import { seoSchema } from "../schemas/seoSchema";
import { storedImageSchema } from "../schemas/storedImageSchema";

/**
 * A catalog listing. A `Product` is a thin shell: an identity (name +
 * slug), a category + brand assignment, some flags, an ordered photo
 * gallery, and a list of variants. Photos live at the product level
 * only. Variants are pure inventory + attribute rows — identity is the
 * attribute combo.
 */

/**
 * Variant — the unit of inventory + dynamic attributes. Every stock change
 * happens at the variant level. Photos live on `Product.images` and apply
 * to every variant of the product. Identity is the attribute combo only.
 */
export interface VariantAttributes {
	/** Mongoose-generated when pushing into the parent doc. */
	_id?: mongoose.Types.ObjectId;
	priceRupees: number;
	quantity: number;
	/** When true, storefront treats variant as sold out; `quantity` is unchanged. */
	forceOutOfStock: boolean;
	/** Whole days; storefront formats as months + days when ≥ 30. */
	warrantyDays?: number;
	/**
	 * Per-attribute chosen option value. Keys are `Attribute.slug` (per the
	 * product's category); values are option `value` strings from
	 * `Attribute.options[].value`. Usually one string per slug; multiple
	 * global options on the same variant use a string array (e.g. three colors).
	 */
	attributes: Record<string, string | string[]>;
	/**
	 * Display labels for product-only custom attribute values (not in global
	 * Attribute.options). Keys match `attributes` keys.
	 */
	attributeDisplay?: Record<string, string>;
}

export interface ProductAttributes {
	slug: string;
	name: string;
	brandSlug: string;
	categorySlug: string;
	isActive: boolean;
	isArchived: boolean;
	isFeatured: boolean;
	/** Ordered product gallery — index `0` is the hero. */
	images: StoredImage[];
	/**
	 * Optional product video URL — uploaded mp4/webm in storage, or an external
	 * link (YouTube or direct media URL). Shown first in the PDP gallery strip;
	 * first still image remains the default selected hero.
	 */
	video?: string;
	/**
	 * Optional customer-facing rich HTML description (bold, lists, links).
	 * Shown on the PDP under the title card; empty products hide the card.
	 */
	descriptionHtml?: string;
	variants: VariantAttributes[];
	/**
	 * Category attribute slugs this product uses. Every product must carry an
	 * explicit list on every product document.
	 */
	attributeSlugs?: string[];
	/** Allowed global option values per attribute slug. */
	attributeOptionPool?: Record<string, string[]>;
	/** Product-only custom options per attribute slug. */
	attributeCustomOptions?: Record<string, Array<{ value: string; label: string }>>;
	/** Default option values pre-filled when authoring new variants. */
	attributeDefaults?: Record<string, string>;
	/**
	 * Explicit size-chart override. When set, wins over the brand/category
	 * default. When absent, the storefront falls back down the inheritance
	 * chain (brand -> category). See `hideSizeGuide` to suppress entirely.
	 */
	sizeChartId?: mongoose.Types.ObjectId;
	/** When true, no size guide is shown even if a chart would be inherited. */
	hideSizeGuide?: boolean;
	/**
	 * Optional per-product SEO overrides. When fields are absent the
	 * storefront falls back to auto-generated values built from the
	 * product + brand + category + Settings.
	 */
	seo?: SeoMeta;
}

const variantSchema = new Schema<VariantAttributes>(
	{
		priceRupees: { type: Number, required: true, min: 0 },
		quantity: { type: Number, required: true, min: 0, default: 0 },
		forceOutOfStock: { type: Boolean, required: true, default: false },
		warrantyDays: { type: Number, min: 0 },
		attributes: {
			type: Schema.Types.Mixed,
			required: true,
			default: {} as Record<string, string>,
		},
		attributeDisplay: {
			type: Schema.Types.Mixed,
			default: undefined,
		},
	},
	{ _id: true, timestamps: false },
);

const PRODUCT_SLUG_MAX_LENGTH = 96;

const productSchema = new Schema<ProductAttributes>(
	{
		slug: {
			type: String,
			required: true,
			unique: true,
			lowercase: true,
			trim: true,
			maxlength: PRODUCT_SLUG_MAX_LENGTH,
			index: true,
		},
		name: { type: String, required: true, trim: true, maxlength: 120 },
		brandSlug: {
			type: String,
			required: true,
			lowercase: true,
			trim: true,
			maxlength: 64,
			index: true,
		},
		categorySlug: {
			type: String,
			required: true,
			lowercase: true,
			trim: true,
			maxlength: 64,
			index: true,
		},
		isFeatured: { type: Boolean, required: true, default: false },
		isActive: { type: Boolean, required: true, default: true },
		isArchived: { type: Boolean, required: true, default: false },
		images: {
			type: [storedImageSchema],
			required: true,
			default: [],
		},
		video: {
			type: String,
			required: false,
			trim: true,
			maxlength: 600,
			default: "",
		},
		descriptionHtml: {
			type: String,
			required: false,
			trim: true,
			maxlength: 20_000,
			default: "",
		},
		variants: {
			type: [variantSchema],
			default: [],
		},
		attributeSlugs: {
			type: [String],
			default: undefined,
		},
		attributeOptionPool: {
			type: Schema.Types.Mixed,
			default: undefined,
		},
		attributeCustomOptions: {
			type: Schema.Types.Mixed,
			default: undefined,
		},
		attributeDefaults: {
			type: Schema.Types.Mixed,
			default: undefined,
		},
		sizeChartId: { type: Schema.Types.ObjectId, ref: "SizeChart", required: false, default: undefined },
		hideSizeGuide: { type: Boolean, required: false, default: undefined },
		seo: { type: seoSchema, default: () => ({}) },
	},
	{ timestamps: true },
);

productSchema.pre<HydratedDocument<ProductAttributes>>("validate", async function productSlugAutogen() {
	if (this?.slug && this.slug.length > 0) {
		return;
	}
	if (!this?.name) {
		return;
	}
	this.slug = slugify(this.name, PRODUCT_SLUG_MAX_LENGTH);
});

// Storefront list/sort coverage:
//   • `{ categorySlug, isActive, isArchived, name }` supports name-asc sort.
//   • `{ categorySlug, isActive, isArchived, createdAt:-1 }` covers the
//     dominant "newest first" path used by home + default /shop/[slug].
//   • `{ categorySlug, isActive, isArchived, isFeatured:-1, createdAt:-1 }`
//     covers the featured rail.
//   • `{ brandSlug, name }` for the brand landing path.
productSchema.index({ categorySlug: 1, isActive: 1, isArchived: 1, name: 1 });
productSchema.index({ categorySlug: 1, isActive: 1, isArchived: 1, createdAt: -1 });
productSchema.index({
	categorySlug: 1,
	isActive: 1,
	isArchived: 1,
	isFeatured: -1,
	createdAt: -1,
});
productSchema.index({ brandSlug: 1, name: 1 });
// Admin list coverage: cross-category "all products" sort by recency.
productSchema.index({ isArchived: 1, createdAt: -1 });

export const Product: Model<ProductAttributes> = (mongoose.models.Product as Model<ProductAttributes>) ?? mongoose.model<ProductAttributes>("Product", productSchema);
