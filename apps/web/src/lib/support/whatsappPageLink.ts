import { buildWhatsAppLink } from "@store/shared";

const COLLECTION_ROUTE_SEGMENTS = new Set(["attributes"]);
const RESERVED_ROUTE_SEGMENTS = new Set(["account", "attributes", "cart", "checkout", "concepts", "shop"]);

interface WhatsAppPageContext {
	currentUrl: URL;
	pageHeading: string;
	pageTitle: string;
	siteName: string;
}

export function buildWhatsAppPageMessage({ currentUrl, pageHeading, pageTitle, siteName }: WhatsAppPageContext): string {
	const pathname = currentUrl.pathname;
	const routeSegments = pathname.split("/").filter(Boolean);
	const primaryRoute = routeSegments[0] ?? "";
	const title = pageHeading.trim() || pageTitle.split(" · ")[0]?.split(" | ")[0]?.trim() || siteName;
	const pageUrl = currentUrl.toString();

	if (currentUrl.searchParams.has("q")) {
		return `Salam! I need help with these search results: ${title}.\n${pageUrl}`;
	}
	if (pathname === "/") {
		return `Salam! I have a question about ${siteName}.\n${pageUrl}`;
	}
	if (pathname === "/cart") {
		return `Salam! I need help with the items in my bag.\n${pageUrl}`;
	}
	if (pathname === "/checkout/success") {
		return `Salam! I need help with my recent order.\n${pageUrl}`;
	}
	if (pathname === "/checkout") {
		return `Salam! I need help with checkout.\n${pageUrl}`;
	}
	if (pathname.startsWith("/account/orders/")) {
		return `Salam! I need help with this order.\n${pageUrl}`;
	}
	if (pathname.startsWith("/account")) {
		return `Salam! I need help with my account.\n${pageUrl}`;
	}
	if (pathname === "/shop") {
		return `Salam! I need help choosing from ${title}.\n${pageUrl}`;
	}
	if (COLLECTION_ROUTE_SEGMENTS.has(primaryRoute)) {
		return `Salam! I need help choosing from ${title}.\n${pageUrl}`;
	}
	if (routeSegments.length === 2 && !RESERVED_ROUTE_SEGMENTS.has(primaryRoute)) {
		return `Salam! I'm interested in ${title}.\n${pageUrl}`;
	}
	if (routeSegments.length === 1 && !RESERVED_ROUTE_SEGMENTS.has(primaryRoute)) {
		return `Salam! I need help choosing from ${title}.\n${pageUrl}`;
	}

	return `Salam! I have a question about ${title}.\n${pageUrl}`;
}

export function buildCurrentWhatsAppPageLink(whatsappNumber: string, siteName: string): string {
	const message = buildWhatsAppPageMessage({
		currentUrl: new URL(window.location.href),
		pageHeading: document.querySelector("h1")?.textContent?.trim() ?? "", pageTitle: document.title,
		siteName,
	});

	return buildWhatsAppLink(message, whatsappNumber);
}
