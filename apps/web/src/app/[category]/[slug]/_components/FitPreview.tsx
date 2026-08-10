"use client";

import Image from "next/image";
import { useMemo } from "react";

/* ─── Types ─── */

interface GarmentHemline {
	label: string;
	lengthInches: number;
}

export type ViewAngle = "front" | "side" | "back";
export type BodySize = "xs" | "s" | "m" | "l" | "xl";

interface FitPreviewProps {
	measurements?: { bust?: number; waist?: number; hip?: number };
	garment?: GarmentHemline[];
	angle?: ViewAngle;
	className?: string;
}

/* ─── Image Matrix ─── */

export const ANGLES: ViewAngle[] = ["front", "side", "back"];
export const ANGLE_LABELS: Record<ViewAngle, string> = { front: "Front", side: "Side", back: "Back" };

export const IMAGE_MATRIX: Record<ViewAngle, Partial<Record<BodySize, string>>> = {
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

export function hasAngleImages(angle: ViewAngle): boolean {
	return Object.keys(IMAGE_MATRIX[angle]).length > 0;
}

function resolveBodySize(bust: number): BodySize {
	if (bust < 33) return "xs";
	if (bust < 36) return "s";
	if (bust < 39) return "m";
	if (bust < 43) return "l";
	return "xl";
}

export function FitPreview({ measurements, angle = "front", className = "" }: FitPreviewProps) {
	const bust = measurements?.bust ?? 36;
	const bodySize = useMemo(() => resolveBodySize(bust), [bust]);

	return (
		<div className={`relative flex h-full w-full flex-col select-none ${className}`}>
			{/* Edge-to-edge full bleed clean image canvas */}
			<div className="relative flex-1 w-full overflow-hidden bg-[#f5f3f0]">
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
								className="object-contain object-center"
								priority={isActive}
							/>
						</div>
					);
				})}
			</div>
		</div>
	);
}
