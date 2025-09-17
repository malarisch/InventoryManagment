import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/database.types";
import { ArticleEditForm } from "@/components/forms/article-edit-form";
import Link from "next/link";
import { ArticleEquipmentsTable } from "@/components/articleEquipmentsTable";
import { safeParseDate, formatDateTime } from "@/lib/dates";
import { fallbackDisplayFromId } from "@/lib/userDisplay";
import { fetchUserDisplayAdmin } from "@/lib/users/userDisplay.server";

type Article = Tables<"articles">;
type Equipment = Tables<"equipments"> & { article_location_history?: { location_id: number; locations?: { name: string } | null }[] };

export default async function ArticleDetailPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const currentUserId = auth.user?.id ?? null;
  const { data, error } = await supabase
    .from("articles")
    .select("*, locations:default_location(name)")
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

  const article = data as Article & { locations?: { name: string } | null };

  // Creator name/email if available
  const creator = await fetchUserDisplayAdmin((article as any).created_by as any);

  // Equipments werden clientseitig paginiert geladen

  return (
    <main className="min-h-screen w-full flex flex-col items-center p-5">
      <div className="w-full max-w-3xl flex-1 space-y-4">
        <div className="text-sm text-muted-foreground">
          <Link href="/management/articles" className="hover:underline">← Zurück zur Übersicht</Link>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Artikel #{article.id}</CardTitle>
            <CardDescription>
              Default Location: {article.default_location ? (
                <Link className="underline-offset-2 hover:underline" href={`/management/locations/${article.default_location}`}>
                  {article.locations?.name ?? `#${article.default_location}`}
                </Link>
              ) : "—"}
              <br />
              Erstellt am: {formatDateTime(safeParseDate((article as any).created_at))} {`• Erstellt von: ${creator ?? ((article as any).created_by === currentUserId ? 'Du' : fallbackDisplayFromId((article as any).created_by)) ?? '—'}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ArticleEditForm article={article} />
          </CardContent>
        </Card>

        <ArticleEquipmentsTable articleId={id} pageSize={10} />
      </div>
    </main>
  );
}
