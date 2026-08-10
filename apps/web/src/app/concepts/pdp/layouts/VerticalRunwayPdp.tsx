"use client";

import {
	PdpStudyChrome,
	PdpStudyCommerce,
	PdpStudySampleBreadcrumbs,
	PdpStudySampleBuyBar,
	PdpStudySampleMoreFrom,
	PdpStudySampleProductTitle,
} from "../PdpStudyShared";
import { PdpStudyLookStage } from "../PdpStudyLookStage";
import { PDP_STUDY_SAMPLE } from "../pdpStudySample";
import { usePdpStudySelection } from "../usePdpStudySelection";

/** Photography fills the first viewport; fitting arrives after the stage. */
export function VerticalRunwayPdp() {
	const sample = PDP_STUDY_SAMPLE;
	const selection = usePdpStudySelection();

	return (
		<PdpStudyChrome layout="vertical-runway">
			<PdpStudySampleBreadcrumbs />
			<PdpStudySampleProductTitle />
			<PdpStudyLookStage looks={sample.looks} />
			<PdpStudyCommerce eyebrow="After the runway" />
			<PdpStudySampleMoreFrom />
			<PdpStudySampleBuyBar
				priceRupees={sample.priceRupees}
				sizeId={selection.sizeId}
				colourId={selection.colourId}
				onSize={selection.setSizeId}
				onColour={selection.setColourId}
			/>
		</PdpStudyChrome>
	);
}
