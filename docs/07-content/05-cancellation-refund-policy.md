# Cancellation and Refund Policy (draft v1)

**Status:** draft written on 2026-10-20 at the owner's request. It follows common practice for Indian pilgrimage tour operators. **Have it reviewed by a lawyer or consumer-law advisor before taking live payments.** The text below is the public page content (`/refund-policy`) and the rules the system implements.

**Operator:** BhaktiYatra, Ramdiri-3, Begusarai, Bihar, India 851129 · Phone +91 74888 81563 · Email 15shivambgs@gmail.com

---

## Public page text

### 1. Scope
This policy applies to all tours booked on the BhaktiYatra website. By completing a booking you agree to it. Tour-specific terms shown on a tour page take priority where they differ.

### 2. How to cancel
- **Before payment:** an unpaid booking can be cancelled at any time from *My Bookings*. Held seats are released immediately. Nothing is charged.
- **After payment:** open the booking in *My Bookings* and choose *Request cancellation*, or call or email us with your booking reference. The cancellation date is the date we receive your request.

### 3. Cancellation charges (cancelled by the traveller)

Charges are a percentage of the total booking amount and depend on how many days before the departure start date we receive your request.

| When we receive your request | Cancellation charge | Refund |
|---|---|---|
| 30 days or more before departure | 10 % | 90 % |
| 15 to 29 days before | 25 % | 75 % |
| 7 to 14 days before | 50 % | 50 % |
| 3 to 6 days before | 75 % | 25 % |
| Less than 72 hours before, or no-show | 100 % | No refund |

- Payment-gateway charges already deducted by the payment provider are non-refundable when the traveller cancels.
- Partial cancellation (some travellers in a booking) is charged per seat using the same table.
- Changing the departure date is treated as a cancellation and a new booking, unless we agree otherwise in writing.

### 4. Cancellation by BhaktiYatra
We may cancel or reschedule a departure because of too few travellers, natural events, government orders, road or route closures, temple closures, or safety concerns.
- If we cancel **before** the tour starts: you choose a **full refund** (including gateway charges) or a free move to another departure.
- If the tour is interrupted **after** it starts for reasons beyond our control (weather, landslides, government orders): we refund the value of services not used, where our suppliers refund us. Extra costs from delays (additional hotel nights, meals, transport) are paid by travellers.

### 5. Temple-specific situations
Darshan timings, special darshan, and access are controlled by temple authorities. If a temple closes, restricts entry, or changes timings, this is not a cancellation by BhaktiYatra. We will try to rearrange the itinerary but cannot refund for darshan that the temple authority did not allow.

### 6. Refund method and timeline
- Refunds go to the original payment method through Razorpay.
- We start the refund within **7 working days** of approving a cancellation.
- Your bank or UPI app may take a further **5–10 working days** to show it.
- You receive an email when the refund is processed.

### 7. Non-refundable items
Items marked "non-refundable" on the tour page, such as helicopter tickets, special darshan tickets, or permits booked on your behalf, are not refundable once purchased, whatever the cancellation date.

### 8. Payment received after seats ran out
Rarely, a payment can complete after your seat hold expired and the departure filled. We will contact you within 24 hours to offer another departure or a **full refund**.

### 9. Contact
BhaktiYatra, Ramdiri-3, Begusarai, Bihar, India 851129  
Phone: +91 74888 81563 · Email: 15shivambgs@gmail.com  
Please quote your booking reference (for example BY-20260510-7K3QZ).

*Last updated: 20 October 2026.*

---

## System rules derived from this policy

These go into `backend/src/config/constants.js` as `CANCELLATION_SLABS` so the admin cancel dialog can suggest the refund amount. Admin can override with a reason (audited).

```js
// daysBefore = whole days between request time (IST) and departure startDate (IST midnight)
export const CANCELLATION_SLABS = [
  { minDaysBefore: 30, chargePct: 10 },
  { minDaysBefore: 15, chargePct: 25 },
  { minDaysBefore: 7,  chargePct: 50 },
  { minDaysBefore: 3,  chargePct: 75 },
  { minDaysBefore: 0,  chargePct: 100 }, // < 72 h or no-show
];
export const REFUND_START_WORKING_DAYS = 7;
```

- `suggestedRefund = amount × (100 − chargePct) / 100`, rounded down to whole rupees, using `cancellation.requestedAt`.
- Departure cancelled by admin (`cancellation.departureCancelled = true`): suggested refund = 100 % of amount.
- `payment_received_no_seats`: suggested refund = 100 %.
- User cancelling a **pending** (unpaid) booking: no charge, no refund needed.
- Gateway-fee deduction is not computed automatically in v1; admin enters the final refund amount.
- The booking detail page shows the slab that applies today and the suggested refund before the user confirms a cancellation request.
