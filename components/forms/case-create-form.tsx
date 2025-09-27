"use client";

import {useEffect, useMemo, useState} from "react";
import {createClient} from "@/lib/supabase/client";
import type {Json, Tables, TablesInsert} from "@/database.types";
import type {adminCompanyMetadata} from "@/components/metadataTypes.types";
import {buildAssetTagCode} from "@/lib/asset-tags/code";
import {Label} from "@/components/ui/label";
import {Button} from "@/components/ui/button";
import {useRouter} from "next/navigation";
import {useCompany} from "@/app/management/_libs/companyHook";

type Equipment = Tables<"equipments">;
type Article = Tables<"articles">;

export function CaseCreateForm() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const { company } = useCompany();
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [caseEquipment, setCaseEquipment] = useState<number | "">("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [articleId, setArticleId] = useState<number | "">("");
  const [articleAmount, setArticleAmount] = useState<number>(1);
  const [articleItems, setArticleItems] = useState<Array<{ article_id: number; amount: number }>>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assetTagTemplateId, setAssetTagTemplateId] = useState<number | "">("");
  const [assetTagTemplates, setAssetTagTemplates] = useState<Tables<"asset_tag_templates">[]>([]);
  const [companyMeta, setCompanyMeta] = useState<adminCompanyMetadata | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!company?.id) return;
      const { data } = await supabase
        .from("equipments")
        .select("id, article_id, company_id")
        .eq("company_id", company.id)
        .order("created_at", { ascending: false })
        .limit(200);
      const { data: arts } = await supabase
        .from("articles")
        .select("id,name,company_id")
        .eq("company_id", company.id)
        .order("name");
      const [{ data: tmplData }, { data: companyRow }] = await Promise.all([
        supabase.from("asset_tag_templates").select("id,template,company_id").eq("company_id", company.id).order("created_at", { ascending: false }),
        supabase.from("companies").select("metadata").eq("id", company.id).limit(1).maybeSingle(),
      ]);
      if (!active) return;
      setEquipments((data as Equipment[]) ?? []);
      setArticles((arts as Article[]) ?? []);
      setAssetTagTemplates((tmplData as Tables<"asset_tag_templates">[]) ?? []);
      setCompanyMeta(companyRow?.metadata as unknown as adminCompanyMetadata || null);
      const metaPartial = companyRow?.metadata as Partial<adminCompanyMetadata> | undefined;
      const defId = metaPartial?.defaultCaseAssetTagTemplateId;
      if (defId) setAssetTagTemplateId(defId);
    }
    load();
    return () => { active = false; };
  }, [supabase]);

  function toggle(id: number) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function addArticleItem() {
    if (articleId === "" || articleAmount < 1) return;
    const id = Number(articleId);
    setArticleItems((prev) => {
      const existing = prev.find((p) => p.article_id === id);
      if (existing) {
        return prev.map((p) => (p.article_id === id ? { ...p, amount: p.amount + articleAmount } : p));
      }
      return [...prev, { article_id: id, amount: articleAmount }];
    });
    setArticleId("");
    setArticleAmount(1);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id ?? null;
      if (!company || !userId) throw new Error("Fehlende Company oder Nutzer");
      const payload: TablesInsert<"cases"> = {
        case_equipment: caseEquipment === "" ? null : Number(caseEquipment),
        contains_equipments: selectedIds || null,
        name: name.trim() || null,
        description: description.trim() || null,
        company_id: company.id,
        created_by: userId,
      };
      if (articleItems.length) payload.contains_articles = articleItems as unknown as Json[];
      const { data, error } = await supabase
        .from("cases")
        .insert(payload)
        .select("id")
        .single();
      if (error) throw error;
      const id = (data as Tables<"cases">).id;
      if (assetTagTemplateId !== "") {
        const printed_code = companyMeta ? buildAssetTagCode(companyMeta, "case", id) : String(id);
        const { data: tag, error: tagErr } = await supabase
          .from("asset_tags")
          .insert({ printed_template: Number(assetTagTemplateId), printed_code, company_id: company.id, created_by: userId })
          .select("id")
          .single();
        if (tagErr) throw tagErr;
        const tagId = (tag as Tables<"asset_tags">).id;
        await supabase.from("cases").update({ asset_tag: tagId }).eq("id", id);
      }
      router.push(`/management/cases/${id}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="name">Titel</Label>
        <input id="name" className="h-9 rounded-md border bg-background px-3 text-sm" value={name} onChange={(e) => setName(e.target.value)} placeholder="z. B. FOH Case" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="description">Beschreibung</Label>
        <input id="description" className="h-9 rounded-md border bg-background px-3 text-sm" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="optional" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="case_equipment">Case-Equipment (optional)</Label>
        <select
          id="case_equipment"
          className="h-9 rounded-md border bg-background px-3 text-sm"
          value={caseEquipment}
          onChange={(e) => setCaseEquipment(e.target.value === "" ? "" : Number(e.target.value))}
        >
          <option value="">— Kein Case-Equipment —</option>
          {equipments.map((e) => {
            const aName = articles.find((a) => a.id === e.article_id)?.name ?? (e.article_id ? `#${e.article_id}` : "—");
            return (
              <option key={e.id} value={e.id}>#{e.id} • {aName}</option>
            );
          })}
        </select>
      </div>
      <div className="grid gap-2">
        <Label>Ausstattung (mehrere wählbar)</Label>
        <div className="flex items-center gap-2">
          <input
            className="h-9 w-64 rounded-md border bg-background px-3 text-sm"
            placeholder="Suche (ID oder Artikelname)"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="overflow-x-auto rounded border">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-2 py-2 border-b w-10"></th>
                <th className="text-left font-medium px-2 py-2 border-b">ID</th>
                <th className="text-left font-medium px-2 py-2 border-b">Artikel</th>
              </tr>
            </thead>
            <tbody>
              {equipments
                .filter((e) => {
                  const term = q.trim().toLowerCase();
                  if (!term) return true;
                  const aName = articles.find((a) => a.id === e.article_id)?.name ?? "";
                  return (
                    String(e.id).includes(term) ||
                    aName.toLowerCase().includes(term)
                  );
                })
                .filter((e) => (caseEquipment === "" ? true : e.id !== Number(caseEquipment)))
                .filter((e) => !selectedIds.includes(e.id))
                .slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize)
                .map((e) => {
                  const aName = articles.find((a) => a.id === e.article_id)?.name ?? (e.article_id ? `#${e.article_id}` : "—");
                  const checked = selectedIds.includes(e.id);
                  return (
                    <tr key={e.id} className="odd:bg-background even:bg-muted/20">
                      <td className="px-2 py-2 border-t align-top">
                        <input type="checkbox" checked={checked} onChange={() => toggle(e.id)} />
                      </td>
                      <td className="px-2 py-2 border-t align-top">{e.id}</td>
                      <td className="px-2 py-2 border-t align-top">{aName}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
        <div className="mt-2 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Seite {page}</span>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Zurück</Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setPage((p) => p + 1)}>Weiter</Button>
          </div>
        </div>
      </div>
      <div className="grid gap-2">
        <Label>Artikel (ungetrackt) hinzufügen</Label>
        <div className="flex items-center gap-2">
          <select
            className="h-9 rounded-md border bg-background px-3 text-sm"
            value={articleId}
            onChange={(e) => setArticleId(e.target.value === "" ? "" : Number(e.target.value))}
          >
            <option value="">— Artikel wählen —</option>
            {articles.map((a) => (
              <option key={a.id} value={a.id}>{a.name ?? `#${a.id}`}</option>
            ))}
          </select>
          <input
            className="h-9 w-24 rounded-md border bg-background px-3 text-sm"
            type="number"
            min={1}
            value={articleAmount}
            onChange={(e) => setArticleAmount(Math.max(1, Number(e.target.value) || 1))}
          />
          <Button type="button" variant="outline" onClick={addArticleItem}>Hinzufügen</Button>
        </div>
        {articleItems.length > 0 && (
          <div className="overflow-x-auto border rounded-md">
            <table className="w-full border-collapse text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left font-medium px-3 py-2 border-b">Artikel</th>
                  <th className="text-left font-medium px-3 py-2 border-b">Menge</th>
                </tr>
              </thead>
              <tbody>
                {articleItems.map((it) => (
                  <tr key={it.article_id} className="odd:bg-background even:bg-muted/20">
                    <td className="px-3 py-2 border-t">{articles.find((a) => a.id === it.article_id)?.name ?? `#${it.article_id}`}</td>
                    <td className="px-3 py-2 border-t">{it.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="asset_tag_template">Asset Tag Template</Label>
        <select
          id="asset_tag_template"
          className="h-9 rounded-md border bg-background px-3 text-sm"
          value={assetTagTemplateId}
          onChange={(e) => setAssetTagTemplateId(e.target.value === "" ? "" : Number(e.target.value))}
        >
          <option value="">— Keins —</option>
          {assetTagTemplates.map((t) => (
            <option key={t.id} value={t.id}>{`Template #${t.id}`}</option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={saving}>{saving ? "Erstellen…" : "Erstellen"}</Button>
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>
    </form>
  );
}
