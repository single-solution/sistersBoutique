"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import "lenis/dist/lenis.css";

gsap.registerPlugin(ScrollTrigger);

/** Soft couture glide on desktop pointers; native touch stays elsewhere. */
const SMOOTH_SCROLL_QUERY = "(min-width: 1024px) and (prefers-reduced-motion: no-preference) and (pointer: fine)";
const COUTURE_SCROLL_DURATION_SECONDS = 1.15;
const GSAP_LAG_SMOOTHING_DISABLED = 0;
const GSAP_LAG_SMOOTHING_DEFAULT = 500;

function easeCoutureScroll(progress: number): number {
	return Math.min(1, 1.001 - Math.pow(2, -10 * progress));
}

/**
 * Sitewide physics-smoothed scroll for desktop.
 * Syncs Lenis with GSAP ScrollTrigger so pins, parallax, and craft blur stay accurate.
 */
export function SmoothScroll() {
	const pathname = usePathname();
	const lenisRef = useRef<Lenis | null>(null);

	useEffect(() => {
		const media = window.matchMedia(SMOOTH_SCROLL_QUERY);
		let tickerUpdate: ((time: number) => void) | null = null;
		let removeScrollListener: (() => void) | null = null;

		const destroy = () => {
			if (tickerUpdate) {
				gsap.ticker.remove(tickerUpdate);
				tickerUpdate = null;
			}
			removeScrollListener?.();
			removeScrollListener = null;
			lenisRef.current?.destroy();
			lenisRef.current = null;
			document.documentElement.classList.remove("lenis", "lenis-smooth");
			gsap.ticker.lagSmoothing(GSAP_LAG_SMOOTHING_DEFAULT);
			ScrollTrigger.refresh();
		};

		const create = () => {
			destroy();
			if (!media.matches) {
				return;
			}

			const lenis = new Lenis({
				autoRaf: false,
				duration: COUTURE_SCROLL_DURATION_SECONDS,
				easing: easeCoutureScroll,
				smoothWheel: true,
				syncTouch: false,
				touchMultiplier: 1,
				wheelMultiplier: 0.92,
			});
			lenisRef.current = lenis;
			document.documentElement.classList.add("lenis", "lenis-smooth");

			const handleScroll = () => {
				ScrollTrigger.update();
			};
			lenis.on("scroll", handleScroll);
			removeScrollListener = () => {
				lenis.off("scroll", handleScroll);
			};

			tickerUpdate = (time: number) => {
				lenis.raf(time * 1_000);
			};
			gsap.ticker.add(tickerUpdate);
			gsap.ticker.lagSmoothing(GSAP_LAG_SMOOTHING_DISABLED);
			ScrollTrigger.refresh();
		};

		create();
		media.addEventListener("change", create);

		return () => {
			media.removeEventListener("change", create);
			destroy();
		};
	}, []);

	useEffect(() => {
		const lenis = lenisRef.current;
		if (lenis) {
			lenis.scrollTo(0, { immediate: true });
			lenis.resize();
		}
		ScrollTrigger.refresh();
	}, [pathname]);

	return null;
}
