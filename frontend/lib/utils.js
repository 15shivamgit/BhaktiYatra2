import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge class names, letting later Tailwind classes override earlier ones (shadcn/ui convention). */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
