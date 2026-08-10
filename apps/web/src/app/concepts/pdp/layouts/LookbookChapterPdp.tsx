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

/** Lookbook: story stage first, then a distinct Fitting chapter. */
export function LookbookChapterPdp() {
	const sample = PDP_STUDY_SAMPLE;
	const selection = usePdpStudySelection();

	return (
		<PdpStudyChrome layout="lookbook-chapter">
			<header className={styles.chapterIntro}>
				<p>Chapter · Story</p>
			</header>
			<PdpStudySampleBreadcrumbs />
			<PdpStudySampleProductTitle />
			<PdpStudyLookStage looks={sample.looks} />
			<PdpStudyCommerce eyebrow="Chapter · Fitting" />
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
