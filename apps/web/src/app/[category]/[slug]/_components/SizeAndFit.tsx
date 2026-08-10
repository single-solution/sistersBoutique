"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Ruler, Table2, X, SlidersHorizontal, Check } from "lucide-react";
import { classNames, type SizeChart, type SizeChartRow } from "@store/shared";

import { SizeGuide } from "./SizeGuide";
import { SizeFinder, BodyShapeToggle } from "./SizeFinder";
import { FitPreview, ANGLES, ANGLE_LABELS, hasAngleImages, type ViewAngle } from "./FitPreview";
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
	const [isCustomExpanded, setIsCustomExpanded] = useState(false);
	const [angle, setAngle] = useState<ViewAngle>("front");
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

	const isRecommendedSelected = recommended != null && recommended.sizeValue === selectedSizeValue;
	const availableAngles = ANGLES.filter(hasAngleImages);
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
						<div role="dialog" aria-modal="true" aria-label="Size and fit" className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-2 sm:p-4 overscroll-contain">
							{/* Backdrop */}
							<button
								type="button"
								aria-label="Close size and fit"
								onClick={() => setIsOpen(false)}
								className="absolute inset-0 bg-black/65 backdrop-blur-xs transition-opacity"
							/>

							{/* Portrait Modal Frame */}
							<div className="relative flex h-[92vh] max-h-[840px] w-full max-w-[460px] flex-col overflow-hidden rounded-3xl border border-[var(--color-ink-200)] bg-[var(--color-surface)] shadow-2xl animate-dialog-in">
								{/* ── Top Header ── */}
								<div className="flex shrink-0 items-center justify-between border-b border-[var(--color-ink-100)] bg-white/90 px-4 py-3 backdrop-blur-md z-30">
									<h2 className="text-base font-bold text-[var(--color-ink-900)]">Size &amp; Fit</h2>

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

								{/* ── Main Canvas: Edge-to-Edge Full Image ── */}
								<div className="relative flex-1 overflow-hidden">
									{/* Full-bleed model image with overlays */}
									<FitPreview
										measurements={{ bust: previewBust, waist: previewWaist, hip: previewHip }}
										garment={hemlines}
										angle={angle}
										className="h-full w-full"
									/>

									{/* ── Floating Top Bar: Body Shape Pills + Sliders Toggle ── */}
									{chart && (
										<div className="absolute top-2 inset-x-2 z-20 flex items-center justify-between pointer-events-auto">
											<div className="mx-auto flex items-center gap-1.5 rounded-full border border-white/80 bg-white/90 p-1 shadow-lg backdrop-blur-md">
												<BodyShapeToggle measurements={measurements} onChange={setMeasurements} />
												<button
													type="button"
													title="Fine-tune measurement sliders"
													onClick={() => setIsCustomExpanded(!isCustomExpanded)}
													className={`rounded-full p-1.5 transition-all ${
														isCustomExpanded ? "bg-[var(--color-ink-900)] text-white shadow-xs" : "bg-white/80 text-[var(--color-ink-700)] hover:bg-white"
													}`}
												>
													<SlidersHorizontal size={13} />
												</button>
											</div>

											{/* Expandable Live Sliders Card (Anchored top-right popup) */}
											{isCustomExpanded && (
												<div className="absolute top-11 right-2 z-30 w-[270px] rounded-2xl border border-white/90 bg-white/95 p-3.5 shadow-2xl backdrop-blur-md animate-dialog-in">
													<div className="flex items-center justify-between pb-1 mb-2 border-b border-[var(--color-ink-100)]">
														<span className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--color-ink-900)]">Live Sliders</span>
														<button
															type="button"
															onClick={() => setIsCustomExpanded(false)}
															className="rounded-full p-0.5 text-[var(--color-ink-500)] hover:text-[var(--color-ink-900)]"
														>
															<X size={14} />
														</button>
													</div>
													<SizeFinder chart={chart} measurements={measurements} onChange={setMeasurements} />
												</div>
											)}
										</div>
									)}

									{/* ── Bottom Overlay: Suggested Size & Image Angle Switcher (Centered) ── */}
									<div className="absolute bottom-3 inset-x-0 z-20 flex flex-col items-center gap-2 pointer-events-auto">
										{/* Suggested Size Pill: "✓ Size [L] Selected" or "Select Size [L]" */}
										{recommended && (
											<div>
												{isRecommendedSelected ? (
													<div className="inline-flex items-center gap-1.5 rounded-full border border-white/80 bg-[var(--color-ink-900)] px-3.5 py-1 text-[11px] font-extrabold text-white shadow-md backdrop-blur-md">
														<Check size={12} className="text-emerald-400" />
														Size {recommended.label} Selected
													</div>
												) : (
													<button
														type="button"
														onClick={() => onSelectSize(recommended.sizeValue)}
														className="inline-flex items-center gap-1.5 rounded-full border border-white/90 bg-white/95 px-3.5 py-1 text-[11px] font-extrabold text-[var(--color-ink-900)] shadow-md backdrop-blur-md hover:bg-white hover:scale-105 transition-all"
													>
														Select Size {recommended.label}
													</button>
												)}
											</div>
										)}

										{/* Angle Switcher (Centered at bottom of image) */}
										{availableAngles.length > 1 && (
											<div className="flex items-center gap-1 rounded-full border border-white/80 bg-white/90 p-1 shadow-lg backdrop-blur-md" aria-label="View angle">
												{availableAngles.map((a) => (
													<button
														key={a}
														type="button"
														onClick={() => setAngle(a)}
														className={`rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider transition-all ${
															a === angle ? "bg-[var(--color-ink-900)] text-white shadow-xs" : "text-[var(--color-ink-600)] hover:text-[var(--color-ink-900)]"
														}`}
													>
														{ANGLE_LABELS[a]}
													</button>
												))}
											</div>
										)}
									</div>
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
