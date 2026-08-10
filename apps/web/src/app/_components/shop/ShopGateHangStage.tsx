import Image from "next/image";

import styles from "./shopGateHang.module.css";

/** Local optimized stage portrait — same frame as the home hero. */
export const SHOP_GATE_STAGE_IMAGE = {
	src: "/media/home/shop-stage.webp",
	alt: "Woman in a taupe embroidered Pakistani suit with a pink dupatta",
} as const;

interface ShopGateHangStageProps {
	title: string;
	description?: string;
}

export function ShopGateHangStage({ title, description }: ShopGateHangStageProps) {
	return (
		<section className={styles.gateStage} aria-labelledby="shop-gate-title">
			<div className={styles.gateStageInner}>
				<div className={styles.gateStageCopyWrap}>
					<div className={styles.gateStageCopy}>
						<p className={styles.sectionLabel}>Collection / 01</p>
						<h1 id="shop-gate-title" className={styles.gateTitle}>
							{title}
						</h1>
						<p className={styles.gateStageLead}>
							{description?.trim() ||
								"Ready looks for this entrance — hang a category, mark a house, set a price, then walk the wall."}
						</p>
					</div>
				</div>
				<figure className={styles.gateStagePortrait}>
					<Image
						src={SHOP_GATE_STAGE_IMAGE.src}
						alt={SHOP_GATE_STAGE_IMAGE.alt}
						fill
						sizes="(max-width: 900px) 100vw, 62vw"
						priority
						style={{ objectFit: "cover", objectPosition: "center" }}
					/>
					<figcaption className={styles.gateStageCaption}>
						<span>Look wall</span>
						<span>Scene 01</span>
					</figcaption>
				</figure>
			</div>
		</section>
	);
}
