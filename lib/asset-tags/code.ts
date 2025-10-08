import type {adminCompanyMetadata, asset_tag_template_print} from "@/components/metadataTypes.types";

export type AssetTagEntityType = "article" | "equipment" | "case" | "location";

/**
 * Build a printed_code for an asset tag using company-wide and entity-specific prefixes.
 * Format examples:
 *  - company + entity: ACME-EQ-42
 *  - only company: ACME-42
 *  - only entity: EQ-42
 *  - none: 42
 */

interface PlaceholderData {
  [key: string]: string;
}
export function buildAssetTagCode(
  meta: adminCompanyMetadata,
  entity: AssetTagEntityType,
  id: number,
  template?: asset_tag_template_print,
  placeholders?: Record<string, string>
): string {
  const companyPref = (meta.companyWidePrefix || "").trim();
  const map: Record<AssetTagEntityType, string | undefined> = {
    article: meta.assetTagArticlePrefix,
    equipment: meta.assetTagEquipmentPrefix,
    case: meta.assetTagCasePrefix,
    location: meta.assetTagLocationPrefix,
  };
  const entityPref = (map[entity] || "").trim();
  const parts: string[] = [];
  if (template) {
    let value = template.stringTemplate || '';
    const paddedNumber = template.numberLength ? String(id).padStart(template.numberLength, '0') : String(id);
    const placeholderData: PlaceholderData = {
      prefix: template.prefix || '',
      suffix: template.suffix || '',
      'company-prefix': companyPref,
      companyprefix: companyPref,
      companyPrefix: companyPref,
      company_prefix: companyPref,
      globalprefix: companyPref,
      'global-prefix': companyPref,
      global_prefix: companyPref,
      globalPrefix: companyPref,
      'entity-prefix': entityPref,
      entityprefix: entityPref,
      entityPrefix: entityPref,
      entity_prefix: entityPref,
      
      code: paddedNumber,
      number: paddedNumber,
      id: String(id),
    };
    // Merge custom placeholders (e.g., company_name)
    if (placeholders) {
      for (const [k, v] of Object.entries(placeholders)) {
        placeholderData[k] = v ?? '';
      }
    }
    Object.entries(placeholderData).forEach(([key, replacement]) => {
      value = value.replace(new RegExp(`\\{${key}\\}`, 'g'), replacement);
    });
    return value;
  }
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
