'use client';

import { SlidersHorizontal } from 'lucide-react';
import { useId, useState } from 'react';
import { buttonClasses } from '@/components/ui/Button';
import { t } from '@/lib/i18n';

/**
 * On small screens the filter panel is collapsed behind a button so results come first; from
 * the lg breakpoint it is always shown in the sidebar.
 * @param {{ activeCount: number, children: React.ReactNode }} props
 */
export default function FiltersDisclosure({ activeCount, children }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  return (
    <>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className={buttonClasses({ variant: 'secondary', className: 'w-full lg:hidden' })}
      >
        <SlidersHorizontal aria-hidden="true" className="size-4" />
        {t('temples.filters')}
        {activeCount > 0 && (
          <span className="rounded-full bg-accent px-2 py-0.5 text-xs text-white">
            {activeCount}
          </span>
        )}
      </button>
      <div id={panelId} className={open ? 'mt-3 block lg:mt-0' : 'hidden lg:block'}>
        {children}
      </div>
    </>
  );
}
