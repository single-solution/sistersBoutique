"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Wand2, X } from "lucide-react";
import { slugify } from "@store/shared";

import { Button } from "@store/ui";
import { Drawer } from "@/components/ui/Drawer";
import { Toggle } from "@/components/ui/Toggle";
import { useToast } from "@/components/ui/Toast";
import { apiFetch, ApiError } from "@/lib/api";
import type { AdminSizeChart } from "@/types/models";

interface SizeChartEditorProps {
	isOpen: boolean;
	onClose: () => void;
	chart: AdminSizeChart | null;
	onSaved: () => void;
}

interface ColumnDraft {
	id: string;
	label: string;
}

interface RowDraft {
	id: string;
	label: string;
	/** Column id -> entered value (string in-flight, parsed on save). */
	values: Record<string, string>;
}

interface FormState {
	name: string;
	unitPrimary: "in" | "cm";
	fitAdvice: string;
	notes: string;
	isActive: boolean;
	columns: ColumnDraft[];
	rows: RowDraft[];
}

const CHART_NAME_MAX = 120;
const ADVICE_MAX = 600;
const MAX_COLUMNS = 12;
const MAX_ROWS = 12;

/** Common stitched-suit chart: body measurements + finished garment lengths. */
const STITCHED_PRESET_COLUMNS = ["Bust", "Waist", "Hip", "Shoulder", "Kameez length", "Trouser length"];
const STITCHED_PRESET_SIZES = ["XS", "S", "M", "L", "XL"];

function newId(): string {
	return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `id-${Math.random().toString(36).slice(2)}`;
}

function emptyForm(): FormState {
	const columns: ColumnDraft[] = [{ id: newId(), label: "" }];
	return {
		name: "",
		unitPrimary: "in",
		fitAdvice: "",
		notes: "",
		isActive: true,
		columns,
		rows: [{ id: newId(), label: "", values: {} }],
	};
}

function formFromChart(chart: AdminSizeChart): FormState {
	const columns: ColumnDraft[] = chart.measurementKeys.map((key) => ({ id: key.key, label: key.label }));
	const rows: RowDraft[] = chart.rows.map((row) => {
		const values: Record<string, string> = {};
		for (const column of columns) {
			const numeric = row.values[column.id];
			values[column.id] = numeric === undefined ? "" : String(numeric);
		}
		return { id: newId(), label: row.label, values };
	});
	return {
		name: chart.name,
		unitPrimary: chart.unitPrimary,
		fitAdvice: chart.fitAdvice,
		notes: chart.notes,
		isActive: chart.isActive,
		columns: columns.length > 0 ? columns : [{ id: newId(), label: "" }],
		rows: rows.length > 0 ? rows : [{ id: newId(), label: "", values: {} }],
	};
}

