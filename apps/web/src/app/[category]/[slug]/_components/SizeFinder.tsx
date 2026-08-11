"use client";

import { classNames, type SizeChart } from "@store/shared";
import { INCH_TO_CM, type BodyMeasurements } from "@/lib/catalog/sizeFit";

type MeasurementUnit = "in" | "cm";

interface SizeFinderProps {
	chart: SizeChart;
	measurements: BodyMeasurements;
	unit: MeasurementUnit;
	onUnitChange?: (unit: MeasurementUnit) => void;
	onChange: (next: BodyMeasurements) => void;
	className?: string;
}

function displayValue(valueInches: number | undefined, unit: MeasurementUnit): number {
	if (valueInches === undefined || !Number.isFinite(valueInches)) return 0;
	const val = unit === "cm" ? valueInches * INCH_TO_CM : valueInches;
	return Math.round(val * 10) / 10;
}

/** Determine logical min, max, and default starting value for a measurement key from chart rows. */
function getRangeForKey(chart: SizeChart, key: string): { min: number; max: number; defaultVal: number } {
	const values = chart.rows
		.map((row) => row.values[key])
		.filter((val): val is number => typeof val === "number" && Number.isFinite(val) && val > 0);

	if (values.length > 0) {
		const minVal = Math.min(...values);
		const maxVal = Math.max(...values);
		const midIndex = Math.floor(values.length / 2);
		const defaultVal = values[midIndex] ?? values[0];
		return {
			min: Math.max(10, Math.floor(minVal - 4)),
			max: Math.ceil(maxVal + 6),
			defaultVal,
		};
	}

	if (key === "bust") return { min: 26, max: 56, defaultVal: 37 };
	if (key === "waist") return { min: 20, max: 52, defaultVal: 29 };
	if (key === "hip") return { min: 30, max: 62, defaultVal: 38 };
	return { min: 15, max: 55, defaultVal: 38 };
}

export function SizeFinder({ chart, measurements, unit, onUnitChange, onChange, className = "" }: SizeFinderProps) {
	// Dynamically build slider fields ONLY for measurement keys present in the size chart table
	const fields = chart.measurementKeys.map((col) => {
		const range = getRangeForKey(chart, col.key);
		return {
			key: col.key as keyof BodyMeasurements,
			label: col.label,
			min: range.min,
			max: range.max,
			defaultVal: range.defaultVal,
		};
	});

	const handleSlider = (key: keyof BodyMeasurements, rawValue: number) => {
		const valueInches = unit === "cm" ? rawValue / INCH_TO_CM : rawValue;
		onChange({ ...measurements, [key]: Math.round(valueInches * 10) / 10 });
	};

	return (
		<div className={`space-y-4 select-none ${className}`}>
			{/* Unit Toggle inside Slider Card */}
			{onUnitChange && (
				<div className="flex items-center justify-between pb-3 border-b border-[var(--color-ink-100)]">
					<div>
						<span className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--color-ink-900)]">Unit System</span>
						<p className="text-[10px] text-[var(--color-ink-500)]">Select measurement unit</p>
					</div>
					<div className="flex overflow-hidden rounded-full border border-[var(--color-ink-200)] bg-white p-0.5 shadow-2xs" aria-label="Unit toggle">
						<button
							type="button"
							onClick={() => onUnitChange("in")}
							className={classNames(
								"rounded-full px-3 py-1 text-[10.5px] font-extrabold uppercase transition-colors",
								unit === "in" ? "bg-[var(--color-ink-900)] text-white shadow-2xs" : "text-[var(--color-ink-600)] hover:text-[var(--color-ink-900)]",
							)}
						>
							IN
						</button>
						<button
							type="button"
							onClick={() => onUnitChange("cm")}
							className={classNames(
								"rounded-full px-3 py-1 text-[10.5px] font-extrabold uppercase transition-colors",
								unit === "cm" ? "bg-[var(--color-ink-900)] text-white shadow-2xs" : "text-[var(--color-ink-600)] hover:text-[var(--color-ink-900)]",
							)}
						>
							CM
						</button>
					</div>
				</div>
			)}

			<div className="space-y-4">
				{fields.map((field) => {
					const valInches = measurements[field.key] ?? field.defaultVal;
					const currentVal = displayValue(valInches, unit);
					const minVal = displayValue(field.min, unit);
					const maxVal = displayValue(field.max, unit);
					const step = unit === "cm" ? 0.5 : 0.5;

					return (
						<div key={field.key} className="space-y-1.5">
							<div className="flex items-center justify-between text-xs font-semibold text-[var(--color-ink-900)]">
								<label htmlFor={`slider-${field.key}`} className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--color-ink-800)]">
									{field.label}
								</label>
								<span className="rounded-md bg-white px-2.5 py-0.5 font-mono text-[11.5px] font-black text-[var(--color-ink-900)] shadow-2xs border border-[var(--color-ink-100)]">
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
								className="w-full accent-[var(--color-ink-900)] cursor-pointer h-2 rounded-lg bg-[var(--color-ink-200)]"
							/>
						</div>
					);
				})}
			</div>
		</div>
	);
}
