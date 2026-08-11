"use client";

import Image from "next/image";
import { useEffect, useMemo } from "react";

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
	predictedSize?: BodySize;
	className?: string;
}

/* ─── Image Matrix (15 Total Images) ─── */

export const ANGLES: ViewAngle[] = ["front", "side", "back"];
export const BODY_SIZES: BodySize[] = ["xs", "s", "m", "l", "xl"];
export const ANGLE_LABELS: Record<ViewAngle, string> = { front: "Front", side: "Side", back: "Back" };

export const IMAGE_MATRIX: Record<ViewAngle, Record<BodySize, string>> = {
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
		xl: "/images/fit-models/side-xl.jpg",
	},
	back: {
		xs: "/images/fit-models/back-xs.jpg",
		s: "/images/fit-models/back-s.jpg",
		m: "/images/fit-models/back-m.jpg",
		l: "/images/fit-models/back-l.jpg",
		xl: "/images/fit-models/back-xl.jpg",
	},
};

export function hasAngleImages(angle: ViewAngle): boolean {
	return Object.keys(IMAGE_MATRIX[angle]).length > 0;
}

function resolveBodySize(measurements?: { bust?: number; waist?: number; hip?: number }): BodySize {
	const bust = measurements?.bust ?? 36;
	const waist = measurements?.waist ?? 29;
	const hip = measurements?.hip ?? 38;

	// Score size category (1=XS, 2=S, 3=M, 4=L, 5=XL) for each primary body circumference
	const bustScore = bust < 33 ? 1 : bust < 36 ? 2 : bust < 39 ? 3 : bust < 43 ? 4 : 5;
	const waistScore = waist < 26 ? 1 : waist < 29 ? 2 : waist < 32 ? 3 : waist < 36 ? 4 : 5;
	const hipScore = hip < 36 ? 1 : hip < 39 ? 2 : hip < 42 ? 3 : hip < 46 ? 4 : 5;

	// Evaluate max category so increasing Bust, Waist, OR Hip updates the model fit preview image in real-time
	const finalScore = Math.max(bustScore, waistScore, hipScore);

	if (finalScore <= 1) return "xs";
	if (finalScore === 2) return "s";
	if (finalScore === 3) return "m";
	if (finalScore === 4) return "l";
	return "xl";
}

export function FitPreview({ measurements, garment, angle = "front", predictedSize, className = "" }: FitPreviewProps) {
	const bodySize = useMemo(
		() => predictedSize ?? resolveBodySize(measurements),
		[predictedSize, measurements?.bust, measurements?.waist, measurements?.hip],
	);

	// Preload all 15 model images immediately into browser GPU cache
	useEffect(() => {
		for (const a of ANGLES) {
			for (const s of BODY_SIZES) {
				const url = IMAGE_MATRIX[a][s];
				if (url) {
					const img = new window.Image();
					img.src = url;
				}
			}
		}
	}, []);

	return (
		<div className={`relative flex h-full w-full flex-col select-none ${className}`}>
			{/* Edge-to-edge full bleed studio canvas (#f5f3f0) */}
			<div className="relative flex-1 w-full overflow-hidden bg-[#f5f3f0]">
				{/* 
				  Hardware-Accelerated Persistent Image Stack:
				  Renders all layers simultaneously without React unmounting keys.
				  Smoothly transitions opacity over 600ms so the canvas NEVER flashes blank.
				*/}
				{ANGLES.flatMap((a) =>
					BODY_SIZES.map((s) => {
						const src = IMAGE_MATRIX[a][s];
						const isActive = a === angle && s === bodySize;
						return (
							<div
								key={`layer-${a}-${s}`}
								className="absolute inset-0 transition-opacity duration-600 ease-in-out pointer-events-none will-change-[opacity]"
								style={{
									opacity: isActive ? 1 : 0,
									zIndex: isActive ? 10 : 1,
								}}
							>
								<Image
									src={src}
									alt={`${ANGLE_LABELS[a]} view — ${s.toUpperCase()} body fit`}
									fill
									sizes="(max-width: 768px) 100vw, 600px"
									className="object-cover object-center"
									priority
								/>
							</div>
						);
					}),
				)}
			</div>
		</div>
	);
}
