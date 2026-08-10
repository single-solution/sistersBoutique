# Fit Model Image Generation Guide

This guide documents the exact workflow, prompt templates, reference image usage, and file naming conventions to generate consistent body-type fit preview models for the Sisters Boutique size & fit tool.

---

## 1. Directory & Naming Structure

All model images reside in:
`apps/web/public/images/fit-models/`

File naming standard:
`[angle]-[size].jpg`

- **Angles**: `front`, `side`, `back`
- **Sizes**: `xs`, `s`, `m`, `l`, `xl`

Total set count: **15 images** (5 sizes × 3 angles).

---

## 2. Core Prompt Template

```text
Full body studio photograph of a beautiful young South Asian woman in her early 20s, [BUILD_SPECIFICATION], [POSE_SPECIFICATION]. She is wearing a traditional champagne beige silk Shalwar Kameez suit with delicate gold embroidery on the neckline, sleeve cuffs, and hem. The kameez is a knee-length tunic with 3/4 sleeves and side slits. The shalwar trousers are pleated and tapered at the ankles. A matching sheer dupatta is draped gracefully over her left shoulder. Plain pure white background, soft professional studio lighting, no accessories, natural makeup, hair pulled back neatly. Clean editorial fashion photography style.
```

---

## 3. Specifications Matrix

### Build Specifications (`[BUILD_SPECIFICATION]`)
- **XS**: `very slim petite build (bust 32 inches, waist 26 inches, hips 36 inches)`
- **S**: `slim build (bust 35 inches, waist 28 inches, hips 38 inches)`
- **M**: `medium average build (bust 38 inches, waist 31 inches, hips 41 inches)`
- **L**: `curvy build (bust 42 inches, waist 35 inches, hips 45 inches)`
- **XL**: `plus-size fuller build (bust 46 inches, waist 39 inches, hips 49 inches)`

### Pose Specifications (`[POSE_SPECIFICATION]`)
- **Front**: `standing facing the camera directly in a front-facing pose`
- **Side**: `standing in a three-quarter turn pose slightly facing right showing her side profile`
- **Back**: `standing facing away from the camera showing a clean back view of the shalwar kameez suit and dupatta from behind`

---

## 4. Reference Image Consistency Technique

To maximize visual similarity (face, hair, embroidery, fabric texture, lighting):
1. Always pass `front-m.jpg` (or `front-s.jpg`) as an input reference image via the `ImagePaths` parameter during `generate_image` calls.
2. Maintain identical aspect ratio (`3:4`).

---

## 5. Remaining Images to Generate (Quota Reset Queue)

1. `side-xl.jpg` (Side view, XL size)
2. `back-xs.jpg` (Back view, XS size)
3. `back-s.jpg` (Back view, S size)
4. `back-m.jpg` (Back view, M size)
5. `back-l.jpg` (Back view, L size)
6. `back-xl.jpg` (Back view, XL size)

---

## 6. Integration in `FitPreview.tsx`

Once new images are copied to `apps/web/public/images/fit-models/`, uncomment their entries in `IMAGE_MATRIX` inside `FitPreview.tsx`:

```typescript
const IMAGE_MATRIX: Record<ViewAngle, Partial<Record<BodySize, string>>> = {
    front: {
        xs: "/images/fit-models/front-xs.jpg",
        s: "/images/fit-models/front-s.jpg",
        m: "/images/fit-models/front-m.jpg",
        l: "/images/fit-models/front-l.jpg",
        xl: "/images/fit-models/front-xl.jpg",
    },
    side: {
        xs: "/images/fit-models/side-xs.jpg",
        s: "/images/fit-models/side-s.jpg",
        m: "/images/fit-models/side-m.jpg",
        l: "/images/fit-models/side-l.jpg",
        xl: "/images/fit-models/side-xl.jpg",
    },
    back: {
        xs: "/images/fit-models/back-xs.jpg",
        s: "/images/fit-models/back-s.jpg",
        m: "/images/fit-models/back-m.jpg",
        l: "/images/fit-models/back-l.jpg",
        xl: "/images/fit-models/back-xl.jpg",
    },
};
```
The navigation dots and crossfade engine will automatically adapt.
