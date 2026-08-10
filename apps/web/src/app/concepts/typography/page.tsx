import { Alex_Brush, Allura, MonteCarlo, Parisienne, Pinyon_Script, Tangerine } from "next/font/google";

import styles from "./typography.module.css";

const allura = Allura({
	subsets: ["latin"],
	weight: "400",
	variable: "--font-study-allura",
	display: "swap",
});

const monteCarlo = MonteCarlo({
	subsets: ["latin"],
	weight: "400",
	variable: "--font-study-monte-carlo",
	display: "swap",
});

const pinyonScript = Pinyon_Script({
	subsets: ["latin"],
	weight: "400",
	variable: "--font-study-pinyon",
	display: "swap",
});

const alexBrush = Alex_Brush({
	subsets: ["latin"],
	weight: "400",
	variable: "--font-study-alex-brush",
	display: "swap",
});

const parisienne = Parisienne({
	subsets: ["latin"],
	weight: "400",
	variable: "--font-study-parisienne",
	display: "swap",
});

const tangerine = Tangerine({
	subsets: ["latin"],
	weight: ["400", "700"],
	variable: "--font-study-tangerine",
	display: "swap",
});

const FONT_STUDIES = [
	{
		number: "01",
		name: "Allura",
		note: "The flowing handwritten direction you already liked.",
		headingClassName: styles.allura,
		bodyClassName: styles.bodoni,
	},
	{
		number: "02",
		name: "MonteCarlo",
		note: "Fine couture strokes with elegant capitals and natural movement.",
		headingClassName: styles.monteCarlo,
		bodyClassName: styles.bodoni,
	},
	{
		number: "03",
		name: "Pinyon Script",
		note: "Formal fashion-house calligraphy with a more composed silhouette.",
		headingClassName: styles.pinyon,
		bodyClassName: styles.bodoni,
	},
	{
		number: "04",
		name: "Alex Brush",
		note: "A confident brush-written script with clearer long headlines.",
		headingClassName: styles.alexBrush,
		bodyClassName: styles.bodoni,
	},
	{
		number: "05",
		name: "Parisienne",
		note: "Soft boutique handwriting with relaxed, connected letterforms.",
		headingClassName: styles.parisienne,
		bodyClassName: styles.bodoni,
	},
	{
		number: "06",
		name: "Tangerine",
		note: "Delicate traditional penmanship with the lightest visual character.",
		headingClassName: styles.tangerine,
		bodyClassName: styles.bodoni,
	},
] as const;

export default function TypographyStudiesPage() {
	const fontVariables = [allura.variable, monteCarlo.variable, pinyonScript.variable, alexBrush.variable, parisienne.variable, tangerine.variable].join(" ");

	return (
		<main className={`${styles.page} ${fontVariables}`}>
			<header className={styles.introduction}>
				<p>Campaign typography studies</p>
				<h1>Six pure calligraphic voices for Sister&apos;s Outfits.</h1>
				<span>Every headline below uses a genuine handwritten script with no serif or italic styling.</span>
			</header>

			<div className={styles.studies}>
				{FONT_STUDIES.map((study) => (
					<section key={study.number} className={styles.study}>
						<div className={styles.metadata}>
							<span>{study.number}</span>
							<strong>{study.name}</strong>
							<p>{study.note}</p>
						</div>
						<div className={styles.sample}>
							<p className={`${styles.kicker} ${study.bodyClassName}`}>Sister&apos;s Outfits</p>
							<h2 className={study.headingClassName}>Pakistani dressing, in a brighter mood.</h2>
							<p className={`${styles.body} ${study.bodyClassName}`}>Stitched and unstitched suits selected for everyday wear, celebrations, and everything between.</p>
							<div className={styles.secondarySample}>
								<p className={study.bodyClassName}>From fabric to finished suit</p>
								<h3 className={study.headingClassName}>Cloth chosen for the season.</h3>
							</div>
						</div>
					</section>
				))}
			</div>
		</main>
	);
}
