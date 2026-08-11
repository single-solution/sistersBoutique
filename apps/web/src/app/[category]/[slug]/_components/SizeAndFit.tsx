"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Ruler, Table2, X, Sparkles, SlidersHorizontal, ChevronLeft } from "lucide-react";
import { classNames, type SizeChart, type SizeChartRow } from "@store/shared";

import { SizeGuide } from "./SizeGuide";
import { SizeFinder } from "./SizeFinder";
import { FitPreview, ANGLES, ANGLE_LABELS, hasAngleImages, type ViewAngle } from "./FitPreview";
import { DEFAULT_BODY_INPUT_MEASUREMENTS, DEFAULT_BODY_MEASUREMENTS, recommendSize, type BodyMeasurements } from "@/lib/catalog/sizeFit";

interface SizeAndFitProps {
	garmentType: "stitched" | "unstitched";
	chart: SizeChart | null;
	selectedSizeValue: string | null;
	onSelectSize?: (sizeValue: string) => void;
	fabricLabel?: string;
	piecesLabel?: string;
	className?: string;
}

type ModalTab = "fit" | "table";

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

export function SizeAndFit({ garmentType, chart, selectedSizeValue, fabricLabel, piecesLabel, className }: SizeAndFitProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [activeTab, setActiveTab] = useState<ModalTab>("fit");
	const [angle, setAngle] = useState<ViewAngle>("front");
	const [unit, setUnit] = useState<"in" | "cm">("in");
	const [isMounted, setIsMounted] = useState(false);
	const [isSlidersOpen, setIsSlidersOpen] = useState(false);
	const [measurements, setMeasurements] = useState<BodyMeasurements>(() => ({ ...DEFAULT_BODY_INPUT_MEASUREMENTS }));
	const [userInteracted, setUserInteracted] = useState(false);

	useEffect(() => {
		setIsMounted(true);
	}, []);

	useEffect(() => {
		if (!isOpen) return;

		const originalOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";

		function handleKeyDown(event: KeyboardEvent) {
			if (event.key === "Escape") {
				setIsOpen(false);
			}
		}

		window.addEventListener("keydown", handleKeyDown);
		return () => {
			document.body.style.overflow = originalOverflow;
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [isOpen]);

	const recommended = useMemo(() => (chart ? recommendSize(chart, measurements) : null), [chart, measurements]);
	const selectedRow = useMemo(() => chart?.rows.find((row) => row.sizeValue === selectedSizeValue) ?? null, [chart, selectedSizeValue]);

	// Prefer recommended if user has interacted with the sliders, otherwise default to the size selected on PDP
	const previewRow = userInteracted ? recommended : (selectedRow ?? recommended);
	
	const previewBust = measurements.bust ?? previewRow?.values.bust ?? DEFAULT_BODY_MEASUREMENTS.bust;
	const previewWaist = measurements.waist ?? previewRow?.values.waist ?? DEFAULT_BODY_MEASUREMENTS.waist;
	const previewHip = measurements.hip ?? previewRow?.values.hip ?? DEFAULT_BODY_MEASUREMENTS.hip;
	const hemlines = chart ? garmentHemlines(chart, previewRow) : [];

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
						<div role="dialog" aria-modal="true" aria-label="Size and fit" className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-3 sm:p-5 overscroll-contain">
							{/* Backdrop */}
							<button
								type="button"
								aria-label="Close size and fit"
								onClick={() => setIsOpen(false)}
								className="absolute inset-0 bg-black/65 backdrop-blur-xs transition-opacity"
							/>

							{/* 
							  Bigger Modal Container: 
							  We use 88vh max height on desktop, and constrain max-width to 95vw for mobile.
							  The inner content uses `aspect-[896/1200]` so it strictly preserves the image ratio and guarantees ZERO side-padding on all devices.
							*/}
							<div className="relative flex max-h-[88dvh] w-[calc((88dvh-49px)*896/1200)] max-w-[95vw] flex-col overflow-hidden rounded-xl sm:rounded-2xl md:rounded-3xl border border-[#e5e1dc] bg-[#f5f3f0] shadow-2xl animate-dialog-in">
								{/* ── Header with Title (Left) & Tab Switcher + Close Icon (Right) ── */}
								<div className="flex shrink-0 h-[49px] items-center justify-between border-b border-[#e5e1dc]/80 bg-[#f5f3f0]/90 px-4 sm:px-5 py-3 backdrop-blur-md z-30">
									<h2 className="text-sm sm:text-base font-bold text-[var(--color-ink-900)]">Size &amp; Fit</h2>

									<div className="flex items-center gap-2 sm:gap-3">
										{/* Segmented Tab Switcher in Right Side of Header */}
										{chart && (
											<div className="flex overflow-hidden rounded-full border border-[var(--color-ink-200)] bg-white/80 p-0.5 shadow-2xs" aria-label="View mode">
												<button
													type="button"
													onClick={() => setActiveTab("fit")}
													className={classNames(
														"inline-flex items-center gap-1 rounded-full px-2.5 sm:px-3 py-1 text-[10px] sm:text-[11px] font-extrabold uppercase transition-all",
														activeTab === "fit" ? "bg-[var(--color-ink-900)] text-white shadow-2xs" : "text-[var(--color-ink-600)] hover:text-[var(--color-ink-900)]",
													)}
												>
													<Sparkles size={12} />
													Visual Fit
												</button>
												<button
													type="button"
													onClick={() => setActiveTab("table")}
													className={classNames(
														"inline-flex items-center gap-1 rounded-full px-2.5 sm:px-3 py-1 text-[10px] sm:text-[11px] font-extrabold uppercase transition-all",
														activeTab === "table" ? "bg-[var(--color-ink-900)] text-white shadow-2xs" : "text-[var(--color-ink-600)] hover:text-[var(--color-ink-900)]",
													)}
												>
													<Table2 size={12} />
													Size Table
												</button>
											</div>
										)}

										<button
											type="button"
											aria-label="Close"
											onClick={() => setIsOpen(false)}
											className="rounded-full p-1.5 text-[var(--color-ink-500)] transition-colors hover:bg-white/80 hover:text-[var(--color-ink-900)]"
										>
											<X size={18} />
										</button>
									</div>
								</div>

								{/* ── Main Modal Content ── */}
								{activeTab === "fit" ? (
									/* VISUAL FIT VIEW (Strict Aspect Ratio Image Container) */
									<div className="relative w-full aspect-[896/1200] overflow-hidden bg-[#f5f3f0] select-none p-0 m-0">
										{/* Full-bleed Portrait Fit Preview Model Image */}
										<FitPreview
											measurements={{ bust: previewBust, waist: previewWaist, hip: previewHip }}
											garment={hemlines}
											angle={angle}
											predictedSize={
												previewRow?.label
													? (["xs", "s", "m", "l", "xl"].includes(previewRow.label.toLowerCase())
														? (previewRow.label.toLowerCase() as any)
														: undefined)
													: undefined
											}
											className="h-full w-full"
										/>

										{/* Top Left Floating Collapsible Trigger Button */}
										<button
											type="button"
											onClick={() => setIsSlidersOpen(true)}
											className={classNames(
												"absolute top-4 left-4 z-30 inline-flex items-center gap-2 rounded-full border border-white/90 bg-white/90 px-4 py-2 text-xs font-extrabold uppercase tracking-wider text-[var(--color-ink-900)] shadow-lg backdrop-blur-md transition-all duration-300 hover:bg-white hover:scale-105 active:scale-95 origin-top-left",
												isSlidersOpen ? "opacity-0 scale-75 pointer-events-none" : "opacity-100 scale-100 pointer-events-auto",
											)}
											aria-expanded={isSlidersOpen}
											aria-label="Open fit parameters"
										>
											<SlidersHorizontal size={15} />
											<span>Fit Parameters</span>
										</button>

										{/* Bigger Smooth Animated Collapsible Slider Card Overlay (Morphs/Reveals directly from Top Left Button) */}
										<div
											className={classNames(
												"absolute top-4 left-4 z-40 flex max-h-[calc(100%-2rem)] w-[min(340px,calc(100%-2rem))] flex-col rounded-xl md:rounded-3xl border border-white/90 bg-white/95 p-4 sm:p-5 shadow-2xl backdrop-blur-xl transition-all duration-300 ease-out origin-top-left select-none",
												isSlidersOpen
													? "opacity-100 scale-100 translate-x-0 pointer-events-auto"
													: "opacity-0 scale-75 -translate-x-4 pointer-events-none",
											)}
										>
											<div className="flex items-center justify-between pb-3 border-b border-[var(--color-ink-100)]">
												<div className="flex items-center gap-2">
													<SlidersHorizontal size={15} className="text-[var(--color-ink-900)]" />
													<h3 className="text-xs font-extrabold uppercase tracking-wider text-[var(--color-ink-900)]">Fit Parameters</h3>
												</div>
												<button
													type="button"
													onClick={() => setIsSlidersOpen(false)}
													className="rounded-full p-1.5 text-[var(--color-ink-500)] hover:bg-[var(--color-ink-100)] hover:text-[var(--color-ink-900)] transition-colors"
													aria-label="Close fit parameters"
												>
													<X size={16} />
												</button>
											</div>

											<div className="flex-1 overflow-y-auto overscroll-contain pt-4 pr-1 space-y-4 custom-scrollbar">
												{chart && (
													<SizeFinder 
														chart={chart} 
														measurements={measurements} 
														unit={unit} 
														onUnitChange={setUnit} 
														onChange={(m) => {
															setMeasurements(m);
															setUserInteracted(true);
														}} 
													/>
												)}
											</div>
										</div>

										{/* Bottom Left Floating Overlay: Simple Suggested Size Pill */}
										{recommended && (
											<div className="absolute bottom-4 left-4 z-20 flex items-center gap-2 rounded-full border border-white/80 bg-white/80 px-3.5 py-1.5 shadow-md backdrop-blur-md transition-all">
												<span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-ink-600)]">Suggested Size</span>
												<span className="rounded-full bg-[var(--color-ink-900)] px-2.5 py-0.5 text-xs font-extrabold text-white">
													{recommended.label}
												</span>
											</div>
										)}

										{/* Bottom Right Floating Overlay: Reverted Horizontal Angle Toggle */}
										{availableAngles.length > 1 && (
											<div className="absolute bottom-4 right-4 z-20 flex items-center gap-1 rounded-full border border-white/80 bg-white/80 p-1 shadow-md backdrop-blur-md" aria-label="View angle">
												{availableAngles.map((a) => (
													<button
														key={a}
														type="button"
														onClick={() => setAngle(a)}
														className={classNames(
															"rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider transition-all",
															a === angle ? "bg-[var(--color-ink-900)] text-white shadow-2xs" : "text-[var(--color-ink-600)] hover:text-[var(--color-ink-900)]",
														)}
													>
														{ANGLE_LABELS[a]}
													</button>
												))}
											</div>
										)}
									</div>
								) : (
									/* SIZE TABLE VIEW (Strict Aspect Ratio layout) */
									<div className="w-full aspect-[896/1200] overflow-y-auto overscroll-contain p-4 sm:p-5 bg-white space-y-4">
										{chart && <SizeGuide chart={chart} selectedSizeValue={selectedSizeValue} />}
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
