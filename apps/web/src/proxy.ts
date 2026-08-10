import NextAuth from "next-auth";
import { authConfig } from "@/lib/authConfig";

/**
 * Edge proxy for the storefront.
 *
 * Renamed from `middleware.ts` in Next 16 (the old name is now deprecated).
 * Same matcher, same Auth.js integration — only the filename changed.
 */
const { auth } = NextAuth(authConfig);

// Named export required by Next 16 proxy convention; `export default auth` breaks
// Turbopack route discovery in dev (non-root app + API routes 404 until restart).
export const proxy = auth;

export const config = {
	matcher: ["/((?!api|_next/static|_next/image|favicon\\.ico|manifest\\.json|sw\\.js|.*\\.(?:png|jpg|jpeg|svg|gif|webp|ico|js|woff2?|ttf)).*)"],
};
