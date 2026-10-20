import Link from 'next/link';
import { cn } from '@/lib/utils';

/**
 * Section title with the gold rule motif and an optional "view all" link.
 * @param {{ id?: string, eyebrow?: string, title: string, description?: string,
 *   action?: { href: string, label: string }, as?: 'h2' | 'h3', className?: string }} props
 */
export default function SectionHeading({
  id,
  eyebrow,
  title,
  description,
  action,
  as: Tag = 'h2',
  className,
}) {
  return (
    <div className={cn('flex flex-wrap items-end justify-between gap-4', className)}>
      <div className="max-w-2xl">
        {eyebrow && (
          <p className="text-xs font-medium uppercase tracking-widest text-primary">{eyebrow}</p>
        )}
        <Tag id={id} className="mt-1 font-display text-3xl font-semibold text-accent sm:text-4xl">
          {title}
        </Tag>
        <span aria-hidden="true" className="mt-3 block h-px w-16 bg-gold" />
        {description && <p className="mt-3 text-text-muted">{description}</p>}
      </div>
      {action && (
        // Accent, not primary: primary text is only 4.45:1 on the tinted surface-muted sections.
        <Link href={action.href} className="text-sm font-medium text-accent hover:underline">
          {action.label} →
        </Link>
      )}
    </div>
  );
}
