'use client';

import { useEffect } from 'react';
import { useUser } from '@/lib/auth/user-context';
import { PUBLIC_API_BASE_URL } from '@/lib/config';

/**
 * Counts one page view per visit (pages are cached, so the API cannot count GETs).
 * Admin visits and obvious bots are skipped; failures are ignored.
 */
export default function ViewTracker({ slug }) {
  const { user, status } = useUser();
  useEffect(() => {
    if (status === 'loading' || user?.role === 'admin') return;
    if (/bot|crawl|spider|slurp/i.test(navigator.userAgent)) return;
    const key = `viewed:${slug}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');
    } catch {
      // storage blocked: still count once per mount
    }
    fetch(`${PUBLIC_API_BASE_URL}/temples/${encodeURIComponent(slug)}/views`, {
      method: 'POST',
      keepalive: true,
      credentials: 'omit',
    }).catch(() => {});
  }, [slug, status, user]);
  return null;
}
