import { ProductGridSkeleton } from "@/components/shared/ProductCardSkeleton";
import { Skeleton, SkeletonScreen } from "@/components/ui/Skeleton";
import { shopGateHangStyles } from "@/app/_components/shop/ShopGateHangListing";
import { SHOP_CATEGORY_GRID_CLASS, SHOP_CATEGORY_PAGE_CLASS, SHOP_CATEGORY_SKELETON_CARDS } from "@/lib/catalog/shopListingGrid";

/**
 * Category listing skeletons — Gate · hang stage + dock + denser wall.
 */

export function ShopCategoryPageLoading() {
	return (
		<SkeletonScreen label="Loading shop">
			<div className={shopGateHangStyles.page}>
				<header className={shopGateHangStyles.gateStage} aria-hidden>
					<div className={shopGateHangStyles.gateStageInner}>
						<div className={shopGateHangStyles.gateStageCopyWrap}>
							<div className={shopGateHangStyles.gateStageCopy}>
								<Skeleton shape="text" className="h-3 w-40" />
								<Skeleton shape="text" className="mt-3 h-16 w-56 max-w-full md:h-20 md:w-72" />
								<Skeleton shape="text" className="mt-4 h-4 w-full max-w-md" />
							</div>
						</div>
						<div className={shopGateHangStyles.gateStagePortrait}>
							<Skeleton shape="block" className="size-full rounded-none" />
						</div>
					</div>
				</header>
				<div className={shopGateHangStyles.listingBand}>
					<ShopCatalogToolbarFallback />
					<div className={shopGateHangStyles.shell}>
						<ShopProductsAreaFallback />
					</div>
				</div>
			</div>
		</SkeletonScreen>
	);
}

export function ShopCatalogToolbarFallback() {
	return null;
}

export function ShopProductsAreaFallback() {
	return (
		<div className="min-h-[60vh] space-y-6 md:min-h-[70vh]">
			<ProductGridSkeleton count={SHOP_CATEGORY_SKELETON_CARDS} className={SHOP_CATEGORY_GRID_CLASS} />
			<div className="flex justify-center pt-2">
				<Skeleton shape="pill" className="h-10 w-32" />
			</div>
		</div>
	);
}

/** Compact Allura header skeleton — search / deals / glossary surfaces. */
export function ShopListingHeroFallback() {
	return (
		<header className="border-b border-[color-mix(in_srgb,var(--color-accent-500)_12%,transparent)] bg-[var(--color-canvas-deep)]">
			<div className={`${SHOP_CATEGORY_PAGE_CLASS} py-10 md:py-14`} aria-hidden>
				<Skeleton shape="text" className="h-12 w-56 max-w-full md:h-14 md:w-72" />
				<Skeleton shape="text" className="mt-4 h-4 w-full max-w-md" />
			</div>
		</header>
	);
}

export function ShopCategoryRailFallback({ pillCount = 6 }: { pillCount?: number }) {
	return (
		<nav aria-hidden className="flex min-w-0 flex-1 flex-wrap justify-start gap-2 md:gap-2.5">
			{Array.from({ length: pillCount }).map((_, index) => (
				<Skeleton key={index} shape="pill" className="h-8 w-[4.5rem] shrink-0 md:w-20" />
			))}
		</nav>
	);
}

export function ShopFilterRowFallback() {
	return (
		<div className="flex shrink-0 flex-wrap items-center justify-end gap-2 md:gap-2.5" aria-hidden>
			{Array.from({ length: 4 }).map((_, pillIndex) => (
				<Skeleton key={pillIndex} shape="pill" className="h-8 w-[4.5rem] md:w-20" />
			))}
		</div>
	);
}

/** Kept for non-category surfaces that still use the editorial grid. */
export function ShopEditorialProductsFallback() {
	return (
		<div className="min-h-[60vh] space-y-6 md:min-h-[70vh]">
			<ProductGridSkeleton count={SHOP_CATEGORY_SKELETON_CARDS} className={SHOP_CATEGORY_GRID_CLASS} />
			<div className="flex justify-center pt-2">
				<Skeleton shape="pill" className="h-10 w-32" />
			</div>
		</div>
	);
}
