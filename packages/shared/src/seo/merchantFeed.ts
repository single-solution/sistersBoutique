/**
 * Merchant feed rows — one entry per in-stock variant for Google/Meta catalogs.
 */

import { isVariantInStock } from "../catalog/variantAvailability";
import type { AttributeDescriptor, Product, Variant } from "../types";

export type MerchantFeedAvailability = "in_stock" | "out_of_stock";
export type MerchantFeedCondition = "new" | "refurbished" | "used";

export interface MerchantFeedRow {
	/** Stable variant id (`productId_variantId`). */
	id: string;
	itemGroupId: string;
	title: string;
	description: string;
	link: string;
	imageLink: string;
	availability: MerchantFeedAvailability;
	/** Google/Meta price format, e.g. `185000 PKR`. */
	price: string;
	brand: string;
	condition: MerchantFeedCondition;
	identifierExists: false;
	googleProductCategory?: string;
}

export interface MerchantFeedBuildInput {
	products: Product[];
	attributes: AttributeDescriptor[];
	siteUrl: string;
	storeName: string;
}

function escapeXml(value: string): string {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&apos;");
}

function escapeCsvField(value: string): string {
	if (/[",\n\r]/.test(value)) {
		return `"${value.replace(/"/g, '""')}"`;
	}
	return value;
}

function absoluteUrl(siteUrl: string, path: string): string {
	const origin = siteUrl.replace(/\/$/, "");
	return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
}

/** PDP path with attribute query params (matches storefront `productHref`). */
export function buildVariantPdpPath(product: Pick<Product, "categorySlug" | "slug">, variant: Variant): string {
	const base = `/${product.categorySlug}/${product.slug}`;
	const params = new URLSearchParams();
	for (const [attributeSlug, raw] of Object.entries(variant.attributes ?? {})) {
		const value = Array.isArray(raw) ? raw[0] : raw;
		if (value) {
			params.set(attributeSlug, value);
		}
	}
	const query = params.toString();
	return query ? `${base}?${query}` : base;
}

function attributeLabelsForVariant(
	variant: Variant,
	categorySlug: string,
	attributes: AttributeDescriptor[],
): string[] {
	const descriptorsBySlug = new Map(
		attributes.filter((attribute) => attribute.categorySlug === categorySlug).map((attribute) => [attribute.slug, attribute]),
	);
	const labels: string[] = [];
	for (const attributeSlug of Object.keys(variant.attributes ?? {})) {
		const descriptor = descriptorsBySlug.get(attributeSlug);
		const raw = variant.attributes[attributeSlug];
		const value = Array.isArray(raw) ? raw[0] : raw;
		if (!value) {
			continue;
		}
		const display = variant.attributeDisplay?.[attributeSlug];
		if (display?.trim()) {
			labels.push(display.trim());
			continue;
		}
		const optionLabel = descriptor?.options.find((option) => option.value === value)?.label ?? value;
		const unit = descriptor?.unit?.trim();
		labels.push(unit ? `${optionLabel} ${unit}` : optionLabel);
	}
	return labels;
}

function buildVariantTitle(product: Product, attributeLabels: string[]): string {
	const attributeSnippet = attributeLabels.length > 0 ? ` (${attributeLabels.slice(0, 3).join(", ")})` : "";
	const base = `${product.brandName} ${product.name}${attributeSnippet}`;
	return base.length > 150 ? `${base.slice(0, 147).trimEnd()}…` : base;
}

function buildVariantDescription(product: Product, storeName: string, attributeLabels: string[]): string {
	const seoDescription = product.seo?.description?.trim();
	if (seoDescription) {
		return seoDescription.length > 5000 ? `${seoDescription.slice(0, 4997)}…` : seoDescription;
	}
	const attributeLead = attributeLabels.length > 0 ? ` ${attributeLabels.join(", ")}.` : "";
	return `${product.brandName} ${product.name} — ladies suit collection.${attributeLead} New retail at ${storeName}.`;
}

function formatMerchantPrice(priceRupees: number): string {
	return `${Math.round(priceRupees)} PKR`;
}

function heroImageUrl(product: Product): string {
	return product.images[0]?.variants.detail?.trim() || product.images[0]?.variants.full?.trim() || "";
}

export function buildMerchantFeedRows(input: MerchantFeedBuildInput): MerchantFeedRow[] {
	const { products, attributes, siteUrl, storeName } = input;
	const rows: MerchantFeedRow[] = [];

	for (const product of products) {
		const imageLink = heroImageUrl(product);
		if (!imageLink) {
			continue;
		}

		for (const variant of product.variants) {
			if (!isVariantInStock(variant)) {
				continue;
			}

			const attributeLabels = attributeLabelsForVariant(variant, product.categorySlug, attributes);
			const path = buildVariantPdpPath(product, variant);

			rows.push({
				id: `${product.id}_${variant.id}`,
				itemGroupId: product.id,
				title: buildVariantTitle(product, attributeLabels),
				description: buildVariantDescription(product, storeName, attributeLabels),
				link: absoluteUrl(siteUrl, path),
				imageLink,
				availability: "in_stock",
				price: formatMerchantPrice(variant.priceRupees),
				brand: product.brandName,
				condition: "new",
				identifierExists: false,
			});
		}
	}

	return rows;
}

export function serializeMerchantFeedXml(rows: MerchantFeedRow[], channel: { title: string; link: string; description: string }): string {
	const items = rows
		.map(
			(row) => `    <item>
      <g:id>${escapeXml(row.id)}</g:id>
      <g:item_group_id>${escapeXml(row.itemGroupId)}</g:item_group_id>
      <title>${escapeXml(row.title)}</title>
      <description>${escapeXml(row.description)}</description>
      <link>${escapeXml(row.link)}</link>
      <g:image_link>${escapeXml(row.imageLink)}</g:image_link>
      <g:availability>${row.availability}</g:availability>
      <g:price>${escapeXml(row.price)}</g:price>
      <g:brand>${escapeXml(row.brand)}</g:brand>
      <g:condition>${row.condition}</g:condition>
      <g:identifier_exists>false</g:identifier_exists>
    </item>`,
		)
		.join("\n");

	return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${escapeXml(channel.title)}</title>
    <link>${escapeXml(channel.link)}</link>
    <description>${escapeXml(channel.description)}</description>
${items}
  </channel>
</rss>
`;
}

const CSV_HEADERS = [
	"id",
	"title",
	"description",
	"link",
	"image_link",
	"availability",
	"price",
	"brand",
	"condition",
	"identifier_exists",
	"item_group_id",
] as const;

export function serializeMerchantFeedCsv(rows: MerchantFeedRow[]): string {
	const lines = [CSV_HEADERS.join(",")];
	for (const row of rows) {
		lines.push(
			[
				row.id,
				row.title,
				row.description,
				row.link,
				row.imageLink,
				row.availability,
				row.price,
				row.brand,
				row.condition,
				"false",
				row.itemGroupId,
			]
				.map(escapeCsvField)
				.join(","),
		);
	}
	return `${lines.join("\n")}\n`;
}
