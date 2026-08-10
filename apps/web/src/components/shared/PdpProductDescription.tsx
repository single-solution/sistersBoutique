"use client";

/**
 * PDP description card — sits under the product title. Tall copy scrolls
 * inside the card so the configurator stays reachable.
 */

import { useMemo } from "react";

import { classNames, isRichHtmlEmpty, sanitizeRichHtml } from "@store/shared";

interface PdpProductDescriptionProps {
	html?: string | null;
	className?: string;
}

export function PdpProductDescription({ html, className }: PdpProductDescriptionProps) {
	const safeHtml = useMemo(() => (html && !isRichHtmlEmpty(html) ? sanitizeRichHtml(html) : ""), [html]);

	if (!safeHtml) {
		return null;
	}

	return (
		<section
			aria-label="Product description"
			className={classNames(
				"shrink-0 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-ink-100)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)]",
				className,
			)}
		>
			<div
				className={classNames(
					"max-h-40 overflow-y-auto px-3 py-2.5 text-[13px] leading-relaxed text-[var(--color-ink-700)] md:max-h-52 md:px-4 md:py-3 md:text-[14px]",
					"[&_a]:text-[var(--color-accent-700)] [&_a]:underline [&_blockquote]:my-2 [&_blockquote]:border-l-2 [&_blockquote]:border-[var(--color-ink-200)] [&_blockquote]:pl-3 [&_blockquote]:italic",
					"[&_h2]:mb-1.5 [&_h2]:text-[14px] [&_h2]:font-semibold [&_h2]:text-[var(--color-ink-900)] md:[&_h2]:text-[15px]",
					"[&_h3]:mb-1 [&_h3]:text-[13px] [&_h3]:font-semibold [&_h3]:text-[var(--color-ink-900)]",
					"[&_li]:my-0.5 [&_ol]:my-1.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-1.5 [&_ul]:my-1.5 [&_ul]:list-disc [&_ul]:pl-5",
				)}
				dangerouslySetInnerHTML={{ __html: safeHtml }}
			/>
		</section>
	);
}
