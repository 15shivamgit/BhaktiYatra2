# User Roles and Personas

## Roles (enforced by the backend)

| Role | How obtained | Can |
|---|---|---|
| **Visitor** (unauthenticated) | Default | Browse temples, circuits, tours; search; read static pages; submit contact form; register; log in |
| **User** (`role: user`) | Registration | Everything a visitor can, plus: manage profile, create bookings, pay, view own bookings, download own tickets/invoices, cancel own pending bookings, request cancellation |
| **Admin** (`role: admin`) | Granted by an existing admin or the seed script | Everything a user can, plus: `/admin` UI and `/api/v1/admin/*`; manage temples, circuits, tours, departures, inventory, bookings, users, contacts; view payments and audit logs |

Rules:
- Role lives on the User document and inside the JWT; the backend re-reads the user on sensitive admin actions to catch demotion/deactivation.
- A deactivated user (`isActive: false`) gets 401 on every authenticated route and cannot log in.
- An admin cannot demote or deactivate themselves.
- There is no "super admin" in v1. Add when there is more than one admin and a need to restrict.

## Personas (to guide design and copy)

### 1. Sunita, 58, Lucknow — the planner
Plans a Char Dham yatra for her family. Uses a mid-range Android phone, reads Hindi more comfortably than English but manages English. Needs: large readable text, clear dates and prices, a phone number to call, a ticket she can show her son. Fears: paying online and getting nothing.

Design implications: trust signals (contact details, clear policies), countdown and status messages in plain language, ticket emailed and downloadable, big tap targets.

### 2. Rahul, 29, Bengaluru — the weekend pilgrim-traveller
Searches "temples near Coorg" or "Murudeshwar timings" on Google at night. Wants timings, how to reach, best time, photos, and maybe a nearby place to combine. Might book a 3-day tour if it fits a long weekend.

Design implications: SEO pages that answer the query above the fold, map, nearby temples, "tours covering this temple".

### 3. Priya, 35, operations at BhaktiYatra — the admin
Adds temples and tours, opens departures each season, watches bookings, answers calls from customers asking about their booking, occasionally fixes a mistaken seat count. Works on a laptop, sometimes a tablet.

Design implications: fast search by booking reference or phone, clear status badges, safe inventory edits with warnings, audit trail so mistakes can be traced, CSV export for the accountant.

### 4. Arjun, 22, student — the explorer
Reads about Jyotirlingas for a project or out of curiosity. Never books. Shares a page on WhatsApp.

Design implications: good Open Graph previews, readable long-form content, circuit pages that tell a story.

## Permission matrix (summary)

| Action | Visitor | User | Admin |
|---|---|---|---|
| View published temples/circuits/tours | ✓ | ✓ | ✓ |
| View draft/archived content | ✗ | ✗ | ✓ |
| Register / login | ✓ | – | – |
| Edit own profile | ✗ | ✓ | ✓ |
| Create booking, pay | ✗ | ✓ | ✓ |
| View booking | ✗ | own | all |
| Download ticket/invoice | ✗ | own | all |
| Cancel pending booking | ✗ | own | all |
| Change booking status (allowed transitions) | ✗ | ✗ | ✓ (audited) |
| Manage content, tours, departures | ✗ | ✗ | ✓ |
| Manage users and roles | ✗ | ✗ | ✓ (not self) |
| View payments, audit logs | ✗ | ✗ | ✓ |
