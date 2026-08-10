"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Ruler, X } from "lucide-react";
import { classNames, type SizeChart, type SizeChartRow } from "@store/shared";

import { SizeGuide } from "./SizeGuide";
import { SizeFinder } from "./SizeFinder";
import { FitPreview } from "./FitPreview";
import { completeBodyMeasurements, DEFAULT_BODY_INPUT_MEASUREMENTS, DEFAULT_BODY_MEASUREMENTS, recommendSize, type BodyMeasurements } from "@/lib/catalog/sizeFit";

interface SizeAndFitProps {
	garmentType: "stitched" | "unstitched";
	chart: SizeChart | null;
	selectedSizeValue: string | null;
	onSelectSize: (sizeValue: string) => void;
	/** Unstitched context shown in the tailoring guidance. */
	fabricLabel?: string;
	piecesLabel?: string;
	className?: string;
}

/** Columns whose lengths translate to garment hemline overlays on the silhouette. */
const HEMLINE_KEY_PATTERN = /kameez|shirt|trouser|shalwar|hem/;

const TAILOR_MEASUREMENTS = ["Shoulder", "Bust / chest", "Waist", "Hip", "Shirt (kameez) length", "Sleeve length", "Trouser / shalwar length"];

function garmentHemlines(chart: SizeChart, row: SizeChartRow | null): Array<{ label: string; lengthInches: number }> {
	if (!row) {
		return [];
	}
	const hemlines: Array<{ label: string; lengthInches: number }> = [];
	for (const column of chart.measurementKeys) {
		const value = row.values[column.key];
		if (typeof value === "number" && value > 0 && HEMLINE_KEY_PATTERN.test(column.key.toLowerCase())) {
			hemlines.push({ label: column.label, lengthInches: value });
		}
	}
	return hemlines;
}

