import { classNames } from "@store/shared";

/** Editorial lookbook pill — hairline square, headline type (not Chandni candy pills). */
export const SHOP_LOOKBOOK_PILL_BASE =
	"shop-lookbook-pill tap focus-ring inline-flex items-center gap-1.5 border px-3 py-2 font-[family-name:var(--font-headline)] text-[12px] tracking-[0.04em] md:px-3.5 md:text-[13px]";

export function shopLookbookPillClass(isActive: boolean): string {
	return classNames(
		SHOP_LOOKBOOK_PILL_BASE,
		isActive
			? "border-[var(--color-accent-500)] bg-[var(--color-accent-50)] text-[var(--color-accent-800)]"
			: "border-[color-mix(in_srgb,var(--color-ink-900)_18%,transparent)] bg-[var(--color-surface)] text-[var(--color-ink-800)] hover:border-[var(--color-accent-400)] hover:text-[var(--color-accent-700)]",
	);
}
