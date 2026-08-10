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
import styles from "../pdpStudy.module.css";

/** Dominant stage with integrated filmstrip; fitting sits tight under the frame. */
export function StageRailPdp() {
	const sample = PDP_STUDY_SAMPLE;
	const selection = usePdpStudySelection();

	return (
		<PdpStudyChrome layout="stage-rail">
			<PdpStudySampleBreadcrumbs />
			<PdpStudySampleProductTitle />
			<PdpStudyLookStage looks={sample.looks} variant="editorial" />
			<div className={styles.railMount}>
				<div className={styles.railPanel}>
					<PdpStudyCommerce eyebrow="Fitting rail" />
				</div>
			</div>
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
