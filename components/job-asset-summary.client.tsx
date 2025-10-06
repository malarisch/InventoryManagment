"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { AssetSummary } from "@/lib/jobs/asset-summary";
import { fetchAssetSummary } from "@/lib/jobs/asset-summary";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function formatPrice(amount: number, currency: string): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency,
  }).format(amount);
}

function formatWeight(kg: number): string {
  if (kg >= 1000) {
    return `${(kg / 1000).toFixed(2)} t`;
  }
  return `${kg.toFixed(2)} kg`;
}

function formatVolume(liters: number): string {
  if (liters >= 1000) {
    return `${(liters / 1000).toFixed(2)} m³`;
  }
  return `${liters.toFixed(0)} L`;
}

export function JobAssetSummaryClient({ jobId, initialSummary }: { jobId: number; initialSummary: AssetSummary }) {
  const supabase = useMemo(() => createClient(), []);
  const [summary, setSummary] = useState<AssetSummary>(initialSummary);
  const [refreshing, setRefreshing] = useState(false);
  const pendingRef = useRef(false);

  const refreshSummary = useCallback(async () => {
    if (pendingRef.current) return;
    pendingRef.current = true;
    setRefreshing(true);
    try {
      const next = await fetchAssetSummary(supabase, jobId);
      setSummary(next);
    } finally {
      pendingRef.current = false;
      setRefreshing(false);
    }
  }, [supabase, jobId]);

  useEffect(() => {
    const handler = (event: Event) => {
      try {
        const custom = event as CustomEvent<{ jobId?: number }>;
        if (!custom.detail?.jobId || custom.detail.jobId === jobId) {
          void refreshSummary();
        }
      } catch {
        void refreshSummary();
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("job-booked-assets:refresh", handler);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("job-booked-assets:refresh", handler);
      }
    };
  }, [jobId, refreshSummary]);

  useEffect(() => {
    const channel = supabase
      .channel(`job-asset-summary-${jobId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "job_booked_assets", filter: `job_id=eq.${jobId}` },
        () => {
          void refreshSummary();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, jobId, refreshSummary]);

  return (
    <Card data-refreshing={refreshing ? "true" : "false"}>
      <CardHeader>
        <CardTitle>Asset-Zusammenfassung</CardTitle>
        <CardDescription>Übersicht über gebuchte Assets</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(16rem,1fr))] lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Anzahl</p>
            <p className="text-2xl font-bold">{summary.itemCount}</p>
            <p className="text-xs text-muted-foreground">
              {summary.equipmentCount}&nbsp;Equipment{summary.equipmentCount !== 1 ? "s" : ""}, {summary.caseCount}&nbsp;Case{summary.caseCount !== 1 ? "s" : ""}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Tagespreis</p>
            {summary.totalPrice !== null && summary.currency ? (
              <p className="text-2xl font-bold">{formatPrice(summary.totalPrice, summary.currency)}</p>
            ) : (
              <p className="text-2xl font-bold text-muted-foreground">—</p>
            )}
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Gesamtgewicht</p>
            {summary.totalWeightKg > 0 ? (
              <p className="text-2xl font-bold">{formatWeight(summary.totalWeightKg)}</p>
            ) : (
              <p className="text-2xl font-bold text-muted-foreground">—</p>
            )}
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Truckspace</p>
            {summary.totalVolumeLiters > 0 ? (
              <p className="text-2xl font-bold">{formatVolume(summary.totalVolumeLiters)}</p>
            ) : (
              <p className="text-2xl font-bold text-muted-foreground">—</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
