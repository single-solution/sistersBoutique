/**
 * Resolve the effective size chart for a product on the storefront.
 *
 * Inheritance (most specific wins):
 *   product.sizeChartId → brand.defaultSizeChartId → category.defaultSizeChartId → none.
 * `product.hideSizeGuide` short-circuits the chain and hides the guide entirely.
 *
 * Measurements are stored canonically in inches; the client derives cm on display.
 */
import {
	Brand as BrandModel,
	Category as CategoryModel,
	Product as ProductModel,
	SizeChart as SizeChartModel,
	connectDB,
} from "@store/db";
import { asNumber, asString, objectIdString, type SizeChart } from "@store/shared";

interface ProductSizeChartRef {
	sizeChartId?: unknown;
	hideSizeGuide?: boolean;
	brandSlug?: string;
	categorySlug?: string;
}

function serializeSizeChart(chart: {
	_id: unknown;
	name?: unknown;
	unitPrimary?: unknown;
	measurementKeys?: unknown;
	rows?: unknown;
	fitAdvice?: unknown;
	notes?: unknown;
}): SizeChart {
	const measurementKeys = Array.isArray(chart.measurementKeys)
		? (chart.measurementKeys as Array<{ key?: unknown; label?: unknown }>).map((entry) => ({
				key: asString(entry.key),
				label: asString(entry.label),
			}))
		: [];
	const rows = Array.isArray(chart.rows)
		? (chart.rows as Array<{ sizeValue?: unknown; label?: unknown; values?: unknown }>).map((row) => {
				const rawValues = (row.values ?? {}) as Record<string, unknown>;
				const values: Record<string, number> = {};
				for (const [key, value] of Object.entries(rawValues)) {
					values[key] = asNumber(value);
				}
				return { sizeValue: asString(row.sizeValue), label: asString(row.label), values };
			})
		: [];
	return {
		id: objectIdString(chart._id),
		name: asString(chart.name),
		unitPrimary: chart.unitPrimary === "cm" ? "cm" : "in",
		measurementKeys,
		rows,
		fitAdvice: asString(chart.fitAdvice) || undefined,
		notes: asString(chart.notes) || undefined,
	};
}

/**
 * Walk the inheritance chain and return the resolved chart id, or null when the
 * product hides the guide or nothing in the chain assigns one.
 */
async function resolveChartId(product: ProductSizeChartRef): Promise<string | null> {
	if (product.hideSizeGuide) {
		return null;
	}
	const productChartId = objectIdString(product.sizeChartId);
	if (productChartId) {
		return productChartId;
	}
	if (product.brandSlug && product.categorySlug) {
		const brand = await BrandModel.findOne({ slug: product.brandSlug, categorySlugs: product.categorySlug })
			.select({ defaultSizeChartId: 1 })
			.lean<{ defaultSizeChartId?: unknown }>();
		const brandChartId = objectIdString(brand?.defaultSizeChartId);
		if (brandChartId) {
			return brandChartId;
		}
	}
	if (product.categorySlug) {
		const category = await CategoryModel.findOne({ slug: product.categorySlug })
			.select({ defaultSizeChartId: 1 })
			.lean<{ defaultSizeChartId?: unknown }>();
		const categoryChartId = objectIdString(category?.defaultSizeChartId);
		if (categoryChartId) {
			return categoryChartId;
		}
	}
	return null;
}

export const DEFAULT_WOMENS_SIZE_CHART: SizeChart = {
	id: "default-womens-size-chart",
	name: "Standard Women's Size Guide",
	unitPrimary: "in",
	measurementKeys: [
		{ key: "bust", label: "Bust" },
		{ key: "waist", label: "Waist" },
		{ key: "hip", label: "Hip" },
		{ key: "kameez", label: "Shirt Length" },
	],
	rows: [
		{ sizeValue: "xs", label: "XS (Extra Small)", values: { bust: 32, waist: 26, hip: 36, kameez: 38 } },
		{ sizeValue: "s", label: "S (Small)", values: { bust: 35, waist: 28, hip: 38, kameez: 39 } },
		{ sizeValue: "m", label: "M (Medium)", values: { bust: 38, waist: 31, hip: 41, kameez: 40 } },
		{ sizeValue: "l", label: "L (Large)", values: { bust: 42, waist: 35, hip: 45, kameez: 41 } },
		{ sizeValue: "xl", label: "XL (Extra Large)", values: { bust: 46, waist: 39, hip: 49, kameez: 42 } },
	],
	fitAdvice: "Designed for a standard relaxed fit. Select your standard size or use our interactive size finder to match your body measurements.",
	notes: "All measurements are body measurements in inches unless toggled to centimetres.",
};

/**
 * Effective size chart for a product slug, applying the inheritance chain.
 * Returns custom chart if assigned, or default fallback chart when unspecified.
 */
export async function resolveProductSizeChart(slug: string): Promise<SizeChart | null> {
	await connectDB();
	const product = await ProductModel.findOne({ slug: slug.toLowerCase() })
		.select({ sizeChartId: 1, hideSizeGuide: 1, brandSlug: 1, categorySlug: 1 })
		.lean<ProductSizeChartRef>();
	if (!product) {
		return DEFAULT_WOMENS_SIZE_CHART;
	}
	if (product.hideSizeGuide) {
		return null;
	}
	const chartId = await resolveChartId(product);
	if (!chartId) {
		return DEFAULT_WOMENS_SIZE_CHART;
	}
	const chart = await SizeChartModel.findOne({ _id: chartId, isActive: true }).lean();
	if (!chart) {
		return DEFAULT_WOMENS_SIZE_CHART;
	}
	return serializeSizeChart(chart);
}
