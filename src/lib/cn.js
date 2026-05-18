// Tailwind class merge helper used by every component. Combines the ergonomic
// API of clsx with twMerge's conflict resolution (e.g. p-2 + p-4 → p-4).
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
