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

import styles from "./quietGallery.module.css";

export const revalidate = 300;

export const metadata: Metadata = {
	title: "Quiet fashion gallery study",
	description: "An internal luxury gallery homepage direction for Sister's Outfits.",
	robots: { index: false, follow: false },
	alternates: { canonical: "/" },
};

const MEDIA = GALLERY_CONCEPT_MEDIA["quiet-gallery"];

export default async function QuietGalleryPage() {
	const data = await loadGalleryHomepageData();
	const categories = buildGalleryCategories(data.categories, MEDIA.categories);

	return (
		<div className={styles.gallery}>
			<GalleryMotion preset="quiet-gallery">
				<section className={styles.hero}>
					<div className={styles.heroCopy} data-gallery-hero-copy>
						<p className={styles.exhibitionLabel}>Private collection / 01</p>
						<p className={styles.wordmark}>{data.contact.siteName}</p>
						<h1>Pakistani dressing, collected with a quieter eye.</h1>
						<p className={styles.heroIntroduction}>A considered edit of stitched and unstitched suits, presented as pieces to live with rather than products to pass by.</p>
						<GalleryLink href={data.shopHref}>Enter the collection</GalleryLink>
					</div>
					<figure className={styles.heroPortrait}>
						<Image src={MEDIA.hero.src} alt={MEDIA.hero.alt} fill priority sizes="(max-width: 900px) 100vw, 58vw" className={styles.coverImage} data-gallery-hero-image />
						<figcaption>
							<span>Portrait 01</span>
							<span>Embroidered form / Lahore</span>
						</figcaption>
					</figure>
					<p className={styles.scrollNote}>Scroll to view the rooms</p>
				</section>

				<section className={styles.collection} aria-labelledby="quiet-collection-title">
					<div className={styles.sectionIntroduction} data-gallery-reveal>
						<p className={styles.exhibitionLabel}>Room I / Seasonal forms</p>
						<h2 id="quiet-collection-title">Three ways to dress the season.</h2>
						<p>Color, cloth, and silhouette are given enough space to be seen properly.</p>
					</div>
					<div className={styles.categoryRooms}>
						{categories.map((category, index) => (
							<GalleryCategoryRoom key={category.label} category={category} number={index + 1} />
						))}
					</div>
				</section>

				<section className={styles.craft} aria-labelledby="quiet-craft-title">
					<header className={styles.craftHeading} data-gallery-reveal>
						<p className={styles.exhibitionLabel}>Room II / The making</p>
						<h2 id="quiet-craft-title">From fabric to finished suit.</h2>
					</header>
					<div className={styles.craftSequence}>
						{GALLERY_CRAFT_CHAPTERS.map((chapter, index) => (
							<article key={chapter.title} className={styles.craftChapter} data-gallery-reveal>
								<figure>
									<Image
										src={MEDIA.craft[index]?.src ?? MEDIA.craft[0].src}
										alt={MEDIA.craft[index]?.alt ?? MEDIA.craft[0].alt}
										fill
										sizes="(max-width: 900px) 100vw, 54vw"
										className={styles.coverImage}
										data-gallery-parallax
									/>
								</figure>
								<div>
									<span>0{index + 1}</span>
									<h3>{chapter.title}</h3>
									<p>{chapter.body}</p>
								</div>
							</article>
						))}
					</div>
				</section>

				<section className={styles.products} aria-labelledby="quiet-products-title">
					<div className={styles.productsHeading} data-gallery-reveal>
						<div>
							<p className={styles.exhibitionLabel}>Room III / Available now</p>
							<h2 id="quiet-products-title">The newest pieces.</h2>
						</div>
						<Link href={data.shopHref}>
							View the full collection <ArrowRight size={17} aria-hidden />
						</Link>
					</div>
					{data.products.length > 0 ? (
						<div className={styles.productGrid}>
							{data.products.slice(0, 4).map((product, index) => (
								<div key={product.id} data-gallery-reveal>
									<ProductCard product={product} priority={index < 2} />
								</div>
							))}
						</div>
					) : (
						<p className={styles.emptyCollection}>The collection is being prepared. Visit the shop to explore available pieces.</p>
					)}
				</section>

				<section className={styles.service} aria-labelledby="quiet-service-title">
					<figure>
						<Image src={MEDIA.service.src} alt={MEDIA.service.alt} fill sizes="(max-width: 900px) 100vw, 55vw" className={styles.coverImage} data-gallery-parallax />
					</figure>
					<div data-gallery-reveal>
						<p className={styles.exhibitionLabel}>Private appointment / Tailoring</p>
						<h2 id="quiet-service-title">Choose the fabric. Make the silhouette yours.</h2>
						<p>Ask us about fabric, measurements, and tailoring before choosing an unstitched suit, or select a finished piece ready for the wardrobe.</p>
						<GalleryLink href={data.shopHref}>Begin with the cloth</GalleryLink>
					</div>
				</section>

				<QuietContact contact={data.contact} />
			</GalleryMotion>
		</div>
	);
}

function GalleryLink({ children, href }: { children: React.ReactNode; href: string }) {
	return (
		<Link href={href} className={styles.action}>
			{children}
			<ArrowUpRight size={17} aria-hidden />
		</Link>
	);
}

function GalleryCategoryRoom({ category, number }: { category: GalleryCategory; number: number }) {
	const content = (
		<article className={styles.categoryRoom} data-gallery-reveal>
			<figure>
				<Image src={category.image.src} alt={category.image.alt} fill sizes="(max-width: 900px) 100vw, 52vw" className={styles.coverImage} data-gallery-parallax />
			</figure>
			<div>
				<span>0{number}</span>
				<h3>{category.label}</h3>
				<p>{category.description}</p>
				{category.href ? <small>View this collection</small> : <small>Collection arriving soon</small>}
			</div>
		</article>
	);

	return category.href ? (
		<Link href={category.href} className={styles.categoryLink}>
			{content}
		</Link>
	) : (
		content
	);
}

function QuietContact({ contact }: { contact: GalleryContact }) {
	return (
		<section className={styles.contact} aria-labelledby="quiet-contact-title">
			<Image src={MEDIA.contact.src} alt={MEDIA.contact.alt} fill sizes="100vw" className={styles.coverImage} data-gallery-parallax />
			<div className={styles.contactCard} data-gallery-reveal>
				<p className={styles.exhibitionLabel}>Visit / Correspond</p>
				<h2 id="quiet-contact-title">A private welcome at {contact.siteName}.</h2>
				<a href={contact.mapsHref} target="_blank" rel="noopener noreferrer">
					<MapPin size={18} aria-hidden />
					<span>{contact.address}</span>
				</a>
				{contact.storeHours ? (
					<p>
						<Clock3 size={18} aria-hidden />
						<span>{contact.storeHours}</span>
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
