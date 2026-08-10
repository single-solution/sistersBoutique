"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * True only after the component has mounted on the client. Hydration-safe: the
 * server snapshot (and the first client render) is `false`, so gating
 * client-only output (DOM-dependent sanitizers, viewport observers) on this
 * value avoids hydration mismatches without setting state inside an effect.
 */
export function useHasMounted(): boolean {
	return useSyncExternalStore(
		subscribe,
		() => true,
		() => false,
	);
}
