import { formatDate, safeParseDate } from "@/lib/dates";

export type JobCustomer = {
  id: number;
  company_name: string | null;
  forename: string | null;
  surname: string | null;
};

export type JobPeriodLike = {
  startdate: string | null;
  enddate: string | null;
};

export type HistoryPreviewRecord = Record<string, unknown>;

/**
 * Mapping from table names to localized labels for dashboard summaries.
 */
export const TABLE_LABELS: Record<string, string> = {
  articles: "Artikel",
  asset_tags: "Asset Tags",
  cases: "Cases",
  customers: "Kunden",
  equipments: "Equipments",
  jobs: "Jobs",
  locations: "Standorte",
};

/**
 * Routes for navigating from history entries to their management detail pages.
 */
export const TABLE_ROUTES: Record<string, string> = {
  articles: "/management/articles",
  cases: "/management/cases",
  customers: "/management/customers",
  equipments: "/management/equipments",
  jobs: "/management/jobs",
  locations: "/management/locations",
};

/**
 * Field names we prioritise when building compact change summaries.
 */
export const HISTORY_PREVIEW_KEYS = [
  "name",
  "title",
  "job_location",
  "type",
  "article_id",
  "equipment_id",
  "location_id",
  "customer_id",
  "case_id",
  "company_id",
] as const;

/**
 * Dashboard quick links to high-traffic management sections.
 */
export const QUICK_LINKS = [
  {
    label: "Equipments",
    description: "Pflege Status, Standort und Asset-Tags deiner Geräte.",
    href: "/management/equipments",
  },
  {
    label: "Jobs",
    description: "Plane Einsätze und buche Assets unkompliziert.",
    href: "/management/jobs",
  },
  {
    label: "Cases",
    description: "Strukturiere Gear in Cases und Sets für den schnellen Zugriff.",
    href: "/management/cases",
  },
  {
    label: "Company Settings",
    description: "Verwalte Unternehmens-Einstellungen und Seed-Dumps.",
    href: "/management/company-settings",
  },
] as const;

/**
 * Type guard ensuring a value is a plain object we can read properties from.
 */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/**
 * Truncate long strings with an ellipsis so they remain readable in badges.
 */
export function truncate(value: string, max = 80): string {
  return value.length <= max ? value : `${value.slice(0, max - 1)}…`;
}

/**
 * Convert a table name into a localized label that can be displayed in UI cards.
 */
export function formatTableLabel(table: string): string {
  const label = TABLE_LABELS[table];
  if (label) return label;
  return table.charAt(0).toUpperCase() + table.slice(1).replace(/_/g, " ");
}

/**
 * Build a compact textual summary for a history record payload.
 */
export function buildHistorySummary(payload: HistoryPreviewRecord): string {
  const parts: string[] = [];
  for (const key of HISTORY_PREVIEW_KEYS) {
    const raw = payload[key];
    if (raw === null || raw === undefined) continue;
    const text = typeof raw === "object" ? JSON.stringify(raw) : String(raw);
    if (text.trim().length === 0) continue;
    parts.push(`${key}: ${truncate(text)}`);
  }
  if (parts.length > 0) return parts.join(" • ");

  const entries = Object.entries(payload).filter(([key, value]) => key !== "_op" && value !== null && value !== undefined);
  if (entries.length > 0) {
    const [firstKey, firstValue] = entries[0];
    const text = typeof firstValue === "object" ? JSON.stringify(firstValue) : String(firstValue);
    if (text.trim().length > 0) return `${firstKey}: ${truncate(text)}`;
  }
  return "Keine Details";
}

/**
 * Render a readable customer label favouring company name, otherwise full name.
 */
export function jobCustomerDisplay(customer: JobCustomer | null): string {
  if (!customer) return "Kein Kunde zugeordnet";
  const company = customer.company_name?.trim();
  if (company) return company;
  const fullName = [customer.forename, customer.surname].filter(Boolean).join(" ").trim();
  return fullName.length > 0 ? fullName : `Kunde #${customer.id}`;
}

/**
 * Present the job period as a localized, human-readable range.
 */
export function formatJobPeriod(job: JobPeriodLike, locale: string = "de-DE"): string {
  const start = formatDate(safeParseDate(job.startdate), locale);
  const end = formatDate(safeParseDate(job.enddate), locale);
  if (start === "—" && end === "—") return "Termin offen";
  if (start === "—") return `Bis ${end}`;
  if (end === "—") return `Ab ${start}`;
  if (start === end) return start;
  return `${start} – ${end}`;
}
