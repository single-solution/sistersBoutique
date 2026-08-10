import { isRichHtmlEmpty, RICH_HTML_MAX_LENGTH } from "@store/shared";

/**
 * Validate optional product description HTML from admin create/update bodies.
 */
export function validateProductDescriptionHtml(raw: unknown): { ok: true; value: string } | { ok: false; error: string } {
	if (raw === undefined || raw === null) {
		return { ok: true, value: "" };
	}
	if (typeof raw !== "string") {
		return { ok: false, error: "Description must be a string." };
	}
	const trimmed = raw.trim();
	if (trimmed.length > RICH_HTML_MAX_LENGTH) {
		return { ok: false, error: `Description must be at most ${RICH_HTML_MAX_LENGTH} characters.` };
	}
	if (isRichHtmlEmpty(trimmed)) {
		return { ok: true, value: "" };
	}
	return { ok: true, value: trimmed };
}
