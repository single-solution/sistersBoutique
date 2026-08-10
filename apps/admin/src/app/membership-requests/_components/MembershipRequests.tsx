"use client";

import { useState } from "react";
import { Check, Copy, LinkIcon, Sparkles, X } from "lucide-react";
import type { MembershipRequestStatus } from "@store/db";

import { apiFetch } from "@/lib/api";
import { useAdminPermissions } from "@/lib/permissionsContext";

export interface MembershipRequestView {
	id: string;
	name: string;
	phoneNumber: string;
	status: MembershipRequestStatus;
	note?: string;
	createdAt: string;
	invitedAt?: string;
	completedAt?: string;
	linkExpiresAt?: string;
}

const STATUS_LABELS: Record<MembershipRequestStatus, string> = {
	pending: "Pending",
	invited: "Invited",
	completed: "Member",
	declined: "Declined",
	expired: "Expired",
};

const STATUS_CLASSES: Record<MembershipRequestStatus, string> = {
	pending: "bg-[var(--color-warning-100)] text-[var(--color-warning-800)]",
	invited: "bg-[var(--color-accent-100)] text-[var(--color-accent-800)]",
	completed: "bg-[var(--color-success-100)] text-[var(--color-success-800)]",
	declined: "bg-[var(--color-ink-100)] text-[var(--color-ink-600)]",
	expired: "bg-[var(--color-ink-100)] text-[var(--color-ink-600)]",
};

function formatDate(iso: string): string {
	return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export function MembershipRequests({ initial }: { initial: MembershipRequestView[] }) {
	const { can } = useAdminPermissions();
	const canManage = can("customer_update");
	const [requests, setRequests] = useState(initial);
	const [links, setLinks] = useState<Record<string, string>>({});
	const [copiedId, setCopiedId] = useState<string | null>(null);
	const [busyId, setBusyId] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

	async function issueLink(id: string) {
		setBusyId(id);
		setError(null);
		try {
			const result = await apiFetch<{ link: string; expiresAt: string }>(`/api/membership-requests/${id}/setup-link`, { method: "POST" });
			setLinks((prev) => ({ ...prev, [id]: result.link }));
			setRequests((prev) => prev.map((request) => (request.id === id ? { ...request, status: "invited", linkExpiresAt: result.expiresAt } : request)));
		} catch (caught) {
			setError(caught instanceof Error ? caught.message : "Could not generate the setup link.");
		} finally {
			setBusyId(null);
		}
	}

	async function setStatus(id: string, action: "decline" | "reopen") {
		setBusyId(id);
		setError(null);
		try {
			const result = await apiFetch<{ status: MembershipRequestStatus }>(`/api/membership-requests/${id}`, { method: "PATCH", json: { action } });
			setRequests((prev) => prev.map((request) => (request.id === id ? { ...request, status: result.status } : request)));
		} catch (caught) {
			setError(caught instanceof Error ? caught.message : "Could not update the request.");
		} finally {
			setBusyId(null);
		}
	}

	async function copyLink(id: string) {
		const link = links[id];
		if (!link) {
			return;
		}
		try {
			await navigator.clipboard.writeText(link);
			setCopiedId(id);
			window.setTimeout(() => setCopiedId((current) => (current === id ? null : current)), 2_000);
		} catch {
			setError("Could not copy. Select and copy the link manually.");
		}
	}

	return (
		<div className="flex min-h-0 flex-1 flex-col gap-4">
			<header className="flex items-center gap-2">
				<Sparkles size={18} className="text-[var(--color-accent-700)]" />
				<div>
					<h1 className="text-lg font-semibold text-[var(--color-ink-900)]">Membership requests</h1>
					<p className="text-[13px] text-[var(--color-ink-500)]">Generate a setup link and send it to the customer on WhatsApp. Links expire after 7 days.</p>
				</div>
			</header>

			{error ? <p className="rounded-[var(--radius-md)] bg-[var(--color-danger-100)] px-3 py-2 text-[13px] text-[var(--color-danger-800)]">{error}</p> : null}

			{requests.length === 0 ? (
				<p className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-ink-200)] px-4 py-10 text-center text-[13px] text-[var(--color-ink-500)]">
					No membership requests yet.
				</p>
			) : (
				<ul className="space-y-2.5">
					{requests.map((request) => (
						<li key={request.id} className="rounded-[var(--radius-lg)] border border-[var(--color-ink-100)] bg-[var(--color-surface)] p-3.5 shadow-[var(--shadow-sm)]">
							<div className="flex flex-wrap items-start justify-between gap-3">
								<div className="min-w-0">
									<p className="flex items-center gap-2 font-semibold text-[var(--color-ink-900)]">
										{request.name}
										<span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_CLASSES[request.status]}`}>{STATUS_LABELS[request.status]}</span>
									</p>
									<p className="text-[13px] text-[var(--color-ink-600)]">{request.phoneNumber}</p>
									{request.note ? <p className="mt-1 text-[12.5px] text-[var(--color-ink-500)]">“{request.note}”</p> : null}
									<p className="mt-1 text-[12px] text-[var(--color-ink-400)]">Requested {formatDate(request.createdAt)}</p>
								</div>

								{canManage ? (
									<div className="flex shrink-0 items-center gap-2">
										{request.status !== "completed" && request.status !== "declined" ? (
											<>
												<button
													type="button"
													onClick={() => void issueLink(request.id)}
													disabled={busyId === request.id}
													className="tap inline-flex items-center gap-1.5 rounded-[var(--radius-md)] bg-[var(--color-accent-700)] px-3 py-1.5 text-[12.5px] font-semibold text-white hover:bg-[var(--color-accent-800)] disabled:opacity-60"
												>
													<LinkIcon size={13} />
													{request.status === "invited" ? "Regenerate link" : "Generate setup link"}
												</button>
												<button
													type="button"
													onClick={() => void setStatus(request.id, "decline")}
													disabled={busyId === request.id}
													className="tap inline-flex items-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--color-ink-200)] px-2.5 py-1.5 text-[12.5px] font-semibold text-[var(--color-ink-600)] hover:bg-[var(--color-canvas-deep)] disabled:opacity-60"
												>
													<X size={13} />
													Decline
												</button>
											</>
										) : request.status === "declined" ? (
											<button
												type="button"
												onClick={() => void setStatus(request.id, "reopen")}
												disabled={busyId === request.id}
												className="tap inline-flex items-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--color-ink-200)] px-2.5 py-1.5 text-[12.5px] font-semibold text-[var(--color-ink-600)] hover:bg-[var(--color-canvas-deep)] disabled:opacity-60"
											>
												Re-open
											</button>
										) : null}
									</div>
								) : null}
							</div>

							{links[request.id] ? (
								<div className="mt-3 flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-ink-100)] bg-[var(--color-canvas-deep)] p-2">
									<input readOnly value={links[request.id]} className="min-w-0 flex-1 truncate bg-transparent px-1 text-[12.5px] text-[var(--color-ink-700)] focus:outline-none" />
									<button
										type="button"
										onClick={() => void copyLink(request.id)}
										className="tap inline-flex shrink-0 items-center gap-1.5 rounded-[var(--radius-sm)] bg-[var(--color-ink-900)] px-2.5 py-1.5 text-[12px] font-semibold text-white"
									>
										{copiedId === request.id ? <Check size={13} /> : <Copy size={13} />}
										{copiedId === request.id ? "Copied" : "Copy"}
									</button>
								</div>
							) : null}
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
