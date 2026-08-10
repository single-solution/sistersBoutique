"use client";

import { useEffect, useRef, useState } from "react";

import { DEFAULT_BODY_MEASUREMENTS, type CompleteBodyMeasurements } from "@/lib/catalog/sizeFit";

interface GarmentHemline {
	label: string;
	/** Length in inches, measured from the shoulder down. */
	lengthInches: number;
}

interface FitPreviewProps {
	measurements: CompleteBodyMeasurements;
	garment?: GarmentHemline[];
}

type AnimatedBodyState = CompleteBodyMeasurements;

interface BodyLandmarks {
	neckY: number;
	shoulderY: number;
	bustY: number;
	waistY: number;
	hipY: number;
	crotchY: number;
	elbowY: number;
	wristY: number;
	kneeY: number;
	ankleY: number;
	floorY: number;
	shoulderHalfWidth: number;
	bustHalfWidth: number;
	waistHalfWidth: number;
	hipHalfWidth: number;
	hipJointHalfWidth: number;
	kneeHalfWidth: number;
	ankleHalfWidth: number;
	leftElbowX: number;
	leftWristX: number;
	upperArmHalfWidth: number;
	forearmHalfWidth: number;
	thighHalfWidth: number;
}

const BASE_BUST_INCHES = DEFAULT_BODY_MEASUREMENTS.bust;
const BASE_HEIGHT_INCHES = DEFAULT_BODY_MEASUREMENTS.height;
const BODY_CENTER_X = 120;
const BODY_CANVAS_BOTTOM_MARGIN = 2;
const MEASUREMENT_ANIMATION_MS = 280;
const HEIGHT_RESPONSE_RANGE_INCHES = 20;
const MAX_HEIGHT_SCALE_CHANGE = 0.12;
const SVG_UNITS_PER_BODY_INCH = 4.75;
const SVG_VERTICAL_UNITS_PER_INCH = 8.05;
const SVG_ARM_UNITS_PER_INCH = 8.25;
const UNDERARM_INSET = 8;
const UNDERARM_DROP = 28;
const BODY_DEPTH_RATIOS = {
	bust: 0.72,
	waist: 0.68,
	hip: 0.78,
	thigh: 0.82,
	upperArm: 0.85,
} as const;
const BASE_VERTICAL_LANDMARKS = {
	neckY: 78,
	shoulderY: 110,
	bustY: 158,
	waistY: 207,
} as const;

export function FitPreview({ measurements, garment }: FitPreviewProps) {
	const animatedBodyState = useAnimatedBodyState(measurements);

	return (
		<figure className="flex flex-col items-center">
			<div className="aspect-[3/4] w-full overflow-hidden bg-[var(--color-canvas)]">
				<BodyIllustration bodyState={animatedBodyState} garment={garment} />
			</div>
		</figure>
	);
}

interface BodyIllustrationProps {
	bodyState: AnimatedBodyState;
	garment?: GarmentHemline[];
}

