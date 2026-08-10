import { formatPrice } from "../formatters";
import { formatWarrantyPeriod, resolveWarrantyDays } from "../warranty";
import type { ProductSeoFacts } from "./productSeoFacts";

export interface ProductFaqEntry {
	question: string;
	answer: string;
}

const FAQ_ANSWER_MAX = 320;

function truncateFaqAnswer(answer: string): string {
	const trimmed = answer.trim();
	if (trimmed.length <= FAQ_ANSWER_MAX) {
		return trimmed;
	}
	const slice = trimmed.slice(0, FAQ_ANSWER_MAX);
	const lastSpace = slice.lastIndexOf(" ");
	return lastSpace > 120 ? `${slice.slice(0, lastSpace).trimEnd()}…` : `${slice.trimEnd()}…`;
}

export function buildProductFaqEntries(
	facts: ProductSeoFacts,
	options: {
		maxWarrantyDays?: number;
	} = {},
): ProductFaqEntry[] {
	const entries: ProductFaqEntry[] = [];

	if (facts.priceLead) {
		const priceAnswer =
			facts.minPriceRupees !== null && facts.maxPriceRupees !== null && facts.minPriceRupees !== facts.maxPriceRupees
				? `Prices range from ${formatPrice(facts.minPriceRupees)} to ${formatPrice(facts.maxPriceRupees)} depending on size, fabric, and configuration.`
				: `The current price is ${facts.priceLead}.`;
		entries.push({
			question: `What is the price of the ${facts.baseTitle}?`,
			answer: truncateFaqAnswer(priceAnswer),
		});
	}

	if (facts.topAttributesSummary) {
		entries.push({
			question: `What configurations are available for the ${facts.baseTitle}?`,
			answer: truncateFaqAnswer(`Available options include ${facts.topAttributesSummary}.`),
		});
	}

	const warrantyDays = options.maxWarrantyDays ?? 0;
	if (warrantyDays > 0) {
		entries.push({
			question: `What quality assurance is included with the ${facts.baseTitle}?`,
			answer: truncateFaqAnswer(`Eligible pieces include up to ${formatWarrantyPeriod(warrantyDays)} quality assurance with clear collection notes at ${facts.storeName}.`),
		});
	}

	return entries.slice(0, 8);
}

export function maxWarrantyDaysForVariants(variants: Array<{ warrantyDays?: number }>): number {
	let maxDays = 0;
	for (const variant of variants) {
		maxDays = Math.max(maxDays, resolveWarrantyDays(variant));
	}
	return maxDays;
}
