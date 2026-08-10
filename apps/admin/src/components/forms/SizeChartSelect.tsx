"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { AdminSizeChart } from "@/types/models";

interface SizeChartSelectProps {
	/** Empty string = no default (inherit / none). Otherwise a chart id. */
	value: string;
	onChange: (value: string) => void;
	label: string;
	hint?: string;
}

/**
 * Self-contained select for choosing a default size chart on a brand or
 * category. Loads the active charts on mount so callers don't have to thread
 * the catalog through their prop chain.
 */
export function SizeChartSelect({ value, onChange, label, hint }: SizeChartSelectProps) {
	const [charts, setCharts] = useState<AdminSizeChart[]>([]);

	useEffect(() => {
		let cancelled = false;
		apiFetch<{ items: AdminSizeChart[] }>("/api/size-charts?limit=200")
			.then((response) => {
				if (!cancelled) setCharts(response.items);
			})
			.catch(() => {
				// Non-fatal: the select just shows "None" until charts load.
			});
		return () => {
			cancelled = true;
		};
	}, []);

	return (
		<div>
			<span className="mb-1 block text-[11.5px] font-semibold uppercase tracking-[0.12em] text-[var(--color-ink-700)]">{label}</span>
			<select
				value={value}
				onChange={(event) => onChange(event.target.value)}
				className="block w-full rounded-md border border-[var(--color-ink-200)] bg-[var(--color-surface)] px-3 py-2 text-[14px] focus:border-[var(--color-accent-500)] focus:outline-none"
			>
				<option value="">None</option>
				{charts.map((chart) => (
					<option key={chart.id} value={chart.id}>
						{chart.name}
					</option>
				))}
			</select>
			{hint ? <p className="mt-1 text-[11.5px] text-[var(--color-ink-500)]">{hint}</p> : null}
		</div>
	);
}
