import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Clock3, Mail, MapPin, MessageCircle, Phone } from "lucide-react";

import { ProductCard } from "@/components/shared/ProductCard";
import { GalleryMotion } from "@/app/concepts/_components/GalleryMotion";
import {
	GALLERY_CONCEPT_MEDIA,
	GALLERY_CRAFT_CHAPTERS,
	buildGalleryCategories,
	loadGalleryHomepageData,
	type GalleryCategory,
	type GalleryContact,
} from "@/app/concepts/_components/galleryConceptData";

import styles from "./textileExhibition.module.css";

export const revalidate = 300;

export const metadata: Metadata = {
	title: "Textile exhibition study",
	description: "An internal textile-led gallery homepage direction for Sister's Outfits.",
	robots: { index: false, follow: false },
	alternates: { canonical: "/" },
};

const MEDIA = GALLERY_CONCEPT_MEDIA["textile-exhibition"];

export default async function TextileExhibitionPage() {
	const data = await loadGalleryHomepageData();
	const categories = buildGalleryCategories(data.categories, MEDIA.categories);

	return (
		<div className={styles.exhibition}>
			<GalleryMotion preset="textile-exhibition">
				<section className={styles.hero}>
					<Image src={MEDIA.hero.src} alt={MEDIA.hero.alt} fill priority sizes="100vw" className={styles.heroImage} data-gallery-hero-image />
					<div className={styles.heroShade} aria-hidden />
					<div className={styles.heroCopy} data-gallery-hero-copy>
						<p className={styles.archiveLabel}>Textile archive / Volume 01</p>
						<p className={styles.wordmark}>{data.contact.siteName}</p>
						<h1>The cloth comes first.</h1>
						<p>Pakistani suits understood through thread, surface, color, and the hands that bring each piece into form.</p>
						<ExhibitionLink href={data.shopHref}>Enter the archive</ExhibitionLink>
					</div>
					<div className={styles.heroIndex}>
						<span>Material</span>
						<span>Motif</span>
						<span>Silhouette</span>
					</div>
				</section>

				<section className={styles.categories} aria-labelledby="textile-categories-title">
					<header data-gallery-reveal>
						<p className={styles.archiveLabel}>Gallery A / Seasonal textiles</p>
						<h2 id="textile-categories-title">Three studies in dress.</h2>
						<p>Each collection begins with a different relationship between cloth and occasion.</p>
					</header>
					<div className={styles.specimens}>
						{categories.map((category, index) => (
							<TextileSpecimen key={category.label} category={category} number={index + 1} />
						))}
					</div>
				</section>

				<section className={styles.craft} aria-labelledby="textile-craft-title" data-gallery-horizontal>
					<header className={styles.craftHeading} data-gallery-reveal>
						<div>
							<p className={styles.archiveLabel}>Gallery B / Process</p>
							<h2 id="textile-craft-title">From fabric to finished suit.</h2>
						</div>
						<p>Move through three material decisions that shape the finished wardrobe.</p>
					</header>
					<div className={styles.craftTrack} data-gallery-horizontal-track>
						{GALLERY_CRAFT_CHAPTERS.map((chapter, index) => (
							<article key={chapter.title} className={styles.craftSpecimen}>
								<figure>
									<Image
										src={MEDIA.craft[index]?.src ?? MEDIA.craft[0].src}
										alt={MEDIA.craft[index]?.alt ?? MEDIA.craft[0].alt}
										fill
										sizes="(max-width: 1024px) 100vw, 58vw"
										className={styles.coverImage}
									/>
								</figure>
								<div>
									<span>Process 0{index + 1}</span>
									<h3>{chapter.title}</h3>
									<p>{chapter.body}</p>
								</div>
							</article>
						))}
					</div>
				</section>

				<section className={styles.products} aria-labelledby="textile-products-title">
					<header data-gallery-reveal>
						<div>
							<p className={styles.archiveLabel}>Gallery C / Current pieces</p>
							<h2 id="textile-products-title">New to the collection.</h2>
						</div>
						<Link href={data.shopHref}>
							Open the complete catalog <ArrowRight size={17} aria-hidden />
						</Link>
					</header>
					{data.products.length > 0 ? (
						<div className={styles.productGrid}>
							{data.products.slice(0, 4).map((product, index) => (
								<div key={product.id} data-gallery-reveal>
									<span className={styles.accessionNumber}>SO / {String(index + 1).padStart(3, "0")}</span>
									<ProductCard product={product} priority={index < 2} />
								</div>
							))}
						</div>
					) : (
						<p className={styles.emptyCollection}>The current collection is being catalogued. Visit the shop to see available pieces.</p>
					)}
				</section>

				<section className={styles.service} aria-labelledby="textile-service-title">
					<figure>
						<Image src={MEDIA.service.src} alt={MEDIA.service.alt} fill sizes="100vw" className={styles.coverImage} data-gallery-parallax />
					</figure>
					<div className={styles.serviceCopy} data-gallery-reveal>
						<p className={styles.archiveLabel}>Material consultation</p>
						<h2 id="textile-service-title">Choose the cloth, then decide the form.</h2>
						<p>Order a finished suit or speak with us about fabric, measurements, and tailoring before selecting an unstitched set.</p>
						<ExhibitionLink href={data.shopHref}>Study the available cloth</ExhibitionLink>
					</div>
				</section>

				<TextileContact contact={data.contact} />
			</GalleryMotion>
		</div>
	);
}

