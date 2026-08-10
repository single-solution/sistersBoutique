"use client";

import { useRef, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollTrigger);

interface GalleryMotionProps {
	children: ReactNode;
	preset: "quiet-gallery" | "textile-exhibition" | "couture-salon";
}

const REVEAL_DURATION_SECONDS = 0.85;
const REVEAL_STAGGER_SECONDS = 0.07;
const PARALLAX_SCRUB_SECONDS = 0.85;
const HORIZONTAL_SCRUB_SECONDS = 0.65;
const CRAFT_BLUR_SCRUB_SECONDS = 0.7;
const CRAFT_SCALE_DESKTOP = 0.985;
const CRAFT_SCALE_MOBILE = 0.992;
/** Outgoing craft card softens as the next scrolls in — intensity ramps with scroll. */
const CRAFT_BLUR_DESKTOP_PX = 6;
const CRAFT_BLUR_MOBILE_PX = 3;
/** Parallax images enter slightly scaled-up + soft, settling to sharp as they rise. */
const PARALLAX_SCALE_FROM = 1.08;
const PARALLAX_BLUR_FROM_PX = 1.5;
const FAST_SCROLL_VELOCITY = 2_000;
const FAST_SCROLL_CHECK_MS = 50;
const FAST_SCROLL_SETTLE_MS = 800;

