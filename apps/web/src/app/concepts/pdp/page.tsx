import type { Metadata } from "next";
import Link from "next/link";

import { PDP_STUDY_COPY, PDP_STUDY_LAYOUTS, pdpStudyHref } from "./pdpStudyConfig";
import styles from "./pdpStudy.module.css";

export const metadata: Metadata = {
	title: "PDP layout studies",
	description: "Internal Sister's Outfits product detail layout concepts — non-column grammars.",
	robots: { index: false, follow: false },
};

export default function PdpStudyHubPage() {
	return (
		<div className={styles.study}>
			<div className={`${styles.shell} ${styles.hub}`}>
				<p className={styles.metaEyebrow}>Concepts / pdp</p>
				<h1 className={styles.hubTitle}>Product detail studies</h1>
				<p className={styles.hubLead}>
					Four photography-led PDP grammars — looping parallax look ribbon.{" "}
					<strong>Vertical runway</strong> is shipped on live product pages; the others remain studies.
				</p>

				<div className={styles.matrix}>
					{PDP_STUDY_LAYOUTS.map((layout) => (
						<Link key={layout} href={pdpStudyHref(layout)} className={styles.matrixCard}>
							<em>{PDP_STUDY_COPY[layout].eyebrow}</em>
							<strong>{PDP_STUDY_COPY[layout].label}</strong>
							<span>
								{PDP_STUDY_COPY[layout].summary} {PDP_STUDY_COPY[layout].cue}
							</span>
						</Link>
					))}
				</div>

				<Link href="/concepts/shop" className={styles.backLink}>
					Shop listing studies
				</Link>
				<Link href="/" className={styles.backLink}>
					Back to storefront
				</Link>
			</div>
		</div>
	);
}
