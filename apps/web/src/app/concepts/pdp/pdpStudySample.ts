/**
 * Static sample garment for PDP layout studies — no catalog dependency.
 */

export interface PdpStudyLook {
	id: string;
	label: string;
	src: string;
	alt: string;
}

export interface PdpStudyOption {
	id: string;
	label: string;
}

export interface PdpStudyRelated {
	id: string;
	name: string;
	src: string;
	alt: string;
	priceRupees: number;
}

export interface PdpStudySample {
	name: string;
	brandName: string;
	categoryLabel: string;
	categoryHref: string;
	brandHref: string;
	lookNumber: string;
	priceRupees: number;
	descriptionHtml: string;
	looks: PdpStudyLook[];
	related: PdpStudyRelated[];
	sizes: PdpStudyOption[];
	colours: PdpStudyOption[];
}

export const PDP_STUDY_SAMPLE: PdpStudySample = {
	name: "Ivory garden lawn — three-piece",
	brandName: "Sister's Outfits",
	categoryLabel: "Pret",
	categoryHref: "/concepts/shop",
	brandHref: "/concepts/shop",
	lookNumber: "Look 07",
	priceRupees: 12_800,
	descriptionHtml: `
		<p>Hand-finished embroidery on <strong>mid-weight lawn</strong> — soft structure in the kurta, ease through the trousers, and a light chiffon dupatta meant to move.</p>
		<p>Wear it for daytime gatherings or a quieter evening; the palette stays warm against soft blush tones.</p>
		<h2>What's included</h2>
		<ul>
			<li>Embroidered lawn shirt with covered buttons</li>
			<li>Matching trouser with a soft waist</li>
			<li>Chiffon dupatta finished with a delicate edge</li>
		</ul>
		<blockquote>Stitch care: cold wash, line dry, warm iron on the reverse.</blockquote>
	`.trim(),
	looks: [
		{
			id: "look-1",
			label: "Look 01",
			src: "https://images.unsplash.com/photo-1773439877634-e6ef9f571c12?auto=format&fit=crop&w=1600&q=82",
			alt: "Woman in a blue embroidered Pakistani dress",
		},
		{
			id: "look-2",
			label: "Look 02",
			src: "https://images.unsplash.com/photo-1773439878437-11da66df98e9?auto=format&fit=crop&w=1600&q=82",
			alt: "Woman in a taupe embroidered suit with pink dupatta",
		},
		{
			id: "look-3",
			label: "Look 03",
			src: "https://images.unsplash.com/photo-1773439877855-cd193d949717?auto=format&fit=crop&w=1600&q=82",
			alt: "Woman in a gray Pakistani suit with black embroidery",
		},
		{
			id: "look-4",
			label: "Look 04",
			src: "https://images.unsplash.com/photo-1773439877634-e6ef9f571c12?auto=format&fit=crop&w=1200&q=70&sat=-20",
			alt: "Detail frame of embroidered dress",
		},
		{
			id: "look-5",
			label: "Look 05",
			src: "https://images.unsplash.com/photo-1773439878437-11da66df98e9?auto=format&fit=crop&w=1400&q=80",
			alt: "Alternate angle of taupe embroidered suit",
		},
	],
	related: [
		{
			id: "rel-1",
			name: "Blush mist chiffon — two-piece",
			src: "https://images.unsplash.com/photo-1773439878437-11da66df98e9?auto=format&fit=crop&w=900&q=78",
			alt: "Related blush mist outfit",
			priceRupees: 9_800,
		},
		{
			id: "rel-2",
			name: "Charcoal botanic — three-piece",
			src: "https://images.unsplash.com/photo-1773439877855-cd193d949717?auto=format&fit=crop&w=900&q=78",
			alt: "Related charcoal botanic outfit",
			priceRupees: 11_400,
		},
		{
			id: "rel-3",
			name: "Soft iris lawn — dupatta set",
			src: "https://images.unsplash.com/photo-1773439877634-e6ef9f571c12?auto=format&fit=crop&w=900&q=78",
			alt: "Related soft iris lawn outfit",
			priceRupees: 10_200,
		},
	],
	sizes: [
		{ id: "s", label: "S" },
		{ id: "m", label: "M" },
		{ id: "l", label: "L" },
		{ id: "xl", label: "XL" },
	],
	colours: [
		{ id: "ivory", label: "Ivory" },
		{ id: "blush", label: "Blush mist" },
		{ id: "wine", label: "Deep wine" },
	],
};
