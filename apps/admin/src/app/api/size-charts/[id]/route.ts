import { Brand, Category, connectDB, handleMongoError, Product, SizeChart } from "@store/db";
import { badRequest, conflict, isValidId, noContent, notFound, ok, parseBody } from "@store/shared";

import { requireSession } from "@/lib/api/requireSession";
import { bustAdminCaches } from "@/lib/cached";
import { recordActivity } from "@/lib/services/activityLog";
import { parseSizeChartPayload } from "@/lib/api/sizeChartPayload";
import { toSizeChartResponse, type SizeChartLean } from "@/lib/serializers/sizeChart";

interface RouteContext {
	params: Promise<{ id: string }>;
}

async function countChartReferences(id: string): Promise<number> {
	const [products, brands, categories] = await Promise.all([
		Product.countDocuments({ sizeChartId: id }),
		Brand.countDocuments({ defaultSizeChartId: id }),
		Category.countDocuments({ defaultSizeChartId: id }),
	]);
	return products + brands + categories;
}

export async function GET(_request: Request, { params }: RouteContext) {
	const { response } = await requireSession("product_view");
	if (response) {
		return response;
	}

	const { id } = await params;
	if (!isValidId(id)) {
		return badRequest("Invalid ID.");
	}

	await connectDB();
	const doc = await SizeChart.findById(id).lean<SizeChartLean>();
	if (!doc) {
		return notFound("Size chart not found");
	}

	return ok(toSizeChartResponse(doc));
}

export async function PUT(request: Request, { params }: RouteContext) {
	const { actor, response } = await requireSession("category_manage");
	if (response) {
		return response;
	}

	const { id } = await params;
	if (!isValidId(id)) {
		return badRequest("Invalid ID.");
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
		const doc = await SizeChart.findByIdAndUpdate(id, { $set: parsed }, { new: true, runValidators: true }).lean<SizeChartLean>();
		if (!doc) {
			return notFound("Size chart not found");
		}

		await recordActivity({
			actor,
			action: "updated",
			resourceType: "sizeChart",
			resourceId: id,
			resourceLabel: doc.name,
		});
		bustAdminCaches();
		return ok(toSizeChartResponse(doc));
	} catch (error) {
		return handleMongoError(error);
	}
}

export async function DELETE(_request: Request, { params }: RouteContext) {
	const { actor, response } = await requireSession("category_manage");
	if (response) {
		return response;
	}

	const { id } = await params;
	if (!isValidId(id)) {
		return badRequest("Invalid ID.");
	}

	await connectDB();
	const references = await countChartReferences(id);
	if (references > 0) {
		return conflict(`Cannot delete a size chart used by ${references} record${references === 1 ? "" : "s"}. Reassign them first, or mark the chart inactive.`);
	}

	try {
		const doc = await SizeChart.findByIdAndDelete(id).lean<SizeChartLean>();
		if (!doc) {
			return notFound("Size chart not found");
		}

		await recordActivity({
			actor,
			action: "deleted",
			resourceType: "sizeChart",
			resourceId: id,
			resourceLabel: doc.name,
		});
		bustAdminCaches();
		return noContent();
	} catch (error) {
		return handleMongoError(error);
	}
}
