"use client";

import { MapPin } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { StoreSettings } from "@store/shared";
import { useHasMounted } from "@/lib/core/useHasMounted";
import { useGlobalEagerLoad } from "@/lib/useGlobalEagerLoad";

// Copied from homePageDesktopSections
const MAP_EMBED_ZOOM = 15;
/** Scroll-zoom sweep: a continuous scale on a fixed-tile embed — no src reloads,
 *  so the zoom is smooth instead of flashing between Google tile refreshes. */
const SCROLL_ZOOM_BASE = 13;
const SCROLL_SCALE_MIN = 1;
const SCROLL_SCALE_MAX = 1.9;
/** Exact store location — keeps a centred pin even when address fields are blank. */
const STORE_COORDINATES = "30.9896059,72.7556244";
const STORE_MAPS_URL = "https://maps.app.goo.gl/ZaHgLTYTNE5BvMu99";

function clamp(value: number, min: number, max: number): number {
	return Math.min(Math.max(value, min), max);
}

export interface StoreMapEmbedProps {
	className?: string;
	settings: StoreSettings;
	/** Zoom the map in on page scroll (smooth CSS scale) and disable manual pan/zoom. */
	scrollZoom?: boolean;
}

export function StoreMapEmbed({ className = "", settings, scrollZoom = false }: StoreMapEmbedProps) {
	const globalEager = useGlobalEagerLoad();
	const hasMounted = useHasMounted();
	const rootRef = useRef<HTMLDivElement>(null);
	const iframeRef = useRef<HTMLIFrameElement>(null);
	const [inView, setInView] = useState(false);
	// Server + first client render stay `false` (hydration-safe). After mount the
	// embed loads eagerly when the loader hints it, when observers are unavailable,
	// or once it scrolls near the viewport.
	const shouldLoad = hasMounted && (globalEager || typeof IntersectionObserver === "undefined" || inView);

	const addressParts = [settings.storeAddressLine1, settings.storeAddressLine2].map((part) => part?.trim()).filter(Boolean);
	const mapLabel = addressParts.length > 0 ? addressParts.join(", ") : "Sister's Outfits";
	const zoom = scrollZoom ? SCROLL_ZOOM_BASE : MAP_EMBED_ZOOM;
	// Always centre the embed on the exact store coordinates — geocoding the
	// address text drifts the pin off the real shopfront.
	const mapEmbedUrl = `https://www.google.com/maps?q=${encodeURIComponent(STORE_COORDINATES)}&z=${zoom}&output=embed`;
	const mapsLink = settings.socialGoogleMaps?.trim() || STORE_MAPS_URL;

	// Preload the embed a little before it scrolls into view (rootMargin) rather
	// than waiting for the native lazy threshold at the viewport edge.
	useEffect(() => {
		if (!hasMounted || shouldLoad || typeof IntersectionObserver === "undefined") {
			return;
		}
		const target = rootRef.current?.parentElement ?? rootRef.current;
		if (!target) {
			return;
		}
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries.some((entry) => entry.isIntersecting)) {
					setInView(true);
					observer.disconnect();
				}
			},
			{ rootMargin: "600px 0px" },
		);
		observer.observe(target);
		return () => observer.disconnect();
	}, [hasMounted, shouldLoad]);

	useEffect(() => {
		const iframe = iframeRef.current;
		// Measure the band (the frame's parent) — on desktop the frame itself is
		// viewport-fixed for the parallax, so its own rect can't report progress.
		const band = rootRef.current?.parentElement;
		if (!scrollZoom || !iframe || !band) {
			return;
		}
		if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
			iframe.style.transform = `scale(${SCROLL_SCALE_MAX})`;
			return;
		}

		let frame = 0;
		const update = () => {
			frame = 0;
			const rect = band.getBoundingClientRect();
			const viewportHeight = window.innerHeight;
			// Reaches full zoom when the band's centre hits the viewport centre,
			// so the closest view is held while the band is still on screen.
			const progress = clamp((viewportHeight - rect.top) / (viewportHeight / 2 + rect.height / 2), 0, 1);
			const scale = SCROLL_SCALE_MIN + progress * (SCROLL_SCALE_MAX - SCROLL_SCALE_MIN);
			iframe.style.transform = `scale(${scale.toFixed(4)})`;
		};
		const onScroll = () => {
			if (frame === 0) {
				frame = window.requestAnimationFrame(update);
			}
		};

		iframe.style.transformOrigin = "center";
		iframe.style.willChange = "transform";
		update();
		window.addEventListener("scroll", onScroll, { passive: true });
		window.addEventListener("resize", onScroll, { passive: true });
		return () => {
			if (frame !== 0) {
				window.cancelAnimationFrame(frame);
			}
			window.removeEventListener("scroll", onScroll);
			window.removeEventListener("resize", onScroll);
		};
	}, [scrollZoom]);

	return (
		<div ref={rootRef} className={`relative w-full overflow-hidden bg-[var(--color-canvas-deep)] ${className}`}>
			<iframe
				ref={iframeRef}
				title={`Map of ${mapLabel}`}
				src={shouldLoad ? mapEmbedUrl : undefined}
				loading={globalEager ? "eager" : "lazy"}
				referrerPolicy="no-referrer-when-downgrade"
				allowFullScreen
				className={`absolute inset-0 h-full w-full border-0${scrollZoom ? " pointer-events-none" : ""}`}
			/>
			<a
				href={mapsLink}
				target="_blank"
				rel="noopener noreferrer"
				className="tap absolute right-3 top-3 z-10 inline-flex items-center gap-1.5 rounded-full bg-[var(--color-surface)]/95 px-3 py-1.5 text-xs font-semibold text-[var(--color-ink-900)] shadow-[var(--shadow-md)] backdrop-blur hover:bg-[var(--color-surface)]"
			>
				<MapPin size={12} className="text-[var(--color-accent-700)]" />
				Open in Maps
			</a>
		</div>
	);
}
