import mongoose, { Schema, type Model } from "mongoose";

/**
 * A reusable size chart template. Products resolve an effective chart through
 * an inheritance chain (product override -> brand default -> category default),
 * so one chart can back a whole category or brand without per-product authoring.
 *
 * Measurements are stored canonically in **inches**; the storefront derives cm
 * on display. Row `sizeValue`s mirror the `size` attribute option values
 * (`xs`..`xl`) so the storefront can highlight the customer's selected variant
 * size inside the chart.
 */

/** One ordered measurement column, e.g. `{ key: "bust", label: "Bust" }`. */
export interface SizeChartMeasurementKey {
	key: string;
	label: string;
}

/** One size row; `values` maps each measurement key to inches. */
export interface SizeChartRow {
	/** Matches a `size` attribute option value (`xs`..`xl`). */
	sizeValue: string;
	label: string;
	values: Record<string, number>;
}

export interface SizeChartAttributes {
	name: string;
	unitPrimary: "in" | "cm";
	measurementKeys: SizeChartMeasurementKey[];
	rows: SizeChartRow[];
	/** Short prose shown under the chart (how this cut is meant to sit). */
	fitAdvice?: string;
	/** Optional extra care/measurement notes. */
	notes?: string;
	isActive: boolean;
}

const SIZE_CHART_NAME_MAX_LENGTH = 120;
const MEASUREMENT_KEY_MAX_LENGTH = 40;
const MEASUREMENT_LABEL_MAX_LENGTH = 60;
const SIZE_VALUE_MAX_LENGTH = 32;
const FIT_ADVICE_MAX_LENGTH = 600;
const NOTES_MAX_LENGTH = 600;

const measurementKeySchema = new Schema<SizeChartMeasurementKey>(
	{
		key: { type: String, required: true, trim: true, lowercase: true, maxlength: MEASUREMENT_KEY_MAX_LENGTH },
		label: { type: String, required: true, trim: true, maxlength: MEASUREMENT_LABEL_MAX_LENGTH },
	},
	{ _id: false },
);

const sizeChartRowSchema = new Schema<SizeChartRow>(
	{
		sizeValue: { type: String, required: true, trim: true, lowercase: true, maxlength: SIZE_VALUE_MAX_LENGTH },
		label: { type: String, required: true, trim: true, maxlength: SIZE_VALUE_MAX_LENGTH },
		values: {
			type: Schema.Types.Mixed,
			required: true,
			default: {} as Record<string, number>,
		},
	},
	{ _id: false },
);

const sizeChartSchema = new Schema<SizeChartAttributes>(
	{
		name: { type: String, required: true, trim: true, maxlength: SIZE_CHART_NAME_MAX_LENGTH },
		unitPrimary: { type: String, required: true, enum: ["in", "cm"], default: "in" },
		measurementKeys: { type: [measurementKeySchema], required: true, default: [] },
		rows: { type: [sizeChartRowSchema], required: true, default: [] },
		fitAdvice: { type: String, required: false, trim: true, maxlength: FIT_ADVICE_MAX_LENGTH, default: "" },
		notes: { type: String, required: false, trim: true, maxlength: NOTES_MAX_LENGTH, default: "" },
		isActive: { type: Boolean, required: true, default: true },
	},
	{ timestamps: true },
);

sizeChartSchema.index({ isActive: 1, name: 1 });

export const SizeChart: Model<SizeChartAttributes> = (mongoose.models.SizeChart as Model<SizeChartAttributes>) ?? mongoose.model<SizeChartAttributes>("SizeChart", sizeChartSchema);
