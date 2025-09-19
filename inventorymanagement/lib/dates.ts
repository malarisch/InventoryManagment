export function safeParseDate(input?: string | null): Date | null {
  if (!input) return null;
  let s = String(input);
  // Replace space between date and time with 'T' for Safari compatibility
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(s)) {
    s = s.replace(' ', 'T');
  }
  // If no timezone info, treat as UTC
  if (!/[zZ]|[+-]\d{2}:?\d{2}$/.test(s)) {
    s = s + 'Z';
  }
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

export function formatDate(d?: Date | null, locale: string = 'de-DE'): string {
  if (!d) return '—';
  try {
    return new Intl.DateTimeFormat(locale, {
      year: '2-digit',
      month: '2-digit',
      day: '2-digit',
    }).format(d);
  } catch {
    return '—';
  }
}

export function formatDateTime(d?: Date | null, locale: string = 'de-DE'): string {
  if (!d) return '—';
  try {
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(d);
  } catch {
    return '—';
  }
}
