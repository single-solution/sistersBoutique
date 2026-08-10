import type { Metadata } from "next";
import { Suspense } from "react";

import { logger } from "@store/shared";

import { ShopGateHangStage } from "@/app/_components/shop/ShopGateHangStage";
import { ShopGateHangListing, shopGateHangStyles } from "@/app/_components/shop/ShopGateHangListing";
import { ShopFilterSidebar } from "@/app/_components/shop/ShopFilterSidebar";
import { ShopMobileFilterDock } from "@/app/_components/shop/ShopMobileFilterDock";
import { ShopScrollReset } from "@/app/_components/shop/ShopScrollReset";
import { SHOP_CATEGORY_GRID_CLASS } from "@/lib/catalog/shopListingGrid";
import { ShopProductsAreaFallback } from "@/components/shared/ShopListingSkeleton";
import { NavigationPendingFallback } from "@/components/shared/NavigationPendingFallback";
import { ShopProductFeed } from "@/components/shared/ShopProductFeed";
import { parseFiltersFromSearchParams, type ProductFilters, type ProductPage } from "@/lib/core";
import { getBrandsCached, getCategoriesCached, getProductsPageCached } from "@/lib/core/cached";
import { getSeoSettings } from "@/lib/seo/seoSettings";

/** Full-catalog listing — every active product across categories, same gate/hang chrome as a category page. */

export const revalidate = 60;

const SHOP_LABEL = "Shop";
const SHOP_DESCRIPTION = "Every piece in the collection — stitched and unstitched suits, filterable by category, brand, type, and price.";

export async function generateMetadata(): Promise<Metadata> {
	const seo = await getSeoSettings();
	// Root layout applies the `%s · <siteName>` title template, so keep this short.
	const socialTitle = `${SHOP_LABEL} · ${seo.seoStoreName || seo.siteName}`;
	const description = seo.defaultDescription || SHOP_DESCRIPTION;
	return {
		title: SHOP_LABEL,
		description,
		alternates: { canonical: `${seo.siteUrl}/shop` },
		openGraph: {
			title: socialTitle,
			description,
			url: `${seo.siteUrl}/shop`,
			type: "website",
			images: seo.defaultOgImageUrl ? [seo.defaultOgImageUrl] : undefined,
		},
		twitter: {
			card: "summary_large_image",
			title: socialTitle,
			description,
			images: seo.defaultOgImageUrl ? [seo.defaultOgImageUrl] : undefined,
		},
	};
}

interface ShopPageProps {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
	const rawSearchParams = await searchParams;
	const filters = parseFiltersFromSearchParams(rawSearchParams, {});

	return (
		<div className={shopGateHangStyles.page}>
			<Suspense fallback={null}>
				<ShopScrollReset />
			</Suspense>

			<ShopGateHangStage title={SHOP_LABEL} description={SHOP_DESCRIPTION} />

			<ShopGateHangListing
				sidebar={
					<Suspense fallback={null}>
						<SidebarData />
					</Suspense>
				}
			>
				<Suspense fallback={<ShopProductsAreaFallback />}>
					<NavigationPendingFallback fallback={<ShopProductsAreaFallback />}>
						<ProductsArea filters={filters} />
					</NavigationPendingFallback>
				</Suspense>
			</ShopGateHangListing>

			<Suspense fallback={null}>
				<FilterDock />
			</Suspense>
		</div>
	);
}

async function SidebarData() {
	const [categories, brands] = await Promise.all([getCategoriesCached(), getBrandsCached()]);
	return <ShopFilterSidebar categories={categories} brands={brands} activeSlug="" />;
}

async function FilterDock() {
	const [categories, brands] = await Promise.all([getCategoriesCached(), getBrandsCached()]);
	return <ShopMobileFilterDock categories={categories} brands={brands} activeSlug="" />;
}

async function loadShopProducts(filters: ProductFilters): Promise<ProductPage> {
	try {
		return await getProductsPageCached(filters);
	} catch (error) {
		logger.error({ error }, "shop: all-products load failed, serving empty page this render");
		return { products: [], total: 0, page: 1, pageSize: 0, pageCount: 1 };
	}
}

async function ProductsArea({ filters }: { filters: ProductFilters }) {
	const page = await loadShopProducts(filters);
	return <ShopProductFeed initialPage={page} categoryLabel={SHOP_LABEL} apiParams={{}} gridClassName={SHOP_CATEGORY_GRID_CLASS} />;
}
