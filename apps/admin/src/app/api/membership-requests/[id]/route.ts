import { requireSession } from "@/lib/api/requireSession";
import { connectDB, handleMongoError, MembershipRequest } from "@store/db";
import { badRequest, isValidId, notFound, ok, parseBody } from "@store/shared";

import { recordActivity } from "@/lib/services/activityLog";

interface RouteContext {
	params: Promise<{ id: string }>;
}

const ALLOWED_ACTIONS = ["decline", "reopen"] as const;
type RequestAction = (typeof ALLOWED_ACTIONS)[number];

interface PatchBody {
	action?: unknown;
}

/** Decline (or re-open) a membership request without issuing a setup link. */
export async function PATCH(request: Request, { params }: RouteContext) {
	const { actor, response } = await requireSession("customer_update");
	if (response) {
		return response;
	}

	const { id } = await params;
	if (!isValidId(id)) {
		return badRequest("Invalid ID.");
	}

	const parsed = await parseBody<PatchBody>(request);
	if (parsed instanceof Response) {
		return parsed;
	}
	const action = parsed.action;
	if (typeof action !== "string" || !(ALLOWED_ACTIONS as readonly string[]).includes(action)) {
		return badRequest(`action must be one of: ${ALLOWED_ACTIONS.join(", ")}.`);
	}

	try {
		await connectDB();
		const doc = await MembershipRequest.findById(id);
		if (!doc) {
			return notFound("Membership request not found");
		}
		if (doc.status === "completed") {
			return badRequest("This member has already completed setup.");
		}

		const nextStatus = (action as RequestAction) === "decline" ? "declined" : "pending";
		doc.status = nextStatus;
		if (nextStatus === "declined") {
			doc.setupTokenHash = undefined;
			doc.setupTokenExpiresAt = undefined;
		}
		await doc.save();

		void recordActivity({
			actor,
			action: nextStatus === "declined" ? "membership_declined" : "status_changed",
			resourceType: "customer",
			resourceId: id,
			resourceLabel: doc.name,
			detail: nextStatus === "declined" ? "Declined a membership request" : "Re-opened a membership request",
		});

		return ok({ id, status: nextStatus });
	} catch (error) {
		return handleMongoError(error);
	}
}
