"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";

import { ATTRIBUTE_PARAM_PREFIX, FILTER_PARAM_KEYS } from "@/lib/core/filterParams";
import type { CategoryMeta, SortOption } from "@/lib/core/queries";
import type { Brand } from "@store/shared";
import { useFilterParams } from "@/lib/core/useFilterParams";
import { scheduleStateUpdate } from "@/lib/scheduleStateUpdate";
import { categoryHref } from "@/lib/catalog/productPaths";

const TYPE_FILTER_KEY = `${ATTRIBUTE_PARAM_PREFIX}type`;

const TYPE_OPTIONS = [
	{ value: "any", label: "Any" },
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

interface ShopFilterSidebarProps {
	categories: CategoryMeta[];
	brands: Brand[];
	activeSlug: string;
}

function SidebarSection({ title, children }: { title: string; children: React.ReactNode }) {
	return (
		<div className="mb-8">
			<h3 className="mb-3 font-[family-name:var(--font-headline)] text-xs font-semibold uppercase tracking-widest text-[var(--color-ink-900)]">
				{title}
			</h3>
			<div className="flex flex-col gap-1.5">{children}</div>
		</div>
	);
}

function OptionRow({ isActive, children, onClick, href }: { isActive: boolean; children: React.ReactNode; onClick?: () => void; href?: string }) {
	const className = `group flex w-full items-center justify-between text-left font-[family-name:var(--font-headline)] text-[14px] transition-colors ${
		isActive ? "font-medium text-[var(--color-ink-900)]" : "text-[var(--color-ink-500)] hover:text-[var(--color-ink-900)]"
	}`;

	const content = (
		<>
			<span>{children}</span>
			{isActive && <Check size={14} className="text-[var(--color-ink-900)]" aria-hidden />}
		</>
	);

	if (href) {
		return (
			<Link href={href} className={className}>
				{content}
			</Link>
		);
	}

	return (
		<button type="button" onClick={onClick} className={className}>
			{content}
		</button>
	);
}

export function ShopFilterSidebar({ categories, brands, activeSlug }: ShopFilterSidebarProps) {
	const filterApi = useFilterParams();
	const params = filterApi.params;
	const [isMobileOpen, setIsMobileOpen] = useState(false);

	// Categories
	const visibleCategories = categories.filter((category) => category.isActive);

	// Brands
	const selectedBrands = filterApi.getMulti(FILTER_PARAM_KEYS.brands);
	const visibleBrands = brands.filter((brand) => brand.productCount > 0 || selectedBrands.includes(brand.slug));

	// Type
	const selectedTypes = filterApi.getMulti(TYPE_FILTER_KEY);

	// Price
	const minPriceParam = params.get(FILTER_PARAM_KEYS.minPrice) ?? "";
	const maxPriceParam = params.get(FILTER_PARAM_KEYS.maxPrice) ?? "";
	const [minPrice, setMinPrice] = useState(minPriceParam);
	const [maxPrice, setMaxPrice] = useState(maxPriceParam);

	const isPriceChanged = minPrice !== minPriceParam || maxPrice !== maxPriceParam;
	const hasPriceInput = minPrice !== "" || maxPrice !== "";
	const canApplyPrice = isPriceChanged && hasPriceInput;
	const canClearPrice = !minPrice && !maxPrice && Boolean(minPriceParam || maxPriceParam);

	useEffect(() => {
		scheduleStateUpdate(() => {
			setMinPrice(minPriceParam);
			setMaxPrice(maxPriceParam);
		});
	}, [minPriceParam, maxPriceParam]);

	const applyPriceRange = useCallback(() => {
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
	}, [filterApi, maxPrice, minPrice, params]);

	return (
		<div className="w-full pr-0 md:pr-4">
			<button
				type="button"
				onClick={() => setIsMobileOpen(!isMobileOpen)}
				className="mb-4 flex w-full items-center justify-between border-b border-[var(--color-ink-200)] pb-3 font-[family-name:var(--font-headline)] text-sm font-semibold uppercase tracking-widest text-[var(--color-ink-900)] md:hidden"
			>
				<span>Filters</span>
				<span>{isMobileOpen ? "−" : "+"}</span>
			</button>

			<div className={`${isMobileOpen ? "block" : "hidden"} md:block`}>
				{visibleCategories.length > 0 && (
					<SidebarSection title="Category">
					{visibleCategories.map((category) => (
						<OptionRow
							key={category.slug}
							isActive={category.slug === activeSlug}
							href={categoryHref(category.slug)}
						>
							{category.label}
						</OptionRow>
					))}
				</SidebarSection>
			)}

			{visibleBrands.length > 0 && (
				<SidebarSection title="Brand">
					{visibleBrands.map((brand) => (
						<OptionRow
							key={brand.slug}
							isActive={selectedBrands.includes(brand.slug)}
							onClick={() => filterApi.toggleInMulti(FILTER_PARAM_KEYS.brands, brand.slug)}
						>
							{brand.name}
						</OptionRow>
					))}
				</SidebarSection>
			)}

			<SidebarSection title="Type">
				{TYPE_OPTIONS.map((option) => {
					const isActive =
						option.value === "any"
							? selectedTypes.length === 0
							: selectedTypes.includes(option.value);

					return (
						<OptionRow
							key={option.value}
							isActive={isActive}
							onClick={() => {
								if (option.value === "any") {
									const next = new URLSearchParams(params.toString());
									next.delete(TYPE_FILTER_KEY);
									filterApi.replaceParams(next);
								} else {
									filterApi.toggleInMulti(TYPE_FILTER_KEY, option.value);
								}
							}}
						>
							{option.label}
						</OptionRow>
					);
				})}
			</SidebarSection>

			<SidebarSection title="Price">
				<div className="flex flex-col gap-3">
					<div className="flex items-center gap-2">
						<input
							type="number"
							inputMode="numeric"
							min={0}
							value={minPrice}
							placeholder="Min"
							onChange={(event) => setMinPrice(event.target.value.replace(/[^0-9]/g, ""))}
							className="h-9 w-full border border-[var(--color-ink-200)] bg-transparent px-3 font-[family-name:var(--font-headline)] text-[13px] text-[var(--color-ink-900)] outline-none focus:border-[var(--color-ink-900)]"
						/>
						<span className="text-[var(--color-ink-400)]" aria-hidden>
							–
						</span>
						<input
							type="number"
							inputMode="numeric"
							min={0}
							value={maxPrice}
							placeholder="Max"
							onChange={(event) => setMaxPrice(event.target.value.replace(/[^0-9]/g, ""))}
							className="h-9 w-full border border-[var(--color-ink-200)] bg-transparent px-3 font-[family-name:var(--font-headline)] text-[13px] text-[var(--color-ink-900)] outline-none focus:border-[var(--color-ink-900)]"
						/>
					</div>
					<button
						type="button"
						onClick={applyPriceRange}
						className="flex w-full items-center justify-center border border-[var(--color-ink-900)] bg-[var(--color-ink-900)] py-2 font-[family-name:var(--font-headline)] text-[12px] font-medium text-[var(--color-canvas)] transition-colors hover:bg-[var(--color-ink-800)]"
					>
						Apply
					</button>
				</div>
			</SidebarSection>
			</div>
		</div>
	);
}
