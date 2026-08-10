/**
 * NextAuth instance for the **storefront**.
 *
 * Providers:
 *   - `customer-password` — the live sign-in path: phone number + password.
 *     Only members who completed an admin-issued setup link have a
 *     `passwordHash`, so login is invite-only by design.
 *   - `customer-otp` — kept but **dormant**. It stays registered so the code
 *     path is ready the day the store becomes Meta-verified, but the UI never
 *     calls it, so no OTP is sent.
 *
 * There is no admin Credentials provider registered here, so even a request
 * that handcrafts a `signIn("credentials", …)` call against this app cannot
 * create an admin session — that provider does not exist in this bundle.
 */

import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { Customer, connectDB } from "@store/db";
import { BCRYPT_ROUNDS, checkRateLimit, clearRateLimit, getClientIp, logger, normalizePhoneNumber, PHONE_TAIL_LENGTH, phoneFingerprint, SHORT_BURST_WINDOW_MS } from "@store/shared";

import { authConfig } from "@/lib/authConfig";
import { verifyCode } from "@/lib/otp/service";

const OTP_RATE_LIMIT_SCOPE = "auth:customer-otp";
const PASSWORD_RATE_LIMIT_SCOPE = "auth:customer-password";
/**
 * Customer OTP attempts per IP+phone within a 15-minute window. Set high
 * enough that a legitimate user mistyping the code a few times never
 * locks themselves out, low enough that brute-forcers stall quickly.
 */
const CUSTOMER_OTP_ATTEMPTS_PER_WINDOW = 10;
/** Password sign-in attempts per IP+phone within the short-burst window. */
const CUSTOMER_PASSWORD_ATTEMPTS_PER_WINDOW = 8;
/**
 * Constant-time decoy so a wrong phone (no record) costs the same as a wrong
 * password — prevents timing-based account enumeration.
 */
const TIMING_DECOY_HASH = bcrypt.hashSync("customer-login:enum-defense:v1", BCRYPT_ROUNDS);
/**
 * WhatsApp OTP sign-in stays dormant until the store is Meta-verified. The
 * provider code path is kept ready, but `authorize` refuses unless an OTP
 * transport is configured — so there is no OTP sign-in surface in the meantime.
 */
const OTP_SIGN_IN_ENABLED = typeof process.env.OTP_PROVIDER === "string" && process.env.OTP_PROVIDER.trim().length > 0;

