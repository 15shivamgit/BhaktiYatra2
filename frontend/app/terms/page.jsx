import Link from 'next/link';
import ProsePage from '@/components/layout/ProsePage';
import { BUSINESS } from '@/lib/config';
import { t } from '@/lib/i18n';

export const metadata = { title: t('pages.terms'), alternates: { canonical: '/terms' } };

export default function TermsPage() {
  return (
    <ProsePage title={t('pages.terms')} updated="20 October 2026">
      <p>
        These terms apply to your use of the {BUSINESS.name} website. By using the website you agree
        to them.
      </p>
      <h2>Temple information</h2>
      <p>
        We work to keep temple information accurate, but darshan timings, fees, rules and access are
        set by temple authorities and can change without notice, especially on festival days and
        during weather disruptions. Please confirm important details with the temple before you
        travel. We are not responsible for losses caused by changes made by temple authorities.
      </p>
      <h2>Your account</h2>
      <p>
        Keep your password private and tell us if you think someone else has used your account. You
        are responsible for activity on your account. We may suspend accounts that misuse the
        website.
      </p>
      <h2>Tours and bookings</h2>
      <p>
        When tour bookings open, each booking is subject to the tour details shown at the time of
        booking and to our <Link href="/refund-policy">cancellation and refund policy</Link>.
      </p>
      <h2>Content</h2>
      <p>
        Text and photographs on this website belong to {BUSINESS.name} or are used with permission.
        Please do not copy them for commercial use without asking.
      </p>
      <h2>Liability</h2>
      <p>
        The website is provided as is. To the extent the law allows, our liability for any claim
        relating to the website is limited to the amount you paid us for the service concerned.
      </p>
      <h2>Governing law</h2>
      <p>
        These terms are governed by the laws of India. Courts at Begusarai, Bihar, have jurisdiction
        over any dispute.
      </p>
      <h2>Contact</h2>
      <p>
        {BUSINESS.name}, {BUSINESS.address} ·{' '}
        <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a>
      </p>
    </ProsePage>
  );
}
