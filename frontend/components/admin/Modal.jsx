'use client';

import { X } from 'lucide-react';
import { useEffect, useId, useRef } from 'react';
import { t } from '@/lib/i18n';

/**
 * Dialog built on native <dialog>: focus moves inside and is trapped, Escape closes it, and
 * focus returns to the opener. Children mount only while open, so forms start fresh each time.
 * @param {{ open: boolean, onClose: () => void, title: string, children: React.ReactNode }} props
 */
export default function Modal({ open, onClose, title, children }) {
  const ref = useRef(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      className="m-auto w-[min(34rem,calc(100%-2rem))] rounded-lg border border-border bg-surface p-0 text-text shadow-xl backdrop:bg-black/50"
    >
      {open && (
        <div className="max-h-[85dvh] overflow-y-auto p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <h2 id={titleId} className="font-display text-2xl font-semibold text-accent">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label={t('adminTours.close')}
              className="flex size-10 shrink-0 items-center justify-center rounded-md text-text-muted hover:bg-surface-muted"
            >
              <X aria-hidden="true" className="size-5" />
            </button>
          </div>
          <div className="mt-4">{children}</div>
        </div>
      )}
    </dialog>
  );
}
