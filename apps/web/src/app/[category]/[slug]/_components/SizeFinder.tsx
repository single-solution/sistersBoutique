"use client";

import { useState } from "react";
import { classNames, type SizeChart } from "@store/shared";

import { INCH_TO_CM, type BodyMeasurements } from "@/lib/catalog/sizeFit";

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

	return (
		<div className="space-y-3">
			{/* Unit Selector */}
			<div className="flex items-center justify-between">
				<span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--color-ink-700)]">Live Measurement Sliders</span>
				<div className="flex rounded-full border border-[var(--color-ink-200)] bg-white/80 p-0.5" aria-label="Measurement unit">
					{(["in", "cm"] as const).map((unitOption) => (
						<button
							key={unitOption}
							type="button"
							onClick={() => setUnit(unitOption)}
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
			<div className="space-y-2.5">
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
								<span className="rounded-md bg-[var(--color-ink-100)] px-2 py-0.5 font-mono text-[11px] font-bold text-[var(--color-ink-900)]">
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
