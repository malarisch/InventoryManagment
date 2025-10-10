import { buildAssetTagCode, type AssetTagEntityType } from "@/lib/asset-tags/code";
import type { adminCompanyMetadata } from "@/components/metadataTypes.types";
import { createClient } from "@/lib/supabase/client";

/**
 * Create an asset tag and attach it to an entity.
 * 
 * Creates a new asset_tags record with generated code and template reference,
 * then updates the target entity (article/equipment/case/location) to reference
 * the new tag. Assumes RLS permits current user for company scope.
 * 
 * @param params - Configuration object
 * @param params.companyId - Company ID for multi-tenant scoping
 * @param params.userId - User ID to set as created_by
 * @param params.entity - Entity type (article, equipment, case, location)
 * @param params.entityId - ID of the entity to attach tag to
 * @param params.table - Database table name matching entity type
 * @param params.templateId - Asset tag template to use for printing
 * @param params.companyMeta - Company metadata for prefix generation
 * @returns The ID of the newly created asset tag
 * @throws Error if tag creation or entity update fails
 */
export async function createAndAttachAssetTag(params: {
  companyId: number;
  userId: string;
  entity: AssetTagEntityType;
  entityId: number;
  table: "articles" | "equipments" | "cases" | "locations";
  templateId: number;
  companyMeta: adminCompanyMetadata | null;
}) {
  const { companyId, userId, entity, entityId, table, templateId, companyMeta } = params;
  const supabase = createClient();
  const printed_code = companyMeta ? buildAssetTagCode(companyMeta, entity, entityId) : String(entityId);
  const { data: tag, error: tagErr } = await supabase
    .from("asset_tags")
    .insert({
      printed_template: templateId,
      printed_code,
      company_id: companyId,
      created_by: userId,
    })
    .select("id")
    .single();
  if (tagErr) throw tagErr;
  const tagId = (tag as { id: number }).id;
  const { error: updErr } = await supabase
    .from(table)
    .update({ asset_tag: tagId })
    .eq("id", entityId);
  if (updErr) throw updErr;
  return tagId;
}