function ExhibitionLink({ children, href }: { children: React.ReactNode; href: string }) {
	return (
		<Link href={href} className={styles.action}>
			{children}
			<ArrowUpRight size={17} aria-hidden />
		</Link>
	);
}

function TextileSpecimen({ category, number }: { category: GalleryCategory; number: number }) {
	const content = (
		<article className={styles.specimen} data-gallery-reveal>
			<div className={styles.specimenIndex}>
				<span>Specimen 0{number}</span>
				<span>{category.href ? "Available" : "In preparation"}</span>
			</div>
			<figure>
				<Image src={category.image.src} alt={category.image.alt} fill sizes="(max-width: 900px) 100vw, 33vw" className={styles.coverImage} data-gallery-parallax />
			</figure>
			<h3>{category.label}</h3>
			<p>{category.description}</p>
		</article>
	);

	return category.href ? (
		<Link href={category.href} className={styles.specimenLink}>
			{content}
		</Link>
	) : (
		content
	);
}

function TextileContact({ contact }: { contact: GalleryContact }) {
	return (
		<section className={styles.contact} aria-labelledby="textile-contact-title">
			<div className={styles.contactImage}>
				<Image src={MEDIA.contact.src} alt={MEDIA.contact.alt} fill sizes="(max-width: 900px) 100vw, 58vw" className={styles.coverImage} data-gallery-parallax />
			</div>
			<div className={styles.contactCopy} data-gallery-reveal>
				<p className={styles.archiveLabel}>Archive visit / Correspondence</p>
				<h2 id="textile-contact-title">See the collection in person.</h2>
				<a href={contact.mapsHref} target="_blank" rel="noopener noreferrer">
					<MapPin size={18} aria-hidden /> {contact.address}
				</a>
				{contact.storeHours ? (
					<p>
						<Clock3 size={18} aria-hidden /> {contact.storeHours}
					</p>
				) : null}
				<div className={styles.contactActions}>
					{contact.whatsappHref ? (
						<a href={contact.whatsappHref} target="_blank" rel="noopener noreferrer">
							<MessageCircle size={17} aria-hidden /> WhatsApp
						</a>
					) : null}
					{contact.phoneHref && contact.phoneNumber ? (
						<a href={contact.phoneHref}>
							<Phone size={17} aria-hidden /> {contact.phoneNumber}
						</a>
					) : null}
					{contact.email ? (
						<a href={`mailto:${contact.email}`}>
							<Mail size={17} aria-hidden /> Email
						</a>
					) : null}
				</div>
			</div>
		</section>
	);
}
