"use client";

import { useMemo } from "react";
import Link from "next/link";

import { type Product } from "@store/shared";
import { ProductImage } from "@/components/shared/ProductImage";
import { productHref } from "@/lib/catalog/productPaths";
import { usePrefetchOnIntent } from "@/lib/navigation/usePrefetchOnIntent";
import { useActiveOffers } from "@/lib/pricing/useActiveOffers";
import { resolveProductCatalogDealOffers } from "@/lib/pricing/productOfferMatch";
import {
	formatProductPriceLead,
	getListingAttributeChips,
	isProductInStock,
	resolveListingVariant,
	resolveProductHeroImage,
} from "@/lib/productSummary";

import { ProductDealAvailableBadge } from "./ProductDealAvailableBadge";

interface ProductCardProps {
	product: Product;
	catalogProduct?: Product;
	priority?: boolean;
}

export function ProductCard({ product, catalogProduct, priority = false }: ProductCardProps) {
	const catalog = catalogProduct ?? product;
	const brandName = product.brandName ?? product.brandSlug;
	const inStock = isProductInStock(catalog);
	const hasVariants = catalog.variants.length > 0;
	const productHeroImage = resolveProductHeroImage(catalog) ?? resolveProductHeroImage(product);
	const priceLead = formatProductPriceLead(catalog);
	const attributeChips = useMemo(() => getListingAttributeChips(catalog), [catalog]);

	const href = useMemo(() => {
		const listingVariant = resolveListingVariant(catalog);
		return listingVariant ? productHref(catalog, { variant: listingVariant }) : productHref(catalog);
	}, [catalog]);

	const prefetchHandlers = usePrefetchOnIntent(href);
	const { offers } = useActiveOffers();

	const applicableOfferCount = useMemo(() => {
		if (offers.length === 0 || !inStock) {
			return 0;
		}
		return resolveProductCatalogDealOffers(catalog, offers).length;
	}, [catalog, inStock, offers]);

	return (
		<Link
			href={href}
			className="group block w-full focus:outline-none"
			onPointerDown={prefetchHandlers.onPointerDown}
			onTouchStart={prefetchHandlers.onTouchStart}
			onFocus={prefetchHandlers.onFocus}
		>
			<div className="relative aspect-[3/4] w-full overflow-hidden rounded-[var(--radius-md)] bg-[var(--color-canvas-deep)]">
				<div className="absolute inset-0 transition-transform duration-500 ease-out group-hover:scale-[1.03]">
					<ProductImage
						image={productHeroImage}
						variant="card"
						name={product.name}
						brandName={brandName}
						brandSlug={product.brandSlug}
						priority={priority}
					/>
				</div>

				{applicableOfferCount > 0 ? (
					<div className="absolute left-1.5 top-1.5 z-20 md:left-3 md:top-3">
						<ProductDealAvailableBadge offerCount={applicableOfferCount} />
					</div>
				) : null}

				{!hasVariants || !inStock ? (
					<div className="absolute inset-0 z-20 flex items-center justify-center bg-[var(--color-canvas-deep)]/70">
						<span className="border border-[var(--color-ink-500)] bg-[var(--color-surface)] px-3 py-1 text-[10px] font-semibold tracking-[0.08em] text-[var(--color-ink-900)] md:px-4 md:py-1.5 md:text-[11px]">
							{hasVariants ? "Sold out" : "Unavailable"}
						</span>
					</div>
				) : null}

				{/* Full-width overlay: title + attributes on top, brand + price share the bottom row. */}
				<div className="absolute inset-x-0 bottom-0 z-10 flex flex-col gap-1.5 bg-gradient-to-t from-black/90 via-black/60 to-transparent px-3 pb-3 pt-24 [text-shadow:0_1px_4px_rgba(0,0,0,0.65)] md:px-4 md:pb-4">
					<h3 className="font-[family-name:var(--font-headline)] text-[15px] font-bold leading-snug tracking-tight text-white line-clamp-2 md:text-base">
						{product.name}
					</h3>

					{attributeChips.length > 0 ? (
						<div className="flex flex-wrap gap-1">
							{attributeChips.map((chip) => (
								<span
									key={chip}
									className="rounded-[var(--radius-full)] border border-white/45 bg-black/25 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-white [text-shadow:none]"
								>
									{chip}
								</span>
							))}
						</div>
					) : null}

					<div className="mt-0.5 flex items-end justify-between gap-2">
						{brandName ? (
							<span className="font-[family-name:var(--font-headline)] text-[11px] font-bold uppercase tracking-[0.14em] text-white/90">
								{brandName}
							</span>
						) : null}
						{priceLead ? (
							<span className="shrink-0 font-[family-name:var(--font-headline)] text-lg font-bold leading-none text-white md:text-xl">
								{priceLead}
							</span>
						) : null}
					</div>
				</div>
			</div>
		</Link>
	);
}
