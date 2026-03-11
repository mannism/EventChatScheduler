/**
 * lib/utils.ts
 *
 * Shared utility for conditional CSS class merging.
 * Combines clsx (conditional classnames) with tailwind-merge
 * (deduplicates/resolves conflicting Tailwind classes).
 */

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/** Merge Tailwind CSS classes with conflict resolution */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
