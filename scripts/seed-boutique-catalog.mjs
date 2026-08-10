/**
 * Wipe-and-seed the Sister's Outfits catalog.
 *
 * Sister's Outfits is the STORE. Products carry real Pakistani womenswear
 * brand names (Khaadi, Sapphire, Gul Ahmed, …) — the store resells them.
 *
 * Categories = look / occasion (Daily Wear, Embroidered, Formals, Festive).
 * Attribute `type` = Stitched | Unstitched (filterable on every category).
 *
 * Product photography uses professional, licensed stock imagery (Pexels /
 * Unsplash) already whitelisted in next.config remotePatterns.
 *
 * Usage: npm run seed:catalog
 */
import { MongoClient, ObjectId } from "mongodb";

const DATABASE_CONNECTION_TIMEOUT_MS = 20_000;
const BLUR_DATA_URL = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";
const IMAGE_WIDTH = 1200;
const IMAGE_HEIGHT = 1600;

/* ─────────────────────────── Categories ─────────────────────────── */

const CATEGORIES = [
	{
		slug: "daily-wear",
		label: "Daily Wear",
		description: "Light, breathable lawn and cotton suits for workdays, errands, and easy everyday dressing.",
		icon: "Package",
		sortOrder: 10,
	},
	{
		slug: "embroidered",
		label: "Embroidered",
		description: "Threadwork, chikankari, and bordered pieces for gatherings where the detail matters.",
		icon: "Package",
		sortOrder: 20,
	},
	{
		slug: "formals",
		label: "Formals",
		description: "Evening and party looks in chiffon, silk, and organza with a softer, dressier structure.",
		icon: "Package",
		sortOrder: 30,
	},
	{
		slug: "festive",
		label: "Festive",
		description: "Eid, mehndi, and celebration ensembles chosen for colour, drape, and photograph-ready finish.",
		icon: "Package",
		sortOrder: 40,
	},
];

/* ─────────────────────────── Brands ─────────────────────────── */
/* Real Pakistani womenswear labels the boutique stocks. Sister's Outfits
 * is the store name and is intentionally NOT a brand. */

const BRANDS = [
	{ slug: "khaadi", name: "Khaadi" },
	{ slug: "sapphire", name: "Sapphire" },
	{ slug: "gul-ahmed", name: "Gul Ahmed" },
	{ slug: "alkaram-studio", name: "Alkaram Studio" },
	{ slug: "nishat-linen", name: "Nishat Linen" },
	{ slug: "maria-b", name: "Maria B." },
	{ slug: "sana-safinaz", name: "Sana Safinaz" },
	{ slug: "bareeze", name: "Bareeze" },
	{ slug: "cross-stitch", name: "Cross Stitch" },
	{ slug: "limelight", name: "Limelight" },
];

/* ─────────────────────────── Attributes ─────────────────────────── */

const SHARED_ATTRIBUTE_DEFS = [
	{
		slug: "type",
		label: "Type",
		cardPosition: "title-chips",
		visibility: { type: "always" },
		options: [
			{ value: "stitched", label: "Stitched" },
			{ value: "unstitched", label: "Unstitched" },
		],
	},
	{
		slug: "color",
		label: "Colour",
		cardPosition: "image-overlay",
		visibility: { type: "always" },
		options: [
			{ value: "ivory", label: "Ivory" },
			{ value: "blush", label: "Blush" },
			{ value: "rose", label: "Rose" },
			{ value: "sage", label: "Sage" },
			{ value: "powder-blue", label: "Powder Blue" },
			{ value: "navy", label: "Navy" },
			{ value: "charcoal", label: "Charcoal" },
			{ value: "black", label: "Black" },
			{ value: "marigold", label: "Marigold" },
			{ value: "mustard", label: "Mustard" },
			{ value: "rust", label: "Rust" },
			{ value: "maroon", label: "Maroon" },
			{ value: "plum", label: "Plum" },
			{ value: "teal", label: "Teal" },
		],
	},
	{
		slug: "pieces",
		label: "Pieces",
		cardPosition: "title-chips",
		visibility: { type: "always" },
		options: [
			{ value: "1pc", label: "1 Piece" },
			{ value: "2pc", label: "2 Piece" },
			{ value: "3pc", label: "3 Piece" },
		],
	},
	{
		slug: "fabric",
		label: "Fabric",
		cardPosition: "title-chips",
		visibility: { type: "always" },
		options: [
			{ value: "lawn", label: "Lawn" },
			{ value: "cotton", label: "Cotton" },
			{ value: "cambric", label: "Cambric" },
			{ value: "khaddar", label: "Khaddar" },
			{ value: "chiffon", label: "Chiffon" },
			{ value: "organza", label: "Organza" },
			{ value: "silk", label: "Silk" },
			{ value: "jacquard", label: "Jacquard" },
			{ value: "net", label: "Net" },
			{ value: "velvet", label: "Velvet" },
		],
	},
	{
		slug: "size",
		label: "Size",
		cardPosition: "title-chips",
		visibility: { type: "always" },
		options: [
			{ value: "xs", label: "XS" },
			{ value: "s", label: "S" },
			{ value: "m", label: "M" },
			{ value: "l", label: "L" },
			{ value: "xl", label: "XL" },
		],
	},
];

