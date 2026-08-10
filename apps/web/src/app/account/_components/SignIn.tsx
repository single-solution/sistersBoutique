"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { buildWhatsAppLink } from "@store/shared";
import { Card } from "@/components/ui/Card";
import { MemberSignIn } from "@/app/account/_components/MemberSignIn";
import { RequestMembership } from "@/app/account/_components/RequestMembership";
import { useStoreSettings } from "@/lib/core/storeSettingsContext";
import { useNavigationTransition } from "@/lib/navigation/navigationProgress";
import { STOREFRONT_SHELL_CLASS } from "@/lib/layout/storefrontShell";

export function SignIn() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const { siteName, whatsappNumber } = useStoreSettings();
	const { startNavigation } = useNavigationTransition();
	const requestedNext = searchParams?.get("next");
	const next = requestedNext && requestedNext.startsWith("/") && !requestedNext.startsWith("//") ? requestedNext : "/account";
	const [mode, setMode] = useState<"signin" | "request">("signin");
	const initialPhone = searchParams?.get("phone") ?? "";

	function handleSignedIn() {
		startNavigation(() => {
			router.push(next);
			router.refresh();
		});
	}

	const forgotHref = whatsappNumber ? buildWhatsAppLink("Salam! I forgot my member password — can you send me a reset link?", whatsappNumber) : null;

	return (
		<div className={`storefront-page-center ${STOREFRONT_SHELL_CLASS} w-full`}>
			<div className="w-full max-w-md">
				<div className="reveal text-center">
					<p className="text-sm font-medium text-[var(--color-accent-deep)]">Your boutique account</p>
					<h1 className="font-display mt-4 text-5xl font-normal leading-none tracking-normal text-[var(--color-ink-900)]">
						{mode === "signin" ? `Sign in to ${siteName}` : "Become a member"}
					</h1>
					<p className="mx-auto mt-3 max-w-prose text-[13px] text-[var(--color-ink-500)] md:text-sm">
						{mode === "signin"
							? "Members sign in with their phone number and password. You don't need an account to shop or check out."
							: "Members get exclusive pricing. Send a request and our team will set up your account on WhatsApp."}
					</p>
				</div>

				<Card className="reveal mt-6 p-5 md:mt-8 md:p-6">
					{mode === "signin" ? (
						<MemberSignIn onSignedIn={handleSignedIn} initialPhone={initialPhone} autoFocusPhone />
					) : (
						<RequestMembership />
					)}
				</Card>

				<div className="reveal mt-4 space-y-2 text-center text-[12.5px] text-[var(--color-ink-500)]">
					{mode === "signin" ? (
						<>
							<p>
								Not a member yet?{" "}
								<button type="button" onClick={() => setMode("request")} className="tap font-semibold text-[var(--color-accent-700)] hover:text-[var(--color-accent-800)]">
									Request membership
								</button>
							</p>
							{forgotHref ? (
								<a
									href={forgotHref}
									target="_blank"
									rel="noopener noreferrer"
									className="tap inline-flex items-center gap-1.5 font-semibold text-[var(--color-ink-600)] hover:text-[var(--color-ink-900)]"
								>
									<MessageCircle size={13} />
									Forgot password? Message us
								</a>
							) : null}
						</>
					) : (
						<p>
							Already a member?{" "}
							<button type="button" onClick={() => setMode("signin")} className="tap font-semibold text-[var(--color-accent-700)] hover:text-[var(--color-accent-800)]">
								Sign in
							</button>
						</p>
					)}
				</div>
			</div>
		</div>
	);
}
