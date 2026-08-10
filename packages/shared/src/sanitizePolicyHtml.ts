import DOMPurify from "isomorphic-dompurify";

/** Max length for admin-authored policy / product description HTML. */
export const RICH_HTML_MAX_LENGTH = 20_000;

/** @deprecated Prefer RICH_HTML_MAX_LENGTH — kept for existing policy imports. */
export const POLICY_HTML_MAX_LENGTH = RICH_HTML_MAX_LENGTH;

const RICH_HTML_ALLOWED_TAGS = ["h2", "h3", "p", "br", "strong", "em", "u", "ul", "ol", "li", "a", "blockquote"] as const;

/**
 * True when HTML has no visible text (empty editor, `<p><br></p>`, etc.).
 */
export function isRichHtmlEmpty(html: string | null | undefined): boolean {
	if (!html?.trim()) {
		return true;
	}
	const text = html
		.replace(/<[^>]*>/g, " ")
		.replace(/&nbsp;/gi, " ")
		.replace(/\s+/g, " ")
		.trim();
	return text.length === 0;
}

/**
 * Strip unsafe markup from admin-authored rich HTML before render. Runs on both
 * the server (via isomorphic-dompurify's DOM shim) and the client, so sanitized
 * copy is present in SSR output — no client-only hydration gate needed.
 */
export function sanitizeRichHtml(html: string): string {
	if (!html.trim()) {
		return "";
	}
	return DOMPurify.sanitize(html, {
		ALLOWED_TAGS: [...RICH_HTML_ALLOWED_TAGS],
		ALLOWED_ATTR: ["href", "target", "rel"],
	});
}

/** Alias used by policy modals. */
export function sanitizePolicyHtml(html: string): string {
	return sanitizeRichHtml(html);
}