export function SizeChartEditor({ isOpen, onClose, chart, onSaved }: SizeChartEditorProps) {
	const toast = useToast();
	const [form, setForm] = useState<FormState>(() => (chart ? formFromChart(chart) : emptyForm()));
	const [submitting, setSubmitting] = useState(false);

	useEffect(() => {
		if (!isOpen) return;
		// eslint-disable-next-line react-hooks/set-state-in-effect -- reset form on drawer open; the drawer is the external system here
		setForm(chart ? formFromChart(chart) : emptyForm());
	}, [isOpen, chart]);

	function addColumn() {
		setForm((prev) => (prev.columns.length >= MAX_COLUMNS ? prev : { ...prev, columns: [...prev.columns, { id: newId(), label: "" }] }));
	}
	function removeColumn(columnId: string) {
		setForm((prev) => {
			if (prev.columns.length === 1) return prev;
			return {
				...prev,
				columns: prev.columns.filter((column) => column.id !== columnId),
				rows: prev.rows.map((row) => {
					const values = { ...row.values };
					delete values[columnId];
					return { ...row, values };
				}),
			};
		});
	}
	function updateColumnLabel(columnId: string, label: string) {
		setForm((prev) => ({ ...prev, columns: prev.columns.map((column) => (column.id === columnId ? { ...column, label } : column)) }));
	}
	function addRow() {
		setForm((prev) => (prev.rows.length >= MAX_ROWS ? prev : { ...prev, rows: [...prev.rows, { id: newId(), label: "", values: {} }] }));
	}
	function removeRow(rowId: string) {
		setForm((prev) => (prev.rows.length === 1 ? prev : { ...prev, rows: prev.rows.filter((row) => row.id !== rowId) }));
	}
	function updateRowLabel(rowId: string, label: string) {
		setForm((prev) => ({ ...prev, rows: prev.rows.map((row) => (row.id === rowId ? { ...row, label } : row)) }));
	}
	function updateCell(rowId: string, columnId: string, value: string) {
		setForm((prev) => ({
			...prev,
			rows: prev.rows.map((row) => (row.id === rowId ? { ...row, values: { ...row.values, [columnId]: value } } : row)),
		}));
	}
	function loadStitchedPreset() {
		setForm((prev) => ({
			...prev,
			columns: STITCHED_PRESET_COLUMNS.map((label) => ({ id: newId(), label })),
			rows: STITCHED_PRESET_SIZES.map((label) => ({ id: newId(), label, values: {} })),
		}));
	}

	async function handleSubmit(event: React.FormEvent) {
		event.preventDefault();
		if (submitting) return;
		if (!form.name.trim()) {
			toast.danger("Chart name is required.");
			return;
		}
		const columns = form.columns.filter((column) => column.label.trim().length > 0);
		if (columns.length === 0) {
			toast.danger("Add at least one measurement column.");
			return;
		}
		const rows = form.rows.filter((row) => row.label.trim().length > 0);
		if (rows.length === 0) {
			toast.danger("Add at least one size row.");
			return;
		}

		const measurementKeys = columns.map((column) => ({ key: slugify(column.label, 40), label: column.label.trim() }));
		const payloadRows = rows.map((row) => {
			const values: Record<string, number> = {};
			for (const column of columns) {
				const raw = row.values[column.id];
				if (raw === undefined || raw.trim() === "") continue;
				const numeric = Number(raw);
				if (Number.isFinite(numeric)) {
					values[slugify(column.label, 40)] = numeric;
				}
			}
			return { label: row.label.trim(), values };
		});

		setSubmitting(true);
		try {
			const payload = {
				name: form.name.trim(),
				unitPrimary: form.unitPrimary,
				measurementKeys,
				rows: payloadRows,
				fitAdvice: form.fitAdvice.trim(),
				notes: form.notes.trim(),
				isActive: form.isActive,
			};
			if (chart) {
				await apiFetch<AdminSizeChart>(`/api/size-charts/${chart.id}`, { method: "PUT", json: payload });
				toast.success("Size chart updated.");
			} else {
				await apiFetch<AdminSizeChart>("/api/size-charts", { method: "POST", json: payload });
				toast.success("Size chart created.");
			}
			onSaved();
			onClose();
		} catch (error) {
			const message = error instanceof ApiError ? error.message : error instanceof Error ? error.message : "Failed to save size chart.";
			toast.danger(message);
		} finally {
			setSubmitting(false);
		}
	}

	const fieldClass =
		"block w-full rounded-md border border-[var(--color-ink-200)] bg-[var(--color-surface)] px-3 py-2 text-[14px] focus:border-[var(--color-accent-500)] focus:outline-none";
	const labelClass = "mb-1 block text-[11.5px] font-semibold uppercase tracking-[0.12em] text-[var(--color-ink-700)]";

	return (
		<Drawer
			isOpen={isOpen}
			onClose={onClose}
			title={chart ? `Edit · ${chart.name}` : "New size chart"}
			description="Measurements are stored in inches. The storefront shows a cm toggle automatically. Size labels (XS–XL) should match the product's size options so the guide can highlight the selected size."
			width="xl"
			footer={
				<div className="flex items-center justify-end gap-2">
					<Button variant="ghost" size="sm" type="button" onClick={onClose} disabled={submitting}>
						Cancel
					</Button>
					<Button variant="primary" size="sm" type="submit" form="size-chart-editor-form" isLoading={submitting}>
						{chart ? "Save changes" : "Create chart"}
					</Button>
				</div>
			}
		>
			<form id="size-chart-editor-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
				<div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto]">
					<div>
						<label htmlFor="size-chart-name" className={labelClass}>
							Chart name
						</label>
						<input
							id="size-chart-name"
							type="text"
							value={form.name}
							onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
							placeholder="e.g. Stitched suits — standard"
							maxLength={CHART_NAME_MAX}
							required
							className={fieldClass}
						/>
					</div>
					<div>
						<span className={labelClass}>Primary unit</span>
						<div className="flex gap-2">
							{(["in", "cm"] as const).map((unit) => (
								<button
									key={unit}
									type="button"
									onClick={() => setForm((prev) => ({ ...prev, unitPrimary: unit }))}
									className={
										"rounded-md border px-3 py-2 text-[12.5px] font-semibold transition " +
										(form.unitPrimary === unit
											? "border-[var(--color-accent-500)] bg-[var(--color-accent-100)] text-[var(--color-accent-800)]"
											: "border-[var(--color-ink-200)] bg-[var(--color-surface)] text-[var(--color-ink-700)] hover:bg-[var(--color-canvas-deep)]")
									}
								>
									{unit === "in" ? "Inches" : "Centimetres"}
								</button>
							))}
						</div>
					</div>
				</div>

				<div className="flex items-center justify-between gap-2">
					<span className={labelClass + " mb-0"}>Measurements</span>
					<Button variant="ghost" size="sm" type="button" leadingIcon={<Wand2 size={13} />} onClick={loadStitchedPreset}>
						Load stitched preset
					</Button>
				</div>

				<div className="overflow-x-auto rounded-md border border-[var(--color-ink-100)]">
					<table className="w-full border-collapse text-[13px]">
						<thead>
							<tr className="bg-[var(--color-canvas-deep)]">
								<th className="sticky left-0 z-10 bg-[var(--color-canvas-deep)] px-2 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-ink-500)]">
									Size
								</th>
								{form.columns.map((column) => (
									<th key={column.id} className="min-w-[110px] px-2 py-2">
										<div className="flex items-center gap-1">
											<input
												type="text"
												value={column.label}
												onChange={(event) => updateColumnLabel(column.id, event.target.value)}
												placeholder="e.g. Bust"
												className="min-w-0 flex-1 rounded border border-[var(--color-ink-200)] bg-[var(--color-surface)] px-2 py-1 text-[12.5px] focus:border-[var(--color-accent-500)] focus:outline-none"
											/>
											<button
												type="button"
												onClick={() => removeColumn(column.id)}
												aria-label="Remove measurement column"
												disabled={form.columns.length === 1}
												className="rounded p-1 text-[var(--color-ink-500)] hover:bg-[var(--color-rose-100)] hover:text-[var(--color-rose-700)] disabled:opacity-40"
											>
												<X size={13} />
											</button>
										</div>
									</th>
								))}
								<th className="px-2 py-2">
									<button
										type="button"
										onClick={addColumn}
										disabled={form.columns.length >= MAX_COLUMNS}
										aria-label="Add measurement column"
										className="inline-flex items-center gap-1 rounded-md border border-dashed border-[var(--color-ink-200)] px-2 py-1 text-[11.5px] font-semibold text-[var(--color-ink-700)] hover:bg-[var(--color-canvas-deep)] disabled:opacity-50"
									>
										<Plus size={12} />
									</button>
								</th>
							</tr>
						</thead>
						<tbody>
							{form.rows.map((row) => (
								<tr key={row.id} className="border-t border-[var(--color-ink-100)]">
									<td className="sticky left-0 z-10 bg-[var(--color-surface)] px-2 py-1.5">
										<input
											type="text"
											value={row.label}
											onChange={(event) => updateRowLabel(row.id, event.target.value)}
											placeholder="e.g. M"
											className="w-20 rounded border border-[var(--color-ink-200)] bg-[var(--color-surface)] px-2 py-1 text-[12.5px] font-semibold uppercase focus:border-[var(--color-accent-500)] focus:outline-none"
										/>
									</td>
									{form.columns.map((column) => (
										<td key={column.id} className="px-2 py-1.5">
											<input
												type="number"
												inputMode="decimal"
												min={0}
												max={200}
												step="0.5"
												value={row.values[column.id] ?? ""}
												onChange={(event) => updateCell(row.id, column.id, event.target.value)}
												placeholder="in"
												className="w-full rounded border border-[var(--color-ink-200)] bg-[var(--color-surface)] px-2 py-1 text-[12.5px] tabular-nums focus:border-[var(--color-accent-500)] focus:outline-none"
											/>
										</td>
									))}
									<td className="px-2 py-1.5 text-center">
										<button
											type="button"
											onClick={() => removeRow(row.id)}
											aria-label="Remove size row"
											disabled={form.rows.length === 1}
											className="rounded p-1 text-[var(--color-ink-500)] hover:bg-[var(--color-rose-100)] hover:text-[var(--color-rose-700)] disabled:opacity-40"
										>
											<Trash2 size={13} />
										</button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
				<button
					type="button"
					onClick={addRow}
					disabled={form.rows.length >= MAX_ROWS}
					className="inline-flex w-fit items-center gap-1 rounded-md border border-dashed border-[var(--color-ink-200)] bg-[var(--color-surface)] px-2.5 py-1.5 text-[12.5px] font-semibold text-[var(--color-ink-700)] hover:bg-[var(--color-canvas-deep)] disabled:opacity-60"
				>
					<Plus size={12} /> Add size row
				</button>

				<div>
					<label htmlFor="size-chart-fit-advice" className={labelClass}>
						Fit advice
					</label>
					<textarea
						id="size-chart-fit-advice"
						value={form.fitAdvice}
						onChange={(event) => setForm((prev) => ({ ...prev, fitAdvice: event.target.value }))}
						placeholder="e.g. Relaxed fit through the bust; size down for a tailored silhouette."
						maxLength={ADVICE_MAX}
						rows={2}
						className={fieldClass}
					/>
				</div>
				<div>
					<label htmlFor="size-chart-notes" className={labelClass}>
						Notes
					</label>
					<textarea
						id="size-chart-notes"
						value={form.notes}
						onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
						placeholder="e.g. Measurements are body measurements, not garment. Allow 1–2 inches ease."
						maxLength={ADVICE_MAX}
						rows={2}
						className={fieldClass}
					/>
				</div>

				<label className="flex items-center gap-2 text-[13px] text-[var(--color-ink-700)]">
					<Toggle checked={form.isActive} onCheckedChange={(checked) => setForm((prev) => ({ ...prev, isActive: checked }))} />
					Active (available to assign to products)
				</label>
			</form>
		</Drawer>
	);
}
