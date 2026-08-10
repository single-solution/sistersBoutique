"use client";

import { useState } from "react";
import { classNames, type SizeChart, type SizeChartRow } from "@store/shared";

import { Input } from "@/components/ui/Input";
import { classifyBodyShape, BODY_SHAPE_DEFAULTS, BODY_SHAPE_LABEL, BODY_SHAPE_ORDER, INCH_TO_CM, type BodyMeasurements, type BodyShape } from "@/lib/catalog/sizeFit";

interface MeasurementField {
	key: keyof BodyMeasurements;
	label: string;
	placeholder: string;
	min: number;
	max: number;
}

const FIELDS: MeasurementField[] = [
	{ key: "bust", label: "Bust", placeholder: "e.g. 36", min: 24, max: 60 },
	{ key: "waist", label: "Waist", placeholder: "e.g. 30", min: 20, max: 60 },
	{ key: "hip", label: "Hip", placeholder: "e.g. 40", min: 24, max: 65 },
	{ key: "height", label: "Height", placeholder: "e.g. 64", min: 48, max: 84 },
	{ key: "armLength", label: "Arm length", placeholder: "e.g. 22", min: 17, max: 28 },
	{ key: "waistToFloor", label: "Waist to floor", placeholder: "e.g. 40", min: 34, max: 48 },
];

type MeasurementUnit = "in" | "cm";
type MeasurementValues = Record<keyof BodyMeasurements, string>;
type MeasurementErrors = Partial<Record<keyof BodyMeasurements, string>>;

function displayMeasurement(valueInches: number | undefined, unit: MeasurementUnit): string {
	if (valueInches === undefined) {
		return "";
	}
	const value = unit === "cm" ? valueInches * INCH_TO_CM : valueInches;

	return String(Math.round(value * 10) / 10);
}

function buildMeasurementValues(measurements: BodyMeasurements, unit: MeasurementUnit): MeasurementValues {
	return Object.fromEntries(FIELDS.map((field) => [field.key, displayMeasurement(measurements[field.key], unit)])) as MeasurementValues;
}

interface SizeFinderProps {
	chart: SizeChart;
	measurements: BodyMeasurements;
	onChange: (next: BodyMeasurements) => void;
	recommended: SizeChartRow | null;
	onSelectSize: (sizeValue: string) => void;
	/** Whether the recommended size is already the selected variant size. */
	isRecommendedSelected: boolean;
}

