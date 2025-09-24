import { buildAssetTagCode, type AssetTagEntityType } from "@/lib/asset-tags/code";
import type { adminCompanyMetadata } from "@/components/metadataTypes.types";
import { createClient } from "@/lib/supabase/client";

/**
 * createAndAttachAssetTag
 * Creates an asset tag using a template and updates the target entity row with the new asset_tag id.
 * Assumes RLS permits current user for company scope.
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
