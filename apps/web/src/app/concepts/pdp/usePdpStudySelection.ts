"use client";

import { useState } from "react";

/** Size / colour picks for PDP studies — no buy gate. */
export function usePdpStudySelection() {
	const [sizeId, setSizeId] = useState<string | null>(null);
	const [colourId, setColourId] = useState<string | null>(null);

	return {
		sizeId,
		colourId,
		setSizeId,
		setColourId,
	};
}
