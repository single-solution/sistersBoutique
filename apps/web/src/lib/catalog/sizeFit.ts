/**
 * Client-safe size & fit helpers for the PDP Size & Fit experience.
 *
 * Charts store measurements canonically in inches; the storefront derives cm on
 * display. The recommender matches primarily on bust, then waist/hip, and rounds
 * up when a shopper falls between two sizes (avoids too-tight).
 */
import type { SizeChart, SizeChartRow } from "@store/shared";

export const INCH_TO_CM = 2.54;

/** Measurement keys the recommender + silhouette understand, in priority order. */
export const PRIMARY_MEASUREMENT_KEYS = ["bust", "waist", "hip"] as const;
export type PrimaryMeasurementKey = (typeof PRIMARY_MEASUREMENT_KEYS)[number];

export interface BodyMeasurements {
	bust?: number;
	waist?: number;
	hip?: number;
	/** Optional total height in inches - scales the silhouette. */
	height?: number;
	armLength?: number;
	waistToFloor?: number;
}

export interface CompleteBodyMeasurements extends Required<BodyMeasurements> {
	inseam: number;
	sleeveLength: number;
	thigh: number;
	upperArm: number;
}

export type BodyShape = "hourglass" | "pear" | "apple" | "rectangle";

export const BODY_SHAPE_ORDER = ["hourglass", "pear", "apple", "rectangle"] as const satisfies readonly BodyShape[];

export const BODY_SHAPE_LABEL: Record<BodyShape, string> = {
	hourglass: "Hourglass",
	pear: "Pear",
	apple: "Apple",
	rectangle: "Rectangle",
};

const SURVEY_REFERENCE_HEIGHT = 64;
const SURVEY_REFERENCE_ARM_LENGTH = 21.7;
const SURVEY_REFERENCE_WAIST_TO_FLOOR = 38.5;

export const BODY_SHAPE_DEFAULTS: Record<BodyShape, Required<BodyMeasurements>> = {
	hourglass: {
		bust: 37,
		waist: 29,
		hip: 38,
		height: SURVEY_REFERENCE_HEIGHT,
		armLength: SURVEY_REFERENCE_ARM_LENGTH,
		waistToFloor: SURVEY_REFERENCE_WAIST_TO_FLOOR,
	},
	pear: {
		bust: 35,
		waist: 30,
		hip: 40,
		height: SURVEY_REFERENCE_HEIGHT,
		armLength: SURVEY_REFERENCE_ARM_LENGTH,
		waistToFloor: SURVEY_REFERENCE_WAIST_TO_FLOOR,
	},
	apple: {
		bust: 39,
		waist: 36,
		hip: 39,
		height: SURVEY_REFERENCE_HEIGHT,
		armLength: SURVEY_REFERENCE_ARM_LENGTH,
		waistToFloor: SURVEY_REFERENCE_WAIST_TO_FLOOR,
	},
	rectangle: {
		bust: 36,
		waist: 32,
		hip: 37,
		height: SURVEY_REFERENCE_HEIGHT,
		armLength: SURVEY_REFERENCE_ARM_LENGTH,
		waistToFloor: SURVEY_REFERENCE_WAIST_TO_FLOOR,
	},
};

export const DEFAULT_BODY_SHAPE = BODY_SHAPE_ORDER[0];
export const DEFAULT_BODY_INPUT_MEASUREMENTS = BODY_SHAPE_DEFAULTS[DEFAULT_BODY_SHAPE];

const ARM_LENGTH_TO_HEIGHT_RATIO = 0.3393;
const INSEAM_TO_HEIGHT_RATIO = 0.4804;
const THIGH_TO_HEIGHT_RATIO = 0.3784;
const UPPER_ARM_TO_HEIGHT_RATIO = 0.1876;
const WAIST_TO_FLOOR_TO_HEIGHT_RATIO = 0.6019;

export const DEFAULT_BODY_MEASUREMENTS: CompleteBodyMeasurements = {
	...DEFAULT_BODY_INPUT_MEASUREMENTS,
	inseam: SURVEY_REFERENCE_HEIGHT * INSEAM_TO_HEIGHT_RATIO,
	thigh: SURVEY_REFERENCE_HEIGHT * THIGH_TO_HEIGHT_RATIO,
	upperArm: SURVEY_REFERENCE_HEIGHT * UPPER_ARM_TO_HEIGHT_RATIO,
	sleeveLength: SURVEY_REFERENCE_ARM_LENGTH,
};

const BODY_MEASUREMENT_CHART_KEYS: Record<keyof BodyMeasurements, readonly string[]> = {
	bust: ["bust", "chest"],
	waist: ["waist"],
	hip: ["hip"],
	height: ["height"],
	armLength: ["armLength"],
	waistToFloor: ["waistToFloor", "trouserLength", "trouser"],
};

/** Round to one decimal for display without trailing-zero noise. */
export function inchesToCm(inches: number): number {
	return Math.round(inches * INCH_TO_CM * 10) / 10;
}

/** Whether the chart exposes a given measurement column. */
export function chartHasKey(chart: SizeChart, key: string): boolean {
	return chart.measurementKeys.some((column) => column.key === key);
}

