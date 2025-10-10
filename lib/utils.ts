import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge conditional Tailwind class lists while resolving conflicts.
 * 
 * Combines multiple class name strings/conditionals using clsx and then
 * deduplicates with tailwind-merge to ensure proper Tailwind precedence.
 * 
 * @param inputs - Class values (strings, objects, arrays) to merge
 * @returns Merged and deduplicated class string
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Whether required public Supabase env vars are present. Used to guard routes
 * that depend on Supabase configuration during local development.
 */
export const hasEnvVars =
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
