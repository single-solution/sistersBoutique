"use client";

import { formatPrice } from "@store/shared";

import {
	PdpStudyChrome,
	PdpStudyDescription,
	PdpStudySampleBreadcrumbs,
	PdpStudySampleBuyBar,
	PdpStudySampleMoreFrom,
	PdpStudySampleProductTitle,
} from "../PdpStudyShared";
import { PdpStudyLookStage } from "../PdpStudyLookStage";
import { PDP_STUDY_SAMPLE } from "../pdpStudySample";
import { usePdpStudySelection } from "../usePdpStudySelection";
import styles from "../pdpStudy.module.css";

/** Large look stage; fitting as a soft atelier sheet that rises over the image. */
export function OverlayAtelierPdp() {
	const sample = PDP_STUDY_SAMPLE;
	const selection = usePdpStudySelection();

	return (
		<PdpStudyChrome layout="overlay-atelier">
			<PdpStudySampleBreadcrumbs />
			<PdpStudySampleProductTitle />
			<PdpStudyLookStage looks={sample.looks} />

			<div className={styles.atelierSheet}>
				<span className={styles.atelierPull} aria-hidden />

				<header className={styles.atelierHeader}>
					<p className={styles.atelierKicker}>{sample.lookNumber} / private fitting</p>
					<div className={styles.atelierPriceBlock}>
						<p className={styles.atelierPriceLabel}>From</p>
						<p className={styles.atelierPrice}>{formatPrice(sample.priceRupees)}</p>
					</div>
				</header>

				<PdpStudyDescription html={sample.descriptionHtml} />
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
