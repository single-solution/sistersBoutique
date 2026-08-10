"use client";

import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { ArrowRight, LockKeyhole, Phone as PhoneIcon } from "lucide-react";
import { Button } from "@store/ui";

import { Input } from "@/components/ui/Input";
import { setSignedIn } from "@/lib/auth/useIsSignedIn";
import { resolvePublicErrorMessage } from "@/lib/errors/publicErrorMessage";

export interface MemberSignInProps {
	onSignedIn: () => void;
	/** Prefill the phone field (used after completing account setup). */
	initialPhone?: string;
	autoFocusPhone?: boolean;
}

export function MemberSignIn({ onSignedIn, initialPhone = "", autoFocusPhone = false }: MemberSignInProps) {
	const [phone, setPhone] = useState(initialPhone);
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (isSubmitting) {
			return;
		}
		const trimmedPhone = phone.trim();
		if (!trimmedPhone || !password) {
			setError("Enter your phone number and password.");
			return;
		}
		setIsSubmitting(true);
		setError(null);
		try {
			const result = await signIn("customer-password", { redirect: false, phoneNumber: trimmedPhone, password });
			if (result?.error) {
				setError("Phone number or password is incorrect.");
				return;
			}
			setSignedIn(true);
			onSignedIn();
		} catch (caught) {
			setError(resolvePublicErrorMessage(caught));
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<form onSubmit={handleSubmit} className="reveal-stagger space-y-4">
			<div className="reveal">
				<Input
					label="Phone number"
					value={phone}
					onChange={(event) => setPhone(event.target.value)}
					placeholder="+92 320 4862403"
					icon={<PhoneIcon size={14} />}
					inputMode="tel"
					autoComplete="tel"
					autoFocus={autoFocusPhone}
					disabled={isSubmitting}
				/>
			</div>
			<div className="reveal">
				<Input
					label="Password"
					type="password"
					value={password}
					onChange={(event) => setPassword(event.target.value)}
					placeholder="Your member password"
					icon={<LockKeyhole size={14} />}
					autoComplete="current-password"
					error={error}
					disabled={isSubmitting}
				/>
			</div>
			<div className="reveal">
				<Button type="submit" variant="primary" size="md" className="w-full" isLoading={isSubmitting} trailingIcon={<ArrowRight size={14} />} disabled={isSubmitting}>
					Sign in
				</Button>
			</div>
		</form>
	);
}
