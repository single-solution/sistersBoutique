"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { classNames } from "@store/shared";
import { Search, ShoppingBag, User } from "lucide-react";
import { BrandLockup } from "@/components/layout/BrandLockup";
import { CartDropdown } from "@/app/cart/_components/CartDropdown";
import { useCart } from "@/lib/cart/useCart";
import { usePrefetchOnIntent } from "@/lib/navigation/usePrefetchOnIntent";
import { useIsSignedIn } from "@/lib/auth/useIsSignedIn";
import { useStoreSettings } from "@/lib/core/storeSettingsContext";
import { useShopHref } from "@/lib/core/storefrontReferenceContext";

function isNavActive(matchBase: string, pathname: string): boolean {
	if (matchBase === "/") {
		return pathname === "/";
	}
	return pathname === matchBase || pathname.startsWith(`${matchBase}/`);
}

interface HeaderProps {
	isFixedOverlayHeader: boolean;
	onOpenSearch: () => void;
}

export function Header({ isFixedOverlayHeader, onOpenSearch }: HeaderProps) {
	const [isScrolled, setIsScrolled] = useState(false);
	const [isCartOpen, setIsCartOpen] = useState(false);
	const cart = useCart();
	const pathname = usePathname() ?? "/";
	const { siteName, brandLogoLight, brandLogoDark } = useStoreSettings();
	const shopHref = useShopHref();
	const navigationLinks = [
		{ href: "/", label: "Home" },
		{ href: shopHref, label: "Shop" },
	];

	useEffect(() => {
		const handleScroll = () => {
			setIsScrolled(window.scrollY > 4);
		};
		handleScroll();
		window.addEventListener("scroll", handleScroll, { passive: true });
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	// Close the cart whenever the visitor navigates. Navigation-driven UI
	// reset; `useEffectEvent` is still experimental in React 19.
	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect -- navigation-driven UI reset
		setIsCartOpen(false);
	}, [pathname]);

	return (
		<header
			data-scrolled={isScrolled ? "true" : "false"}
			/* `.scroll-header` (in globals.css) owns the frosted-glass look:
           real `backdrop-filter` + a near-transparent canvas tint at the
           top of the page so the header dissolves into the hero gradient,
           then a stronger 20px / 160%-saturation blur once content scrolls
           under it. */
			className={classNames("scroll-header top-0 z-[var(--z-sticky)] hidden md:block", isFixedOverlayHeader ? "fixed inset-x-0" : "sticky")}
		>
			<div className="mx-auto grid h-16 max-w-[var(--content-max)] grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-4 px-4 sm:px-6 lg:px-8">
				<nav className="flex items-center justify-self-start gap-1">
					{navigationLinks.map((navLink) => {
						const isActive = isNavActive(navLink.href, pathname);
						return <HeaderNavLink key={navLink.label} href={navLink.href} label={navLink.label} isActive={isActive} />;
					})}
				</nav>

				<div className="justify-self-center">
					<BrandLockup href="/" siteName={siteName} logoUrl={brandLogoLight || brandLogoDark} tone="light" size="md" />
				</div>

				<div className="flex items-center justify-self-end gap-2">
					<button
						type="button"
						onClick={onOpenSearch}
						aria-label="Search products"
						className="tap inline-flex h-10 items-center gap-1.5 rounded-[var(--radius-md)] border border-transparent px-3.5 text-sm font-medium text-[var(--color-ink-800)] transition-colors hover:border-[var(--color-ink-200)] hover:text-[var(--color-ink-900)] focus-visible:border-[var(--color-ink-200)] focus-visible:text-[var(--color-ink-900)] focus-visible:outline-none"
					>
						<Search size={15} />
						<span>Search</span>
					</button>
					<HeaderAccountLink isActive={pathname.startsWith("/account")} />
					<button
						type="button"
						onClick={() => setIsCartOpen((previous) => !previous)}
						aria-label="Cart"
						aria-haspopup="dialog"
						aria-expanded={isCartOpen}
						className={classNames(
							"tap relative z-[2] inline-flex h-10 items-center gap-1.5 rounded-[var(--radius-md)] border px-3.5 text-sm font-medium transition-colors focus-visible:outline-none",
							isCartOpen
								? "border-[var(--color-accent-500)] bg-[var(--color-accent-50)] text-[var(--color-accent-800)] shadow-[var(--shadow-sm)]"
								: "border-transparent text-[var(--color-ink-800)] hover:border-[var(--color-ink-200)] hover:text-[var(--color-ink-900)] focus-visible:border-[var(--color-ink-200)] focus-visible:text-[var(--color-ink-900)]",
						)}
					>
						<ShoppingBag size={15} />
						<span>Bag</span>
						{cart.itemCount > 0 && (
							<span
								key={cart.itemCount}
								className="animate-badge-pop ml-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-[var(--color-accent-500)] px-1 text-[11px] font-semibold text-[var(--color-accent-50)]"
							>
								{cart.itemCount}
							</span>
						)}
					</button>
				</div>
			</div>

			<CartDropdown open={isCartOpen} onClose={() => setIsCartOpen(false)} />
		</header>
	);
}

interface HeaderNavLinkProps {
	href: string;
	label: string;
	isActive: boolean;
}

function HeaderNavLink({ href, label, isActive }: HeaderNavLinkProps) {
	const prefetchHandlers = usePrefetchOnIntent(isActive ? null : href);
	return (
		<Link
			href={href}
			aria-current={isActive ? "page" : undefined}
			onPointerDown={prefetchHandlers.onPointerDown}
			onTouchStart={prefetchHandlers.onTouchStart}
			onFocus={prefetchHandlers.onFocus}
			className={classNames(
				"tap rounded-[var(--radius-md)] px-3 py-2 text-sm transition-colors",
				isActive ? "font-semibold text-[var(--color-accent-800)]" : "font-medium text-[var(--color-ink-600)] hover:text-[var(--color-ink-900)]",
			)}
		>
			{label}
		</Link>
	);
}

function HeaderAccountLink({ isActive }: { isActive: boolean }) {
	const signedIn = useIsSignedIn();
	// Until the check resolves (null), keep the neutral "Account" label that
	// matches the server render — only show "Sign in" once we know there's no
	// session, so there's no hydration mismatch.
	const showSignIn = signedIn === false;
	const href = showSignIn ? "/account/sign-in" : "/account";
	const label = showSignIn ? "Sign in" : "Account";
	const prefetchHandlers = usePrefetchOnIntent(href);
	return (
		<Link
			href={href}
			aria-label={label}
			onPointerDown={prefetchHandlers.onPointerDown}
			onTouchStart={prefetchHandlers.onTouchStart}
			onFocus={prefetchHandlers.onFocus}
			className={classNames(
				"tap inline-flex h-10 items-center gap-1.5 rounded-[var(--radius-md)] border px-3.5 text-sm font-medium transition-colors focus-visible:outline-none",
				isActive
					? "border-[var(--color-ink-200)] bg-[var(--color-surface)] text-[var(--color-ink-900)] shadow-[var(--shadow-sm)]"
					: "border-transparent text-[var(--color-ink-800)] hover:border-[var(--color-ink-200)] hover:text-[var(--color-ink-900)] focus-visible:border-[var(--color-ink-200)] focus-visible:text-[var(--color-ink-900)]",
			)}
		>
			<User size={15} />
			<span>{label}</span>
		</Link>
	);
}
