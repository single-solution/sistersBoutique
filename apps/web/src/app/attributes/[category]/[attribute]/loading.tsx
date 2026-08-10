import { ProductGridSkeleton } from "@/components/shared/ProductCardSkeleton";
import { ShopListingHeroFallback } from "@/components/shared/ShopListingSkeleton";
import { Skeleton, SkeletonScreen } from "@/components/ui/Skeleton";
import { SHOP_CATEGORY_GRID_CLASS, SHOP_CATEGORY_PAGE_CLASS, SHOP_CATEGORY_SKELETON_CARDS } from "@/lib/catalog/shopListingGrid";

/** Attribute glossary placeholder — hero, browse link, in-stock grid. */
export default function AttributeGlossaryLoading() {
	return (
		<SkeletonScreen label="Loading attribute">
			<ShopListingHeroFallback />
			<div className={`${SHOP_CATEGORY_PAGE_CLASS} pb-10 md:pb-20`}>
				<div className="pt-6 md:pt-8">
					<Skeleton shape="text" className="h-4 w-40" />
				</div>
				<section className="mt-12 space-y-4">
					<Skeleton shape="text" className="h-6 w-32" />
					<Skeleton shape="text" className="h-3 w-56 max-w-full" />
					<div className="pt-2">
						<ProductGridSkeleton count={SHOP_CATEGORY_SKELETON_CARDS} className={SHOP_CATEGORY_GRID_CLASS} />
					</div>
				</section>
			</div>
		</SkeletonScreen>
	);
}
