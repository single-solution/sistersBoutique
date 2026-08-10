import Link from "next/link";

import type { StoreSettings } from "@store/shared";

interface FooterProps {
	settings: StoreSettings;
	catalogHomeHref: string;
}

/**
 * Server-rendered site footer. Receives `settings` as a prop (rather than
 * reading `useStoreSettings()`) so it can render on the server and stay out
 * of the client bundle — it is injected as a slot by the client chrome.
 */
export function Footer({ settings, catalogHomeHref }: FooterProps) {
	return (
		<footer className="cv-auto mx-auto flex w-[calc(100%-2rem)] max-w-[82rem] flex-col items-center gap-3 py-12 text-center text-sm text-[var(--color-ink-500)] md:flex-row md:items-center md:justify-between md:gap-6 md:py-14 md:text-left">
			<div className="flex flex-col items-center gap-3 md:flex-row md:items-center md:gap-6">
				<Link href={catalogHomeHref} className="font-display text-3xl font-normal leading-none text-[var(--color-ink-900)]">
					{settings.siteName}
				</Link>
				<p className="max-w-sm">{settings.siteTagline}</p>
			</div>
			<div className="flex items-center justify-center gap-2 whitespace-nowrap text-[10px] text-[var(--color-ink-500)] sm:text-[11px] md:justify-end md:text-right">
				<span>
					© {new Date().getFullYear()} {settings.siteName}
				</span>
				<span aria-hidden>·</span>
				<span>
					Developed by{" "}
					<a
						href="https://github.com/single-solution"
						target="_blank"
						rel="noopener noreferrer"
						className="text-[var(--color-ink-700)] transition-colors hover:text-[var(--color-accent-deep)]"
					>
						Single-solution
					</a>
				</span>
			</div>
		</footer>
	);
}
