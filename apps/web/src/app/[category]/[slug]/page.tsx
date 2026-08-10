import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";

import type { Product } from "@store/shared";
import { buildProductSeoFacts, productConfiguratorAttributeSlugs } from "@store/shared";

import { PdpScrollReset } from "./_components/PdpScrollReset";
import { VerticalRunwayProductPdp } from "./_components/VerticalRunwayProductPdp";
import { VariantProvider } from "@/components/shared/VariantContext";
import { hasPdpConfigurationInSearch, resolveExactVariantFromSearch } from "@/lib/catalog/pdpSelection";
import { getDefaultVariant } from "@/lib/productSummary";
import { productAbsoluteUrl, productHref, categoryHref } from "@/lib/catalog/productPaths";
import { getAttributesCached, getBrandBySlugCached, getCategoryBySlugCached, getProductBySlugCached, getProductSizeChartCached, getProductsPageCached } from "@/lib/core/cached";
import { getProductLiveCommerce, mergeProductWithLiveCommerce } from "@/lib/core/liveCommerce";
import { composeProductPageSeo } from "@/lib/seo/composeSeoMeta";
import { getSeoSettings } from "@/lib/seo/seoSettings";
import { breadcrumbJsonLd, buildProductFaqJsonLd, faqPageJsonLd, jsonLdScriptContent, productJsonLd } from "@/lib/seo/jsonLd";

/**
 * Category-agnostic product detail page at `/shop/<categorySlug>/<productSlug>`.
 * Storefront grammar: Vertical Runway (promoted from `/concepts/pdp/vertical-runway`).
 */

export const revalidate = 60;