export const { handlers, auth, signIn, signOut } = NextAuth({
	...authConfig,
	providers: [
		Credentials({
			id: "customer-password",
			name: "customer-password",
			credentials: {
				phoneNumber: { label: "Phone", type: "tel" },
				password: { label: "Password", type: "password" },
			},
			async authorize(credentials, request) {
				const phoneRaw = typeof credentials?.phoneNumber === "string" ? credentials.phoneNumber.trim() : "";
				const password = typeof credentials?.password === "string" ? credentials.password : "";
				const phoneNumber = normalizePhoneNumber(phoneRaw);
				if (!phoneNumber || !password) {
					return null;
				}

				const ip = request instanceof Request ? getClientIp(request) : "unknown";
				const fingerprint = phoneFingerprint(phoneRaw) ?? phoneNumber;
				const rateLimit = checkRateLimit({
					scope: PASSWORD_RATE_LIMIT_SCOPE,
					key: `${ip}:${fingerprint}`,
					max: CUSTOMER_PASSWORD_ATTEMPTS_PER_WINDOW,
					windowMs: SHORT_BURST_WINDOW_MS,
				});
				if (!rateLimit.isAllowed) {
					logger.warn({ ip, fingerprint, retryAfterMs: rateLimit.retryAfterMs }, "Customer password rate limit exceeded");
					return null;
				}

				await connectDB();
				const customer = await Customer.findOne({ phoneNumber }).select("+passwordHash").lean<{
					_id: import("mongoose").Types.ObjectId;
					name: string;
					phoneNumber: string;
					passwordHash?: string;
				}>();

				if (!customer?.passwordHash) {
					// Spend the same time on a missing account as a real compare.
					await bcrypt.compare(password, TIMING_DECOY_HASH);
					logger.info({ ip, fingerprint }, "Customer password sign-in failed: no account");
					return null;
				}

				const isValid = await bcrypt.compare(password, customer.passwordHash);
				if (!isValid) {
					logger.info({ ip, fingerprint }, "Customer password sign-in failed: bad password");
					return null;
				}

				clearRateLimit(PASSWORD_RATE_LIMIT_SCOPE, `${ip}:${fingerprint}`);

				return {
					id: customer._id.toString(),
					name: customer.name,
					role: "customer",
					phoneNumber: customer.phoneNumber,
					customerId: customer._id.toString(),
				};
			},
		}),
		Credentials({
			id: "customer-otp",
			name: "customer-otp",
			credentials: {
				phoneNumber: { label: "Phone", type: "tel" },
				code: { label: "Code", type: "text" },
			},
			async authorize(credentials, request) {
				// Dormant until the store is Meta-verified — no OTP is issued, so no
				// OTP sign-in can succeed. Flip `OTP_PROVIDER` to go live.
				if (!OTP_SIGN_IN_ENABLED) {
					return null;
				}
				const phone = typeof credentials?.phoneNumber === "string" ? credentials.phoneNumber.trim() : "";
				const code = typeof credentials?.code === "string" ? credentials.code.trim() : "";
				if (!phone || !code) {
					return null;
				}

				const ip = request instanceof Request ? getClientIp(request) : "unknown";
				const fingerprint = phoneFingerprint(phone) ?? phone;
				const rateLimit = checkRateLimit({
					scope: OTP_RATE_LIMIT_SCOPE,
					key: `${ip}:${fingerprint}`,
					max: CUSTOMER_OTP_ATTEMPTS_PER_WINDOW,
					windowMs: SHORT_BURST_WINDOW_MS,
				});
				if (!rateLimit.isAllowed) {
					logger.warn({ ip, fingerprint, retryAfterMs: rateLimit.retryAfterMs }, "Customer OTP rate limit exceeded");
					return null;
				}

				const result = await verifyCode({
					phoneRaw: phone,
					code,
					purpose: "customer-signin",
				});
				if (!result.ok) {
					logger.info({ ip, fingerprint, error: result.error }, "Customer OTP verify failed");
					return null;
				}

				await connectDB();
				// Key on the canonical +92… form so a customer always resolves to the
				// same record regardless of how they typed their number this time, and
				// so admin-created accounts (which store the same canonical form) link
				// to their self-service sign-in.
				const phoneNumber = normalizePhoneNumber(result.phoneRaw) ?? `+92${result.phoneFingerprint}`;
				const customer = await Customer.findOneAndUpdate(
					{ phoneNumber },
					{
						$setOnInsert: {
							phoneNumber,
							name: `Customer ${result.phoneFingerprint.slice(-PHONE_TAIL_LENGTH)}`,
							city: "—",
							addresses: [],
							isLoyaltyMember: false,
						},
					},
					{ new: true, upsert: true },
				);

				clearRateLimit(OTP_RATE_LIMIT_SCOPE, `${ip}:${fingerprint}`);

				return {
					id: customer._id.toString(),
					name: customer.name,
					role: "customer",
					phoneNumber: customer.phoneNumber,
					customerId: customer._id.toString(),
				};
			},
		}),
	],
	callbacks: {
		...authConfig.callbacks,
		async jwt({ token, user }) {
			if (user) {
				token.id = user.id as string;
				token.name = (user.name as string | undefined) ?? "";
				token.role = "customer";
				token.phoneNumber = user.phoneNumber;
				token.customerId = user.customerId;
			}
			return token;
		},
		async session({ session, token }) {
			session.user.id = token.id as string;
			session.user.name = (token.name as string | undefined) ?? "";
			session.user.role = "customer";
			session.user.phoneNumber = token.phoneNumber as string | undefined;
			session.user.customerId = token.customerId as string | undefined;
			return session;
		},
	},
});
