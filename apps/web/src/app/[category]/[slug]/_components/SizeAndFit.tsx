"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Ruler, Table2, X, Sparkles } from "lucide-react";
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

							{/* Spacious Modal Container */}
							<div className="relative flex h-[88vh] max-h-[640px] w-full max-w-[840px] flex-col overflow-hidden rounded-3xl border border-[#e5e1dc] bg-[#f5f3f0] shadow-2xl animate-dialog-in">
								{/* ── Header with Title & View Tab Switcher (Visual Fit vs Size Table) ── */}
								<div className="flex shrink-0 items-center justify-between border-b border-[#e5e1dc]/80 bg-[#f5f3f0]/90 px-5 py-3.5 backdrop-blur-md z-30">
									<div className="flex items-center gap-3">
										<h2 className="text-base font-bold text-[var(--color-ink-900)]">Size &amp; Fit Guidance</h2>

										{/* Segmented Tab Switcher in Header */}
										{chart && (
											<div className="flex overflow-hidden rounded-full border border-[var(--color-ink-200)] bg-white/80 p-0.5 shadow-2xs" aria-label="View mode">
												<button
													type="button"
													onClick={() => setActiveTab("fit")}
													className={classNames(
														"inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-extrabold uppercase transition-all",
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
														"inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-extrabold uppercase transition-all",
														activeTab === "table" ? "bg-[var(--color-ink-900)] text-white shadow-2xs" : "text-[var(--color-ink-600)] hover:text-[var(--color-ink-900)]",
													)}
												>
													<Table2 size={12} />
													Size Table
												</button>
											</div>
										)}
									</div>

									<button
										type="button"
										aria-label="Close"
										onClick={() => setIsOpen(false)}
										className="rounded-full p-1.5 text-[var(--color-ink-500)] transition-colors hover:bg-white/80 hover:text-[var(--color-ink-900)]"
									>
										<X size={18} />
									</button>
								</div>

								{/* ── Main Modal Content ── */}
								{activeTab === "fit" ? (
									/* VISUAL FIT VIEW (2-Column Layout) */
									<div className="flex flex-col sm:flex-row flex-1 overflow-hidden bg-[#f5f3f0]">
										{/* LEFT COLUMN: Parameter Sliders, IN/CM Unit Toggle, Suggested Size & Angle Controls */}
										<div className="w-full sm:w-[48%] flex flex-col justify-between p-5 space-y-4 border-r border-[#e5e1dc]/60 bg-[#f5f3f0] overflow-y-auto">
											{/* Fit Parameters Section */}
											<div className="space-y-3">
												{/* Header with IN / CM Toggle placed below in left pane */}
												<div className="flex items-center justify-between pb-1 border-b border-[#e5e1dc]/80">
													<div>
														<h3 className="text-xs font-extrabold uppercase tracking-wider text-[var(--color-ink-800)]">Fit Parameters</h3>
														<p className="text-[10.5px] text-[var(--color-ink-500)]">Drag sliders to adjust measurements.</p>
													</div>

													{/* IN / CM Toggle placed below in left pane */}
													<div className="flex overflow-hidden rounded-full border border-[var(--color-ink-200)] bg-white/80 p-0.5 shadow-2xs" aria-label="Unit toggle">
														<button
															type="button"
															onClick={() => setUnit("in")}
															className={classNames(
																"rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase transition-colors",
																unit === "in" ? "bg-[var(--color-ink-900)] text-white shadow-2xs" : "text-[var(--color-ink-600)] hover:text-[var(--color-ink-900)]",
															)}
														>
															IN
														</button>
														<button
															type="button"
															onClick={() => setUnit("cm")}
															className={classNames(
																"rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase transition-colors",
																unit === "cm" ? "bg-[var(--color-ink-900)] text-white shadow-2xs" : "text-[var(--color-ink-600)] hover:text-[var(--color-ink-900)]",
															)}
														>
															CM
														</button>
													</div>
												</div>

												{chart && (
													<div className="rounded-2xl border border-white/80 bg-white/60 p-4 shadow-xs backdrop-blur-md">
														<SizeFinder chart={chart} measurements={measurements} unit={unit} onChange={setMeasurements} />
													</div>
												)}
											</div>

											{/* Bottom: Suggested Size & View Angle Switcher */}
											<div className="space-y-3 pt-3 border-t border-[#e5e1dc]/80">
												{/* Suggested Size Badge */}
												{recommended && (
													<div className="rounded-2xl border border-white/80 bg-white/80 p-3 shadow-xs backdrop-blur-md flex items-center justify-between">
														<span className="text-xs font-bold uppercase tracking-wider text-[var(--color-ink-600)]">Suggested Size</span>
														<span className="rounded-full bg-[var(--color-ink-900)] px-3 py-1 text-xs font-extrabold text-white">
															{recommended.label}
														</span>
													</div>
												)}

												{/* View Angle Switcher */}
												{availableAngles.length > 1 && (
													<div className="flex items-center justify-between">
														<span className="text-xs font-bold uppercase tracking-wider text-[var(--color-ink-600)]">View Angle</span>
														<div className="flex items-center gap-1 rounded-full border border-white/80 bg-white/80 p-1 shadow-2xs" aria-label="View angle">
															{availableAngles.map((a) => (
																<button
																	key={a}
																	type="button"
																	onClick={() => setAngle(a)}
																	className={`rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider transition-all ${
																		a === angle ? "bg-[var(--color-ink-900)] text-white shadow-2xs" : "text-[var(--color-ink-600)] hover:text-[var(--color-ink-900)]"
																	}`}
																>
																	{ANGLE_LABELS[a]}
																</button>
															))}
														</div>
													</div>
												)}
											</div>
										</div>

										{/* RIGHT COLUMN: Full Model Image on Seamless Background */}
										<div className="w-full sm:w-[52%] relative h-full flex items-center justify-center p-2 bg-[#f5f3f0]">
											<FitPreview
												measurements={{ bust: previewBust, waist: previewWaist, hip: previewHip }}
												garment={hemlines}
												angle={angle}
												className="h-full w-full"
											/>
										</div>
									</div>
								) : (
									/* SIZE TABLE VIEW */
									<div className="flex-1 overflow-y-auto p-6 bg-white space-y-4">
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
