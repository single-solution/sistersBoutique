import mongoose, { Schema, type Model } from "mongoose";

/**
 * A customer's request to become a premium member.
 *
 * Flow (no OTP, no self-serve password by design — the store is not Meta-verified):
 *   1. Storefront visitor taps "Request membership" → a request is logged here
 *      (status `pending`) and a prefilled WhatsApp chat opens to the admin.
 *   2. Admin reviews and generates a single-use setup link. We store only the
 *      SHA-256 hash of the link token (never the raw token) with an expiry, and
 *      flip the status to `invited`.
 *   3. Customer opens the link, sets a password → status `completed` and the
 *      linked Customer becomes a member.
 *
 * The raw token lives only in the URL the admin sends over WhatsApp; losing it
 * means generating a fresh link, exactly like a password reset.
 */

export const MEMBERSHIP_REQUEST_STATUSES = ["pending", "invited", "completed", "declined", "expired"] as const;
export type MembershipRequestStatus = (typeof MEMBERSHIP_REQUEST_STATUSES)[number];

const NAME_MAX_LENGTH = 160;
const PHONE_MAX_LENGTH = 32;
const NOTE_MAX_LENGTH = 600;
/** 10-digit PK subscriber portion — the phone identity across the codebase. */
const FINGERPRINT_MAX_LENGTH = 10;

export interface MembershipRequestAttributes {
	name: string;
	/** Canonical E.164 form (`+92…`) — the form persisted on every write path. */
	phoneNumber: string;
	/** Trailing 10 digits, used to dedupe requests regardless of typed format. */
	phoneFingerprint: string;
	status: MembershipRequestStatus;
	/** Optional message the customer left with the request. */
	note?: string;
	/** SHA-256 hash of the account-setup link token (raw token never stored). */
	setupTokenHash?: string;
	setupTokenExpiresAt?: Date;
	/** Admin who generated the setup link. */
	invitedByUserId?: mongoose.Types.ObjectId;
	invitedAt?: Date;
	completedAt?: Date;
	/** Customer record activated by this request. */
	customerId?: mongoose.Types.ObjectId;
}

const membershipRequestSchema = new Schema<MembershipRequestAttributes>(
	{
		name: { type: String, required: true, trim: true, maxlength: NAME_MAX_LENGTH },
		phoneNumber: { type: String, required: true, trim: true, maxlength: PHONE_MAX_LENGTH },
		phoneFingerprint: { type: String, required: true, trim: true, maxlength: FINGERPRINT_MAX_LENGTH, index: true },
		status: { type: String, enum: MEMBERSHIP_REQUEST_STATUSES, required: true, default: "pending", index: true },
		note: { type: String, trim: true, maxlength: NOTE_MAX_LENGTH },
		setupTokenHash: { type: String, select: false, index: true },
		setupTokenExpiresAt: { type: Date },
		invitedByUserId: { type: Schema.Types.ObjectId, ref: "User" },
		invitedAt: { type: Date },
		completedAt: { type: Date },
		customerId: { type: Schema.Types.ObjectId, ref: "Customer" },
	},
	{ timestamps: true },
);

membershipRequestSchema.index({ createdAt: -1 });

export const MembershipRequest: Model<MembershipRequestAttributes> =
	(mongoose.models.MembershipRequest as Model<MembershipRequestAttributes>) ??
	mongoose.model<MembershipRequestAttributes>("MembershipRequest", membershipRequestSchema);
