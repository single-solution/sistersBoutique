import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";

import {
	GALLERY_CONCEPT_MEDIA,
	GALLERY_CRAFT_CHAPTERS,
	type GalleryCategory,
	type GalleryHomepageData,
} from "@/app/concepts/_components/galleryConceptData";
import { ProductCard } from "@/components/shared/ProductCard";
import { SalonContact } from "./CoutureSalonHomepage";

import styles from "./coutureSalonHomepageMobile.module.css";

const MEDIA = GALLERY_CONCEPT_MEDIA["couture-salon"];

interface CoutureSalonHomepageMobileProps {
	data: GalleryHomepageData;
	categories: GalleryCategory[];
}

/** Couture Salon homepage — mobile surface: immersive hero + swipeable snap rails. */
export function CoutureSalonHomepageMobile({ data, categories }: CoutureSalonHomepageMobileProps) {
	const products = data.products.slice(0, 6);

	return (
		<div className={styles.root}>
			<section className={styles.hero}>
				<Image src={MEDIA.hero.src} alt={MEDIA.hero.alt} fill priority sizes="(max-width: 1024px) 100vw, 430px" className={styles.heroImage} />
				<span className={styles.heroScrim} aria-hidden />
				<p className={`${styles.eyebrow} ${styles.heroTop}`}>Sister&apos;s Outfits</p>
				<div className={`${styles.heroCopy} reveal`}>
					<p className={styles.eyebrow}>Collection / 01</p>
					<h1 className={styles.heroTitle}>Pakistani dressing, in a brighter mood.</h1>
					<p className={styles.heroText}>Stitched and unstitched suits for everyday wear, celebrations, and delivery across Pakistan.</p>
					<Link href={data.shopHref} className={styles.heroCta}>
						View the collection <ArrowUpRight size={16} aria-hidden />
					</Link>
				</div>
				<span className={styles.scrollCue} aria-hidden />
			</section>

			<section className={styles.block}>
				<div className={`${styles.head} reveal`}>
					<div>
						<p className={`${styles.eyebrow} ${styles.headEyebrow}`}>The Fabric Crafts</p>
						<h2 className={styles.headTitle}>Three collections.</h2>
					</div>
				</div>
				<div className={`${styles.rail} reveal`}>
					{categories.map((category, index) => {
						const slide = (
							<>
								<Image src={category.image.src} alt={category.image.alt} fill sizes="340px" className={styles.heroImage} />
								<span className={styles.catScrim} aria-hidden />
								<div className={styles.catCaption}>
									<span className={styles.catNumber}>Look 0{index + 1}</span>
									<span className={styles.catLabel}>{category.label}</span>
									<span className={styles.catDesc}>{category.description}</span>
								</div>
							</>
						);
						return category.href ? (
							<Link key={category.label} href={category.href} className={styles.catSlide}>
								{slide}
							</Link>
						) : (
							<div key={category.label} className={styles.catSlide}>
								{slide}
							</div>
						);
					})}
				</div>
			</section>

			<section className={styles.block}>
				<div className={`${styles.head} reveal`}>
					<div>
						<p className={`${styles.eyebrow} ${styles.headEyebrow}`}>Available pieces</p>
						<h2 className={styles.headTitle}>The fabric selection.</h2>
					</div>
					<Link href={data.shopHref} className={styles.headLink}>
						Shop all <ArrowRight size={14} aria-hidden />
					</Link>
				</div>
				{products.length > 0 ? (
					<div className={`${styles.rail} reveal`}>
						{products.map((product, index) => (
							<div key={product.id} className={styles.prodSlide}>
								<ProductCard product={product} priority={index < 2} />
							</div>
						))}
					</div>
				) : (
					<p className={styles.heroText}>New pieces are on the way.</p>
				)}
			</section>

			<section className={styles.block}>
				<div className={`${styles.head} reveal`}>
					<div>
						<p className={`${styles.eyebrow} ${styles.headEyebrow}`}>Craft</p>
						<h2 className={styles.headTitle}>From fabric to finished suit.</h2>
					</div>
				</div>
				<div className={`${styles.rail} reveal`}>
					{GALLERY_CRAFT_CHAPTERS.map((chapter, index) => (
						<article key={chapter.title} className={styles.craftSlide}>
							<Image
								src={MEDIA.craft[index]?.src ?? MEDIA.craft[0].src}
								alt={MEDIA.craft[index]?.alt ?? MEDIA.craft[0].alt}
								fill
								sizes="380px"
								className={styles.heroImage}
							/>
							<span className={styles.craftScrim} aria-hidden />
							<div className={styles.craftCaption}>
								<span className={styles.craftScene}>Scene 0{index + 1}</span>
								<h3 className={styles.craftTitle}>{chapter.title}</h3>
								<p className={styles.craftText}>{chapter.body}</p>
							</div>
						</article>
					))}
				</div>
			</section>

			<section className={`${styles.service} reveal`}>
				<Image src={MEDIA.service.src} alt={MEDIA.service.alt} fill sizes="(max-width: 1024px) 100vw, 430px" className={styles.serviceImage} />
				<span className={styles.heroScrim} aria-hidden />
				<div className={styles.heroCopy}>
					<p className={styles.eyebrow}>Tailoring</p>
					<h2 className={styles.heroTitle}>Choose the fabric. Direct the finish.</h2>
					<Link href={data.shopHref} className={styles.heroCta}>
						Shop the collection <ArrowUpRight size={16} aria-hidden />
					</Link>
				</div>
			</section>

			<div className={`${styles.contact} reveal`}>
				<SalonContact contact={data.contact} settings={data.settings} />
			</div>
		</div>
	);
}
