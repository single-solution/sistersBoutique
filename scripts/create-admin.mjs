/**
 * Bootstrap the first admin user (owner) for a fresh Sister's Outfits database.
 *
 *   ADMIN_EMAIL=owner@sistersoutfits.pk ADMIN_PASSWORD='StrongPass123!' \
 *     ADMIN_NAME='Store Owner' npx tsx scripts/create-admin.mjs
 *
 * Reads MONGODB_URI from the environment or `.env.local` (same loader the
 * other scripts use). Upserts by email, sets role "owner" + isSuperAdmin so
 * the account can invite the rest of the team from Settings -> Team.
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

import { User } from "../packages/db/src/models/User.ts";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const envLocalPath = resolve(scriptDir, "../.env.local");

if (!process.env.MONGODB_URI && existsSync(envLocalPath)) {
	for (const line of readFileSync(envLocalPath, "utf8").split("\n")) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith("#") || !trimmed.startsWith("MONGODB_URI=")) {
			continue;
		}
		process.env.MONGODB_URI = trimmed.slice("MONGODB_URI=".length).trim();
		break;
	}
}

const uri = process.env.MONGODB_URI;
const email = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD ?? "";
const name = (process.env.ADMIN_NAME ?? "Store Owner").trim();
const BCRYPT_ROUNDS = 12;

if (!uri) {
	console.error("MONGODB_URI is not set (env or .env.local).");
	process.exit(1);
}
if (!email || !password) {
	console.error("ADMIN_EMAIL and ADMIN_PASSWORD are required.");
	process.exit(1);
}
if (password.length < 8) {
	console.error("ADMIN_PASSWORD must be at least 8 characters.");
	process.exit(1);
}

await mongoose.connect(uri);

const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
const user = await User.findOneAndUpdate(
	{ email },
	{
		$set: {
			email,
			name,
			passwordHash,
			role: "owner",
			isActive: true,
			isSuperAdmin: true,
			passwordChangedAt: new Date(),
		},
	},
	{ upsert: true, new: true, setDefaultsOnInsert: true },
);

console.log(`Admin ready: ${user.email} (role=${user.role}, superAdmin=${user.isSuperAdmin})`);
await mongoose.disconnect();
