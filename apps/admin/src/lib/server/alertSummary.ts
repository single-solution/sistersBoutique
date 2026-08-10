import { connectDB, getStoreSettings, Order, Product } from "@store/db";

import { LOW_STOCK_VARIANT_THRESHOLD } from "@/lib/server/dashboardStats";

export interface AlertSummary {
	pendingPayments: number;
	lowStockVariants: number;
}

async function resolveLowStockThreshold(): Promise<number> {
	try {
		const settings = await getStoreSettings();
		if (Number.isFinite(settings.lowStockThreshold) && settings.lowStockThreshold >= 0) {
			return Math.floor(settings.lowStockThreshold);
		}
	} catch {
		// Fall through to the default — never let a settings error suppress alerts.
	}
	return LOW_STOCK_VARIANT_THRESHOLD;
}

export async function loadAlertSummary(): Promise<AlertSummary> {
	await connectDB();
	const lowStockThreshold = await resolveLowStockThreshold();

	const [pendingPayments, productAgg] = await Promise.all([
		Order.countDocuments({ status: "pending-payment" }),
		Product.aggregate<{ _id: null; lowStockVariants: number }>([
			{ $match: { isArchived: { $ne: true } } },
			{
				$project: {
					variantsActive: {
						$filter: {
							input: "$variants",
							as: "variant",
							cond: { $ne: ["$$variant.isArchived", true] },
						},
					},
				},
			},
			{
				$project: {
					lowStock: {
						$size: {
							$filter: {
								input: "$variantsActive",
								as: "variant",
								cond: {
									$and: [
										{ $eq: ["$$variant.isInStock", true] },
										{
											$lte: [{ $ifNull: ["$$variant.stockCount", 0] }, lowStockThreshold],
										},
									],
								},
							},
						},
					},
				},
			},
			{
				$group: {
					_id: null,
					lowStockVariants: { $sum: "$lowStock" },
				},
			},
		]),
	]);

	return {
		pendingPayments,
		lowStockVariants: productAgg[0]?.lowStockVariants ?? 0,
	};
}