export function SizeAndFit({ garmentType, chart, selectedSizeValue, onSelectSize, fabricLabel, piecesLabel, className }: SizeAndFitProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [isMounted, setIsMounted] = useState(false);
	const [measurements, setMeasurements] = useState<BodyMeasurements>(() => ({ ...DEFAULT_BODY_INPUT_MEASUREMENTS }));

	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect -- portal target only exists after mount
		setIsMounted(true);
	}, []);

	useEffect(() => {
		if (!isOpen) {
			return;
		}
		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		function handleKeyDown(event: KeyboardEvent) {
			if (event.key === "Escape") {
				setIsOpen(false);
			}
		}
		window.addEventListener("keydown", handleKeyDown);
		return () => {
			document.body.style.overflow = previousOverflow;
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [isOpen]);

	const recommended = useMemo(() => (chart ? recommendSize(chart, measurements) : null), [chart, measurements]);
	const selectedRow = useMemo(() => chart?.rows.find((row) => row.sizeValue === selectedSizeValue) ?? null, [chart, selectedSizeValue]);

	const previewRow = selectedRow ?? recommended;
	const previewBust = measurements.bust ?? previewRow?.values.bust ?? DEFAULT_BODY_MEASUREMENTS.bust;
	const previewWaist = measurements.waist ?? previewRow?.values.waist ?? DEFAULT_BODY_MEASUREMENTS.waist;
	const previewHip = measurements.hip ?? previewRow?.values.hip ?? DEFAULT_BODY_MEASUREMENTS.hip;
	const previewMeasurements = completeBodyMeasurements({
		...measurements,
		bust: previewBust,
		waist: previewWaist,
		hip: previewHip,
	});
	const hemlines = chart ? garmentHemlines(chart, previewRow) : [];

	const triggerLabel = garmentType === "unstitched" ? "Fit & tailoring" : "Size guide";

	return (
		<>
			<button
				type="button"
				onClick={() => setIsOpen(true)}
				className={classNames(
					"inline-flex items-center gap-1.5 text-[12px] font-semibold text-[var(--color-accent-700)] underline decoration-[var(--color-accent-300)] underline-offset-2 transition-colors hover:text-[var(--color-accent-800)]",
					className,
				)}
			>
				<Ruler size={13} aria-hidden />
				{triggerLabel}
			</button>

			{isMounted && isOpen
				? createPortal(
						<div role="dialog" aria-modal="true" aria-label="Size and fit" className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-4">
							<button type="button" aria-label="Close size and fit" onClick={() => setIsOpen(false)} className="absolute inset-0 bg-[var(--color-ink-900)]/40 animate-sheet-fade" />
							<div className="relative flex max-h-[min(90vh,760px)] w-full max-w-2xl flex-col overflow-hidden rounded-[var(--radius-2xl)] border border-[var(--color-ink-100)] bg-[var(--color-surface)] shadow-[var(--shadow-lg)] animate-dialog-in">
								<div className="flex shrink-0 items-center justify-between border-b border-[var(--color-ink-100)] px-4 py-3 md:px-5">
									<h2 className="text-[15px] font-semibold text-[var(--color-ink-900)] md:text-base">Size &amp; fit</h2>
									<button
										type="button"
										aria-label="Close"
										onClick={() => setIsOpen(false)}
										className="tap rounded-full p-1.5 text-[var(--color-ink-500)] transition-colors hover:bg-[var(--color-ink-50)] hover:text-[var(--color-ink-900)]"
									>
										<X size={18} />
									</button>
								</div>

								<div className="flex-1 space-y-6 overflow-y-auto px-4 py-4 md:px-5 md:py-5">
									{garmentType === "unstitched" ? (
										<UnstitchedFitNotes fabricLabel={fabricLabel} piecesLabel={piecesLabel} />
									) : chart ? (
										<>
											<div className="flex flex-col-reverse sm:flex-row items-center sm:items-start gap-4 md:gap-6">
												<div className="w-full flex-1 min-w-0">
													<SizeFinder
														chart={chart}
														measurements={measurements}
														onChange={setMeasurements}
														recommended={recommended}
														onSelectSize={onSelectSize}
														isRecommendedSelected={recommended != null && recommended.sizeValue === selectedSizeValue}
													/>
												</div>
												<div className="w-full sm:w-2/5 min-w-36 max-w-48 sm:max-w-56 shrink-0">
													<FitPreview
													measurements={{ bust: previewBust, waist: previewWaist, hip: previewHip }}
													garment={hemlines}
												/>
												</div>
											</div>
											<SizeGuide chart={chart} selectedSizeValue={selectedSizeValue} />
										</>
									) : null}
								</div>
							</div>
						</div>,
						document.body,
					)
				: null}
		</>
	);
}

function UnstitchedFitNotes({ fabricLabel, piecesLabel }: { fabricLabel?: string; piecesLabel?: string }) {
	return (
		<section aria-label="Fit and tailoring" className="space-y-4">
			<div className="space-y-1">
				<h3 className="text-sm font-semibold text-[var(--color-ink-900)]">Made to measure</h3>
				<p className="text-[13px] leading-relaxed text-[var(--color-ink-600)]">
					This is an unstitched suit - there is no ready size. Your tailor cuts it to your own measurements, so the finished length, sleeve, and fit stay entirely yours.
				</p>
			</div>

			{(fabricLabel || piecesLabel) && (
				<dl className="grid grid-cols-2 gap-3 text-[13px]">
					{piecesLabel ? (
						<div className="rounded-[var(--radius-lg)] border border-[var(--color-ink-100)] px-3 py-2">
							<dt className="text-[11px] uppercase tracking-[0.1em] text-[var(--color-ink-400)]">Pieces</dt>
							<dd className="font-semibold text-[var(--color-ink-800)]">{piecesLabel}</dd>
						</div>
					) : null}
					{fabricLabel ? (
						<div className="rounded-[var(--radius-lg)] border border-[var(--color-ink-100)] px-3 py-2">
							<dt className="text-[11px] uppercase tracking-[0.1em] text-[var(--color-ink-400)]">Fabric</dt>
							<dd className="font-semibold text-[var(--color-ink-800)]">{fabricLabel}</dd>
						</div>
					) : null}
				</dl>
			)}

			<div className="space-y-2">
				<h4 className="text-[13px] font-semibold text-[var(--color-ink-900)]">Measurements to give your tailor</h4>
				<ul className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[13px] text-[var(--color-ink-600)]">
					{TAILOR_MEASUREMENTS.map((label) => (
						<li key={label} className="flex items-center gap-2">
							<span className="size-1.5 rounded-full bg-[var(--color-accent-400)]" aria-hidden />
							{label}
						</li>
					))}
				</ul>
				<p className="text-[12px] text-[var(--color-ink-400)]">Take measurements over light clothing and share them with your tailor for the closest fit.</p>
			</div>
		</section>
	);
}
