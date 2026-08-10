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
const BODY_CANVAS_BOTTOM_MARGIN = 6;
const MEASUREMENT_ANIMATION_MS = 280;
const HEIGHT_RESPONSE_RANGE_INCHES = 20;
const MAX_HEIGHT_SCALE_CHANGE = 0.08;
const SVG_UNITS_PER_BODY_INCH = 3.85;
const SVG_VERTICAL_UNITS_PER_INCH = 4.85;
const SVG_ARM_UNITS_PER_INCH = 4.95;
const UNDERARM_INSET = 6;
const UNDERARM_DROP = 22;
const BODY_DEPTH_RATIOS = {
	bust: 0.70,
	waist: 0.64,
	hip: 0.74,
	thigh: 0.78,
	upperArm: 0.80,
} as const;
const BASE_VERTICAL_LANDMARKS = {
	neckY: 56,
	shoulderY: 78,
	bustY: 114,
	waistY: 152,
} as const;

export function FitPreview({ measurements, garment }: FitPreviewProps) {
	const animatedBodyState = useAnimatedBodyState(measurements);

	return (
		<figure className="flex flex-col items-center">
			<div className="aspect-[3/4] w-full overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-ink-100)] bg-gradient-to-b from-[var(--color-surface)] via-[var(--color-canvas)] to-[var(--color-canvas-deep)] p-2 shadow-inner">
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
	const kameezPath = buildKameezPath(landmarks);
	const leftShalwarPath = buildLeftShalwarPath(landmarks);

	const kameezLengthInches = garment?.find((g) => /kameez|shirt|hem/i.test(g.label))?.lengthInches ?? 39;
	const trouserLengthInches = garment?.find((g) => /trouser|shalwar|bottom/i.test(g.label))?.lengthInches ?? 38;

	const bustLeftX = BODY_CENTER_X - landmarks.bustHalfWidth - 6;
	const bustRightX = BODY_CENTER_X + landmarks.bustHalfWidth + 6;
	const waistLeftX = BODY_CENTER_X - landmarks.waistHalfWidth - 6;
	const waistRightX = BODY_CENTER_X + landmarks.waistHalfWidth + 6;
	const hipLeftX = BODY_CENTER_X - landmarks.hipHalfWidth - 6;
	const hipRightX = BODY_CENTER_X + landmarks.hipHalfWidth + 6;

	const kameezHemY = landmarks.kneeY - 10;
	const kameezDimX = 26;
	const trouserDimX = 214;

	return (
		<svg
			viewBox="0 0 240 375"
			className="h-full w-full select-none drop-shadow-md"
			preserveAspectRatio="xMidYMid meet"
			role="img"
			aria-label="3D Shalwar Kameez Fit Model"
		>
			<defs>
				{/* 3D Studio Mannequin Lighting Gradients */}
				<radialGradient id="headShade" cx="35%" cy="30%" r="70%">
					<stop offset="0%" stopColor="#ffffff" />
					<stop offset="60%" stopColor="#e8e2dc" />
					<stop offset="100%" stopColor="#c4bbb1" />
				</radialGradient>
				<linearGradient id="mannequinBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
					<stop offset="0%" stopColor="#f5f0eb" />
					<stop offset="50%" stopColor="#e2d8ce" />
					<stop offset="100%" stopColor="#c9bea4" />
				</linearGradient>

				{/* Silk Outfit Gradients */}
				<linearGradient id="kameezSilkGrad" x1="0%" y1="0%" x2="0%" y2="100%">
					<stop offset="0%" stopColor="#f8f3eb" />
					<stop offset="40%" stopColor="#ede3d5" />
					<stop offset="100%" stopColor="#d9c9b5" />
				</linearGradient>
				<linearGradient id="shalwarSilkGrad" x1="0%" y1="0%" x2="0%" y2="100%">
					<stop offset="0%" stopColor="#eae1d6" />
					<stop offset="100%" stopColor="#d2c4b3" />
				</linearGradient>

				{/* Double-Headed Arrowhead Markers */}
				<marker id="arrowLeft" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
					<path d="M 8 1 L 2 5 L 8 9 Z" fill="var(--color-ink-900)" />
				</marker>
				<marker id="arrowRight" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto">
					<path d="M 2 1 L 8 5 L 2 9 Z" fill="var(--color-ink-900)" />
				</marker>
				<marker id="accentArrowUp" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
					<path d="M 8 1 L 2 5 L 8 9 Z" fill="var(--color-accent-700)" />
				</marker>
				<marker id="accentArrowDown" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto">
					<path d="M 2 1 L 8 5 L 2 9 Z" fill="var(--color-accent-700)" />
				</marker>
			</defs>

			{/* Underlying 3D Studio Mannequin Body Base */}
			<g stroke="#9e9183" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
				{/* Legs */}
				<path d={leftLegPath} fill="url(#mannequinBodyGrad)" />
				<path d={leftLegPath} fill="url(#mannequinBodyGrad)" transform="translate(240 0) scale(-1 1)" />
				{/* 3D Oval Head */}
				<ellipse cx={BODY_CENTER_X} cy="30" rx="15" ry="21" fill="url(#headShade)" stroke="#9e9183" strokeWidth="1.2" />
				{/* Torso */}
				<path d={torsoPath} fill="url(#mannequinBodyGrad)" />
				{/* Arms */}
				<path d={leftArmPath} fill="url(#mannequinBodyGrad)" />
				<path d={leftArmPath} fill="url(#mannequinBodyGrad)" transform="translate(240 0) scale(-1 1)" />
			</g>

			{/* Shalwar / Trouser Pants Layer */}
			<g fill="url(#shalwarSilkGrad)" stroke="#877867" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
				<path d={leftShalwarPath} />
				<path d={leftShalwarPath} transform="translate(240 0) scale(-1 1)" />
				{/* Trouser Ankle Cuff Folds (*Poncha*) */}
				<line x1={BODY_CENTER_X - landmarks.ankleHalfWidth - 3} y1={landmarks.ankleY} x2={BODY_CENTER_X - landmarks.ankleHalfWidth + 9} y2={landmarks.ankleY} stroke="#6b5e4f" strokeWidth="1.4" />
				<line x1={BODY_CENTER_X + landmarks.ankleHalfWidth - 9} y1={landmarks.ankleY} x2={BODY_CENTER_X + landmarks.ankleHalfWidth + 3} y2={landmarks.ankleY} stroke="#6b5e4f" strokeWidth="1.4" />
			</g>

			{/* Kameez (Shirt / Tunic) Outfit Layer */}
			<g fill="url(#kameezSilkGrad)" stroke="#7a6b5a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
				<path d={kameezPath} />
				{/* Placket / Embroidered Collar Neckline Accent */}
				<path d={`M ${BODY_CENTER_X - 9} ${landmarks.neckY + 2} L ${BODY_CENTER_X} ${landmarks.neckY + 16} L ${BODY_CENTER_X + 9} ${landmarks.neckY + 2}`} fill="none" stroke="var(--color-accent-700)" strokeWidth="1.6" />
				<line x1={BODY_CENTER_X} y1={landmarks.neckY + 16} x2={BODY_CENTER_X} y2={landmarks.bustY - 8} stroke="var(--color-accent-700)" strokeWidth="1.4" />
				{/* Side Slit (*Chaak*) Lines */}
				<line x1={BODY_CENTER_X - landmarks.hipHalfWidth - 5} y1={landmarks.hipY + 12} x2={BODY_CENTER_X - landmarks.hipHalfWidth - 5} y2={kameezHemY} stroke="#6e5f50" strokeWidth="1" strokeDasharray="2 2" />
				<line x1={BODY_CENTER_X + landmarks.hipHalfWidth + 5} y1={landmarks.hipY + 12} x2={BODY_CENTER_X + landmarks.hipHalfWidth + 5} y2={kameezHemY} stroke="#6e5f50" strokeWidth="1" strokeDasharray="2 2" />
			</g>

			{/* Horizontal Double-Headed Measurement Arrows */}
			<g stroke="var(--color-ink-900)" strokeWidth="1.4" strokeLinecap="round">
				{/* BUST Arrow */}
				<line x1={bustLeftX} y1={landmarks.bustY} x2={bustRightX} y2={landmarks.bustY} markerStart="url(#arrowLeft)" markerEnd="url(#arrowRight)" strokeDasharray="3 3" />
				{/* WAIST Arrow */}
				<line x1={waistLeftX} y1={landmarks.waistY} x2={waistRightX} y2={landmarks.waistY} markerStart="url(#arrowLeft)" markerEnd="url(#arrowRight)" strokeDasharray="3 3" />
				{/* HIPS Arrow */}
				<line x1={hipLeftX} y1={landmarks.hipY} x2={hipRightX} y2={landmarks.hipY} markerStart="url(#arrowLeft)" markerEnd="url(#arrowRight)" strokeDasharray="3 3" />
			</g>

			{/* Horizontal Measurement Labels */}
			<g textAnchor="middle" fontSize="9" fontWeight="800" fill="var(--color-ink-900)">
				{/* BUST Label Badge */}
				<rect x={BODY_CENTER_X - 20} y={landmarks.bustY - 7} width="40" height="14" rx="3" fill="var(--color-surface)" stroke="var(--color-ink-300)" strokeWidth="0.8" />
				<text x={BODY_CENTER_X} y={landmarks.bustY + 3.5}>BUST</text>

				{/* WAIST Label Badge */}
				<rect x={BODY_CENTER_X - 22} y={landmarks.waistY - 7} width="44" height="14" rx="3" fill="var(--color-surface)" stroke="var(--color-ink-300)" strokeWidth="0.8" />
				<text x={BODY_CENTER_X} y={landmarks.waistY + 3.5}>WAIST</text>

				{/* HIPS Label Badge */}
				<rect x={BODY_CENTER_X - 19} y={landmarks.hipY - 7} width="38" height="14" rx="3" fill="var(--color-surface)" stroke="var(--color-ink-300)" strokeWidth="0.8" />
				<text x={BODY_CENTER_X} y={landmarks.hipY + 3.5}>HIPS</text>
			</g>

			{/* Vertical Kameez Length Arrow (Left Side) */}
			<g stroke="var(--color-accent-700)" strokeWidth="1.3" strokeLinecap="round">
				<line x1={kameezDimX} y1={landmarks.shoulderY} x2={kameezDimX} y2={kameezHemY} markerStart="url(#accentArrowUp)" markerEnd="url(#accentArrowDown)" strokeDasharray="3 3" />
				<line x1={kameezDimX - 4} y1={landmarks.shoulderY} x2={BODY_CENTER_X - landmarks.shoulderHalfWidth} y2={landmarks.shoulderY} stroke="var(--color-accent-400)" strokeWidth="0.8" strokeDasharray="2 2" />
				<line x1={kameezDimX - 4} y1={kameezHemY} x2={BODY_CENTER_X - landmarks.hipHalfWidth - 6} y2={kameezHemY} stroke="var(--color-accent-400)" strokeWidth="0.8" strokeDasharray="2 2" />
				<text x={kameezDimX - 6} y={(landmarks.shoulderY + kameezHemY) / 2} writingMode="tb" textAnchor="middle" fontSize="8.5" fontWeight="700" fill="var(--color-accent-800)">
					KAMEEZ L. ({kameezLengthInches}&quot;)
				</text>
			</g>

			{/* Vertical Trouser Length Arrow (Right Side) */}
			<g stroke="var(--color-accent-700)" strokeWidth="1.3" strokeLinecap="round">
				<line x1={trouserDimX} y1={landmarks.hipY} x2={trouserDimX} y2={landmarks.ankleY} markerStart="url(#accentArrowUp)" markerEnd="url(#accentArrowDown)" strokeDasharray="3 3" />
				<line x1={trouserDimX + 4} y1={landmarks.hipY} x2={BODY_CENTER_X + landmarks.hipHalfWidth} y2={landmarks.hipY} stroke="var(--color-accent-400)" strokeWidth="0.8" strokeDasharray="2 2" />
				<line x1={trouserDimX + 4} y1={landmarks.ankleY} x2={BODY_CENTER_X + landmarks.ankleHalfWidth} y2={landmarks.ankleY} stroke="var(--color-accent-400)" strokeWidth="0.8" strokeDasharray="2 2" />
				<text x={trouserDimX + 8} y={(landmarks.hipY + landmarks.ankleY) / 2} writingMode="tb" textAnchor="middle" fontSize="8.5" fontWeight="700" fill="var(--color-accent-800)">
					TROUSER L. ({trouserLengthInches}&quot;)
				</text>
			</g>
		</svg>
	);
}

function buildTorsoPath(landmarks: BodyLandmarks) {
	const { neckY, shoulderY, bustY, waistY, hipY, shoulderHalfWidth, bustHalfWidth, waistHalfWidth, hipHalfWidth, upperArmHalfWidth } = landmarks;
	const shoulderJoinHalfWidth = shoulderHalfWidth + upperArmHalfWidth * 0.7;

	return `
		M ${BODY_CENTER_X - hipHalfWidth} ${hipY + 3}
		C ${BODY_CENTER_X - hipHalfWidth} ${hipY - 12}, ${BODY_CENTER_X - waistHalfWidth} ${waistY + 16}, ${BODY_CENTER_X - waistHalfWidth} ${waistY}
		C ${BODY_CENTER_X - waistHalfWidth} ${waistY - 16}, ${BODY_CENTER_X - bustHalfWidth} ${bustY + 18}, ${BODY_CENTER_X - bustHalfWidth} ${bustY + 3}
		C ${BODY_CENTER_X - bustHalfWidth} ${bustY - 8}, ${BODY_CENTER_X - bustHalfWidth - 2} ${bustY - 16}, ${BODY_CENTER_X - shoulderHalfWidth + UNDERARM_INSET} ${shoulderY + UNDERARM_DROP}
		C ${BODY_CENTER_X - shoulderHalfWidth + 2} ${shoulderY + 12}, ${BODY_CENTER_X - shoulderHalfWidth - 2} ${shoulderY + 6}, ${BODY_CENTER_X - shoulderJoinHalfWidth} ${shoulderY + 3}
		C ${BODY_CENTER_X - 16} ${shoulderY - 8}, ${BODY_CENTER_X - 12} ${neckY + 12}, ${BODY_CENTER_X - 11} ${neckY}
		L ${BODY_CENTER_X + 11} ${neckY}
		C ${BODY_CENTER_X + 12} ${neckY + 12}, ${BODY_CENTER_X + 16} ${shoulderY - 8}, ${BODY_CENTER_X + shoulderJoinHalfWidth} ${shoulderY + 3}
		C ${BODY_CENTER_X + shoulderHalfWidth + 2} ${shoulderY + 6}, ${BODY_CENTER_X + shoulderHalfWidth - 2} ${shoulderY + 12}, ${BODY_CENTER_X + shoulderHalfWidth - UNDERARM_INSET} ${shoulderY + UNDERARM_DROP}
		C ${BODY_CENTER_X + bustHalfWidth + 2} ${bustY - 16}, ${BODY_CENTER_X + bustHalfWidth} ${bustY - 8}, ${BODY_CENTER_X + bustHalfWidth} ${bustY + 3}
		C ${BODY_CENTER_X + bustHalfWidth} ${bustY + 18}, ${BODY_CENTER_X + waistHalfWidth} ${waistY - 16}, ${BODY_CENTER_X + waistHalfWidth} ${waistY}
		C ${BODY_CENTER_X + waistHalfWidth} ${waistY + 16}, ${BODY_CENTER_X + hipHalfWidth} ${hipY - 12}, ${BODY_CENTER_X + hipHalfWidth} ${hipY + 3}
	`;
}

function buildLeftArmPath(landmarks: BodyLandmarks) {
	const { shoulderY, elbowY, wristY, shoulderHalfWidth, leftElbowX, leftWristX, upperArmHalfWidth, forearmHalfWidth } = landmarks;
	const shoulderX = BODY_CENTER_X - shoulderHalfWidth;
	const elbowHalfWidth = Math.max(upperArmHalfWidth * 0.7, forearmHalfWidth);
	const wristHalfWidth = forearmHalfWidth * 0.6;

	return `
		M ${shoulderX - upperArmHalfWidth} ${shoulderY + 3}
		C ${shoulderX - upperArmHalfWidth} ${shoulderY + 24}, ${leftElbowX - elbowHalfWidth} ${elbowY - 16}, ${leftElbowX - elbowHalfWidth} ${elbowY}
		C ${leftElbowX - elbowHalfWidth} ${elbowY + 18}, ${leftWristX - wristHalfWidth} ${wristY - 14}, ${leftWristX - wristHalfWidth} ${wristY}
		C ${leftWristX - wristHalfWidth} ${wristY + 6}, ${leftWristX - wristHalfWidth} ${wristY + 12}, ${leftWristX - 2} ${wristY + 16}
		C ${leftWristX - 1} ${wristY + 18}, ${leftWristX + 1} ${wristY + 18}, ${leftWristX + 2} ${wristY + 16}
		L ${leftWristX + 2} ${wristY + 8}
		L ${leftWristX + 4} ${wristY + 18}
		C ${leftWristX + 5} ${wristY + 20}, ${leftWristX + 7} ${wristY + 19}, ${leftWristX + 6} ${wristY + 16}
		L ${leftWristX + 5} ${wristY + 6}
		C ${leftWristX + wristHalfWidth + 1} ${wristY + 3}, ${leftWristX + wristHalfWidth} ${wristY + 1}, ${leftWristX + wristHalfWidth} ${wristY}
		C ${leftWristX + wristHalfWidth} ${wristY - 14}, ${leftElbowX + elbowHalfWidth} ${elbowY + 18}, ${leftElbowX + elbowHalfWidth} ${elbowY}
		C ${leftElbowX + elbowHalfWidth} ${elbowY - 16}, ${shoulderX + UNDERARM_INSET} ${shoulderY + UNDERARM_DROP}, ${shoulderX + UNDERARM_INSET} ${shoulderY + UNDERARM_DROP}
	`;
}

function buildLeftLegPath(landmarks: BodyLandmarks) {
	const { hipY, crotchY, kneeY, ankleY, floorY, hipHalfWidth, hipJointHalfWidth, kneeHalfWidth, ankleHalfWidth, thighHalfWidth } = landmarks;
	const outerHipX = BODY_CENTER_X - hipHalfWidth;
	const hipJointX = BODY_CENTER_X - hipJointHalfWidth;
	const kneeX = BODY_CENTER_X - kneeHalfWidth;
	const ankleX = BODY_CENTER_X - ankleHalfWidth;
	const outerThighX = hipJointX - thighHalfWidth * 0.9;

	return `
		M ${outerHipX} ${hipY + 3}
		C ${outerThighX} ${hipY + 30}, ${outerThighX + 2} ${kneeY - 28}, ${kneeX - 6} ${kneeY}
		C ${kneeX - 5} ${kneeY + 28}, ${ankleX - 4} ${ankleY - 28}, ${ankleX - 3} ${ankleY}
		C ${ankleX - 8} ${ankleY + 6}, ${ankleX - 10} ${floorY - 2}, ${ankleX - 3} ${floorY}
		L ${ankleX + 8} ${floorY}
		C ${ankleX + 10} ${floorY - 3}, ${ankleX + 7} ${ankleY + 5}, ${ankleX + 4} ${ankleY}
		C ${ankleX + 3} ${kneeY + 34}, ${kneeX + 5} ${kneeY + 5}, ${kneeX + 5} ${kneeY}
		C ${kneeX + 4} ${kneeY - 28}, ${hipJointX + 5} ${crotchY + 14}, ${BODY_CENTER_X} ${crotchY}
	`;
}

function buildKameezPath(landmarks: BodyLandmarks) {
	const { neckY, shoulderY, bustY, waistY, hipY, kneeY, shoulderHalfWidth, bustHalfWidth, waistHalfWidth, hipHalfWidth } = landmarks;
	const kameezHemY = kneeY - 10;
	const kameezFlareHalfWidth = hipHalfWidth + 6;
	const slitY = hipY + 12;

	return `
		M ${BODY_CENTER_X - 12} ${neckY + 2}
		Q ${BODY_CENTER_X} ${neckY + 16} ${BODY_CENTER_X + 12} ${neckY + 2}
		L ${BODY_CENTER_X + shoulderHalfWidth + 3} ${shoulderY + 2}
		C ${BODY_CENTER_X + bustHalfWidth + 4} ${bustY - 4}, ${BODY_CENTER_X + waistHalfWidth + 3} ${waistY - 8}, ${BODY_CENTER_X + waistHalfWidth + 3} ${waistY}
		C ${BODY_CENTER_X + waistHalfWidth + 3} ${waistY + 12}, ${BODY_CENTER_X + hipHalfWidth + 4} ${hipY - 4}, ${BODY_CENTER_X + kameezFlareHalfWidth} ${slitY}
		L ${BODY_CENTER_X + kameezFlareHalfWidth} ${kameezHemY}
		L ${BODY_CENTER_X - kameezFlareHalfWidth} ${kameezHemY}
		L ${BODY_CENTER_X - kameezFlareHalfWidth} ${slitY}
		C ${BODY_CENTER_X - hipHalfWidth - 4} ${hipY - 4}, ${BODY_CENTER_X - waistHalfWidth - 3} ${waistY + 12}, ${BODY_CENTER_X - waistHalfWidth - 3} ${waistY}
		C ${BODY_CENTER_X - waistHalfWidth - 3} ${waistY - 8}, ${BODY_CENTER_X - bustHalfWidth - 4} ${bustY - 4}, ${BODY_CENTER_X - shoulderHalfWidth - 3} ${shoulderY + 2}
		Z
	`;
}

function buildLeftShalwarPath(landmarks: BodyLandmarks) {
	const { crotchY, kneeY, ankleY, hipJointHalfWidth, kneeHalfWidth, ankleHalfWidth, thighHalfWidth } = landmarks;
	const hipJointX = BODY_CENTER_X - hipJointHalfWidth;
	const kneeX = BODY_CENTER_X - kneeHalfWidth;
	const ankleX = BODY_CENTER_X - ankleHalfWidth;
	const outerThighX = hipJointX - thighHalfWidth * 1.05;

	return `
		M ${BODY_CENTER_X - 2} ${crotchY + 8}
		C ${outerThighX - 4} ${crotchY + 28}, ${kneeX - 8} ${kneeY - 12}, ${kneeX - 7} ${kneeY + 10}
		C ${kneeX - 6} ${kneeY + 30}, ${ankleX - 5} ${ankleY - 16}, ${ankleX - 4} ${ankleY}
		L ${ankleX + 6} ${ankleY}
		C ${ankleX + 5} ${kneeY + 32}, ${kneeX + 6} ${kneeY + 8}, ${kneeX + 6} ${kneeY}
		C ${kneeX + 5} ${kneeY - 24}, ${hipJointX + 6} ${crotchY + 16}, ${BODY_CENTER_X - 2} ${crotchY + 8}
		Z
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