/* ─────────────────────────── Media ───────────────────────────
 * Professional, whitelisted stock photography. Keys describe content so
 * product galleries can be composed with a "look" hero + detail shots. */

const MEDIA = {
	lookPurple: {
		src: "https://images.pexels.com/photos/34933675/pexels-photo-34933675.jpeg?auto=compress&cs=tinysrgb&w=1400",
		alt: "Model wearing a purple embroidered Pakistani suit in an elegant interior",
	},
	lookBlue: {
		src: "https://images.unsplash.com/photo-1773439877634-e6ef9f571c12?auto=format&fit=crop&w=1400&q=82",
		alt: "Model wearing a blue embroidered Pakistani suit with a shawl",
	},
	lookLandscape: {
		src: "https://images.pexels.com/photos/35905389/pexels-photo-35905389.jpeg?auto=compress&cs=tinysrgb&w=1400",
		alt: "Model in a traditional Pakistani three-piece photographed outdoors",
	},
	lookTaupe: {
		src: "https://images.unsplash.com/photo-1773439878437-11da66df98e9?auto=format&fit=crop&w=1400&q=82",
		alt: "Model wearing a taupe embroidered suit with a pink dupatta",
	},
	lookGray: {
		src: "https://images.unsplash.com/photo-1773439877855-cd193d949717?auto=format&fit=crop&w=1400&q=82",
		alt: "Model wearing a grey Pakistani suit with black embroidered accents",
	},
	lookVintage: {
		src: "https://images.pexels.com/photos/36634905/pexels-photo-36634905.jpeg?auto=compress&cs=tinysrgb&w=1400",
		alt: "Pakistani fashion portrait in a warm vintage interior",
	},
	detailFloralPale: {
		src: "https://images.pexels.com/photos/9587439/pexels-photo-9587439.jpeg?auto=compress&cs=tinysrgb&w=1400",
		alt: "Floral embroidery worked across a pale textile",
	},
	detailPink: {
		src: "https://images.pexels.com/photos/36772549/pexels-photo-36772549.jpeg?auto=compress&cs=tinysrgb&w=1400",
		alt: "Close detail of a pink embroidered garment",
	},
	detailGoldRed: {
		src: "https://images.pexels.com/photos/14825269/pexels-photo-14825269.jpeg?auto=compress&cs=tinysrgb&w=1400",
		alt: "Gold threadwork edging a deep red sleeve",
	},
	detailMirror: {
		src: "https://images.pexels.com/photos/36526373/pexels-photo-36526373.jpeg?auto=compress&cs=tinysrgb&w=1400",
		alt: "Colourful traditional embroidery with mirror embellishment",
	},
	detailPinkGold: {
		src: "https://images.pexels.com/photos/2381469/pexels-photo-2381469.jpeg?auto=compress&cs=tinysrgb&w=1400",
		alt: "Pink textile with gold floral embroidery",
	},
	detailWeave: {
		src: "https://images.pexels.com/photos/36406667/pexels-photo-36406667.jpeg?auto=compress&cs=tinysrgb&w=1400",
		alt: "Artisan weaving fabric by hand on a loom",
	},
};

function gallery(items) {
	return items.map(({ src, alt }) => ({
		variants: { thumb: src, card: src, detail: src, full: src },
		blurDataURL: BLUR_DATA_URL,
		width: IMAGE_WIDTH,
		height: IMAGE_HEIGHT,
		alt,
	}));
}

