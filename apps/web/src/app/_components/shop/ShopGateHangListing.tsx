import type { ReactNode } from "react";

import styles from "./shopGateHang.module.css";

interface ShopGateHangListingProps {
	sidebar?: ReactNode;
	children: ReactNode;
}

/** Product wall shell — filter chrome lives in the sidebar. */
export function ShopGateHangListing({ sidebar, children }: ShopGateHangListingProps) {
	return (
		<div className={styles.listingBand}>
			<div className={styles.shell}>
				<div className={styles.listingLayout}>
					{sidebar && <aside className={styles.listingSidebar}>{sidebar}</aside>}
					<main className={styles.listingMain}>{children}</main>
				</div>
			</div>
		</div>
	);
}

export { styles as shopGateHangStyles };
