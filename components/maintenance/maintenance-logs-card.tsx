import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MaintenanceLogCreateInline } from "@/components/forms/maintenance-log-create-inline";
import { safeParseDate, formatDateTime } from "@/lib/dates";
import { fallbackDisplayFromId } from "@/lib/userDisplay";
import type { Tables } from "@/database.types";

interface MaintenanceLogsCardProps {
  companyId: number;
  equipmentId?: number;
  caseId?: number;
}

type ProfileLite = { id: string; first_name: string | null; last_name: string | null };

type LogRow = Tables<"maintenance_logs"> & {
  performed_by_profile?: ProfileLite | null;
  created_by_profile?: ProfileLite | null;
};

function combineName(profile?: ProfileLite | null): string | null {
  if (!profile) return null;
  const first = profile.first_name?.trim() ?? "";
  const last = profile.last_name?.trim() ?? "";
  const combined = `${first} ${last}`.trim();
  return combined.length > 0 ? combined : null;
}

export async function MaintenanceLogsCard({ companyId, equipmentId, caseId }: MaintenanceLogsCardProps) {
  const supabase = await createClient();

  let query = supabase
    .from("maintenance_logs")
    .select(
      "id, title, notes, performed_at, performed_by, created_at, equipment_id, case_id, performed_by_profile:profiles!maintenance_logs_performed_by_fkey(first_name,last_name,id), created_by_profile:profiles!maintenance_logs_created_by_fkey(first_name,last_name,id)"
    )
    .eq("company_id", companyId)
    .order("performed_at", { ascending: false })
    .limit(25);

  if (typeof equipmentId === "number") {
    query = query.eq("equipment_id", equipmentId);
  }
  if (typeof caseId === "number") {
    query = query.eq("case_id", caseId);
  }

  const { data, error } = await query;
  const rows = (data as LogRow[] | null) ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Wartungslogs</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <MaintenanceLogCreateInline companyId={companyId} equipmentId={equipmentId} caseId={caseId} />
        {error ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            Fehler beim Laden der Wartungslogs: {error.message}
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-md border border-dashed px-4 py-6 text-sm text-muted-foreground">
            Noch keine Wartungslogs vorhanden.
          </div>
        ) : (
          <ul className="space-y-3">
            {rows.map((row) => {
              const performedDisplay = combineName(row.performed_by_profile) ?? fallbackDisplayFromId(row.performed_by) ?? "Unbekannt";
              const performedAt = formatDateTime(safeParseDate(row.performed_at));
              const createdAt = formatDateTime(safeParseDate(row.created_at));
              const createdDisplay = combineName(row.created_by_profile) ?? fallbackDisplayFromId(row.created_by) ?? "—";
              return (
                <li key={row.id} className="rounded-md border px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold">{row.title}</div>
                      <div className="text-xs text-muted-foreground">
                        Ausgeführt am {performedAt} • von {performedDisplay}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Erfasst am {createdAt} • durch {createdDisplay}
                      </div>
                      {row.notes ? (
                        <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{row.notes}</p>
                      ) : null}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