/** Look (full-body) and detail (close-up) shots, alternated to build galleries. */
const LOOK_MEDIA = [MEDIA.lookTaupe, MEDIA.lookPurple, MEDIA.lookBlue, MEDIA.lookLandscape, MEDIA.lookGray, MEDIA.lookVintage];
const DETAIL_MEDIA = [MEDIA.detailFloralPale, MEDIA.detailPink, MEDIA.detailGoldRed, MEDIA.detailMirror, MEDIA.detailPinkGold, MEDIA.detailWeave];

/** Compose a `count`-image gallery that alternates look → detail, seeded for variety. */
function buildGallery(seed, count = 7) {
	const items = [];
	for (let index = 0; index < count; index += 1) {
		const pool = index % 2 === 0 ? LOOK_MEDIA : DETAIL_MEDIA;
		items.push(pool[(seed + index) % pool.length]);
	}
	return gallery(items);
}

function descriptionHtml(blocks) {
	return blocks.join("");
}

/* ─────────────────────────── Variant builders ─────────────────────────── */

const STITCHED_SIZES = ["xs", "s", "m", "l", "xl"];
const SIZE_STOCK = { xs: 3, s: 6, m: 9, l: 7, xl: 4 };
const SIZE_UPCHARGE = { xs: 0, s: 0, m: 0, l: 0, xl: 200 };

function stitchedVariants({ basePrice, colors, pieces, fabric }) {
	const variants = [];
	for (const color of colors) {
		for (const size of STITCHED_SIZES) {
			variants.push({
				_id: new ObjectId(),
				priceRupees: basePrice + SIZE_UPCHARGE[size],
				quantity: SIZE_STOCK[size],
				forceOutOfStock: false,
				attributes: { type: "stitched", color, pieces, fabric, size },
			});
		}
	}
	return variants;
}

function unstitchedVariants({ basePrice, colors, pieces, fabric }) {
	return colors.map((color, index) => ({
		_id: new ObjectId(),
		priceRupees: basePrice + index * 150,
		quantity: 12 + index * 3,
		forceOutOfStock: false,
		attributes: { type: "unstitched", color, pieces, fabric },
	}));
}

/* ─────────────────────────── Size charts ─────────────────────────── */
/* Measurements stored canonically in INCHES; the storefront derives cm.
 * Row `sizeValue`s mirror the `size` attribute options (xs..xl). */

const CHART_SIZE_ROWS = [
	["xs", "XS"],
	["s", "S"],
	["m", "M"],
	["l", "L"],
	["xl", "XL"],
];

function chartRows(valuesByKey) {
	return CHART_SIZE_ROWS.map(([sizeValue, label], index) => ({
		sizeValue,
		label,
		values: Object.fromEntries(Object.entries(valuesByKey).map(([key, values]) => [key, values[index]])),
	}));
}

const CHART_MEASUREMENT_KEYS = [
	{ key: "bust", label: "Bust" },
	{ key: "waist", label: "Waist" },
	{ key: "hip", label: "Hip" },
	{ key: "shoulder", label: "Shoulder" },
	{ key: "kameez", label: "Kameez length" },
	{ key: "sleeve", label: "Sleeve length" },
	{ key: "trouser", label: "Trouser length" },
];

const STANDARD_CHART_ID = new ObjectId();
const FORMAL_CHART_ID = new ObjectId();

const SIZE_CHARTS = [
	{
		_id: STANDARD_CHART_ID,
		name: "Stitched Suit — Standard",
		unitPrimary: "in",
		measurementKeys: CHART_MEASUREMENT_KEYS,
		rows: chartRows({
			bust: [32, 34, 36, 38, 41],
			waist: [26, 28, 30, 33, 36],
			hip: [35, 37, 39, 41, 44],
			shoulder: [14, 14.5, 15, 15.5, 16],
			kameez: [38, 39, 40, 41, 42],
			sleeve: [20, 20.5, 21, 21.5, 22],
			trouser: [38, 38.5, 39, 39.5, 40],
		}),
		fitAdvice: "Cut for a relaxed, true-to-size everyday fit. If you're between two sizes, size up for comfort.",
		notes: "Measurements are body measurements, not garment dimensions. Measure over light clothing.",
	},
	{
		_id: FORMAL_CHART_ID,
		name: "Formal & Festive — Slim",
		unitPrimary: "in",
		measurementKeys: CHART_MEASUREMENT_KEYS,
		rows: chartRows({
			bust: [32, 34, 36, 38, 40],
			waist: [25, 27, 29, 31, 34],
			hip: [34, 36, 38, 40, 42],
			shoulder: [14, 14.5, 15, 15.5, 16],
			kameez: [40, 41, 42, 43, 44],
			sleeve: [21, 21.5, 22, 22.5, 23],
			trouser: [39, 39.5, 40, 40.5, 41],
		}),
		fitAdvice: "A slimmer, dressier cut with a longer kameez. Between sizes? Choose the larger for an easy drape.",
		notes: "Formal linings can reduce give — allow a little ease across bust and hip.",
	},
];

