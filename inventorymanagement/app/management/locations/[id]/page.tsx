import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LocationEditForm } from "@/components/forms/location-edit-form";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/database.types";
import Link from "next/link";
import { safeParseDate, formatDateTime } from "@/lib/dates";
import { fallbackDisplayFromId } from "@/lib/userDisplay";
import { fetchUserDisplayAdmin } from "@/lib/users/userDisplay.server";

type Location = Tables<"locations">;
type Equipment = Tables<"equipments"> & { articles?: { name: string } | null };
import { LocationCurrentEquipmentsList } from "@/components/locationCurrentEquipmentsList";

export default async function LocationDetailPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const currentUserId = auth.user?.id ?? null;
  const { data, error } = await supabase
    .from("locations")
    .select("*")
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

  const loc = data as Location;

  const creator = await fetchUserDisplayAdmin((loc as any).created_by as any);

  // Compute equipments currently at this location:
  // Fetch latest history entries per equipment (approx via ordering + reduce) and filter to this location
  const { data: hist } = await supabase
    .from("article_location_history")
    .select("equipment_id, location_id, created_at, equipments(id, asset_tag, has_asset_sticker, created_at, articles(name))")
    .order("equipment_id", { ascending: true })
    .order("created_at", { ascending: false });

  const currentByEquipment = new Map<number, { equipment: Equipment; location_id: number }>();
  for (const row of (hist as any[] | null) ?? []) {
    const eid = row.equipment_id as number;
    if (!currentByEquipment.has(eid)) {
      currentByEquipment.set(eid, { equipment: row.equipments as Equipment, location_id: row.location_id as number });
    }
  }
  const equipmentsHere = Array.from(currentByEquipment.values())
    .filter((e) => e.location_id === id)
    .map((e) => e.equipment);

  return (
    <main className="min-h-screen w-full flex flex-col items-center p-5">
      <div className="w-full max-w-3xl flex-1 space-y-4">
        <div className="text-sm text-muted-foreground">
          <Link href="/management/locations" className="hover:underline">← Zurück zur Übersicht</Link>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Standort #{loc.id}</CardTitle>
            <CardDescription>
              {loc.name}
              <br />
              Erstellt am: {formatDateTime(safeParseDate((loc as any).created_at))} {`• Erstellt von: ${creator ?? ((loc as any).created_by === currentUserId ? 'Du' : fallbackDisplayFromId((loc as any).created_by)) ?? '—'}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LocationEditForm location={loc} />
          </CardContent>
        </Card>

        <LocationCurrentEquipmentsList items={equipmentsHere} pageSize={10} />
      </div>
    </main>
  );
}
