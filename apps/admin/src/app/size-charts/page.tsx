import { Suspense } from "react";

import { ListPageShell } from "@/components/shared/ListPageShell";
import { SizeCharts } from "@/app/size-charts/_components/SizeCharts";
import { ListWorkspaceSkeleton } from "@/components/loading/ListWorkspaceSkeleton";

import { loadAdminSizeChartsCached } from "@/lib/cached";
import { requirePagePermission } from "@/lib/server/requirePageSession";

export const dynamic = "force-dynamic";

export default async function AdminSizeChartsPage() {
	await requirePagePermission("category_manage", "/size-charts");

	return (
		<ListPageShell>
			<Suspense fallback={<ListWorkspaceSkeleton />}>
				<SizeChartsData />
			</Suspense>
		</ListPageShell>
	);
}

async function SizeChartsData() {
	const charts = await loadAdminSizeChartsCached();
	return <SizeCharts charts={charts} />;
}