/** Each category inherits a default chart; stitched products resolve it unless overridden. */
const CATEGORY_DEFAULT_CHART = {
	"daily-wear": STANDARD_CHART_ID,
	embroidered: STANDARD_CHART_ID,
	formals: FORMAL_CHART_ID,
	festive: FORMAL_CHART_ID,
};

/* ─────────────────────────── Products (generated) ─────────────────────────── */
/* At least 10 products per category × type (stitched / unstitched) so every
 * filter combination is well populated. Names, brands, fabrics, colours,
 * prices, and galleries are seeded deterministically for variety. */

const PRODUCTS_PER_COMBINATION = 10;

const COLOR_OPTIONS = SHARED_ATTRIBUTE_DEFS.find((attribute) => attribute.slug === "color").options;
const FABRIC_OPTIONS = SHARED_ATTRIBUTE_DEFS.find((attribute) => attribute.slug === "fabric").options;
const COLOR_VALUES = COLOR_OPTIONS.map((option) => option.value);

function labelOf(options, value) {
	return options.find((option) => option.value === value)?.label ?? value;
}

const CATEGORY_LABEL = {
	"daily-wear": "Daily Wear",
	embroidered: "Embroidered",
	formals: "Formal",
	festive: "Festive",
};

const FABRICS_BY_CATEGORY = {
	"daily-wear": ["lawn", "cotton", "cambric", "khaddar"],
	embroidered: ["lawn", "cambric", "cotton", "chiffon"],
	formals: ["chiffon", "silk", "organza", "jacquard"],
	festive: ["velvet", "silk", "jacquard", "net"],
};

const BASE_PRICE_BY_CATEGORY = {
	"daily-wear": 5_490,
	embroidered: 8_990,
	formals: 17_900,
	festive: 12_900,
};

const PRICE_STEP_BY_CATEGORY = {
	"daily-wear": 400,
	embroidered: 600,
	formals: 1_500,
	festive: 1_200,
};

const STITCHED_TITLES = ["Classic", "Everyday", "Signature", "Heritage", "Luxe", "Soft-Bloom", "Aster", "Meadow", "Twilight", "Rosemead"];
const UNSTITCHED_TITLES = ["Bespoke", "Tailor's", "Custom", "Atelier", "Maker's", "Loom", "Craft", "Studio", "Panelled", "Yardage"];

function slugify(text) {
	return text
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/(^-|-$)/g, "");
}

function piecesLabel(pieces) {
	return pieces === "2pc" ? "2 Piece" : "3 Piece";
}

function buildProductDescription({ colorLabel, fabricLabel, categoryLabel, brandName, isUnstitched, pieces }) {
	const pieceText = piecesLabel(pieces);
	if (isUnstitched) {
		return descriptionHtml([
			`<h2>${colorLabel} ${fabricLabel.toLowerCase()} — cut it your way</h2>`,
			`<p>${brandName} delivers this ${categoryLabel.toLowerCase()} look unstitched, so your tailor sets the kameez length, sleeve, and finish exactly to you. The ${fabricLabel.toLowerCase()} ground carries a ${colorLabel.toLowerCase()} tone that wears from day into evening.</p>`,
			"<h3>What's included</h3>",
			`<ul><li>Unstitched ${pieceText.toLowerCase()}: shirt yardage, trouser cloth, dupatta</li><li>${fabricLabel} fabric with a clean, ready-to-cut finish</li><li>Measurement card to hand your tailor</li></ul>`,
			"<p><strong>Made to measure:</strong> take your measurements over light clothing for the closest fit.</p>",
			"<blockquote>Care: first wash separately — deeper tones may release excess dye; line dry in shade.</blockquote>",
		]);
	}
	return descriptionHtml([
		`<h2>${colorLabel} ${fabricLabel.toLowerCase()}, ready to wear</h2>`,
		`<p>A stitched ${categoryLabel.toLowerCase()} ${pieceText.toLowerCase()} from ${brandName} in a ${colorLabel.toLowerCase()} ${fabricLabel.toLowerCase()}. Finished hems and sleeves mean it is ready the moment it arrives — no tailoring needed.</p>`,
		"<h3>What's included</h3>",
		`<ul><li>Stitched ${pieceText.toLowerCase()}${pieces === "3pc" ? ": shirt, trouser, dupatta" : ": shirt + trouser"}</li><li>${fabricLabel} fabric, true-to-size fit</li><li>Care card included</li></ul>`,
		"<p><strong>Style it:</strong> keep accessories simple and let the colour lead.</p>",
		"<blockquote>Care: follow the fabric care card; press on reverse.</blockquote>",
	]);
}

