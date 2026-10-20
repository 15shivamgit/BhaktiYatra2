'use client';

import { ArrowDown, ArrowUp, Plus, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';
import StatusBadge from '@/components/admin/StatusBadge';
import Button from '@/components/ui/Button';
import { inputClasses } from '@/components/ui/FormField';
import { adminErrorMessage } from '@/lib/admin/errors';
import { apiFetch } from '@/lib/api/client';
import { t } from '@/lib/i18n';

/**
 * Ordered list of temples in a circuit, with search to add more. Order is the route order.
 * @param {{ value: { id: string, name: string, city?: string, status?: string }[], onChange: (list: any[]) => void, error?: string }} props
 */
export default function TemplePicker({
  value,
  onChange,
  error,
  title = t('adminContent.templesInRoute'),
}) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [announcement, setAnnouncement] = useState('');

  const search = async () => {
    setSearching(true);
    setSearchError(null);
    try {
      const params = new URLSearchParams({ limit: '8', sort: 'name' });
      if (q.trim()) params.set('q', q.trim());
      const body = await apiFetch(`/admin/temples?${params}`);
      setResults(body.data);
    } catch (err) {
      setSearchError(adminErrorMessage(err));
    } finally {
      setSearching(false);
    }
  };

  const move = (index, delta) => {
    const next = [...value];
    const [item] = next.splice(index, 1);
    next.splice(index + delta, 0, item);
    onChange(next);
    setAnnouncement(t('adminContent.movedTo', { name: item.name, n: index + delta + 1 }));
  };
  const removeAt = (index) => {
    setAnnouncement(t('adminContent.removedFromRoute', { name: value[index].name }));
    onChange(value.filter((_, i) => i !== index));
  };
  const add = (temple) => {
    onChange([
      ...value,
      { id: temple.id, name: temple.name, city: temple.city, status: temple.status },
    ]);
    setAnnouncement(t('adminContent.movedTo', { name: temple.name, n: value.length + 1 }));
  };
  const ids = new Set(value.map((v) => v.id));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-lg font-semibold text-accent">{title}</h2>
        {error && <p className="mt-1 text-sm text-danger">{error}</p>}
        {value.length === 0 ? (
          <p className="mt-2 text-sm text-text-muted">{t('adminContent.noTemplesInRoute')}</p>
        ) : (
          <ol className="mt-3 space-y-2" aria-label={title}>
            {value.map((temple, index) => (
              <li
                key={temple.id}
                className="flex flex-wrap items-center gap-3 rounded-md border border-border bg-surface p-3"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-sm font-semibold text-accent">
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium text-text">{temple.name}</span>
                  {temple.city && <span className="text-sm text-text-muted">{temple.city}</span>}
                </span>
                {temple.status && temple.status !== 'published' && (
                  <StatusBadge value={temple.status} />
                )}
                <span className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={index === 0}
                    onClick={() => move(index, -1)}
                    aria-label={`${t('adminContent.moveUp')}: ${temple.name}`}
                  >
                    <ArrowUp aria-hidden="true" className="size-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={index === value.length - 1}
                    onClick={() => move(index, 1)}
                    aria-label={`${t('adminContent.moveDown')}: ${temple.name}`}
                  >
                    <ArrowDown aria-hidden="true" className="size-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-danger"
                    onClick={() => removeAt(index)}
                    aria-label={`${t('adminContent.remove')}: ${temple.name}`}
                  >
                    <Trash2 aria-hidden="true" className="size-4" />
                  </Button>
                </span>
              </li>
            ))}
          </ol>
        )}
        <p aria-live="polite" className="sr-only">
          {announcement}
        </p>
      </div>

      <div className="rounded-md border border-dashed border-border bg-surface p-4">
        <label htmlFor="circuit-temple-search" className="block font-medium text-text">
          {t('adminContent.findTemple')}
        </label>
        <div className="mt-2 flex flex-wrap gap-2">
          <input
            id="circuit-temple-search"
            type="search"
            value={q}
            onChange={(event) => setQ(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                search();
              }
            }}
            placeholder={t('adminContent.searchTemples')}
            className={`${inputClasses(false)} max-w-sm flex-1`}
          />
          <Button variant="secondary" onClick={search} loading={searching}>
            <Search aria-hidden="true" className="size-4" />
            {t('adminContent.search')}
          </Button>
        </div>
        {searchError && <p className="mt-2 text-sm text-danger">{searchError}</p>}
        {results && (
          <ul className="mt-3 divide-y divide-border" aria-live="polite">
            {results.length === 0 && (
              <li className="py-2 text-sm text-text-muted">{t('adminContent.noMatches')}</li>
            )}
            {results.map((temple) => (
              <li key={temple.id} className="flex flex-wrap items-center gap-3 py-2">
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-text">{temple.name}</span>
                  <span className="text-xs text-text-muted">
                    {temple.city}, {temple.state}
                  </span>
                </span>
                {temple.status !== 'published' && <StatusBadge value={temple.status} />}
                {ids.has(temple.id) ? (
                  <span className="text-sm text-text-muted">
                    {t('adminContent.templeAlreadyAdded')}
                  </span>
                ) : (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => add(temple)}
                    aria-label={`${t('adminContent.addTemple')}: ${temple.name}`}
                  >
                    <Plus aria-hidden="true" className="size-4" />
                    {t('adminContent.addRow')}
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
