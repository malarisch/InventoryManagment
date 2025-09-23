"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatDateTime, safeParseDate } from "@/lib/dates";
import { ChevronDown, PlusCircle, Pencil, Trash2 } from "lucide-react";

interface HistoryEntry {
  id: number;
  createdAt: string;
  table: string;
  tableLabel: string;
  dataId: number;
  summary: string;
  op: string | null;
  href: string | null;
  actorDisplay: string;
  changes?: Array<{ key: string; from: unknown; to: unknown }>;
}

interface ExpandableHistoryTableProps {
  historyEntries: HistoryEntry[];
}

export function ExpandableHistoryTable({ historyEntries }: ExpandableHistoryTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const toggleRow = (entryId: number) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(entryId)) {
      newExpandedRows.delete(entryId);
    } else {
      newExpandedRows.add(entryId);
    }
    setExpandedRows(newExpandedRows);
  };

  return (
    <div className="overflow-hidden rounded-md border">
      <div className="max-h-96 overflow-auto">
        <table className="w-full min-w-[680px] border-collapse text-sm">
          <thead className="sticky top-0 bg-muted/60 backdrop-blur">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Aktion
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Zeitpunkt
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Bereich
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Datensatz
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Details
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Nutzer
              </th>
            </tr>
          </thead>
          <tbody>
            {historyEntries.map((entry) => {
              const isExpanded = expandedRows.has(entry.id);
              
              return (
                <React.Fragment key={`row-${entry.id}`}>
                  <tr className="border-t border-border/60 even:bg-muted/30">
                    <td className="px-3 py-2 align-top text-xs">
                      <button 
                        className="flex items-center space-x-1"
                        onClick={() => toggleRow(entry.id)}
                        aria-expanded={isExpanded}
                      >
                        <Badge variant="outline" className="uppercase">
                          {entry.op === 'INSERT' ? <PlusCircle className="w-4 h-4 mr-1" /> : entry.op === 'DELETE' ? <Trash2 className="w-4 h-4 mr-1" /> : <Pencil className="w-4 h-4 mr-1" />}
                          {entry.op ? entry.op.toUpperCase() : "UPDATE"}
                        </Badge>
                        <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>
                    </td>
                    <td className="px-3 py-2 align-top text-xs text-muted-foreground">
                      {formatDateTime(safeParseDate(entry.createdAt))}
                    </td>
                    <td className="px-3 py-2 align-top text-xs">{entry.tableLabel}</td>
                    <td className="px-3 py-2 align-top text-xs">
                      {entry.href ? (
                        <Link className="underline underline-offset-4" href={entry.href}>
                          #{entry.dataId}
                        </Link>
                      ) : (
                        <>#{entry.dataId}</>
                      )}
                    </td>
                    <td className="px-3 py-2 align-top text-xs text-muted-foreground">
                      {entry.summary}
                    </td>
                    <td className="px-3 py-2 align-top text-xs">{entry.actorDisplay}</td>
                  </tr>
                  {isExpanded && (
                    <tr className="bg-muted/20">
                      <td colSpan={6} className="p-4">
                        {entry.changes && entry.changes.length > 0 ? (
                          <div className="space-y-3">
                            <h4 className="text-sm font-semibold text-foreground">Änderungen:</h4>
                            <div className="grid gap-2">
                              {entry.changes.map((change, index) => (
                                <div key={index} className="rounded-md border bg-background p-3">
                                  <div className="font-medium text-xs text-muted-foreground mb-2">
                                    Feld: <span className="font-mono text-foreground">{change.key}</span>
                                  </div>
                                  <div className="grid gap-1 text-xs">
                                    <div className="flex items-start gap-2">
                                      <span className="text-destructive font-medium min-w-0">Vorher:</span>
                                      <span className="font-mono bg-destructive/10 px-1 rounded text-foreground break-all">
                                        {change.from === null ? "null" : change.from === undefined ? "undefined" : String(change.from)}
                                      </span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                      <span className="text-green-600 font-medium min-w-0">Nachher:</span>
                                      <span className="font-mono bg-green-100 dark:bg-green-900/20 px-1 rounded text-foreground break-all">
                                        {change.to === null ? "null" : change.to === undefined ? "undefined" : String(change.to)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : entry.op === "UPDATE" ? (
                          <div className="text-xs text-muted-foreground">
                            Keine spezifischen Änderungen verfügbar.
                          </div>
                        ) : (
                          <div className="text-xs text-muted-foreground">
                            {entry.op === "INSERT" ? "Neuer Datensatz erstellt." : "Datensatz gelöscht."}
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}