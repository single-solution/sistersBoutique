import { requireSession } from "@/lib/api/requireSession";
import { readListOptions, type ListResponse } from "@/lib/api/listOptions";
import { badRequest, created, ok, parseBody } from "@store/shared";

import { connectDB, handleMongoError, SizeChart } from "@store/db";

import { bustAdminCaches } from "@/lib/cached";
import { recordActivity } from "@/lib/services/activityLog";
import { parseSizeChartPayload } from "@/lib/api/sizeChartPayload";
import { toSizeChartResponse, type SizeChartLean } from "@/lib/serializers/sizeChart";
import type { AdminSizeChart } from "@/types/models";

export async function GET(request: Request) {
	const { response } = await requireSession("product_view");
	if (response) {
		return response;
	}

	try {
		await connectDB();
		const { page, limit, skip, search, searchPattern } = readListOptions(request);
		const filter: Record<string, unknown> = {};
		if (search) {
			filter.name = { $regex: searchPattern, $options: "i" };
		}

		const [docs, total] = await Promise.all([SizeChart.find(filter).sort({ name: 1 }).skip(skip).limit(limit).lean<SizeChartLean[]>(), SizeChart.countDocuments(filter)]);

		const payload: ListResponse<AdminSizeChart> = {
			items: docs.map(toSizeChartResponse),
			total,
			page,
			limit,
		};
		return ok(payload);
	} catch (error) {
		return handleMongoError(error);
	}
}

export async function POST(request: Request) {
	const { actor, response } = await requireSession("category_manage");
	if (response) {
		return response;
	}

	const body = await parseBody<unknown>(request);
	if (body instanceof Response) {
		return body;
	}

	const parsed = parseSizeChartPayload(body);
	if ("error" in parsed) {
		return badRequest(parsed.error);
	}

	try {
		await connectDB();
		const doc = await SizeChart.create(parsed);
		void recordActivity({
			actor,
			action: "created",
			resourceType: "sizeChart",
			resourceId: doc._id.toString(),
			resourceLabel: doc.name,
		});
		bustAdminCaches();
		return created(toSizeChartResponse(doc.toObject() as unknown as SizeChartLean));
	} catch (error) {
		return handleMongoError(error);
	}
}
