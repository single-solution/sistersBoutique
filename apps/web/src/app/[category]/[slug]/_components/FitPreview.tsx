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
	/** Optional class name to control container size */
	className?: string;
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
	},
	back: {},
};

/* ─── Helpers ─── */

function resolveBodySize(bust: number): BodySize {
	if (bust < 33) return "xs";
	if (bust < 36) return "s";
	if (bust < 39) return "m";
	if (bust < 43) return "l";
	return "xl";
}

function resolveImage(angle: ViewAngle, size: BodySize): string {
	const angleImages = IMAGE_MATRIX[angle];
	if (angleImages[size]) return angleImages[size]!;

	const sizes: BodySize[] = ["xs", "s", "m", "l", "xl"];
	const idx = sizes.indexOf(size);
	for (let delta = 1; delta < sizes.length; delta++) {
		const up = sizes[idx + delta];
		const down = sizes[idx - delta];
		if (up && angleImages[up]) return angleImages[up]!;
		if (down && angleImages[down]) return angleImages[down]!;
	}

	return IMAGE_MATRIX.front.m!;
}

function hasAngleImages(angle: ViewAngle): boolean {
	return Object.keys(IMAGE_MATRIX[angle]).length > 0;
}

/* ─── Component ─── */

export function FitPreview({ measurements, garment, className = "" }: FitPreviewProps) {
	const bust = measurements?.bust ?? 36;
	const waist = measurements?.waist ?? 30;
	const hip = measurements?.hip ?? 40;

	const bodySize = useMemo(() => resolveBodySize(bust), [bust]);
	const [angle, setAngle] = useState<ViewAngle>("front");

	const kameezLength = garment?.find((g) => /kameez|shirt|hem/i.test(g.label))?.lengthInches ?? 39;
	const trouserLength = garment?.find((g) => /trouser|shalwar|bottom/i.test(g.label))?.lengthInches ?? 38;

	const availableAngles = ANGLES.filter(hasAngleImages);

	return (
		<div className={`relative flex h-full w-full flex-col select-none ${className}`}>
			{/* Image canvas spanning full modal body */}
			<div className="relative flex-1 w-full overflow-hidden rounded-2xl border border-[var(--color-ink-100)] bg-[#f5f3f0] shadow-inner">
				{/* Model Images with 500ms Crossfade */}
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
								alt={`${ANGLE_LABELS[angle]} view — ${size.toUpperCase()} body shape`}
								fill
								sizes="(max-width: 768px) 100vw, 500px"
								className="object-contain object-center p-2"
								priority={isActive}
							/>
						</div>
					);
				})}

				{/* Side-positioned Measurement Overlays (kept on left/right margins, clear of model body) */}
				{angle === "front" && (
					<div className="absolute inset-0 z-10 pointer-events-none">
						{/* Horizontal Callouts: Bust, Waist, Hips (floating on left & right margins) */}
						<MarginMeasurement tag="BUST" value={`${bust}"`} top="27%" side="left" />
						<MarginMeasurement tag="WAIST" value={`${waist}"`} top="39%" side="right" />
						<MarginMeasurement tag="HIPS" value={`${hip}"`} top="50%" side="left" />

						{/* Vertical Lengths: Kameez & Trouser */}
						<VerticalDimension label="KAMEEZ" value={`${kameezLength}"`} top="15%" bottom="38%" side="left" />
						<VerticalDimension label="TROUSER" value={`${trouserLength}"`} top="52%" bottom="10%" side="right" />
					</div>
				)}

				{/* Floating Bottom Bar: Angle Switcher & Body Type Badge */}
				<div className="absolute bottom-3 inset-x-3 z-20 flex items-center justify-between pointer-events-auto">
					<div className="rounded-full border border-white/60 bg-white/80 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[var(--color-ink-800)] shadow-sm backdrop-blur-md">
						Type: {bodySize.toUpperCase()}
					</div>

					{availableAngles.length > 1 && (
						<nav className="flex items-center gap-1.5 rounded-full border border-white/60 bg-white/80 px-2.5 py-1 shadow-sm backdrop-blur-md" aria-label="View angle">
							{availableAngles.map((a) => (
								<button
									key={a}
									type="button"
									onClick={() => setAngle(a)}
									className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full transition-all ${
										a === angle ? "bg-[var(--color-ink-900)] text-white shadow-xs" : "text-[var(--color-ink-600)] hover:text-[var(--color-ink-900)]"
									}`}
								>
									{ANGLE_LABELS[a]}
								</button>
							))}
						</nav>
					)}
				</div>
			</div>
		</div>
	);
}

/* ─── Side Margin Measurement Badge (Keeps center model 100% unobstructed) ─── */

function MarginMeasurement({ tag, value, top, side }: { tag: string; value: string; top: string; side: "left" | "right" }) {
	const positionStyle = side === "left" ? { left: "10px" } : { right: "10px" };

	return (
		<div className="absolute flex items-center gap-1" style={{ top, ...positionStyle }}>
			<div className="rounded-md border border-[var(--color-ink-200)] bg-white/90 px-2 py-0.5 text-center shadow-sm backdrop-blur-md">
				<span className="block text-[8px] font-extrabold uppercase tracking-wider text-[var(--color-ink-900)]">{tag}</span>
				<span className="block text-[9px] font-semibold tabular-nums text-[var(--color-accent-700)]">{value}</span>
			</div>
		</div>
	);
}

/* ─── Vertical Dimension Line ─── */

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
	const positionStyle = side === "left" ? { left: "4px" } : { right: "4px" };

	return (
		<div className="absolute flex flex-col items-center" style={{ top, bottom, width: "12px", ...positionStyle }}>
			<svg className="h-2 w-2 shrink-0 text-[var(--color-accent-700)]" viewBox="0 0 10 10">
				<path d="M 1 8 L 5 2 L 9 8 Z" fill="currentColor" />
			</svg>
			<div className="relative flex-1 w-px border-l border-dashed border-[var(--color-accent-500)]">
				<div
					className="absolute top-1/2 -translate-y-1/2 origin-center -rotate-90 whitespace-nowrap"
					style={side === "left" ? { right: "8px" } : { left: "8px" }}
				>
					<span className="rounded-full border border-[var(--color-accent-200)] bg-white/90 px-1.5 py-0.5 text-[7px] font-extrabold uppercase tracking-widest text-[var(--color-accent-800)] shadow-2xs backdrop-blur-xs">
						{label} {value}
					</span>
				</div>
			</div>
			<svg className="h-2 w-2 shrink-0 text-[var(--color-accent-700)]" viewBox="0 0 10 10">
				<path d="M 1 2 L 5 8 L 9 2 Z" fill="currentColor" />
			</svg>
		</div>
	);
}
