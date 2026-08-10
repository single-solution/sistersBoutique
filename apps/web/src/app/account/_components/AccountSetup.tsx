"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { Button } from "@store/ui";

import { Input } from "@/components/ui/Input";
import { setSignedIn } from "@/lib/auth/useIsSignedIn";
import { useNavigationTransition } from "@/lib/navigation/navigationProgress";

const MIN_PASSWORD_CHARS = 8;

export interface AccountSetupProps {
	token: string;
	/** Masked tail of the phone the account is keyed to, e.g. "••• 2403". */
	phoneMask: string;
	name: string;
}

export function AccountSetup({ token, phoneMask, name }: AccountSetupProps) {
	const router = useRouter();
	const { startNavigation } = useNavigationTransition();
	const [password, setPassword] = useState("");
	const [confirm, setConfirm] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (isSubmitting) {
			return;
		}
		if (password.length < MIN_PASSWORD_CHARS || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
			setError("Password must be at least 8 characters and include a letter and a number.");
			return;
		}
		if (password !== confirm) {
			setError("Passwords do not match.");
			return;
		}
		setIsSubmitting(true);
		setError(null);
		try {
			const response = await fetch("/api/account/setup", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ token, password }),
			});
			const data = (await response.json().catch(() => ({}))) as { phoneNumber?: string; error?: string };
			if (!response.ok || !data.phoneNumber) {
				setError(data.error ?? "Could not set your password. Please try again.");
				setIsSubmitting(false);
				return;
			}
			const result = await signIn("customer-password", { redirect: false, phoneNumber: data.phoneNumber, password });
			if (result?.error) {
				// Account is set — just send them to sign in manually.
				startNavigation(() => router.push(`/account/sign-in?phone=${encodeURIComponent(data.phoneNumber ?? "")}`));
				return;
			}
			setSignedIn(true);
			startNavigation(() => {
				router.push("/account");
				router.refresh();
			});
		} catch {
			setError("Network error. Please try again.");
			setIsSubmitting(false);
		}
	}

	return (
		<form onSubmit={handleSubmit} className="reveal-stagger space-y-4">
			<p className="reveal text-[13px] text-[var(--color-ink-600)]">
				Welcome{name ? `, ${name}` : ""}. Set a password for <span className="font-semibold text-[var(--color-ink-900)]">{phoneMask}</span> to activate your membership.
			</p>
			<div className="reveal">
				<Input
					label="New password"
					type="password"
					value={password}
					onChange={(event) => setPassword(event.target.value)}
					placeholder="At least 8 characters"
					icon={<LockKeyhole size={14} />}
					autoComplete="new-password"
					disabled={isSubmitting}
				/>
			</div>
			<div className="reveal">
				<Input
					label="Confirm password"
					type="password"
					value={confirm}
					onChange={(event) => setConfirm(event.target.value)}
					placeholder="Re-enter password"
					icon={<LockKeyhole size={14} />}
					autoComplete="new-password"
					error={error}
					disabled={isSubmitting}
				/>
			</div>
			<div className="reveal">
				<Button type="submit" variant="primary" size="md" className="w-full" isLoading={isSubmitting} trailingIcon={<ArrowRight size={14} />} disabled={isSubmitting}>
					Activate membership
				</Button>
			</div>
		</form>
	);
}
