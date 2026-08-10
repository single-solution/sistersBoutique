import type { Metadata } from "next";
import Link from "next/link";

import { logger } from "@store/shared";

import { CoutureSalonHomepage, loadCoutureSalonData } from "@/app/_components/home/CoutureSalonHomepage";
import { CoutureSalonHomepageMobile } from "@/app/_components/home/CoutureSalonHomepageMobile";
import { ShopListingHero } from "@/app/_components/shop/ShopListingHero";
import { ShopProductFeed } from "@/components/shared/ShopProductFeed";
import { SHOP_CATEGORY_GRID_CLASS, SHOP_CATEGORY_PAGE_CLASS } from "@/lib/catalog/shopListingGrid";
import { catalogRootHref } from "@/lib/catalog/productPaths";
import { getProductsPageCached, getStoreSettingsCached } from "@/lib/core/cached";

/**
 * `/`
 *
 * - `?q=<term>` renders global search results.
 * - The bare route renders the brand and catalog homepage.
 */
export const revalidate = 300;

const SEARCH_PAGE_SIZE = 24;

interface CatalogIndexPageProps {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ searchParams }: CatalogIndexPageProps): Promise<Metadata> {
	const [{ siteName }, params] = await Promise.all([getStoreSettingsCached(), searchParams]);
	const query = normaliseQuery(params.q ?? params.query);
	if (query) {
		return {
			title: `Search: ${query}`,
			description: `Search results for "${query}" at ${siteName}.`,
		};
	}
	return {
		title: "Pakistani dressing, in a brighter mood",
		description: `Shop ${siteName} for stitched and unstitched suits selected for everyday wear, celebrations, and delivery across Pakistan.`,
	};
}

export default async function CatalogIndexPage({ searchParams }: CatalogIndexPageProps) {
	const params = await searchParams;
	const query = normaliseQuery(params.q ?? params.query);

	if (query) {
		return <CatalogSearchResults query={query} requestedPage={normalisePage(params.page)} />;
	}

	const home = await loadCoutureSalonData();
	return (
		<>
			<div className="lg:hidden">
				<CoutureSalonHomepageMobile data={home.data} categories={home.categories} />
			</div>
			<div className="hidden lg:block">
				<CoutureSalonHomepage data={home.data} categories={home.categories} />
			</div>
		</>
	);
}

async function CatalogSearchResults({ query, requestedPage }: { query: string; requestedPage: number }) {
	let page: Awaited<ReturnType<typeof getProductsPageCached>>;
	try {
		page = await getProductsPageCached({
			search: query,
			limit: SEARCH_PAGE_SIZE,
			page: requestedPage,
			sort: "newest",
		});
	} catch (error) {
		logger.error({ error, query }, "catalog: search results load failed, rendering empty state this render");
		page = { products: [], total: 0, page: 1, pageSize: SEARCH_PAGE_SIZE, pageCount: 1 };
	}

	return (
		<>
			<ShopListingHero
				eyebrow="Discover"
				title={query ? `Results for "${query}"` : "Browse the collection"}
				description={query ? `Pieces matching "${query}" across the shop.` : undefined}
			/>
			<div className={`${SHOP_CATEGORY_PAGE_CLASS} pb-10 pt-8 md:pb-20 md:pt-10`}>
				{page.products.length > 0 ? (
					<div className="cv-auto-lg">
						<ShopProductFeed
							initialPage={page}
							categoryLabel="results"
							apiParams={{}}
							showResultsCount
							gridClassName={SHOP_CATEGORY_GRID_CLASS}
						/>
					</div>
				) : (
					<EmptySearchState />
				)}
			</div>
		</>
	);
}

function EmptySearchState() {
	return (
		<div className="reveal mt-8 rounded-[var(--radius-lg)] border border-dashed border-[var(--color-ink-200)] bg-[var(--color-surface-muted)] px-5 py-12 text-center">
			<p className="text-sm font-semibold text-[var(--color-ink-900)]">No matching products found.</p>
			<Link
				href={catalogRootHref()}
				className="tap mt-4 inline-flex rounded-[var(--radius-full)] bg-[var(--color-accent-500)] px-4 py-2 text-sm font-semibold text-[var(--color-accent-50)] hover:bg-[var(--color-accent-600)]"
			>
				Browse all products
			</Link>
		</div>
	);
}

function normaliseQuery(value: string | string[] | undefined): string {
	const raw = Array.isArray(value) ? value[0] : value;
	return (raw ?? "").trim().slice(0, 100);
}

function normalisePage(value: string | string[] | undefined): number {
	const raw = Array.isArray(value) ? value[0] : value;
	const parsed = Number.parseInt(raw ?? "", 10);
	return Number.isFinite(parsed) && parsed > 1 ? parsed : 1;
}
