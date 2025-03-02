import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combines multiple class names or conditional class names together
 * and merges Tailwind classes efficiently
 * @param inputs Class name values to combine
 * @returns Merged className string
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
