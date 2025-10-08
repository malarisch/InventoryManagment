"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/database.types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EquipmentMobileCard } from "@/components/equipment-mobile-card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil, MousePointerClick } from "lucide-react";

type Equipment = Tables<"equipments"> & {
  articles?: { name: string } | null;
  asset_tags?: { printed_code: string | null } | null;
  current_location_location?: { id: number; name: string | null } | null;
};

interface CaseEquipmentCardProps {
  caseId: number;
  caseEquipment: Equipment | null;
  companyId: number;
  containsEquipments: number[];
}

export function CaseEquipmentCard({ 
  caseId, 
  caseEquipment, 
  companyId,
  containsEquipments
}: CaseEquipmentCardProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [open, setOpen] = useState(false);
  const [allEquipments, setAllEquipments] = useState<Equipment[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<number | null>(caseEquipment?.id ?? null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const eqInCase = useMemo(() => new Set(containsEquipments), [containsEquipments]);

  useEffect(() => {
    if (!open) return;
    let active = true;

    async function loadEquipments() {
      const { data } = await supabase
        .from("equipments")
        .select("*, articles(name), asset_tags:asset_tag(printed_code), current_location_location:current_location(id,name)")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
        .limit(500);

      if (!active) return;
      setAllEquipments((data as Equipment[] | null) ?? []);
    }

    loadEquipments();
    return () => {
      active = false;
    };
  }, [open, supabase, companyId]);

  const filteredEquipments = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    const available = allEquipments.filter((e) => !eqInCase.has(e.id));
    
    if (!term) return available;
    
    return available.filter((e) => {
      const name = e.articles?.name?.toLowerCase() ?? "";
      return String(e.id).includes(term) || name.includes(term);
    });
  }, [searchQuery, allEquipments, eqInCase]);

  async function handleSave() {
    setSaving(true);
    setError(null);

    const { error: updateError } = await supabase
      .from("cases")
      .update({ case_equipment: selectedEquipmentId })
      .eq("id", caseId);

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    // Refresh the page to show updated equipment
    router.refresh();
    setOpen(false);
    setSaving(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {caseEquipment ? (
        <Card className="relative">
          <CardHeader>
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <CardTitle>Case Equipment</CardTitle>
                <CardDescription>
                  Das physische Equipment, das als Case dient. Der Standort des Cases entspricht dem Standort dieses Equipments.
                </CardDescription>
              </div>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon" className="shrink-0">
                  <Pencil className="h-4 w-4" />
                </Button>
              </DialogTrigger>
            </div>
          </CardHeader>
          <CardContent>
            <DialogTrigger asChild>
              <div className="cursor-pointer transition-opacity hover:opacity-80">
                <EquipmentMobileCard
                  equipment={caseEquipment}
                  showFooter={true}
                />
                <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                  <MousePointerClick className="h-3 w-3" />
                  <span>Klicken zum Ändern</span>
                </div>
              </div>
            </DialogTrigger>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <CardTitle>Case Equipment</CardTitle>
                <CardDescription>
                  Kein Case-Equipment zugewiesen. Klicke auf den Button, um ein Equipment als physischen Case zuzuweisen.
                </CardDescription>
              </div>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  Equipment zuweisen
                </Button>
              </DialogTrigger>
            </div>
          </CardHeader>
        </Card>
      )}

      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Case Equipment ändern</DialogTitle>
          <DialogDescription>
            Wähle ein Equipment aus, das als physischer Case dienen soll. Der Standort des Cases wird automatisch vom gewählten Equipment übernommen.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="search">Suche Equipment</Label>
            <Input
              id="search"
              placeholder="ID oder Artikelname..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            <div className="text-sm font-medium text-muted-foreground mb-2">
              {filteredEquipments.length} Equipment{filteredEquipments.length === 1 ? '' : 's'} verfügbar
            </div>
            
            {/* Option to remove case equipment */}
            <div
              className={`rounded-md border p-3 cursor-pointer transition-colors ${
                selectedEquipmentId === null
                  ? "border-primary bg-primary/5"
                  : "hover:bg-muted/50"
              }`}
              onClick={() => setSelectedEquipmentId(null)}
            >
              <div className="text-sm font-medium">Kein Case Equipment</div>
              <div className="text-xs text-muted-foreground">Case-Equipment Zuweisung entfernen</div>
            </div>

            {filteredEquipments.slice(0, 20).map((equipment) => (
              <div
                key={equipment.id}
                className={`rounded-md border transition-colors ${
                  selectedEquipmentId === equipment.id
                    ? "border-primary bg-primary/5"
                    : "hover:bg-muted/50 cursor-pointer"
                }`}
                onClick={() => setSelectedEquipmentId(equipment.id)}
              >
                <div className="p-2">
                  <EquipmentMobileCard
                    equipment={equipment}
                    showFooter={false}
                  />
                </div>
              </div>
            ))}
            
            {filteredEquipments.length > 20 && (
              <div className="text-xs text-muted-foreground text-center py-2">
                ... und {filteredEquipments.length - 20} weitere. Nutze die Suche, um die Ergebnisse einzugrenzen.
              </div>
            )}
          </div>

          {error && (
            <div className="text-sm text-red-600">{error}</div>
          )}

          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
              Abbrechen
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={saving || selectedEquipmentId === (caseEquipment?.id ?? null)}
            >
              {saving ? "Speichert..." : "Speichern"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
