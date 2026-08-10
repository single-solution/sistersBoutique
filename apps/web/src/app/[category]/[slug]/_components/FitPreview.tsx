"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

/* ─── Types ─── */

interface GarmentHemline {
	label: string;
	lengthInches: number;
}

interface FitPreviewProps {
	measurements?: { bust?: number; waist?: number; hip?: number };
	garment?: GarmentHemline[];
}

type BodySize = "xs" | "s" | "m" | "l" | "xl";
type ViewAngle = "front" | "side" | "back";

/* ─── Image Matrix ─── */

const ANGLES: ViewAngle[] = ["front", "side", "back"];
const ANGLE_LABELS: Record<ViewAngle, string> = { front: "Front", side: "Side", back: "Back" };

const IMAGE_MATRIX: Record<ViewAngle, Partial<Record<BodySize, string>>> = {
	front: {
		xs: "/images/fit-models/front-xs.jpg",
		s: "/images/fit-models/front-s.jpg",
		m: "/images/fit-models/front-m.jpg",
		l: "/images/fit-models/front-l.jpg",
		xl: "/images/fit-models/front-xl.jpg",
	},
	side: {
		xs: "/images/fit-models/side-xs.jpg",
		s: "/images/fit-models/side-s.jpg",
		m: "/images/fit-models/side-m.jpg",
		l: "/images/fit-models/side-l.jpg",
		// xl: coming soon
	},
	back: {
		// all coming soon
	},
};

/* ─── Helpers ─── */

/** Map bust measurement → closest body size key. */
function resolveBodySize(bust: number): BodySize {
	if (bust < 33) return "xs";
	if (bust < 36) return "s";
	if (bust < 39) return "m";
	if (bust < 43) return "l";
	return "xl";
}

/** Resolve the best available image for a given angle + size, falling back gracefully. */
function resolveImage(angle: ViewAngle, size: BodySize): string {
	const angleImages = IMAGE_MATRIX[angle];
	if (angleImages[size]) return angleImages[size]!;

	// Fallback: try neighbouring sizes in this angle
	const sizes: BodySize[] = ["xs", "s", "m", "l", "xl"];
	const idx = sizes.indexOf(size);
	for (let delta = 1; delta < sizes.length; delta++) {
		const up = sizes[idx + delta];
		const down = sizes[idx - delta];
		if (up && angleImages[up]) return angleImages[up]!;
		if (down && angleImages[down]) return angleImages[down]!;
	}

	// Fallback: front-m as ultimate default
	return IMAGE_MATRIX.front.m!;
}

/** Check if any image exists for a given angle. */
function hasAngleImages(angle: ViewAngle): boolean {
	return Object.keys(IMAGE_MATRIX[angle]).length > 0;
}

/* ─── Component ─── */

/**
 * Premium fit preview with multi-body-type images and angle switching.
 * Body type auto-selects from bust measurement; view angle is user-controlled.
 * Smooth CSS crossfade between images.
 */
