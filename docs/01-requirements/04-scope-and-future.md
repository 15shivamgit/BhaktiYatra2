# Scope Boundaries and Future Enhancements

## In scope for v1

Everything marked **Must** in `01-functional-requirements.md`, plus **Should** items unless a phase runs long, in which case the owner decides what slips.

## Explicitly out of scope for v1

| Item | Why deferred | Earliest phase |
|---|---|---|
| Hindi and other language UI/content | Owner decision; do English well first. Architecture keeps strings in one file and content fields extendable. | v1.1 |
| Reviews and ratings | Needs moderation and real customers | v1.1 |
| Coupons and discounts | Needs pricing rules and accounting input | v1.2 |
| Automated refunds via Razorpay API | v1 records refunds manually; automation after policy is final | v1.2 |
| Multiple operators / marketplace | Business model not decided | — |
| Online darshan slot booking | Depends on temple trusts' systems; link out instead | — |
| Hotel, transport, accommodation choices per booking | Complexity; most tours are all-inclusive | v1.2 |
| Phone/OTP login, WhatsApp notifications | Needs SMS/WhatsApp provider and cost approval | v1.1 |
| Wishlist / saved temples | Low value until traffic exists | v1.1 |
| Mobile apps / PWA install | Web first; PWA manifest can be added cheaply later | v1.1 |
| Group booking requests (> 10 seats) | Handled via contact form in v1 | v1.1 |
| City/destination landing pages | Derive from temple data by aggregation once content volume justifies | v1.1 |
| Festival calendar page | Needs curated date data per year | v1.1 |
| Admin analytics charts and reports | Dashboard numbers + CSV export suffice for v1 | v1.1 |
| Background job system (BullMQ/Redis) | `node-cron` in-process is enough for a single instance | When scaling |
| TypeScript | Owner decision; JSDoc for now | Needs approval |

## Future models (do not create until scheduled)

`Review`, `Coupon`, `Refund` (standalone), `Wishlist`, `Festival`, `Translation`, `NewsletterSubscription`, `Operator`.

## Assumptions

- One business entity operates all tours; invoices are issued by BhaktiYatra.
- Prices are whole rupees, INR only.
- A booking belongs to exactly one departure.
- Seats are not assigned (no seat map); only counts matter.
- Children are counted as seats; infant policy is handled in tour text, not in the system.
- Traveller ID proof is collected offline by the operator in v1.

## Open questions (track in decision log when resolved)

| # | Question | Owner | Needed by | Status |
|---|---|---|---|---|
| OQ-1 | Final domain names (frontend and API) for cookie strategy | Shivam | Phase 10 | **Deferred** 2026-10-20: no domain yet; local only (ADR-016) |
| OQ-2 | Business legal name, address, support phone/email for tickets and invoices | Shivam | Phase 7 | **Resolved** 2026-10-20: see `PROJECT_CONTEXT.md` |
| OQ-3 | Cancellation policy text and refund percentages by days-before-departure | Shivam | Phase 5 | **Resolved (draft)** 2026-10-20: `07-content/05-cancellation-refund-policy.md`; legal review before live payments |
| OQ-4 | GST registration status | Shivam + CA | Before production invoices | **Resolved** 2026-10-20: not registered; no tax lines |
| OQ-5 | Initial content: who writes temple descriptions, and image licensing | Shivam | Phase 3 | **Resolved** 2026-10-20: Claude drafts from research, owner reviews; legacy image rights confirmed (ADR-015, ADR-017) |
| OQ-6 | Razorpay live account KYC timeline | Shivam | Phase 10 | Open |
