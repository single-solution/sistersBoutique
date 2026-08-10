import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Clock3, Mail, MapPin, Phone } from "lucide-react";

import type { StoreSettings } from "@store/shared";

import { GalleryMotion } from "@/app/concepts/_components/GalleryMotion";
import {
	GALLERY_CONCEPT_MEDIA,
	GALLERY_CRAFT_CHAPTERS,
	buildGalleryCategories,
	loadGalleryHomepageData,
	type GalleryCategory,
	type GalleryContact,
	type GalleryHomepageData,
} from "@/app/concepts/_components/galleryConceptData";
import { ProductCard } from "@/components/shared/ProductCard";
import { StoreMapEmbed } from "@/components/shared/StoreMapEmbed";

import styles from "@/app/concepts/couture-salon/coutureSalon.module.css";

const MEDIA = GALLERY_CONCEPT_MEDIA["couture-salon"];

export interface HomepageData {
	data: GalleryHomepageData;
	categories: GalleryCategory[];
}

/** Load the homepage catalog + media once so the mobile and desktop homes share it. */
export async function loadCoutureSalonData(): Promise<HomepageData> {
	const data = await loadGalleryHomepageData();
	return { data, categories: buildGalleryCategories(data.categories, MEDIA.categories) };
}

export function CoutureSalonHomepage({ data, categories }: HomepageData) {
	return (
		<div className={styles.salon}>
			<GalleryMotion preset="couture-salon">
				<section className={styles.hero}>
					<div className={styles.heroArchitecture} aria-hidden>
						<span />
						<span />
						<span />
					</div>
					<div className={styles.heroCopy} data-gallery-hero-copy>
						<p className={styles.salonLabel}>Collection / 01</p>
						<h1>Pakistani dressing, in a brighter mood.</h1>
						<p>Stitched and unstitched suits selected for everyday wear, celebrations, and delivery across Pakistan.</p>
						<SalonLink href={data.shopHref}>View the collection</SalonLink>
					</div>
					<figure className={styles.heroPortrait}>
						<Image src={MEDIA.hero.src} alt={MEDIA.hero.alt} fill priority sizes="(max-width: 900px) 100vw, 62vw" className={styles.coverImage} data-gallery-hero-image />
						<span className={styles.heroSpotlight} aria-hidden />
						<figcaption>
							<span>Look 01</span>
							<span>Formal embroidery / soft structure</span>
						</figcaption>
					</figure>
				</section>

				<section className={styles.runway} aria-labelledby="salon-categories-title" data-gallery-horizontal>
					<header data-gallery-reveal>
						<p className={styles.salonLabel}>The Fabric Crafts</p>
						<h2 id="salon-categories-title">Three collections for the season.</h2>
						<p>Every collection has its own pace, color, and occasion.</p>
					</header>
					<div className={styles.runwayTrack} data-gallery-horizontal-track>
						{categories.map((category, index) => (
							<SalonLook key={category.label} category={category} number={index + 1} />
						))}
					</div>
				</section>

				<section className={styles.products} aria-labelledby="salon-products-title">
					<header data-gallery-reveal>
						<p className={styles.salonLabel}>Available pieces</p>
						<h2 id="salon-products-title">The fabric selection.</h2>
						<Link href={data.shopHref}>
							Shop every piece <ArrowRight size={17} aria-hidden />
						</Link>
					</header>
					{data.products.length > 0 ? (
						<div className={styles.productStage}>
							{data.products.slice(0, 4).map((product, index) => (
								<div key={product.id} data-gallery-reveal>
									<span>Look {String(index + 1).padStart(2, "0")}</span>
									<ProductCard product={product} priority={index < 2} />
								</div>
							))}
						</div>
					) : (
						<p className={styles.emptyCollection}>New pieces are on the way. Visit the shop to see what is available now.</p>
					)}
				</section>

				<section className={styles.craft} aria-labelledby="salon-craft-title">
					<header data-gallery-reveal>
						<p className={styles.salonLabel}>Craft</p>
						<h2 id="salon-craft-title">From fabric to finished suit.</h2>
					</header>
					<div className={styles.craftPanels}>
						{GALLERY_CRAFT_CHAPTERS.map((chapter, index) => (
							<article key={chapter.title} className={styles.craftPanel} data-gallery-craft-card data-gallery-reveal>
								<figure>
									<Image
										src={MEDIA.craft[index]?.src ?? MEDIA.craft[0].src}
										alt={MEDIA.craft[index]?.alt ?? MEDIA.craft[0].alt}
										fill
										sizes="(max-width: 900px) 100vw, 50vw"
										quality={75}
										className={styles.coverImage}
										data-gallery-parallax
									/>
								</figure>
								<div>
									<span>Scene 0{index + 1}</span>
									<h3>{chapter.title}</h3>
									<p>{chapter.body}</p>
								</div>
							</article>
						))}
					</div>
				</section>

				<section className={styles.service} aria-labelledby="salon-service-title">
					<div className={styles.serviceCopy} data-gallery-reveal>
						<p className={styles.salonLabel}>Tailoring</p>
						<h2 id="salon-service-title">Choose the fabric. Direct the finish.</h2>
						<p>Speak with us about fabric, measurements, and tailoring before selecting an unstitched set, or choose a completed piece ready to wear.</p>
						<SalonLink href={data.shopHref}>Shop the collection</SalonLink>
					</div>
					<figure>
						<Image
							src={MEDIA.service.src}
							alt={MEDIA.service.alt}
							fill
							sizes="(max-width: 900px) 100vw, 56vw"
							quality={75}
							className={styles.coverImage}
							data-gallery-parallax
						/>
					</figure>
				</section>

				<SalonContact contact={data.contact} settings={data.settings} />
			</GalleryMotion>
		</div>
	);
}

