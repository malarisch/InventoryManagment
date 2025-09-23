import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/database.types";
import { ArticleEditForm } from "@/components/forms/article-edit-form";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DeleteWithUndo } from "@/components/forms/delete-with-undo";
import { HistoryCard } from "@/components/historyCard";
 
import { ArticleEquipmentsTable } from "@/components/articleEquipmentsTable";
import { AssetTagCreateForm } from "@/components/forms/asset-tag-create-form";
import { safeParseDate, formatDateTime } from "@/lib/dates";
import { fallbackDisplayFromId } from "@/lib/userDisplay";
import { fetchUserDisplayAdmin } from "@/lib/users/userDisplay.server";
import { FileManager } from "@/components/files/file-manager";

type ArticleRow = Tables<"articles"> & {
  locations?: { name: string } | null;
  asset_tags?: { printed_code: string | null } | null;
};

export default async function ArticleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const currentUserId = auth.user?.id ?? null;
  const { data, error } = await supabase
    .from("articles")
    .select("*, locations:default_location(name), asset_tags:asset_tag(printed_code)")
    .eq("id", id)
    .limit(1)
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

  const article = data as ArticleRow;

  // Creator name/email if available
  const creator = await fetchUserDisplayAdmin(article.created_by ?? undefined);

  // Equipments werden clientseitig paginiert geladen

  return (
    <main className="min-h-screen w-full flex flex-col items-center p-5">
      <div className="w-full max-w-3xl flex-1 space-y-4">
        <div className="text-sm text-muted-foreground">
          <Link href="/management/articles" className="hover:underline">← Zurück zur Übersicht</Link>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>{article.name || `Artikel #${article.id}`}</CardTitle>
            <CardDescription>
              Default Location: {article.default_location ? (
                <Link className="underline-offset-2 hover:underline" href={`/management/locations/${article.default_location}`}>
                  {article.locations?.name ?? `#${article.default_location}`}
                </Link>
              ) : "—"}
              {" • Asset Tag: "}
              {article.asset_tag ? (article.asset_tags?.printed_code ?? `#${article.asset_tag}`) : "—"}
              <br />
              Erstellt am: {formatDateTime(safeParseDate(article.created_at))} {`• Erstellt von: ${creator ?? (article.created_by === currentUserId ? 'Du' : fallbackDisplayFromId(article.created_by)) ?? '—'}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <DeleteWithUndo table="articles" id={article.id} payload={article as Record<string, unknown>} redirectTo="/management/articles" />
              <Button asChild variant="secondary">
                <Link href={`/management/equipments/new?articleId=${article.id}`}>Equipment hinzufügen</Link>
              </Button>
            </div>
            <ArticleEditForm article={article} />
            <div className="mt-6">
              <FileManager table="articles" rowId={article.id} companyId={article.company_id} isPublic={false} initial={(article as Record<string, unknown>).files} />
            </div>
          </CardContent>
        </Card>

        <ArticleEquipmentsTable articleId={id} pageSize={10} />
        <HistoryCard table="articles" dataId={id} />
      </div>
    </main>
  );
}