function BodyIllustration({ bodyState, garment }: BodyIllustrationProps) {
	const landmarks = resolveBodyLandmarks(bodyState);
	const torsoPath = buildTorsoPath(landmarks);
	const leftArmPath = buildLeftArmPath(landmarks);
	const leftLegPath = buildLeftLegPath(landmarks);

	return (
		<svg
			viewBox={`35 0 170 ${landmarks.floorY + BODY_CANVAS_BOTTOM_MARGIN}`}
			className="h-full w-full"
			preserveAspectRatio="xMidYMid meet"
			role="img"
			aria-label="Body-shape preview"
		>
			<g fill="var(--color-canvas)" stroke="var(--color-ink-900)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
				<path d={leftLegPath} />
				<path d={leftLegPath} transform="translate(240 0) scale(-1 1)" />
				<ellipse cx={BODY_CENTER_X} cy="46" rx="22" ry="32" />
				<path d={torsoPath} />
				<path d={leftArmPath} />
				<path d={leftArmPath} transform="translate(240 0) scale(-1 1)" />
			</g>
			<g fill="none" stroke="var(--color-ink-700)" strokeWidth="1.1" strokeLinecap="round">
				<path d={`M120 16 V${landmarks.neckY + 4} M99 43 Q120 46 141 43`} />
				<path d={`M${BODY_CENTER_X - landmarks.bustHalfWidth} ${landmarks.bustY} H${BODY_CENTER_X + landmarks.bustHalfWidth}`} />
				<path d={`M${BODY_CENTER_X - landmarks.waistHalfWidth} ${landmarks.waistY} H${BODY_CENTER_X + landmarks.waistHalfWidth}`} />
				<path
					d={`M${BODY_CENTER_X - landmarks.hipHalfWidth} ${landmarks.hipY + 1} Q98 ${landmarks.hipY + 14} 120 ${landmarks.crotchY - 2} Q142 ${
						landmarks.hipY + 14
					} ${BODY_CENTER_X + landmarks.hipHalfWidth} ${landmarks.hipY + 1}`}
				/>
				<circle cx="120" cy={landmarks.waistY + 8} r="1.3" fill="var(--color-ink-700)" stroke="none" />
				<path
					d={`M${BODY_CENTER_X - landmarks.kneeHalfWidth - 4} ${landmarks.kneeY} Q${BODY_CENTER_X - landmarks.kneeHalfWidth} ${
						landmarks.kneeY - 3
					} ${BODY_CENTER_X - landmarks.kneeHalfWidth + 4} ${landmarks.kneeY} M${BODY_CENTER_X + landmarks.kneeHalfWidth - 4} ${
						landmarks.kneeY
					} Q${BODY_CENTER_X + landmarks.kneeHalfWidth} ${landmarks.kneeY - 3} ${BODY_CENTER_X + landmarks.kneeHalfWidth + 4} ${landmarks.kneeY}`}
				/>
				<path
					d={`M${landmarks.leftWristX - 1} ${landmarks.wristY + 9} Q${landmarks.leftWristX - 2} ${landmarks.wristY + 18} ${
						landmarks.leftWristX
					} ${landmarks.wristY + 25} M${landmarks.leftWristX + 3} ${landmarks.wristY + 12} L${landmarks.leftWristX + 5} ${landmarks.wristY + 24}`}
				/>
				<path
					d={`M${landmarks.leftWristX - 1} ${landmarks.wristY + 9} Q${landmarks.leftWristX - 2} ${landmarks.wristY + 18} ${
						landmarks.leftWristX
					} ${landmarks.wristY + 25} M${landmarks.leftWristX + 3} ${landmarks.wristY + 12} L${landmarks.leftWristX + 5} ${landmarks.wristY + 24}`}
					transform="translate(240 0) scale(-1 1)"
				/>
			</g>
			{garment?.map((hemline) => {
				const hemlineY = landmarks.shoulderY + (hemline.lengthInches / bodyState.height) * (landmarks.floorY - landmarks.shoulderY);
				if (hemlineY <= landmarks.shoulderY || hemlineY >= landmarks.floorY) {
					return null;
				}

				return (
					<g key={hemline.label}>
						<line
							x1={BODY_CENTER_X - landmarks.hipHalfWidth - 10}
							y1={hemlineY}
							x2={BODY_CENTER_X + landmarks.hipHalfWidth + 10}
							y2={hemlineY}
							stroke="var(--color-accent-700)"
							strokeWidth="1.5"
							strokeDasharray="4 4"
						/>
						<text x={BODY_CENTER_X + landmarks.hipHalfWidth + 13} y={hemlineY + 4} fontSize="10" fill="var(--color-accent-800)" fontWeight="600">
							{hemline.label}
						</text>
					</g>
				);
			})}
		</svg>
	);
}

