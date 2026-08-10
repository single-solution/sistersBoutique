import "server-only";

import { buildWhatsAppLink, isValidWhatsappNumber, normalizeWhatsappNumber, type Product, type StoreSettings } from "@store/shared";

import { categoryHref, shopHrefFromCategories } from "@/lib/catalog/productPaths";
import { getStoreSettingsCached } from "@/lib/core/cached";
import { getHomeHeroData, loadHomeCategoryTiles, type HomePageCategory } from "@/lib/core/pageData";

const STORE_MAPS_URL = "https://maps.app.goo.gl/ZaHgLTYTNE5BvMu99";

const CATEGORY_FALLBACKS = [
	{ label: "Daily Wear", description: "Light suits for everyday dressing." },
	{ label: "Embroidered", description: "Threadwork pieces for gatherings." },
	{ label: "Festive", description: "Celebration looks for Eid and dinners." },
] as const;

export type GalleryConceptName = "quiet-gallery" | "textile-exhibition" | "couture-salon";

interface GalleryImage {
	src: string;
	alt: string;
}

export interface GalleryConceptMedia {
	hero: GalleryImage;
	categories: readonly [GalleryImage, GalleryImage, GalleryImage];
	craft: readonly [GalleryImage, GalleryImage, GalleryImage];
	service: GalleryImage;
	contact: GalleryImage;
}

export interface GalleryCategory {
	label: string;
	description: string;
	href?: string;
	image: GalleryImage;
}

export interface GalleryContact {
	siteName: string;
	address: string;
	storeHours?: string;
	mapsHref: string;
	whatsappHref?: string;
	phoneNumber?: string;
	phoneHref?: string;
	email?: string;
}

export interface GalleryHomepageData {
	categories: HomePageCategory[];
	products: Product[];
	settings: StoreSettings;
	shopHref: string;
	contact: GalleryContact;
}

export const GALLERY_CONCEPT_MEDIA: Record<GalleryConceptName, GalleryConceptMedia> = {
	"quiet-gallery": {
		hero: {
			src: "https://images.pexels.com/photos/34933675/pexels-photo-34933675.jpeg?auto=compress&cs=tinysrgb&w=1800",
			alt: "Woman wearing a purple embroidered Pakistani suit in an elegant interior",
		},
		categories: [
			{
				src: "https://images.unsplash.com/photo-1773439877634-e6ef9f571c12?auto=format&fit=crop&w=1400&q=82",
				alt: "Woman wearing a blue embroidered Pakistani dress and shawl",
			},
			{
				src: "https://images.pexels.com/photos/35905389/pexels-photo-35905389.jpeg?auto=compress&cs=tinysrgb&w=1400",
				alt: "Traditional dress photographed in the Gilgit-Baltistan landscape",
			},
			{
				src: "https://images.unsplash.com/photo-1773439878437-11da66df98e9?auto=format&fit=crop&w=1400&q=82",
				alt: "Woman wearing a taupe embroidered Pakistani suit with a pink dupatta",
			},
		],
		craft: [
			{
				src: "https://images.pexels.com/photos/9587439/pexels-photo-9587439.jpeg?auto=compress&cs=tinysrgb&w=1400",
				alt: "Floral embroidery worked across a pale textile",
			},
			{
				src: "https://images.pexels.com/photos/36772549/pexels-photo-36772549.jpeg?auto=compress&cs=tinysrgb&w=1400",
				alt: "Close detail of a pink embroidered garment",
			},
			{
				src: "https://images.pexels.com/photos/14825269/pexels-photo-14825269.jpeg?auto=compress&cs=tinysrgb&w=1400",
				alt: "Gold threadwork edging a deep red sleeve",
			},
		],
		service: {
			src: "https://images.unsplash.com/photo-1773439877855-cd193d949717?auto=format&fit=crop&w=1600&q=82",
			alt: "Woman wearing a gray Pakistani suit with black embroidered accents",
		},
		contact: {
			src: "https://images.pexels.com/photos/36634905/pexels-photo-36634905.jpeg?auto=compress&cs=tinysrgb&w=1800",
			alt: "Pakistani fashion portrait in a vintage interior",
		},
	},
	"textile-exhibition": {
		hero: {
			src: "https://images.pexels.com/photos/36526373/pexels-photo-36526373.jpeg?auto=compress&cs=tinysrgb&w=1800",
			alt: "Close view of colorful traditional embroidery and metal embellishment",
		},
		categories: [
			{
				src: "https://images.pexels.com/photos/36772549/pexels-photo-36772549.jpeg?auto=compress&cs=tinysrgb&w=1400",
				alt: "Pink fabric with detailed traditional embroidery",
			},
			{
				src: "https://images.pexels.com/photos/2381469/pexels-photo-2381469.jpeg?auto=compress&cs=tinysrgb&w=1400",
				alt: "Pink textile with gold floral embroidery",
			},
			{
				src: "https://images.pexels.com/photos/9587439/pexels-photo-9587439.jpeg?auto=compress&cs=tinysrgb&w=1400",
				alt: "Hand embroidery across a pale textile",
			},
		],
		craft: [
			{
				src: "https://images.pexels.com/photos/36526373/pexels-photo-36526373.jpeg?auto=compress&cs=tinysrgb&w=1400",
				alt: "Traditional embroidery with mirrored embellishment",
			},
			{
				src: "https://images.pexels.com/photos/14825269/pexels-photo-14825269.jpeg?auto=compress&cs=tinysrgb&w=1400",
				alt: "Gold trimming stitched into red cloth",
			},
			{
				src: "https://images.pexels.com/photos/36406667/pexels-photo-36406667.jpeg?auto=compress&cs=tinysrgb&w=1400",
				alt: "Artisan weaving cloth by hand",
			},
		],
		service: {
			src: "https://images.pexels.com/photos/34933675/pexels-photo-34933675.jpeg?auto=compress&cs=tinysrgb&w=1600",
			alt: "Woman wearing a purple embroidered Pakistani suit",
		},
		contact: {
			src: "https://images.pexels.com/photos/35905389/pexels-photo-35905389.jpeg?auto=compress&cs=tinysrgb&w=1800",
			alt: "Traditional dress surrounded by the landscape of Gilgit-Baltistan",
		},
	},
	"couture-salon": {
		hero: {
			src: "/media/home/hero.webp",
			alt: "Woman in a taupe embroidered Pakistani suit with a pink dupatta",
		},
		categories: [
			{
				src: "/media/home/category-01.webp",
				alt: "Model wearing a red traditional Pakistani ensemble",
			},
			{
				src: "/media/home/category-02.webp",
				alt: "Woman wearing a blue embroidered dress and shawl",
			},
			{
				src: "/media/home/category-03.webp",
				alt: "Woman wearing a gray suit with black embroidered accents",
			},
		],
		craft: [
			{
				src: "/media/home/craft-01.webp",
				alt: "Pink embroidered garment in close detail",
			},
			{
				src: "/media/home/craft-02.webp",
				alt: "Colorful traditional embroidery and embellishment",
			},
			{
				src: "/media/home/craft-03.webp",
				alt: "Gold floral embroidery on saturated pink cloth",
			},
		],
		service: {
			src: "/media/home/service.webp",
			alt: "Woman wearing a purple embroidered Pakistani suit",
		},
		contact: {
			src: "/media/home/contact.webp",
			alt: "Model wearing an embroidered burgundy velvet dress in a Lahore interior",
		},
	},
};

