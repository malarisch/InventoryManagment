import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

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

  const [{ data: todos }, { data: equip }] = await Promise.all([
    supabase.from('workshop_todos')
      .select('id, title, status, equipment_id, case_id, created_at')
      .order('created_at', { ascending: false }),
    supabase.from('equipments')
      .select('id, articles(name), current_location, locations!equipments_current_location_fkey(name)')
      .in('current_location', workshopIds.length ? workshopIds : [0])
  ]);

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
                    {t.case_id ? <span className="ml-2">Case #{t.case_id}</span> : null}
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
      </div>
    </main>
  );
}