export function GalleryMotion({ children, preset }: GalleryMotionProps) {
	const containerRef = useRef<HTMLDivElement>(null);

	useGSAP(
		() => {
			const root = containerRef.current;
			if (!root) {
				return;
			}

			const media = gsap.matchMedia();
			media.add(
				{
					canAnimate: "(prefers-reduced-motion: no-preference)",
					isDesktop: "(min-width: 1024px)",
				},
				(mediaContext) => {
					if (!mediaContext.conditions?.canAnimate) {
						return;
					}

					const heroCopy = root.querySelector<HTMLElement>("[data-gallery-hero-copy]");
					const heroImage = root.querySelector<HTMLElement>("[data-gallery-hero-image]");
					const revealTargets = gsap.utils.toArray<HTMLElement>("[data-gallery-reveal]");
					const revealedTargets = new WeakSet<Element>();
					const heroStartScale = preset === "couture-salon" ? 1.12 : preset === "textile-exhibition" ? 1.08 : 1.06;
					const completeReveal = (targets: Element[]) => {
						targets.forEach((target) => revealedTargets.add(target));
						gsap.set(targets, { autoAlpha: 1, y: 0, overwrite: "auto" });
					};
					const animateReveal = (targets: Element[]) => {
						const pendingTargets = targets.filter((target) => !revealedTargets.has(target));
						if (pendingTargets.length === 0) {
							return;
						}

						pendingTargets.forEach((target) => revealedTargets.add(target));
						gsap.to(pendingTargets, {
							autoAlpha: 1,
							y: 0,
							duration: REVEAL_DURATION_SECONDS,
							ease: "power2.out",
							stagger: REVEAL_STAGGER_SECONDS,
							overwrite: "auto",
						});
					};

					const entrance = gsap.timeline({ defaults: { ease: "power1.out" } });
					if (heroImage) {
						entrance.fromTo(heroImage, { scale: heroStartScale }, { scale: 1, duration: 2.55 }, 0);
					}
					if (heroCopy) {
						entrance.fromTo(heroCopy, { autoAlpha: 0, y: 32 }, { autoAlpha: 1, y: 0, duration: 1.85 }, 0.4);
					}

					gsap.set(revealTargets, { autoAlpha: 0, y: mediaContext.conditions?.isDesktop ? 38 : 24 });
					ScrollTrigger.batch(revealTargets, {
						start: "top 90%",
						fastScrollEnd: true,
						onEnter: animateReveal,
						onLeave: completeReveal,
						onEnterBack: completeReveal,
						onLeaveBack: completeReveal,
					});

					let previousScrollPosition = window.scrollY;
					let previousScrollTime = performance.now();
					let previousWheelTime = performance.now();
					let completionTimeout: number | null = null;
					let completionInterval: number | null = null;
					const completePassedTargets = () => {
						const passedTargets = revealTargets.filter((target) => target.getBoundingClientRect().top < window.innerHeight);
						completeReveal(passedTargets);
					};
					const clearCompletion = () => {
						if (completionTimeout !== null) {
							window.clearTimeout(completionTimeout);
							completionTimeout = null;
						}
						if (completionInterval !== null) {
							window.clearInterval(completionInterval);
							completionInterval = null;
						}
					};
					const startCompletion = () => {
						completePassedTargets();
						clearCompletion();
						completionInterval = window.setInterval(completePassedTargets, FAST_SCROLL_CHECK_MS);
						completionTimeout = window.setTimeout(clearCompletion, FAST_SCROLL_SETTLE_MS);
					};
					const handleFastScroll = () => {
						const scrollTime = performance.now();
						const elapsedSeconds = Math.max((scrollTime - previousScrollTime) / 1_000, 0.016);
						const scrollVelocity = Math.abs(window.scrollY - previousScrollPosition) / elapsedSeconds;
						previousScrollPosition = window.scrollY;
						previousScrollTime = scrollTime;
						if (scrollVelocity >= FAST_SCROLL_VELOCITY) {
							startCompletion();
						}
					};
					const handleFastWheel = (event: WheelEvent) => {
						const wheelTime = performance.now();
						const elapsedSeconds = Math.max((wheelTime - previousWheelTime) / 1_000, 0.016);
						const wheelVelocity = Math.abs(event.deltaY) / elapsedSeconds;
						previousWheelTime = wheelTime;
						if (wheelVelocity >= FAST_SCROLL_VELOCITY || Math.abs(event.deltaY) >= window.innerHeight / 2) {
							startCompletion();
						}
					};
					const removeFastScrollListeners = () => {
						window.removeEventListener("scroll", handleFastScroll);
						window.removeEventListener("wheel", handleFastWheel);
						clearCompletion();
					};

					window.addEventListener("scroll", handleFastScroll, { passive: true });
					window.addEventListener("wheel", handleFastWheel, { passive: true });

					const setupCraftCardTransitions = () => {
						if (preset !== "couture-salon") {
							return;
						}

						const isDesktop = mediaContext.conditions?.isDesktop ?? false;
						const craftCards = gsap.utils.toArray<HTMLElement>("[data-gallery-craft-card]", root);
						craftCards.slice(0, -1).forEach((previousCard, index) => {
							const incomingCard = craftCards[index + 1];
							if (!incomingCard) {
								return;
							}

							gsap.fromTo(
								previousCard,
								{ scale: 1, filter: "blur(0px)", transformOrigin: "center center" },
								{
									scale: isDesktop ? CRAFT_SCALE_DESKTOP : CRAFT_SCALE_MOBILE,
									filter: `blur(${isDesktop ? CRAFT_BLUR_DESKTOP_PX : CRAFT_BLUR_MOBILE_PX}px)`,
									ease: "none",
									force3D: true,
									scrollTrigger: {
										trigger: incomingCard,
										start: isDesktop ? "top 80%" : "top 82%",
										end: isDesktop ? "top 16%" : "top 24%",
										scrub: CRAFT_BLUR_SCRUB_SECONDS,
										invalidateOnRefresh: true,
									},
								},
							);
						});
					};

					if (!mediaContext.conditions?.isDesktop) {
						setupCraftCardTransitions();
						return removeFastScrollListeners;
					}

					const parallaxImages = gsap.utils.toArray<HTMLElement>("[data-gallery-parallax]");
					parallaxImages.forEach((image) => {
						const frame = image.parentElement;
						if (!frame) {
							return;
						}

						/* Cinematic focus-in: drift + scale-down + de-blur, scrubbed to scroll.
						 * The scale-up also hides edge gaps created by the vertical drift. */
						gsap.fromTo(
							image,
							{ yPercent: -2, scale: PARALLAX_SCALE_FROM, filter: `blur(${PARALLAX_BLUR_FROM_PX}px)` },
							{
								yPercent: 2,
								scale: 1,
								filter: "blur(0px)",
								ease: "none",
								force3D: true,
								scrollTrigger: {
									trigger: frame,
									start: "top bottom",
									end: "bottom top",
									scrub: PARALLAX_SCRUB_SECONDS,
									invalidateOnRefresh: true,
								},
							},
						);
					});

					const horizontalSection = root.querySelector<HTMLElement>("[data-gallery-horizontal]");
					const horizontalTrack = horizontalSection?.querySelector<HTMLElement>("[data-gallery-horizontal-track]");
					if (horizontalSection && horizontalTrack) {
						const getDistance = () => Math.max(horizontalTrack.scrollWidth - horizontalSection.clientWidth, 0);
						gsap.to(horizontalTrack, {
							x: () => -getDistance(),
							ease: "none",
							scrollTrigger: {
								trigger: horizontalSection,
								start: "top top",
								end: () => `+=${Math.max(getDistance(), window.innerHeight * 0.55)}`,
								pin: true,
								scrub: HORIZONTAL_SCRUB_SECONDS,
								anticipatePin: 1,
								invalidateOnRefresh: true,
							},
						});
					}

					setupCraftCardTransitions();

					return removeFastScrollListeners;
				},
			);

			return () => media.revert();
		},
		{ scope: containerRef, dependencies: [preset], revertOnUpdate: true },
	);

	return <div ref={containerRef}>{children}</div>;
}
