"use client";

import type { ResolvedSeoMeta } from "@store/shared";

const TITLE_MAXIMUM_LENGTH = 60;
const DESCRIPTION_MAXIMUM_LENGTH = 160;

function truncate(text: string, maximumLength: number): string {
	if (text.length <= maximumLength) return text;
	return `${text.slice(0, maximumLength - 1).trimEnd()}…`;
}

function breadcrumbFromCanonical(canonical: string, siteUrl: string): string {
	try {
		const url = new URL(canonical);
		const host = url.hostname.replace(/^www\./, "");
		const segments = url.pathname.split("/").filter(Boolean);
		const parts = [host, ...segments];
		return parts.join(" › ");
	} catch {
		try {
			const host = new URL(siteUrl).hostname.replace(/^www\./, "");
			return host;
		} catch {
			return "your-site.com";
		}
	}
}

interface SerpPreviewProps {
	resolved: ResolvedSeoMeta;
	siteUrl: string;
}

export function SerpPreview({ resolved, siteUrl }: SerpPreviewProps) {
	const breadcrumb = breadcrumbFromCanonical(resolved.canonical, siteUrl);
	const title = truncate(resolved.title, TITLE_MAXIMUM_LENGTH);
	const description = truncate(resolved.description, DESCRIPTION_MAXIMUM_LENGTH);

	return (
		<div className="rounded-[var(--radius-md)] border border-[var(--color-ink-100)] bg-[var(--color-surface)] p-4" aria-label="Google search preview">
			<p className="text-[11px] font-medium uppercase tracking-wide text-[var(--color-ink-500)]">Search preview</p>
			<div className="mt-3 font-[Arial,Helvetica,sans-serif]">
				<div className="flex items-center gap-2 text-sm leading-none text-[var(--color-serp-body)]">
					<span className="grid size-7 shrink-0 place-items-center rounded-full bg-[var(--color-canvas-deep)] text-[10px] font-semibold text-[var(--color-ink-600)]">G</span>
					<div className="min-w-0">
						<p className="truncate text-sm text-[var(--color-serp-body)]">{breadcrumb.split(" › ")[0]}</p>
						<p className="truncate text-xs text-[var(--color-serp-muted)]">{breadcrumb}</p>
					</div>
				</div>
				<p className="mt-1 text-xl leading-snug text-[var(--color-serp-title)] hover:underline">{title}</p>
				<p className="mt-0.5 text-sm leading-snug text-[var(--color-serp-muted)]">{description}</p>
			</div>
		</div>
	);
}
