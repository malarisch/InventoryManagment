import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {createClient} from "@/lib/supabase/server";
import type {Tables} from "@/database.types";
import Link from "next/link";
import {HistoryCard} from "@/components/historyCard";
import {CaseEditItemsForm} from "@/components/forms/case-edit-items-form";
import {DeleteWithUndo} from "@/components/forms/delete-with-undo";
import {FileManager} from "@/components/files/file-manager";

type CaseRow = Tables<"cases">;

export default async function CaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("cases")
    .select("*")
    .eq("id", id)
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

  // Artikel-Namen werden im Edit-Formular clientseitig nachgeladen

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
              Case-Equipment: {row.case_equipment ? (
                <Link className="underline-offset-2 hover:underline" href={`/management/equipments/${row.case_equipment}`}>#{row.case_equipment}</Link>
              ) : "—"}
              {row.description ? (<><br />{row.description}</>) : null}
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
            <div className="mb-4">
              <DeleteWithUndo table="cases" id={row.id} payload={row as Record<string, unknown>} redirectTo="/management/cases" />
            </div>
            <CaseEditItemsForm caseId={id} initialEquipments={row.contains_equipments ?? []} initialArticles={(row.contains_articles as unknown as Array<{ article_id?: number; amount?: number }>) ?? []} caseEquipmentId={row.case_equipment ?? null} initialName={row.name ?? null} initialDescription={row.description ?? null} />
            <div className="mt-6">
              <FileManager table="cases" rowId={row.id} companyId={row.company_id ?? undefined} isPublic={false} initial={(row as Record<string, unknown>).files} />
            </div>
          </CardContent>
        </Card>

        <HistoryCard table="cases" dataId={id} />
      </div>
    </main>
  );
}
