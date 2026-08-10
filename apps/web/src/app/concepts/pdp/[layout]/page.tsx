import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { LookbookChapterPdp } from "../layouts/LookbookChapterPdp";
import { OverlayAtelierPdp } from "../layouts/OverlayAtelierPdp";
import { StageRailPdp } from "../layouts/StageRailPdp";
import { VerticalRunwayPdp } from "../layouts/VerticalRunwayPdp";
import { isPdpStudyLayout, PDP_STUDY_COPY, type PdpStudyLayout } from "../pdpStudyConfig";

interface PageProps {
	params: Promise<{ layout: string }>;
}

export async function generateStaticParams() {
	return [
		{ layout: "vertical-runway" },
		{ layout: "overlay-atelier" },
		{ layout: "stage-rail" },
		{ layout: "lookbook-chapter" },
	];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
	const { layout } = await params;
	if (!isPdpStudyLayout(layout)) {
		return { title: "PDP study", robots: { index: false, follow: false } };
	}
	const copy = PDP_STUDY_COPY[layout];
	return {
		title: `${copy.label} · PDP study`,
		description: copy.summary,
		robots: { index: false, follow: false },
	};
}

function LayoutStudy({ layout }: { layout: PdpStudyLayout }) {
	switch (layout) {
		case "vertical-runway":
			return <VerticalRunwayPdp />;
		case "overlay-atelier":
			return <OverlayAtelierPdp />;
		case "stage-rail":
			return <StageRailPdp />;
		case "lookbook-chapter":
			return <LookbookChapterPdp />;
		default:
			return null;
	}
}

export default async function PdpStudyLayoutPage({ params }: PageProps) {
	const { layout } = await params;
	if (!isPdpStudyLayout(layout)) {
		notFound();
	}
	return <LayoutStudy layout={layout} />;
}
