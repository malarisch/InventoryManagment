import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LocationEditForm } from "@/components/forms/location-edit-form";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/database.types";
import Link from "next/link";
import { safeParseDate, formatDateTime } from "@/lib/dates";
import { fallbackDisplayFromId } from "@/lib/userDisplay";
import { fetchUserDisplayAdmin } from "@/lib/users/userDisplay.server";
import { LocationCurrentEquipmentsList } from "@/components/locationCurrentEquipmentsList";
import { HistoryCard } from "@/components/historyCard";
import { DeleteWithUndo } from "@/components/forms/delete-with-undo";
import { FileManager } from "@/components/files/file-manager";
import { AssetTagCreateForm } from "@/components/forms/asset-tag-create-form";
import { Button } from "@/components/ui/button";
import { Scan } from "lucide-react";

type LocationRow = Tables<"locations"> & { asset_tags?: { printed_code: string | null } | null };
type EquipmentRow = Tables<"equipments"> & {
  articles?: { name: string } | null;
  asset_tags?: { printed_code: string | null } | null;
};

export default async function LocationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const currentUserId = auth.user?.id ?? null;
  const { data, error } = await supabase
    .from("locations")
    .select("*, asset_tags:asset_tag(printed_code)")
    .eq("id", id)
    .limit(1)
    .single();

  if (error || !data) {
    return (
      <main className="min-h-screen w-full flex flex-col items-center p-5">
        <div className="w-full max-w-none flex-1">
          <p className="text-red-600">Eintrag nicht gefunden.</p>
        </div>
      </main>
    );
  }

  const loc = data as LocationRow;

  const creator = await fetchUserDisplayAdmin(loc.created_by ?? undefined);

  const { data: equipmentsData } = await supabase
    .from("equipments")
    .select("*, articles(name), asset_tags:asset_tag(printed_code)")
    .eq("current_location", id)
    .order("created_at", { ascending: false });

  const equipmentsHere = (equipmentsData as EquipmentRow[] | null) ?? [];

  return (
    <main className="min-h-screen w-full flex flex-col items-center p-5">
      <div className="w-full max-w-none flex-1 space-y-4">
        <div className="text-sm text-muted-foreground">
          <Link href="/management/locations" className="hover:underline">← Zurück zur Übersicht</Link>
        </div>
        <section className="space-y-3">
          <h1 className="text-2xl font-semibold tracking-tight">Standort: {loc.name || `#${loc.id}`}</h1>
          <p className="text-sm text-muted-foreground">
            ID: {loc.id} • Asset Tag: {loc.asset_tag ? (loc.asset_tags?.printed_code ?? `#${loc.asset_tag}`) : "—"}
          </p>
          <p className="text-xs text-muted-foreground">
            Erstellt am: {formatDateTime(safeParseDate(loc.created_at))}
            {` • Erstellt von: ${creator ?? (loc.created_by === currentUserId ? 'Du' : fallbackDisplayFromId(loc.created_by)) ?? '—'}`}
          </p>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <DeleteWithUndo table="locations" id={loc.id} payload={loc as Record<string, unknown>} redirectTo="/management/locations" />
            <div className="flex items-center gap-2">
              <Button variant="outline" asChild className="flex items-center gap-2">
                <Link href={`/management/scanner?mode=assign-location&locationId=${loc.id}`}>
                  <Scan className="h-4 w-4" />
                  Kameramodus
                </Link>
              </Button>
              {!loc.asset_tag && (
                <AssetTagCreateForm
                  item={{ id: loc.id, name: loc.name || `Standort #${loc.id}` }}
                  table="locations"
                  companyId={loc.company_id}
                />
              )}
            </div>
          </div>
          {/* Main edit form without extra Card wrapper */}
          <LocationEditForm location={loc} />
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Dateien</CardTitle>
            <CardDescription>Anhänge und Dokumente zu diesem Standort</CardDescription>
          </CardHeader>
          <CardContent>
            <FileManager table="locations" rowId={loc.id} companyId={loc.company_id} isPublic={false} initial={(loc as Record<string, unknown>).files} />
          </CardContent>
        </Card>

        <LocationCurrentEquipmentsList items={equipmentsHere} pageSize={10} />
        <HistoryCard table="locations" dataId={id} />
      </div>
    </main>
  );
}
