import { Attribute as AttributeModel, Category, connectDB } from "@store/db";
import {
	asString,
	buildAttributeGlossaryAiPrompt,
	buildAttributeGlossaryDescription,
	buildAttributeGlossaryTitle,
	callAiCompletion,
	composeAttributeGlossarySeo,
	logger,
	parseAttributeGlossaryAiResponse,
	resolveAiModel,
	resolveAiProviderFromEnv,
	type SeoMeta,
} from "@store/shared";

import { loadSeoSettings } from "@/lib/seo/loadSeoSettings";

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

export interface RegenerateGlossarySeoResult {
	ok: boolean;
	seo: SeoMeta;
	source: "ai" | "formula";
	message?: string;
}

async function loadCategoryLabel(categorySlug: string): Promise<string> {
	const category = await Category.findOne({ slug: categorySlug }).select({ label: 1 }).lean<{ label: string }>();
	return category?.label ?? "";
}

export async function regenerateAttributeSeo(attributeId: string): Promise<RegenerateGlossarySeoResult | null> {
	await connectDB();

	const doc = await AttributeModel.findById(attributeId).lean();
	if (!doc) {
		return null;
	}

	const categorySlug = asString(doc.categorySlug);
	const [categoryLabel, seoSettings] = await Promise.all([loadCategoryLabel(categorySlug), loadSeoSettings()]);
	const storeName = seoSettings.seoStoreName.trim() || seoSettings.siteName.trim() || "Sister's Outfits";
	const optionLabels = (doc.options ?? []).map((option) => asString(option.label)).filter(Boolean);
	const attribute = {
		categorySlug,
		slug: asString(doc.slug),
		label: asString(doc.label),
		unit: asString(doc.unit) || undefined,
		optionLabels,
	};
	const formulaTitle = buildAttributeGlossaryTitle(attribute.label, storeName);
	const formulaDescription = buildAttributeGlossaryDescription({
		attributeLabel: attribute.label,
		optionLabels,
		unit: attribute.unit,
		categoryLabel,
		storeName,
	});
	const formulaResolved = composeAttributeGlossarySeo({
		attribute,
		categoryLabel,
		settings: seoSettings,
	});

	const assistant = resolveAiProviderFromEnv();
	if (!assistant) {
		const seo: SeoMeta = {
			...(doc.seo ?? {}),
			title: doc.seo?.title?.trim() || formulaTitle,
			description: doc.seo?.description?.trim() || formulaDescription,
		};
		await AttributeModel.findByIdAndUpdate(attributeId, { $set: { seo } });
		return { ok: true, seo, source: "formula", message: "No AI provider configured; formula SEO saved." };
	}

	const provider = assistant.provider;
	const model = resolveAiModel(provider);
	const prompt = buildAttributeGlossaryAiPrompt({
		attributeLabel: attribute.label,
		unit: attribute.unit,
		optionLabels,
		categoryLabel,
		storeName,
		formulaTitle,
		formulaDescription,
	});

	try {
		const completion = await callAiCompletion({
			provider,
			model,
			apiKey: assistant.apiKey,
			messages: [
				{
					role: "system",
					content: "You output strict JSON for glossary SEO metadata. Never invent product specifications.",
				},
				{ role: "user", content: prompt },
			],
			temperature: 0.3,
			maxTokens: 900,
		});
		const parsed = completion?.reply ? parseAttributeGlossaryAiResponse(completion.reply) : null;
		const seo = parsed
			? mergeAiIntoSeo(doc.seo, parsed, { title: formulaTitle, description: formulaDescription }, { modelId: `${provider}:${completion?.model ?? model}` })
			: {
					...(doc.seo ?? {}),
					title: doc.seo?.title?.trim() || formulaTitle,
					description: doc.seo?.description?.trim() || formulaDescription,
				};

		await AttributeModel.findByIdAndUpdate(attributeId, { $set: { seo } });
		return {
			ok: true,
			seo,
			source: parsed ? "ai" : "formula",
			message: parsed ? undefined : "AI response invalid; formula SEO saved.",
		};
	} catch (error) {
		logger.warn({ error, attributeId }, "attribute glossary SEO AI failed; saving formula");
		const seo: SeoMeta = {
			...(doc.seo ?? {}),
			title: doc.seo?.title?.trim() || formulaResolved.title,
			description: doc.seo?.description?.trim() || formulaResolved.description,
		};
		await AttributeModel.findByIdAndUpdate(attributeId, { $set: { seo } });
		return { ok: true, seo, source: "formula", message: "AI failed; formula SEO saved." };
	}
}
