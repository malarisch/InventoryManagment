"use client";

import { useEffect, useMemo, useState } from "react";
import type { Tables } from "@/database.types";
import { createClient } from "@/lib/supabase/client";
import { formatDateTime, safeParseDate } from "@/lib/dates";
import { fallbackDisplayFromId } from "@/lib/userDisplay";

type HistoryRow = Tables<"history">;

export type HistoryDisplayRow = {
  id: number;
  created_at: string;
  change_made_by: string | null;
  op?: string | null;
  payload: Record<string, unknown>;
  actorDisplay: string | null;
  changes?: Array<{ key: string; from: unknown; to: unknown }>;
};

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

function deepDiff(prevPayload: Record<string, unknown> | null, currPayload: Record<string, unknown>): Array<{ key: string; from: unknown; to: unknown }> {
  const prevFlat = prevPayload ? flatten(prevPayload) : {};
  const currFlat = flatten(currPayload);
  const keys = Array.from(new Set([...Object.keys(prevFlat), ...Object.keys(currFlat)]));
  const changes: Array<{ key: string; from: unknown; to: unknown }> = [];
  for (const key of keys) {
    if (EXCLUDE_KEYS.has(lastSegment(key))) continue;
    const a = (prevFlat as any)[key];
    const b = (currFlat as any)[key];
    if (JSON.stringify(a) !== JSON.stringify(b)) {
      changes.push({ key, from: a, to: b });
    }
  }
  return changes;
}

export function HistoryLive({
  table,
  dataId,
  initial,
}: {
  table: string;
  dataId: number;
  initial: HistoryDisplayRow[];
}) {
  const supabase = useMemo(() => createClient(), []);
  const [rows, setRows] = useState<HistoryDisplayRow[]>(() => initial);

  useEffect(() => {
    let mounted = true;
    async function run() {
      const { data: auth } = await supabase.auth.getUser();
      const currentUserId = auth.user?.id ?? null;

      const channel = supabase
        .channel(`history-${table}-${dataId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'history', filter: `data_id=eq.${dataId}` },
          (payload) => {
            if (!mounted) return;
            const event = (payload as any).eventType as 'INSERT' | 'UPDATE' | 'DELETE';
            setRows((prev) => {
              if (event === 'DELETE') {
                const oldRow = payload.old as HistoryRow | null;
                if (!oldRow) return prev;
                return prev.filter((r) => r.id !== oldRow.id);
              }
              const newRow = payload.new as HistoryRow | null;
              if (!newRow) return prev;
              const op = (newRow.old_data as any)?._op as string | undefined;
              const actorDisplay = newRow.change_made_by && newRow.change_made_by === currentUserId
                ? 'dir'
                : fallbackDisplayFromId(newRow.change_made_by);
              const prevPayload = prev[0]?.payload ?? null;
              const curr = (newRow.old_data as any) ?? {};
              const changes = deepDiff(prevPayload, curr);
              const disp: HistoryDisplayRow = {
                id: newRow.id,
                created_at: newRow.created_at,
                change_made_by: newRow.change_made_by,
                op,
                payload: (newRow.old_data as any) ?? {},
                actorDisplay,
                changes,
              };
              if (event === 'UPDATE') {
                const rest = prev.filter((r) => r.id !== newRow.id);
                return [disp, ...rest];
              }
              return [disp, ...prev];
            });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
    const cleanupPromise = run();
    return () => {
      mounted = false;
      void cleanupPromise;
    };
  }, [supabase, table, dataId]);

  const previewKeys = ["id", "name", "article_id", "default_location", "asset_tag", "current_location", "company_id"] as const;

  return (
    <div className="overflow-x-auto border rounded-md">
      <table className="w-full border-collapse text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="text-left font-medium px-3 py-2 border-b">Zeitpunkt</th>
            <th className="text-left font-medium px-3 py-2 border-b">Von</th>
            <th className="text-left font-medium px-3 py-2 border-b">Aktion</th>
            <th className="text-left font-medium px-3 py-2 border-b">Werte</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td className="px-3 py-3 text-muted-foreground" colSpan={4}>Keine Einträge vorhanden.</td>
            </tr>
          ) : rows.map((h) => {
            const preview = previewKeys
              .filter((k) => Object.prototype.hasOwnProperty.call(h.payload, k))
              .map((k) => `${k}: ${String((h.payload as any)[k])}`)
              .join(" • ");
            return (
              <tr key={h.id} className="odd:bg-background even:bg-muted/20 align-top">
                <td className="px-3 py-2 border-t whitespace-nowrap">{formatDateTime(safeParseDate(h.created_at))}</td>
                <td className="px-3 py-2 border-t">{h.actorDisplay ?? "—"}</td>
                <td className="px-3 py-2 border-t"><span className="inline-flex items-center rounded border px-2 py-0.5 text-xs capitalize">{h.op ?? 'update'}</span></td>
                <td className="px-3 py-2 border-t">
                  {h.changes && h.changes.length > 0 ? (
                    <div className="text-xs text-muted-foreground space-y-1">
                      {h.changes.map((c) => (
                        <div key={c.key}>
                          <span className="font-medium">{c.key}</span>: {typeof c.from === 'object' ? JSON.stringify(c.from) : String(c.from)} → {typeof c.to === 'object' ? JSON.stringify(c.to) : String(c.to)}
                        </div>
                      ))}
                    </div>
                  ) : preview ? (
                    <div className="text-xs text-muted-foreground">{preview}</div>
                  ) : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
