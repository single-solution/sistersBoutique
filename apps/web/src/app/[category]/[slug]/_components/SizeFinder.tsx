"use client";

import { useState } from "react";
import { classNames, type SizeChart } from "@store/shared";

import { classifyBodyShape, BODY_SHAPE_DEFAULTS, BODY_SHAPE_LABEL, BODY_SHAPE_ORDER, INCH_TO_CM, type BodyMeasurements, type BodyShape } from "@/lib/catalog/sizeFit";

interface MeasurementField {
	key: keyof BodyMeasurements;
	label: string;
	min: number;
	max: number;
}

const FIELDS: MeasurementField[] = [
	{ key: "bust", label: "Bust", min: 24, max: 60 },
	{ key: "waist", label: "Waist", min: 20, max: 60 },
	{ key: "hip", label: "Hip", min: 24, max: 65 },
];

type MeasurementUnit = "in" | "cm";
type MeasurementValues = Record<keyof BodyMeasurements, string>;

function displayMeasurement(valueInches: number | undefined, unit: MeasurementUnit): string {
	if (valueInches === undefined) return "";
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
}

export function SizeFinder({ chart, measurements, onChange }: SizeFinderProps) {
	const [unit, setUnit] = useState<MeasurementUnit>("in");
	const [measurementValues, setMeasurementValues] = useState<MeasurementValues>(() => buildMeasurementValues(measurements, "in"));

	const handleField = (key: keyof BodyMeasurements, raw: string) => {
		setMeasurementValues((currentValues) => ({ ...currentValues, [key]: raw }));
		const parsed = Number.parseFloat(raw);
		const field = FIELDS.find((candidate) => candidate.key === key);
		if (!field || !Number.isFinite(parsed)) return;

		const valueInches = unit === "cm" ? parsed / INCH_TO_CM : parsed;
		if (valueInches < field.min || valueInches > field.max) return;

		onChange({ ...measurements, [key]: Math.round(valueInches * 10) / 10 });
	};

	const handleShapeSelect = (shapeKey: BodyShape) => {
		const defaults = BODY_SHAPE_DEFAULTS[shapeKey];
		setMeasurementValues(buildMeasurementValues(defaults, unit));
		onChange({ ...defaults });
	};

	const handleUnitChange = (nextUnit: MeasurementUnit) => {
		setUnit(nextUnit);
		setMeasurementValues(buildMeasurementValues(measurements, nextUnit));
	};

	const currentShape = classifyBodyShape(measurements) ?? "";

	return (
		<div className="space-y-3">
			{/* Unit Toggle */}
			<div className="flex items-center justify-between">
				<span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-ink-600)]">Detailed Inches/CM</span>
				<div className="flex rounded-full border border-[var(--color-ink-200)] bg-white/80 p-0.5" aria-label="Measurement unit">
					{(["in", "cm"] as const).map((unitOption) => (
						<button
							key={unitOption}
							type="button"
							onClick={() => handleUnitChange(unitOption)}
							className={classNames(
								"rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase transition-colors",
								unit === unitOption ? "bg-[var(--color-ink-900)] text-white" : "text-[var(--color-ink-500)]",
							)}
						>
							{unitOption}
						</button>
					))}
				</div>
			</div>

			{/* Quick Inputs: Bust, Waist, Hip */}
			<div className="grid grid-cols-3 gap-2">
				{FIELDS.map((field) => (
					<div key={field.key} className="space-y-0.5">
						<label className="text-[9px] font-bold uppercase tracking-wider text-[var(--color-ink-600)]">
							{field.label} ({unit})
						</label>
						<input
							type="number"
							inputMode="decimal"
							step={unit === "cm" ? "0.5" : "0.5"}
							value={measurementValues[field.key]}
							onChange={(e) => handleField(field.key, e.target.value)}
							className="w-full rounded-lg border border-[var(--color-ink-200)] bg-white/90 px-2 py-1 text-xs font-semibold text-[var(--color-ink-900)] shadow-2xs backdrop-blur-xs focus:border-[var(--color-ink-900)] focus:outline-hidden"
						/>
					</div>
				))}
			</div>
		</div>
	);
}

/** Standalone Body Shape Selector component for floating top image bar */
export function BodyShapeToggle({
	measurements,
	onChange,
}: {
	measurements: BodyMeasurements;
	onChange: (next: BodyMeasurements) => void;
}) {
	const currentShape = classifyBodyShape(measurements) ?? "";

	const handleShapeSelect = (shapeKey: BodyShape) => {
		const defaults = BODY_SHAPE_DEFAULTS[shapeKey];
		onChange({ ...defaults });
	};

	return (
		<div className="flex flex-wrap items-center justify-center gap-1">
			{BODY_SHAPE_ORDER.map((shapeKey) => {
				const isActive = currentShape === shapeKey;
				return (
					<button
						key={shapeKey}
						type="button"
						onClick={() => handleShapeSelect(shapeKey)}
						className={classNames(
							"rounded-full px-2.5 py-0.5 text-[10px] font-bold transition-all",
							isActive
								? "bg-[var(--color-ink-900)] text-white shadow-xs"
								: "bg-white/80 text-[var(--color-ink-700)] border border-white/60 hover:bg-white",
						)}
					>
						{BODY_SHAPE_LABEL[shapeKey]}
					</button>
				);
			})}
		</div>
	);
}
