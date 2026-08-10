import crypto from "node:crypto";

import { requireSession } from "@/lib/api/requireSession";
import { connectDB, getStoreSettings, handleMongoError, MembershipRequest } from "@store/db";
import { badRequest, isValidId, notFound, ok, resolvePublicSiteUrl } from "@store/shared";

import { recordActivity } from "@/lib/services/activityLog";

interface RouteContext {
	params: Promise<{ id: string }>;
}

/** Opaque token bytes — only its SHA-256 hash is ever stored. */
const TOKEN_BYTES = 32;
/** Setup links stay valid for a week — plenty of time for a WhatsApp reply. */
const SETUP_TTL_MS = 7 * 24 * 60 * 60 * 1_000;
const SETUP_TTL_DAYS = 7;

/**
 * Generate a single-use account-setup link for a membership request.
 *
 * We store only the SHA-256 hash of the token (never the raw value) plus an
 * expiry, and flip the request to `invited`. The plaintext link is returned
 * once for the admin to send over WhatsApp; regenerating replaces the prior
 * token, so an old link stops working.
 */
export async function POST(_request: Request, { params }: RouteContext) {
	const { actor, response } = await requireSession("customer_update");
	if (response) {
		return response;
	}

	const { id } = await params;
	if (!isValidId(id)) {
		return badRequest("Invalid ID.");
	}

	try {
		await connectDB();
		const request = await MembershipRequest.findById(id);
		if (!request) {
			return notFound("Membership request not found");
		}
		if (request.status === "completed") {
			return badRequest("This member has already completed setup.");
		}
		if (request.status === "declined") {
			return badRequest("This request was declined. Re-open it before issuing a link.");
		}

		const rawToken = crypto.randomBytes(TOKEN_BYTES).toString("hex");
		const setupTokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
		const expiresAt = new Date(Date.now() + SETUP_TTL_MS);

		request.setupTokenHash = setupTokenHash;
		request.setupTokenExpiresAt = expiresAt;
		request.status = "invited";
		request.invitedAt = new Date();
		request.invitedByUserId = actor.id as never;
		await request.save();

		const settings = await getStoreSettings();
		const base = resolvePublicSiteUrl(settings.publicSiteUrl).replace(/\/$/, "");
		const link = `${base}/account/setup/${rawToken}`;

		void recordActivity({
			actor,
			action: "membership_link_issued",
			resourceType: "customer",
			resourceId: id,
			resourceLabel: request.name,
			detail: `Issued a member setup link (valid ${SETUP_TTL_DAYS} days)`,
		});

		return ok({ link, expiresAt: expiresAt.toISOString() });
	} catch (error) {
		return handleMongoError(error);
	}
}
