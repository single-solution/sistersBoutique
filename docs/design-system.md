# Design System

Visual language for Sister's Outfits. The customer site and admin use one couture-blush system: warm pink canvas, tinted paper surfaces, plum text, wine interactions, generous spacing, and garment photography as the wider color story. Internal gallery concept routes retain their own scoped study palettes.

**For homepage grammar, shop handoff rules, motion, chrome, and anti-patterns, read [storefront-design.md](./storefront-design.md)** — that file is the authority so agents do not re-ask settled design questions.

## Color tokens

| Token                   | Hex       | Use                                |
| ----------------------- | --------- | ---------------------------------- |
| `--color-canvas`        | `#f6ede9` | Page background and browser chrome |
| `--color-canvas-deep`   | `#ead6d0` | Tonal page depth                   |
| `--color-surface`       | `#fff9f5` | Cards, sheets, and controls        |
| `--color-surface-muted` | `#f1e1dc` | Secondary surfaces                 |
| `--color-ink-900`       | `#281b21` | Primary plum-black text            |
| `--color-ink-500`       | `#705963` | Accessible secondary text          |
| `--color-accent-500`    | `#7d1f48` | Primary action background          |
| `--color-accent-deep`   | `#7d1f48` | Links and display accents          |

Status ramps (`warn`, `danger`, `success`, `info`) stay separate from the brand accent so meaning never depends on wine.

## Typography

| Role                                                                                                        | Font        | CSS variable                         |
| ----------------------------------------------------------------------------------------------------------- | ----------- | ------------------------------------ |
| Brand wordmark, hero and page titles, large section titles, homepage category names, and the full PDP title | Allura      | `--font-display` -> `--font-allura`  |
| Product names outside the PDP, compact headings, paragraphs, navigation, controls, labels, and prices       | Bodoni Moda | `--font-headline` -> `--font-bodoni` |

Both families load through `next/font/google` in `apps/web/src/app/layout.tsx`. Typography is assigned by semantic role rather than HTML heading level or percentage. Allura is reserved for spacious display moments where its calligraphy remains legible; Bodoni Moda owns compact and commerce-heavy text. Every Allura treatment uses its native 400 weight with no synthetic bold or italic, and its category and display roles stay consistent across responsive sizes.

Customer-facing text at 12px or smaller uses a minimum 600 weight so prices, identifiers, labels, and footer legal copy remain readable.

## Shape system

- Buttons and inputs use the 12px medium radius.
- Product media and major editorial frames use the 16-40px large range.
- Pills are reserved for compact filters, statuses, and counts.
- Major homepage sections use spacing and tonal surfaces instead of visible divider borders.

## Motion budget

GSAP is limited to storytelling surfaces. Every animation has a static reduced-motion path.

1. The homepage prioritizes longer, smoother hero and section entrances, with fast-scroll completion so content never remains hidden.
2. Desktop storefront scrolling uses soft Couture Lenis inertia synced to GSAP ScrollTrigger; phones keep native touch; reduced-motion disables Lenis.
3. The category runway pins horizontally on desktop and returns to natural vertical flow on mobile.
4. Fabric-to-suit chapters use generous sticky travel; the incoming card progressively blurs and scales back only the preceding card. Reduced-motion mode keeps the stack sharp.
5. Hero, craft, and service imagery may use restrained transform-only scale or parallax.
6. Commerce controls use fast CSS feedback only. Product grids, forms, cart, and checkout never use scroll hijacking.

## Rules

- Keep Pakistani stitched and unstitched suits as the photographic focus.
- Use couture wine as the only interface accent. Other jewel tones belong inside the garments.
- Keep large sections visually separate with breathing room, soft corners, and tonal backgrounds instead of hard edge-to-edge bands.
- Keep copy short, concrete, and retail-focused.
- Do not reintroduce chartreuse, neon gradients, generic service-card rows, or decorative animation.
