import { cn } from '@/lib/utils';

export const inputClasses = (invalid) =>
  cn(
    'block w-full min-h-11 rounded-md border bg-surface px-3 py-2 text-base text-text placeholder:text-text-muted/70 transition-colors',
    'focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-saffron',
    // Chrome treats <select> as :read-only, so exclude it or every dropdown looks disabled.
    '[&:not(select):read-only]:bg-surface-muted [&:not(select):read-only]:text-text-muted',
    invalid ? 'border-danger' : 'border-border hover:border-text-muted/50',
  );

/**
 * Labelled input with hint and error text wired up for screen readers.
 * Spread react-hook-form's `register(name)` result into `inputProps`.
 * @param {{ id: string, label: string, hint?: string, error?: string,
 *   inputProps: React.InputHTMLAttributes<HTMLInputElement>, className?: string }} props
 */
export default function FormField({ id, label, hint, error, inputProps, className }) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={id} className="block text-sm font-medium text-text">
        {label}
      </label>
      <input
        id={id}
        className={inputClasses(Boolean(error))}
        aria-invalid={error ? true : undefined}
        aria-describedby={[errorId, hintId].filter(Boolean).join(' ') || undefined}
        {...inputProps}
      />
      {error && (
        <p id={errorId} className="text-sm text-danger">
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={hintId} className="text-sm text-text-muted">
          {hint}
        </p>
      )}
    </div>
  );
}
