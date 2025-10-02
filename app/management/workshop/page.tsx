import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { safeParseDate, formatDateTime } from '@/lib/dates';
import { fallbackDisplayFromId } from '@/lib/userDisplay';

type ProfileLite = { id: string; first_name: string | null; last_name: string | null };

type LogRow = {
  id: number;
  title: string;
  notes: string | null;
  performed_at: string;
  performed_by: string | null;
  equipment_id: number | null;
  case_id: number | null;
  performed_by_profile?: ProfileLite | null;
};

function combineName(profile?: ProfileLite | null): string | null {
  if (!profile) return null;
  const first = profile.first_name?.trim() ?? "";
  const last = profile.last_name?.trim() ?? "";
  const joined = `${first} ${last}`.trim();
  return joined.length > 0 ? joined : null;
}

export default async function WorkshopPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return (
      <main className="p-6"><div>Not authenticated</div></main>
    );
  }

  // Find current company id via membership/ownership
  const { data: uc } = await supabase
    .from('users_companies')
    .select('company_id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  const companyId = uc?.company_id as number | undefined;

  // Load workshop locations first, then todos and equipments filtered by those locations
  const { data: workshopLocations } = await supabase
    .from('locations')
    .select('id, name')
    .eq('is_workshop', true);
  const workshopIds = (workshopLocations ?? []).map((l: { id: number }) => l.id);

  const logsRequest = companyId
    ? supabase
        .from('maintenance_logs')
        .select('id, title, notes, performed_at, performed_by, equipment_id, case_id, performed_by_profile:profiles!maintenance_logs_performed_by_fkey(first_name,last_name,id)')
        .eq('company_id', companyId)
        .order('performed_at', { ascending: false })
        .limit(20)
    : Promise.resolve({ data: [] as LogRow[] | null });

  const [{ data: todos }, { data: equip }, { data: logsData }] = await Promise.all([
    supabase.from('workshop_todos')
      .select('id, title, status, equipment_id, case_id, created_at')
      .order('created_at', { ascending: false }),
    supabase.from('equipments')
      .select('id, articles(name), current_location, locations!equipments_current_location_fkey(name)')
      .in('current_location', workshopIds.length ? workshopIds : [0]),
    logsRequest,
  ]);

  const logs = (logsData as LogRow[] | null) ?? [];

  return (
    <main className="min-h-screen w-full flex flex-col items-center p-5">
      <div className="w-full max-w-none flex-1 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Werkstatt</h1>
          <div className="text-sm text-muted-foreground">Company: {companyId ?? '—'}</div>
        </div>

        <section className="space-y-3">
          <h2 className="text-lg font-medium">Offene Todos</h2>
          <div className="rounded-md border divide-y">
            {(todos ?? []).length === 0 ? (
              <div className="p-3 text-sm text-muted-foreground">Keine Todos vorhanden.</div>
            ) : (
              (todos ?? []).map((t) => (
                <div key={t.id} className="flex items-center justify-between p-3">
                  <div className="space-y-0.5">
                    <div className="font-medium">{t.title}</div>
                    <div className="text-xs text-muted-foreground">Status: {t.status} · #{t.id}</div>
                  </div>
                  <div className="text-sm">
                    {t.equipment_id ? <Link className="underline" href={`/management/equipments/${t.equipment_id}`}>Equipment #{t.equipment_id}</Link> : null}
                    {t.case_id ? (
                      <Link className="ml-2 underline" href={`/management/cases/${t.case_id}`}>
                        Case #{t.case_id}
                      </Link>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-medium">In der Werkstatt</h2>
          <div className="rounded-md border divide-y">
            {(equip ?? []).length === 0 ? (
              <div className="p-3 text-sm text-muted-foreground">Keine Equipments in der Werkstatt.</div>
            ) : (
              (equip ?? []).map((e) => (
                <div key={e.id} className="flex items-center justify-between p-3">
                  <div className="space-y-0.5">
                    <div className="font-medium">Equipment #{(e as { id: number }).id}</div>
                    <div className="text-xs text-muted-foreground">Artikel: {(() => {
                      const arts = (e as { articles?: { name?: string } | { name?: string }[] | null }).articles;
                      if (!arts) return undefined;
                      return Array.isArray(arts) ? arts[0]?.name : arts.name;
                    })()}</div>
                  </div>
                  <Link className="underline text-sm" href={`/management/equipments/${e.id}`}>Öffnen</Link>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-medium">Letzte Wartungen</h2>
          <div className="rounded-md border divide-y">
            {logs.length === 0 ? (
              <div className="p-3 text-sm text-muted-foreground">Noch keine Wartungslogs vorhanden.</div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="p-3 space-y-1">
                  <div className="text-sm font-medium">{log.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatDateTime(safeParseDate(log.performed_at))} • {combineName(log.performed_by_profile) ?? fallbackDisplayFromId(log.performed_by) ?? '—'}
                  </div>
                  {log.notes ? (
                    <div className="text-sm text-muted-foreground whitespace-pre-line">{log.notes}</div>
                  ) : null}
                  <div className="text-xs text-muted-foreground">
                    {log.equipment_id ? (
                      <Link className="underline" href={`/management/equipments/${log.equipment_id}`}>Equipment #{log.equipment_id}</Link>
                    ) : null}
                    {log.case_id ? (
                      <Link className="ml-3 underline" href={`/management/cases/${log.case_id}`}>Case #{log.case_id}</Link>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
