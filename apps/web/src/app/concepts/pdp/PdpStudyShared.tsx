"use client";

import Image from "next/image";
import Link from "next/link";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { Tag, Truck } from "lucide-react";
import { formatPrice, isRichHtmlEmpty, sanitizeRichHtml } from "@store/shared";

import { BottomSheet } from "@/components/ui/BottomSheet";
import { PDP_STUDY_COPY, PDP_STUDY_LAYOUTS, pdpStudyHref, type PdpStudyLayout } from "./pdpStudyConfig";
import { PDP_STUDY_SAMPLE } from "./pdpStudySample";
import styles from "./pdpStudy.module.css";

interface PdpStudyChromeProps {
	layout: PdpStudyLayout;
	children: React.ReactNode;
}

export function PdpStudyChrome({ layout, children }: PdpStudyChromeProps) {
	const copy = PDP_STUDY_COPY[layout];
	return (
		<div className={styles.study}>
			<header className={styles.studyTop}>
				<div className={styles.studyTopMeta}>
					<p>Concepts / pdp · {copy.eyebrow}</p>
					<strong>{copy.label}</strong>
				</div>
				<nav className={styles.studyNav} aria-label="PDP study layouts">
					{PDP_STUDY_LAYOUTS.map((entry) => (
						<Link key={entry} href={pdpStudyHref(entry)} data-active={entry === layout ? "true" : "false"}>
							{PDP_STUDY_COPY[entry].label}
						</Link>
					))}
					<Link href="/concepts/pdp">All</Link>
				</nav>
			</header>
			{children}
		</div>
	);
}

export interface PdpBreadcrumbCrumb {
	label: string;
	href?: string;
}

export function PdpStudyBreadcrumbs({ crumbs, current }: { crumbs: PdpBreadcrumbCrumb[]; current: string }) {
	return (
		<nav aria-label="Breadcrumb" className={`${styles.studyShellPad} ${styles.studyBreadcrumb}`}>
			{crumbs.map((crumb) => (
				<span key={`${crumb.label}-${crumb.href ?? "current"}`} className={styles.studyBreadcrumbChunk}>
					{crumb.href ? <Link href={crumb.href}>{crumb.label}</Link> : <span>{crumb.label}</span>}
					<span aria-hidden className={styles.studyBreadcrumbSep}>
						/
					</span>
				</span>
			))}
			<span className={styles.studyBreadcrumbCurrent}>{current}</span>
		</nav>
	);
}

export function PdpStudyProductTitle({ name }: { name: string }) {
	return (
		<header className={`${styles.studyShellPad} ${styles.productTitle}`}>
			<h1 className={styles.productTitleName}>{name}</h1>
		</header>
	);
}

export interface PdpMoreFromItem {
	id: string;
	name: string;
	href: string;
	src: string;
	alt: string;
	priceRupees: number;
}

export function PdpStudyMoreFrom({
	brandName,
	brandHref,
	items,
	emptyMessage,
}: {
	brandName: string;
	brandHref: string;
	items: PdpMoreFromItem[];
	emptyMessage?: string;
}) {
	return (
		<section className={styles.moreFrom} aria-labelledby="pdp-more-from">
			<div className={styles.moreFromHead}>
				<h2 id="pdp-more-from" className={styles.moreFromTitle}>
					More from {brandName}
				</h2>
				<Link href={brandHref} className={styles.moreFromSeeAll}>
					See all {brandName}
				</Link>
			</div>
			{items.length > 0 ? (
				<ul className={styles.moreFromRail}>
					{items.map((item) => (
						<li key={item.id}>
							<Link href={item.href} className={styles.moreFromCard}>
								<span className={styles.moreFromThumb}>
									<Image src={item.src} alt={item.alt} fill sizes="(max-width: 700px) 42vw, 240px" className={styles.moreFromImage} />
								</span>
								<span className={styles.moreFromName}>{item.name}</span>
								<span className={styles.moreFromPrice}>{formatPrice(item.priceRupees)}</span>
							</Link>
						</li>
					))}
				</ul>
			) : emptyMessage ? (
				<p className="text-sm text-[var(--color-ink-500)]">{emptyMessage}</p>
			) : null}
		</section>
	);
}