function buildTorsoPath(landmarks: BodyLandmarks) {
	const { neckY, shoulderY, bustY, waistY, hipY, shoulderHalfWidth, bustHalfWidth, waistHalfWidth, hipHalfWidth, upperArmHalfWidth } = landmarks;
	const shoulderJoinHalfWidth = shoulderHalfWidth + upperArmHalfWidth;

	return `
		M ${BODY_CENTER_X - hipHalfWidth} ${hipY + 4}
		C ${BODY_CENTER_X - hipHalfWidth} ${hipY - 16}, ${BODY_CENTER_X - waistHalfWidth} ${waistY + 23}, ${BODY_CENTER_X - waistHalfWidth} ${waistY}
		C ${BODY_CENTER_X - waistHalfWidth} ${waistY - 22}, ${BODY_CENTER_X - bustHalfWidth} ${bustY + 26}, ${BODY_CENTER_X - bustHalfWidth} ${bustY + 4}
		C ${BODY_CENTER_X - bustHalfWidth} ${bustY - 10}, ${BODY_CENTER_X - bustHalfWidth - 2} ${bustY - 22}, ${BODY_CENTER_X - shoulderHalfWidth + UNDERARM_INSET} ${shoulderY + UNDERARM_DROP}
		C ${BODY_CENTER_X - shoulderHalfWidth + 2} ${shoulderY + 16}, ${BODY_CENTER_X - shoulderHalfWidth - 2} ${shoulderY + 8}, ${BODY_CENTER_X - shoulderJoinHalfWidth} ${shoulderY + 4}
		C ${BODY_CENTER_X - 19} ${shoulderY - 10}, ${BODY_CENTER_X - 14} ${neckY + 16}, ${BODY_CENTER_X - 13} ${neckY}
		L ${BODY_CENTER_X + 13} ${neckY}
		C ${BODY_CENTER_X + 14} ${neckY + 16}, ${BODY_CENTER_X + 19} ${shoulderY - 10}, ${BODY_CENTER_X + shoulderJoinHalfWidth} ${shoulderY + 4}
		C ${BODY_CENTER_X + shoulderHalfWidth + 2} ${shoulderY + 8}, ${BODY_CENTER_X + shoulderHalfWidth - 2} ${shoulderY + 16}, ${BODY_CENTER_X + shoulderHalfWidth - UNDERARM_INSET} ${shoulderY + UNDERARM_DROP}
		C ${BODY_CENTER_X + bustHalfWidth + 2} ${bustY - 22}, ${BODY_CENTER_X + bustHalfWidth} ${bustY - 10}, ${BODY_CENTER_X + bustHalfWidth} ${bustY + 4}
		C ${BODY_CENTER_X + bustHalfWidth} ${bustY + 26}, ${BODY_CENTER_X + waistHalfWidth} ${waistY - 22}, ${BODY_CENTER_X + waistHalfWidth} ${waistY}
		C ${BODY_CENTER_X + waistHalfWidth} ${waistY + 23}, ${BODY_CENTER_X + hipHalfWidth} ${hipY - 16}, ${BODY_CENTER_X + hipHalfWidth} ${hipY + 4}
	`;
}

function buildLeftArmPath(landmarks: BodyLandmarks) {
	const { shoulderY, elbowY, wristY, shoulderHalfWidth, leftElbowX, leftWristX, upperArmHalfWidth, forearmHalfWidth } = landmarks;
	const shoulderX = BODY_CENTER_X - shoulderHalfWidth;
	const elbowHalfWidth = Math.max(upperArmHalfWidth * 0.72, forearmHalfWidth);
	const wristHalfWidth = forearmHalfWidth * 0.58;

	return `
		M ${shoulderX - upperArmHalfWidth} ${shoulderY + 4}
		C ${shoulderX - upperArmHalfWidth - 1} ${shoulderY + 34}, ${leftElbowX - elbowHalfWidth} ${elbowY - 24}, ${leftElbowX - elbowHalfWidth} ${elbowY}
		C ${leftElbowX - elbowHalfWidth + 1} ${elbowY + 25}, ${leftWristX - wristHalfWidth - 1} ${wristY - 20}, ${leftWristX - wristHalfWidth} ${wristY}
		C ${leftWristX - wristHalfWidth} ${wristY + 8}, ${leftWristX - wristHalfWidth - 1} ${wristY + 18}, ${leftWristX - 3} ${wristY + 25}
		C ${leftWristX - 2} ${wristY + 29}, ${leftWristX + 1} ${wristY + 29}, ${leftWristX + 2} ${wristY + 25}
		L ${leftWristX + 2} ${wristY + 13}
		L ${leftWristX + 5} ${wristY + 27}
		C ${leftWristX + 6} ${wristY + 30}, ${leftWristX + 9} ${wristY + 29}, ${leftWristX + 8} ${wristY + 25}
		L ${leftWristX + 6} ${wristY + 8}
		C ${leftWristX + wristHalfWidth + 2} ${wristY + 4}, ${leftWristX + wristHalfWidth + 1} ${wristY + 1}, ${leftWristX + wristHalfWidth} ${wristY}
		C ${leftWristX + wristHalfWidth + 1} ${wristY - 20}, ${leftElbowX + elbowHalfWidth} ${elbowY + 25}, ${leftElbowX + elbowHalfWidth} ${elbowY}
		C ${leftElbowX + elbowHalfWidth} ${elbowY - 24}, ${shoulderX + UNDERARM_INSET} ${shoulderY + UNDERARM_DROP}, ${shoulderX + UNDERARM_INSET} ${shoulderY + UNDERARM_DROP}
	`;
}

