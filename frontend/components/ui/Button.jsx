import { cn } from '@/lib/utils';

const VARIANTS = {
  primary: 'bg-primary text-white hover:bg-primary-hover disabled:bg-primary/60',
  secondary: 'border border-accent text-accent bg-surface hover:bg-accent-soft disabled:opacity-60',
  ghost: 'text-text hover:bg-surface-muted disabled:opacity-60',
  destructive: 'bg-danger text-white hover:bg-danger/90 disabled:opacity-60',
};

const SIZES = {
  sm: 'min-h-9 px-3 text-sm',
  md: 'min-h-11 px-5 text-sm',
  lg: 'min-h-13 px-6 text-base',
};

export const buttonClasses = ({ variant = 'primary', size = 'md', className } = {}) =>
  cn(
    'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors disabled:cursor-not-allowed',
    VARIANTS[variant],
    SIZES[size],
    className,
  );

/**
 * @param {React.ButtonHTMLAttributes<HTMLButtonElement> & {
 *   variant?: keyof typeof VARIANTS, size?: keyof typeof SIZES, loading?: boolean, loadingText?: string }} props
 */
export default function Button({
  variant,
  size,
  loading = false,
  loadingText,
  className,
  children,
  disabled,
  type = 'button',
  ...rest
}) {
  return (
    <button
      type={type}
      className={buttonClasses({ variant, size, className })}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && (
        <span
          aria-hidden="true"
          className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent"
        />
      )}
      {loading && loadingText ? loadingText : children}
    </button>
  );
}
