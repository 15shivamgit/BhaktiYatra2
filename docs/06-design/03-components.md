# Component Catalogue

Location in `frontend/components/`. Props are described informally; implement with JSDoc.

## layout/

| Component | Props | Notes |
|---|---|---|
| `Navbar` | `variant: 'transparent'|'solid'` | reads user from `useUser()`; renders `UserMenu` or auth buttons |
| `UserMenu` | — | avatar, dropdown: My bookings, Profile, Admin (if admin), Log out |
| `MobileNav` | `open, onOpenChange` | sheet |
| `Footer` | — | |
| `Container` | `size: 'default'|'narrow'|'wide'` | max widths 1280 / 800 / 1440 |
| `PageHeader` | `title, subtitle, breadcrumb, actions` | |
| `SectionHeading` | `eyebrow, title, description, action` | gold rule motif |
| `AdminShell` | `children` | sidebar + topbar |
| `AdminSidebar` | `collapsed` | |

## seo/

| Component | Props |
|---|---|
| `JsonLd` | `data` (object) → `<script type="application/ld+json">` |
| helpers `buildTempleJsonLd(temple)`, `buildTourJsonLd(tour)`, `buildBreadcrumbJsonLd(items)` | in `lib/seo.js` |

## temples/

| Component | Props | Notes |
|---|---|---|
| `TempleCard` | `temple: TempleCard, variant: 'grid'|'row'|'compact'` | image 3:2, name, deity, city·state, featured ribbon |
| `TempleFilters` | `filters, value, onChange` | search, state, deity, circuit, featured; mobile sheet wrapper `TempleFiltersSheet` |
| `TempleGallery` | `images` | main + thumbs; lightbox dialog |
| `QuickFacts` | `temple` | 4 tiles |
| `TimingsTable` | `timings, aartiSchedule` | highlights "today" |
| `FestivalList` | `festivals` | grouped by month |
| `HowToReach` | `howToReach, location` | tiles + "Open in Google Maps" link |
| `RulesList` | `rules, entryFee` | |
| `TempleMap` | `temples[], center, zoom, polyline?` | client-only, lazy; clusters |
| `NearbyTemples` | `templeSlug` | fetches `/temples/:slug/nearby` client-side or receives data |
| `SectionNav` | `sections: [{id,label}]` | scroll-spy |
| `CircuitCard`, `CircuitRoute` | | |

## tours/

| Component | Props | Notes |
|---|---|---|
| `TourCard` | `tour: TourCard` | price-from, next departure chip, seats-left badge |
| `TourFilters` | | price slider, duration chips, month, pickup, destination |
| `ItineraryAccordion` | `itinerary` | day badges, meals icons, stay |
| `InclusionsExclusions` | `inclusions, exclusions` | two columns, check/x icons |
| `DepartureSelector` | `departures, value, onChange` | radio cards: date range, pickup, price, seats badge; disabled when not bookable with reason |
| `DeparturesTable` | `departures` | public table |
| `BookingCard` | `tour, departures` | sticky; contains selector + CTA |
| `MobileBookBar` | | fixed bottom |
| `PriceTag` | `amount, caption` | |

## bookings/

| Component | Props | Notes |
|---|---|---|
| `BookingForm` | `tour, departure, user` | react-hook-form + zod; seats stepper regenerates traveller rows preserving entered data |
| `TravellerFields` | `index` | name, age, gender |
| `BookingSummaryCard` | `tour, departure, seats, unitPrice` | live total |
| `HoldCountdown` | `expiresAt, onExpire` | mm:ss, colour shifts under 2 min |
| `PaymentPanel` | `booking, payment, checkout` | state machine UI per payments spec; loads Razorpay script |
| `BookingStatusBadge`, `PaymentStatusBadge` | `status` | |
| `BookingListItem` | `booking` | account list |
| `BookingTimeline` | `timeline` | |
| `DocumentButtons` | `reference, hasTicket, hasInvoice` | download via API with auth |
| `CancelBookingDialog` | `booking` | policy text, reason |

## admin/

| Component | Props | Notes |
|---|---|---|
| `DataTable` | `columns, queryKey, fetcher, filters, exportUrl?` | TanStack Table + Query; URL-synced state |
| `StatusBadge` | `domain, value` | |
| `ImageUploader` | `images, onUpload, onUpdate, onDelete, max` | |
| `RichTextEditor` | `value, onChange` | Tiptap |
| `FormTabs` | `tabs: [{id,label,errorCount}]` | |
| `ConfirmDialog` | `title, description, requireReason, onConfirm` | |
| `StatCard` | `label, value, delta?, tone` | |
| `AlertStrip` | `alerts` | |
| `EntityTimeline` | `items` | |
| `JsonDiff` | `before, after` | audit |
| `TempleForm`, `CircuitForm`, `TourForm`, `DepartureDialog`, `InventoryDialog`, `CancelDepartureDialog` | | feature forms |
| `MapPicker` | `value {lat,lng}, onChange` | click to set coordinates; search by place name (Nominatim, Should) |

## ui/ (shadcn)

Button, Input, Textarea, Label, Select, Combobox, Checkbox, RadioGroup, Switch, Card, Badge, Tabs, Accordion, Dialog, Sheet, DropdownMenu, Tooltip, Toast (sonner), Skeleton, Breadcrumb, Pagination, Table, Separator, Avatar, Calendar/DatePicker, Slider, Progress, Alert.

## Hooks (`hooks/`)

`useUser()`, `useDebounce()`, `useUrlFilters(schema)`, `useCountdown(expiresAt)`, `useRazorpay()`, `useMediaQuery()`, `useCopyToClipboard()`.

## Component rules

- Every interactive component is keyboard operable and has visible focus.
- Images through `next/image` with Cloudinary loader; `sizes` set per layout.
- Client Components are marked `'use client'` and kept small; data arrives via props from Server Components where possible.
- Strings from `messages/en.json` via a tiny `t(key)` helper (swap for next-intl later).
- No component fetches on the server and client both; pick one and document in the file header.