function SalonLink({ children, href }: { children: React.ReactNode; href: string }) {
	return (
		<Link href={href} className={styles.action}>
			{children}
			<ArrowUpRight size={17} aria-hidden />
		</Link>
	);
}

function SalonLook({ category, number }: { category: GalleryCategory; number: number }) {
	const content = (
		<article className={styles.runwayLook}>
			<figure>
				<Image src={category.image.src} alt={category.image.alt} fill sizes="(max-width: 1024px) 100vw, 62vw" className={styles.coverImage} />
				<span aria-hidden />
			</figure>
			<div>
				<span>Look 0{number}</span>
				<h3>{category.label}</h3>
				<p>{category.description}</p>
				<small>{category.href ? "Enter this collection" : "Collection arriving soon"}</small>
			</div>
		</article>
	);

	return category.href ? (
		<Link href={category.href} className={styles.runwayLink}>
			{content}
		</Link>
	) : (
		content
	);
}

export function SalonContact({ contact, settings }: { contact: GalleryContact; settings: StoreSettings }) {
	return (
		<section className={styles.contactStudies} aria-labelledby="salon-contact-title">
			<article className={styles.contactInvitation}>
				<div className={styles.contactInformation} data-gallery-reveal>
					<h2 id="salon-contact-title">Contact US.</h2>
					<ContactDetails contact={contact} />
				</div>
			</article>
			<div className={styles.contactMapBand}>
				<StoreMapEmbed className={styles.contactMapFrame} settings={settings} scrollZoom />
			</div>
		</section>
	);
}

function ContactDetails({ contact }: { contact: GalleryContact }) {
	return (
		<div className={styles.contactDetails}>
			<div className={styles.contactPrimary}>
				<a href={contact.mapsHref} target="_blank" rel="noopener noreferrer">
					<MapPin size={18} aria-hidden /> {contact.address}
				</a>
				{contact.phoneHref && contact.phoneNumber ? (
					<a href={contact.phoneHref}>
						<Phone size={17} aria-hidden /> {contact.phoneNumber}
					</a>
				) : null}
			</div>
			{contact.storeHours ? (
				<p>
					<Clock3 size={18} aria-hidden /> {contact.storeHours}
				</p>
			) : null}
			{contact.email ? (
				<div className={styles.contactActions}>
					<a href={`mailto:${contact.email}`}>
						<Mail size={17} aria-hidden /> {contact.email}
					</a>
				</div>
			) : null}
		</div>
	);
}
