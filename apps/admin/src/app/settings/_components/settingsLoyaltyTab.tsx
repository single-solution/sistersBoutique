"use client";

import { Gift, Sparkles } from "lucide-react";
import { STORE_SETTING_GROUPS } from "@store/shared";
import { FormSection } from "@/components/forms/FormSection";
import { SettingsTabHero, type SettingsHeroMetric } from "@/app/settings/_components/settingsWorkspaceUi";
import { NumberField, SaveableSection } from "@/app/settings/_components/settingsSaveableSection";
import type { SectionProps } from "@/app/settings/_components/settingsSectionProps";

export function LoyaltySettings({ draft, saved, setField, onSaved, canUpdate }: SectionProps) {
	const heroMetrics: SettingsHeroMetric[] = [
		{
			label: "Earn rate",
			value: draft.loyaltyEarnPercent > 0 ? `${draft.loyaltyEarnPercent}% back` : "Off",
			hint: "Points awarded per Rupee on paid orders",
			tone: draft.loyaltyEarnPercent > 0 ? "good" : "off",
			icon: Gift,
		},
		{
			label: "Member discount",
			value: draft.memberDiscountPercent > 0 ? `${draft.memberDiscountPercent}% off` : "Off",
			hint: "Applied to signed-in members' subtotal",
			tone: draft.memberDiscountPercent > 0 ? "good" : "off",
			icon: Sparkles,
		},
	];
	return (
		<SaveableSection
			fields={STORE_SETTING_GROUPS.loyalty}
			draft={draft}
			saved={saved}
			setField={setField}
			onSaved={onSaved}
			canUpdate={canUpdate}
			hero={<SettingsTabHero metrics={heroMetrics} />}
		>
			<FormSection title="Loyalty programme" description="Earn rate shown on checkout and credited when orders are delivered.">
				<NumberField
						label="Earn rate (% of order total)"
						value={draft.loyaltyEarnPercent}
						onChange={(value) => setField("loyaltyEarnPercent", value)}
						trailingAddon="%"
						placeholder="e.g. 1"
						hint="Points earned per Rupee on the payable order total."
						disabled={!canUpdate}
						containerClassName="w-full"
				/>
			</FormSection>
			<FormSection title="Premium members" description="Discount applied to a signed-in member's subtotal at checkout. Set 0 to pause the perk.">
				<NumberField
						label="Member discount (% of subtotal)"
						value={draft.memberDiscountPercent}
						onChange={(value) => setField("memberDiscountPercent", value)}
						trailingAddon="%"
						placeholder="e.g. 10"
						hint="Applied after promotional offers, before shipping. Guests never receive it."
						disabled={!canUpdate}
						containerClassName="w-full"
				/>
			</FormSection>
		</SaveableSection>
	);
}
