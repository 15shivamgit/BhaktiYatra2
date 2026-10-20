'use client';

import { useState } from 'react';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import { adminErrorMessage } from '@/lib/admin/errors';
import { t } from '@/lib/i18n';

/** True when the API error lists problems per field (validation, reason required, amount). */
const hasFieldDetails = (error) =>
  Array.isArray(error?.details) && error.details.length > 0 && error.details.every((d) => d.path);

/**
 * Field errors from an API error, keyed by the first path segment ("refund") and by the full
 * path ("refund.amount"), without the "body." prefix.
 */
export function fieldErrors(error) {
  if (!hasFieldDetails(error)) return {};
  const fields = {};
  for (const detail of error.details) {
    const path = detail.path.replace(/^body\./, '');
    fields[path] ??= detail.message;
    fields[path.split('.')[0]] ??= detail.message;
  }
  return fields;
}

/** Label, control, then the error or hint (ids `${id}-error` / `${id}-hint`). */
export function Field({ id, label, hint, error, children }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-text">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-sm text-danger">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="text-sm text-text-muted">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

export const describe = (id, error, hint) =>
  error ? `${id}-error` : hint ? `${id}-hint` : undefined;

/** Shared submit handling for dialog forms. */
export function useDialogSubmit(onDone) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const submit = async (request) => {
    setBusy(true);
    setError(null);
    try {
      const result = await request();
      onDone(result);
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };
  return { busy, error, submit, fields: fieldErrors(error) };
}

/** Errors that are not shown next to a field. */
export function ErrorAlert({ error }) {
  if (!error || hasFieldDetails(error)) return null;
  return <Alert tone="danger">{adminErrorMessage(error)}</Alert>;
}

/** Plain confirmation for actions without input (regenerate documents, change a role). */
export function ConfirmActionForm({ message, confirmLabel, request, onDone }) {
  const { busy, error, submit } = useDialogSubmit(onDone);
  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        submit(request);
      }}
    >
      <p className="text-sm text-text">{message}</p>
      <ErrorAlert error={error} />
      <Button type="submit" loading={busy} loadingText={t('adminContent.saving')}>
        {confirmLabel}
      </Button>
    </form>
  );
}
