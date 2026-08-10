"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpDown, Check, SlidersHorizontal } from "lucide-react";

import { BottomSheet } from "@/components/ui/BottomSheet";
import { categoryHref } from "@/lib/catalog/productPaths";
import { ATTRIBUTE_PARAM_PREFIX, FILTER_PARAM_KEYS } from "@/lib/core/filterParams";
import type { SortOption } from "@/lib/core/queries";
import { useFilterParams } from "@/lib/core/useFilterParams";
import type { CategoryMeta } from "@/lib/core";
import type { Brand } from "@store/shared";

import styles from "./shopMobileFilterDock.module.css";

const TYPE_FILTER_KEY = `${ATTRIBUTE_PARAM_PREFIX}type`;

const TYPE_OPTIONS = [
	{ value: "stitched", label: "Stitched" },
	{ value: "unstitched", label: "Unstitched" },
] as const;

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
	{ value: "newest", label: "Newest" },
	{ value: "recently-updated", label: "Recently updated" },
	{ value: "price-asc", label: "Price · low to high" },
	{ value: "price-desc", label: "Price · high to low" },
	{ value: "name-asc", label: "Name · A to Z" },
];

interface ShopMobileFilterDockProps {
	categories: CategoryMeta[];
	brands: Brand[];
	activeSlug: string;
}

