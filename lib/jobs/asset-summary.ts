/**
 * Job asset summary calculations.
 * 
 * Aggregates booked assets (equipment and cases) for a job to compute total price,
 * weight, volume, and item counts. Used in job detail views and reports.
 * 
 * @module lib/jobs/asset-summary
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "@/database.types";
import type { ArticleMetadata, EquipmentMetadata, DimensionsCm } from "@/components/metadataTypes.types";

export interface AssetSummary {
  totalPrice: number | null;
  currency: string | null;
  totalWeightKg: number;
  totalVolumeLiters: number;
  itemCount: number;
  equipmentCount: number;
  caseCount: number;
}

type BookedAsset = Tables<"job_booked_assets"> & {
  equipments?: (Tables<"equipments"> & {
    articles?: Tables<"articles"> | null;
  }) | null;
  cases?: Tables<"cases"> | null;
};

function calculateVolumeLiters(dim?: DimensionsCm): number {
  if (!dim?.width || !dim?.height || !dim?.depth) return 0;
  return (dim.width * dim.height * dim.depth) / 1000;
}

function getWeightFromMetadata(metadata: unknown): number {
  const meta = metadata as ArticleMetadata | EquipmentMetadata | null;
  return meta?.weightKg ?? 0;
}

function getPriceFromMetadata(metadata: unknown): { amount: number; currency: string } | null {
  const meta = metadata as ArticleMetadata | null;
  if (meta?.dailyRentalRate == null) return null;
  const amt = meta.dailyRentalRate.amount;
  const cur = meta.dailyRentalRate.currency;
  if (amt == null || cur == null) return null;
  return { amount: amt, currency: cur };
}

function getDimensionsFromMetadata(metadata: unknown): DimensionsCm | undefined {
  const meta = metadata as ArticleMetadata | EquipmentMetadata | null;
  return meta?.dimensionsCm;
}

export async function fetchAssetSummary(
  supabase: SupabaseClient<Database>,
  jobId: number,
): Promise<AssetSummary> {
  const { data: bookedAssets } = await supabase
    .from("job_booked_assets")
    .select("*, equipments:equipment_id(id, article_id, metadata, articles(name,metadata)), cases:case_id(id)")
    .eq("job_id", jobId);

  const assets = (bookedAssets as BookedAsset[] | null) ?? [];

  let totalPrice = 0;
  let currency: string | null = null;
  let totalWeightKg = 0;
  let totalVolumeLiters = 0;
  let equipmentCount = 0;
  let caseCount = 0;

  for (const asset of assets) {
    if (asset.equipment_id && asset.equipments) {
      equipmentCount++;
      const equipment = asset.equipments;
      const article = equipment.articles;

      const equipWeight = getWeightFromMetadata(equipment.metadata);
      const articleWeight = article ? getWeightFromMetadata(article.metadata) : 0;
      totalWeightKg += equipWeight || articleWeight;

      const equipDims = getDimensionsFromMetadata(equipment.metadata);
      const articleDims = article ? getDimensionsFromMetadata(article.metadata) : undefined;
      const dims = equipDims || articleDims;
      if (dims) {
        totalVolumeLiters += calculateVolumeLiters(dims);
      }

      if (article) {
        const price = getPriceFromMetadata(article.metadata);
        if (price) {
          totalPrice += price.amount;
          if (!currency) currency = price.currency;
        }
      }
    } else if (asset.case_id && asset.cases) {
      caseCount++;
    }
  }

  return {
    totalPrice: currency ? totalPrice : null,
    currency,
    totalWeightKg,
    totalVolumeLiters,
    itemCount: assets.length,
    equipmentCount,
    caseCount,
  };
}
