import { t } from '@/lib/i18n';

/**
 * User-facing text for an API error: a specific message for known codes, otherwise a generic
 * one that includes the request id so support can find the log line.
 * @param {any} error ApiError or unknown
 */
export function errorMessage(error) {
  if (error?.code === 'NETWORK_ERROR') return t('errors.network');
  if (error?.code) {
    const specific = t(`errors.${error.code}`);
    if (specific !== `errors.${error.code}`) return specific;
  }
  if (error?.code === 'VALIDATION_ERROR' && error.message) return error.message;
  return error?.requestId
    ? t('errors.withReference', { requestId: error.requestId })
    : t('errors.generic');
}
