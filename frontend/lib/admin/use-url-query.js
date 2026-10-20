'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';

/**
 * List filters kept in the URL (shareable, survive reload and back/forward).
 * Empty values are dropped; changing any filter other than `page` goes back to page 1.
 * Must render inside <Suspense> (the admin layout provides it).
 * @param {Record<string, string>} defaults
 * @returns {[Record<string, string>, (changes: Record<string, string | number | undefined>) => void]}
 */
export function useUrlQuery(defaults = {}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const key = searchParams.toString();

  const query = useMemo(() => {
    const values = { ...defaults };
    for (const [name, value] of new URLSearchParams(key)) values[name] = value;
    return values;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- defaults are static per page
  }, [key]);

  const setQuery = useCallback(
    (changes) => {
      const next = new URLSearchParams(key);
      for (const [name, value] of Object.entries(changes)) {
        if (value === undefined || value === null || value === '') next.delete(name);
        else next.set(name, String(value));
      }
      if (!('page' in changes)) next.delete('page');
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [key, pathname, router],
  );

  return [query, setQuery];
}

/** API query string from URL values, leaving out empty ones. */
export function apiQuery(values) {
  const params = new URLSearchParams();
  for (const [name, value] of Object.entries(values)) {
    if (value !== undefined && value !== null && value !== '') params.set(name, String(value));
  }
  return params.toString();
}
