"use client";

import { FilterDropdown } from "@/components/shared/FilterDropdown";
import { FILTER_PARAM_KEYS } from "@/lib/core/filterParams";
import type { SortOption } from "@/lib/core/queries";
import { useFilterParams } from "@/lib/core/useFilterParams";
import { Check } from "lucide-react";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
	{ value: "newest", label: "Newest" },
	{ value: "recently-updated", label: "Recently updated" },
	{ value: "price-asc", label: "Price · low to high" },
	{ value: "price-desc", label: "Price · high to low" },
	{ value: "name-asc", label: "Name · A to Z" },
];

function optionRowClass(isActive: boolean): string {
	return `flex w-full items-center justify-between px-3 py-2 text-left font-[family-name:var(--font-headline)] text-sm transition-colors ${
		isActive
			? "bg-[var(--color-accent-50)] font-medium text-[var(--color-accent-900)]"
			: "text-[var(--color-ink-700)] hover:bg-[var(--color-canvas-deep)]"
	}`;
}

export function ShopSortDropdown() {
	const filterApi = useFilterParams();
	const params = filterApi.params;

	const currentSort = (params.get(FILTER_PARAM_KEYS.sort) as SortOption | null) || "newest";
	const activeSortLabel = SORT_OPTIONS.find((option) => option.value === currentSort)?.label || "Sort";

	return (
		<FilterDropdown
			label={`Sort · ${activeSortLabel}`}
			activeCount={currentSort !== "newest" ? 1 : 0}
			triggerClassName="shadow-sm bg-[var(--color-surface)]"
			align="right"
		>
			<div className="flex flex-col gap-0.5 p-0.5">
				{SORT_OPTIONS.map((option) => {
					const isActive = currentSort === option.value;
					return (
						<button
							key={option.value}
							type="button"
							onClick={() => {
								const next = new URLSearchParams(params.toString());
								if (option.value === "newest") {
									next.delete(FILTER_PARAM_KEYS.sort);
								} else {
									next.set(FILTER_PARAM_KEYS.sort, option.value);
								}
								filterApi.replaceParams(next);
							}}
							className={optionRowClass(isActive)}
						>
							{option.label}
							{isActive ? <Check size={15} className="text-[var(--color-accent-600)]" aria-hidden /> : null}
						</button>
					);
				})}
			</div>
		</FilterDropdown>
	);
}
