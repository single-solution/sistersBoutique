"use client";

/**
 * Looping look ribbon — center image large, sides smaller.
 * Entrance: main look rises from bottom-center, then side looks peel out from behind it.
 * Even counts (4+): opposite look parks behind center so left/right stay balanced.
 * Click a side look to animate it to center (no drag/swipe). Click center for full-view.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";

import type { PdpStudyLook } from "./pdpStudySample";
import styles from "./pdpStudy.module.css";
import { usePresence } from "@/components/shared/motion/usePresence";

gsap.registerPlugin(useGSAP);

const FULL_VIEW_EXIT_MS = 220;

interface PdpStudyLookStageProps {
	looks: PdpStudyLook[];
	className?: string;
	variant?: "viewport" | "editorial";
}

interface RibbonPose {
	xPercent: number;
	yPercent: number;
	y: number;
	z: number;
	rotationY: number;
	scale: number;
	opacity: number;
	zIndex: number;
	imageX: number;
	imageScale: number;
}

/** Signed circular distance from active index to slide index. */
function circularDelta(slideIndex: number, activeIndex: number, count: number): number {
	let delta = slideIndex - activeIndex;
	const half = count / 2;
	if (delta > half) {
		delta -= count;
	}
	if (delta < -half) {
		delta += count;
	}
	return delta;
}

/**
 * Even counts put one look exactly opposite the center (one side only).
 * For 4+, park that look behind the hero so left/right stay equal.
 * Skip for 2 looks — the other image must stay visible.
 */
function isParkedOpposite(delta: number, count: number): boolean {
	return count >= 4 && count % 2 === 0 && Math.abs(delta) === count / 2;
}

function ribbonPose(delta: number, count: number): RibbonPose {
	if (isParkedOpposite(delta, count)) {
		return {
			xPercent: -50,
			yPercent: -50,
			y: 0,
			z: -140,
			rotationY: 0,
			scale: 0.86,
			opacity: 0,
			zIndex: 4,
			imageX: 0,
			imageScale: 1.08,
		};
	}

	const abs = Math.abs(delta);
	const isCenter = delta === 0;
	return {
		xPercent: -50 + delta * 62,
		yPercent: -50,
		y: isCenter ? 0 : 22 + abs * 8,
		z: isCenter ? 80 : -abs * 40,
		rotationY: isCenter ? 0 : delta * -9,
		scale: isCenter ? 1 : Math.max(0.52, 0.78 - abs * 0.14),
		opacity: isCenter ? 1 : Math.max(0.35, 0.72 - abs * 0.2),
		zIndex: isCenter ? 50 : 40 - abs,
		imageX: -delta * 42,
		imageScale: isCenter ? 1.08 : 1.18,
	};
}

/**
 * When slides overlap, the large center frame steals clicks aimed at a side
 * look. Prefer the smallest rect that contains the point so side frames win.
 */
function hitSlideIndex(slides: NodeListOf<HTMLElement>, clientX: number, clientY: number): number | null {
	let bestIndex: number | null = null;
	let bestArea = Number.POSITIVE_INFINITY;

	slides.forEach((slide, slideIndex) => {
		if (slide.style.pointerEvents === "none" || Number(gsap.getProperty(slide, "opacity")) <= 0.05) {
			return;
		}
		const rect = slide.getBoundingClientRect();
		if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) {
			return;
		}
		const area = rect.width * rect.height;
		if (area < bestArea) {
			bestArea = area;
			bestIndex = slideIndex;
		}
	});

	return bestIndex;
}

function applySlidePose(slide: HTMLElement, pose: RibbonPose, duration: number, ease: string) {
	const image = slide.querySelector<HTMLElement>(`.${styles.ribbonParallax}`);
	const isHidden = pose.opacity <= 0;
	gsap.to(slide, {
		xPercent: pose.xPercent,
		yPercent: pose.yPercent,
		y: pose.y,
		z: pose.z,
		rotationY: pose.rotationY,
		scale: pose.scale,
		opacity: pose.opacity,
		zIndex: pose.zIndex,
		duration,
		ease,
		overwrite: "auto",
		force3D: true,
	});
	slide.style.pointerEvents = isHidden ? "none" : "";
	if (image) {
		gsap.to(image, {
			x: pose.imageX,
			scale: pose.imageScale,
			duration,
			ease,
			overwrite: "auto",
			force3D: true,
		});
	}
}

