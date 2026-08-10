import { Attribute, Brand, Category, connectDB, SizeChart } from "@store/db";
import { toAttributeResponse, type AttributeLean } from "@/lib/serializers/attribute";
import { toBrandResponse, type BrandLean } from "@/lib/serializers/brand";
import { toCategoryResponse, type CategoryLean } from "@/lib/serializers/category";
import { toSizeChartResponse, type SizeChartLean } from "@/lib/serializers/sizeChart";
import type { AdminAttribute, AdminBrand, AdminCategory, AdminSizeChart } from "@/types/models";

export interface ProductWizardCatalog {
	categories: AdminCategory[];
	brandsByCategory: Record<string, AdminBrand[]>;
	attributesByCategory: Record<string, AdminAttribute[]>;
	/** Active size charts available to assign as a per-product override. */
	sizeCharts: AdminSizeChart[];
}

export async function loadProductWizardCatalog(): Promise<ProductWizardCatalog> {
	await connectDB();

	const [categoryDocs, brandDocs, attributeDocs, sizeChartDocs] = await Promise.all([
		Category.find({ isActive: true }).sort({ sortOrder: 1, label: 1 }).lean<CategoryLean[]>(),
		Brand.find({ isActive: true }).sort({ name: 1 }).lean<BrandLean[]>(),
		Attribute.find({ isActive: true }).sort({ categorySlug: 1, label: 1 }).lean<AttributeLean[]>(),
		SizeChart.find({ isActive: true }).sort({ name: 1 }).lean<SizeChartLean[]>(),
	]);

	const categories = categoryDocs.map(toCategoryResponse);
	const brands = brandDocs.map(toBrandResponse);
	const attributes = attributeDocs.map(toAttributeResponse);
	const sizeCharts = sizeChartDocs.map(toSizeChartResponse);

	const brandsByCategory: Record<string, AdminBrand[]> = {};
	for (const brand of brands) {
		for (const slug of brand.categorySlugs) {
			const bucket = brandsByCategory[slug] ?? [];
			bucket.push(brand);
			brandsByCategory[slug] = bucket;
		}
	}

	const attributesByCategory: Record<string, AdminAttribute[]> = {};
	for (const attribute of attributes) {
		const bucket = attributesByCategory[attribute.categorySlug] ?? [];
		bucket.push(attribute);
		attributesByCategory[attribute.categorySlug] = bucket;
	}

	return {
		categories,
		brandsByCategory,
		attributesByCategory,
		sizeCharts,
	};
}
