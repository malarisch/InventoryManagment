import type { adminCompanyMetadata } from "@/components/metadataTypes.types";

export type AssetTagEntityType = "article" | "equipment" | "case" | "location";

/**
 * Build a printed_code for an asset tag using company-wide and entity-specific prefixes.
 * Format examples:
 *  - company + entity: ACME-EQ-42
 *  - only company: ACME-42
 *  - only entity: EQ-42
 *  - none: 42
 */
export function buildAssetTagCode(meta: adminCompanyMetadata, entity: AssetTagEntityType, id: number): string {
  const companyPref = (meta.companyWidePrefix || "").trim();
  const map: Record<AssetTagEntityType, string | undefined> = {
    article: meta.assetTagArticlePrefix,
    equipment: meta.assetTagEquipmentPrefix,
    case: meta.assetTagCasePrefix,
    location: meta.assetTagLocationPrefix,
  };
  const entityPref = (map[entity] || "").trim();
  const parts: string[] = [];
  if (companyPref) parts.push(companyPref);
  if (entityPref) parts.push(entityPref);
  if (parts.length === 0) return String(id);
  return `${parts.join("-")}-${id}`;
}

/** Determine default template id for given entity type from company metadata. */
export function defaultTemplateId(meta: adminCompanyMetadata, entity: AssetTagEntityType): number | undefined {
  switch (entity) {
    case "article": return meta.defaultArticleAssetTagTemplateId;
    case "equipment": return meta.defaultEquipmentAssetTagTemplateId;
    case "case": return meta.defaultCaseAssetTagTemplateId;
    case "location": return meta.defaultLocationAssetTagTemplateId;
    default: return undefined;
  }
}
