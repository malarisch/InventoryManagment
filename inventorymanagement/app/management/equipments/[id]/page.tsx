import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EquipmentEditForm } from "@/components/forms/equipment-edit-form";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/database.types";
import Link from "next/link";
import { safeParseDate, formatDate, formatDateTime } from "@/lib/dates";
import { fallbackDisplayFromId } from "@/lib/userDisplay";
import { fetchUserDisplayAdmin } from "@/lib/users/userDisplay.server";

type Equipment = Tables<"equipments">;

export default async function EquipmentDetailPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const currentUserId = auth.user?.id ?? null;
  const { data, error } = await supabase
    .from("equipments")
    .select("*, articles(name), article_location_history(location_id, locations(name))")
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

  const eq = data as any as Equipment & { articles?: { name: string } | null; article_location_history?: { locations?: { name: string } | null }[] };

  // Creator email (if accessible), fallback to UUID
  const creator = await fetchUserDisplayAdmin(eq.created_by as any);

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
              Artikel: {eq.articles?.name ?? "—"} • Aktueller Standort: {eq.article_location_history?.[0]?.locations?.name ?? "—"}
              <br />
              Im Lager seit: {formatDate(safeParseDate(eq.added_to_inventory_at as any))}
              {" • Erstellt am: "}{formatDateTime(safeParseDate(eq.created_at as any))} {`• Erstellt von: ${creator ?? (eq.created_by === currentUserId ? 'Du' : fallbackDisplayFromId(eq.created_by as any)) ?? '—'}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EquipmentEditForm equipment={eq} />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
