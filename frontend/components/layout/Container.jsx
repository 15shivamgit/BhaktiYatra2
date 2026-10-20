import { cn } from '@/lib/utils';

const SIZES = {
  default: 'max-w-page',
  narrow: 'max-w-narrow',
};

/**
 * Centred page-width wrapper with the standard side gutters.
 * @param {{ size?: keyof typeof SIZES, className?: string, children: React.ReactNode, as?: React.ElementType }} props
 */
export default function Container({ size = 'default', className, children, as: Tag = 'div' }) {
  return (
    <Tag className={cn('mx-auto w-full px-4 sm:px-6 lg:px-8', SIZES[size], className)}>
      {children}
    </Tag>
  );
}
