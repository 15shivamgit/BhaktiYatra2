import { cn } from '@/lib/utils';

const TONES = {
  danger: 'border-danger/30 bg-danger-soft text-danger',
  success: 'border-success/30 bg-success-soft text-success',
  info: 'border-info/30 bg-info-soft text-info',
  warning: 'border-warning/30 bg-warning-soft text-warning',
};

/**
 * Inline message. Errors use role="alert" so screen readers announce them immediately.
 * @param {{ tone?: keyof typeof TONES, children: React.ReactNode, className?: string }} props
 */
export default function Alert({ tone = 'info', children, className }) {
  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className={cn('rounded-md border px-4 py-3 text-sm', TONES[tone], className)}
    >
      {children}
    </div>
  );
}
