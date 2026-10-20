import { serverGet } from '@/lib/api/server';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';

/**
 * Pure presentational badge so it can be unit-tested without fetching.
 * @param {{ state: 'ok' | 'degraded' | 'down', version?: string }} props
 */
export function ApiStatusBadge({ state, version }) {
  const tone = {
    ok: 'bg-success-soft text-success',
    degraded: 'bg-warning-soft text-warning',
    down: 'bg-danger-soft text-danger',
  }[state];
  const label = {
    ok: t('status.apiOk'),
    degraded: t('status.apiDegraded'),
    down: t('status.apiDown'),
  }[state];
  return (
    <p
      role="status"
      data-state={state}
      className={cn(
        'inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium',
        tone,
      )}
    >
      <span aria-hidden="true" className="size-2 rounded-full bg-current" />
      {label}
      {version && <span className="opacity-80">· {t('status.version', { version })}</span>}
    </p>
  );
}

/** @returns {Promise<{ state: 'ok' | 'degraded' | 'down', version?: string }>} */
async function readHealth() {
  try {
    const { data } = await serverGet('/health');
    return { state: 'ok', version: data.version };
  } catch (error) {
    if (error?.status === 503) return { state: 'degraded', version: error.details?.version };
    return { state: 'down' };
  }
}

/**
 * Temporary Phase 1 check that the frontend can reach the API (removed in Phase 3).
 * Fetches at request time, so it must render inside <Suspense>.
 */
export default async function ApiStatus() {
  const { state, version } = await readHealth();
  return <ApiStatusBadge state={state} version={version} />;
}
