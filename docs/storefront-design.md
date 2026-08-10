# Storefront design guide

How Sister's Outfits looks and moves on the customer site. Derived from the production homepage at `/`. Agents and humans MUST follow this before redesigning shop, category, PDP, cart, or checkout surfaces.

**Canonical code:** `apps/web/src/app/_components/home/CoutureSalonHomepage.tsx`, `apps/web/src/app/concepts/couture-salon/coutureSalon.module.css`, `apps/web/src/app/globals.css`, `apps/web/src/components/shared/motion/SmoothScroll.tsx`, `apps/web/src/app/concepts/_components/GalleryMotion.tsx`.

**Token summary:** [design-system.md](./design-system.md).

---

## 1. Brand and voice

| Rule             | Detail                                                                                                                                 |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Legal name       | **Sister's Outfits** (apostrophe). Never "Sisters" alone in customer copy.                                                             |
| Positioning      | Boutique for brighter Pakistani dressing — warm, precise, not hard-sell ecommerce. Never call the shop a **salon**.                    |
| Section eyebrows | Uppercase Bodoni micro-labels with slash beats: `Collection / 01`, `Available pieces`, `Craft`.                                        |
| Headlines        | Clear brand + collection language: `Pakistani dressing, in a brighter mood.`, `From fabric to finished suit.` — not `Featured Products`. |
| CTAs             | Collection verbs: `View the collection`, `Shop the collection` — prefer over bare `Shop now` on editorial surfaces.                    |
| Look numbering   | `Look 01` as micro-identifiers on runway and craft stages.                                                                             |
| Contact title    | Deliberate casing: **Contact US.**                                                                                                     |

---

## 2. Color

One warm blush system sitewide (storefront and admin). Garment photos carry extra hue; chrome does not.

| Role                  | Token                                        | Hex       |
| --------------------- | -------------------------------------------- | --------- |
| Page canvas           | `--color-canvas`                             | `#f6ede9` |
| Deep blush band       | `--color-canvas-deep`                        | `#ead6d0` |
| Raised surface        | `--color-surface`                            | `#fff9f5` |
| Primary text          | `--color-ink-900`                            | `#281b21` |
| Secondary text        | `--color-ink-500`                            | `#705963` |
| Only UI accent (wine) | `--color-accent-500` / `--color-accent-deep` | `#7d1f48` |
| WhatsApp              | `--color-whatsapp`                           | `#25d366` |

Homepage salon aliases (`--salon-canvas`, `--salon-paper`, `--salon-blush`, `--salon-ink`, `--salon-muted`, `--salon-wine`) remap onto the same globals so `ProductCard` stays on-brand.

**MUST:** wine is the only chromatic interface accent. **MUST NOT:** purple AI defaults, neon, dark developer themes, multi-accent rainbow UI.

---

## 3. Typography

Loaded in `apps/web/src/app/layout.tsx` via `next/font/google`.

| Role                                                                                               | Face                            | Weight                                         |
| -------------------------------------------------------------------------------------------------- | ------------------------------- | ---------------------------------------------- |
| Logo, hero/page/section titles, category names on homepage runway, full PDP product title          | Allura (`--font-display`)       | Native **400** only — no synthetic bold/italic |
| Body, paragraphs, navigation, buttons, labels, prices, compact headings, product names outside PDP | Bodoni Moda (`--font-headline`) | 400–600 as needed                              |
| Text 12px and smaller (`text-xs`, `small`, compact labels)                                         | Bodoni                          | Minimum **600** for readability                |

On editorial homepage, Allura is large and spacious (hero clamp roughly 4.8rem–9.8rem). On category shop listings, Allura is the gate-stage title (`ShopGateHangStage`, clamp roughly 3rem–5.5rem). Search, deals, and glossaries still use compact `ShopListingHero` (`clamp(2.4rem, 5.5vw, 3.6rem)`).

---

## 4. Layout grammar

### Full-bleed vs constrained

| Surface                   | Width model                                                                |
| ------------------------- | -------------------------------------------------------------------------- |
| Hero                      | Full viewport presence; photography dominates                              |
| Category runway           | Wide track; desktop horizontal pin                                         |
| Product / craft / service | Generous centered shells (~88–92rem) with `clamp(1rem, 4vw, 4rem)` gutters |
| Contact                   | Narrow centered column (~52–56rem), vertical stack                         |
| Shop shell                | `STOREFRONT_SHELL_CLASS` — max **1440px**, `px-3 md:px-6 lg:px-8`          |

