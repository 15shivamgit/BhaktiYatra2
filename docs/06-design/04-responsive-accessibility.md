# Responsive and Accessibility Rules

## Breakpoints (Tailwind defaults)

| Name | Min width | Typical use |
|---|---|---|
| base | 0 | phones 320–639 |
| `sm` | 640 | large phones |
| `md` | 768 | tablets portrait |
| `lg` | 1024 | tablets landscape, small laptops |
| `xl` | 1280 | desktops |
| `2xl` | 1536 | wide |

Test matrix (Playwright projects): 360×800 (Android), 390×844 (iPhone), 768×1024 (iPad), 1024×768, 1280×800, 1536×864.

## Layout rules

- No horizontal page scroll at any width (automated check: `document.documentElement.scrollWidth <= innerWidth`).
- Tap targets ≥ 44×44 px on touch; spacing ≥ 8 px between adjacent targets.
- Text never below 14 px for body-ish content; 12 px only for captions.
- Images keep aspect ratio with `object-cover`; never stretch.
- Sticky elements (navbar, booking bar, section nav) must not cover focused inputs; use `scroll-margin-top`.
- Tables: on `< md`, admin tables scroll inside a container; public tables (timings, departures) switch to stacked cards.
- Filters: sidebar at `≥ lg`, sheet below.
- Forms: single column below `md`; labels above inputs always.
- Modals become full-screen sheets below `sm`.

## Performance on mobile

- Hero image ≤ 200 KB at 1280 w via Cloudinary; `priority` only on the LCP image.
- Fonts: two families, subset Latin, `display: swap`.
- Leaflet and Razorpay scripts loaded only on pages that use them.
- Lists paginated; infinite scroll not used (SEO and back-button friendliness).

## Accessibility (WCAG 2.1 AA)

| Area | Rule |
|---|---|
| Structure | One `h1` per page; headings in order; landmarks `header`, `nav`, `main`, `footer`, `aside` |
| Colour | Contrast ≥ 4.5:1 text, ≥ 3:1 UI components; status never conveyed by colour alone (badge text + icon) |
| Focus | Visible 2 px ring on all interactive elements; logical tab order; skip-to-content link |
| Keyboard | Menus, dialogs, sheets, accordions, tabs, carousels, date pickers fully operable; dialogs trap focus and restore on close; Escape closes |
| Forms | `label` for every control; errors linked via `aria-describedby`; on submit failure focus first invalid field; required marked in text, not only asterisk colour |
| Images | Meaningful `alt` from content; decorative `alt=""`; gallery thumbnails labelled "Image n of m" |
| Motion | Respect `prefers-reduced-motion`; no autoplay carousels |
| Live regions | Toasts and countdown use `aria-live="polite"`; payment status changes announced |
| Maps | Provide list alternative to map; markers have accessible names; map container `role="region"` with label |
| Language | `lang="en"` now; `lang="hi"` on Hindi content later |
| Zoom | Layout usable at 200 % zoom; no `maximum-scale` restriction |
| Touch | Gestures have button equivalents (carousel arrows) |

## Checks in CI and review

- `eslint-plugin-jsx-a11y` enabled.
- Playwright runs `@axe-core/playwright` on: home, temples list, temple detail, tour detail, booking page (pre-payment), login, account bookings, admin bookings. Zero serious/critical violations.
- Manual keyboard pass on booking flow and admin forms before each phase exit.
- Lighthouse accessibility ≥ 90 on public pages.

## Content formatting

- Dates: `10 May 2026`; ranges `10 – 16 May 2026`; times `04:00 – 11:00 IST`.
- Currency: `₹24,999`; never `Rs.`; no decimals.
- Phone: `+91 98765 43210` display; tel: links.
- Addresses: multi-line with `address` element.
