# Glossary

| Term | Meaning in this project |
|---|---|
| **Temple** | A single religious site with its own public page and content record. The core content entity. |
| **Circuit** | A curated, ordered group of temples with a shared theme (Char Dham, 12 Jyotirlingas, 51 Shakti Peeths, Panch Kedar). Explore-only. |
| **Deity** | The principal deity of a temple (Shiva, Vishnu, Devi, Hanuman, Ganesha, etc.). Used as a filter. |
| **Darshan** | Viewing of the deity; "darshan timings" are the hours the sanctum is open to visitors. |
| **Aarti** | Ritual of light performed at fixed times; listed per temple. |
| **Tour** | A packaged pilgrimage product: title, itinerary, inclusions, base price. Not bookable directly. |
| **Departure** | A dated run of a tour with its own seat inventory and optional price. The bookable unit. |
| **Seat** | One traveller place on a departure. |
| **Hold** | Seats subtracted from `seatsAvailable` while a booking is pending payment; released on expiry. |
| **Booking** | A user's reservation on a departure: travellers, seats, amount, statuses, references. |
| **Booking reference** | Human-friendly unique id, format `BY-YYYYMMDD-XXXXX`, shown to users and on tickets. |
| **Order** | Razorpay order created for a pending booking; `razorpayOrderId`. |
| **Payment** | Our record of a provider payment attempt, linked to a booking. |
| **Verify (client)** | Frontend posts Razorpay's `order_id`, `payment_id`, `signature` after checkout; backend checks HMAC. |
| **Webhook** | Razorpay server-to-server event (`payment.captured`, `payment.failed`); backend checks the webhook signature. |
| **Idempotent** | Repeating the same operation produces the same result once; a payment id confirms a booking at most once. |
| **Ticket** | PDF issued after confirmation with booking details and a QR code. |
| **Ticket token** | Signed opaque string encoded in the QR; resolves via the verification endpoint. |
| **Invoice** | PDF with a unique `INV-YYYY-NNNNNN` number issued after confirmation. |
| **Admin** | User with `role: 'admin'`; full back-office access. |
| **Audit log** | Immutable record of sensitive actions (who, what, before/after). |
| **Published / Draft / Archived** | Content status. Only `published` appears publicly; `archived` is hidden but retained for history. |
| **Slug** | URL-safe unique identifier, e.g. `kashi-vishwanath-varanasi`. |
| **IST** | Indian Standard Time, `Asia/Kolkata`. All displayed times. |
