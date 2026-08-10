import { parseYouTubeId } from "@store/shared";

/**
 * Validate an optional product video URL (empty allowed).
 * Accepts YouTube links or any http(s) URL (uploaded file or direct media).
 */
export function validateProductVideoUrl(value: unknown): { ok: true; value: string } | { ok: false; error: string } {
	if (value === undefined || value === null) {
		return { ok: true, value: "" };
	}
	if (typeof value !== "string") {
		return { ok: false, error: "Video must be a URL string." };
	}
	const trimmed = value.trim();
	if (trimmed.length === 0) {
		return { ok: true, value: "" };
	}
	if (trimmed.length > 600) {
		return { ok: false, error: "Video URL is too long." };
	}
	if (!isAcceptableProductVideoUrl(trimmed)) {
		return { ok: false, error: "Enter a YouTube link, direct video URL, or upload a file." };
	}
	return { ok: true, value: trimmed };
}

export function isAcceptableProductVideoUrl(input: string): boolean {
	const trimmed = input.trim();
	if (!trimmed) {
		return false;
	}
	if (parseYouTubeId(trimmed)) {
		return true;
	}
	try {
		const url = new URL(trimmed);
		return url.protocol === "http:" || url.protocol === "https:";
	} catch {
		return false;
	}
}
