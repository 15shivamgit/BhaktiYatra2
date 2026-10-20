import Link from 'next/link';
import ProsePage from '@/components/layout/ProsePage';
import { BUSINESS } from '@/lib/config';
import { t } from '@/lib/i18n';

export const metadata = {
  title: t('pages.about'),
  description: 'BhaktiYatra helps pilgrims explore India’s temples and plan organised yatras.',
  alternates: { canonical: '/about' },
};

export default function AboutPage() {
  return (
    <ProsePage title={t('pages.about')}>
      <p>
        BhaktiYatra began with a simple idea: planning a visit to a temple should be easy. Pilgrims
        need clear, practical details such as darshan timings, how to reach, what to wear and the
        best season to travel, alongside the history and stories that make each place sacred.
      </p>
      <h2>What we do</h2>
      <ul>
        <li>
          <Link href="/temples">Temple guides</Link> with timings, festivals, directions and maps.
        </li>
        <li>
          <Link href="/circuits">Pilgrimage circuits</Link> such as the Char Dham and the 12
          Jyotirlingas, in their traditional order.
        </li>
        <li>Organised pilgrimage tours with clear itineraries, coming soon.</li>
      </ul>
      <h2>Our approach</h2>
      <p>
        We write respectfully about every tradition and describe beliefs as devotees hold them.
        Temple timings and rules change with seasons and festivals, so we always suggest confirming
        with the temple before you travel. If you notice something out of date, please{' '}
        <Link href="/contact">tell us</Link>.
      </p>
      <h2>Contact</h2>
      <p>
        {BUSINESS.name}, {BUSINESS.address}
        <br />
        Phone: <a href={BUSINESS.phoneHref}>{BUSINESS.phoneDisplay}</a> · Email:{' '}
        <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a>
      </p>
    </ProsePage>
  );
}
