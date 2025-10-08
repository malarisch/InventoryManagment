import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {createClient} from "@/lib/supabase/server";
import {getActiveCompanyId} from "@/lib/companies";
import type {Tables} from "@/database.types";
import Link from "next/link";
import {HistoryCard} from "@/components/historyCard";
import {CaseEditItemsForm} from "@/components/forms/case-edit-items-form";
import {DeleteWithUndo} from "@/components/forms/delete-with-undo";
import {FileManager} from "@/components/files/file-manager";
import { WorkshopTodoCreateInline } from "@/components/forms/workshop-todo-create-inline";
import { MaintenanceLogsCard } from "@/components/maintenance/maintenance-logs-card";
import { fetchUserDisplayAdmin } from "@/lib/users/userDisplay.server";
import { CaseEquipmentCard } from "@/components/case-equipment-card";

type CaseEquipmentRow = Tables<"equipments"> & {
  articles?: { name: string } | null;
  asset_tags?: { printed_code: string | null } | null;
  current_location_location?: { id: number; name: string | null } | null;
};

type CaseRow = Tables<"cases"> & {
  case_equipment_equipment?: CaseEquipmentRow | null;
};

export default async function CaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  const supabase = await createClient();
  const activeCompanyId = await getActiveCompanyId();
  
  if (!activeCompanyId) {
    return (
      <main className="min-h-screen w-full flex flex-col items-center p-5">
        <div className="w-full max-w-none flex-1">
          <p className="text-red-600">Keine aktive Company ausgewählt.</p>
        </div>
      </main>
    );
  }

  const { data, error } = await supabase
    .from("cases")
    .select(
      "*, case_equipment_equipment:case_equipment(id, article_id, current_location, added_to_inventory_at, asset_tag, articles(name), asset_tags:asset_tag(printed_code), current_location_location:current_location(id,name))",
    )
    .eq("id", id)
    .eq("company_id", activeCompanyId)
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

  const row = data as CaseRow;
  const caseCompanyId = typeof row.company_id === "number" ? row.company_id : null;
  const caseEquipment = row.case_equipment_equipment ?? null;

  // Fetch creator display name
  const creatorDisplay = row.created_by ? await fetchUserDisplayAdmin(row.created_by) : null;
  const createdAt = row.created_at ? new Date(row.created_at).toLocaleString("de-DE") : null;


  return (
    <main className="min-h-screen w-full flex flex-col items-center p-5">
      <div className="w-full max-w-none flex-1 space-y-4">
        <div className="text-sm text-muted-foreground">
          <Link href="/management/cases" className="hover:underline">← Zurück zur Übersicht</Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{row.name ?? `Case #${row.id}`}</CardTitle>
            <CardDescription>
              {row.description && (<><div className="mb-2">{row.description}</div></>)}
              Erstellt von: {creatorDisplay ?? "—"}
              {createdAt && ` am ${createdAt}`}
              {row.asset_tag ? (
                <div className="mt-2">
                  <Link
                    href={`/api/asset-tags/${row.asset_tag}/render?format=svg`}
                    target="_blank"
                    className="text-sm underline underline-offset-2 text-blue-600 hover:text-blue-800"
                  >
                    Asset Tag anzeigen
                  </Link>
                </div>
              ) : null}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
              <DeleteWithUndo table="cases" id={row.id} payload={row as Record<string, unknown>} redirectTo="/management/cases" />
              {caseCompanyId ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Werkstatt:</span>
                  <WorkshopTodoCreateInline companyId={Number(caseCompanyId)} caseId={Number(row.id)} />
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>

        {/* Case Equipment Card with edit modal */}
        {caseCompanyId ? (
          <CaseEquipmentCard
            caseId={id}
            caseEquipment={caseEquipment}
            companyId={caseCompanyId}
            containsEquipments={row.contains_equipments ?? []}
          />
        ) : null}

        <CaseEditItemsForm
          caseId={id}
          initialEquipments={row.contains_equipments ?? []}
          initialArticles={(row.contains_articles as unknown as Array<{ article_id?: number; amount?: number }>) ?? []}
          caseEquipmentId={row.case_equipment ?? null}
          initialName={row.name ?? null}
          initialDescription={row.description ?? null}
        />

        <Card>
          <CardHeader>
            <CardTitle>Dateien</CardTitle>
            <CardDescription>Anhänge und Dokumente zu diesem Case</CardDescription>
          </CardHeader>
          <CardContent>
            <FileManager table="cases" rowId={row.id} companyId={row.company_id ?? undefined} isPublic={false} initial={(row as Record<string, unknown>).files} />
          </CardContent>
        </Card>

        {caseCompanyId ? (
          <MaintenanceLogsCard companyId={Number(caseCompanyId)} caseId={Number(row.id)} />
        ) : null}

        <HistoryCard table="cases" dataId={id} />
      </div>
    </main>
  );
}
