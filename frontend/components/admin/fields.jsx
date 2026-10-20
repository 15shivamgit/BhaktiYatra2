'use client';

import { get, useFormContext } from 'react-hook-form';
import { inputClasses } from '@/components/ui/FormField';
import { cn } from '@/lib/utils';

/** Error message for a (possibly nested) field name, e.g. "timings.0.open". */
export function useFieldError(name) {
  const {
    formState: { errors },
  } = useFormContext();
  return get(errors, name)?.message;
}

function Described({ id, label, hint, error, className, children }) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={id} className="block text-sm font-medium text-text">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="text-sm text-danger">
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-sm text-text-muted">
          {hint}
        </p>
      )}
    </div>
  );
}

const describedBy = (id, hint, error) =>
  [error && `${id}-error`, hint && !error && `${id}-hint`].filter(Boolean).join(' ') || undefined;

/**
 * Text-like input bound to the surrounding react-hook-form context.
 * @param {{ name: string, label: string, hint?: string, rules?: object, className?: string } & React.InputHTMLAttributes<HTMLInputElement>} props
 */
export function TextInput({ name, label, hint, rules, className, ...rest }) {
  const { register } = useFormContext();
  const error = useFieldError(name);
  const id = `f-${name.replaceAll('.', '-')}`;
  return (
    <Described id={id} label={label} hint={hint} error={error} className={className}>
      <input
        id={id}
        className={inputClasses(Boolean(error))}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        {...rest}
        {...register(name, rules)}
      />
    </Described>
  );
}

export function TextArea({ name, label, hint, rules, rows = 4, className, ...rest }) {
  const { register } = useFormContext();
  const error = useFieldError(name);
  const id = `f-${name.replaceAll('.', '-')}`;
  return (
    <Described id={id} label={label} hint={hint} error={error} className={className}>
      <textarea
        id={id}
        rows={rows}
        className={inputClasses(Boolean(error))}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        {...rest}
        {...register(name, rules)}
      />
    </Described>
  );
}

/** @param {{ name: string, label: string, options: (string | { value: string, label: string })[], placeholder?: string, rules?: object, hint?: string, className?: string }} props */
export function SelectInput({ name, label, options, placeholder, rules, hint, className }) {
  const { register } = useFormContext();
  const error = useFieldError(name);
  const id = `f-${name.replaceAll('.', '-')}`;
  return (
    <Described id={id} label={label} hint={hint} error={error} className={className}>
      <select
        id={id}
        className={inputClasses(Boolean(error))}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        {...register(name, rules)}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((option) => {
          const { value, label: text } =
            typeof option === 'string' ? { value: option, label: option } : option;
          return (
            <option key={value} value={value}>
              {text}
            </option>
          );
        })}
      </select>
    </Described>
  );
}

export function Checkbox({ name, label }) {
  const { register } = useFormContext();
  const id = `f-${name}`;
  return (
    <div className="flex min-h-11 items-center gap-3">
      <input id={id} type="checkbox" className="size-5 accent-primary" {...register(name)} />
      <label htmlFor={id} className="text-sm font-medium text-text">
        {label}
      </label>
    </div>
  );
}

export function Fieldset({ legend, children, className }) {
  return (
    <fieldset className={cn('rounded-lg border border-border bg-surface p-4 sm:p-6', className)}>
      <legend className="px-1 font-display text-lg font-semibold text-accent">{legend}</legend>
      <div className="mt-2 space-y-4">{children}</div>
    </fieldset>
  );
}
