"use client";

import Image from "next/image";

interface GarmentHemline {
	label: string;
	lengthInches: number;
}

interface FitPreviewProps {
	measurements?: { bust?: number; waist?: number; hip?: number };
	garment?: GarmentHemline[];
}

/**
 * Premium 3D mannequin fit preview with measurement overlay.
 * Uses a high-quality rendered mannequin image with CSS-positioned
 * double-headed arrow measurement callouts.
 */
export function FitPreview({ measurements, garment }: FitPreviewProps) {
	const bust = measurements?.bust ?? 36;
	const waist = measurements?.waist ?? 30;
	const hip = measurements?.hip ?? 40;

	const kameezLength = garment?.find((g) => /kameez|shirt|hem/i.test(g.label))?.lengthInches ?? 39;
	const trouserLength = garment?.find((g) => /trouser|shalwar|bottom/i.test(g.label))?.lengthInches ?? 38;

	return (
		<figure className="relative mx-auto w-full max-w-[280px] select-none">
			{/* Mannequin Image */}
			<div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl border border-[var(--color-ink-100)] bg-[#f5f3f0] shadow-[inset_0_1px_3px_rgba(0,0,0,0.06)]">
				<Image
					src="/images/mannequin-shalwar-kameez.jpg"
					alt="Shalwar Kameez size guide mannequin"
					fill
					sizes="280px"
					className="object-contain object-center"
					priority
				/>

				{/* ── Horizontal Measurement Arrows ── */}

				{/* BUST */}
				<MeasurementArrow direction="horizontal" label="BUST" value={`${bust}"`} top="28%" />

				{/* WAIST */}
				<MeasurementArrow direction="horizontal" label="WAIST" value={`${waist}"`} top="40%" />

				{/* HIPS */}
				<MeasurementArrow direction="horizontal" label="HIPS" value={`${hip}"`} top="50.5%" />

				{/* ── Vertical Length Callouts ── */}

				{/* Kameez Length — left side */}
				<VerticalDimension
					label="KAMEEZ LENGTH"
					value={`${kameezLength}"`}
					top="14%"
					bottom="38%"
					side="left"
				/>

				{/* Trouser Length — right side */}
				<VerticalDimension
					label="TROUSER LENGTH"
					value={`${trouserLength}"`}
					top="52%"
					bottom="10%"
					side="right"
				/>
			</div>
		</figure>
	);
}

/* ─── Horizontal Arrow + Label ─── */

function MeasurementArrow({ label, value, top }: { direction: string; label: string; value: string; top: string }) {
	return (
		<div className="absolute left-[8%] right-[8%] flex items-center" style={{ top }}>
			{/* Left arrowhead */}
			<svg className="h-2.5 w-2.5 shrink-0 -rotate-90 text-[var(--color-ink-800)]" viewBox="0 0 10 10">
				<path d="M 2 1 L 8 5 L 2 9 Z" fill="currentColor" />
			</svg>

			{/* Dashed line + center label */}
			<div className="relative flex flex-1 items-center">
				<div className="absolute inset-x-0 top-1/2 border-t border-dashed border-[var(--color-ink-600)]" />
				<div className="relative mx-auto rounded-[5px] border border-[var(--color-ink-200)] bg-white/90 px-2 py-0.5 shadow-sm backdrop-blur-sm">
					<span className="block text-center text-[9px] font-extrabold uppercase tracking-[0.12em] text-[var(--color-ink-900)]">
						{label}
					</span>
					<span className="block text-center text-[8px] font-semibold tabular-nums text-[var(--color-ink-500)]">
						{value}
					</span>
				</div>
			</div>

			{/* Right arrowhead */}
			<svg className="h-2.5 w-2.5 shrink-0 rotate-90 text-[var(--color-ink-800)]" viewBox="0 0 10 10">
				<path d="M 2 1 L 8 5 L 2 9 Z" fill="currentColor" />
			</svg>
		</div>
	);
}

/* ─── Vertical Dimension Arrow + Label ─── */

function VerticalDimension({
	label,
	value,
	top,
	bottom,
	side,
}: {
	label: string;
	value: string;
	top: string;
	bottom: string;
	side: "left" | "right";
}) {
	const posStyle = side === "left" ? { left: "3%" } : { right: "3%" };

	return (
		<div
			className="absolute flex flex-col items-center"
			style={{ top, bottom, width: "16px", ...posStyle }}
		>
			{/* Up arrowhead */}
			<svg className="h-2.5 w-2.5 shrink-0 text-[var(--color-accent-700)]" viewBox="0 0 10 10">
				<path d="M 1 8 L 5 2 L 9 8 Z" fill="currentColor" />
			</svg>

			{/* Vertical dashed line */}
			<div className="relative flex-1 w-px border-l border-dashed border-[var(--color-accent-600)]">
				{/* Label rotated vertically */}
				<div
					className="absolute top-1/2 -translate-y-1/2 origin-center -rotate-90 whitespace-nowrap"
					style={side === "left" ? { right: "10px" } : { left: "10px" }}
				>
					<span className="rounded-[4px] border border-[var(--color-accent-200)] bg-white/90 px-1.5 py-0.5 text-[7.5px] font-bold uppercase tracking-[0.1em] text-[var(--color-accent-800)] shadow-sm backdrop-blur-sm">
						{label} {value}
					</span>
				</div>
			</div>

			{/* Down arrowhead */}
			<svg className="h-2.5 w-2.5 shrink-0 text-[var(--color-accent-700)]" viewBox="0 0 10 10">
				<path d="M 1 2 L 5 8 L 9 2 Z" fill="currentColor" />
			</svg>
		</div>
	);
}
