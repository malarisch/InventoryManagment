"use client";

import { useEffect, useMemo, useState } from "react";
import type { Tables } from "@/database.types";
import { createClient } from "@/lib/supabase/client";
import { formatDateTime, safeParseDate } from "@/lib/dates";
import { fallbackDisplayFromId } from "@/lib/userDisplay";
import { describeHistoryEvent } from "@/lib/history/describe";

type HistoryRow = Tables<"history">;

export type HistoryDisplayRow = {
  id: number;
  table_name: string;
  created_at: string;
  change_made_by: string | null;
  op?: string | null;
  summary: string | null;
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
const DETAIL_TABLES = new Set(['job_booked_assets', 'job_assets_on_job']);

function deepDiff(prevPayload: Record<string, unknown> | null, currPayload: Record<string, unknown>): Array<{ key: string; from: unknown; to: unknown }> {
  const prevFlat = prevPayload ? flatten(prevPayload) : {};
  const currFlat = flatten(currPayload);
  const keys = Array.from(new Set([...Object.keys(prevFlat), ...Object.keys(currFlat)]));
  const changes: Array<{ key: string; from: unknown; to: unknown }> = [];
  for (const key of keys) {
    if (EXCLUDE_KEYS.has(lastSegment(key))) continue;
    const a = prevFlat[key];
    const b = currFlat[key];
    if (JSON.stringify(a) !== JSON.stringify(b)) {
      changes.push({ key, from: a, to: b });
    }
  }
  return changes;
}

function formatTableLabel(name: string): string {
  return name
    .split(/[_-]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function HistoryLive({
  tables,
  dataId,
  initial,
}: {
  tables: string[];
  dataId: number;
  initial: HistoryDisplayRow[];
}) {
  const supabase = useMemo(() => createClient(), []);
  const normalizedTables = useMemo(() => Array.from(new Set(tables)).sort(), [tables]);
  const [rows, setRows] = useState<HistoryDisplayRow[]>(() => initial);
  const [equipmentDetails, setEquipmentDetails] = useState<Record<number, { articleName: string | null; assetCode: string | null }>>({});
  const [caseDetails, setCaseDetails] = useState<Record<number, { name: string | null }>>({});

  useEffect(() => {
    let mounted = true;
    async function run() {
      const { data: auth } = await supabase.auth.getUser();
      const currentUserId = auth.user?.id ?? null;

      const channelTables = [...normalizedTables];
      const channel = supabase
        .channel(`history-${channelTables.join('-')}-${dataId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'history', filter: `data_id=eq.${dataId}` },
          (payload) => {
            if (!mounted) return;
            const event = payload.eventType;
            const tableName = ((payload.new as HistoryRow | null) ?? (payload.old as HistoryRow | null))?.table_name;
            if (!tableName || !channelTables.includes(tableName)) return;
            setRows((prev) => {
              if (event === 'DELETE') {
                const oldRow = payload.old as HistoryRow | null;
                if (!oldRow) return prev;
                return prev.filter((r) => r.id !== oldRow.id);
              }
              const newRow = payload.new as HistoryRow | null;
              if (!newRow) return prev;
              const rowPayload = isObject(newRow.old_data) ? (newRow.old_data as Record<string, unknown>) : {};
              const op = (rowPayload as { _op?: string })._op;
              const actorDisplay = newRow.change_made_by && newRow.change_made_by === currentUserId
                ? 'dir'
                : fallbackDisplayFromId(newRow.change_made_by);
              const previousSameTable = prev.find((existing) => existing.table_name === tableName && existing.id !== newRow.id);
              const prevPayload = previousSameTable?.payload ?? null;
              const includeDiff = !DETAIL_TABLES.has(tableName);
              const changes = includeDiff ? deepDiff(prevPayload, rowPayload) : [];
              const disp: HistoryDisplayRow = {
                id: newRow.id,
                table_name: tableName,
                created_at: newRow.created_at,
                change_made_by: newRow.change_made_by,
                op,
                summary: describeHistoryEvent(tableName, op, rowPayload),
                payload: rowPayload,
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
  }, [supabase, normalizedTables, dataId]);

  useEffect(() => {
    const equipIds = rows
      .filter((row) => DETAIL_TABLES.has(row.table_name))
      .map((row) => row.payload['equipment_id'])
      .filter((value): value is unknown => typeof value !== 'undefined');
    const numericIds = Array.from(new Set(equipIds.filter((value): value is number => typeof value === 'number')));
    const missing = numericIds.filter((id) => !(id in equipmentDetails));
    if (missing.length === 0) return;
    let cancelled = false;
    async function load() {
      const { data, error } = await supabase
        .from('equipments')
        .select('id, articles:article_id(name), asset_tags:asset_tag(printed_code)')
        .in('id', missing);
      if (cancelled || error || !data) return;
      setEquipmentDetails((prev) => {
        const next = { ...prev };
        for (const row of data as Array<{ id: number; articles?: { name: string | null } | { name: string | null }[] | null; asset_tags?: { printed_code: string | null } | { printed_code: string | null }[] | null }>) {
          const art = Array.isArray(row.articles) ? row.articles[0] : row.articles;
          const tag = Array.isArray(row.asset_tags) ? row.asset_tags[0] : row.asset_tags;
          next[row.id] = {
            articleName: art?.name ?? null,
            assetCode: tag?.printed_code ?? null,
          };
        }
        return next;
      });
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [rows, equipmentDetails, supabase]);

  useEffect(() => {
    const caseIds = rows
      .filter((row) => DETAIL_TABLES.has(row.table_name))
      .map((row) => row.payload['case_id'])
      .filter((value): value is unknown => typeof value !== 'undefined');
    const numericIds = Array.from(new Set(caseIds.filter((value): value is number => typeof value === 'number')));
    const missing = numericIds.filter((id) => !(id in caseDetails));
    if (missing.length === 0) return;
    let cancelled = false;
    async function load() {
      const { data, error } = await supabase
        .from('cases')
        .select('id, name')
        .in('id', missing);
      if (cancelled || error || !data) return;
      setCaseDetails((prev) => {
        const next = { ...prev };
        for (const row of data as Array<{ id: number; name: string | null }>) {
          next[row.id] = { name: row.name ?? null };
        }
        return next;
      });
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [rows, caseDetails, supabase]);

  const previewKeys = ["id", "name", "article_id", "default_location", "asset_tag", "current_location", "company_id"] as const;

  function readNumber(payload: Record<string, unknown>, key: string): number | null {
    const value = payload[key];
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
  }

  function buildJobDetail(row: HistoryDisplayRow): string | null {
    if (!DETAIL_TABLES.has(row.table_name)) return null;
    const payload = row.payload ?? {};
    const equipmentId = readNumber(payload, 'equipment_id');
    const caseId = readNumber(payload, 'case_id');

    const parts: string[] = [];
    if (typeof equipmentId === 'number') {
      const info = equipmentDetails[equipmentId];
      let label = info?.articleName?.trim() || `Equipment #${equipmentId}`;
      const assetCode = info?.assetCode?.trim();
      if (assetCode) {
        label += ` (Asset-Tag ${assetCode})`;
      }
      parts.push(label);
    }

    if (typeof caseId === 'number') {
      const info = caseDetails[caseId];
      parts.push(info?.name?.trim() || `Case #${caseId}`);
    }

    if (parts.length === 0) return null;

    const op = (row.op ?? '').toUpperCase();
    let action: string;
    switch (op) {
      case 'INSERT':
        action = 'zum Job hinzugefügt';
        break;
      case 'DELETE':
        action = 'aus dem Job entfernt';
        break;
      case 'UPDATE':
        action = 'im Job aktualisiert';
        break;
      default:
        action = 'aktualisiert';
        break;
    }

    return `${parts.join(' • ')} ${action}`;
  }

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
              .map((k) => `${k}: ${String(h.payload[k])}`)
              .join(" • ");
            const detailText = buildJobDetail(h);
            const hasSecondary = detailText ? true : (h.changes?.length ?? 0) > 0 || Boolean(preview);
            return (
              <tr key={h.id} className="odd:bg-background even:bg-muted/20 align-top">
                <td className="px-3 py-2 border-t whitespace-nowrap">{formatDateTime(safeParseDate(h.created_at))}</td>
                <td className="px-3 py-2 border-t">{h.actorDisplay ?? "—"}</td>
                <td className="px-3 py-2 border-t">
                  <div className="flex flex-col gap-1">
                    <span className="inline-flex w-fit items-center rounded border px-2 py-0.5 text-xs capitalize">{h.op ?? 'update'}</span>
                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{formatTableLabel(h.table_name)}</span>
                  </div>
                </td>
                <td className="px-3 py-2 border-t">
                  {h.summary ? (
                    <div className={`text-xs font-medium text-foreground${hasSecondary ? " mb-1" : ""}`}>
                      {h.summary}
                    </div>
                  ) : null}
                  {detailText ? (
                    <div className="text-xs text-muted-foreground">{detailText}</div>
                  ) : h.changes && h.changes.length > 0 ? (
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
