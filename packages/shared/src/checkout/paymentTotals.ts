/** Extra % added to the order subtotal when the customer pays cash on delivery. */
export function computeCodSurchargeRupees(subtotalRupees: number, codSurchargePercent: number): number {
	const percent = Math.max(0, codSurchargePercent);
	if (percent <= 0 || subtotalRupees <= 0) {
		return 0;
	}
	return Math.round((subtotalRupees * percent) / 100);
}

/**
 * Premium-member discount on the post-offer subtotal. Only ever applied for a
 * signed-in member (`isMember`); guests and non-members get `0`. Server and
 * client call this so the displayed and billed numbers always match.
 */
export function computeMemberDiscountRupees(params: { isMember: boolean; subtotalAfterOffersRupees: number; memberDiscountPercent: number }): number {
	const { isMember, subtotalAfterOffersRupees, memberDiscountPercent } = params;
	const percent = Math.max(0, memberDiscountPercent);
	if (!isMember || percent <= 0 || subtotalAfterOffersRupees <= 0) {
		return 0;
	}
	return Math.min(subtotalAfterOffersRupees, Math.round((subtotalAfterOffersRupees * percent) / 100));
}
