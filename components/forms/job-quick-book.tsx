"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/database.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCompany } from "@/app/management/_libs/companyHook";

type Article = Tables<"articles">;
type Equipment = Tables<"equipments"> & { articles?: { name: string } | null };
type CaseRow = Tables<"cases">;

export function JobQuickBook({ jobId }: { jobId: number }) {
  const supabase = useMemo(() => createClient(), []);
  const { company } = useCompany();
  const [articles, setArticles] = useState<Article[]>([]);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [cases, setCases] = useState<CaseRow[]>([]);
  const [bookedEqIds, setBookedEqIds] = useState<number[]>([]);
  const [articleId, setArticleId] = useState<number | "">("");
  const [articleAmount, setArticleAmount] = useState<number>(1);
  const [equipmentId, setEquipmentId] = useState<string>("");
  const [caseId, setCaseId] = useState<number | "">("");
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      const [arts, eqs, cs, booked] = await Promise.all([
        supabase.from("articles").select("id,name").order("name"),
        supabase.from("equipments").select("*, articles:article_id(name)").order("created_at", { ascending: false }).limit(1000),
        supabase.from("cases").select("id, name").order("created_at", { ascending: false }).limit(200),
        supabase.from("job_booked_assets").select("equipment_id").eq("job_id", jobId),
      ]);
      if (!active) return;
      setArticles((arts.data as Article[] | null) ?? []);
      setEquipments((eqs.data as Equipment[] | null) ?? []);
      setCases((cs.data as CaseRow[] | null) ?? []);
      setBookedEqIds(((booked.data as Array<{ equipment_id: number | null }> | null) ?? []).map((r) => r.equipment_id).filter((x): x is number => typeof x === 'number'));
      setLoading(false);
    }
    load();
    return () => { active = false; };
  }, [supabase, jobId]);

  async function bookEquipmentsByArticle() {
    setStatus(null);
    if (!company) { setStatus("Keine Company"); return; }
    if (articleId === "") { setStatus("Artikel wählen"); return; }
    const list = equipments.filter((e) => e.article_id === Number(articleId) && !bookedEqIds.includes(e.id));
    const take = Math.min(articleAmount, list.length);
    if (take <= 0) { setStatus("Keine passenden Equipments"); return; }
    const toBook = list.slice(0, take);
    const rows = toBook.map((e) => ({ job_id: jobId, company_id: company.id, equipment_id: e.id }));
    const { error } = await supabase.from("job_booked_assets").insert(rows);
    if (error) setStatus(error.message); else setStatus(`${rows.length} Equipments gebucht.`);
    setBookedEqIds((prev) => [...prev, ...toBook.map((e) => e.id)]);
  }

  async function bookEquipmentById() {
    setStatus(null);
    if (!company) { setStatus("Keine Company"); return; }
    const id = Number(equipmentId);
    if (!id) { setStatus("Ungültige ID"); return; }
    if (bookedEqIds.includes(id)) { setStatus("Schon gebucht"); return; }
    const { error } = await supabase.from("job_booked_assets").insert({ job_id: jobId, company_id: company.id, equipment_id: id });
    if (error) setStatus(error.message); else setStatus(`Equipment #${id} gebucht.`);
    setBookedEqIds((prev) => [...prev, id]);
    setEquipmentId("");
  }

  async function bookCase() {
    setStatus(null);
    if (!company) { setStatus("Keine Company"); return; }
    if (caseId === "") { setStatus("Case wählen"); return; }
    const { error } = await supabase.from("job_booked_assets").insert({ job_id: jobId, company_id: company.id, case_id: Number(caseId) });
    if (error) setStatus(error.message); else setStatus(`Case #${caseId} gebucht.`);
    setCaseId("");
  }

  return (
    <div className="space-y-6">
      <div className="text-sm text-muted-foreground">Schnelles Buchen von Assets für diesen Job.</div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <div className="text-sm font-medium">Nach Artikel (Anzahl)</div>
          <div className="flex items-center gap-2">
            <select className="h-9 rounded-md border bg-background px-3 text-sm" value={articleId} onChange={(e) => setArticleId(e.target.value === "" ? "" : Number(e.target.value))}>
              <option value="">— Artikel wählen —</option>
              {articles.map((a) => (<option key={a.id} value={a.id}>{a.name ?? `#${a.id}`}</option>))}
            </select>
            <Input className="w-24" type="number" min={1} value={String(articleAmount)} onChange={(e) => setArticleAmount(Math.max(1, Number(e.target.value) || 1))} />
            <Button type="button" onClick={bookEquipmentsByArticle} disabled={loading}>Buchen</Button>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium">Equipment per ID</div>
          <div className="flex items-center gap-2">
            <Input className="w-40" placeholder="Equipment-ID" value={equipmentId} onChange={(e) => setEquipmentId(e.target.value)} />
            <Button type="button" variant="outline" onClick={bookEquipmentById} disabled={loading}>Buchen</Button>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium">Case wählen</div>
          <div className="flex items-center gap-2">
            <select className="h-9 rounded-md border bg-background px-3 text-sm" value={caseId} onChange={(e) => setCaseId(e.target.value === "" ? "" : Number(e.target.value))}>
              <option value="">— Case wählen —</option>
              {cases.map((c) => (<option key={c.id} value={c.id}>{(c as any).name ?? `Case #${c.id}`}</option>))}
            </select>
            <Button type="button" variant="outline" onClick={bookCase} disabled={loading}>Buchen</Button>
          </div>
        </div>
      </div>

      {status && <div className="text-xs text-muted-foreground">{status}</div>}
    </div>
  );
}