export interface PdpBuySelectDimension {
	key: string;
	label: string;
	value: string;
	disabled?: boolean;
	options: Array<{ key: string; label: string }>;
	onChange: (value: string) => void;
}

export function PdpStudyBuyBar({
	dimensions,
	priceRupees,
	onAddToBag,
	addDisabled = false,
	addLabel = "Add to bag",
	sizeGuideTrigger,
	productName,
	thumbnailSrc,
	thumbnailAlt,
	originalPriceRupees,
	offerLabel,
	deliveryNote,
	stockNote,
}: {
	dimensions: PdpBuySelectDimension[];
	priceRupees: number;
	onAddToBag?: () => void;
	addDisabled?: boolean;
	addLabel?: string;
	/** "Size guide" / "Fit & tailoring" trigger, surfaced beside the size chips in the sheet. */
	sizeGuideTrigger?: React.ReactNode;
	/** Sheet header + summary context. */
	productName?: string;
	thumbnailSrc?: string;
	thumbnailAlt?: string;
	/** List price when an offer is applied — shown struck-through beside the sale price. */
	originalPriceRupees?: number;
	offerLabel?: string;
	deliveryNote?: string;
	stockNote?: string;
}) {
	const barRef = useRef<HTMLDivElement>(null);
	const [isSheetOpen, setIsSheetOpen] = useState(false);
	// `null` until mounted → render both bars for SSR/hydration parity, then keep
	// only the one for the active viewport so the off-viewport bar leaves the DOM.
	const [isMobileViewport, setIsMobileViewport] = useState<boolean | null>(null);

	useEffect(() => {
		const query = window.matchMedia("(max-width: 639.98px)");
		const update = () => setIsMobileViewport(query.matches);
		update();
		query.addEventListener("change", update);
		return () => query.removeEventListener("change", update);
	}, []);

	useEffect(() => {
		const node = barRef.current;
		if (!node) {
			return;
		}

		const publishHeight = () => {
			const height = Math.ceil(node.getBoundingClientRect().height);
			document.documentElement.style.setProperty("--pdp-sticky-buy-bar-h", `${height}px`);
		};

		publishHeight();
		const observer = new ResizeObserver(publishHeight);
		observer.observe(node);
		window.addEventListener("resize", publishHeight);

		return () => {
			observer.disconnect();
			window.removeEventListener("resize", publishHeight);
			document.documentElement.style.removeProperty("--pdp-sticky-buy-bar-h");
		};
	}, []);

	const optionLabelOf = (dimension: PdpBuySelectDimension) => dimension.options.find((option) => option.key === dimension.value)?.label ?? "";
	const selectableDimensions = dimensions.filter((dimension) => !dimension.disabled);
	const missingDimension = selectableDimensions.find((dimension) => !dimension.value) ?? null;
	const isSelectionComplete = missingDimension === null;
	const chosenSummary = dimensions
		.map(optionLabelOf)
		.filter(Boolean)
		.join(" · ");
	const selectPrompt = missingDimension ? `Select ${missingDimension.label.toLowerCase()}` : "Review & add";
	const hasOffer = typeof originalPriceRupees === "number" && originalPriceRupees > priceRupees;

	const handleSlimPrimary = () => {
		if (isSelectionComplete) {
			onAddToBag?.();
			return;
		}
		setIsSheetOpen(true);
	};

	const confirmFromSheet = () => {
		onAddToBag?.();
		setIsSheetOpen(false);
	};

	const showDesktopBar = isMobileViewport !== true;
	const showMobileBar = isMobileViewport !== false;

	return (
		<div ref={barRef} className={styles.buyBar} data-open="true">
			{/* Desktop — full-bleed bar: configuration selects on the left, price + action on the right. */}
			{showDesktopBar ? (
			<div className={styles.buyInner}>
				<div className={styles.buyConfig}>
					<div className={styles.buyFields}>
						{dimensions.map((dimension) => (
							<Fragment key={dimension.key}>
								<span className={styles.buyHead} data-locked={dimension.disabled ? "true" : undefined}>
									{dimension.label}
								</span>
								<select
									className={styles.buySelect}
									value={dimension.value}
									aria-label={dimension.label}
									disabled={dimension.disabled}
									onChange={(event) => dimension.onChange(event.target.value)}
								>
									<option value="" disabled>
										Select
									</option>
									{dimension.options.map((option) => (
										<option key={option.key} value={option.key}>
											{option.label}
										</option>
									))}
								</select>
							</Fragment>
						))}
					</div>
				</div>

				<div className={styles.buyActions}>
					{sizeGuideTrigger ? <span className={styles.buySizeChart}>{sizeGuideTrigger}</span> : null}
					<span className={styles.buyPrice}>{formatPrice(priceRupees)}</span>
					<button type="button" className={styles.buyButton} disabled={addDisabled} onClick={onAddToBag}>
						{addLabel}
					</button>
				</div>
			</div>
			) : null}

			{showMobileBar ? (
			<>
			{/* Mobile — slim glass pill: price + tappable selection summary, then the
			    size guide stacked above the smart action. */}
			<div className={styles.buySlim}>
				<button type="button" className={styles.buySlimSummary} onClick={() => setIsSheetOpen(true)} aria-label="Review selection">
					<span className={styles.buySlimPrice}>{formatPrice(priceRupees)}</span>
					<span className={styles.buySlimHint} data-prompt={isSelectionComplete ? undefined : "true"}>
						{isSelectionComplete ? chosenSummary || "Tap to review" : selectPrompt}
					</span>
				</button>
				<div className={styles.buySlimActions}>
					{sizeGuideTrigger ? <span className={styles.buySlimGuide}>{sizeGuideTrigger}</span> : null}
					<button
						type="button"
						className={styles.buySlimAction}
						disabled={isSelectionComplete && addDisabled}
						onClick={handleSlimPrimary}
					>
						{isSelectionComplete ? addLabel : missingDimension ? `Select ${missingDimension.label}` : "Select options"}
					</button>
				</div>
			</div>

			{/* Mobile — options sheet: the real configuration surface. */}
			<BottomSheet
				isOpen={isSheetOpen}
				onClose={() => setIsSheetOpen(false)}
				title={productName ?? "Select options"}
				height="auto"
				footer={
					<button type="button" className={styles.sheetAdd} disabled={addDisabled} onClick={confirmFromSheet}>
						<span>{formatPrice(priceRupees)}</span>
						<span>{isSelectionComplete ? addLabel : selectPrompt}</span>
					</button>
				}
			>
				<div className={styles.sheetBody}>
					{(thumbnailSrc || hasOffer || offerLabel) && (
						<div className={styles.sheetProduct}>
							{thumbnailSrc ? (
								<span className={styles.sheetThumb}>
									<Image src={thumbnailSrc} alt={thumbnailAlt ?? productName ?? ""} fill sizes="72px" className={styles.sheetThumbImage} />
								</span>
							) : null}
							<div className={styles.sheetProductInfo}>
								<div className={styles.sheetPriceRow}>
									<span className={styles.sheetPrice}>{formatPrice(priceRupees)}</span>
									{hasOffer ? <span className={styles.sheetPriceWas}>{formatPrice(originalPriceRupees as number)}</span> : null}
								</div>
								{offerLabel ? (
									<span className={styles.sheetOffer}>
										<Tag size={12} aria-hidden />
										{offerLabel}
									</span>
								) : null}
							</div>
						</div>
					)}

					{dimensions.map((dimension) => (
						<div key={dimension.key} className={styles.sheetGroup}>
							<div className={styles.sheetGroupHead}>
								<span className={styles.sheetGroupLabel}>{dimension.label}</span>
								{dimension.key === "size" && sizeGuideTrigger ? <span className={styles.sheetGuide}>{sizeGuideTrigger}</span> : null}
							</div>
							<div className={styles.sheetChips}>
								{dimension.options.map((option) => {
									const isActive = option.key === dimension.value;
									return (
										<button
											key={option.key}
											type="button"
											disabled={dimension.disabled}
											onClick={() => dimension.onChange(option.key)}
											className={isActive ? `${styles.sheetChip} ${styles.sheetChipActive}` : styles.sheetChip}
										>
											{option.label}
										</button>
									);
								})}
							</div>
						</div>
					))}

					{stockNote ? <p className={styles.sheetStock}>{stockNote}</p> : null}

					{deliveryNote ? (
						<p className={styles.sheetNote}>
							<Truck size={14} aria-hidden />
							{deliveryNote}
						</p>
					) : null}
				</div>
			</BottomSheet>
			</>
			) : null}
		</div>
	);
}

