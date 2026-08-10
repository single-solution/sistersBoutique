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
	{ key: "bust", label: "Bust", min: 28, max: 54 },
	{ key: "waist", label: "Waist", min: 22, max: 48 },
	{ key: "hip", label: "Hip", min: 32, max: 58 },
];

type MeasurementUnit = "in" | "cm";

function displayValue(valueInches: number | undefined, unit: MeasurementUnit): number {
	if (valueInches === undefined) return 0;
	const val = unit === "cm" ? valueInches * INCH_TO_CM : valueInches;
	return Math.round(val * 10) / 10;
}

interface SizeFinderProps {
	chart: SizeChart;
	measurements: BodyMeasurements;
	onChange: (next: BodyMeasurements) => void;
}

export function SizeFinder({ chart, measurements, onChange }: SizeFinderProps) {
	const [unit, setUnit] = useState<MeasurementUnit>("in");

	const handleSlider = (key: keyof BodyMeasurements, rawValue: number) => {
		const valueInches = unit === "cm" ? rawValue / INCH_TO_CM : rawValue;
		onChange({ ...measurements, [key]: Math.round(valueInches * 10) / 10 });
	};

	const handleUnitChange = (nextUnit: MeasurementUnit) => {
		setUnit(nextUnit);
	};

	return (
		<div className="space-y-3.5">
			{/* Unit Selector */}
			<div className="flex items-center justify-between">
				<span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--color-ink-700)]">Live Measurement Sliders</span>
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

			{/* Interactive Range Sliders */}
			<div className="space-y-3">
				{FIELDS.map((field) => {
					const valInches = measurements[field.key] ?? field.min;
					const currentVal = displayValue(valInches, unit);
					const minVal = displayValue(field.min, unit);
					const maxVal = displayValue(field.max, unit);
					const step = unit === "cm" ? 0.5 : 0.5;

					return (
						<div key={field.key} className="space-y-1">
							<div className="flex items-center justify-between text-xs font-semibold text-[var(--color-ink-900)]">
								<label htmlFor={`slider-${field.key}`} className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-ink-600)]">
									{field.label}
								</label>
								<span className="rounded-md bg-[var(--color-ink-100)] px-2 py-0.5 font-mono text-xs font-bold text-[var(--color-ink-900)]">
									{currentVal} {unit}
								</span>
							</div>

							<input
								id={`slider-${field.key}`}
								type="range"
								min={minVal}
								max={maxVal}
								step={step}
								value={currentVal}
								onChange={(e) => handleSlider(field.key, Number.parseFloat(e.target.value))}
								className="w-full accent-[var(--color-ink-900)] cursor-pointer h-1.5 rounded-lg bg-[var(--color-ink-200)]"
							/>
						</div>
					);
				})}
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
