import { format } from "date-fns";
import { de } from "date-fns/locale";
import type { Locale } from "date-fns";

/**
 * Mapping of navigator locale strings to the bundled date-fns locales we support.
 * Extend this map when additional locale-aware formatting is required.
 */
const DATE_LOCALES: Record<string, Locale> = {
  "de-DE": de,
};

/**
 * Parse strings coming from the database into Date instances while handling
 * common inconsistencies (missing "T" separator or timezone information).
 */
export function safeParseDate(input?: string | null): Date | null {
  if (!input) return null;
  let s = String(input);
  // Replace space between date and time with "T" for Safari compatibility
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(s)) {
    s = s.replace(" ", "T");
  }
  // If no timezone info, treat as UTC so we avoid local offset drift
  if (!/[zZ]|[+-]\d{2}:?\d{2}$/.test(s)) {
    s = `${s}Z`;
  }
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Format a date-only value using either date-fns locales or Intl fallback.
 */
export function formatDate(d?: Date | null, locale: string = "de-DE"): string {
  if (!d) return "—";
  try {
    const localeObj = DATE_LOCALES[locale];
    if (localeObj) {
      return format(d, "dd.MM.yy", { locale: localeObj });
    }
    return new Intl.DateTimeFormat(locale, {
      year: "2-digit",
      month: "2-digit",
      day: "2-digit",
    }).format(d);
  } catch {
    return "—";
  }
}

/**
 * Format a date-time value using either date-fns locales or Intl fallback.
 */
export function formatDateTime(d?: Date | null, locale: string = "de-DE"): string {
  if (!d) return "—";
  try {
    const localeObj = DATE_LOCALES[locale];
    if (localeObj) {
      return format(d, "dd.MM.yyyy HH:mm:ss", { locale: localeObj });
    }
    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(d);
  } catch {
    return "—";
  }
}