### Spacing and separation

- Separate major sections with **breathing room and tonal bands**, not hard edge-to-edge border bars.
- Prefer soft large radii on editorial frames (`clamp(1.5rem, 3–4vw, 3.5–4rem)`).
- Hero portrait may use asymmetric radii; craft/runway/service use soft rounded frames.
- Contact **map is square** (no border-radius) so Google embed chrome is not clipped.

### Cards

- **Default: no cards in heroes.** Photography is the frame.
- Cards are allowed for **interactive commerce** (product tiles) and intentional editorial panels (runway looks, craft chapters, service block).
- If removing border, shadow, and radius does not hurt understanding, it should not be a card.

---

## 5. Homepage section order (reference composition)

Agents may add new pages without cloning this stack, but must respect the same language.

1. **Hero** — brand wordmark, Allura headline, one support line, one CTA, dominant garment image.
2. **Category runway** — three fabric entrances; horizontal pin on desktop.
3. **Fabric selection** — up to four live `ProductCard`s + shop link (commerce handoff).
4. **From fabric to finished suit** — three sticky craft chapters with scroll-linked blur of the previous card.
5. **Tailoring / fitting** — service narrative + image.
6. **Contact** — centered vertical block; address and phone **inline**; hours; email; native Google Maps embed.

---

## 6. Imagery

- Pakistani stitched and unstitched suits as the photographic focus.
- Prefer real editorial / garment photography over abstract gradients as the main idea.
- `object-fit: cover` on editorial frames; Next.js `Image` with sensible `sizes`.
- Hero and runway use overlays for legibility, not floating promo chips.

---

## 7. Motion

Premium pacing is a product value. Prefer slightly longer and smoother over snappy utility motion on storytelling surfaces.

| Layer                 | Behavior                                                                                                                                                       |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Desktop smooth scroll | Lenis soft couture glide (~1.15s), synced to GSAP ScrollTrigger; active only at `min-width: 1024px`, fine pointer, and `prefers-reduced-motion: no-preference` |
| Phones                | Native touch scroll                                                                                                                                            |
| Homepage hero         | Long scale-in (~2.55s) + delayed copy fade-up (~1.85s)                                                                                                         |
| Homepage reveals      | ~0.95s, soft stagger; fast-scroll completion so content never stays invisible                                                                                  |
| Category runway       | Desktop pin + horizontal scrub                                                                                                                                 |
| Craft chapters        | Previous card blurs/scales as the next arrives                                                                                                                 |
| Route preloader       | Thread-and-hanger; loops A→B then **reverse** B→A until ready                                                                                                  |
| Shop / catalog / cart | `RevealRoot` + `.reveal` CSS — **not** `GalleryMotion` pins                                                                                                    |
| Reduced motion        | Disable Lenis, GSAP storytelling, and decorative transforms                                                                                                    |

**MUST NOT:** strip motion to "feel faster" on editorial pages without an explicit product decision. Background image warm-up and deferred chrome may be fast; storytelling motion stays luxurious.

---

## 8. Global chrome

| Element                         | Rule                                                                                                                                    |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Header on `/` (no search query) | Fixed transparent overlay over hero; firms when scrolled                                                                                |
| Header elsewhere                | Sticky / standard storefront header                                                                                                     |
| Store notice                    | Hidden on editorial homepage; allowed on commerce routes                                                                                |
| WhatsApp                        | Floating desktop pill (dark bold text on green); mobile center tab; contextual prefilled URL message; **not** in footer or contact card |
| Footer                          | Brand + tagline left; copyright / developed-by flush right on desktop; leave room for WhatsApp FAB (`md:pr-44`)                         |

---

## 9. Contact and map

- Vertical, centered, not full-bleed left/right split.
- Address and phone share one inline primary row.
- Free Google place embed with Sister's Outfits selected by default.
- Square map wrapper; do not fight Google's internal direction card or thumbnail with CSS (cross-origin iframe).
- Our only map overlay control is the **Open in Maps** pill.

---

## 10. How to design the next page (shop and beyond)

Apply this checklist before proposing UI:

