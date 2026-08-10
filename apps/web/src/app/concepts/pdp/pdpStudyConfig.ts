export const PDP_STUDY_LAYOUTS = ["vertical-runway", "overlay-atelier", "stage-rail", "lookbook-chapter"] as const;

export type PdpStudyLayout = (typeof PDP_STUDY_LAYOUTS)[number];

export const PDP_STUDY_COPY: Record<
	PdpStudyLayout,
	{ label: string; eyebrow: string; summary: string; cue: string }
> = {
	"vertical-runway": {
		label: "Vertical runway",
		eyebrow: "Look / scroll",
		summary: "Full-bleed looks stack like a show. Title, notes, and fitting land after the first look.",
		cue: "No left/right columns — commerce arrives after photography.",
	},
	"overlay-atelier": {
		label: "Overlay atelier",
		eyebrow: "Sheet / stage",
		summary: "Imagery is the page. Fitting lives on a translucent atelier sheet over the look.",
		cue: "Expand the sheet; buy stays locked until size + past the first frame.",
	},
	"stage-rail": {
		label: "Stage + rail",
		eyebrow: "Hero / rail",
		summary: "One dominant stage. Thumbs and size chips ride a thin fitting rail — never a second column.",
		cue: "Buy rises from the rail after you leave the stage with a size chosen.",
	},
	"lookbook-chapter": {
		label: "Lookbook chapter",
		eyebrow: "Story / fitting",
		summary: "Horizontal look chapters, then a separate Fitting chapter for size and bag.",
		cue: "Story first; commerce is a deliberate next chapter.",
	},
};

export function pdpStudyHref(layout: PdpStudyLayout): string {
	return `/concepts/pdp/${layout}`;
}

export function isPdpStudyLayout(value: string): value is PdpStudyLayout {
	return (PDP_STUDY_LAYOUTS as readonly string[]).includes(value);
}