interface ProductDetailPageProps {
	params: Promise<{ category: string; slug: string }>;
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

const RELATED_PRODUCTS_POOL = 8;
const RELATED_PRODUCTS_DISPLAY_COUNT = 4;

function attributeSlugsForProduct(product: Product, allAttributes: Awaited<ReturnType<typeof getAttributesCached>>): string[] {
	const categoryAttributes = allAttributes.filter((row) => row.categorySlug === product.categorySlug);
	return productConfiguratorAttributeSlugs(product, categoryAttributes);
}

function seoFactsContext(product: Product, allAttributes: Awaited<ReturnType<typeof getAttributesCached>>) {
	const categoryAttributes = allAttributes.filter((row) => row.categorySlug === product.categorySlug);
	return {
		attributes: categoryAttributes,
	};
}

export async function generateMetadata({ params, searchParams }: ProductDetailPageProps): Promise<Metadata> {
	const [{ category, slug }, search] = await Promise.all([params, searchParams]);
	const product = await getProductBySlugCached(slug);
	if (!product) {
		return { title: "Not found" };
	}
	const [brand, categoryMeta, seoSettings, allAttributes] = await Promise.all([
		getBrandBySlugCached(product.brandSlug, product.categorySlug),
		getCategoryBySlugCached(category),
		getSeoSettings(),
		getAttributesCached(),
	]);
	const factsContext = seoFactsContext(product, allAttributes);
	const attributeSlugs = attributeSlugsForProduct(product, allAttributes);
	const hasVariantQueryParams = hasPdpConfigurationInSearch(search, attributeSlugs);
	const selectedVariant = hasVariantQueryParams ? resolveExactVariantFromSearch(product, search, attributeSlugs) : null;
	const heroImage = product.images?.[0];
	const resolved = composeProductPageSeo({
		product,
		brand: brand ? { slug: brand.slug, name: brand.name } : null,
		category: categoryMeta ? { slug: categoryMeta.slug, label: categoryMeta.label } : null,
		settings: seoSettings,
		seo: product.seo,
		factsContext,
		selectedVariant,
		hasVariantQueryParams,
	});
	const canonical = resolved.canonical;
	const brandName = brand?.name ?? product.brandName;
	return {
		title: resolved.title,
		description: resolved.description,
		alternates: { canonical },
		robots: resolved.robots,
		openGraph: {
			title: resolved.title,
			description: resolved.description,
			url: canonical,
			type: "website",
			images: heroImage
				? [
						{
							url: resolved.ogImageUrl || heroImage.variants.detail,
							width: heroImage.width,
							height: heroImage.height,
							alt: heroImage.alt || `${brandName} ${product.name}`,
						},
					]
				: undefined,
		},
		twitter: {
			card: resolved.twitterCard,
			title: resolved.title,
			description: resolved.description,
			images: resolved.ogImageUrl ? [resolved.ogImageUrl] : undefined,
		},
	};
}

const loadRelatedProducts = cache(async (product: Product): Promise<Product[]> => {
	const { products: relatedRaw } = await getProductsPageCached({
		categorySlug: product.categorySlug,
		brandSlugs: [product.brandSlug],
		limit: RELATED_PRODUCTS_POOL,
	});
	return relatedRaw.filter((candidate) => candidate.id !== product.id).slice(0, RELATED_PRODUCTS_DISPLAY_COUNT);
});

export default async function ProductDetailPage({ params, searchParams }: ProductDetailPageProps) {
	const [{ category, slug }, search] = await Promise.all([params, searchParams]);

	const [categoryMeta, product, allAttributes, liveVariants, sizeChart] = await Promise.all([
		getCategoryBySlugCached(category),
		getProductBySlugCached(slug),
		getAttributesCached(),
		getProductLiveCommerce(slug),
		getProductSizeChartCached(slug),
	]);

	if (!categoryMeta) {
		notFound();
	}

	if (!product) {
		notFound();
	}

	const storefrontProduct = mergeProductWithLiveCommerce(product, liveVariants);

	const attributeSlugs = attributeSlugsForProduct(storefrontProduct, allAttributes);
	const exactFromUrl = resolveExactVariantFromSearch(storefrontProduct, search, attributeSlugs);
	const variantForSeo = exactFromUrl ?? getDefaultVariant(storefrontProduct);

	if (storefrontProduct.categorySlug !== categoryMeta.slug) {
		redirect(productHref(storefrontProduct));
	}

	const [brand, seoSettings, related] = await Promise.all([
		getBrandBySlugCached(storefrontProduct.brandSlug, storefrontProduct.categorySlug),
		getSeoSettings(),
		loadRelatedProducts(storefrontProduct),
	]);
	const brandName = brand?.name ?? storefrontProduct.brandSlug;
	const brandFilterHref = `${categoryHref(categoryMeta.slug)}?brand=${storefrontProduct.brandSlug}`;
	const factsContext = seoFactsContext(storefrontProduct, allAttributes);
	const productFacts = buildProductSeoFacts(
		storefrontProduct,
		seoSettings.seoStoreName.trim() || seoSettings.siteName,
		factsContext,
		categoryMeta.label,
	);

	const productLd = productJsonLd({
		product: storefrontProduct,
		brand: brand ? { slug: brand.slug, name: brand.name } : null,
		category: { slug: categoryMeta.slug, label: categoryMeta.label },
		settings: seoSettings,
		attributes: factsContext.attributes,
		facts: productFacts,
	});
	const faqLd =
		storefrontProduct.seo?.faqs && storefrontProduct.seo.faqs.length > 0
			? faqPageJsonLd(storefrontProduct.seo.faqs)
			: buildProductFaqJsonLd(storefrontProduct, seoSettings, {
					categoryLabel: categoryMeta.label,
					attributes: factsContext.attributes,
				});
	const breadcrumbLd = breadcrumbJsonLd([
		{ name: "Home", url: seoSettings.siteUrl },
		{
			name: categoryMeta.label,
			url: `${seoSettings.siteUrl}${categoryHref(categoryMeta.slug)}`,
		},
		{
			name: storefrontProduct.name,
			url: productAbsoluteUrl(seoSettings.siteUrl, storefrontProduct, {
				variant: variantForSeo,
			}),
		},
	]);

	return (
		<VariantProvider product={storefrontProduct}>
			<PdpScrollReset />
			<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScriptContent(productLd) }} />
			{faqLd ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScriptContent(faqLd) }} /> : null}
			<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScriptContent(breadcrumbLd) }} />
			<VerticalRunwayProductPdp
				product={storefrontProduct}
				brandName={brandName}
				categorySlug={categoryMeta.slug}
				categoryLabel={categoryMeta.label}
				brandFilterHref={brandFilterHref}
				related={related}
				sizeChart={sizeChart}
			/>
		</VariantProvider>
	);
}
