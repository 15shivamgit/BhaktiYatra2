import { CheckCircle2, XCircle } from 'lucide-react';
import { Suspense } from 'react';
import Container from '@/components/layout/Container';
import { BUSINESS, serverApiBaseUrl } from '@/lib/config';
import { formatDateRange } from '@/lib/format';
import { t } from '@/lib/i18n';

export const metadata = { title: 'Ticket check', robots: { index: false, follow: false } };

/** Always live: a ticket can be cancelled at any moment. */
async function check(token) {
  try {
    const res = await fetch(`${serverApiBaseUrl()}/tickets/verify/${encodeURIComponent(token)}`, {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(8000),
    });
    const body = await res.json();
    return body.data ?? { valid: false, reason: 'not_found' };
  } catch {
    return null;
  }
}

async function Result({ params }) {
  const { token } = await params;
  const result = await check(token);
  if (!result) {
    return <p className="text-center text-text-muted">{t('errors.network')}</p>;
  }
  const rows = result.bookingReference
    ? [
        [t('verify.reference'), result.bookingReference],
        [t('verify.tour'), result.tour],
        [t('verify.dates'), formatDateRange(result.startDate, result.endDate)],
        [t('verify.seats'), result.seats],
        [t('verify.travellers'), result.travellerCount],
      ]
    : [];
  return (
    <section
      aria-labelledby="verify-result"
      className={`rounded-xl border-2 p-6 text-center sm:p-10 ${
        result.valid ? 'border-success bg-success-soft' : 'border-danger bg-danger-soft'
      }`}
    >
      {result.valid ? (
        <CheckCircle2 aria-hidden="true" className="mx-auto size-16 text-success" />
      ) : (
        <XCircle aria-hidden="true" className="mx-auto size-16 text-danger" />
      )}
      <h1
        id="verify-result"
        className={`mt-3 font-display text-4xl font-semibold ${result.valid ? 'text-success' : 'text-danger'}`}
      >
        {result.valid ? t('verify.valid') : t('verify.invalid')}
      </h1>
      {!result.valid && <p className="mt-2 text-text">{t(`verify.reason_${result.reason}`)}</p>}
      {rows.length > 0 && (
        <dl className="mx-auto mt-6 max-w-sm space-y-2 text-left">
          {rows.map(([label, value]) => (
            <div key={label} className="flex justify-between gap-4 border-b border-black/10 pb-2">
              <dt className="text-text-muted">{label}</dt>
              <dd className="text-right font-semibold text-text">{value}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}

/** /verify/[token]: what pickup staff see after scanning a ticket QR code (no personal data). */
export default function VerifyPage({ params }) {
  return (
    <Container size="narrow" className="py-10 sm:py-16">
      <p className="text-center text-sm font-medium uppercase tracking-widest text-text-muted">
        {t('verify.title')}
      </p>
      <div className="mt-4">
        <Suspense
          fallback={
            <div className="h-72 animate-pulse rounded-xl bg-surface-muted" aria-hidden="true" />
          }
        >
          <Result params={params} />
        </Suspense>
      </div>
      <p className="mt-6 text-center text-sm text-text-muted">
        {t('verify.help', { phone: BUSINESS.phoneDisplay })}
      </p>
    </Container>
  );
}
