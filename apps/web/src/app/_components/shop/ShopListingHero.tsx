import { SHOP_CATEGORY_PAGE_CLASS } from "@/lib/catalog/shopListingGrid";

interface ShopListingHeroProps {
	title: string;
	description?: string;
	/** Optional wine micro-label above the title (e.g. Discover, Condition grade). */
	eyebrow?: string;
}

/**
 * Compact Allura listing hero — blush band, calligraphy title at commerce scale
 * (not homepage billboard sizes). Shared by category, search, deals, glossaries.
 */
export function ShopListingHero({ title, description, eyebrow }: ShopListingHeroProps) {
	return (
		<header className="border-b border-[color-mix(in_srgb,var(--color-accent-500)_12%,transparent)] bg-[var(--color-canvas-deep)]">
			<div className={`${SHOP_CATEGORY_PAGE_CLASS} py-10 md:py-14`}>
				{eyebrow ? (
					<p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-accent-deep)] md:text-xs">{eyebrow}</p>
				) : null}
				<h1
					className={`font-display text-[clamp(2.4rem,5.5vw,3.6rem)] font-normal leading-[0.95] tracking-normal text-[var(--color-ink-900)] not-italic ${eyebrow ? "mt-2.5" : ""}`}
				>
					{title}
				</h1>
				{description ? (
					<p className="mt-3.5 max-w-[38rem] text-base font-normal leading-relaxed text-[var(--color-ink-500)]">{description}</p>
				) : null}
			</div>
		</header>
	);
}
