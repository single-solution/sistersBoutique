import { Attribute as AttributeModel, Brand, Category, connectDB, Product as ProductModel } from "@store/db";
import {
	asArray,
	asNumber,
	asString,
	buildProductSeoAiPrompt,
	buildProductSeoDescription,
	buildProductSeoFacts,
	buildProductSeoTitle,
	callAiCompletion,
	calculateProductSeoScore,
	composeProductSeo,
	coerceStoredImage,
	logger,
	objectIdString,
	parseProductSeoAiResponse,
	resolveAiModel,
	resolveAiProviderFromEnv,
	resolveWarrantyDays,
	type Product,
	type SeoMeta,
} from "@store/shared";
import type { VariantAttributes } from "@store/db";

import { loadSeoSettings } from "@/lib/seo/loadSeoSettings";
import { type BrandLean } from "@/lib/serializers/brand";
import { toProductResponse, type ProductLean } from "@/lib/serializers/product";

function toCatalogProduct(doc: ProductLean, brandName: string): Product {
	const images = asArray<unknown>(doc.images)
		.map(coerceStoredImage)
		.filter((image): image is NonNullable<ReturnType<typeof coerceStoredImage>> => image !== null);

	return {
		id: objectIdString(doc._id),
		slug: asString(doc.slug),
		name: asString(doc.name),
		brandSlug: asString(doc.brandSlug),
		brandName,
		categorySlug: asString(doc.categorySlug),
		isFeatured: doc.isFeatured ?? false,
		images,
		variants: asArray<VariantAttributes>(doc.variants).map((variant) => ({
			id: objectIdString(variant._id),
			priceRupees: asNumber(variant.priceRupees),
			quantity: variant.quantity ?? 0,
			forceOutOfStock: variant.forceOutOfStock === true,
			warrantyDays: resolveWarrantyDays(variant),
			attributes: variant.attributes ?? {},
			attributeDisplay: variant.attributeDisplay,
		})),
		attributeSlugs: Array.isArray(doc.attributeSlugs) ? doc.attributeSlugs.filter((slug): slug is string => typeof slug === "string") : undefined,
		attributeOptionPool: doc.attributeOptionPool as Product["attributeOptionPool"],
		attributeCustomOptions: doc.attributeCustomOptions as Product["attributeCustomOptions"],
		attributeDefaults: doc.attributeDefaults as Product["attributeDefaults"],
		seo: doc.seo,
	};
}

function mergeAiIntoSeo(
	existing: SeoMeta | undefined,
	ai: { title: string; description: string; faqs: SeoMeta["faqs"] },
	formula: { title: string; description: string },
	meta: { modelId: string },
): SeoMeta {
	const merged: SeoMeta = { ...(existing ?? {}) };
	let wroteAi = false;

	if (!existing?.title?.trim()) {
		merged.title = ai.title || formula.title;
		if (merged.title) {
			wroteAi = true;
		}
	}
	if (!existing?.description?.trim()) {
		merged.description = ai.description || formula.description;
		if (merged.description) {
			wroteAi = true;
		}
	}
	if (ai.faqs && ai.faqs.length > 0) {
		merged.faqs = ai.faqs;
		wroteAi = true;
	}

	if (wroteAi) {
		merged.aiGeneratedAt = new Date().toISOString();
		merged.aiModelId = meta.modelId;
	}

	return merged;
}

export interface RegenerateProductSeoResult {
	ok: boolean;
	seo: SeoMeta;
	source: "ai" | "formula";
	message?: string;
}

