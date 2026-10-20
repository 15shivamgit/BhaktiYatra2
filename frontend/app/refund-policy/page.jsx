import ProsePage from '@/components/layout/ProsePage';
import { BUSINESS } from '@/lib/config';
import { t } from '@/lib/i18n';

export const metadata = {
  title: t('pages.refund'),
  description: 'Cancellation charges, refunds and what happens if BhaktiYatra cancels a tour.',
  alternates: { canonical: '/refund-policy' },
};

/** Text from docs/07-content/05-cancellation-refund-policy.md. */
const SLABS = [
  ['30 days or more before departure', '10%', '90%'],
  ['15 to 29 days before', '25%', '75%'],
  ['7 to 14 days before', '50%', '50%'],
  ['3 to 6 days before', '75%', '25%'],
  ['Less than 72 hours before, or no-show', '100%', 'No refund'],
];

export default function RefundPolicyPage() {
  return (
    <ProsePage title={t('pages.refund')} updated="20 October 2026">
      <h2>1. Scope</h2>
      <p>
        This policy applies to all tours booked on the {BUSINESS.name} website. By completing a
        booking you agree to it. Tour-specific terms shown on a tour page take priority where they
        differ.
      </p>
      <h2>2. How to cancel</h2>
      <ul>
        <li>
          <strong>Before payment:</strong> an unpaid booking can be cancelled at any time from My
          Bookings. Held seats are released immediately and nothing is charged.
        </li>
        <li>
          <strong>After payment:</strong> open the booking in My Bookings and choose Request
          cancellation, or call or email us with your booking reference. The cancellation date is
          the date we receive your request.
        </li>
      </ul>
      <h2>3. Cancellation charges</h2>
      <p>
        Charges are a percentage of the total booking amount and depend on when we receive your
        request.
      </p>
      <table>
        <thead>
          <tr>
            <th scope="col">When we receive your request</th>
            <th scope="col">Charge</th>
            <th scope="col">Refund</th>
          </tr>
        </thead>
        <tbody>
          {SLABS.map(([when, charge, refund]) => (
            <tr key={when}>
              <td>{when}</td>
              <td>{charge}</td>
              <td>{refund}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <ul>
        <li>
          Payment-gateway charges already deducted by the payment provider are non-refundable when
          you cancel.
        </li>
        <li>Cancelling some travellers in a booking is charged per seat using the same table.</li>
        <li>
          Changing the departure date is treated as a cancellation and a new booking, unless we
          agree otherwise in writing.
        </li>
      </ul>
      <h2>4. If we cancel</h2>
      <p>
        We may cancel or reschedule a departure because of too few travellers, natural events,
        government orders, road closures, temple closures or safety concerns. If we cancel before
        the tour starts, you choose a full refund (including gateway charges) or a free move to
        another departure. If a tour is interrupted after it starts for reasons beyond our control,
        we refund the value of services not used where our suppliers refund us; extra costs caused
        by delays are paid by travellers.
      </p>
      <h2>5. Temple decisions</h2>
      <p>
        Darshan timings, special darshan and access are controlled by temple authorities. A temple
        closing or restricting entry is not a cancellation by {BUSINESS.name}. We will try to
        rearrange the itinerary but cannot refund darshan that a temple did not allow.
      </p>
      <h2>6. Refund method and timeline</h2>
      <p>
        Refunds go to the original payment method through Razorpay. We start the refund within 7
        working days of approving a cancellation; your bank or UPI app may take a further 5–10
        working days to show it. You will receive an email when the refund is processed.
      </p>
      <h2>7. Non-refundable items</h2>
      <p>
        Items marked non-refundable on the tour page, such as helicopter tickets, special darshan
        tickets or permits booked for you, cannot be refunded once purchased.
      </p>
      <h2>8. Payment received after seats ran out</h2>
      <p>
        Rarely, a payment can complete after your seat hold expired and the departure filled. We
        will contact you within 24 hours to offer another departure or a full refund.
      </p>
      <h2>9. Contact</h2>
      <p>
        {BUSINESS.name}, {BUSINESS.address}
        <br />
        Phone <a href={BUSINESS.phoneHref}>{BUSINESS.phoneDisplay}</a> · Email{' '}
        <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a>. Please quote your booking
        reference.
      </p>
    </ProsePage>
  );
}
