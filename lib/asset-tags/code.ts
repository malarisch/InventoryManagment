import type {adminCompanyMetadata, asset_tag_template_print} from "@/components/metadataTypes.types";

export type AssetTagEntityType = "article" | "equipment" | "case" | "location";

interface PlaceholderData {
  [key: string]: string;
}

/**
 * Build a printed_code for an asset tag using company-wide and entity-specific prefixes.
 * 
 * Generates human-readable asset tag codes by combining company prefix, entity prefix,
 * and ID number. Supports custom templates with placeholder substitution.
 * 
 * Format examples:
 *  - company + entity: ACME-EQ-42
 *  - only company: ACME-42
 *  - only entity: EQ-42
 *  - none: 42
 * 
 * @param meta - Company metadata containing prefix configuration
 * @param entity - Type of entity (article, equipment, case, location)
 * @param id - Numeric ID of the entity
 * @param template - Optional template with custom string format and placeholders
 * @param placeholders - Optional additional placeholder values for template substitution
 * @returns Generated asset tag code string
 */
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

/**
 * Determine default template id for given entity type from company metadata.
 * 
 * @param meta - Company metadata containing default template configuration
 * @param entity - Type of entity to get template for
 * @returns Template ID if configured, undefined otherwise
 */
export function defaultTemplateId(meta: adminCompanyMetadata, entity: AssetTagEntityType): number | undefined {
  switch (entity) {
    case "article": return meta.defaultArticleAssetTagTemplateId;
    case "equipment": return meta.defaultEquipmentAssetTagTemplateId;
    case "case": return meta.defaultCaseAssetTagTemplateId;
    case "location": return meta.defaultLocationAssetTagTemplateId;
    default: return undefined;
  }
}
