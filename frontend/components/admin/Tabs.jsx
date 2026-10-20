'use client';

import { useRef } from 'react';
import { cn } from '@/lib/utils';

/**
 * WAI-ARIA tabs (automatic activation; arrow keys, Home and End move between tabs).
 * Panels are rendered by the caller with `tabPanelProps(key)`.
 * @param {{ tabs: { key: string, label: string, errors?: number }[], active: string, onChange: (key: string) => void, label: string, idPrefix: string }} props
 */
export default function Tabs({ tabs, active, onChange, label, idPrefix }) {
  const refs = useRef({});
  const focus = (index) => {
    const tab = tabs[(index + tabs.length) % tabs.length];
    onChange(tab.key);
    refs.current[tab.key]?.focus();
  };
  const onKeyDown = (event, index) => {
    const moves = { ArrowRight: index + 1, ArrowLeft: index - 1, Home: 0, End: tabs.length - 1 };
    if (event.key in moves) {
      event.preventDefault();
      focus(moves[event.key]);
    }
  };

  return (
    <div
      role="tablist"
      aria-label={label}
      className="-mx-4 flex gap-1 overflow-x-auto border-b border-border px-4 sm:mx-0 sm:px-0"
    >
      {tabs.map((tab, index) => {
        const selected = tab.key === active;
        return (
          <button
            key={tab.key}
            ref={(node) => {
              refs.current[tab.key] = node;
            }}
            type="button"
            role="tab"
            id={`${idPrefix}-tab-${tab.key}`}
            aria-selected={selected}
            aria-controls={`${idPrefix}-panel-${tab.key}`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(tab.key)}
            onKeyDown={(event) => onKeyDown(event, index)}
            className={cn(
              '-mb-px flex min-h-11 shrink-0 items-center gap-2 border-b-2 px-3 text-sm font-medium whitespace-nowrap',
              selected
                ? 'border-primary text-primary'
                : 'border-transparent text-text-muted hover:text-text',
            )}
          >
            {tab.label}
            {tab.errors > 0 && (
              <>
                <span
                  aria-hidden="true"
                  className="rounded-full bg-danger px-1.5 text-xs text-white"
                >
                  {tab.errors}
                </span>
                {/* A real space keeps the accessible name "Content (2 errors)", not "Content(2 errors)". */}{' '}
                <span className="sr-only">{`(${tab.errors} ${tab.errors === 1 ? 'error' : 'errors'})`}</span>
              </>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Props for a tab panel; inactive panels stay mounted (form fields keep registering) but hidden. */
export function tabPanelProps(idPrefix, key, active) {
  return {
    role: 'tabpanel',
    id: `${idPrefix}-panel-${key}`,
    'aria-labelledby': `${idPrefix}-tab-${key}`,
    hidden: key !== active,
    tabIndex: 0,
  };
}
