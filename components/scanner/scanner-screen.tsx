"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { FullscreenScanner, type AssignmentInfo } from "@/components/scanner/fullscreen-scanner";
import { resolveAssetByCode, type ResolvedAsset } from "@/lib/scanner/resolve";
import { performScannerAction, type ScannerMode, type ScannerActionResult } from "@/lib/scanner/actions";
import { cn } from "@/lib/utils";
import { ArrowLeft, MapPin, Scan, ClipboardList, PackageCheck, CheckCircle2, AlertTriangle, Info, Search } from "lucide-react";
import type { Tables } from "@/database.types";

type LocationLite = Pick<Tables<"locations">, "id" | "name" | "company_id">;

type JobLite = { id: number; companyId: number; name: string | null };

type StatusEntry = {
  id: string;
  code: string;
  status: "success" | "error" | "info";
  message: string;
  timestamp: number;
  link?: { href: string; label: string };
};

const MODE_DEFINITIONS: Array<{ mode: ScannerMode; label: string; description: string; icon: React.ComponentType<{ className?: string }> }> = [
  { mode: "lookup", label: "Suchen", description: "Asset-Tag scannen und Objekt öffnen", icon: Scan },
  { mode: "assign-location", label: "Standort", description: "Equipments, Cases oder Artikel auf einen Standort buchen", icon: MapPin },
  { mode: "job-book", label: "Job buchen", description: "Equipments/Cases für einen Job reservieren", icon: ClipboardList },
  { mode: "job-pack", label: "Job packen", description: "Assets als eingeladen/verpackt markieren", icon: PackageCheck },
];

function randomId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

interface ScannerScreenProps {
  initialMode?: ScannerMode;
  initialLocation?: { id: number; name: string | null; companyId: number } | null;
  initialJob?: { id: number; name: string | null; companyId: number } | null;
}

