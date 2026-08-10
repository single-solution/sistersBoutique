import type { Metadata } from "next";
import Link from "next/link";

import { PHONE_TAIL_LENGTH } from "@store/shared";

import { AccountSetup } from "@/app/account/_components/AccountSetup";
import { Card } from "@/components/ui/Card";
import { findInvitableRequestByToken } from "@/lib/server/membershipSetup";
import { STOREFRONT_SHELL_CLASS } from "@/lib/layout/storefrontShell";

export const metadata: Metadata = {
	title: "Set up your account",
	robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AccountSetupPage({ params }: { params: Promise<{ token: string }> }) {
	const { token } = await params;
	const invitation = await findInvitableRequestByToken(token);

	return (
		<div className={`storefront-page-center ${STOREFRONT_SHELL_CLASS} w-full`}>
			<div className="w-full max-w-md">
				{invitation ? (
					<>
						<div className="reveal text-center">
							<p className="text-sm font-medium text-[var(--color-accent-deep)]">Premium membership</p>
							<h1 className="font-display mt-4 text-5xl font-normal leading-none tracking-normal text-[var(--color-ink-900)]">Set your password</h1>
						</div>
						<Card className="reveal mt-6 p-5 md:mt-8 md:p-6">
							<AccountSetup token={token} name={invitation.name} phoneMask={`••• ${invitation.phoneNumber.slice(-PHONE_TAIL_LENGTH)}`} />
						</Card>
					</>
				) : (
					<Card className="reveal p-6 text-center">
						<h1 className="font-display text-3xl font-normal text-[var(--color-ink-900)]">Link expired</h1>
						<p className="mx-auto mt-3 max-w-prose text-[13px] text-[var(--color-ink-500)]">
							This setup link is invalid or has already been used. Message us on WhatsApp to receive a fresh link.
						</p>
						<Link href="/account/sign-in" className="tap mt-5 inline-block font-semibold text-[var(--color-accent-700)] hover:text-[var(--color-accent-800)]">
							Go to sign in
						</Link>
					</Card>
				)}
			</div>
		</div>
	);
}
