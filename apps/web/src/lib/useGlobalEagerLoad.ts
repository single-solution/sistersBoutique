"use client";

import { useEffect, useState } from "react";

/** Max wait before we force the idle callback to fire and warm imagery. */
const EAGER_LOAD_IDLE_TIMEOUT_MS = 800;
/** Fallback delay when `requestIdleCallback` is unavailable. */
const EAGER_LOAD_FALLBACK_DELAY_MS = 350;

let globalEagerLoad = false;
let listeners: Set<() => void> = new Set();

function setGlobalEagerLoad() {
	if (globalEagerLoad) return;
	globalEagerLoad = true;
	listeners.forEach((listener) => listener());
	listeners.clear();
}

if (typeof window !== "undefined") {
	// After the window load event, warm remaining imagery as soon as the
	// main thread has a quiet window — prefer speed over a long idle wait.
	const trigger = () => {
		if (typeof window.requestIdleCallback === "function") {
			window.requestIdleCallback(setGlobalEagerLoad, { timeout: EAGER_LOAD_IDLE_TIMEOUT_MS });
		} else {
			setTimeout(setGlobalEagerLoad, EAGER_LOAD_FALLBACK_DELAY_MS);
		}
	};

	if (document.readyState === "complete") {
		trigger();
	} else {
		window.addEventListener("load", trigger);
	}
}

/**
 * Returns false initially so images use native lazy loading.
 * After the window "load" event + idle time, returns true so images
 * switch to eager loading and fetch in the background before the user scrolls.
 */
export function useGlobalEagerLoad() {
	const [eager, setEager] = useState(globalEagerLoad);

	useEffect(() => {
		if (globalEagerLoad) {
			// eslint-disable-next-line react-hooks/set-state-in-effect -- required for safe hydration
			setEager(true);
			return;
		}
		const listener = () => setEager(true);
		listeners.add(listener);
		return () => {
			listeners.delete(listener);
		};
	}, []);

	return eager;
}
