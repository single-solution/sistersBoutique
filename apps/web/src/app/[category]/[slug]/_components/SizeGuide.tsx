"use client";

import { useState } from "react";
import { classNames, type SizeChart } from "@store/shared";

import { inchesToCm } from "@/lib/catalog/sizeFit";

type Unit = "in" | "cm";

interface SizeGuideProps {
	chart: SizeChart;
	/** Currently selected variant size value (`xs`..`xl`), highlighted in the table. */
	selectedSizeValue: string | null;
}

/** Measurement table with an inch/cm toggle that highlights the selected size. */
export function SizeGuide({ chart, selectedSizeValue }: SizeGuideProps) {
	const [unit, setUnit] = useState<Unit>(chart.unitPrimary === "cm" ? "cm" : "in");

	const formatValue = (inches: number): string => {
		if (!Number.isFinite(inches) || inches <= 0) {
			return "—";
		}
		return unit === "cm" ? `${inchesToCm(inches)}` : `${Math.round(inches * 10) / 10}`;
	};

	return (
		<section aria-label="Size chart" className="space-y-4">
			<div className="flex items-center justify-between gap-3">
				<h3 className="text-base font-bold text-[var(--color-ink-900)]">{chart.name}</h3>
				<div className="inline-flex overflow-hidden rounded-full border border-[var(--color-ink-200)] text-[12px] font-semibold">
					{(["in", "cm"] as const).map((option) => (
						<button
							key={option}
							type="button"
							onClick={() => setUnit(option)}
							aria-pressed={unit === option}
							className={classNames(
								"px-3 py-1 uppercase tracking-[0.08em] transition-colors",
								unit === option ? "bg-[var(--color-ink-900)] text-[var(--color-canvas)]" : "text-[var(--color-ink-500)] hover:text-[var(--color-ink-900)]",
							)}
						>
							{option}
						</button>
					))}
				</div>
			</div>

			<div className="overflow-x-auto rounded-xl border border-[var(--color-ink-100)]">
				<table className="w-full border-collapse text-left text-[12.5px]">
					<thead>
						<tr className="border-b border-[var(--color-ink-200)] bg-[var(--color-ink-50)] text-[11px] uppercase tracking-[0.08em] text-[var(--color-ink-500)]">
							<th scope="col" className="py-2.5 pl-3.5 pr-2 font-semibold w-1">
								Size
							</th>
							{chart.measurementKeys.map((column) => (
								<th key={column.key} scope="col" className="px-2.5 py-2.5 font-semibold text-center whitespace-nowrap">
									{column.label}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{chart.rows.map((row) => {
							const isSelected = selectedSizeValue != null && row.sizeValue === selectedSizeValue;
							return (
								<tr
									key={row.sizeValue}
									className={classNames(
										"border-b border-[var(--color-ink-100)] last:border-b-0 transition-colors",
										isSelected ? "bg-[var(--color-accent-50)]/70" : "hover:bg-[var(--color-ink-50)]/50",
									)}
								>
									<th scope="row" className="py-2.5 pl-3.5 pr-2 font-semibold text-[var(--color-ink-800)] whitespace-nowrap">
										<div className="flex items-center gap-2">
											<span>{row.label}</span>
											{isSelected && (
												<span className="rounded-full bg-[var(--color-accent-600)] px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-[0.04em] text-white">Your size</span>
											)}
										</div>
									</th>
									{chart.measurementKeys.map((column) => (
										<td
											key={column.key}
											className={classNames(
												"px-2.5 py-2.5 text-center tabular-nums whitespace-nowrap",
												isSelected ? "font-bold text-[var(--color-ink-900)]" : "text-[var(--color-ink-700)]",
											)}
										>
											{formatValue(row.values[column.key])}
										</td>
									))}
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>
		</section>
	);
}