/** Floating pill above the tab bar: opens filters or sort in a bottom sheet. */
export function ShopMobileFilterDock({ categories, brands, activeSlug }: ShopMobileFilterDockProps) {
	const [openSheet, setOpenSheet] = useState<"filters" | "sort" | null>(null);
	const filterApi = useFilterParams();
	const params = filterApi.params;

	const selectedBrands = filterApi.getMulti(FILTER_PARAM_KEYS.brands);
	const selectedTypes = filterApi.getMulti(TYPE_FILTER_KEY);
	const minPriceParam = params.get(FILTER_PARAM_KEYS.minPrice) ?? "";
	const maxPriceParam = params.get(FILTER_PARAM_KEYS.maxPrice) ?? "";
	const currentSort = (params.get(FILTER_PARAM_KEYS.sort) as SortOption | null) ?? "newest";

	const [minPrice, setMinPrice] = useState(minPriceParam);
	const [maxPrice, setMaxPrice] = useState(maxPriceParam);

	const activeCount = selectedBrands.length + selectedTypes.length + (minPriceParam || maxPriceParam ? 1 : 0);
	const sortLabel = SORT_OPTIONS.find((option) => option.value === currentSort)?.label ?? "Sort";

	const visibleCategories = categories.filter((category) => category.isActive);
	const visibleBrands = brands.filter((brand) => brand.productCount > 0 || selectedBrands.includes(brand.slug));

	function applyPrice() {
		const next = new URLSearchParams(params.toString());
		if (minPrice) {
			next.set(FILTER_PARAM_KEYS.minPrice, minPrice);
		} else {
			next.delete(FILTER_PARAM_KEYS.minPrice);
		}
		if (maxPrice) {
			next.set(FILTER_PARAM_KEYS.maxPrice, maxPrice);
		} else {
			next.delete(FILTER_PARAM_KEYS.maxPrice);
		}
		filterApi.replaceParams(next);
	}

	function chooseSort(value: SortOption) {
		const next = new URLSearchParams(params.toString());
		if (value === "newest") {
			next.delete(FILTER_PARAM_KEYS.sort);
		} else {
			next.set(FILTER_PARAM_KEYS.sort, value);
		}
		filterApi.replaceParams(next);
		setOpenSheet(null);
	}

	function clearAll() {
		setMinPrice("");
		setMaxPrice("");
		filterApi.clearAll();
	}

	return (
		<>
			<nav className={styles.dock} aria-label="Filter and sort">
				<button type="button" className={styles.segment} onClick={() => setOpenSheet("filters")}>
					<SlidersHorizontal size={15} aria-hidden />
					Filters
					{activeCount > 0 && <span className={styles.count}>{activeCount}</span>}
				</button>
				<span className={styles.segmentDivider} aria-hidden />
				<button type="button" className={styles.segment} onClick={() => setOpenSheet("sort")}>
					<ArrowUpDown size={15} aria-hidden />
					Sort
				</button>
			</nav>

			<BottomSheet
				isOpen={openSheet === "sort"}
				onClose={() => setOpenSheet(null)}
				title="Sort by"
				description={sortLabel}
				height="auto"
			>
				{SORT_OPTIONS.map((option) => {
					const isActive = currentSort === option.value;
					return (
						<button
							key={option.value}
							type="button"
							onClick={() => chooseSort(option.value)}
							className={isActive ? `${styles.sortRow} ${styles.sortRowActive}` : styles.sortRow}
						>
							{option.label}
							{isActive && <Check size={16} aria-hidden />}
						</button>
					);
				})}
			</BottomSheet>

			<BottomSheet
				isOpen={openSheet === "filters"}
				onClose={() => setOpenSheet(null)}
				title="Filters"
				height="lg"
				footer={
					<div className={styles.footerRow}>
						<button type="button" className={styles.footerClear} onClick={clearAll}>
							Clear
						</button>
						<button type="button" className={styles.footerApply} onClick={() => setOpenSheet(null)}>
							Show results
						</button>
					</div>
				}
			>
				{visibleCategories.length > 0 && (
					<div className={styles.sheetSection}>
						<h3 className={styles.sheetTitle}>Category</h3>
						<div className={styles.chips}>
							{visibleCategories.map((category) => (
								<Link
									key={category.slug}
									href={categoryHref(category.slug)}
									className={category.slug === activeSlug ? `${styles.chip} ${styles.chipActive}` : styles.chip}
								>
									{category.label}
								</Link>
							))}
						</div>
					</div>
				)}

				{visibleBrands.length > 0 && (
					<div className={styles.sheetSection}>
						<h3 className={styles.sheetTitle}>Brand</h3>
						<div className={styles.chips}>
							{visibleBrands.map((brand) => (
								<button
									key={brand.slug}
									type="button"
									onClick={() => filterApi.toggleInMulti(FILTER_PARAM_KEYS.brands, brand.slug)}
									className={selectedBrands.includes(brand.slug) ? `${styles.chip} ${styles.chipActive}` : styles.chip}
								>
									{brand.name}
								</button>
							))}
						</div>
					</div>
				)}

				<div className={styles.sheetSection}>
					<h3 className={styles.sheetTitle}>Type</h3>
					<div className={styles.chips}>
						{TYPE_OPTIONS.map((option) => (
							<button
								key={option.value}
								type="button"
								onClick={() => filterApi.toggleInMulti(TYPE_FILTER_KEY, option.value)}
								className={selectedTypes.includes(option.value) ? `${styles.chip} ${styles.chipActive}` : styles.chip}
							>
								{option.label}
							</button>
						))}
					</div>
				</div>

				<div className={styles.sheetSection}>
					<h3 className={styles.sheetTitle}>Price</h3>
					<div className={styles.priceRow}>
						<input
							type="number"
							inputMode="numeric"
							min={0}
							value={minPrice}
							placeholder="Min"
							onChange={(event) => setMinPrice(event.target.value.replace(/[^0-9]/g, ""))}
							className={styles.priceInput}
						/>
						<span className={styles.priceDash} aria-hidden>
							–
						</span>
						<input
							type="number"
							inputMode="numeric"
							min={0}
							value={maxPrice}
							placeholder="Max"
							onChange={(event) => setMaxPrice(event.target.value.replace(/[^0-9]/g, ""))}
							className={styles.priceInput}
						/>
						<button type="button" className={styles.footerClear} onClick={applyPrice}>
							Set
						</button>
					</div>
				</div>
			</BottomSheet>
		</>
	);
}
