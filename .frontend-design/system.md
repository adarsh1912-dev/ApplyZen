# ApplyZen Design System

## Direction
Warm editorial minimalism with subtle dimensionality. ApplyZen should feel like a calm writing desk for serious job seekers, not a generic AI SaaS.

## Intent
- Who: early-career and mid-level job seekers building, tailoring, and tracking resumes.
- Task: create a credible resume, match it to a posting, and keep applications moving.
- Feel: tactile, quiet, trustworthy, precise. Paper and ink, not neon and glass.

## Palette
- Ivory canvas: `#F7F5F0`
- White paper: `#FFFFFF`
- Soft stone: `#EAE6DE`
- Borders: `#DDD8CF`
- Primary ink: `#171916`
- Secondary text: `#686A64`
- Forest primary: `#245743`
- Muted green surface: `#E8F0EA`
- Warm clay accent: `#B88A58` (sparingly)
- Dark canvas: `#141613`; dark surface: `#1C1F1B`; dark border: `#3E443C`

Forest green is for primary actions, selected states, positive metrics, and active navigation. Clay is for restrained warmth only. No purple, violet, neon, or rainbow accents.

## Typography
- UI and headlines: Inter, 400–800.
- Document templates: IBM Plex Serif where the template calls for it.
- Metadata, scores, and identifiers: JetBrains Mono.
- Four levels: display, heading, body, metadata. Body line-height 1.5–1.65. Labels are 11–12px semibold uppercase with wide tracking. No oversized type outside the landing hero.

## Depth
- Borders first, soft shadows second, layered paper third.
- Cards: 1px `line`, 12px radius, `shadow-card`.
- Floating/hero sheets: `shadow-float`, layered transforms.
- Dark mode: use lighter surfaces and borders instead of relying on shadows.

## Spacing
- 8px base grid.
- Page gutters: 16px mobile, 24px tablet, 32px desktop.
- Section rhythm: 64–96px marketing, 24–32px application.
- Cards: 20–24px padding. Controls: 40px height, 10px radius.

## Signature Elements
- Layered A4 resume sheets in the landing hero with a restrained pointer parallax.
- Forest score ring and matching chips that reuse the analyzer's visual language.
- Paper-like editor frame around the live A4 preview.
- Template gallery thumbnails rendered from the real resume document components.
- Thin rules and small uppercase section labels instead of heavy card chrome.

## Motion
- 150ms color/transform transitions; 200ms for surfaces.
- Pointer parallax only on the landing hero; disabled for `prefers-reduced-motion`.
- No perpetual floating objects, scroll-jacking, or animated gradients.

## Constraints
- Preserve React 19 + Vite + Tailwind, routing, auth, data layer, and API contracts.
- Preserve A4 geometry, print CSS, offline mode, and accessibility.
- No new dependency for 3D; layered HTML/CSS provides the dimensionality.
- Icons: Lucide only, consistent 16/18/20px sizing.
- No emoji icons, fake metrics, or placeholder copy.
