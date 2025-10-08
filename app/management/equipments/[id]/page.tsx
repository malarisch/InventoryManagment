import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EquipmentEditForm } from "@/components/forms/equipment-edit-form";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/database.types";
import Link from "next/link";
import { safeParseDate, formatDate, formatDateTime } from "@/lib/dates";
import { fallbackDisplayFromId } from "@/lib/userDisplay";
import { fetchUserDisplayAdmin } from "@/lib/users/userDisplay.server";
import { HistoryCard } from "@/components/historyCard";
import { FileManager } from "@/components/files/file-manager";
import { MaintenanceLogsCard } from "@/components/maintenance/maintenance-logs-card";
import { WorkshopTodosCard } from "@/components/maintenance/workshop-todos-card";
import { AssetTagCreateForm } from "@/components/forms/asset-tag-create-form";
import { WorkshopTodoCreateInline } from "@/components/forms/workshop-todo-create-inline";
import { DeleteWithUndo } from "@/components/forms/delete-with-undo";
import { Button } from "@/components/ui/button";


type EquipmentRow = Tables<"equipments"> & {
  articles?: { name: string } | null;
  asset_tags?: { printed_code: string | null } | null;
  current_location_location?: { id: number; name: string | null } | null;
};

type CaseSummary = Pick<Tables<"cases">, "id" | "name">;

export default async function EquipmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const currentUserId = auth.user?.id ?? null;
  const { data, error } = await supabase
    .from("equipments")
    .select(
      "*, articles(name), asset_tags:asset_tag(printed_code), current_location_location:current_location(id,name)"
    )
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

  const eq = data as EquipmentRow;
  const [containsCases, containerCases] = await Promise.all([
    supabase
      .from("cases")
      .select("id,name")
      .contains("contains_equipments", [eq.id]),
    supabase
      .from("cases")
      .select("id,name")
      .eq("case_equipment", eq.id),
  ]);

  const caseMembershipMap = new Map<number, CaseSummary>();
  const pushCases = (rows: CaseSummary[] | null | undefined) => {
    if (!rows) return;
    for (const row of rows) {
      if (!row || typeof row.id !== "number") continue;
      caseMembershipMap.set(row.id, row);
    }
  };

  if (!containsCases.error) {
    pushCases(containsCases.data as CaseSummary[] | null);
  }
  if (!containerCases.error) {
    pushCases(containerCases.data as CaseSummary[] | null);
  }
  const caseMembership = Array.from(caseMembershipMap.values()).sort((a, b) => {
    const nameA = a.name ?? `Case #${a.id}`;
    const nameB = b.name ?? `Case #${b.id}`;
    return nameA.localeCompare(nameB, "de-DE");
  });
  const formId = "equipment-edit-form";
  const statusElementId = "equipment-edit-status";

  // Creator email (if accessible), fallback to UUID
  const creator = await fetchUserDisplayAdmin(eq.created_by ?? undefined);

  return (
    <main className="w-full flex flex-col">
      <div className="w-full max-w-7xl mx-auto px-4 py-4 space-y-4">
        <div className="text-sm text-muted-foreground">
          <Link href="/management/equipments" className="hover:underline">← Zurück zur Übersicht</Link>
        </div>
        <Card>
          <CardHeader className="pb-3 px-4 pt-4">
            <CardTitle className="text-lg">{eq.articles?.name ? `${eq.articles.name} #${eq.id}` : `Equipment #${eq.id}`}</CardTitle>
            <CardDescription className="text-xs">
              Artikel: {eq.article_id ? (
                <Link className="underline-offset-2 hover:underline" href={`/management/articles/${eq.article_id}`}>
                  {eq.articles?.name ?? `#${eq.article_id}`}
                </Link>
              ) : "—"}
              {" • Asset Tag: "}
              {eq.asset_tag ? (eq.asset_tags?.printed_code ?? `#${eq.asset_tag}`) : "—"}
              {" • Aktueller Standort: "}
              {eq.current_location ? (
                <Link className="underline-offset-2 hover:underline" href={`/management/locations/${eq.current_location}`}>
                  {eq.current_location_location?.name ?? `#${eq.current_location}`}
                </Link>
              ) : "—"}
              {caseMembership.length > 0 ? (
                <>
                  {" • Case: "}
                  {caseMembership.map((c, index) => (
                    <span key={c.id}>
                      <Link className="underline-offset-2 hover:underline" href={`/management/cases/${c.id}`}>
                        {c.name ?? `Case #${c.id}`}
                      </Link>
                      {index < caseMembership.length - 1 ? ", " : null}
                    </span>
                  ))}
                </>
              ) : null}
              <br />
              Im Lager seit: {formatDate(safeParseDate(eq.added_to_inventory_at))}
              {" • Erstellt am: "}{formatDateTime(safeParseDate(eq.created_at))} {`• Erstellt von: ${creator ?? (eq.created_by === currentUserId ? 'Du' : fallbackDisplayFromId(eq.created_by)) ?? '—'}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4">
                      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <DeleteWithUndo table="equipments" id={eq.id} payload={eq as Record<string, unknown>} redirectTo="/management/equipments" />
                {!eq.asset_tag && (
                  <AssetTagCreateForm
                    item={{ id: eq.id, name: eq.articles?.name || `Equipment #${eq.id}` }}
                    table="equipments"
                    companyId={eq.company_id}
                  />
                )}
                <Button type="submit" form={formId}>
                  Speichern
                </Button>
                {eq.asset_tag && (
                  <Button asChild variant="outline">
                    <Link
                      href={`/api/asset-tags/${eq.asset_tag}/render?format=svg`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Asset Tag anzeigen
                    </Link>
                  </Button>
                )}
                <span
                  id={statusElementId}
                  aria-live="polite"
                  className="min-h-[1.25rem] text-sm text-muted-foreground"
                />
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground">Werkstatt:</span>
                <WorkshopTodoCreateInline companyId={Number(eq.company_id)} equipmentId={Number(eq.id)} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form now at top level (no nested Cards) */}
        <EquipmentEditForm
          equipment={eq}
          formId={formId}
          footerVariant="none"
          statusElementId={statusElementId}
        />

        <Card>
          <CardHeader className="pb-3 px-4 pt-4">
            <CardTitle className="text-lg">Dateien</CardTitle>
            <CardDescription className="text-xs">Anhänge und Dokumente zu diesem Equipment</CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <FileManager table="equipments" rowId={eq.id} companyId={eq.company_id} isPublic={false} initial={(eq as Record<string, unknown>).files} />
          </CardContent>
        </Card>

        <WorkshopTodosCard companyId={Number(eq.company_id)} equipmentId={Number(eq.id)} />
        
        <MaintenanceLogsCard companyId={Number(eq.company_id)} equipmentId={Number(eq.id)} />
      </div>
      <div className="w-full max-w-7xl mx-auto px-4 mt-4">
        <HistoryCard table="equipments" dataId={id} />
      </div>
    </main>
  );
}
