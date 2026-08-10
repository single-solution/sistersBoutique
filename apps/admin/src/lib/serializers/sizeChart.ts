import type { Types } from "mongoose";
import type { SizeChartAttributes, WithTimestamps } from "@store/db";
import { asArray, asNumber, asString, objectIdString, toIsoDate } from "@store/shared";
import type { AdminSizeChart, AdminSizeChartMeasurementKey, AdminSizeChartRow } from "@/types/models";

export type SizeChartLean = WithTimestamps<SizeChartAttributes> & {
	_id: Types.ObjectId;
};

function toMeasurementKeys(input: unknown): AdminSizeChartMeasurementKey[] {
	return asArray<{ key?: unknown; label?: unknown }>(input).map((entry) => ({
		key: asString(entry.key),
		label: asString(entry.label),
	}));
}

function toRows(input: unknown): AdminSizeChartRow[] {
	return asArray<{ sizeValue?: unknown; label?: unknown; values?: unknown }>(input).map((row) => {
		const rawValues = (row.values ?? {}) as Record<string, unknown>;
		const values: Record<string, number> = {};
		for (const [key, value] of Object.entries(rawValues)) {
			values[key] = asNumber(value);
		}
		return {
			sizeValue: asString(row.sizeValue),
			label: asString(row.label),
			values,
		};
	});
}

export function toSizeChartResponse(chart: SizeChartLean): AdminSizeChart {
	return {
		id: objectIdString(chart._id),
		name: asString(chart.name),
		unitPrimary: chart.unitPrimary === "cm" ? "cm" : "in",
		measurementKeys: toMeasurementKeys(chart.measurementKeys),
		rows: toRows(chart.rows),
		fitAdvice: asString(chart.fitAdvice),
		notes: asString(chart.notes),
		isActive: chart.isActive ?? true,
		createdAt: toIsoDate(chart.createdAt),
		updatedAt: toIsoDate(chart.updatedAt),
	};
}
