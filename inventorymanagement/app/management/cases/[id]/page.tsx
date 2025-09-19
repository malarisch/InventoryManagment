import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/database.types";
import Link from "next/link";
import { HistoryCard } from "@/components/historyCard";
import { Button } from "@/components/ui/button";
import { CaseEditItemsForm } from "@/components/forms/case-edit-items-form";
import { DeleteWithUndo } from "@/components/forms/delete-with-undo";

type CaseRow = Tables<"cases">;
type Article = Tables<"articles">;

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
        <div className="w-full max-w-3xl flex-1">
          <p className="text-red-600">Eintrag nicht gefunden.</p>
        </div>
      </main>
    );
  }

  const row = data as CaseRow;

  let articles: Article[] = [];
  const articleIds = Array.isArray(row.articles)
    ? (row.articles as Array<{ article_id?: number }>).map((a) => a.article_id).filter((x): x is number => typeof x === "number")
    : [];
  if (articleIds.length) {
    const { data: arts } = await supabase.from("articles").select("id,name").in("id", articleIds);
    articles = (arts as Article[] | null) ?? [];
  }

  return (
    <main className="min-h-screen w-full flex flex-col items-center p-5">
      <div className="w-full max-w-3xl flex-1 space-y-4">
        <div className="text-sm text-muted-foreground">
          <Link href="/management/cases" className="hover:underline">← Zurück zur Übersicht</Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{(row as any).name ? String((row as any).name) : `Case #${row.id}`}</CardTitle>
            <CardDescription>
              Case-Equipment: {row.case_equipment ? (
                <Link className="underline-offset-2 hover:underline" href={`/management/equipments/${row.case_equipment}`}>#{row.case_equipment}</Link>
              ) : "—"}
              {(row as any).description ? (<><br />{String((row as any).description)}</>) : null}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <DeleteWithUndo table="cases" id={row.id} payload={row as any} redirectTo="/management/cases" />
            </div>
            <CaseEditItemsForm caseId={id} initialEquipments={row.equipments ?? []} initialArticles={(row.articles as any) ?? []} caseEquipmentId={row.case_equipment ?? null} initialName={(row as any).name ?? null} initialDescription={(row as any).description ?? null} />
          </CardContent>
        </Card>

        <HistoryCard table="cases" dataId={id} />
      </div>
    </main>
  );
}
