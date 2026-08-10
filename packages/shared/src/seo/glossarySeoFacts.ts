/**
 * Layer 1 glossary SEO — formula titles/descriptions for attribute pages.
 */

import { truncateSerpDescription, truncateSerpTitle } from "./productSeoFacts";

export function buildAttributeGlossaryTitle(attributeLabel: string, storeName: string): string {
	return truncateSerpTitle(`What is ${attributeLabel}? | ${storeName}`);
}

export function buildAttributeGlossaryDescription(input: {
	attributeLabel: string;
	optionLabels: string[];
	unit?: string;
	categoryLabel: string;
	storeName: string;
}): string {
	const { attributeLabel, optionLabels, unit, categoryLabel, storeName } = input;
	const categoryPhrase = categoryLabel.trim() || "this category";
	const unitSuffix = unit?.trim() ? ` (${unit.trim()})` : "";
	const optionsLead =
		optionLabels.length > 0
			? `Options include ${optionLabels.slice(0, 6).join(", ")}${optionLabels.length > 6 ? ", and more" : ""}. `
			: "";
	return truncateSerpDescription(
		`${attributeLabel}${unitSuffix} is a ${categoryPhrase.toLowerCase()} configuration. ${optionsLead}Browse at ${storeName}.`,
	);
}