export const GALLERY_CRAFT_CHAPTERS = [
	{
		title: "Cloth chosen for the season.",
		body: "Breathable lawn and cotton for everyday wear, with richer textures reserved for formal pieces.",
	},
	{
		title: "Embroidery with restraint.",
		body: "Threadwork, borders, and motifs are selected to frame the silhouette without overwhelming it.",
	},
	{
		title: "Finished for real occasions.",
		body: "Choose unstitched fabric for your own tailor or a ready-to-wear piece prepared for the wardrobe.",
	},
] as const;

export async function loadGalleryHomepageData(): Promise<GalleryHomepageData> {
	const [categories, heroData, settings] = await Promise.all([loadHomeCategoryTiles(), getHomeHeroData(), getStoreSettingsCached()]);

	return {
		categories,
		products: heroData.heroProducts,
		settings,
		shopHref: shopHrefFromCategories(categories),
		contact: buildGalleryContact(settings),
	};
}

export function buildGalleryCategories(categories: HomePageCategory[], images: GalleryConceptMedia["categories"]): GalleryCategory[] {
	return CATEGORY_FALLBACKS.map((fallback, index) => {
		const category = categories[index];
		return {
			label: category?.label ?? fallback.label,
			description: category?.description || fallback.description,
			href: category?.isActive ? categoryHref(category.slug) : undefined,
			image: images[index] ?? images[0],
		};
	});
}

function buildGalleryContact(settings: StoreSettings): GalleryContact {
	const siteName = settings?.siteName?.trim() || "Sister's Outfits";
	const whatsappDigits = normalizeWhatsappNumber(settings?.whatsappNumber ?? "");
	const whatsappHref = isValidWhatsappNumber(whatsappDigits) ? buildWhatsAppLink(`Salam, I would like to ask about suits at ${siteName}.`, whatsappDigits) : undefined;
	const phoneNumber = settings?.supportPhone?.trim() || settings?.supportLandline?.trim();
	const phoneHref = phoneNumber ? `tel:${phoneNumber.replace(/[^\d+]/g, "")}` : undefined;
	const email = settings?.supportEmail?.trim() || undefined;
	const addressParts = [settings?.storeAddressLine1?.trim(), settings?.storeAddressLine2?.trim()].filter(Boolean);

	return {
		siteName,
		address: addressParts.length > 0 ? addressParts.join(", ") : "Chak 243 GB Kalyan Pur, 56000, Pakistan",
		storeHours: settings?.storeHours?.trim() || undefined,
		mapsHref: settings?.socialGoogleMaps?.trim() || STORE_MAPS_URL,
		whatsappHref,
		phoneNumber,
		phoneHref,
		email,
	};
}
