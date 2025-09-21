import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EquipmentEditForm } from "@/components/forms/equipment-edit-form";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/database.types";
import Link from "next/link";
import { safeParseDate, formatDate, formatDateTime } from "@/lib/dates";
import { fallbackDisplayFromId } from "@/lib/userDisplay";
import { fetchUserDisplayAdmin } from "@/lib/users/userDisplay.server";
import { HistoryCard } from "@/components/historyCard";
import { DeleteWithUndo } from "@/components/forms/delete-with-undo";
import { FileManager } from "@/components/files/file-manager";

type EquipmentRow = Tables<"equipments"> & {
  articles?: { name: string } | null;
  asset_tags?: { printed_code: string | null } | null;
  current_location_location?: { id: number; name: string | null } | null;
};

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
        <div className="w-full max-w-3xl flex-1">
          <p className="text-red-600">Eintrag nicht gefunden.</p>
        </div>
      </main>
    );
  }

  const eq = data as EquipmentRow;

  // Creator email (if accessible), fallback to UUID
  const creator = await fetchUserDisplayAdmin(eq.created_by ?? undefined);

  return (
    <main className="min-h-screen w-full flex flex-col items-center p-5">
      <div className="w-full max-w-3xl flex-1 space-y-4">
        <div className="text-sm text-muted-foreground">
          <Link href="/management/equipments" className="hover:underline">← Zurück zur Übersicht</Link>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Equipment #{eq.id}</CardTitle>
            <CardDescription>
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
              <br />
              Im Lager seit: {formatDate(safeParseDate(eq.added_to_inventory_at))}
              {" • Erstellt am: "}{formatDateTime(safeParseDate(eq.created_at))} {`• Erstellt von: ${creator ?? (eq.created_by === currentUserId ? 'Du' : fallbackDisplayFromId(eq.created_by)) ?? '—'}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <DeleteWithUndo table="equipments" id={eq.id} payload={eq as Record<string, unknown>} redirectTo="/management/equipments" />
            </div>
            <EquipmentEditForm equipment={eq} />
            <div className="mt-6">
              <FileManager table="equipments" rowId={eq.id} initial={(eq as Record<string, unknown>).files} />
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="w-full max-w-3xl mt-4">
        <HistoryCard table="equipments" dataId={id} />
      </div>
    </main>
  );
}
