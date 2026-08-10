"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Ruler, Trash2 } from "lucide-react";

import {
	WorkspaceCatalogPaneHeader,
	WorkspaceEmptyPane,
	WorkspaceFrame,
	WorkspacePrimaryAction,
	WorkspaceRowIconButton,
	WorkspaceSearchField,
} from "@/components/shared/workspaceUi";
import { StatusPill } from "@/components/shared/StatusPill";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { apiFetch } from "@/lib/api";
import { pingNavigationProgress } from "@/lib/navigation/navigationProgress";
import { useAdminPermissions } from "@/lib/permissionsContext";
import type { AdminSizeChart } from "@/types/models";

import { SizeChartEditor } from "./SizeChartEditor";

interface SizeChartsProps {
	charts: AdminSizeChart[];
}

type DrawerState = { mode: "new" } | { mode: "edit"; chart: AdminSizeChart } | null;

export function SizeCharts({ charts }: SizeChartsProps) {
	const router = useRouter();
	const toast = useToast();
	const { can } = useAdminPermissions();
	const canManage = can("category_manage");

	const [drawer, setDrawer] = useState<DrawerState>(null);
	const [toDelete, setToDelete] = useState<AdminSizeChart | null>(null);
	const [query, setQuery] = useState("");
	const deferredQuery = useDeferredValue(query);

	const visibleCharts = useMemo(() => {
		const term = deferredQuery.trim().toLowerCase();
		if (!term) return charts;
		return charts.filter((chart) => chart.name.toLowerCase().includes(term));
	}, [charts, deferredQuery]);

	function refresh() {
		pingNavigationProgress();
		router.refresh();
	}

	async function handleDelete() {
		if (!toDelete) return;
		try {
			await apiFetch(`/api/size-charts/${toDelete.id}`, { method: "DELETE" });
			toast.warn(`"${toDelete.name}" deleted`);
			setToDelete(null);
			refresh();
		} catch (error) {
			toast.danger(error instanceof Error ? error.message : "Failed to delete size chart");
		}
	}

	return (
		<WorkspaceFrame>
			<WorkspaceCatalogPaneHeader
				title={
					<div className="flex min-w-0 items-center gap-1.5">
						<Ruler size={15} className="shrink-0 text-[var(--color-accent-700)]" />
						<h2 className="text-sm font-semibold text-[var(--color-ink-900)]">Size charts</h2>
					</div>
				}
				subtitle={`${visibleCharts.length} shown · ${charts.length} total`}
				search={
					<WorkspaceSearchField
						value={query}
						onChange={setQuery}
						placeholder="Search charts…"
						aria-label="Search size charts"
						className="min-w-0 flex-1 sm:max-w-[14rem] sm:flex-none"
					/>
				}
				action={canManage ? <WorkspacePrimaryAction label="New chart" iconElement={<Plus size={14} />} onClick={() => setDrawer({ mode: "new" })} /> : undefined}
			/>
			<div className="min-h-0 flex-1 overflow-y-auto p-3 md:p-4">
				{visibleCharts.length === 0 ? (
					<WorkspaceEmptyPane
						iconElement={<Ruler size={22} />}
						title="No size charts yet"
						description="Create reusable measurement charts, then assign them to a category, brand, or individual product. Stitched products show a size guide and 'Find my size' from the assigned chart."
						action={canManage ? <WorkspacePrimaryAction label="New chart" iconElement={<Plus size={14} />} onClick={() => setDrawer({ mode: "new" })} /> : undefined}
					/>
				) : (
					<div className="overflow-x-auto rounded-md border border-[var(--color-ink-100)]">
						<table className="w-full border-collapse text-[13px]">
							<thead>
								<tr className="bg-[var(--color-canvas-deep)] text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-ink-500)]">
									<th className="px-3 py-2">Chart</th>
									<th className="px-3 py-2">Measurements</th>
									<th className="px-3 py-2">Sizes</th>
									<th className="px-3 py-2">Unit</th>
									<th className="px-3 py-2">Status</th>
									<th className="px-3 py-2 text-right">Actions</th>
								</tr>
							</thead>
							<tbody>
								{visibleCharts.map((chart) => (
									<tr key={chart.id} className="border-t border-[var(--color-ink-100)] align-middle">
										<td className="px-3 py-2.5 font-semibold text-[var(--color-ink-900)]">{chart.name}</td>
										<td className="px-3 py-2.5 text-[var(--color-ink-600)]">
											{chart.measurementKeys.map((key) => key.label).join(", ") || "—"}
										</td>
										<td className="px-3 py-2.5 tabular-nums text-[var(--color-ink-600)]">{chart.rows.length}</td>
										<td className="px-3 py-2.5 uppercase text-[var(--color-ink-600)]">{chart.unitPrimary}</td>
										<td className="px-3 py-2.5">
											<StatusPill tone={chart.isActive ? "success" : "neutral"}>{chart.isActive ? "Active" : "Inactive"}</StatusPill>
										</td>
										<td className="px-3 py-2.5">
											<div className="flex items-center justify-end gap-1">
												<WorkspaceRowIconButton
													label="Edit chart"
													iconElement={<Pencil size={13} />}
													onClick={() => setDrawer({ mode: "edit", chart })}
													disabled={!canManage}
												/>
												<WorkspaceRowIconButton
													label="Delete chart"
													iconElement={<Trash2 size={13} />}
													tone="danger"
													onClick={() => setToDelete(chart)}
													disabled={!canManage}
												/>
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>

			<SizeChartEditor
				isOpen={drawer !== null}
				onClose={() => setDrawer(null)}
				chart={drawer?.mode === "edit" ? drawer.chart : null}
				onSaved={refresh}
			/>

			<ConfirmDialog
				isOpen={toDelete !== null}
				title="Delete size chart?"
				message={toDelete ? `"${toDelete.name}" will be removed. Products or categories using it must be reassigned first.` : ""}
				confirmLabel="Delete"
				tone="danger"
				onConfirm={handleDelete}
				onCancel={() => setToDelete(null)}
			/>
		</WorkspaceFrame>
	);
}
