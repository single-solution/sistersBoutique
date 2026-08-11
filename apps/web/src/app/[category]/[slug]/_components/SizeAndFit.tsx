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

	const previewRow = selectedRow ?? recommended;
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

							{/* Portrait Modal Container (Height 80vh, Width matching 896:1200 model image aspect ratio) */}
							<div className="relative flex h-[80vh] max-h-[80vh] aspect-[896/1200] w-[calc(80vh*896/1200)] max-w-[92vw] flex-col overflow-hidden rounded-3xl border border-[#e5e1dc] bg-[#f5f3f0] shadow-2xl animate-dialog-in">
								{/* ── Header with Title (Left) & Tab Switcher + Close Icon (Right) ── */}
								<div className="flex shrink-0 items-center justify-between border-b border-[#e5e1dc]/80 bg-[#f5f3f0]/90 px-4 sm:px-5 py-3 backdrop-blur-md z-30">
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
									/* VISUAL FIT VIEW (Full-Bleed Image with Animated Collapsible Slider Card) */
									<div className="relative flex-1 w-full h-full overflow-hidden bg-[#f5f3f0] select-none p-0 m-0">
										{/* Full-bleed Portrait Fit Preview Model Image */}
										<FitPreview
											measurements={{ bust: previewBust, waist: previewWaist, hip: previewHip }}
											garment={hemlines}
											angle={angle}
											className="h-full w-full"
										/>

										{/* Top Left Floating Collapsible Trigger Button */}
										<button
											type="button"
											onClick={() => setIsSlidersOpen((prev) => !prev)}
											className="absolute top-4 left-4 z-30 inline-flex items-center gap-1.5 rounded-full border border-white/80 bg-white/85 px-3 py-1.5 text-[10.5px] sm:text-[11px] font-extrabold uppercase tracking-wider text-[var(--color-ink-900)] shadow-md backdrop-blur-md transition-all hover:bg-white"
											aria-expanded={isSlidersOpen}
											aria-label="Toggle fit parameters"
										>
											<SlidersHorizontal size={13} />
											<span>Fit Parameters</span>
											<ChevronLeft size={13} className={classNames("transition-transform duration-300", !isSlidersOpen && "rotate-180")} />
										</button>

										{/* Smooth Animated Collapsible Slider Card Overlay (Reveals from Left Side over Image) */}
										<div
											className={classNames(
												"absolute top-14 left-4 z-30 flex max-h-[calc(100%-4.5rem)] w-[260px] sm:w-[280px] flex-col rounded-2xl border border-white/80 bg-white/90 p-3.5 shadow-xl backdrop-blur-md transition-all duration-300 ease-in-out select-none",
												isSlidersOpen
													? "opacity-100 translate-x-0 pointer-events-auto"
													: "opacity-0 -translate-x-6 pointer-events-none scale-95",
											)}
										>
											<div className="flex items-center justify-between pb-2 border-b border-[var(--color-ink-100)]">
												<h3 className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--color-ink-900)]">Adjust Measurements</h3>
												<button
													type="button"
													onClick={() => setIsSlidersOpen(false)}
													className="rounded-full p-1 text-[var(--color-ink-500)] hover:bg-[var(--color-ink-100)] hover:text-[var(--color-ink-900)]"
													aria-label="Close fit parameters"
												>
													<X size={14} />
												</button>
											</div>

											<div className="flex-1 overflow-y-auto overscroll-contain pt-3 pr-1 space-y-3 custom-scrollbar">
												{chart && (
													<SizeFinder chart={chart} measurements={measurements} unit={unit} onUnitChange={setUnit} onChange={setMeasurements} />
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
									/* SIZE TABLE VIEW (Portrait Layout matching Modal Ratio) */
									<div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5 bg-white space-y-4">
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
