/**
 * Public membership request intake.
 *
 * A storefront visitor asks to become a premium member. We only log the
 * request here (name + phone, deduped by phone fingerprint) — no OTP, no
 * password yet. The client also opens a prefilled WhatsApp chat to the admin,
 * who reviews the request and issues a setup link from the admin console.
 *
 * Security:
 *   - same-origin (CSRF) guard first
 *   - fixed body cap via parseBody
 *   - per IP+phone rate limit so the endpoint can't be used to spam the queue
 *   - never trusts a client "member" flag — status is server-owned
 */

import { connectDB, Customer, MembershipRequest } from "@store/db";
import {
	FIELD_LIMITS,
	badRequest,
	created,
	isValidationError,
	logger,
	normalizePhoneNumber,
	phoneFingerprint,
	SHORT_BURST_WINDOW_MS,
	serverError,
	validateString,
} from "@store/shared";

import { enforcePublicRateLimit } from "@/lib/api/publicRateLimit";
import { enforceSameOrigin } from "@/lib/api/sameOrigin";

const MIN_NAME_CHARS = 2;
const MIN_PHONE_CHARS = 7;
const MAX_NOTE_CHARS = 600;
/** Requests per IP+phone per short-burst window. */
const MAX_REQUESTS_PER_WINDOW = 4;

interface MembershipRequestBody {
	name?: unknown;
	phoneNumber?: unknown;
	note?: unknown;
}

export async function POST(request: Request) {
	const csrf = enforceSameOrigin(request);
	if (csrf) {
		return csrf;
	}

	let body: MembershipRequestBody;
	try {
		body = (await request.json()) as MembershipRequestBody;
	} catch {
		return badRequest("Invalid request body.");
	}

	const nameResult = validateString(body.name, { label: "Name", min: MIN_NAME_CHARS, max: FIELD_LIMITS.personName });
	if (isValidationError(nameResult)) {
		return badRequest(nameResult.error);
	}

	const phoneResult = validateString(body.phoneNumber, { label: "Phone", min: MIN_PHONE_CHARS, max: FIELD_LIMITS.phoneNumber });
	if (isValidationError(phoneResult)) {
		return badRequest(phoneResult.error);
	}
	const phoneNumber = normalizePhoneNumber(phoneResult);
	const fingerprint = phoneFingerprint(phoneResult);
	if (!phoneNumber || !fingerprint) {
		return badRequest("Enter a valid Pakistan mobile number.");
	}

	let note: string | undefined;
	if (typeof body.note === "string" && body.note.trim().length > 0) {
		const noteResult = validateString(body.note, { label: "Note", max: MAX_NOTE_CHARS, required: false });
		if (isValidationError(noteResult)) {
			return badRequest(noteResult.error);
		}
		note = noteResult;
	}

	const limited = enforcePublicRateLimit(request, {
		scope: "membership-request",
		identifier: fingerprint,
		max: MAX_REQUESTS_PER_WINDOW,
		windowMs: SHORT_BURST_WINDOW_MS,
	});
	if (limited) {
		return limited;
	}

	try {
		await connectDB();

		// Already a member? Nothing to queue — tell the client to just sign in.
		const existingMember = await Customer.findOne({ phoneNumber, isMember: true }).select("_id").lean();
		if (existingMember) {
			return created({ status: "already-member" });
		}

		// Fold repeat asks into the open request so the admin queue stays clean.
		const openRequest = await MembershipRequest.findOne({ phoneFingerprint: fingerprint, status: { $in: ["pending", "invited"] } });
		if (openRequest) {
			openRequest.name = nameResult;
			openRequest.phoneNumber = phoneNumber;
			if (note) {
				openRequest.note = note;
			}
			await openRequest.save();
			return created({ status: "queued" });
		}

		await MembershipRequest.create({ name: nameResult, phoneNumber, phoneFingerprint: fingerprint, status: "pending", note });
		return created({ status: "queued" });
	} catch (error) {
		logger.error({ error }, "Failed to record membership request");
		return serverError("Could not submit your request. Please try again.");
	}
}
