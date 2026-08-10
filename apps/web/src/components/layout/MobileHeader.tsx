"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { BrandLockup } from "@/components/layout/BrandLockup";
import { classNames } from "@store/shared";
import { useStoreSettings } from "@/lib/core/storeSettingsContext";

interface MobileHeaderProps {
	isFixedOverlayHeader: boolean;
	onOpenSearch: () => void;
}

export function MobileHeader({ isFixedOverlayHeader, onOpenSearch }: MobileHeaderProps) {
	const [isScrolled, setIsScrolled] = useState(false);
	const { siteName, brandLogoLight, brandLogoDark } = useStoreSettings();

	// Mirror the desktop header's frosted-on-scroll behaviour so the
	// mobile header dissolves into the hero gradient at the top of the
	// page and only firms up once content scrolls underneath it. Passive
	// listener so the scroll thread stays cheap.
	useEffect(() => {
		const handleScroll = () => {
			setIsScrolled(window.scrollY > 4);
		};
		handleScroll();
		window.addEventListener("scroll", handleScroll, { passive: true });
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	return (
		<header
			data-scrolled={isScrolled ? "true" : "false"}
			/* `.scroll-header` (in globals.css) supplies the real
         `backdrop-filter` frosted-glass background. At the top of the
         page the header is near-transparent so the hero gradient shows
         through; on scroll it picks up a stronger tint and shadow. */
			className={classNames("scroll-header top-0 z-[var(--z-sticky)] safe-top md:hidden", isFixedOverlayHeader ? "fixed inset-x-0" : "sticky")}
			style={{ height: "var(--mobile-header-h)" }}
		>
			<div className="flex h-full items-center gap-2 px-3">
				<BrandLockup href="/" siteName={siteName} logoUrl={brandLogoLight || brandLogoDark} tone="light" size="sm" />

				<button
					type="button"
					onClick={onOpenSearch}
					aria-label="Search products"
					className="tap focus-ring ml-auto inline-flex h-9 shrink-0 items-center gap-1.5 rounded-[var(--radius-md)] px-3 text-[13px] font-medium text-[var(--color-ink-800)]"
				>
					<Search size={14} />
					<span>Search</span>
				</button>
			</div>
		</header>
	);
}
