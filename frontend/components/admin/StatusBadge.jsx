import { cn } from '@/lib/utils';

/** Colours from docs/06-design/01-design-system.md "Status badge colours". */
const TONES = {
  draft: 'bg-surface-muted text-text-muted',
  published: 'bg-success-soft text-success',
  archived: 'bg-surface-muted text-text-muted line-through',
  new: 'bg-info-soft text-info',
  read: 'bg-surface-muted text-text-muted',
  replied: 'bg-success-soft text-success',
  spam: 'bg-danger-soft text-danger',
  scheduled: 'bg-success-soft text-success',
  full: 'bg-warning-soft text-warning',
  completed: 'bg-surface-muted text-text-muted',
  cancelled: 'bg-danger-soft text-danger',
  // payments (booking paymentStatus and Payment records)
  pending: 'bg-warning-soft text-warning',
  paid: 'bg-success-soft text-success',
  created: 'bg-surface-muted text-text-muted',
  authorized: 'bg-info-soft text-info',
  captured: 'bg-success-soft text-success',
  failed: 'bg-danger-soft text-danger',
  refunded: 'bg-info-soft text-info',
  partially_refunded: 'bg-info-soft text-info',
  // emails
  sending: 'bg-info-soft text-info',
  sent: 'bg-success-soft text-success',
  // users
  admin: 'bg-accent-soft text-accent',
  user: 'bg-surface-muted text-text-muted',
  active: 'bg-success-soft text-success',
  inactive: 'bg-danger-soft text-danger',
};

const LABELS = {
  draft: 'Draft',
  published: 'Published',
  archived: 'Archived',
  new: 'New',
  read: 'Read',
  replied: 'Replied',
  spam: 'Spam',
  scheduled: 'Scheduled',
  full: 'Full',
  completed: 'Completed',
  cancelled: 'Cancelled',
  pending: 'Pending',
  paid: 'Paid',
  created: 'Created',
  authorized: 'Authorised',
  captured: 'Captured',
  failed: 'Failed',
  refunded: 'Refunded',
  partially_refunded: 'Partly refunded',
  sending: 'Sending',
  sent: 'Sent',
  admin: 'Admin',
  user: 'User',
  active: 'Active',
  inactive: 'Inactive',
};

/** Status shown as text (never colour alone). */
export default function StatusBadge({ value, className }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-sm px-2 py-0.5 text-xs font-medium',
        TONES[value] ?? TONES.draft,
        className,
      )}
    >
      {LABELS[value] ?? value}
    </span>
  );
}
