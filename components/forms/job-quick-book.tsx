"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/database.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCompany } from "@/app/management/_libs/companyHook";
import {
  SearchPicker,
  type SearchItem,
} from "@/components/search/search-picker";
import { cn } from "@/lib/utils";
import { logEvent } from "@/lib/log";

type Article = Tables<"articles">;
type Equipment = Tables<"equipments"> & {
  articles?: { name: string | null } | null;
  asset_tags?: { printed_code: string | null } | null;
};
type CaseRow = Tables<"cases">;

type QuickBookCategory = "equipment" | "article" | "case";

type QuickBookItem = SearchItem<QuickBookCategory, Article | Equipment | CaseRow>;

type StatusState = { kind: "success" | "error"; message: string } | null;

export function JobQuickBook({ jobId }: { jobId: number }) {
  const supabase = useMemo(() => createClient(), []);
  const { company } = useCompany();
  const [articles, setArticles] = useState<Article[]>([]);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [cases, setCases] = useState<CaseRow[]>([]);
  const [bookedEqIds, setBookedEqIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<StatusState>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [articleAmount, setArticleAmount] = useState<number>(1);

  // Extract load function so it can be called on demand
  const load = useCallback(async () => {
    setLoading(true);
    const [arts, eqs, cs, booked] = await Promise.all([
      supabase.from("articles").select("id,name,metadata").order("name"),
      supabase
        .from("equipments")
        .select("*, articles(name), asset_tags:asset_tag(printed_code)")
        .order("created_at", { ascending: false })
        .limit(1000),
      supabase.from("cases").select("id, name, description").order("created_at", { ascending: false }).limit(200),
      supabase.from("job_booked_assets").select("equipment_id, case_id").eq("job_id", jobId),
    ]);
    setArticles((arts.data as Article[] | null) ?? []);
    setEquipments((eqs.data as Equipment[] | null) ?? []);
    setCases((cs.data as CaseRow[] | null) ?? []);
    setBookedEqIds(
      ((booked.data as Array<{ equipment_id: number | null }> | null) ?? [])
        .map((entry) => entry.equipment_id)
        .filter((id): id is number => typeof id === "number"),
    );
    setLoading(false);
  }, [supabase, jobId]);

  useEffect(() => {
    let active = true;
    async function loadWrapper() {
      await load();
      if (!active) return;
    }
    void loadWrapper();
    return () => {
      active = false;
    };
  }, [load]);

  const searchItems = useMemo<QuickBookItem[]>(() => {
    const list: QuickBookItem[] = [];

    for (const equipment of equipments) {
      if (bookedEqIds.includes(equipment.id)) continue;
      const assetCode = equipment.asset_tags?.printed_code?.trim();
      const articleName = equipment.articles?.name?.trim();
      const descriptionParts: string[] = [];
      if (articleName) descriptionParts.push(articleName);
      descriptionParts.push(`ID #${equipment.id}`);
      const description = descriptionParts.join(" • ");
      const matchers = [
        { value: String(equipment.id), weight: 5 },
      ];
      if (assetCode) matchers.push({ value: assetCode, weight: 0 });
      if (articleName) matchers.push({ value: articleName, weight: 20 });
      list.push({
        id: `equipment-${equipment.id}`,
        category: "equipment",
        title: assetCode ? assetCode : `Equipment #${equipment.id}`,
        description,
        meta: "Equipment",
        priority: 1,
        matchers,
        data: equipment,
      });
    }

    for (const caseRow of cases) {
      const name = caseRow.name?.trim();
      const description = [name || `Case #${caseRow.id}`, caseRow.description?.trim()]
        .filter(Boolean)
        .join(" • ");
      list.push({
        id: `case-${caseRow.id}`,
        category: "case",
        title: name || `Case #${caseRow.id}`,
        description,
        meta: "Case",
        priority: 2,
        matchers: [
          { value: String(caseRow.id), weight: 10 },
          ...(name ? [{ value: name, weight: 10 }] : []),
          ...(caseRow.description ? [{ value: caseRow.description, weight: 40 }] : []),
        ],
        data: caseRow,
      });
    }

    for (const article of articles) {
      const name = article.name?.trim();
      list.push({
        id: `article-${article.id}`,
        category: "article",
        title: name || `Artikel #${article.id}`,
        description: name ? `Artikel #${article.id}` : undefined,
        meta: "Artikel",
        priority: 3,
        matchers: [
          { value: String(article.id), weight: 15 },
          ...(name ? [{ value: name, weight: 5 }] : []),
          ...(typeof article.metadata === "string" ? [{ value: article.metadata, weight: 50 }] : []),
        ],
        data: article,
      });
    }

    return list;
  }, [articles, equipments, cases, bookedEqIds]);

  const availableForSelectedArticle = useMemo(() => {
    if (!selectedArticle) return 0;
    return equipments.filter(
      (equipment) =>
        equipment.article_id === selectedArticle.id && !bookedEqIds.includes(equipment.id),
    ).length;
  }, [selectedArticle, equipments, bookedEqIds]);

  const handleEquipmentBooking = useCallback(
    async (equipment: Equipment) => {
      if (!company) {
        setStatus({ kind: "error", message: "Keine Company ausgewählt." });
        return;
      }
      setActionLoading(true);
      const { error } = await supabase
        .from("job_booked_assets")
        .insert({ job_id: jobId, company_id: company.id, equipment_id: equipment.id });
      if (error) {
        setStatus({ kind: "error", message: error.message });
      } else {
        setStatus({
          kind: "success",
          message: `Equipment ${equipment.asset_tags?.printed_code ?? `#${equipment.id}`} gebucht.`,
        });
        setBookedEqIds((prev) => [...prev, equipment.id]);
        setSelectedArticle(null);
        void logEvent("job_book_equipment", { job_id: jobId, equipment_id: equipment.id });
      }
    setActionLoading(false);
  },
  [company, jobId, supabase],
);

  const handleCaseBooking = useCallback(
    async (caseRow: CaseRow) => {
      if (!company) {
        setStatus({ kind: "error", message: "Keine Company ausgewählt." });
        return;
      }
      setActionLoading(true);
      const { error } = await supabase
        .from("job_booked_assets")
        .insert({ job_id: jobId, company_id: company.id, case_id: caseRow.id });
      if (error) {
        setStatus({ kind: "error", message: error.message });
      } else {
        setStatus({ kind: "success", message: `Case ${caseRow.name ?? `#${caseRow.id}`} gebucht.` });
        setSelectedArticle(null);
        void logEvent("job_book_case", { job_id: jobId, case_id: caseRow.id });
        await load(); // Refresh data
      }
    setActionLoading(false);
  },
  [company, jobId, supabase, load],
);

  const handleArticleBooking = useCallback(async () => {
    if (!selectedArticle) return;
    if (!company) {
      setStatus({ kind: "error", message: "Keine Company ausgewählt." });
      return;
    }
    const available = equipments.filter(
      (equipment) =>
        equipment.article_id === selectedArticle.id && !bookedEqIds.includes(equipment.id),
    );
    if (available.length === 0) {
      setStatus({ kind: "error", message: "Keine freien Equipments für diesen Artikel." });
      return;
    }
    const count = Math.min(articleAmount, available.length);
    if (count <= 0) {
      setStatus({ kind: "error", message: "Menge muss mindestens 1 sein." });
      return;
    }
    setActionLoading(true);
    const slice = available.slice(0, count);
    const rows = slice.map((equipment) => ({
      job_id: jobId,
      company_id: company.id,
      equipment_id: equipment.id,
    }));
    const { error } = await supabase.from("job_booked_assets").insert(rows);
    if (error) {
      setStatus({ kind: "error", message: error.message });
    } else {
      setStatus({
        kind: "success",
        message: `${count} Equipment${count === 1 ? "" : "s"} für ${
          selectedArticle.name ?? `Artikel #${selectedArticle.id}`
        } gebucht.`,
      });
      const bookedIds = slice.map((equipment) => equipment.id);
      setBookedEqIds((prev) => [...prev, ...bookedIds]);
      setArticleAmount(1);
      setSelectedArticle(null);
      void logEvent("job_book_article_equipments", { job_id: jobId, article_id: selectedArticle.id, count });
      await load(); // Refresh data
    }
    setActionLoading(false);
  }, [selectedArticle, company, equipments, bookedEqIds, articleAmount, jobId, supabase, load]);

  const handleSearchSelect = useCallback(
    (item: QuickBookItem) => {
      setStatus(null);
      if (item.category === "equipment") {
        void handleEquipmentBooking(item.data as Equipment);
        return;
      }
      if (item.category === "case") {
        void handleCaseBooking(item.data as CaseRow);
        return;
      }
      setSelectedArticle(item.data as Article);
      setArticleAmount(1);
    },
    [handleEquipmentBooking, handleCaseBooking],
  );

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="text-sm font-medium">Assets suchen</div>
        <SearchPicker
          items={searchItems}
          onSelect={handleSearchSelect}
          categoryLabels={{ equipment: "Equipments", case: "Cases", article: "Artikel" }}
          disabled={loading || actionLoading}
          placeholder="Suche…"
          className="max-w-xl"
        />
        <p className="text-xs text-muted-foreground">
          Tippe nach Asset Tags, Namen oder IDs. Ergebnisse sind nach Relevanz sortiert.
        </p>
      </div>

      {selectedArticle ? (
        <div className="space-y-3 rounded-md border bg-muted/20 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-medium">
                {selectedArticle.name ?? `Artikel #${selectedArticle.id}`}
              </div>
              <div className="text-xs text-muted-foreground">
                Verfügbare Equipments: {availableForSelectedArticle}
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setSelectedArticle(null)}
              disabled={actionLoading}
            >
              Auswahl entfernen
            </Button>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div className="grid gap-1">
              <Label htmlFor="article-amount">Stückzahl</Label>
              <Input
                id="article-amount"
                type="number"
                min={1}
                value={String(articleAmount)}
                onChange={(event) =>
                  setArticleAmount(Math.max(1, Number(event.target.value) || 1))
                }
                className="w-24"
                disabled={actionLoading}
              />
            </div>
            <Button
              type="button"
              onClick={handleArticleBooking}
              disabled={actionLoading}
            >
              Artikel buchen
            </Button>
          </div>
        </div>
      ) : null}

      {status ? (
        <div
          className={cn(
            "rounded-md border px-3 py-2 text-sm",
            status.kind === "success" ? "border-emerald-500 text-emerald-600" : "border-red-500 text-red-600",
          )}
        >
          {status.message}
        </div>
      ) : null}
    </div>
  );
}
