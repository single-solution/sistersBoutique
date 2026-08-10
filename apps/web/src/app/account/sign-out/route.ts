import { signOut } from "@/lib/auth";

/**
 * Server-side sign-out endpoint.
 *
 * Two callers:
 *   - The explicit "Sign out" button (passes `?to=/`).
 *   - Account pages whose JWT is valid but whose `Customer` is gone — they
 *     can't clear the cookie during render, so they redirect here to avoid a
 *     loop with the middleware.
 */
export async function GET(request: Request) {
	const requested = new URL(request.url).searchParams.get("to");
	// `to` is user-controlled — only honour same-origin paths.
	const redirectTo = requested && requested.startsWith("/") && !requested.startsWith("//") ? requested : "/account/sign-in";

	await signOut({ redirectTo });
}