1. **Read this file + [design-system.md](./design-system.md).** Do not invent a second palette or font pair.
2. **Choose surface type:**
   - _Editorial storytelling_ (landings): may use `GalleryMotion`-class composition, large Allura, horizontal stories.
   - _Category shop:_ Gate · hang tags — stage portrait, hang-tag filters, denser wall (`ShopGateHang*`).
   - _Other commerce utility_ (search, deals, cart, checkout, account): Bodoni-first UI, compact Allura titles, `RevealRoot`, product grid shell.
3. **Reuse:** `ProductCard`, `ShopProductFeed` / grid helpers, shell width class, wine eyebrows where a section needs editorial tone.
4. **Preserve Lenis + reduced-motion + WhatsApp FAB clearance.**
5. **Grill the user** for shop-specific behavior (filters, density, category hero) — but do **not** ask them to restate color, fonts, motion, or chrome rules already here.

### Shop-specific seed

| Keep from homepage                         | Soften / change on shop                                      |
| ------------------------------------------ | ------------------------------------------------------------ |
| Blush/wine tokens                          | Same                                                         |
| Allura for page title only at compact size | No 9rem billboard titles over dense grids                    |
| Wine uppercase eyebrows optional           | Prefer short concrete labels                                 |
| `ProductCard`                              | Primary cell; editorial grid (1 / 2 / 3 cols)                |
| Soft spacing and paper surfaces            | Blush hang-tag dock; open Min—Max price; no pill trays      |
| Lenis on desktop                           | Yes                                                          |
| GalleryMotion runway / craft blur          | No, unless a dedicated editorial shop campaign is requested  |

**Production category shop (chosen):** Gate · hang tags — `ShopGateHangStage`, `ShopGateHangToolbar` / dock, denser CSS grid wall. Search (`/?q=`), deals, and glossaries keep `ShopListingHero` + `SHOP_CATEGORY_GRID_CLASS`.

### Shop listing studies (internal)

Density × hero and fitting-grammar studies redirect to `/concepts/shop`, which redirects to the live category listing (study promoted).

PDP production grammar is **Vertical Runway** (promoted from `/concepts/pdp/vertical-runway`): centered Allura title, looping parallax look ribbon, rich description, sticky attribute dropdowns + Add to bag, More from rail. Other PDP layout studies remain under `/concepts/pdp` for comparison.

---

## 11. Hard anti-patterns

- Dark gunmetal "developer" themes on this niche.
- Sharp zero-gap bordered slabs as the primary section language.
- Cards in the hero; badge/chip clutter over hero media.
- Generic Inter/Roboto/system stacks.
- Purple-on-white or cream-and-terracotta AI defaults.
- Over-shortening or removing the premium motion system for speed theater.
- Rounding the map so Google UI clips.
- Duplicating WhatsApp in footer and contact.
- Treating `/concepts/*` studies as production URLs (`/concepts/couture-salon` redirects to `/`).

---

## 12. Key files

```
apps/web/src/app/page.tsx
apps/web/src/app/_components/home/CoutureSalonHomepage.tsx
apps/web/src/app/concepts/couture-salon/coutureSalon.module.css
apps/web/src/app/concepts/_components/GalleryMotion.tsx
apps/web/src/app/concepts/_components/galleryConceptData.ts
apps/web/src/components/shared/motion/SmoothScroll.tsx
apps/web/src/app/[category]/page.tsx
apps/web/src/app/_components/shop/ShopGateHangStage.tsx
apps/web/src/app/_components/shop/ShopGateHangDock.tsx
apps/web/src/app/_components/shop/ShopHangTag.tsx
apps/web/src/app/_components/shop/shopGateHang.module.css
apps/web/src/app/_components/shop/ShopListingHero.tsx
apps/web/src/lib/catalog/shopListingGrid.ts
apps/web/src/app/concepts/shop/page.tsx
apps/web/src/app/concepts/pdp/page.tsx
apps/web/src/app/concepts/pdp/[layout]/page.tsx
apps/web/src/components/layout/AppShell.tsx
apps/web/src/components/layout/Header.tsx
apps/web/src/components/layout/Footer.tsx
apps/web/src/components/layout/WhatsAppSupport.tsx
apps/web/src/components/shared/ProductCard.tsx
apps/web/src/components/shared/ShopProductFeed.tsx
apps/web/src/app/globals.css
```
