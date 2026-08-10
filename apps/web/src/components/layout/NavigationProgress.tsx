"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { dispatchRouteReveal } from "@/components/shared/motion/RevealRoot";
import { useNavigationProgressCount } from "@/lib/navigation/navigationProgress";
import { scheduleStateUpdate } from "@/lib/scheduleStateUpdate";

/**
 * Clothing-inspired transition that gives instant tap feedback on navigation.
 *
 * Click / popstate listeners sit outside the `useSearchParams` Suspense child
 * so the thread animation starts on the first frame. Route commit detection
 * lives in {@link NavigationProgressRouteSync}.
 */
const SHOW_AFTER_CLICK_MS = 0;
const COMPLETION_FADE_MS = 360;
const SAME_ROUTE_AUTO_CANCEL_MS = 15000;

interface NavigationProgressProps {
	minimumVisibleMs?: number;
}

function NavigationProgressClickListener({ onStart }: { onStart: () => void }) {
	useEffect(() => {
		const handleClick = (event: MouseEvent) => {
			if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
				return;
			}
			const anchor = (event.target as HTMLElement | null)?.closest("a");
			if (!anchor) {
				return;
			}
			if (anchor.target && anchor.target !== "_self") {
				return;
			}
			if (anchor.hasAttribute("download")) {
				return;
			}
			const href = anchor.getAttribute("href");
			if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("javascript:")) {
				return;
			}
			try {
				const targetUrl = new URL(href, window.location.href);
				if (targetUrl.origin !== window.location.origin) {
					return;
				}
				const nextKey = `${targetUrl.pathname}?${targetUrl.searchParams.toString()}`;
				const currentKey = `${window.location.pathname}?${window.location.search.slice(1)}`;
				if (nextKey === currentKey) {
					return;
				}
			} catch {
				return;
			}

			if (SHOW_AFTER_CLICK_MS === 0) {
				onStart();
			} else {
				window.setTimeout(onStart, SHOW_AFTER_CLICK_MS);
			}
		};

		document.addEventListener("click", handleClick, { capture: true });
		window.addEventListener("popstate", onStart);

		return () => {
			document.removeEventListener("click", handleClick, { capture: true });
			window.removeEventListener("popstate", onStart);
		};
	}, [onStart]);

	return null;
}

function NavigationProgressRouteSync({ onRouteCommit }: { onRouteCommit: () => void }) {
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const lastRouteKeyRef = useRef<string>(`${pathname}?${searchParams?.toString() ?? ""}`);

	useEffect(() => {
		const routeKey = `${pathname}?${searchParams?.toString() ?? ""}`;
		if (routeKey === lastRouteKeyRef.current) {
			return;
		}
		lastRouteKeyRef.current = routeKey;
		onRouteCommit();
	}, [pathname, searchParams, onRouteCommit]);

	return null;
}

export function NavigationProgress({ minimumVisibleMs = 0 }: NavigationProgressProps) {
	const programmaticCount = useNavigationProgressCount();
	const [isVisible, setIsVisible] = useState(false);
	const [isLeaving, setIsLeaving] = useState(false);
	const fadeTimeoutRef = useRef<number | null>(null);
	const completionTimeoutRef = useRef<number | null>(null);
	const autoCancelTimeoutRef = useRef<number | null>(null);
	const programmaticActiveRef = useRef(false);
	const minimumVisibleUntilRef = useRef(0);

	const clearFade = useCallback(() => {
		if (fadeTimeoutRef.current !== null) {
			window.clearTimeout(fadeTimeoutRef.current);
			fadeTimeoutRef.current = null;
		}
	}, []);

	const clearAutoCancel = useCallback(() => {
		if (autoCancelTimeoutRef.current !== null) {
			window.clearTimeout(autoCancelTimeoutRef.current);
			autoCancelTimeoutRef.current = null;
		}
	}, []);

	const clearCompletion = useCallback(() => {
		if (completionTimeoutRef.current !== null) {
			window.clearTimeout(completionTimeoutRef.current);
			completionTimeoutRef.current = null;
		}
	}, []);

	const finishNavigation = useCallback(() => {
		clearAutoCancel();
		programmaticActiveRef.current = false;
		minimumVisibleUntilRef.current = 0;
		clearFade();
		dispatchRouteReveal();
		setIsLeaving(true);
		fadeTimeoutRef.current = window.setTimeout(() => {
			setIsVisible(false);
			setIsLeaving(false);
		}, COMPLETION_FADE_MS);
	}, [clearAutoCancel, clearFade]);

	const completeNavigation = useCallback(() => {
		clearCompletion();
		const remainingVisibleMs = minimumVisibleUntilRef.current - Date.now();
		if (remainingVisibleMs > 0) {
			completionTimeoutRef.current = window.setTimeout(finishNavigation, remainingVisibleMs);
			return;
		}
		finishNavigation();
	}, [clearCompletion, finishNavigation]);

	const startNavigation = useCallback(() => {
		clearFade();
		clearAutoCancel();
		clearCompletion();
		minimumVisibleUntilRef.current = Date.now() + minimumVisibleMs;
		setIsLeaving(false);
		setIsVisible(true);
		autoCancelTimeoutRef.current = window.setTimeout(() => {
			completeNavigation();
		}, SAME_ROUTE_AUTO_CANCEL_MS);
	}, [clearAutoCancel, clearCompletion, clearFade, completeNavigation, minimumVisibleMs]);

	useEffect(() => {
		if (programmaticCount > 0) {
			programmaticActiveRef.current = true;
			scheduleStateUpdate(startNavigation);
			return;
		}
		if (programmaticActiveRef.current) {
			programmaticActiveRef.current = false;
			scheduleStateUpdate(completeNavigation);
		}
	}, [programmaticCount, startNavigation, completeNavigation]);

	useEffect(
		() => () => {
			clearFade();
			clearAutoCancel();
			clearCompletion();
		},
		[clearAutoCancel, clearCompletion, clearFade],
	);

	return (
		<>
			<NavigationProgressClickListener onStart={startNavigation} />
			{isVisible ? (
				<div aria-hidden className={`nav-thread-overlay pointer-events-none fixed inset-0 z-[90] flex items-center justify-center${isLeaving ? " is-leaving" : ""}`}>
					<svg className="nav-thread-stitch" viewBox="0 0 360 180">
						<path
							className="nav-thread-line"
							d="M34 128 C82 56 132 178 194 94 C235 38 290 44 326 112 M176 70 C176 47 205 47 205 65 C205 79 189 79 189 92 L139 126 L246 126 L189 92"
						/>
						<circle className="nav-thread-needle" r="4" />
					</svg>
				</div>
			) : null}
			<Suspense fallback={null}>
				<NavigationProgressRouteSync onRouteCommit={completeNavigation} />
			</Suspense>
		</>
	);
}
