import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/database.types";
import { fetchUserDisplayAdmin } from "@/lib/users/userDisplay.server";
import { HistoryLive, type HistoryDisplayRow } from "@/components/history-live";

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function flatten(obj: unknown, prefix = ''): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (Array.isArray(obj)) {
    obj.forEach((v, i) => {
      const p = prefix ? `${prefix}.${i}` : String(i);
      if (isObject(v) || Array.isArray(v)) Object.assign(out, flatten(v, p));
      else out[p] = v;
    });
  } else if (isObject(obj)) {
    for (const [k, v] of Object.entries(obj)) {
      const p = prefix ? `${prefix}.${k}` : k;
      if (isObject(v) || Array.isArray(v)) Object.assign(out, flatten(v, p));
      else out[p] = v;
    }
  } else if (prefix) {
    out[prefix] = obj as unknown;
  }
  return out;
}

function lastSegment(path: string): string {
  const parts = path.split('.');
  return parts[parts.length - 1] ?? path;
}

const EXCLUDE_KEYS = new Set(['created_at', 'updated_at']);

type HistoryRow = Tables<"history">;

export async function HistoryCard({ table, dataId }: { table: string; dataId: number }) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const currentUserId = auth.user?.id ?? null;
  const { data, error } = await supabase
    .from("history")
    .select("*")
    .eq("table_name", table)
    .eq("data_id", dataId)
    .order("created_at", { ascending: false })
    .limit(50);

  const rows = (data as HistoryRow[] | null) ?? [];

  const base: HistoryDisplayRow[] = await Promise.all(
    rows.map(async (h) => {
      const actor = await fetchUserDisplayAdmin(h.change_made_by ?? undefined);
      const op = (h.old_data as any)?._op as string | undefined;
      return {
        id: h.id,
        created_at: h.created_at,
        change_made_by: h.change_made_by,
        op,
        payload: (h.old_data as any) ?? {},
        actorDisplay: actor ?? (h.change_made_by && h.change_made_by === currentUserId ? 'dir' : null),
      };
    })
  );

  // Compute shallow diffs vs previous (older) snapshot
  const initial: HistoryDisplayRow[] = base.map((row, i) => {
    const older = base[i + 1]?.payload ?? null;
    const curr = row.payload ?? {};
    const olderFlat = older ? flatten(older) : {};
    const currFlat = flatten(curr);
    const keys = Array.from(new Set([...Object.keys(olderFlat), ...Object.keys(currFlat)]));
    const changes: Array<{ key: string; from: unknown; to: unknown }> = [];
    for (const key of keys) {
      if (EXCLUDE_KEYS.has(lastSegment(key))) continue;
      const a = (olderFlat as any)[key];
      const b = (currFlat as any)[key];
      if (JSON.stringify(a) !== JSON.stringify(b)) changes.push({ key, from: a, to: b });
    }
    return { ...row, changes };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historie</CardTitle>
        <CardDescription>{rows.length} Einträge</CardDescription>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="text-sm text-red-600">Fehler beim Laden: {error.message}</div>
        ) : (
          <HistoryLive table={table} dataId={dataId} initial={initial} />
        )}
      </CardContent>
    </Card>
  );
}
