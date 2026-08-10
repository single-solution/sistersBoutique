import { STOREFRONT_SHELL_CLASS } from "@/lib/layout/storefrontShell";

/** Shop category banner, toolbar, and grid — same shell as the header. */
export const SHOP_CATEGORY_PAGE_CLASS = STOREFRONT_SHELL_CLASS;

/**
 * Editorial listing density — fewer columns, more air than the old 5-col commerce grid.
 * Shared by category, search, deals, and glossary product grids.
 * 2 -> 3 (640) -> 4 (1280) columns; a 5th column appears only above 1536 so wide
 * screens stay dense without changing the 1440 reference (still 4 columns there).
 */
export const SHOP_CATEGORY_GRID_CLASS =
	"grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 md:gap-5 xl:grid-cols-4 xl:gap-6 2xl:grid-cols-5 2xl:gap-7";

export const SHOP_CATEGORY_SKELETON_CARDS = 9;
