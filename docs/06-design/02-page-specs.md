# Page Specifications

Each page: purpose, layout (desktop → mobile), content blocks in order, states, SEO. Components referenced are in `03-components.md`.

## Global

- **Navbar**: logo (left), links Temples · Circuits · Tours · About · Contact (centre), search icon, auth area (right). Transparent over hero on home, solid `--surface` elsewhere and on scroll. Mobile: logo + search + hamburger → sheet with links and auth.
- **Footer**: 4 columns (About + logo, Explore links, Travel links, Contact + social), bottom bar with policies and copyright. Mobile stacks.
- **Breadcrumb** on all detail pages.
- **Loading**: route-level `loading.jsx` skeletons; **Error**: `error.jsx` with retry; **404**: friendly page with search and featured links.

## Home `/`

1. Hero: full-bleed temple image with soft dark gradient, display headline ("Explore the sacred heart of India"), subline, search box (temples and tours, typeahead), two CTAs (Explore temples, View tours).
2. Featured circuits: horizontal cards row (4), "View all".
3. Featured temples: 8-card grid with state filter chips above (All, Uttarakhand, Tamil Nadu…).
4. Upcoming tours: 3–4 TourCards sorted by soonest departure, "View all tours".
5. Why BhaktiYatra: 4 value props with icons (verified timings, curated circuits, trusted yatras, support).
6. How booking works: 3 steps.
7. Browse by state: compact grid of states with counts (links to filtered list).
8. Contact / enquiry band with phone, email, short form (name, phone, message).

SEO: Organization + WebSite (with SearchAction) JSON-LD.

## Temples list `/temples`

Desktop: 3-column filter sidebar (sticky) + 9-column results; toolbar with result count, sort, grid/map toggle. Mobile: filter button → sheet; sticky toolbar.  
Results: TempleCard grid, pagination. Map mode: full-height map with clustered markers and side list.  
States: skeleton grid; empty with suggestions; error with retry.  
SEO: canonical with filters normalised; `noindex` when `page > 1` and no filters? No: paginate with `rel=next/prev` style links in body, index all.

## Temple detail `/temples/[slug]`

Above the fold: breadcrumb; H1 name; meta line (deity · city, state); hero gallery (main + thumbnails, lightbox); quick-facts strip (Timings today, Best time, Nearest rail, Entry fee).  
Sticky section nav (desktop left rail / mobile horizontal scroll).  
Sections: Overview · History & Significance · Darshan timings & Aarti (table) · Festivals (cards by month) · How to reach (4 tiles + "Open in Maps") · Rules & dress code (checklist) · Map (lazy) · Part of circuits (chips) · Tours covering this temple (3 cards) · Nearby temples (6 cards).  
Right rail (desktop, sticky): "Plan a yatra" card with top tour + CTA, official website / darshan booking links, share buttons.  
SEO: `PlaceOfWorship`/`HinduTemple` JSON-LD, breadcrumbs JSON-LD, OG image = primary.

## Circuits `/circuits`, `/circuits/[slug]`

List: large cards (image, name, region, temple count, 1-line).  
Detail: hero, description, map with numbered markers and polyline, vertical route of temples (number, card, distance to next — Should), tours covering circuit.

## Tours list `/tours`

Like temples list with tour filters and sort; TourCard grid; "bookable only" toggle default off.

## Tour detail `/tours/[slug]`

Hero gallery; title; meta (duration, destinations, pickup cities); price-from; sticky booking card (right) with departure selector and CTA; mobile bottom bar (price + Book now → opens sheet with selector).  
Sections: Highlights · Itinerary accordion · Inclusions/Exclusions two columns · Temples covered · Departures table · FAQs · Policies summary.  
SEO: `TouristTrip` JSON-LD with `offers`.

## Booking `/tours/[slug]/book?departure=<id>`

Auth required. Two-column: left form (contact, seats stepper, traveller fields generated per seat, terms checkbox), right summary (tour, departure, pickup, seats × price, total, "Hold valid 15 min after you continue").  
Submit → creates booking → page switches to Payment state with countdown, order summary, Pay button (opens Razorpay), Cancel link.  
Post-payment: success panel with reference, buttons to ticket and My bookings; or failure/retry per `05-features/05-payments.md`.  
Mobile: single column; summary collapsible at top; sticky pay bar.

## Account

- `/account`: profile form; change password.
- `/account/bookings`: tabs Upcoming · Past · Cancelled; BookingSummary cards with status badges, countdown for pending, actions (Pay now, View, Download ticket).
- `/account/bookings/[reference]`: header with reference and statuses; departure and tour card; travellers; payment info; documents; timeline; cancel/request-cancellation button with policy text.

## Auth pages

Centered card on soft background with a subtle temple image on the side (desktop). Forms per `05-features/02-auth-profile.md`.

## Verify `/verify/[token]`

Minimal page: result card, no nav distractions, large status, reference, tour, date, seats.

## Static: About, Contact, Privacy, Terms, Cancellation & Refund

Prose layout (max 72 ch), table of contents on long policies, last-updated date. Contact page: info cards + form + map of office (optional).

## Admin pages

See `05-features/07-admin-panel.md`. Visual: maroon sidebar (`--accent`) with white text, content on `--bg`, dense spacing (base 8 px), tables with sticky header.

## Not found / error

Illustration (line art), message, search box, links to Temples and Tours.