export function PdpStudyDescription({ html }: { html: string }) {
	const safeHtml = useMemo(() => (html && !isRichHtmlEmpty(html) ? sanitizeRichHtml(html) : ""), [html]);

	if (!safeHtml) {
		return null;
	}

	return (
		<section aria-label="Product description" className={styles.richDesc}>
			<div className={styles.richDescBody} dangerouslySetInnerHTML={{ __html: safeHtml }} />
		</section>
	);
}

interface CommerceBlockProps {
	titleClassName?: string;
	eyebrow?: string;
	children?: React.ReactNode;
	showTitle?: boolean;
	name?: string;
	descriptionHtml?: string;
}

export function PdpStudyCommerce({
	titleClassName,
	eyebrow = "Fitting",
	children,
	showTitle = false,
	name,
	descriptionHtml,
}: CommerceBlockProps) {
	const sample = PDP_STUDY_SAMPLE;
	const title = name ?? sample.name;
	const html = descriptionHtml ?? sample.descriptionHtml;
	return (
		<div className={styles.commerce}>
			{children}
			<p className={styles.commerceEyebrow}>{eyebrow}</p>
			{showTitle ? <h1 className={titleClassName ?? styles.commerceTitle}>{title}</h1> : null}
			<PdpStudyDescription html={html} />
		</div>
	);
}