export function FitPreview({ measurements, garment }: FitPreviewProps) {
	const bust = measurements?.bust ?? 36;
	const waist = measurements?.waist ?? 30;
	const hip = measurements?.hip ?? 40;

	const bodySize = useMemo(() => resolveBodySize(bust), [bust]);
	const [angle, setAngle] = useState<ViewAngle>("front");

	const currentImage = resolveImage(angle, bodySize);

	const kameezLength = garment?.find((g) => /kameez|shirt|hem/i.test(g.label))?.lengthInches ?? 39;
	const trouserLength = garment?.find((g) => /trouser|shalwar|bottom/i.test(g.label))?.lengthInches ?? 38;

	// Available angles (only show dots for angles that have images)
	const availableAngles = ANGLES.filter(hasAngleImages);

	return (
		<figure className="relative mx-auto w-full max-w-[280px] select-none">
			{/* Image container with crossfade */}
			<div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl border border-[var(--color-ink-100)] bg-[#f5f3f0] shadow-[inset_0_1px_3px_rgba(0,0,0,0.06)]">
				{/* Render all body-size images for current angle, only the active one is visible */}
				{(["xs", "s", "m", "l", "xl"] as BodySize[]).map((size) => {
					const src = IMAGE_MATRIX[angle]?.[size];
					if (!src) return null;
					const isActive = size === bodySize;
					return (
						<div
							key={`${angle}-${size}`}
							className="absolute inset-0 transition-opacity duration-500 ease-in-out"
							style={{ opacity: isActive ? 1 : 0, zIndex: isActive ? 1 : 0 }}
						>
							<Image
								src={src}
								alt={`${ANGLE_LABELS[angle]} view — ${size.toUpperCase()} body type`}
								fill
								sizes="280px"
								className="object-contain object-center"
								priority={isActive}
							/>
						</div>
					);
				})}

				{/* Measurement overlays — only show on front view */}
				{angle === "front" && (
					<div className="absolute inset-0 z-10 pointer-events-none">
						{/* BUST */}
						<MeasurementArrow label="BUST" value={`${bust}"`} top="28%" />
						{/* WAIST */}
						<MeasurementArrow label="WAIST" value={`${waist}"`} top="40%" />
						{/* HIPS */}
						<MeasurementArrow label="HIPS" value={`${hip}"`} top="50.5%" />

						{/* Kameez Length — left side */}
						<VerticalDimension label="KAMEEZ" value={`${kameezLength}"`} top="14%" bottom="38%" side="left" />
						{/* Trouser Length — right side */}
						<VerticalDimension label="TROUSER" value={`${trouserLength}"`} top="52%" bottom="10%" side="right" />
					</div>
				)}
			</div>

			{/* ── Angle Dot Navigation ── */}
			{availableAngles.length > 1 && (
				<nav className="mt-3 flex items-center justify-center gap-3" aria-label="View angle">
					{availableAngles.map((a) => (
						<button
							key={a}
							type="button"
							onClick={() => setAngle(a)}
							aria-label={`${ANGLE_LABELS[a]} view`}
							aria-current={a === angle ? "true" : undefined}
							className="group flex flex-col items-center gap-1"
						>
							<span
								className="block h-2 w-2 rounded-full border border-[var(--color-ink-300)] transition-all duration-300"
								style={{
									backgroundColor: a === angle ? "var(--color-ink-800)" : "transparent",
									transform: a === angle ? "scale(1.3)" : "scale(1)",
								}}
							/>
							<span
								className="text-[9px] font-semibold uppercase tracking-widest transition-colors duration-200"
								style={{
									color: a === angle ? "var(--color-ink-800)" : "var(--color-ink-400)",
								}}
							>
								{ANGLE_LABELS[a]}
							</span>
						</button>
					))}
				</nav>
			)}

			{/* Body size label */}
			<p className="mt-2 text-center text-[10px] font-medium uppercase tracking-widest text-[var(--color-ink-400)]">
				Body type: {bodySize.toUpperCase()}
			</p>
		</figure>
	);
}

/* ─── Horizontal Arrow + Label ─── */

function MeasurementArrow({ label, value, top }: { label: string; value: string; top: string }) {
	return (
		<div className="absolute left-[8%] right-[8%] flex items-center" style={{ top }}>
			{/* Left arrowhead */}
			<svg className="h-2.5 w-2.5 shrink-0 text-[var(--color-ink-800)]" viewBox="0 0 10 10">
				<path d="M 8 5 L 2 1 L 2 9 Z" fill="currentColor" />
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
			<svg className="h-2.5 w-2.5 shrink-0 text-[var(--color-ink-800)]" viewBox="0 0 10 10">
				<path d="M 2 5 L 8 1 L 8 9 Z" fill="currentColor" />
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
		<div className="absolute flex flex-col items-center" style={{ top, bottom, width: "16px", ...posStyle }}>
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