export function ScannerScreen({ initialMode, initialLocation, initialJob }: ScannerScreenProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [mode, setMode] = useState<ScannerMode | null>(initialMode ?? null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [statusFeed, setStatusFeed] = useState<StatusEntry[]>([]);
  const [assignmentInfo, setAssignmentInfo] = useState<AssignmentInfo | null>(null);
  const [targetLocation, setTargetLocation] = useState<{ id: number; name: string | null; companyId: number } | null>(initialLocation ?? null);
  const [targetCase, setTargetCase] = useState<{ id: number; name?: string; companyId: number } | null>(null);
  const job = useMemo<JobLite | null>(
    () => (initialJob ? { id: initialJob.id, companyId: initialJob.companyId, name: initialJob.name ?? null } : null),
    [initialJob],
  );
  const [locationPickerOpen, setLocationPickerOpen] = useState(false);
  const [locationOptions, setLocationOptions] = useState<LocationLite[]>([]);
  const [locationSearch, setLocationSearch] = useState("");
  const [loadingLocations, setLoadingLocations] = useState(false);

  const pushStatus = useCallback((entry: Omit<StatusEntry, "id" | "timestamp">) => {
    const full: StatusEntry = { id: randomId(), timestamp: Date.now(), ...entry };
    setStatusFeed((prev) => [full, ...prev].slice(0, 25));
  }, []);

  const ensureLocation = useCallback(() => {
    if (!targetLocation) {
      pushStatus({ status: "error", message: "Kein Standort gewählt.", code: "—" });
      setLocationPickerOpen(true);
      return false;
    }
    return true;
  }, [targetLocation, pushStatus]);

  const ensureJob = useCallback(() => {
    if (!job) {
      pushStatus({ status: "error", message: "Kein Job ausgewählt. Bitte aus Job-Detailseite öffnen.", code: "—" });
      return false;
    }
    return true;
  }, [job, pushStatus]);

  const addResultToFeed = useCallback(
    (code: string, resolved: ResolvedAsset, result: ScannerActionResult) => {
      const entry: Omit<StatusEntry, "id" | "timestamp"> = {
        code,
        status: result.status,
        message: result.message,
      };

      if (resolved.kind === "equipment") {
        entry.link = { href: `/management/equipments/${resolved.equipment.id}`, label: `Equipment #${resolved.equipment.id}` };
      } else if (resolved.kind === "case") {
        entry.link = { href: `/management/cases/${resolved.case.id}`, label: `Case #${resolved.case.id}` };
      } else if (resolved.kind === "article") {
        entry.link = { href: `/management/articles/${resolved.article.id}`, label: `Artikel #${resolved.article.id}` };
      } else if (resolved.kind === "location") {
        entry.link = { href: `/management/locations/${resolved.location.id}`, label: `Standort #${resolved.location.id}` };
      }

      pushStatus(entry);
    },
    [pushStatus],
  );

  const loadLocations = useCallback(async () => {
    setLoadingLocations(true);
    const { data, error } = await supabase
      .from("locations")
      .select("id, name, company_id")
      .order("name", { ascending: true })
      .limit(200);
    if (!error && Array.isArray(data)) {
      setLocationOptions(data as LocationLite[]);
    }
    setLoadingLocations(false);
  }, [supabase]);

  useEffect(() => {
    if (locationPickerOpen && locationOptions.length === 0) {
      void loadLocations();
    }
  }, [locationPickerOpen, locationOptions.length, loadLocations]);

  const filteredLocations = locationOptions.filter((location) => {
    const term = locationSearch.trim().toLowerCase();
    if (!term) return true;
    const name = location.name?.toLowerCase() ?? "";
    return name.includes(term) || String(location.id).includes(term);
  });

  const handleScan = useCallback(
    async (code: string) => {
      const activeMode = mode;
      if (!activeMode) {
        pushStatus({ status: "info", message: "Bitte einen Modus auswählen.", code });
        return;
      }

      try {
        const resolved = await resolveAssetByCode(supabase, code);

        if (resolved.kind === "not-found") {
          pushStatus({ status: "error", message: "Asset-Tag nicht gefunden.", code });
          return;
        }

        // Lookup-Modus: Direkt zur Edit-Seite navigieren
        if (activeMode === "lookup") {
          if (resolved.kind === "equipment") {
            router.push(`/management/equipments/${resolved.equipment.id}`);
          } else if (resolved.kind === "case") {
            router.push(`/management/cases/${resolved.case.id}`);
          } else if (resolved.kind === "article") {
            router.push(`/management/articles/${resolved.article.id}`);
          } else if (resolved.kind === "location") {
            router.push(`/management/locations/${resolved.location.id}`);
          }
          return;
        }

        if (activeMode === "assign-location") {
          // Case als Ziel scannen (allererster Scan)
          if (resolved.kind === "case") {
            setTargetCase({ id: resolved.case.id, companyId: resolved.companyId });
            setTargetLocation(null); // Clear location when case is selected
            pushStatus({
              status: "info",
              message: `Ziel-Case auf Case #${resolved.case.id} gesetzt. Scanne jetzt Equipment um es ins Case zu packen.`,
              code,
              link: { href: `/management/cases/${resolved.case.id}`, label: "Case öffnen" },
            });
            return;
          }

          // Location als Ziel scannen
          if (resolved.kind === "location") {
            setTargetLocation({ id: resolved.location.id, name: resolved.location.name ?? null, companyId: resolved.companyId });
            setTargetCase(null); // Clear case when location is selected
            pushStatus({
              status: "info",
              message: `Zielstandort auf ${resolved.location.name ?? `#${resolved.location.id}`} gesetzt.`,
              code,
              link: { href: `/management/locations/${resolved.location.id}`, label: "Standort öffnen" },
            });
            return;
          }

          // Equipment ins Case packen
          if (targetCase && resolved.kind === "equipment") {
            if (resolved.companyId !== targetCase.companyId) {
              pushStatus({
                status: "error",
                message: "Equipment gehört zu einer anderen Company als das Ziel-Case.",
                code,
              });
              return;
            }

            // Fetch current case data to get contained_equipment array
            const { data: caseData, error: caseError } = await supabase
              .from("cases")
              .select("contained_equipment")
              .eq("id", targetCase.id)
              .single();

            if (caseError || !caseData) {
              pushStatus({
                status: "error",
                message: "Case konnte nicht geladen werden.",
                code,
              });
              return;
            }

            const currentContained = Array.isArray(caseData.contained_equipment) ? caseData.contained_equipment : [];
            
            // Check if equipment is already in case
            if (currentContained.includes(resolved.equipment.id)) {
              pushStatus({
                status: "info",
                message: `Equipment #${resolved.equipment.id} ist bereits in Case #${targetCase.id}.`,
                code,
                link: { href: `/management/equipments/${resolved.equipment.id}`, label: `Equipment #${resolved.equipment.id}` },
              });
              return;
            }

            // Add equipment to case and null its location
            const { error: updateError } = await supabase
              .from("cases")
              .update({ contained_equipment: [...currentContained, resolved.equipment.id] })
              .eq("id", targetCase.id);

            if (updateError) {
              pushStatus({
                status: "error",
                message: updateError.message || "Equipment konnte nicht zum Case hinzugefügt werden.",
                code,
              });
              return;
            }

            // Null the equipment's location (it's now in the case)
            const { error: equipError } = await supabase
              .from("equipments")
              .update({ current_location: null })
              .eq("id", resolved.equipment.id);

            if (equipError) {
              pushStatus({
                status: "error",
                message: equipError.message || "Equipment-Standort konnte nicht aktualisiert werden.",
                code,
              });
              return;
            }

            pushStatus({
              status: "success",
              message: `Equipment #${resolved.equipment.id} wurde in Case #${targetCase.id} gepackt.`,
              code,
              link: { href: `/management/equipments/${resolved.equipment.id}`, label: `Equipment #${resolved.equipment.id}` },
            });

            // Set assignment info for undo functionality
            setAssignmentInfo({
              entityType: "equipment",
              entityId: resolved.equipment.id,
              previousLocationId: resolved.equipment.current_location,
              newLocationId: targetCase.id, // Use case ID as "location" for tracking
              newLocationName: `Case #${targetCase.id}`,
            });

            return;
          }

          // Regular location assignment
          if (!ensureLocation()) return;
          if (targetLocation && resolved.companyId !== targetLocation.companyId) {
            pushStatus({
              status: "error",
              message: "Objekt gehört zu einer anderen Company als der Zielstandort.",
              code,
            });
            return;
          }
        }

        if ((activeMode === "job-book" || activeMode === "job-pack") && !ensureJob()) {
          return;
        }

        const result = await performScannerAction({
          supabase,
          mode: activeMode,
          resolved,
          targetLocationId: targetLocation?.id,
          targetLocationName: targetLocation?.name ?? undefined,
          jobId: job?.id,
          jobName: job?.name ?? null,
          jobCompanyId: job?.companyId,
        });

        addResultToFeed(code, resolved, result);

        // Track location assignments for feedback toast
        if (activeMode === "assign-location" && result.status === "success" && targetLocation) {
          if (resolved.kind === "equipment") {
            setAssignmentInfo({
              entityType: "equipment",
              entityId: resolved.equipment.id,
              previousLocationId: resolved.equipment.current_location,
              newLocationId: targetLocation.id,
              newLocationName: targetLocation.name ?? undefined,
            });
          } else if (resolved.kind === "case" && resolved.case.case_equipment) {
            setAssignmentInfo({
              entityType: "case",
              entityId: resolved.case.id,
              previousLocationId: resolved.case.case_equipment_equipment?.current_location ?? null,
              newLocationId: targetLocation.id,
              newLocationName: targetLocation.name ?? undefined,
            });
          } else if (resolved.kind === "article") {
            setAssignmentInfo({
              entityType: "article",
              entityId: resolved.article.id,
              previousLocationId: resolved.article.default_location,
              newLocationId: targetLocation.id,
              newLocationName: targetLocation.name ?? undefined,
            });
          }
        }
      } catch (err) {
        console.error("Scanner failure", err);
        pushStatus({
          status: "error",
          message: err instanceof Error ? err.message : "Unbekannter Fehler beim Verarbeiten.",
          code,
        });
      }
    },
    [mode, supabase, ensureLocation, ensureJob, targetLocation, targetCase, job, pushStatus, addResultToFeed, router],
  );

  const handleUndo = useCallback(
    async (info: AssignmentInfo) => {
      try {
        if (info.entityType === "equipment") {
          // Check if newLocationName indicates a case (starts with "Case #")
          const isPackedInCase = info.newLocationName?.startsWith("Case #");
          
          if (isPackedInCase) {
            // Extract case ID from newLocationId (we stored case ID there)
            const caseId = info.newLocationId;
            
            // Remove equipment from case's contained_equipment array
            const { data: caseData, error: fetchError } = await supabase
              .from("cases")
              .select("contained_equipment")
              .eq("id", caseId)
              .single();

            if (fetchError) throw fetchError;

            const currentContained = Array.isArray(caseData.contained_equipment) ? caseData.contained_equipment : [];
            const updatedContained = currentContained.filter((id) => id !== info.entityId);

            const { error: updateCaseError } = await supabase
              .from("cases")
              .update({ contained_equipment: updatedContained })
              .eq("id", caseId);

            if (updateCaseError) throw updateCaseError;
          }

          // Restore previous location
          const { error } = await supabase
            .from("equipments")
            .update({ current_location: info.previousLocationId })
            .eq("id", info.entityId);
          if (error) throw error;
        } else if (info.entityType === "case") {
          // For cases, we need to get the case_equipment ID first
          const { data: caseData } = await supabase
            .from("cases")
            .select("case_equipment")
            .eq("id", info.entityId)
            .single();
          if (caseData?.case_equipment) {
            const { error } = await supabase
              .from("equipments")
              .update({ current_location: info.previousLocationId })
              .eq("id", caseData.case_equipment);
            if (error) throw error;
          }
        } else if (info.entityType === "article") {
          const { error } = await supabase
            .from("articles")
            .update({ default_location: info.previousLocationId })
            .eq("id", info.entityId);
          if (error) throw error;
        }
        
        pushStatus({
          status: "info",
          message: "Standortzuweisung rückgängig gemacht.",
          code: "—",
        });
        setAssignmentInfo(null);
      } catch (err) {
        console.error("Undo failed", err);
        pushStatus({
          status: "error",
          message: err instanceof Error ? err.message : "Rückgängig machen fehlgeschlagen.",
          code: "—",
        });
      }
    },
    [supabase, pushStatus],
  );

  const activeModeDefinition = MODE_DEFINITIONS.find((entry) => entry.mode === mode) ?? null;

  return (
    <div className="flex min-h-[100dvh] flex-col gap-4 pb-6">
      <header className="flex items-center justify-between">
        <Button variant="ghost" className="-ml-2 flex items-center gap-2" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
          Zurück
        </Button>
        {mode ? (
          <Badge variant="outline" className="text-base font-medium">
            {activeModeDefinition?.label}
          </Badge>
        ) : (
          <Badge variant="secondary" className="text-base font-medium">
            Modus wählen
          </Badge>
        )}
      </header>

      <section className="space-y-3">
        <h1 className="text-2xl font-semibold">Kameramodus</h1>
        <p className="text-sm text-muted-foreground">
          Smartphone-optimierte Ansicht zum Scannen von Asset-Tags.
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          {MODE_DEFINITIONS.map(({ mode: modeKey, label, description, icon: Icon }) => {
            const isActive = mode === modeKey;
            return (
              <Card
                key={modeKey}
                className={cn("cursor-pointer transition", isActive ? "border-primary shadow-lg" : "hover:border-primary/40")}
                onClick={() => setMode(modeKey)}
              >
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Icon className="h-5 w-5" />
                    {label}
                  </CardTitle>
                  {isActive ? <CheckCircle2 className="h-5 w-5 text-primary" /> : null}
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {mode === "assign-location" ? (
        <section className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-medium text-muted-foreground">Zielstandort</div>
              <div className="text-lg font-semibold">
                {targetLocation ? targetLocation.name ?? `Standort #${targetLocation.id}` : "Keiner ausgewählt"}
              </div>
            </div>
            <Button onClick={() => setLocationPickerOpen(true)} variant="outline" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Standort wählen
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Scanne einen Standort-Tag, um ihn direkt auszuwählen, oder nutze die Suche.
          </p>
        </section>
      ) : null}

      {(mode === "job-book" || mode === "job-pack") && job ? (
        <section className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="text-sm font-medium text-muted-foreground">Aktueller Job</div>
          <div className="text-lg font-semibold">{job.name?.trim() ?? `Job #${job.id}`}</div>
          <p className="mt-1 text-xs text-muted-foreground">
            Assets aus anderen Companies werden abgelehnt.
          </p>
        </section>
      ) : null}

      {/* Scanner starten Button */}
      {mode && (
        <section className="mt-6">
          <Button
            size="lg"
            className="w-full h-16 text-lg"
            onClick={() => setScannerOpen(true)}
          >
            <Scan className="mr-2 h-6 w-6" />
            Scannen starten
          </Button>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Verlauf</h2>
        {statusFeed.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            Noch keine Scans. Starte mit dem Kamera-Button.
          </div>
        ) : (
          <div className="space-y-3">
            {statusFeed.map((entry) => {
              const Icon = entry.status === "success" ? CheckCircle2 : entry.status === "error" ? AlertTriangle : Info;
              const timestamp = new Date(entry.timestamp).toLocaleTimeString();
              return (
                <Card key={entry.id} className="border-l-4" style={{ borderLeftColor: entry.status === "success" ? "#16a34a" : entry.status === "error" ? "#dc2626" : "#2563eb" }}>
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-sm">
                          <Icon className={cn("h-4 w-4", entry.status === "success" ? "text-green-600" : entry.status === "error" ? "text-red-600" : "text-blue-600")} />
                          <span className="font-medium">{entry.message}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">Code: {entry.code}</div>
                        <div className="text-xs text-muted-foreground">{timestamp}</div>
                      </div>
                      {entry.link ? (
                        <Button variant="outline" size="sm" onClick={() => router.push(entry.link!.href)}>
                          {entry.link.label}
                        </Button>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <Dialog open={locationPickerOpen} onOpenChange={setLocationPickerOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Standort auswählen</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              autoFocus
              placeholder="Suchen…"
              value={locationSearch}
              onChange={(event) => setLocationSearch(event.target.value)}
            />
            <div className="h-px bg-border" />
            <div className="max-h-80 overflow-y-auto divide-y">
              {loadingLocations ? (
                <div className="p-4 text-sm text-muted-foreground">Lade Standorte…</div>
              ) : filteredLocations.length === 0 ? (
                <div className="p-4 text-sm text-muted-foreground">Keine Treffer.</div>
              ) : (
                filteredLocations.map((location) => (
                  <button
                    key={location.id}
                    type="button"
                    className="flex w-full flex-col items-start gap-1 px-3 py-2 text-left hover:bg-muted"
                    onClick={() => {
                      setTargetLocation({ id: location.id, name: location.name ?? null, companyId: location.company_id });
                      setTargetCase(null); // Clear case when location is manually picked
                      setLocationPickerOpen(false);
                      setLocationSearch("");
                    }}
                  >
                    <span className="text-sm font-medium">{location.name ?? `Standort #${location.id}`}</span>
                    <span className="text-xs text-muted-foreground">ID: {location.id}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Fullscreen Scanner */}
      <FullscreenScanner
        isOpen={scannerOpen}
        onClose={() => {
          setScannerOpen(false);
          setAssignmentInfo(null);
        }}
        onScan={handleScan}
        onUndo={handleUndo}
        assignmentInfo={assignmentInfo}
        title={activeModeDefinition?.label ?? "Scanner"}
        instructions={
          mode === "assign-location"
            ? targetCase
              ? `Ziel-Case: #${targetCase.id} - Scanne Equipment zum Einpacken`
              : targetLocation
                ? `Location: ${targetLocation.name ?? `#${targetLocation.id}`}`
                : "Scanne Location oder Case als Ziel"
            : "Code auf Höhe der Markierung halten"
        }
      />
    </div>
  );
}
