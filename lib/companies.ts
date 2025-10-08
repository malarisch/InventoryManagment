import type { Tables } from "@/database.types";

export type CompanyRecord = Tables<"companies">;

/**
 * Normalize a PostgREST relation response that may be a single object or an array.
 */
export function normalizeCompanyRelation(value: unknown): CompanyRecord | null {
  if (!value) return null;
  if (Array.isArray(value)) {
    for (const entry of value) {
      const normalized = normalizeCompanyRelation(entry);
      if (normalized) return normalized;
    }
    return null;
  }
  if (typeof value !== "object") return null;
  const candidate = value as Partial<CompanyRecord>;
  return typeof candidate.id === "number" ? (candidate as CompanyRecord) : null;
}
