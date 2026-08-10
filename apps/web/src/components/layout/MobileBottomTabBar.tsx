"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ShoppingBag, ShoppingCart, User } from "lucide-react";
import { buildWhatsAppLink, classNames, isValidWhatsappNumber, normalizeWhatsappNumber } from "@store/shared";
import { WhatsAppIcon } from "@/components/ui/SocialIcons";
import { useIsSignedIn } from "@/lib/auth/useIsSignedIn";
import { useCart } from "@/lib/cart/useCart";
import { useStoreSettings } from "@/lib/core/storeSettingsContext";
import { usePrefetchOnIntent } from "@/lib/navigation/usePrefetchOnIntent";
import { buildCurrentWhatsAppPageLink } from "@/lib/support/whatsappPageLink";

interface Tab {
	id: string;
	matchBase: string;
	href?: string;
	label: string;
	icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
	matchPaths: string[];
	showCartBadge?: boolean;
	kind?: "link" | "message";
}

const TABS: Tab[] = [
	{ id: "home", matchBase: "/", label: "Home", icon: Home, matchPaths: ["/"] },
	{ id: "shop", matchBase: "/shop", label: "Shop", icon: ShoppingBag, matchPaths: ["/shop"] },
	{
		id: "message",
		matchBase: "message",
		label: "WhatsApp",
		icon: WhatsAppIcon,
		matchPaths: [],
		kind: "message",
	},
	{ id: "cart", matchBase: "/cart", label: "Cart", icon: ShoppingCart, matchPaths: ["/cart"], showCartBadge: true },
	{ id: "account", matchBase: "/account", label: "Account", icon: User, matchPaths: ["/account"] },
];

export function MobileBottomTabBar() {
	const pathname = usePathname() ?? "/";
	const { itemCount } = useCart();
	const showSignIn = useIsSignedIn() === false;

	function resolveTab(tab: Tab): { href: string; label: string } {
		if (tab.matchBase === "/account" && showSignIn) {
			return { href: "/account/sign-in", label: "Sign in" };
		}
		return { href: tab.href ?? tab.matchBase, label: tab.label };
	}

	return (
		<nav
			aria-label="Primary"
			className="fixed inset-x-3 z-30 overflow-visible rounded-full border border-[var(--color-ink-100)] bg-[var(--color-canvas)] shadow-[var(--shadow-lg)] md:hidden"
			style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 4px)" }}
		>
			<ul className="grid grid-cols-5" style={{ height: "var(--mobile-tabbar-h)" }}>
				{TABS.map((tab) => {
					const resolved = resolveTab(tab);
					if (tab.kind === "message") {
						return (
							<li key={tab.id} className="relative flex items-center justify-center p-1.5">
								<TabMessageItem />
							</li>
						);
					}
					return (
						<li key={tab.id} className="flex p-1.5">
							<TabLinkItem tab={tab} href={resolved.href} label={resolved.label} pathname={pathname} badgeCount={tab.showCartBadge ? itemCount : 0} />
						</li>
					);
				})}
			</ul>
		</nav>
	);
}

function isLinkActive(matchBase: string, matchPaths: string[], pathname: string): boolean {
	if (matchBase === "/") {
		return pathname === "/";
	}
	if (matchPaths.includes(pathname)) {
		return true;
	}
	if (pathname.startsWith(matchBase)) {
		return true;
	}
	return false;
}

interface TabLinkItemProps {
	tab: Tab;
	href: string;
	label: string;
	pathname: string;
	badgeCount: number;
}

function TabLinkItem({ tab, href, label, pathname, badgeCount }: TabLinkItemProps) {
	const isActive = isLinkActive(tab.matchBase, tab.matchPaths, pathname);
	const Icon = tab.icon;
	const prefetchHandlers = usePrefetchOnIntent(isActive ? null : href);
	return (
		<Link
			href={href}
			className={classNames(
				"tap focus-ring-inset flex w-full flex-col items-center justify-center gap-0.5 rounded-full text-[11px] transition-colors",
				isActive ? "bg-[var(--color-accent-100)] font-semibold text-[var(--color-accent-800)]" : "font-medium text-[var(--color-ink-500)] active:text-[var(--color-ink-800)]",
			)}
			aria-current={isActive ? "page" : undefined}
			onPointerDown={prefetchHandlers.onPointerDown}
			onTouchStart={prefetchHandlers.onTouchStart}
			onFocus={prefetchHandlers.onFocus}
		>
			<span className="relative">
				<Icon size={20} strokeWidth={isActive ? 2.4 : 2} />
				{badgeCount > 0 && (
					<span
						key={badgeCount}
						className="animate-badge-pop absolute -right-2 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-[var(--color-accent-500)] px-1 text-[10px] font-bold text-[var(--color-accent-50)]"
					>
						{badgeCount > 9 ? "9+" : badgeCount}
					</span>
				)}
			</span>
			<span className="leading-none">{label}</span>
		</Link>
	);
}

function TabMessageItem() {
	const { siteName, whatsappNumber } = useStoreSettings();
	const whatsappDigits = normalizeWhatsappNumber(whatsappNumber);
	const whatsappHref = isValidWhatsappNumber(whatsappDigits) ? buildWhatsAppLink(`Salam! I have a question about ${siteName}.`, whatsappDigits) : undefined;

	function applyCurrentPageContext(event: { currentTarget: HTMLAnchorElement }) {
		if (!whatsappHref) {
			return;
		}

		event.currentTarget.href = buildCurrentWhatsAppPageLink(whatsappDigits, siteName);
	}

	return (
		<a
			href={whatsappHref}
			target={whatsappHref ? "_blank" : undefined}
			rel={whatsappHref ? "noopener noreferrer" : undefined}
			className="tap focus-ring group relative flex h-full w-full items-center justify-center"
			aria-label={whatsappHref ? "WhatsApp Us!" : "WhatsApp support is unavailable"}
			aria-disabled={whatsappHref ? undefined : true}
			onClick={applyCurrentPageContext}
			onFocus={applyCurrentPageContext}
			onPointerDown={applyCurrentPageContext}
			onTouchStart={applyCurrentPageContext}
		>
			<span className="relative grid size-14 -translate-y-[var(--mobile-tabbar-fab-lift)] place-items-center rounded-[var(--radius-full)] bg-[var(--color-whatsapp)] text-[var(--color-on-dark)] shadow-[var(--shadow-md)] transition-[transform,box-shadow] duration-300 active:scale-[0.97]">
				<span className="grid size-10 place-items-center rounded-full bg-[var(--color-on-dark-20)] transition-transform group-active:scale-105">
					<WhatsAppIcon size={19} aria-hidden />
				</span>
			</span>
			<span className="absolute bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px] font-semibold leading-none text-[var(--color-ink-600)]">WhatsApp</span>
		</a>
	);
}
