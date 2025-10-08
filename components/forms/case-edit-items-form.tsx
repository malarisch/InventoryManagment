"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Tables, Json } from "@/database.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { EquipmentMobileCard } from "@/components/equipment-mobile-card";
import { X } from "lucide-react";

type Equipment = Tables<"equipments"> & { 
  articles?: { name: string } | null;
  asset_tags?: { printed_code: string | null } | null;
  current_location_location?: { id: number; name: string | null } | null;
};
type Article = Tables<"articles">;

export function CaseEditItemsForm({
  caseId,
  initialEquipments,
  initialArticles,
  caseEquipmentId,
  initialName,
  initialDescription,
}: {
  caseId: number;
  initialEquipments: number[] | null;
  initialArticles: Array<{ article_id?: number; amount?: number }> | null;
  caseEquipmentId: number | null;
  initialName: string | null;
  initialDescription: string | null;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [equipments, setEquipments] = useState<number[]>(() => initialEquipments ?? []);
  const [articleItems, setArticleItems] = useState<Array<{ article_id: number; amount: number }>>(
    () => (initialArticles?.map((x) => ({ article_id: Number(x.article_id), amount: Number(x.amount) || 0 })) ?? []).filter((x) => !Number.isNaN(x.article_id))
  );
  const [allEquipments, setAllEquipments] = useState<Equipment[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [addingArticleId, setAddingArticleId] = useState<number | "">("");
  const [addingAmount, setAddingAmount] = useState<number>(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [name, setName] = useState<string>(initialName ?? "");
  const [description, setDescription] = useState<string>(initialDescription ?? "");
  const [caseEquipment, setCaseEquipment] = useState<number | null>(caseEquipmentId);

  useEffect(() => {
    let active = true;
    async function load() {
      const [{ data: eqData }, { data: artData }] = await Promise.all([
        supabase
          .from("equipments")
          .select("*, articles(name), asset_tags:asset_tag(printed_code), current_location_location:current_location(id,name)")
          .order("created_at", { ascending: false })
          .limit(500),
        supabase.from("articles").select("id,name").order("name"),
      ]);
      if (!active) return;
      setAllEquipments((eqData as Equipment[] | null) ?? []);
      setArticles((artData as Article[] | null) ?? []);
    }
    load();
    return () => {
      active = false;
    };
  }, [supabase]);

  async function updateEquipments(next: number[]) {
    setSaving(true);
    setError(null);
    setMessage(null);
    const { error } = await supabase
      .from("cases")
      .update({ contains_equipments: next.length ? next : null })
      .eq("id", caseId);
    if (error) setError(error.message); else setMessage("Equipments aktualisiert.");
    setSaving(false);
  }

  async function updateArticles(next: Array<{ article_id: number; amount: number }>) {
    setSaving(true);
    setError(null);
    setMessage(null);
    const payload = next.length ? (next as unknown as Json[]) : null;
    const { error } = await supabase
      .from("cases")
      .update({ contains_articles: payload })
      .eq("id", caseId);
    if (error) setError(error.message); else setMessage("Artikel aktualisiert.");
    setSaving(false);
  }

  async function updateCaseEquipment(nextEqId: number | null) {
    setSaving(true);
    setError(null);
    setMessage(null);
    const { error } = await supabase
      .from("cases")
      .update({ case_equipment: nextEqId })
      .eq("id", caseId);
    if (error) setError(error.message); else setMessage("Case-Equipment aktualisiert.");
    setSaving(false);
  }

  const eqInCase = useMemo(() => new Set(equipments), [equipments]);
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return allEquipments;
    return allEquipments.filter((e) => {
      const name = e.articles?.name?.toLowerCase() ?? "";
      return String(e.id).includes(term) || name.includes(term);
    });
  }, [q, allEquipments]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Basic Info Card */}
      <Card className="lg:col-span-4">
        <CardHeader>
          <CardTitle>Basisdaten</CardTitle>
          <CardDescription>Name und Beschreibung des Cases</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2">
            <Label htmlFor="title">Titel</Label>
            <Input id="title" value={name} onChange={(e) => setName(e.target.value)} placeholder="z. B. FOH Case" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="desc">Beschreibung</Label>
            <Input id="desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="optional" />
          </div>
          <div>
            <Button
              type="button"
              onClick={async () => {
                setSaving(true);
                setError(null);
                setMessage(null);
                const { error } = await supabase
                  .from("cases")
                  .update({ name: name.trim() || null, description: description.trim() || null })
                  .eq("id", caseId);
                if (error) setError(error.message); else setMessage("Titel/Beschreibung gespeichert.");
                setSaving(false);
              }}
            >Speichern</Button>
          </div>
        </CardContent>
      </Card>

      {/* Case Equipment Card */}
      <Card className="lg:col-span-4">
        <CardHeader>
          <CardTitle>Case-Equipment</CardTitle>
          <CardDescription>
            Das physische Equipment, das als Case dient. Der Standort des Cases entspricht immer dem Standort dieses Equipments.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {caseEquipment && (
            <div className="text-sm space-y-1">
              <div className="font-medium">Aktuelles Case-Equipment:</div>
              <div className="flex items-center gap-2">
                <Link href={`/management/equipments/${caseEquipment}`} className="text-blue-600 hover:underline">
                  #{caseEquipment} • {allEquipments.find((x) => x.id === caseEquipment)?.articles?.name ?? "—"}
                </Link>
              </div>
            </div>
          )}
          <div className="grid gap-2">
            <Label htmlFor="case_equipment">Case-Equipment ändern</Label>
            <select
              id="case_equipment"
              className="h-9 rounded-md border bg-background px-3 text-sm"
              value={caseEquipment ?? ""}
              onChange={(e) => {
                const val = e.target.value === "" ? null : Number(e.target.value);
                setCaseEquipment(val);
                void updateCaseEquipment(val);
              }}
            >
              <option value="">— Kein Case-Equipment —</option>
              {allEquipments
                .filter((e) => !eqInCase.has(e.id))
                .map((e) => (
                  <option key={e.id} value={e.id}>
                    #{e.id} • {e.articles?.name ?? "—"}
                  </option>
                ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Equipments in Case Card */}
      <Card className="lg:col-span-8">
        <CardHeader>
          <CardTitle>Equipments im Case</CardTitle>
          <CardDescription>
            {equipments.length > 0
              ? `${equipments.length} Equipment${equipments.length === 1 ? '' : 's'} im Case`
              : 'Keine Equipments im Case'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {equipments.length > 0 ? (
            <>
              {/* Mobile view: Cards */}
              <div className="space-y-2.5 sm:hidden">
                {equipments.map((id) => {
                  const eq = allEquipments.find((x) => x.id === id);
                  if (!eq) return null;
                  return (
                    <EquipmentMobileCard
                      key={id}
                      equipment={eq}
                      showFooter={false}
                      actions={
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            const next = equipments.filter((x) => x !== id);
                            setEquipments(next);
                            void updateEquipments(next);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      }
                    />
                  );
                })}
              </div>
              
              {/* Desktop view: Table */}
              <div className="hidden sm:block overflow-x-auto rounded border">
                <table className="w-full border-collapse text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left font-medium px-3 py-2 border-b">ID</th>
                      <th className="text-left font-medium px-3 py-2 border-b">Artikel</th>
                      <th className="px-3 py-2 border-b"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {equipments.map((id) => {
                      const eq = allEquipments.find((x) => x.id === id);
                      const articleName = eq?.articles?.name ?? "—";
                      return (
                        <tr key={id} className="odd:bg-background even:bg-muted/20">
                          <td className="px-3 py-2 border-t">
                            <Link href={`/management/equipments/${id}`} className="text-blue-600 hover:underline">
                              #{id}
                            </Link>
                          </td>
                          <td className="px-3 py-2 border-t">{articleName}</td>
                          <td className="px-3 py-2 border-t text-right">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const next = equipments.filter((x) => x !== id);
                                setEquipments(next);
                                void updateEquipments(next);
                              }}
                            >Entfernen</Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="text-sm text-muted-foreground">Keine Equipments im Case.</div>
          )}

          <div className="space-y-2 pt-2">
            <div className="text-sm font-medium">Equipments hinzufügen</div>
            <div className="flex items-center gap-2">
              <Input className="w-64" placeholder="Suche (ID oder Artikelname)" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            
            {/* Mobile view: Cards */}
            <div className="space-y-2.5 sm:hidden max-h-72 overflow-y-auto">
              {filtered
                .filter((e) => !eqInCase.has(e.id))
                .filter((e) => (caseEquipment ? e.id !== caseEquipment : true))
                .slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize)
                .map((e) => (
                  <EquipmentMobileCard
                    key={e.id}
                    equipment={e}
                    showFooter={false}
                    actions={
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          const next = [...equipments, e.id];
                          setEquipments(next);
                          void updateEquipments(next);
                        }}
                      >
                        Hinzufügen
                      </Button>
                    }
                  />
                ))}
            </div>

            {/* Desktop view: Table */}
            <div className="hidden sm:block overflow-x-auto rounded border max-h-72">
              <table className="w-full border-collapse text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left font-medium px-2 py-2 border-b">ID</th>
                    <th className="text-left font-medium px-2 py-2 border-b">Artikel</th>
                    <th className="px-2 py-2 border-b"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered
                    .filter((e) => !eqInCase.has(e.id))
                    .filter((e) => (caseEquipment ? e.id !== caseEquipment : true))
                    .slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize)
                    .map((e) => (
                      <tr key={e.id} className="odd:bg-background even:bg-muted/20">
                        <td className="px-2 py-2 border-t">{e.id}</td>
                        <td className="px-2 py-2 border-t">{e.articles?.name ?? "—"}</td>
                        <td className="px-2 py-2 border-t text-right">
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => {
                              const next = [...equipments, e.id];
                              setEquipments(next);
                              void updateEquipments(next);
                            }}
                          >Hinzufügen</Button>
                        </td>
                      </tr>
                    ))}
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
        </CardContent>
      </Card>

      {/* Untracked Articles Card */}
      <Card className="lg:col-span-8">
        <CardHeader>
          <CardTitle>Ungetrackte Artikel</CardTitle>
          <CardDescription>
            {articleItems.length > 0
              ? `${articleItems.length} Artikel${articleItems.length === 1 ? '' : ''} im Case`
              : 'Keine ungetrackten Artikel'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {articleItems.length > 0 ? (
            <div className="overflow-x-auto rounded border">
              <table className="w-full border-collapse text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left font-medium px-3 py-2 border-b">Artikel</th>
                    <th className="text-left font-medium px-3 py-2 border-b">Menge</th>
                    <th className="px-3 py-2 border-b"></th>
                  </tr>
                </thead>
                <tbody>
                  {articleItems.map((it, idx) => (
                    <tr key={`${it.article_id}-${idx}`} className="odd:bg-background even:bg-muted/20">
                      <td className="px-3 py-2 border-t">
                        <Link href={`/management/articles/${it.article_id}`} className="text-blue-600 hover:underline">
                          {articles.find((a) => a.id === it.article_id)?.name ?? `#${it.article_id}`}
                        </Link>
                      </td>
                      <td className="px-3 py-2 border-t">{it.amount}</td>
                      <td className="px-3 py-2 border-t text-right">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const next = articleItems.filter((_, i) => i !== idx);
                            setArticleItems(next);
                            void updateArticles(next);
                          }}
                        >Entfernen</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">Keine ungetrackten Artikel.</div>
          )}

          <div className="space-y-2 pt-2">
            <div className="text-sm font-medium">Artikel hinzufügen</div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                className="h-9 rounded-md border bg-background px-3 text-sm"
                value={addingArticleId}
                onChange={(e) => setAddingArticleId(e.target.value === "" ? "" : Number(e.target.value))}
              >
                <option value="">— Artikel wählen —</option>
                {articles.map((a) => (
                  <option key={a.id} value={a.id}>{a.name ?? `#${a.id}`}</option>
                ))}
              </select>
              <Input className="w-24" type="number" min={1} value={String(addingAmount)} onChange={(e) => setAddingAmount(Math.max(1, Number(e.target.value) || 1))} />
              <Button
                type="button"
                onClick={() => {
                  if (addingArticleId === "") return;
                  const id = Number(addingArticleId);
                  const existing = articleItems.find((x) => x.article_id === id);
                  let next: Array<{ article_id: number; amount: number }>;
                  if (existing) {
                    next = articleItems.map((x) => x.article_id === id ? { ...x, amount: x.amount + addingAmount } : x);
                  } else {
                    next = [...articleItems, { article_id: id, amount: addingAmount }];
                  }
                  setArticleItems(next);
                  void updateArticles(next);
                  setAddingArticleId("");
                  setAddingAmount(1);
                }}
              >Hinzufügen</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Messages */}
      <div className="lg:col-span-12 flex items-center gap-3 text-sm">
        {saving && <span className="text-muted-foreground">Speichert…</span>}
        {message && <span className="text-green-600">{message}</span>}
        {error && <span className="text-red-600">{error}</span>}
      </div>
    </div>
  );
}
