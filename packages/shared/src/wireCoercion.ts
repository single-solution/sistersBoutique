const EPOCH = new Date(0);

export function coerceDate(value: unknown): Date | null {
	if (!value) {
		return null;
	}
	const date = value instanceof Date ? value : new Date(String(value));
	if (Number.isNaN(date.getTime())) {
		return null;
	}
	return date;
}

export function toIsoDate(value: unknown, fallback: Date = EPOCH): string {
	return (coerceDate(value) ?? fallback).toISOString();
}

export function toMillis(value: unknown, fallback = 0): number {
	return coerceDate(value)?.getTime() ?? fallback;
}

export function asArray<T>(value: unknown): T[] {
	return Array.isArray(value) ? value : [];
}

export function asString(value: unknown, fallback = ""): string {
	return typeof value === "string" ? value : fallback;
}

export function asNumber(value: unknown, fallback = 0): number {
	return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function objectIdString(value: unknown): string {
	if (!value || typeof value !== "object" || !("toString" in value)) {
		return "";
	}
	return String(value);
}
