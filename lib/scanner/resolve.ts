import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "@/database.types";

type Client = SupabaseClient<Database>;

type EquipmentRow = Pick<Tables<"equipments">, "id" | "company_id" | "article_id" | "current_location">;
type CaseRow = Pick<Tables<"cases">, "id" | "company_id" | "current_location">;
type ArticleRow = Pick<Tables<"articles">, "id" | "company_id" | "default_location">;
type LocationRow = Pick<Tables<"locations">, "id" | "company_id" | "name">;
type AssetTagRow = Pick<Tables<"asset_tags">, "id" | "company_id" | "printed_code">;

export type ResolvedAsset =
  | {
      kind: "equipment";
      companyId: number;
      assetTagId: number;
      assetTagCode: string | null;
      equipment: EquipmentRow;
    }
  | {
      kind: "case";
      companyId: number;
      assetTagId: number;
      assetTagCode: string | null;
      case: CaseRow;
    }
  | {
      kind: "article";
      companyId: number;
      assetTagId: number;
      assetTagCode: string | null;
      article: ArticleRow;
    }
  | {
      kind: "location";
      companyId: number;
      assetTagId: number;
      assetTagCode: string | null;
      location: LocationRow;
    }
  | {
      kind: "asset-tag";
      companyId: number | null;
      assetTagId: number;
      assetTagCode: string | null;
    }
  | {
      kind: "not-found";
      reason: "asset-tag-missing" | "asset-tag-unassigned";
    };

function ensureNumber(value: number | null | undefined): number | null {
  return typeof value === "number" ? value : null;
}

export async function resolveAssetByCode(
  supabase: Client,
  rawCode: string,
): Promise<ResolvedAsset> {
  const code = rawCode.trim();
  if (!code) {
    return { kind: "not-found", reason: "asset-tag-missing" };
  }

  const { data: assetTag, error: tagError, status } = await supabase
    .from("asset_tags")
    .select("id, company_id, printed_code")
    .eq("printed_code", code)
    .maybeSingle<AssetTagRow>();

  if (tagError && status !== 406) {
    console.error("resolveAssetByCode asset tag error", tagError);
  }

  if (!assetTag) {
    return { kind: "not-found", reason: "asset-tag-missing" };
  }

  const assetTagId = assetTag.id;
  const assetTagCompanyId = ensureNumber(assetTag.company_id);

  const [equipmentRes, caseRes, articleRes, locationRes] = await Promise.all([
    supabase
      .from("equipments")
      .select("id, company_id, article_id, current_location")
      .eq("asset_tag", assetTagId)
      .limit(1)
      .maybeSingle<EquipmentRow>(),
    supabase
      .from("cases")
      .select("id, company_id, current_location")
      .eq("asset_tag", assetTagId)
      .limit(1)
      .maybeSingle<CaseRow>(),
    supabase
      .from("articles")
      .select("id, company_id, default_location")
      .eq("asset_tag", assetTagId)
      .limit(1)
      .maybeSingle<ArticleRow>(),
    supabase
      .from("locations")
      .select("id, company_id, name")
      .eq("asset_tag", assetTagId)
      .limit(1)
      .maybeSingle<LocationRow>(),
  ]);

  const equipment = equipmentRes.data ?? null;
  if (equipment) {
    const companyId = ensureNumber(equipment.company_id) ?? assetTagCompanyId;
    if (companyId == null) {
      console.warn("Equipment without company id", equipment.id);
      return {
        kind: "asset-tag",
        companyId: assetTagCompanyId,
        assetTagId,
        assetTagCode: assetTag.printed_code ?? null,
      };
    }
    return {
      kind: "equipment",
      companyId,
      assetTagId,
      assetTagCode: assetTag.printed_code ?? null,
      equipment,
    };
  }

  const caseRow = caseRes.data ?? null;
  if (caseRow) {
    const companyId = ensureNumber(caseRow.company_id) ?? assetTagCompanyId;
    if (companyId == null) {
      console.warn("Case without company id", caseRow.id);
      return {
        kind: "asset-tag",
        companyId: assetTagCompanyId,
        assetTagId,
        assetTagCode: assetTag.printed_code ?? null,
      };
    }
    return {
      kind: "case",
      companyId,
      assetTagId,
      assetTagCode: assetTag.printed_code ?? null,
      case: caseRow,
    };
  }

  const article = articleRes.data ?? null;
  if (article) {
    const companyId = ensureNumber(article.company_id) ?? assetTagCompanyId;
    if (companyId == null) {
      console.warn("Article without company id", article.id);
      return {
        kind: "asset-tag",
        companyId: assetTagCompanyId,
        assetTagId,
        assetTagCode: assetTag.printed_code ?? null,
      };
    }
    return {
      kind: "article",
      companyId,
      assetTagId,
      assetTagCode: assetTag.printed_code ?? null,
      article,
    };
  }

  const location = locationRes.data ?? null;
  if (location) {
    const companyId = ensureNumber(location.company_id) ?? assetTagCompanyId;
    if (companyId == null) {
      console.warn("Location without company id", location.id);
      return {
        kind: "asset-tag",
        companyId: assetTagCompanyId,
        assetTagId,
        assetTagCode: assetTag.printed_code ?? null,
      };
    }
    return {
      kind: "location",
      companyId,
      assetTagId,
      assetTagCode: assetTag.printed_code ?? null,
      location,
    };
  }

  return {
    kind: "asset-tag",
    companyId: assetTagCompanyId,
    assetTagId,
    assetTagCode: assetTag.printed_code ?? null,
  };
}