function buildLeftLegPath(landmarks: BodyLandmarks) {
	const { hipY, crotchY, kneeY, ankleY, floorY, hipHalfWidth, hipJointHalfWidth, kneeHalfWidth, ankleHalfWidth, thighHalfWidth } = landmarks;
	const outerHipX = BODY_CENTER_X - hipHalfWidth;
	const hipJointX = BODY_CENTER_X - hipJointHalfWidth;
	const kneeX = BODY_CENTER_X - kneeHalfWidth;
	const ankleX = BODY_CENTER_X - ankleHalfWidth;
	const outerThighX = hipJointX - thighHalfWidth;

	return `
		M ${outerHipX} ${hipY + 4}
		C ${outerThighX} ${hipY + 45}, ${outerThighX + 4} ${kneeY - 42}, ${kneeX - 10} ${kneeY}
		C ${kneeX - 8} ${kneeY + 42}, ${ankleX - 6} ${ankleY - 44}, ${ankleX - 5} ${ankleY}
		C ${ankleX - 13} ${ankleY + 9}, ${ankleX - 15} ${floorY - 2}, ${ankleX - 5} ${floorY}
		L ${ankleX + 12} ${floorY}
		C ${ankleX + 15} ${floorY - 4}, ${ankleX + 10} ${ankleY + 8}, ${ankleX + 6} ${ankleY}
		C ${ankleX + 5} ${kneeY + 50}, ${kneeX + 8} ${kneeY + 8}, ${kneeX + 8} ${kneeY}
		C ${kneeX + 7} ${kneeY - 42}, ${hipJointX + 7} ${crotchY + 20}, ${BODY_CENTER_X} ${crotchY}
	`;
}

function resolveBodyLandmarks(bodyState: AnimatedBodyState): BodyLandmarks {
	const heightScale = 1 + clamp((bodyState.height - BASE_HEIGHT_INCHES) / HEIGHT_RESPONSE_RANGE_INCHES, -MAX_HEIGHT_SCALE_CHANGE, MAX_HEIGHT_SCALE_CHANGE);
	const bustHalfWidth = clamp(circumferenceToHalfWidth(bodyState.bust, BODY_DEPTH_RATIOS.bust), 24, 46);
	const waistHalfWidth = clamp(circumferenceToHalfWidth(bodyState.waist, BODY_DEPTH_RATIOS.waist), 19, 43);
	const hipHalfWidth = clamp(circumferenceToHalfWidth(bodyState.hip, BODY_DEPTH_RATIOS.hip), 27, 50);
	const shoulderHalfWidth = clamp(38 * (bodyState.bust / BASE_BUST_INCHES) ** 0.45 * heightScale ** 0.25, 34, 49);
	const hipJointHalfWidth = clamp(hipHalfWidth * 0.62, 19, 31);
	const kneeHalfWidth = clamp(hipJointHalfWidth * 0.78, 15, 24);
	const ankleHalfWidth = clamp(kneeHalfWidth * 0.82, 13, 19);
	const upperArmHalfWidth = clamp(circumferenceToHalfWidth(bodyState.upperArm, BODY_DEPTH_RATIOS.upperArm), 5, 12);
	const forearmHalfWidth = clamp(upperArmHalfWidth * 0.68, 4, 8);
	const thighHalfWidth = clamp(circumferenceToHalfWidth(bodyState.thigh, BODY_DEPTH_RATIOS.thigh), 12, 24);
	const neckY = BASE_VERTICAL_LANDMARKS.neckY;
	const shoulderY = scaleBodyY(BASE_VERTICAL_LANDMARKS.shoulderY, heightScale);
	const bustY = scaleBodyY(BASE_VERTICAL_LANDMARKS.bustY, heightScale);
	const waistY = scaleBodyY(BASE_VERTICAL_LANDMARKS.waistY, heightScale);
	const floorY = waistY + bodyState.waistToFloor * SVG_VERTICAL_UNITS_PER_INCH;
	const safeInseam = clamp(bodyState.inseam, bodyState.waistToFloor * 0.55, bodyState.waistToFloor - 8);
	const crotchY = floorY - safeInseam * SVG_VERTICAL_UNITS_PER_INCH;
	const hipY = waistY + (crotchY - waistY) * 0.56;
	const kneeY = crotchY + (floorY - crotchY) * 0.48;
	const ankleY = floorY - 20 * heightScale;
	const leftShoulderX = BODY_CENTER_X - shoulderHalfWidth;
	const armLength = bodyState.armLength * SVG_ARM_UNITS_PER_INCH;
	const desiredArmSpread = Math.max(18, hipHalfWidth - shoulderHalfWidth + 16);
	const armSpread = Math.min(desiredArmSpread, armLength * 0.42, leftShoulderX - 45);
	const armDrop = Math.sqrt(Math.max(armLength ** 2 - armSpread ** 2, 0));
	const leftWristX = leftShoulderX - armSpread;
	const wristY = shoulderY + armDrop;
	const upperArmRatio = 0.51;
	const leftElbowX = leftShoulderX + (leftWristX - leftShoulderX) * upperArmRatio;
	const elbowY = shoulderY + (wristY - shoulderY) * upperArmRatio;

	return {
		neckY,
		shoulderY,
		bustY,
		waistY,
		hipY,
		crotchY,
		elbowY,
		wristY,
		kneeY,
		ankleY,
		floorY,
		shoulderHalfWidth,
		bustHalfWidth,
		waistHalfWidth,
		hipHalfWidth,
		hipJointHalfWidth,
		kneeHalfWidth,
		ankleHalfWidth,
		leftElbowX,
		leftWristX,
		upperArmHalfWidth,
		forearmHalfWidth,
		thighHalfWidth,
	};
}