/** Concept-route convenience: Vertical Runway crumbs from the sample garment. */
export function PdpStudySampleBreadcrumbs() {
	const sample = PDP_STUDY_SAMPLE;
	return (
		<PdpStudyBreadcrumbs
			crumbs={[
				{ label: "Home", href: "/" },
				{ label: sample.categoryLabel, href: sample.categoryHref },
			]}
			current={sample.name}
		/>
	);
}

export function PdpStudySampleProductTitle() {
	return <PdpStudyProductTitle name={PDP_STUDY_SAMPLE.name} />;
}

export function PdpStudySampleMoreFrom() {
	const sample = PDP_STUDY_SAMPLE;
	return (
		<PdpStudyMoreFrom
			brandName={sample.brandName}
			brandHref={sample.brandHref}
			items={sample.related.map((item) => ({
				id: item.id,
				name: item.name,
				href: sample.brandHref,
				src: item.src,
				alt: item.alt,
				priceRupees: item.priceRupees,
			}))}
		/>
	);
}

export function PdpStudySampleBuyBar({
	priceRupees,
	sizeId,
	colourId,
	onSize,
	onColour,
}: {
	priceRupees: number;
	sizeId: string | null;
	colourId: string | null;
	onSize: (id: string) => void;
	onColour: (id: string) => void;
}) {
	const sample = PDP_STUDY_SAMPLE;
	return (
		<PdpStudyBuyBar
			priceRupees={priceRupees}
			dimensions={[
				{
					key: "size",
					label: "Size",
					value: sizeId ?? "",
					options: sample.sizes.map((size) => ({ key: size.id, label: size.label })),
					onChange: onSize,
				},
				{
					key: "colour",
					label: "Colour",
					value: colourId ?? "",
					options: sample.colours.map((colour) => ({ key: colour.id, label: colour.label })),
					onChange: onColour,
				},
			]}
		/>
	);
}
