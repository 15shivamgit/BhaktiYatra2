import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

/**
 * @param {{ items: { name: string, href?: string }[] }} props  The last item is the current page.
 */
export default function Breadcrumbs({ items }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-text-muted">
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, index) => {
          const last = index === items.length - 1;
          return (
            <li key={item.name} className="flex items-center gap-1">
              {index > 0 && <ChevronRight aria-hidden="true" className="size-3.5" />}
              {last || !item.href ? (
                <span aria-current={last ? 'page' : undefined} className={last ? 'text-text' : ''}>
                  {item.name}
                </span>
              ) : (
                <Link href={item.href} className="hover:text-primary">
                  {item.name}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
