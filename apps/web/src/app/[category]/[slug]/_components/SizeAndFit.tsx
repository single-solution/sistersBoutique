"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Ruler, Table2, X, ChevronDown, ChevronUp } from "lucide-react";
import { classNames, type SizeChart, type SizeChartRow } from "@store/shared";

import { SizeGuide } from "./SizeGuide";
import { SizeFinder } from "./SizeFinder";
import { FitPreview } from "./FitPreview";
import { DEFAULT_BODY_INPUT_MEASUREMENTS, DEFAULT_BODY_MEASUREMENTS, recommendSize, type BodyMeasurements } from "@/lib/catalog/sizeFit";

interface SizeAndFitProps {
	garmentType: "stitched" | "unstitched";
	chart: SizeChart | null;
	selectedSizeValue: string | null;
	onSelectSize: (sizeValue: string) => void;
	fabricLabel?: string;
	piecesLabel?: string;
	className?: string;
}

const HEMLINE_KEY_PATTERN = /kameez|shirt|trouser|shalwar|hem/;

function garmentHemlines(chart: SizeChart, row: SizeChartRow | null): Array<{ label: string; lengthInches: number }> {
	if (!row) return [];
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
	const [isTableOpen, setIsTableOpen] = useState(false);
	const [isControlsExpanded, setIsControlsExpanded] = useState(true);
	const [isMounted, setIsMounted] = useState(false);
	const [measurements, setMeasurements] = useState<BodyMeasurements>(() => ({ ...DEFAULT_BODY_INPUT_MEASUREMENTS }));

	useEffect(() => {
		setIsMounted(true);
	}, []);

	useEffect(() => {
		if (!isOpen) return;

		const originalOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";

		function handleKeyDown(event: KeyboardEvent) {
			if (event.key === "Escape") {
				if (isTableOpen) {
					setIsTableOpen(false);
				} else {
					setIsOpen(false);
				}
			}
		}

		window.addEventListener("keydown", handleKeyDown);
		return () => {
			document.body.style.overflow = originalOverflow;
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [isOpen, isTableOpen]);

	const recommended = useMemo(() => (chart ? recommendSize(chart, measurements) : null), [chart, measurements]);
	const selectedRow = useMemo(() => chart?.rows.find((row) => row.sizeValue === selectedSizeValue) ?? null, [chart, selectedSizeValue]);

	const previewRow = selectedRow ?? recommended;
	const previewBust = measurements.bust ?? previewRow?.values.bust ?? DEFAULT_BODY_MEASUREMENTS.bust;
	const previewWaist = measurements.waist ?? previewRow?.values.waist ?? DEFAULT_BODY_MEASUREMENTS.waist;
	const previewHip = measurements.hip ?? previewRow?.values.hip ?? DEFAULT_BODY_MEASUREMENTS.hip;
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
						<div role="dialog" aria-modal="true" aria-label="Size and fit" className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-3 sm:p-4 overscroll-contain">
							{/* Backdrop */}
							<button
								type="button"
								aria-label="Close size and fit"
								onClick={() => setIsOpen(false)}
								className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
							/>

							{/* Portrait Modal Frame */}
							<div className="relative flex h-[92vh] max-h-[820px] w-full max-w-[460px] flex-col overflow-hidden rounded-3xl border border-[var(--color-ink-200)] bg-[var(--color-surface)] shadow-2xl animate-dialog-in">
								{/* Header with Title + Size Table Button + Close */}
								<div className="flex shrink-0 items-center justify-between border-b border-[var(--color-ink-100)] bg-white/90 px-4 py-3 backdrop-blur-md z-30">
									<div className="flex items-center gap-2">
										<h2 className="text-base font-bold text-[var(--color-ink-900)]">Size &amp; Fit</h2>
									</div>

									<div className="flex items-center gap-2">
										{chart && (
											<button
												type="button"
												onClick={() => setIsTableOpen(true)}
												className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-ink-200)] bg-[var(--color-ink-50)] px-3 py-1 text-xs font-semibold text-[var(--color-ink-800)] transition-colors hover:bg-[var(--color-ink-100)]"
											>
												<Table2 size={13} />
												Size Table
											</button>
										)}
										<button
											type="button"
											aria-label="Close"
											onClick={() => setIsOpen(false)}
											className="rounded-full p-1.5 text-[var(--color-ink-500)] transition-colors hover:bg-[var(--color-ink-100)] hover:text-[var(--color-ink-900)]"
										>
											<X size={18} />
										</button>
									</div>
								</div>

								{/* Main Body: Full Portrait Canvas */}
								<div className="relative flex-1 overflow-hidden p-2">
									{/* Full Fit Preview Model Image */}
									<FitPreview
										measurements={{ bust: previewBust, waist: previewWaist, hip: previewHip }}
										garment={hemlines}
										className="h-full w-full"
									/>

									{/* Floating Top Controls (Collapsible Size Finder Overlay on top of image canvas) */}
									{chart && (
										<div className="absolute top-4 inset-x-4 z-20 pointer-events-auto">
											<div className="rounded-2xl border border-white/70 bg-white/85 p-3 shadow-lg backdrop-blur-md transition-all">
												<div className="flex items-center justify-between pb-1">
													<span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-ink-900)]">Adjust Your Fit</span>
													<button
														type="button"
														onClick={() => setIsControlsExpanded(!isControlsExpanded)}
														className="flex items-center gap-1 text-[10px] font-semibold text-[var(--color-ink-600)] hover:text-[var(--color-ink-900)]"
													>
														{isControlsExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
													</button>
												</div>

												{isControlsExpanded && (
													<div className="mt-2 pt-2 border-t border-[var(--color-ink-100)]">
														<SizeFinder
															chart={chart}
															measurements={measurements}
															onChange={setMeasurements}
															recommended={recommended}
															onSelectSize={onSelectSize}
															isRecommendedSelected={recommended != null && recommended.sizeValue === selectedSizeValue}
															compact
														/>
													</div>
												)}
											</div>
										</div>
									)}
								</div>

								{/* Sub-Modal: Size Table Modal Overlay */}
								{isTableOpen && chart && (
									<div className="absolute inset-0 z-40 flex flex-col bg-white animate-dialog-in">
										<div className="flex items-center justify-between border-b border-[var(--color-ink-100)] px-4 py-3 bg-[var(--color-ink-50)]">
											<h3 className="text-sm font-bold text-[var(--color-ink-900)]">Detailed Size Chart</h3>
											<button
												type="button"
												aria-label="Close size table"
												onClick={() => setIsTableOpen(false)}
												className="rounded-full p-1.5 text-[var(--color-ink-500)] hover:bg-[var(--color-ink-200)] hover:text-[var(--color-ink-900)]"
											>
												<X size={18} />
											</button>
										</div>
										<div className="flex-1 overflow-y-auto p-4 space-y-4">
											<SizeGuide chart={chart} selectedSizeValue={selectedSizeValue} />
										</div>
									</div>
								)}
							</div>
						</div>,
						document.body,
					)
				: null}
		</>
	);
}
