"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Component for importing company data from a JSON export file.
 * 
 * Displays a file picker that accepts JSON files and imports them via the
 * /api/company/import-company endpoint. Shows status messages during import
 * and redirects to the management dashboard on success.
 */
export function CompanyImportForm() {
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportStatus("Lese Datei…");
    setError(null);

    try {
      const text = await file.text();
      const companyData = JSON.parse(text);
      
      setImportStatus("Importiere Company…");
      
      const res = await fetch("/api/company/import-company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(companyData),
      });

      const result = await res.json();

      if (!res.ok) {
        setImportStatus(null);
        setError(`Import fehlgeschlagen: ${result.error ?? res.status}`);
        setImporting(false);
        return;
      }

      setImportStatus(`✓ Erfolgreich importiert: ${result.company.name}`);
      setImporting(false);
      
      // Reload after 2 seconds to show new company
      setTimeout(() => {
        window.location.href = "/management";
      }, 2000);

    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      setError(`Import fehlgeschlagen: ${message}`);
      setImportStatus(null);
      setImporting(false);
    }

    // Reset file input
    e.target.value = "";
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Company Import</CardTitle>
        <CardDescription>
          Importiere eine exportierte Company aus einer JSON-Datei
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="company-import">JSON-Datei auswählen</Label>
          <Input
            id="company-import"
            type="file"
            accept="application/json,.json"
            onChange={handleImport}
            disabled={importing}
          />
          <p className="text-xs text-muted-foreground">
            Lade eine JSON-Datei hoch, die du über den Company-Export heruntergeladen hast.
            Die Company wird als neue Company importiert und du wirst als Eigentümer eingetragen.
          </p>
        </div>
        
        {importStatus && (
          <div className="text-sm text-green-600">
            {importStatus}
          </div>
        )}
        
        {error && (
          <div className="text-sm text-red-600">
            {error}
          </div>
        )}
        
        {importing && (
          <div className="text-sm text-muted-foreground">
            Importiere... Dies kann einen Moment dauern.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