export async function regenerateProductSeo(productId: string): Promise<RegenerateProductSeoResult | null> {
	await connectDB();

	const doc = await ProductModel.findById(productId).lean<ProductLean>();
	if (!doc) {
		return null;
	}

	const [brand, category, attributes, seoSettings] = await Promise.all([
		Brand.findOne({ slug: doc.brandSlug, categorySlugs: doc.categorySlug }).lean<BrandLean>(),
		Category.findOne({ slug: doc.categorySlug }).select({ label: 1 }).lean<{ label: string }>(),
		AttributeModel.find({ categorySlug: doc.categorySlug, isActive: true }).lean(),
		loadSeoSettings(),
	]);

	const brandName = brand?.name ?? asString(doc.brandSlug);
	const publicProduct = toCatalogProduct(doc, brandName);
	const storeName = seoSettings.seoStoreName.trim() || seoSettings.siteName.trim() || "Sister's Outfits";
	const categoryLabel = category?.label ?? "";
	const factsContext = {
		attributes: attributes.map((attribute) => ({
			categorySlug: attribute.categorySlug,
			slug: attribute.slug,
			label: attribute.label,
			unit: attribute.unit,
			options: attribute.options ?? [],
			cardPosition: attribute.cardPosition,
		})),
	};

	const facts = buildProductSeoFacts(publicProduct, storeName, factsContext, categoryLabel);
	const formulaTitle = buildProductSeoTitle(facts);
	const formulaDescription = buildProductSeoDescription(facts);
	const formulaResolved = composeProductSeo({
		product: publicProduct,
		variant: publicProduct.variants[0]!,
		brand: brand ? { slug: brand.slug, name: brand.name } : null,
		category: category ? { slug: doc.categorySlug, label: categoryLabel } : null,
		settings: seoSettings,
		seo: doc.seo,
		factsContext,
	});

	const persistSeo = async (seo: SeoMeta, result: Omit<RegenerateProductSeoResult, "seo">) => {
		seo.score = calculateProductSeoScore(doc.name, brandName, seo, (doc.images?.length ?? 0) > 0, storeName);
		await ProductModel.updateOne({ _id: productId }, { $set: { seo } });
		return { ...result, seo };
	};

	const assistant = resolveAiProviderFromEnv();
	if (!assistant) {
		const seo = mergeAiIntoSeo(
			doc.seo,
			{ title: formulaTitle, description: formulaDescription, faqs: undefined },
			{ title: formulaTitle, description: formulaDescription },
			{ modelId: "formula" },
		);
		return persistSeo(seo, { ok: true, source: "formula", message: "No AI provider configured; formula copy kept." });
	}

	const provider = assistant.provider;
	const model = resolveAiModel(provider);
	const prompt = buildProductSeoAiPrompt({
		facts,
		formulaTitle,
		formulaDescription: formulaResolved.description,
		categoryLabel,
		storeName,
	});

	const completion = await callAiCompletion({
		provider,
		model,
		apiKey: assistant.apiKey,
		messages: [
			{
				role: "system",
				content: "You output strict JSON for product SEO metadata. Never invent product specifications.",
			},
			{ role: "user", content: prompt },
		],
		temperature: 0.3,
		maxTokens: 900,
	});

	const parsed = completion?.reply ? parseProductSeoAiResponse(completion.reply) : null;
	if (!parsed) {
		logger.warn({ productId, provider, model }, "product-seo: AI generation failed; keeping formula fallback");
		const seo = mergeAiIntoSeo(
			doc.seo,
			{ title: formulaTitle, description: formulaDescription, faqs: undefined },
			{ title: formulaTitle, description: formulaDescription },
			{ modelId: "formula" },
		);
		return persistSeo(seo, { ok: false, source: "formula", message: "AI generation failed; formula copy kept." });
	}

	const seo = mergeAiIntoSeo(
		doc.seo,
		{ title: parsed.title, description: parsed.description, faqs: parsed.faqs },
		{ title: formulaTitle, description: formulaDescription },
		{ modelId: `${provider}:${completion?.model ?? model}` },
	);
	return persistSeo(seo, { ok: true, source: "ai" });
}

export async function regenerateProductSeoResponse(productId: string) {
	const result = await regenerateProductSeo(productId);
	if (!result) {
		return null;
	}
	await connectDB();
	const doc = await ProductModel.findById(productId).lean<ProductLean>();
	if (!doc) {
		return null;
	}
	const brand = await Brand.findOne({ slug: doc.brandSlug, categorySlugs: doc.categorySlug }).lean<BrandLean>();
	return {
		...result,
		product: toProductResponse(doc, brand ?? undefined),
	};
}
