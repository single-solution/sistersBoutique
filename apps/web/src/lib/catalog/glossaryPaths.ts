/** Glossary landing URLs (category-scoped attribute slugs). */

export function attributeGlossaryHref(categorySlug: string, attributeSlug: string): string {
	return `/attributes/${categorySlug}/${attributeSlug}`;
}

export function attributeGlossaryAbsoluteUrl(siteUrl: string, categorySlug: string, attributeSlug: string): string {
	const origin = siteUrl.replace(/\/$/, "");
	return `${origin}${attributeGlossaryHref(categorySlug, attributeSlug)}`;
}
