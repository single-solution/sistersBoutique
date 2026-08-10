import { Skeleton } from "@/components/ui/Skeleton";

/**
 * Mirrors the visible structure of `ProductCard` — image well with an overlaid
 * title placeholder — so listing grids stay layout-stable while loading.
 */
export function ProductCardSkeleton() {
	return (
		<div className="relative aspect-[3/4] w-full overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-ink-100)] bg-[var(--color-canvas-deep)]">
			<Skeleton className="absolute inset-0 h-full w-full rounded-none" />
			<div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 px-3 pb-3 md:px-4 md:pb-4" aria-hidden>
				<Skeleton shape="text" className="h-4 w-1/2 max-w-[8rem] rounded-md" />
				<Skeleton shape="text" className="h-4 w-12 rounded-md" />
			</div>
		</div>
	);
}

interface ProductGridSkeletonProps {
	count?: number;
	className?: string;
}

/**
 * Convenience grid wrapper that lays out N `ProductCardSkeleton`s using the
 * same responsive columns the live product grid uses.
 */
export function ProductGridSkeleton({ count = 8, className }: ProductGridSkeletonProps) {
	return (
		<div className={className ?? "grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 md:gap-5 xl:grid-cols-4 xl:gap-6"}>
			{Array.from({ length: count }).map((_, index) => (
				<ProductCardSkeleton key={index} />
			))}
		</div>
	);
}