export function PdpStudyLookStage({ looks, className, variant = "viewport" }: PdpStudyLookStageProps) {
	const rootRef = useRef<HTMLElement>(null);
	const trackRef = useRef<HTMLDivElement>(null);
	const [index, setIndex] = useState(0);
	const [isFullView, setIsFullView] = useState(false);
	const { isMounted: fullViewMounted, status: fullViewStatus } = usePresence(isFullView, FULL_VIEW_EXIT_MS);
	const fullViewClosing = fullViewStatus === "closing";

	const indexRef = useRef(0);
	const hasLaidOut = useRef(false);
	const reducedMotion = useRef(false);
	const pointerHandledRef = useRef(false);
	const dragStartX = useRef<number | null>(null);
	const dragStartY = useRef<number | null>(null);

	const count = looks.length;
	const active = looks[index] ?? looks[0];

	useEffect(() => {
		reducedMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
	}, []);

	useEffect(() => {
		indexRef.current = index;
	}, [index]);

	useEffect(() => {
		if (!isFullView) {
			return;
		}
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				setIsFullView(false);
			}
		};
		window.addEventListener("keydown", onKeyDown);
		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		return () => {
			window.removeEventListener("keydown", onKeyDown);
			document.body.style.overflow = previousOverflow;
		};
	}, [isFullView]);

	const goTo = useCallback(
		(nextIndex: number) => {
			if (count === 0) {
				return;
			}
			const wrapped = ((nextIndex % count) + count) % count;
			if (wrapped === indexRef.current) {
				return;
			}
			setIndex(wrapped);
		},
		[count],
	);

	const selectLook = useCallback(
		(lookIndex: number) => {
			if (lookIndex === indexRef.current) {
				setIsFullView(true);
				return;
			}
			goTo(lookIndex);
		},
		[goTo],
	);

	const layoutRibbon = useCallback(
		(activeIndex: number, animate: boolean) => {
			const track = trackRef.current;
			if (!track || count === 0) {
				return;
			}
			const slides = track.querySelectorAll<HTMLElement>(`.${styles.ribbonSlide}`);
			const duration = reducedMotion.current || !animate ? 0 : 1.05;
			const ease = "power3.inOut";

			slides.forEach((slide, slideIndex) => {
				const delta = circularDelta(slideIndex, activeIndex, count);
				const pose = ribbonPose(delta, count);
				applySlidePose(slide, pose, duration, ease);
				slide.dataset.active = delta === 0 ? "true" : "false";
				slide.setAttribute("aria-hidden", delta === 0 ? "false" : "true");
			});
		},
		[count],
	);

	const playEntrance = useCallback(() => {
		const track = trackRef.current;
		if (!track || count === 0) {
			return;
		}
		const slides = Array.from(track.querySelectorAll<HTMLElement>(`.${styles.ribbonSlide}`));
		const activeIndex = 0;

		if (reducedMotion.current) {
			layoutRibbon(activeIndex, false);
			return;
		}

		slides.forEach((slide, slideIndex) => {
			const delta = circularDelta(slideIndex, activeIndex, count);
			const isCenter = delta === 0;
			const image = slide.querySelector<HTMLElement>(`.${styles.ribbonParallax}`);

			if (isCenter) {
				gsap.set(slide, {
					xPercent: -50,
					yPercent: -50,
					x: 0,
					y: 220,
					z: 80,
					rotationY: 0,
					scale: 0.86,
					opacity: 0,
					zIndex: 50,
					force3D: true,
				});
				if (image) {
					gsap.set(image, { x: 0, scale: 1.14, force3D: true });
				}
			} else {
				/* Parked behind the main look until the rise completes */
				gsap.set(slide, {
					xPercent: -50,
					yPercent: -50,
					x: 0,
					y: 0,
					z: -20 - Math.abs(delta) * 10,
					rotationY: 0,
					scale: 0.9,
					opacity: 0,
					zIndex: 20 - Math.abs(delta),
					force3D: true,
				});
				if (image) {
					gsap.set(image, { x: 0, scale: 1.08, force3D: true });
				}
			}
			slide.dataset.active = isCenter ? "true" : "false";
			slide.setAttribute("aria-hidden", isCenter ? "false" : "true");
		});

		const centerSlide = slides[activeIndex];
		const centerImage = centerSlide?.querySelector<HTMLElement>(`.${styles.ribbonParallax}`);
		const timeline = gsap.timeline({ defaults: { force3D: true } });

		if (centerSlide) {
			/* Keep xPercent/yPercent in the tween so centering cannot drift if
			   width resolves mid-flight after soft navigation. */
			timeline.fromTo(
				centerSlide,
				{
					xPercent: -50,
					yPercent: -50,
					x: 0,
					y: 220,
					z: 80,
					rotationY: 0,
					scale: 0.86,
					opacity: 0,
				},
				{
					xPercent: -50,
					yPercent: -50,
					x: 0,
					y: 0,
					z: 80,
					rotationY: 0,
					scale: 1,
					opacity: 1,
					duration: 1.55,
					ease: "power2.out",
				},
				0,
			);
			if (centerImage) {
				timeline.to(centerImage, { scale: 1.08, duration: 1.55, ease: "power2.out" }, 0);
			}
		}

		/* Sides begin once the main look is halfway through its rise. */
		timeline.addLabel("main-done", 1.55 / 2);

		const sideEntries = slides
			.map((slide, slideIndex) => ({ slide, slideIndex, delta: circularDelta(slideIndex, activeIndex, count) }))
			.filter((entry) => entry.delta !== 0 && !isParkedOpposite(entry.delta, count))
			.sort((left, right) => Math.abs(left.delta) - Math.abs(right.delta));

		sideEntries.forEach((entry, staggerIndex) => {
			const pose = ribbonPose(entry.delta, count);
			const image = entry.slide.querySelector<HTMLElement>(`.${styles.ribbonParallax}`);
			const startAt = `main-done+=${staggerIndex * 0.08}`;
			timeline.to(
				entry.slide,
				{
					xPercent: pose.xPercent,
					yPercent: pose.yPercent,
					y: pose.y,
					z: pose.z,
					rotationY: pose.rotationY,
					scale: pose.scale,
					opacity: pose.opacity,
					zIndex: pose.zIndex,
					duration: 0.9,
					ease: "power3.out",
				},
				startAt,
			);
			entry.slide.style.pointerEvents = "";
			if (image) {
				timeline.to(image, { x: pose.imageX, scale: pose.imageScale, duration: 0.9, ease: "power3.out" }, startAt);
			}
		});

		/* Keep the opposite look (even counts) stacked behind — never on one wing */
		slides.forEach((slide, slideIndex) => {
			const delta = circularDelta(slideIndex, activeIndex, count);
			if (!isParkedOpposite(delta, count)) {
				return;
			}
			const pose = ribbonPose(delta, count);
			const image = slide.querySelector<HTMLElement>(`.${styles.ribbonParallax}`);
			gsap.set(slide, {
				xPercent: pose.xPercent,
				yPercent: pose.yPercent,
				y: pose.y,
				z: pose.z,
				rotationY: pose.rotationY,
				scale: pose.scale,
				opacity: pose.opacity,
				zIndex: pose.zIndex,
				force3D: true,
			});
			slide.style.pointerEvents = "none";
			if (image) {
				gsap.set(image, { x: pose.imageX, scale: pose.imageScale, force3D: true });
			}
		});
	}, [count, layoutRibbon]);

	useGSAP(
		() => {
			if (hasLaidOut.current) {
				layoutRibbon(index, true);
				return;
			}

			const track = trackRef.current;
			if (!track || count === 0) {
				return;
			}

			/* Hide + park on this layout frame so soft-nav never paints top-left-at-center. */
			const slides = Array.from(track.querySelectorAll<HTMLElement>(`.${styles.ribbonSlide}`));
			slides.forEach((slide) => {
				gsap.set(slide, {
					xPercent: -50,
					yPercent: -50,
					x: 0,
					y: 220,
					opacity: 0,
					force3D: true,
				});
			});

			let cancelled = false;
			const frame = requestAnimationFrame(() => {
				if (cancelled || hasLaidOut.current) {
					return;
				}
				playEntrance();
				hasLaidOut.current = true;
			});

			return () => {
				cancelled = true;
				cancelAnimationFrame(frame);
			};
		},
		{ scope: rootRef, dependencies: [index, count, layoutRibbon, playEntrance] },
	);

	const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
		if (event.pointerType === "mouse" && event.button !== 0) {
			return;
		}
		dragStartX.current = event.clientX;
		dragStartY.current = event.clientY;
	};

	const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
		if (dragStartX.current === null) {
			return;
		}
		const deltaX = event.clientX - dragStartX.current;
		const deltaY = event.clientY - (dragStartY.current ?? event.clientY);
		dragStartX.current = null;
		dragStartY.current = null;

		if (Math.abs(deltaX) > 28 && Math.abs(deltaX) > Math.abs(deltaY)) {
			pointerHandledRef.current = true;
			if (deltaX < 0) {
				goTo(indexRef.current + 1);
			} else {
				goTo(indexRef.current - 1);
			}
			return;
		}

		onTrackPointerUpCapture(event);
	};

	const onTrackPointerUpCapture = (event: React.PointerEvent<HTMLDivElement>) => {
		if (event.pointerType === "mouse" && event.button !== 0) {
			return;
		}
		const track = trackRef.current;
		if (!track) {
			return;
		}
		const slides = track.querySelectorAll<HTMLElement>(`.${styles.ribbonSlide}`);
		const hitIndex = hitSlideIndex(slides, event.clientX, event.clientY);
		if (hitIndex == null) {
			return;
		}
		pointerHandledRef.current = true;
		selectLook(hitIndex);
	};

	return (
		<section
			ref={rootRef}
			className={`${styles.lookStage} ${styles.lookStageRibbon} ${variant === "editorial" ? styles.lookStageEditorial : ""} ${className ?? ""}`}
			aria-label="Garment looks"
		>
			<div className={styles.ribbonViewport}>
				<div
					ref={trackRef}
					className={styles.ribbonTrack}
					onPointerDown={onPointerDown}
					onPointerUp={onPointerUp}
					role="presentation"
				>
					{looks.map((look, lookIndex) => {
						const isActive = lookIndex === index;
						return (
							<button
								key={look.id}
								type="button"
								className={styles.ribbonSlide}
								tabIndex={isActive ? 0 : -1}
								aria-label={isActive ? `${look.label} — open full view` : `Show ${look.label}`}
								aria-current={isActive ? "true" : undefined}
								onClick={() => {
									if (pointerHandledRef.current) {
										pointerHandledRef.current = false;
										return;
									}
									selectLook(lookIndex);
								}}
							>
								<span className={styles.ribbonFrame}>
									<span className={styles.ribbonParallax}>
										<Image
											src={look.src}
											alt={look.alt}
											fill
											draggable={false}
											sizes="(max-width: 900px) 88vw, 52vw"
											priority={lookIndex === 0}
											className={styles.lookImage}
										/>
									</span>
									<span className={styles.ribbonLookNumber} aria-hidden>
										Look {String(lookIndex + 1).padStart(2, "0")}
									</span>
									{isActive ? (
										<span className={styles.ribbonLookHint} aria-hidden>
											Click for full preview
										</span>
									) : null}
								</span>
							</button>
						);
					})}
				</div>
			</div>

			{fullViewMounted && active ? (
				<div
					className={`${styles.lookFullView} ${fullViewClosing ? "animate-sheet-fade-out" : "animate-sheet-fade"}`}
					role="dialog"
					aria-modal="true"
					aria-label={active.label}
					onClick={() => setIsFullView(false)}
				>
					<button type="button" className={styles.lookFullClose} aria-label="Close full view" onClick={() => setIsFullView(false)}>
						Close
					</button>
					<div
						className={`${styles.lookFullFrame} ${fullViewClosing ? "animate-lightbox-out" : "animate-lightbox-in"}`}
						onClick={(event) => event.stopPropagation()}
					>
						<Image src={active.src} alt={active.alt} fill sizes="100vw" className={styles.lookFullImage} priority draggable={false} />
					</div>
				</div>
			) : null}
		</section>
	);
}
