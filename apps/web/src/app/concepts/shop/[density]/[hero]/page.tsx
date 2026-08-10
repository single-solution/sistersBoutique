import { redirect } from "next/navigation";

/** Old density × hero matrix removed — gate-hang is the only shop concept. */
export default function ShopDensityHeroRedirectPage() {
	redirect("/concepts/shop");
}
