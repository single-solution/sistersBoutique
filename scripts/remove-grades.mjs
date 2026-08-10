/**
 * Remove the grades catalog dimension from MongoDB.
 *
 *   npx tsx scripts/remove-grades.mjs --dry-run
 *   npx tsx scripts/remove-grades.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const envLocalPath = resolve(scriptDir, "../.env.local");
const isDryRun = process.argv.includes("--dry-run");

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
if (!uri) {
	console.error("MONGODB_URI is not set.");
	process.exit(1);
}

function attributesSignature(attributes) {
	const entries = Object.entries(attributes ?? {})
		.map(([key, value]) => {
			const normalized = Array.isArray(value) ? [...value].map(String).sort().join("|") : String(value ?? "");
			return [key, normalized];
		})
		.sort(([left], [right]) => left.localeCompare(right));
	return JSON.stringify(entries);
}

function mergeCollidingVariants(variants) {
	const buckets = new Map();
	for (const variant of variants ?? []) {
		const key = attributesSignature(variant.attributes);
		const existing = buckets.get(key);
		if (!existing) {
			const next = { ...variant };
			delete next.gradeSlug;
			buckets.set(key, next);
			continue;
		}
		const existingQuantity = Number(existing.quantity) || 0;
		const incomingQuantity = Number(variant.quantity) || 0;
		existing.quantity = existingQuantity + incomingQuantity;
		if ((Number(variant.priceRupees) || 0) < (Number(existing.priceRupees) || Infinity)) {
			existing.priceRupees = variant.priceRupees;
		}
		if (variant.forceOutOfStock === false) {
			existing.forceOutOfStock = false;
		}
		if ((Number(variant.warrantyDays) || 0) > (Number(existing.warrantyDays) || 0)) {
			existing.warrantyDays = variant.warrantyDays;
		}
		if (variant.attributeDisplay && typeof variant.attributeDisplay === "object") {
			existing.attributeDisplay = { ...(existing.attributeDisplay ?? {}), ...variant.attributeDisplay };
		}
	}
	return [...buckets.values()];
}

function stripGradesConditions(conditions) {
	if (!Array.isArray(conditions)) {
		return { conditions: [], removed: 0 };
	}
	let removed = 0;
	const next = [];
	for (const condition of conditions) {
		if (!condition || typeof condition !== "object") {
			continue;
		}
		if (condition.type === "grades") {
			removed += 1;
			continue;
		}
		if (condition.type === "group" && Array.isArray(condition.value)) {
			const nested = stripGradesConditions(condition.value);
			removed += nested.removed;
			if (nested.conditions.length === 0) {
				removed += 1;
				continue;
			}
			next.push({ ...condition, value: nested.conditions });
			continue;
		}
		next.push(condition);
	}
	return { conditions: next, removed };
}

async function main() {
	await mongoose.connect(uri);
	const db = mongoose.connection.db;
	const products = db.collection("products");
	const attributes = db.collection("attributes");
	const offers = db.collection("offers");
	const seoSurfaces = db.collection("seosurfaces");
	const grades = db.collection("grades");

	console.log(isDryRun ? "Dry run — no writes." : "Applying grade removal…");

	const productDocs = await products.find({}).project({ variants: 1 }).toArray();
	let productsUpdated = 0;
	let variantsBefore = 0;
	let variantsAfter = 0;

	for (const product of productDocs) {
		const before = product.variants ?? [];
		variantsBefore += before.length;
		const merged = mergeCollidingVariants(before);
		variantsAfter += merged.length;
		const changed =
			before.length !== merged.length || before.some((variant) => Object.prototype.hasOwnProperty.call(variant, "gradeSlug"));
		if (!changed) {
			continue;
		}
		productsUpdated += 1;
		if (!isDryRun) {
			await products.updateOne({ _id: product._id }, { $set: { variants: merged } });
		}
	}

	const gradeVisibility = await attributes.find({ "visibility.type": "grade" }).toArray();
	if (!isDryRun && gradeVisibility.length > 0) {
		await attributes.updateMany(
			{ "visibility.type": "grade" },
			{ $set: { visibility: { type: "always" } }, $unset: { "visibility.gradeSlugs": "" } },
		);
	}
	if (!isDryRun) {
		await attributes.updateMany({}, { $unset: { "visibility.gradeSlugs": "" } });
	}

	const offerDocs = await offers.find({}).project({ conditions: 1, title: 1 }).toArray();
	let offersUpdated = 0;
	let gradeConditionsRemoved = 0;
	for (const offer of offerDocs) {
		const stripped = stripGradesConditions(offer.conditions ?? []);
		if (stripped.removed === 0) {
			continue;
		}
		offersUpdated += 1;
		gradeConditionsRemoved += stripped.removed;
		if (!isDryRun) {
			await offers.updateOne({ _id: offer._id }, { $set: { conditions: stripped.conditions } });
		}
	}

	const seoCount = await seoSurfaces.countDocuments({});
	if (!isDryRun && seoCount > 0) {
		await seoSurfaces.deleteMany({});
	}

	const gradeCount = await grades.countDocuments({});
	if (!isDryRun && gradeCount > 0) {
		await grades.deleteMany({});
	}

	console.log(
		JSON.stringify(
			{
				dryRun: isDryRun,
				productsUpdated,
				variantsBefore,
				variantsAfter,
				attributesGradeVisibilityReset: gradeVisibility.length,
				offersUpdated,
				gradeConditionsRemoved,
				seoSurfacesDeleted: seoCount,
				gradesDeleted: gradeCount,
			},
			null,
			2,
		),
	);

	await mongoose.disconnect();
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
