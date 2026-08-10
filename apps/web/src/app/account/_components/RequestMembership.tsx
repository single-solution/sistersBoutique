"use client";

import { useState, type FormEvent } from "react";
import { MessageCircle, Phone as PhoneIcon, Sparkles, User as UserIcon } from "lucide-react";
import { Button } from "@store/ui";
import { buildWhatsAppLink } from "@store/shared";

import { Input } from "@/components/ui/Input";
import { useStoreSettings } from "@/lib/core/storeSettingsContext";

type SubmitState = "idle" | "submitting" | "queued" | "already-member";

/**
 * Membership request intake. Logs the request in the admin queue, then opens a
 * prefilled WhatsApp chat so the customer can reach the team directly — the
 * admin replies with a one-time setup link. No OTP, no self-serve password.
 */
export function RequestMembership() {
	const { whatsappNumber } = useStoreSettings();
	const [name, setName] = useState("");
	const [phone, setPhone] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [state, setState] = useState<SubmitState>("idle");

	function openWhatsApp() {
		if (!whatsappNumber) {
			return;
		}
		const message = `Salam! I'd like to become a premium member.\nName: ${name.trim()}\nPhone: ${phone.trim()}`;
		window.open(buildWhatsAppLink(message, whatsappNumber), "_blank", "noopener,noreferrer");
	}

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (state === "submitting") {
			return;
		}
		if (name.trim().length < 2 || phone.trim().length < 7) {
			setError("Enter your name and a valid phone number.");
			return;
		}
		setState("submitting");
		setError(null);
		try {
			const response = await fetch("/api/membership/requests", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ name: name.trim(), phoneNumber: phone.trim() }),
			});
			const data = (await response.json().catch(() => ({}))) as { status?: string; error?: string };
			if (!response.ok) {
				setError(data.error ?? "Could not submit your request. Please try again.");
				setState("idle");
				return;
			}
			if (data.status === "already-member") {
				setState("already-member");
				return;
			}
			setState("queued");
			openWhatsApp();
		} catch {
			setError("Network error. Please try again.");
			setState("idle");
		}
	}

	if (state === "already-member") {
		return (
			<div className="rounded-[var(--radius-md)] border border-[var(--color-ink-100)] bg-[var(--color-canvas-deep)] px-4 py-4 text-[13px] text-[var(--color-ink-700)]">
				This number is already a member. Head to sign in and use your password.
			</div>
		);
	}

	if (state === "queued") {
		return (
			<div className="space-y-3 rounded-[var(--radius-md)] border border-[var(--color-ink-100)] bg-[var(--color-canvas-deep)] px-4 py-4 text-[13px] text-[var(--color-ink-700)]">
				<p className="flex items-center gap-2 font-semibold text-[var(--color-ink-900)]">
					<Sparkles size={15} className="text-[var(--color-accent-700)]" />
					Request received
				</p>
				<p>Our team will send your setup link on WhatsApp. If the chat didn&apos;t open, tap below.</p>
				{whatsappNumber ? (
					<Button type="button" variant="outline" size="sm" leadingIcon={<MessageCircle size={13} />} onClick={openWhatsApp}>
						Open WhatsApp
					</Button>
				) : null}
			</div>
		);
	}

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			<Input label="Your name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Full name" icon={<UserIcon size={14} />} disabled={state === "submitting"} />
			<Input
				label="WhatsApp number"
				value={phone}
				onChange={(event) => setPhone(event.target.value)}
				placeholder="+92 320 4862403"
				icon={<PhoneIcon size={14} />}
				inputMode="tel"
				autoComplete="tel"
				error={error}
				disabled={state === "submitting"}
			/>
			<Button type="submit" variant="primary" size="md" className="w-full" isLoading={state === "submitting"} leadingIcon={<MessageCircle size={14} />} disabled={state === "submitting"}>
				Request membership on WhatsApp
			</Button>
		</form>
	);
}
