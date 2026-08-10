/**
 * Storefront search hints — short suggestion labels shown in the
 * `SearchOverlay` empty state.
 *
 * The pool is a deliberate mix so the search surface never feels stale or
 * fully repeatable:
 *
 *   - Random active categories (sampled server-side)
 *   - Top-selling products by order-item count (across non-cancelled orders)
 *   - "Bottom" sellers — public products that aren't in the top set,
 *     sampled randomly so newer / low-volume listings get exposure
 *
 * Output is shuffled and truncated to `targetCount`. There's no special
 * tagging — every label is just a search term the customer can land on
 * via `/?q=<label>`.
 */

import { unstable_cache } from "next/cache";

import { Category as CategoryModel, Order as OrderModel, Product as ProductModel, connectDB } from "@store/db";

import { STOREFRONT_CACHE_TAG } from "@/lib/core/cached";
import { PUBLIC_PRODUCT_FILTER } from "@/lib/core/queries";

/** Default number of hint chips returned to the client. */
const DEFAULT_HINT_COUNT = 4;
/** Per-kind pool size — over-fetch then shuffle so each open feels fresh. */
const POOL_PER_KIND = 8;

/** Order statuses that count as a "sale" for the popularity ranking.
 *  Cancelled and refunded orders are excluded so a single bad return
 *  doesn't kill a product's standing. */
const SALES_ORDER_STATUSES = ["pending-payment", "confirmed", "dispatched", "delivered"] as const;

interface NameLean {
	_id: unknown;
	name: string;
}

interface OrderSalesAgg {
	_id: unknown;
	count: number;
}

/**
 * Builds the deduped hint pool from three aggregations (Orders + Products +
 * Categories). Cached cross-request on the shared 60s storefront window so the
 * overlay open doesn't fire three aggregations per request; the pool is
 * over-fetched (`POOL_PER_KIND` per kind) and the caller still shuffles + slices
 * per request, so the visible chips stay varied even while the pool is frozen.
 */
const loadHintPool = unstable_cache(
	async (): Promise<string[]> => {
		await connectDB();

		const topAgg = await OrderModel.aggregate<OrderSalesAgg>([
			{ $match: { status: { $in: SALES_ORDER_STATUSES } } },
			{ $unwind: "$items" },
			{ $group: { _id: "$items.productId", count: { $sum: 1 } } },
			{ $sort: { count: -1 } },
			{ $limit: POOL_PER_KIND },
		]);
		const topProductIds = topAgg.map((row) => row._id);

		const [topProducts, bottomProducts, categories] = await Promise.all([
			topProductIds.length > 0
				? ProductModel.find({
						_id: { $in: topProductIds },
						...PUBLIC_PRODUCT_FILTER,
					})
						.select("name")
						.limit(POOL_PER_KIND)
						.lean<NameLean[]>()
				: Promise.resolve([] as NameLean[]),
			ProductModel.aggregate<NameLean>([
				{
					$match: {
						...PUBLIC_PRODUCT_FILTER,
						...(topProductIds.length > 0 ? { _id: { $nin: topProductIds } } : {}),
					},
				},
				{ $sample: { size: POOL_PER_KIND } },
				{ $project: { name: 1 } },
			]),
			CategoryModel.aggregate<NameLean>([{ $match: { isActive: true } }, { $sample: { size: POOL_PER_KIND } }, { $project: { name: 1 } }]),
		]);

		const pool = [...topProducts.map((row) => row.name), ...bottomProducts.map((row) => row.name), ...categories.map((row) => row.name)]
			.map((name) => (typeof name === "string" ? name.trim() : ""))
			.filter((name) => name.length > 0);

		// Dedupe — a category name could collide with a product name in some shops.
		return Array.from(new Set(pool));
	},
	["storefront-search-hint-pool"],
	{ revalidate: 60, tags: [STOREFRONT_CACHE_TAG] },
);

/**
 * Returns up to `targetCount` shuffled hint labels suitable for the
 * search empty-state chip row. Resilient to early-store conditions — an
 * empty product or order catalogue just yields a shorter list (possibly
 * empty) rather than throwing.
 */
export async function getSearchHints(targetCount = DEFAULT_HINT_COUNT): Promise<string[]> {
	const pool = [...(await loadHintPool())];

	// Fisher–Yates shuffle so the mix is uniform across the three kinds.
	for (let index = pool.length - 1; index > 0; index--) {
		const swap = Math.floor(Math.random() * (index + 1));
		[pool[index], pool[swap]] = [pool[swap], pool[index]];
	}

	return pool.slice(0, targetCount);
}
