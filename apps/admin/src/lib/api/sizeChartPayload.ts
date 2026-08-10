/**
 * Shared validator for the size-chart write endpoints. Normalizes the raw
 * client payload into a persistable shape or returns a validation error
 * string. Measurements are kept in inches (chart canonical unit).
 */
import { slugify } from "@store/shared";
import type { SizeChartMeasurementKey, SizeChartRow } from "@store/db";

const MAX_MEASUREMENT_KEYS = 12;
const MAX_ROWS = 12;
const MEASUREMENT_KEY_MAX = 40;
const MEASUREMENT_LABEL_MAX = 60;
const SIZE_VALUE_MAX = 32;
const CHART_NAME_MAX = 120;
const FIT_ADVICE_MAX = 600;
const NOTES_MAX = 600;
const MIN_MEASUREMENT = 0;
const MAX_MEASUREMENT = 200;

export interface SizeChartPayload {
	name: string;
	unitPrimary: "in" | "cm";
	measurementKeys: SizeChartMeasurementKey[];
	rows: SizeChartRow[];
	fitAdvice: string;
	notes: string;
	isActive: boolean;
}

interface RawSizeChartInput {
	name?: unknown;
	unitPrimary?: unknown;
	measurementKeys?: unknown;
	rows?: unknown;
	fitAdvice?: unknown;
	notes?: unknown;
	isActive?: unknown;
}

function trimString(value: unknown, max: number): string {
	return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function parseMeasurementKeys(input: unknown): SizeChartMeasurementKey[] | { error: string } {
	if (!Array.isArray(input) || input.length === 0) {
		return { error: "Add at least one measurement column." };
	}
	if (input.length > MAX_MEASUREMENT_KEYS) {
		return { error: `A chart can have at most ${MAX_MEASUREMENT_KEYS} measurement columns.` };
	}
	const keys: SizeChartMeasurementKey[] = [];
	const seen = new Set<string>();
	for (const raw of input) {
		const source = (raw ?? {}) as { key?: unknown; label?: unknown };
		const label = trimString(source.label, MEASUREMENT_LABEL_MAX);
		if (label.length === 0) {
			return { error: "Each measurement column needs a label." };
		}
		const providedKey = trimString(source.key, MEASUREMENT_KEY_MAX);
		const key = slugify(providedKey.length > 0 ? providedKey : label, MEASUREMENT_KEY_MAX);
		if (key.length === 0) {
			return { error: "Could not derive a key for a measurement column." };
		}
		if (seen.has(key)) {
			return { error: "Measurement columns must be unique." };
		}
		seen.add(key);
		keys.push({ key, label });
	}
	return keys;
}

function parseRows(input: unknown, keys: SizeChartMeasurementKey[]): SizeChartRow[] | { error: string } {
	if (!Array.isArray(input) || input.length === 0) {
		return { error: "Add at least one size row." };
	}
	if (input.length > MAX_ROWS) {
		return { error: `A chart can have at most ${MAX_ROWS} size rows.` };
	}
	const keySet = new Set(keys.map((entry) => entry.key));
	const rows: SizeChartRow[] = [];
	const seen = new Set<string>();
	for (const raw of input) {
		const source = (raw ?? {}) as { sizeValue?: unknown; label?: unknown; values?: unknown };
		const label = trimString(source.label, SIZE_VALUE_MAX);
		if (label.length === 0) {
			return { error: "Each size row needs a label." };
		}
		const providedValue = trimString(source.sizeValue, SIZE_VALUE_MAX);
		const sizeValue = slugify(providedValue.length > 0 ? providedValue : label, SIZE_VALUE_MAX);
		if (sizeValue.length === 0) {
			return { error: "Could not derive a size value for a row." };
		}
		if (seen.has(sizeValue)) {
			return { error: "Size rows must be unique." };
		}
		seen.add(sizeValue);

		const rawValues = (source.values ?? {}) as Record<string, unknown>;
		const values: Record<string, number> = {};
		for (const key of keySet) {
			const candidate = rawValues[key];
			if (candidate === undefined || candidate === null || candidate === "") {
				continue;
			}
			const numeric = Number(candidate);
			if (!Number.isFinite(numeric) || numeric < MIN_MEASUREMENT || numeric > MAX_MEASUREMENT) {
				return { error: `Measurement for "${label}" must be a number between ${MIN_MEASUREMENT} and ${MAX_MEASUREMENT}.` };
			}
			values[key] = numeric;
		}
		rows.push({ sizeValue, label, values });
	}
	return rows;
}

export function parseSizeChartPayload(raw: unknown): SizeChartPayload | { error: string } {
	const body = (raw ?? {}) as RawSizeChartInput;

	const name = trimString(body.name, CHART_NAME_MAX);
	if (name.length === 0) {
		return { error: "Chart name is required." };
	}

	const unitPrimary: "in" | "cm" = body.unitPrimary === "cm" ? "cm" : "in";

	const measurementKeys = parseMeasurementKeys(body.measurementKeys);
	if ("error" in measurementKeys) {
		return measurementKeys;
	}

	const rows = parseRows(body.rows, measurementKeys);
	if ("error" in rows) {
		return rows;
	}

	return {
		name,
		unitPrimary,
		measurementKeys,
		rows,
		fitAdvice: trimString(body.fitAdvice, FIT_ADVICE_MAX),
		notes: trimString(body.notes, NOTES_MAX),
		isActive: body.isActive !== false,
	};
}
