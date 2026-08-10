/**
 * Account-setup link validation for invited members.
 *
 * The admin issues a link containing a raw opaque token; we only ever store its
 * SHA-256 hash on the `MembershipRequest`. Both the setup page (to decide what
 * to render) and the set-password API (to activate the account) resolve the
 * request the same way through here, so the "valid, unexpired, invited" rule
 * lives in one place.
 */

import { createHash } from "node:crypto";

import { connectDB, MembershipRequest, type MembershipRequestAttributes } from "@store/db";
import type { Types } from "mongoose";

export type InvitableRequest = MembershipRequestAttributes & { _id: Types.ObjectId };

/** Hash a raw setup token to the form persisted on the request. */
export function hashSetupToken(rawToken: string): string {
	return createHash("sha256").update(rawToken).digest("hex");
}

/**
 * Resolve a raw token to its still-open invitation, or `null` when the token is
 * unknown, already used, declined, or expired.
 */
export async function findInvitableRequestByToken(rawToken: string): Promise<InvitableRequest | null> {
	const token = rawToken.trim();
	if (!token) {
		return null;
	}
	await connectDB();
	const request = await MembershipRequest.findOne({ setupTokenHash: hashSetupToken(token), status: "invited" })
		.select("+setupTokenHash")
		.lean<InvitableRequest>();
	if (!request) {
		return null;
	}
	if (!request.setupTokenExpiresAt || request.setupTokenExpiresAt.getTime() < Date.now()) {
		return null;
	}
	return request;
}