/** The first primary key the chart actually carries (bust, waist, then hip). */
export function primaryKeyForChart(chart: SizeChart): PrimaryMeasurementKey | null {
	return PRIMARY_MEASUREMENT_KEYS.find((key) => chartHasKey(chart, key)) ?? null;
}

/**
 * Recommend a size row for the entered measurements. Matches on the highest
 * priority key present in both the chart and the input; picks the smallest row
 * whose value is at least the shopper's measurement (round up), falling back to the
 * largest row when the shopper exceeds every listed size.
 */
export const CRITICAL_BODY_KEYS = ["bust", "chest", "waist", "hip"] as const;

export function recommendSize(chart: SizeChart, measurements: BodyMeasurements): SizeChartRow | null {
	if (!chart.rows || chart.rows.length === 0) {
		return null;
	}

	const comparisons = Object.entries(measurements)
		.map(([measurementKey, target]) => {
			if (typeof target !== "number" || !Number.isFinite(target) || target <= 0) {
				return null;
			}
			const candidates = BODY_MEASUREMENT_CHART_KEYS[measurementKey as keyof BodyMeasurements] ?? [measurementKey];
			const chartKey = candidates.find((candidate) => chartHasKey(chart, candidate)) ?? (chartHasKey(chart, measurementKey) ? measurementKey : null);

			return chartKey ? { chartKey, target } : null;
		})
		.filter((comparison): comparison is { chartKey: string; target: number } => comparison !== null);

	if (comparisons.length === 0) {
		return null;
	}

	// Focus primarily on critical body circumferences (Bust, Waist, Hip) so length preferences do not distort size recommendations
	const criticalComparisons = comparisons.filter((c) =>
		CRITICAL_BODY_KEYS.some((key) => c.chartKey.toLowerCase().includes(key)),
	);
	const activeComparisons = criticalComparisons.length > 0 ? criticalComparisons : comparisons;

	// Primary sort by Bust / Chest ascending
	const primaryComparison =
		activeComparisons.find((c) => c.chartKey.toLowerCase().includes("bust") || c.chartKey.toLowerCase().includes("chest")) ??
		activeComparisons[0];

	const sortedRows = chart.rows
		.filter((row) => typeof row.values[primaryComparison.chartKey] === "number")
		.slice()
		.sort((left, right) => (left.values[primaryComparison.chartKey] ?? 0) - (right.values[primaryComparison.chartKey] ?? 0));

	if (sortedRows.length === 0) {
		return null;
	}

	// Pick the smallest size row where all active body circumferences fit safely (rowValue >= userTarget)
	const fittingRow = sortedRows.find((row) =>
		activeComparisons.every((comp) => {
			const rowValue = row.values[comp.chartKey];
			return typeof rowValue !== "number" || rowValue >= comp.target;
		}),
	);

	return fittingRow ?? sortedRows[sortedRows.length - 1];
}

/** Fill optional measurements with guarded ratios from public adult female anthropometry data. */
export function completeBodyMeasurements(measurements: BodyMeasurements): CompleteBodyMeasurements {
	const bust = measurements.bust ?? DEFAULT_BODY_MEASUREMENTS.bust;
	const waist = measurements.waist ?? DEFAULT_BODY_MEASUREMENTS.waist;
	const hip = measurements.hip ?? DEFAULT_BODY_MEASUREMENTS.hip;
	const height = measurements.height ?? DEFAULT_BODY_MEASUREMENTS.height;
	const armLength = measurements.armLength ?? height * ARM_LENGTH_TO_HEIGHT_RATIO;

	return {
		bust,
		waist,
		hip,
		height,
		armLength,
		waistToFloor: measurements.waistToFloor ?? height * WAIST_TO_FLOOR_TO_HEIGHT_RATIO,
		inseam: height * INSEAM_TO_HEIGHT_RATIO,
		thigh: height * THIGH_TO_HEIGHT_RATIO + (hip - DEFAULT_BODY_MEASUREMENTS.hip) * 0.35,
		upperArm: height * UPPER_ARM_TO_HEIGHT_RATIO + (bust - DEFAULT_BODY_MEASUREMENTS.bust) * 0.18,
		sleeveLength: armLength,
	};
}

/**
 * Classify a female body shape from bust/waist/hip. Deliberately coarse - this
 * drives an illustrative silhouette, not a fitting guarantee.
 */
export function classifyBodyShape(measurements: BodyMeasurements): BodyShape | null {
	const { bust, waist, hip } = measurements;
	if (!bust || !waist || !hip) {
		return null;
	}
	if (bust <= 0 || waist <= 0 || hip <= 0) {
		return null;
	}

	const waistToHip = waist / hip;
	const waistToBust = waist / bust;

	// Apple: Waist is large relative to hips and bust
	if (waistToHip >= 0.9 || waistToBust >= 0.9) {
		return "apple";
	}

	// Pear: Hips are significantly larger than bust
	if (hip - bust >= 3) {
		return "pear";
	}

	// Hourglass: Waist is significantly smaller than both, bust and hip are similar
	if (waistToHip <= 0.8 && waistToBust <= 0.8 && Math.abs(bust - hip) < 3.5) {
		return "hourglass";
	}

	// Default to rectangle if no strong curves
	return "rectangle";
}