function useAnimatedBodyState(measurements: CompleteBodyMeasurements) {
	const { bust, waist, hip, height, armLength, waistToFloor, inseam, thigh, upperArm, sleeveLength } = measurements;
	const [animatedState, setAnimatedState] = useState<AnimatedBodyState>(measurements);
	const currentStateRef = useRef<AnimatedBodyState>(measurements);

	useEffect(() => {
		const targetState = { bust, waist, hip, height, armLength, waistToFloor, inseam, thigh, upperArm, sleeveLength };
		const startState = currentStateRef.current;
		const startedAt = performance.now();
		let animationFrameId = 0;

		function publishTargetState() {
			currentStateRef.current = targetState;
			setAnimatedState(targetState);
		}

		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
			animationFrameId = window.requestAnimationFrame(publishTargetState);

			return () => window.cancelAnimationFrame(animationFrameId);
		}

		function animateFrame(timestamp: number) {
			const progress = clamp((timestamp - startedAt) / MEASUREMENT_ANIMATION_MS, 0, 1);
			const easedProgress = 1 - (1 - progress) ** 3;
			const nextState = {
				bust: mix(startState.bust, targetState.bust, easedProgress),
				waist: mix(startState.waist, targetState.waist, easedProgress),
				hip: mix(startState.hip, targetState.hip, easedProgress),
				height: mix(startState.height, targetState.height, easedProgress),
				armLength: mix(startState.armLength, targetState.armLength, easedProgress),
				waistToFloor: mix(startState.waistToFloor, targetState.waistToFloor, easedProgress),
				inseam: mix(startState.inseam, targetState.inseam, easedProgress),
				thigh: mix(startState.thigh, targetState.thigh, easedProgress),
				upperArm: mix(startState.upperArm, targetState.upperArm, easedProgress),
				sleeveLength: mix(startState.sleeveLength, targetState.sleeveLength, easedProgress),
			};
			currentStateRef.current = nextState;
			setAnimatedState(nextState);
			if (progress < 1) {
				animationFrameId = window.requestAnimationFrame(animateFrame);
			}
		}

		animationFrameId = window.requestAnimationFrame(animateFrame);

		return () => window.cancelAnimationFrame(animationFrameId);
	}, [armLength, bust, height, hip, inseam, sleeveLength, thigh, upperArm, waist, waistToFloor]);

	return animatedState;
}

function scaleBodyY(baseY: number, heightScale: number) {
	return BASE_VERTICAL_LANDMARKS.neckY + (baseY - BASE_VERTICAL_LANDMARKS.neckY) * heightScale;
}

function circumferenceToHalfWidth(circumference: number, depthRatio: number) {
	const ellipsePerimeterFactor = Math.PI * (3 * (1 + depthRatio) - Math.sqrt((3 + depthRatio) * (1 + 3 * depthRatio)));

	return (circumference / ellipsePerimeterFactor) * SVG_UNITS_PER_BODY_INCH;
}

function mix(start: number, end: number, progress: number) {
	return start + (end - start) * progress;
}

function clamp(value: number, minimum: number, maximum: number) {
	return Math.min(Math.max(value, minimum), maximum);
}
