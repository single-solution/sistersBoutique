"use client";

import { buildWhatsAppLink, isValidWhatsappNumber, normalizeWhatsappNumber } from "@store/shared";

import { WhatsAppIcon } from "@/components/ui/SocialIcons";
import { useStoreSettings } from "@/lib/core/storeSettingsContext";
import { buildCurrentWhatsAppPageLink } from "@/lib/support/whatsappPageLink";

export function WhatsAppSupport() {
	const { whatsappNumber, siteName } = useStoreSettings();
	const whatsappDigits = normalizeWhatsappNumber(whatsappNumber ?? "");

	function applyCurrentPageContext(event: React.SyntheticEvent<HTMLAnchorElement>) {
		event.currentTarget.href = buildCurrentWhatsAppPageLink(whatsappDigits, siteName);
	}

	return (
		<div className="floating-dock fixed z-40 flex flex-col items-end gap-2.5 max-md:right-4 md:right-7">
			<div className="flex items-center gap-2.5">
				{isValidWhatsappNumber(whatsappDigits) ? (
					<a
						href={buildWhatsAppLink(`Salam! I have a question about ${siteName}.`, whatsappDigits)}
						target="_blank"
						rel="noopener noreferrer"
						aria-label="WhatsApp"
						onClick={applyCurrentPageContext}
						onFocus={applyCurrentPageContext}
						onPointerDown={applyCurrentPageContext}
						onTouchStart={applyCurrentPageContext}
						className="tap focus-ring hidden items-center gap-2 rounded-[var(--radius-full)] border-0 bg-[var(--color-whatsapp)] py-2.5 pl-3 pr-4 text-sm font-bold text-[var(--color-ink-900)] shadow-[var(--shadow-lg)] transition-[transform,background-color,box-shadow] duration-300 hover:-translate-y-0.5 hover:bg-[var(--color-whatsapp)] hover:shadow-[var(--shadow-lg)] md:inline-flex"
					>
						<span className="grid size-7 place-items-center rounded-full bg-[var(--color-on-dark-20)]">
							<WhatsAppIcon size={15} aria-hidden />
						</span>
						<span>WhatsApp</span>
					</a>
				) : null}
			</div>
		</div>
	);
}
