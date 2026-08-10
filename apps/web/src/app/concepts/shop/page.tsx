import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { logger } from "@store/shared";

import { categoryHref } from "@/lib/catalog/productPaths";
import { getCategoriesCached } from "@/lib/core/cached";

export const metadata: Metadata = {
	title: "Shop study · Gate · hang tags",
	description: "Gate · hang tags is production shop — redirecting to the live category listing.",
	robots: { index: false, follow: false },
};

/** Study promoted to production category listing. */
export default async function ShopConceptPage() {
	try {
		const categories = await getCategoriesCached();
		const activeCategory = categories.find((category) => category.isActive) ?? categories[0];
		if (activeCategory) {
			redirect(categoryHref(activeCategory.slug));
		}
	} catch (error) {
		logger.error({ error }, "shop concept redirect: failed to resolve category");
	}
	redirect("/");
}