/** Measurement inputs that resolve a recommended size from the chart. */
export function SizeFinder({ chart, measurements, onChange, recommended, onSelectSize, isRecommendedSelected }: SizeFinderProps) {
	const [unit, setUnit] = useState<MeasurementUnit>("in");
	const [measurementValues, setMeasurementValues] = useState<MeasurementValues>(() => buildMeasurementValues(measurements, "in"));
	const [measurementErrors, setMeasurementErrors] = useState<MeasurementErrors>({});

	const handleField = (key: keyof BodyMeasurements, raw: string) => {
		setMeasurementValues((currentValues) => ({ ...currentValues, [key]: raw }));
		const parsed = Number.parseFloat(raw);
		const field = FIELDS.find((candidate) => candidate.key === key);
		if (!field || !Number.isFinite(parsed)) {
			setMeasurementErrors((currentErrors) => ({ ...currentErrors, [key]: "Enter a measurement." }));
			return;
		}
		const valueInches = unit === "cm" ? parsed / INCH_TO_CM : parsed;
		if (valueInches < field.min || valueInches > field.max) {
			const minimum = displayMeasurement(field.min, unit);
			const maximum = displayMeasurement(field.max, unit);
			setMeasurementErrors((currentErrors) => ({ ...currentErrors, [key]: `Use ${minimum}-${maximum} ${unit}.` }));
			return;
		}

		setMeasurementErrors((currentErrors) => ({ ...currentErrors, [key]: undefined }));
		onChange({ ...measurements, [key]: Math.round(valueInches * 10) / 10 });
	};

	const handleShapeSelect = (shapeKey: BodyShape) => {
		const defaults = BODY_SHAPE_DEFAULTS[shapeKey];
		setMeasurementValues(buildMeasurementValues(defaults, unit));
		setMeasurementErrors({});
		onChange({ ...defaults });
	};

	const handleUnitChange = (nextUnit: MeasurementUnit) => {
		setUnit(nextUnit);
		setMeasurementValues(buildMeasurementValues(measurements, nextUnit));
		setMeasurementErrors({});
	};

	const currentShape = classifyBodyShape(measurements) ?? "";

	return (
		<section aria-label="Find my size" className="space-y-4">
			<div>
				<h3 className="text-sm font-semibold text-[var(--color-ink-900)]">Find my size</h3>
				<p className="text-[12px] text-[var(--color-ink-500)]">Adjust the realistic starting measurements. Sleeve, inseam, thigh, and upper arm are estimated automatically.</p>
			</div>

			<div className="space-y-2">
				<label className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--color-ink-500)]">Quick start by shape</label>
				<div className="flex flex-wrap gap-2">
					{BODY_SHAPE_ORDER.map((shapeKey) => {
						const isActive = currentShape === shapeKey;
						return (
							<button
								key={shapeKey}
								type="button"
								onClick={() => handleShapeSelect(shapeKey)}
								className={classNames(
									"min-h-11 rounded-full border px-3.5 py-1.5 text-[12px] font-medium transition-colors",
									isActive
										? "border-[var(--color-ink-900)] bg-[var(--color-ink-900)] text-[var(--color-canvas)]"
										: "border-[var(--color-ink-200)] bg-transparent text-[var(--color-ink-700)] hover:border-[var(--color-ink-400)] hover:text-[var(--color-ink-900)]",
								)}
							>
								{BODY_SHAPE_LABEL[shapeKey]}
							</button>
						);
					})}
				</div>
			</div>

			<div className="flex items-center justify-between gap-3">
				<span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--color-ink-500)]">Measurement unit</span>
				<div className="flex rounded-full border border-[var(--color-ink-100)] bg-[var(--color-canvas-deep)] p-0.5" aria-label="Measurement unit">
					{(["in", "cm"] as const).map((unitOption) => (
						<button
							key={unitOption}
							type="button"
							aria-pressed={unit === unitOption}
							onClick={() => handleUnitChange(unitOption)}
							className={classNames(
								"min-h-11 min-w-11 rounded-full px-3 text-[12px] font-semibold uppercase transition-colors",
								unit === unitOption ? "bg-[var(--color-surface)] text-[var(--color-ink-900)] shadow-sm" : "text-[var(--color-ink-500)]",
							)}
						>
							{unitOption}
						</button>
					))}
				</div>
			</div>

			<div className="grid grid-cols-2 gap-3">
				{FIELDS.map((field) => (
					<Input
						key={field.key}
						label={`${field.label} (${unit})`}
						type="number"
						inputMode="decimal"
						min={displayMeasurement(field.min, unit)}
						max={displayMeasurement(field.max, unit)}
						step={unit === "cm" ? "0.1" : "0.5"}
						inputSize="sm"
						placeholder={unit === "cm" ? displayMeasurement(Number.parseFloat(field.placeholder.replace("e.g. ", "")), "cm") : field.placeholder}
						value={measurementValues[field.key]}
						error={measurementErrors[field.key]}
						aria-invalid={Boolean(measurementErrors[field.key])}
						onChange={(event) => handleField(field.key, event.target.value)}
					/>
				))}
			</div>

			{recommended ? (
				<div className="flex flex-col gap-3 rounded-[var(--radius-lg)] border border-[var(--color-accent-200)] bg-[var(--color-accent-50)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
					<p className="text-[13px] text-[var(--color-ink-700)]">
						We suggest size <span className="font-semibold text-[var(--color-ink-900)]">{recommended.label}</span>
					</p>
					<button
						type="button"
						onClick={() => onSelectSize(recommended.sizeValue)}
						disabled={isRecommendedSelected}
						className="rounded-full bg-[var(--color-ink-900)] px-3.5 py-1.5 text-[12px] font-semibold text-[var(--color-canvas)] transition-opacity disabled:opacity-50"
					>
						{isRecommendedSelected ? "Selected" : "Use this size"}
					</button>
				</div>
			) : (
				<p className="text-[12px] text-[var(--color-ink-400)]">Add at least your bust to see a suggestion. Guidance only - fit varies by cut.</p>
			)}
		</section>
	);
}
