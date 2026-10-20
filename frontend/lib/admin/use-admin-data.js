'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';

/**
 * Load an admin API resource on the client and reload on demand.
 * @param {string | null} path API path, or null to skip loading
 * @returns {{ data: any, meta: any, error: any, loading: boolean, reload: () => Promise<void>, setData: (d: any) => void }}
 */
export function useAdminData(path) {
  const [state, setState] = useState({
    data: null,
    meta: null,
    error: null,
    loading: Boolean(path),
  });

  const load = useCallback(async () => {
    if (!path) return;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const body = await apiFetch(path);
      setState({ data: body.data, meta: body.meta ?? null, error: null, loading: false });
    } catch (error) {
      setState((s) => ({ ...s, error, loading: false }));
    }
  }, [path]);

  useEffect(() => {
    // Fetch when the path changes; state updates happen after the request resolves.
    load();
  }, [load]);

  const setData = useCallback((data) => setState((s) => ({ ...s, data })), []);
  return { ...state, reload: load, setData };
}
