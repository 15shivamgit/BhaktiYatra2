'use client';

import { Download, FileText, Ticket } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import { apiDownload } from '@/lib/api/client';
import { errorMessage } from '@/lib/api/messages';
import { t } from '@/lib/i18n';

const WITH_DOCUMENTS = new Set(['confirmed', 'cancellation_requested']);
const POLL_MS = 5_000;
const POLL_LIMIT = 12; // one minute

/**
 * E-ticket and invoice downloads for a confirmed booking. Documents are issued right after
 * confirmation; until they are, show "being prepared" and refresh the booking for a minute.
 * @param {{ booking: any, onRefresh: () => void }} props
 */
export default function DocumentDownloads({ booking, onRefresh }) {
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);
  const polls = useRef(0);
  const ready = Boolean(booking.ticket && booking.invoice);
  const eligible = WITH_DOCUMENTS.has(booking.bookingStatus);

  useEffect(() => {
    if (!eligible || ready || polls.current >= POLL_LIMIT) return undefined;
    const id = setTimeout(() => {
      polls.current += 1;
      onRefresh();
    }, POLL_MS);
    return () => clearTimeout(id);
  }, [eligible, ready, booking, onRefresh]);

  if (!eligible) return null;

  const download = async (kind) => {
    setBusy(kind);
    setError(null);
    try {
      await apiDownload(
        `/bookings/${booking.bookingReference}/${kind}`,
        `BhaktiYatra-${kind}-${booking.bookingReference}.pdf`,
      );
    } catch (err) {
      setError(errorMessage(err) === t('errors.generic') ? err.message : errorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  return (
    <section
      aria-labelledby="documents-title"
      className="rounded-lg border border-border bg-surface p-5 shadow-card"
    >
      <h2 id="documents-title" className="font-display text-xl font-semibold text-accent">
        {t('booking.documents')}
      </h2>
      {ready ? (
        <>
          <p className="mt-1 text-sm text-text-muted">
            {t('booking.documentsText', { email: booking.contact?.email ?? '' })}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button onClick={() => download('ticket')} loading={busy === 'ticket'}>
              <Ticket aria-hidden="true" className="size-4" />
              {t('booking.downloadTicket')}
            </Button>
            <Button
              variant="secondary"
              onClick={() => download('invoice')}
              loading={busy === 'invoice'}
            >
              <FileText aria-hidden="true" className="size-4" />
              {t('booking.downloadInvoice')}
            </Button>
          </div>
        </>
      ) : (
        <p role="status" className="mt-1 flex items-center gap-2 text-sm text-text-muted">
          <Download aria-hidden="true" className="size-4 animate-pulse" />
          {t('booking.documentsPreparing')}
        </p>
      )}
      {error && (
        <Alert tone="danger" className="mt-3">
          {error}
        </Alert>
      )}
    </section>
  );
}
