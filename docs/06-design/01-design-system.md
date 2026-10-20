# Design System

Goal: a calm, premium, trustworthy pilgrimage-travel look. Warm neutrals, one saffron accent, deep maroon for emphasis, generous whitespace, serif display headings paired with a clean sans body. Avoid gradients-on-everything, neon reds and stock "travel site" clutter.

## Colour tokens

Defined in `frontend/app/globals.css` inside Tailwind 4's `@theme` block as `--color-<name>`, which generates utilities such as `bg-primary`, `text-text-muted`, `border-border` (ADR-022). Light theme only in v1; variables make dark theme possible later.

| Token | Hex | Use |
|---|---|---|
| `--color-bg` | `#FFFCF7` | page background (warm off-white) |
| `--color-surface` | `#FFFFFF` | cards, panels |
| `--color-surface-muted` | `#F6F1E8` | section bands, table headers |
| `--color-border` | `#E8E0D2` | hairlines |
| `--color-text` | `#1F1B16` | primary text (16.7:1 on bg) |
| `--color-text-muted` | `#6B6157` | secondary text (5.9:1 on bg) |
| `--color-saffron` | `#D9731F` | **decorative only**: icons, rules, focus ring. Never text or button fill (3.27:1 with white) |
| `--color-primary` | `#B4580F` | primary buttons (white text 4.83:1), links (4.72:1 on bg), active states |
| `--color-primary-hover` | `#A84F0C` | |
| `--color-primary-soft` | `#FBEBDD` | tinted backgrounds; text on it uses `accent` |
| `--color-accent` | `#7A1F2B` | maroon: heading accents, emphasis, admin sidebar (10.2:1 with white) |
| `--color-accent-soft` | `#F3E3E5` | |
| `--color-gold` | `#C8A24A` | decorative rules, ratings later |
| `--color-success` | `#256B42` / soft `#E3F2E8` | confirmed, published (5.56:1) |
| `--color-warning` | `#8A5A12` / soft `#FBF1DC` | pending, few seats (5.27:1) |
| `--color-danger` | `#B3261E` / soft `#F9E1DF` | cancelled, errors (5.25:1) |
| `--color-info` | `#2B5F9E` / soft `#E1EAF6` | neutral status (5.35:1) |
| focus ring | `saffron`, 2 px, 2 px offset | `:focus-visible` |

Contrast was measured on 2026-10-20 (ADR-023). Status text always sits on its own soft tint.

## Typography

| Role | Font | Weights | Sizes (desktop / mobile) |
|---|---|---|---|
| Display / H1 | `Cormorant Garamond` (Google Fonts) | 600 | 48 / 36 px, line-height 1.1 |
| H2 | Cormorant Garamond | 600 | 36 / 28 px |
| H3 | `Inter` | 600 | 24 / 20 px |
| H4 | Inter | 600 | 18 / 16 px |
| Body | Inter | 400 | 16 / 16 px, line-height 1.6 |
| Small | Inter | 400 | 14 px |
| Caption | Inter | 500 | 12 px, tracking 0.02em, uppercase for labels |
| Numbers (prices) | Inter | 600, `font-variant-numeric: tabular-nums` | |

Loaded via `next/font` with `display: swap`. Devanagari fallback later: `Noto Serif Devanagari`, `Noto Sans Devanagari`.

## Spacing and layout

- Base unit 4 px. Scale: 4, 8, 12, 16, 24, 32, 48, 64, 96.
- Container max width 1280 px, side padding 16 px (mobile), 24 px (tablet), 32 px (desktop).
- Section vertical rhythm: 64 px desktop, 40 px mobile.
- Grid: 12 columns desktop; cards 4-up (≥ 1280), 3-up (≥ 1024), 2-up (≥ 640), 1-up below.

## Radii, shadows, borders

- Radius: `sm 6px`, `md 10px`, `lg 16px`, `xl 24px`, `full`.
- Cards: `md` radius, 1 px `--border`, shadow `0 1px 2px rgba(31,27,22,.06)`; hover lift `0 8px 24px rgba(31,27,22,.10)` with 150 ms ease.
- Buttons: `md` radius. Inputs: `md`.
- No heavy drop shadows; depth via borders and soft tints.

## Components (shadcn/ui base, themed)

| Component | Variants | Notes |
|---|---|---|
| Button | `primary`, `secondary` (maroon outline), `ghost`, `link`, `destructive`; sizes `sm 36`, `md 44`, `lg 52` px | min tap target 44 px on mobile |
| Input, Textarea, Select, Combobox, DatePicker, NumberStepper | default, error, disabled | labels always visible; helper and error text below |
| Checkbox, Radio, Switch | | |
| Card | default, interactive | |
| Badge / StatusBadge | status map below | |
| Tabs | underline style | admin forms |
| Accordion | | itinerary, FAQ |
| Dialog, Sheet, Drawer | | confirm actions, mobile filters |
| Toast (sonner) | success, error, info | bottom-right desktop, top mobile |
| Skeleton | | all async lists |
| Breadcrumb | | detail pages |
| Pagination | | numbered + prev/next |
| Table (TanStack) | | admin |
| Tooltip | | icon buttons |
| EmptyState | icon, title, text, action | |
| Avatar | initials fallback | |
| Carousel (embla) | gallery, featured rows | arrows + dots, swipe |
| Map (leaflet) | markers, clusters, polyline | lazy |
| Countdown | mm:ss | booking hold |
| PriceTag | "₹24,999" with "per person" caption | |

### Status badge colours

| Domain | Value | Tone |
|---|---|---|
| Content | draft | neutral grey |
| Content | published | success |
| Content | archived | muted |
| Booking | pending | warning |
| Booking | confirmed | success |
| Booking | cancelled / expired | danger / muted |
| Booking | cancellation_requested | info |
| Booking | payment_received_no_seats | danger (pulsing dot) |
| Payment | pending | warning |
| Payment | paid | success |
| Payment | failed | danger |
| Payment | refunded / partially_refunded | info |
| Departure | scheduled | success |
| Departure | full | warning |
| Departure | completed / cancelled | muted / danger |

## Iconography and imagery

- Icons: lucide-react, 20 px default, 24 px in nav, stroke 1.75.
- Imagery: real temple photography, warm grading, no heavy filters; 3:2 for cards, 16:9 hero, 1:1 thumbnails. Always `alt`.
- Decorative motif: a thin gold rule or subtle mandala line pattern at section dividers, used sparingly (max once per page).

## Motion

- Durations 150–250 ms, `ease-out`. Respect `prefers-reduced-motion` (disable lifts and carousels autoplay; autoplay is off anyway).

## Voice and copy

- Respectful, plain, warm. "Darshan timings" not "Opening hours". Avoid exclamation marks except success toasts.
- Prices as `₹24,999` (Indian grouping), dates as `10 May 2026`, times `04:00 – 11:00 IST`.
- Error copy tells what happened and what to do next.

## Tailwind 4 theme excerpt

```css
/* frontend/app/globals.css (excerpt) */
@import 'tailwindcss';
@theme {
  --color-primary: #b4580f;      /* bg-primary, text-primary */
  --color-accent: #7a1f2b;
  --font-sans: var(--font-inter), ui-sans-serif, system-ui, sans-serif;
  --font-display: var(--font-cormorant), ui-serif, Georgia, serif;  /* font-display */
  --radius-md: 10px;             /* rounded-md */
  --container-page: 80rem;       /* max-w-page (1280px) */
  --container-narrow: 50rem;     /* max-w-narrow (800px) */
}
```
