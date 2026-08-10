import { redirect } from "next/navigation";

/** Old fitting routes collapse to the single shop concept. */
export default function ShopFittingRedirectPage() {
	redirect("/concepts/shop");
}