function generateProducts() {
	const products = [];
	CATEGORIES.forEach((category, categoryIndex) => {
		const categoryLabel = CATEGORY_LABEL[category.slug];
		const fabrics = FABRICS_BY_CATEGORY[category.slug];
		const basePrice = BASE_PRICE_BY_CATEGORY[category.slug];
		const priceStep = PRICE_STEP_BY_CATEGORY[category.slug];

		for (const isUnstitched of [false, true]) {
			const typeOffset = isUnstitched ? 5 : 0;
			for (let index = 0; index < PRODUCTS_PER_COMBINATION; index += 1) {
				const brand = BRANDS[(categoryIndex * 3 + typeOffset + index) % BRANDS.length];
				const fabric = fabrics[index % fabrics.length];
				const fabricLabel = labelOf(FABRIC_OPTIONS, fabric);

				const primaryColor = COLOR_VALUES[(categoryIndex * 4 + index) % COLOR_VALUES.length];
				let secondaryColor = COLOR_VALUES[(categoryIndex * 4 + index + 5) % COLOR_VALUES.length];
				if (secondaryColor === primaryColor) {
					secondaryColor = COLOR_VALUES[(categoryIndex * 4 + index + 6) % COLOR_VALUES.length];
				}
				let tertiaryColor = COLOR_VALUES[(categoryIndex * 4 + index + 9) % COLOR_VALUES.length];
				if (tertiaryColor === primaryColor || tertiaryColor === secondaryColor) {
					tertiaryColor = COLOR_VALUES[(categoryIndex * 4 + index + 10) % COLOR_VALUES.length];
				}
				const colorLabel = labelOf(COLOR_OPTIONS, primaryColor);

				const titleWord = (isUnstitched ? UNSTITCHED_TITLES : STITCHED_TITLES)[index % PRODUCTS_PER_COMBINATION];
				const name = `${titleWord} ${colorLabel} ${fabricLabel}`;
				const slug = `${slugify(name)}-${category.slug}-${isUnstitched ? "u" : "s"}${index + 1}`;

				const pieces = isUnstitched ? "3pc" : index % 3 === 0 ? "2pc" : "3pc";
				const price = basePrice + index * priceStep;
				const gallerySeed = categoryIndex * 7 + typeOffset + index;

				const description = buildProductDescription({ colorLabel, fabricLabel, categoryLabel, brandName: brand.name, isUnstitched, pieces });

				if (isUnstitched) {
					products.push({
						slug,
						name,
						categorySlug: category.slug,
						brandSlug: brand.slug,
						isFeatured: false,
						images: buildGallery(gallerySeed),
						descriptionHtml: description,
						attributeSlugs: ["type", "color", "pieces", "fabric"],
						attributeOptionPool: { type: ["unstitched"], color: [primaryColor, secondaryColor, tertiaryColor], pieces: [pieces], fabric: [fabric] },
						variants: unstitchedVariants({ basePrice: price, colors: [primaryColor, secondaryColor, tertiaryColor], pieces, fabric }),
					});
					continue;
				}

				// Demo the full inheritance chain on the first daily-wear stitched items:
				// index 0 overrides with the formal chart; index 1 hides the guide.
				const isChartOverride = category.slug === "daily-wear" && index === 0;
				const isHiddenGuide = category.slug === "daily-wear" && index === 1;

				products.push({
					slug,
					name,
					categorySlug: category.slug,
					brandSlug: brand.slug,
					isFeatured: index < 2,
					images: buildGallery(gallerySeed),
					descriptionHtml: description,
					attributeSlugs: ["type", "color", "pieces", "fabric", "size"],
					attributeOptionPool: { type: ["stitched"], color: [primaryColor, secondaryColor], pieces: [pieces], fabric: [fabric], size: STITCHED_SIZES },
					variants: stitchedVariants({ basePrice: price, colors: [primaryColor, secondaryColor], pieces, fabric }),
					...(isChartOverride ? { sizeChartId: FORMAL_CHART_ID } : {}),
					...(isHiddenGuide ? { hideSizeGuide: true } : {}),
				});
			}
		}
	});
	return products;
}

