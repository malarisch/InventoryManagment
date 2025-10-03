import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/database.types";
import type { ArticleMetadata, EquipmentMetadata, DimensionsCm } from "@/components/metadataTypes.types";

interface AssetSummary {
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
  // Volume in cm³ converted to liters (1L = 1000cm³)
  return (dim.width * dim.height * dim.depth) / 1000;
}

function getWeightFromMetadata(metadata: unknown): number {
  const meta = metadata as ArticleMetadata | EquipmentMetadata | null;
  return meta?.weightKg ?? 0;
}

function getPriceFromMetadata(metadata: unknown): { amount: number; currency: string } | null {
  const meta = metadata as ArticleMetadata | null;
  if (!meta?.dailyRentalRate?.amount || !meta?.dailyRentalRate?.currency) return null;
  return {
    amount: meta.dailyRentalRate.amount,
    currency: meta.dailyRentalRate.currency,
  };
}

function getDimensionsFromMetadata(metadata: unknown): DimensionsCm | undefined {
  const meta = metadata as ArticleMetadata | EquipmentMetadata | null;
  return meta?.dimensionsCm;
}

async function calculateAssetSummary(jobId: number): Promise<AssetSummary> {
  const supabase = await createClient();
  
  // Fetch all booked assets with their equipment and article data
  const { data: bookedAssets } = await supabase
    .from("job_booked_assets")
    .select("*, equipments:equipment_id(*, articles:article_id(*)), cases:case_id(*)")
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

      // Weight: prefer equipment metadata, fallback to article
      const equipWeight = getWeightFromMetadata(equipment.metadata);
      const articleWeight = article ? getWeightFromMetadata(article.metadata) : 0;
      totalWeightKg += equipWeight || articleWeight;

      // Dimensions: prefer equipment metadata, fallback to article
      const equipDims = getDimensionsFromMetadata(equipment.metadata);
      const articleDims = article ? getDimensionsFromMetadata(article.metadata) : undefined;
      const dims = equipDims || articleDims;
      if (dims) {
        totalVolumeLiters += calculateVolumeLiters(dims);
      }

      // Price: from article only
      if (article) {
        const price = getPriceFromMetadata(article.metadata);
        if (price) {
          totalPrice += price.amount;
          currency = currency || price.currency;
        }
      }
    } else if (asset.case_id && asset.cases) {
      caseCount++;
      // For cases, we would need to query the case contents
      // For now, just count them
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

function formatPrice(amount: number, currency: string): string {
  // Amount is in smallest unit (cents), convert to main unit
  const mainAmount = amount / 100;
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: currency,
  }).format(mainAmount);
}

function formatWeight(kg: number): string {
  if (kg >= 1000) {
    return `${(kg / 1000).toFixed(2)} t`;
  }
  return `${kg.toFixed(2)} kg`;
}

function formatVolume(liters: number): string {
  if (liters >= 1000) {
    return `${(liters / 1000).toFixed(2)} m³`;
  }
  return `${liters.toFixed(0)} L`;
}

export async function JobAssetSummaryCard({ jobId }: { jobId: number }) {
  const summary = await calculateAssetSummary(jobId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Asset-Zusammenfassung</CardTitle>
        <CardDescription>
          Übersicht über gebuchte Assets ({summary.itemCount} Einträge)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Anzahl</p>
            <p className="text-2xl font-bold">{summary.itemCount}</p>
            <p className="text-xs text-muted-foreground">
              {summary.equipmentCount} Equipment{summary.equipmentCount !== 1 ? "s" : ""}, {summary.caseCount} Case{summary.caseCount !== 1 ? "s" : ""}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Gesamtpreis (Tag)</p>
            {summary.totalPrice !== null && summary.currency ? (
              <p className="text-2xl font-bold">{formatPrice(summary.totalPrice, summary.currency)}</p>
            ) : (
              <p className="text-2xl font-bold text-muted-foreground">—</p>
            )}
            <p className="text-xs text-muted-foreground">Tagesmiete</p>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Gesamtgewicht</p>
            {summary.totalWeightKg > 0 ? (
              <p className="text-2xl font-bold">{formatWeight(summary.totalWeightKg)}</p>
            ) : (
              <p className="text-2xl font-bold text-muted-foreground">—</p>
            )}
            <p className="text-xs text-muted-foreground">Alle Assets</p>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Truckspace</p>
            {summary.totalVolumeLiters > 0 ? (
              <p className="text-2xl font-bold">{formatVolume(summary.totalVolumeLiters)}</p>
            ) : (
              <p className="text-2xl font-bold text-muted-foreground">—</p>
            )}
            <p className="text-xs text-muted-foreground">Volumen</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
