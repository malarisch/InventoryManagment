import type { Tables } from "@/database.types";

export type CompanyRecord = Tables<"companies">;

/**
 * Normalize a PostgREST relation response that may be a single object or an array.
 * 
 * PostgREST can return related data as either a single object or an array depending
 * on the query structure. This function normalizes both cases to a single CompanyRecord.
 * 
 * @param value - The unknown value from PostgREST response (could be object, array, or null)
 * @returns The first valid CompanyRecord found, or null if none exists
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