const PRODUCTS = generateProducts();

/* ─────────────────────────── Seed runner ─────────────────────────── */

function buildProductDocument(product, now) {
	return {
		slug: product.slug,
		name: product.name,
		brandSlug: product.brandSlug,
		categorySlug: product.categorySlug,
		isActive: true,
		isArchived: false,
		isFeatured: Boolean(product.isFeatured),
		images: product.images,
		descriptionHtml: product.descriptionHtml,
		attributeSlugs: product.attributeSlugs,
		attributeOptionPool: product.attributeOptionPool,
		attributeCustomOptions: {},
		attributeDefaults: {},
		variants: product.variants,
		...(product.sizeChartId ? { sizeChartId: product.sizeChartId } : {}),
		...(product.hideSizeGuide ? { hideSizeGuide: true } : {}),
		seo: {},
		createdAt: now,
		updatedAt: now,
	};
}

async function seedBoutiqueCatalog() {
	const mongoUri = process.env.MONGODB_URI;
	if (!mongoUri) {
		throw new Error("MONGODB_URI environment variable is not set.");
	}

	const client = new MongoClient(mongoUri, {
		serverSelectionTimeoutMS: DATABASE_CONNECTION_TIMEOUT_MS,
		retryReads: true,
		retryWrites: true,
	});

	try {
		await client.connect();
		const db = client.db();
		const now = new Date();
		const categorySlugs = CATEGORIES.map((category) => category.slug);

		await db.collection("products").deleteMany({});
		await db.collection("attributes").deleteMany({});
		await db.collection("brands").deleteMany({});
		await db.collection("categories").deleteMany({});
		await db.collection("seosurfaces").deleteMany({});
		await db.collection("sizecharts").deleteMany({});

		await db.collection("sizecharts").insertMany(
			SIZE_CHARTS.map((chart) => ({
				...chart,
				isActive: true,
				createdAt: now,
				updatedAt: now,
			})),
		);

		await db.collection("categories").insertMany(
			CATEGORIES.map((category) => ({
				...category,
				isActive: true,
				...(CATEGORY_DEFAULT_CHART[category.slug] ? { defaultSizeChartId: CATEGORY_DEFAULT_CHART[category.slug] } : {}),
				seo: {},
				createdAt: now,
				updatedAt: now,
			})),
		);

		await db.collection("brands").insertMany(
			BRANDS.map((brand) => ({
				slug: brand.slug,
				name: brand.name,
				categorySlugs,
				isActive: true,
				seo: {},
				createdAt: now,
				updatedAt: now,
			})),
		);

		const attributeDocs = [];
		for (const category of CATEGORIES) {
			for (const attribute of SHARED_ATTRIBUTE_DEFS) {
				attributeDocs.push({
					categorySlug: category.slug,
					slug: attribute.slug,
					label: attribute.label,
					options: attribute.options,
					visibility: attribute.visibility,
					cardPosition: attribute.cardPosition,
					isActive: true,
					seo: {},
					createdAt: now,
					updatedAt: now,
				});
			}
		}
		await db.collection("attributes").insertMany(attributeDocs);

		const productDocs = PRODUCTS.map((product) => buildProductDocument(product, now));
		await db.collection("products").insertMany(productDocs);

		process.stdout.write(
			[
				`Boutique catalog wiped and reseeded in '${db.databaseName}'.`,
				`Categories: ${CATEGORIES.length} (Daily Wear, Embroidered, Formals, Festive), each with a default size chart.`,
				`Brands: ${BRANDS.length} real labels (Sister's Outfits is the store, not a brand).`,
				`Attributes: ${attributeDocs.length} (${SHARED_ATTRIBUTE_DEFS.length} per category; Type = Stitched|Unstitched).`,
				`Size charts: ${SIZE_CHARTS.length} (Standard + Formal/Slim), inches canonical.`,
				`Products: ${productDocs.length} (${PRODUCTS_PER_COMBINATION}+ per category × type) with 7-image galleries and rich HTML descriptions.`,
				"",
			].join("\n"),
		);
	} finally {
		await client.close();
	}
}

seedBoutiqueCatalog().catch((error) => {
	process.stderr.write(`${error instanceof Error ? error.message : "Catalog seed failed."}\n`);
	process.exitCode = 1;
});
