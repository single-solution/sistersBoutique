/**
 * Complete a member account from an admin-issued setup link.
 *
 * The customer sends the raw link token + a chosen password. We re-validate the
 * token (hashed match, invited, unexpired), set the password on the phone-keyed
 * Customer, mark them a member, and close the request. Sign-in happens on the
 * client afterwards through the `customer-password` provider.
 */

import bcrypt from "bcryptjs";

import { connectDB, Customer, MembershipRequest } from "@store/db";
import { BCRYPT_ROUNDS, badRequest, isValidationError, logger, ok, phoneFingerprint, serverError, validatePassword } from "@store/shared";

import { enforceSameOrigin } from "@/lib/api/sameOrigin";
import { hashSetupToken, type InvitableRequest } from "@/lib/server/membershipSetup";

interface AccountSetupBody {
	token?: unknown;
	password?: unknown;
}

export async function POST(request: Request) {
	const csrf = enforceSameOrigin(request);
	if (csrf) {
		return csrf;
	}

	let body: AccountSetupBody;
	try {
		body = (await request.json()) as AccountSetupBody;
	} catch {
		return badRequest("Invalid request body.");
	}

	const rawToken = typeof body.token === "string" ? body.token.trim() : "";
	if (!rawToken) {
		return badRequest("This setup link is invalid.");
	}

	const passwordResult = validatePassword(body.password);
	if (isValidationError(passwordResult)) {
		return badRequest(passwordResult.error);
	}

	try {
		await connectDB();
		const now = new Date();

		// Atomically consume the invite: only the request that flips invited→completed
		// proceeds. A replay or racing second submit matches nothing and is rejected,
		// so a setup link can activate an account exactly once.
		const invitation = await MembershipRequest.findOneAndUpdate(
			{ setupTokenHash: hashSetupToken(rawToken), status: "invited", setupTokenExpiresAt: { $gt: now } },
			{ $set: { status: "completed", completedAt: now }, $unset: { setupTokenHash: "", setupTokenExpiresAt: "" } },
			{ new: true },
		).lean<InvitableRequest>();
		if (!invitation) {
			return badRequest("This setup link is invalid, already used, or has expired. Please request a fresh link on WhatsApp.");
		}

		const passwordHash = await bcrypt.hash(passwordResult, BCRYPT_ROUNDS);
		const fingerprint = phoneFingerprint(invitation.phoneNumber) ?? "";

		const customer = await Customer.findOneAndUpdate(
			{ phoneNumber: invitation.phoneNumber },
			{
				$set: { passwordHash, isMember: true, memberSince: now },
				$setOnInsert: {
					phoneNumber: invitation.phoneNumber,
					name: invitation.name || `Member ${fingerprint.slice(-4)}`,
					city: "—",
					addresses: [],
					isLoyaltyMember: false,
				},
			},
			{ new: true, upsert: true, runValidators: true },
		);

		await MembershipRequest.updateOne({ _id: invitation._id }, { $set: { customerId: customer._id } });

		// Return the canonical phone so the client can sign in without re-typing.
		return ok({ phoneNumber: customer.phoneNumber });
	} catch (error) {
		logger.error({ error }, "Failed to complete member account setup");
		return serverError("Could not set your password. Please try again.");
	}
}
