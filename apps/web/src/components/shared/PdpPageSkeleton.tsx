import type { CSSProperties } from "react";

import styles from "@/app/concepts/pdp/pdpStudy.module.css";
import { Skeleton, SkeletonScreen } from "@/components/ui/Skeleton";

/** Center portrait footprint — must match `.ribbonSlide` so the live image lands here. */
const CENTER_STAGE: CSSProperties = {
	position: "absolute",
	left: "50%",
	top: "50%",
	width: "min(68vw, 32rem)",
	aspectRatio: "3 / 4",
	transform: "translate(-50%, -50%)",
	zIndex: 10,
};

const SIDE_STAGE_BASE: CSSProperties = {
	position: "absolute",
	left: "50%",
	top: "50%",
	width: "min(68vw, 32rem)",
	aspectRatio: "3 / 4",
	opacity: 0.5,
	zIndex: 2,
};

const SIDE_PREV: CSSProperties = {
	...SIDE_STAGE_BASE,
	transform: "translate(-112%, calc(-50% + 26px)) scale(0.64)",
};

const SIDE_NEXT: CSSProperties = {
	...SIDE_STAGE_BASE,
	transform: "translate(12%, calc(-50% + 26px)) scale(0.64)",
};

const MORE_FROM_CARD_COUNT = 3;

/** Vertical Runway PDP placeholder — breadcrumbs, title, look ribbon, details, more-from. */
export function PdpPageSkeleton() {
	return (
		<SkeletonScreen label="Loading product" className={styles.study}>
			<div className="mx-auto flex max-w-[1120px] flex-wrap items-center justify-center gap-2 px-4 pb-1 pt-3.5">
				<Skeleton shape="text" className="h-3 w-12" />
				<Skeleton shape="text" className="h-3 w-2" />
				<Skeleton shape="text" className="h-3 w-20" />
				<Skeleton shape="text" className="h-3 w-2" />
				<Skeleton shape="text" className="h-3 w-28" />
			</div>

			<div className={styles.productTitle}>
				<Skeleton shape="text" className="mx-auto h-9 w-[min(24rem,80%)] sm:h-12" />
				<Skeleton shape="text" className="mx-auto mt-2 h-9 w-[min(16rem,55%)] sm:h-12" />
			</div>

			<div className={styles.ribbonViewport}>
				<span style={SIDE_PREV}>
					<span className={styles.ribbonFrame}>
						<Skeleton className="size-full rounded-none" />
					</span>
				</span>
				<span style={SIDE_NEXT}>
					<span className={styles.ribbonFrame}>
						<Skeleton className="size-full rounded-none" />
					</span>
				</span>
				<span style={CENTER_STAGE}>
					<span className={styles.ribbonFrame}>
						<Skeleton className="size-full rounded-none" />
						<span className="absolute bottom-[clamp(0.75rem,2.5vw,1.2rem)] left-[clamp(0.85rem,3vw,1.35rem)] z-[2]">
							<Skeleton shape="text" className="h-8 w-24 sm:h-11 sm:w-32" />
						</span>
					</span>
				</span>
				<div className={styles.ribbonNav} aria-hidden>
					<span className={`${styles.ribbonNavButton} ${styles.ribbonNavPrev}`} />
					<span className={`${styles.ribbonNavButton} ${styles.ribbonNavNext}`} />
				</div>
			</div>

			<div className="mx-auto mt-10 w-[min(36rem,100%)] space-y-3 px-4">
				<Skeleton shape="text" className="mx-auto h-3 w-24" />
				<Skeleton shape="text" className="h-4 w-full" />
				<Skeleton shape="text" className="h-4 w-[94%]" />
				<Skeleton shape="text" className="h-4 w-[88%]" />
				<Skeleton shape="text" className="h-4 w-[60%]" />
			</div>

			<div className={styles.moreFrom}>
				<div className="flex flex-wrap items-end justify-between gap-3">
					<Skeleton shape="text" className="h-6 w-44 sm:h-7" />
					<Skeleton shape="text" className="h-3 w-20" />
				</div>
				<ul className={styles.moreFromRail}>
					{Array.from({ length: MORE_FROM_CARD_COUNT }).map((_, index) => (
						<li key={index} className={styles.moreFromCard}>
							<span className={styles.moreFromThumb}>
								<Skeleton className="size-full rounded-none" />
							</span>
							<Skeleton shape="text" className="h-3 w-3/4" />
							<Skeleton shape="text" className="h-3 w-1/3" />
						</li>
					))}
				</ul>
			</div>
		</SkeletonScreen>
	);
}
