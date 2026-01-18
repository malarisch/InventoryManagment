"use client";

import { ArticleTable } from "@/components/articleTable";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { QrScannerModal } from "@/components/camera/qr-scanner-modal";
import { useQrScanner } from "@/components/camera/use-qr-scanner";
import { createClient } from "@/lib/supabase/client";
import { Plus, AlertCircle, CheckCircle2, Download } from "lucide-react";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useCompany } from "@/app/management/_libs/companyHook";

export default function ArticlesPage() {
  const { company } = useCompany();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const { isOpen, openScanner, closeScanner, handleScanResult } = useQrScanner();
  const [scanStatus, setScanStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });
  const [importOpen, setImportOpen] = useState(false);
  const [importUrl, setImportUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const handleAssetTagScan = async (scannedCode: string) => {
    if (!company) {
      setScanStatus({
        type: 'error',
        message: 'Keine Company ausgewählt.'
      });
      return;
    }

    try {
      setScanStatus({ type: null, message: '' });
      
      // Look up article by asset tag printed_code
      const { data: assetTag, error: assetError } = await supabase
        .from('asset_tags')
        .select('id')
        .eq('printed_code', scannedCode)
        .eq('company_id', company.id)
        .single();

      if (assetError || !assetTag) {
        setScanStatus({
          type: 'error',
          message: `Kein Asset-Tag mit Code "${scannedCode}" gefunden.`
        });
        return;
      }

      // Find article with this asset tag
      const { data: article, error: articleError } = await supabase
        .from('articles')
        .select('id, name')
        .eq('asset_tag', assetTag.id)
        .eq('company_id', company.id)
        .single();

      if (articleError || !article) {
        setScanStatus({
          type: 'error',
          message: `Kein Artikel mit Asset-Tag "${scannedCode}" gefunden.`
        });
        return;
      }

      setScanStatus({
        type: 'success',
        message: `Artikel gefunden: ${article.name || `Artikel #${article.id}`}`
      });

      // Navigate to article details after a short delay
      setTimeout(() => {
        router.push(`/management/articles/${article.id}`);
      }, 1500);

    } catch (error) {
      console.error('Asset tag lookup error:', error);
      setScanStatus({
        type: 'error',
        message: 'Fehler beim Suchen des Asset-Tags. Bitte versuche es erneut.'
      });
    }
  };

  const combinedScanHandler = (scannedCode: string) => {
    handleScanResult(scannedCode);
    handleAssetTagScan(scannedCode);
  };

  const handleImport = async () => {
    setImporting(true);
    setImportError(null);
    try {
      const response = await fetch("/api/articles/import-thomann", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: importUrl }),
      });
      const payload = await response.json().catch(() => ({} as Record<string, unknown>));

      if (!response.ok) {
        const errorMessage = typeof payload.error === "string" && payload.error.length > 0
          ? payload.error
          : "Import fehlgeschlagen.";
        throw new Error(errorMessage);
      }

      const id = (payload as { id?: number }).id;
      if (!id) {
        throw new Error("Artikel konnte nicht erstellt werden.");
      }

      setImportOpen(false);
      setImportUrl("");
      router.push(`/management/articles/${id}`);
    } catch (error) {
      setImportError(error instanceof Error ? error.message : "Unbekannter Fehler beim Import.");
    } finally {
      setImporting(false);
    }
  };

  return (
    <main className="min-h-screen w-full flex flex-col items-center p-5">
      <div className="w-full max-w-none flex-1 flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-semibold">Articles</h1>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <Button variant="secondary" onClick={() => { setImportOpen(true); setImportError(null); }}>
              <Download className="w-4 h-4" />
              Artikel von Thomann importieren
            </Button>
            <Button asChild>
              <Link href="/management/articles/new" className="flex items-center justify-center gap-2 sm:justify-start">
                <Plus className="w-4 h-4" />
                Neu
              </Link>
            </Button>
          </div>
        </div>

        {/* Scan Status */}
        {scanStatus.type && (
          <div className={`p-3 rounded-md border flex items-center gap-2 ${
            scanStatus.type === 'success' 
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
          }`}>
            {scanStatus.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
            )}
            <span className="text-sm">{scanStatus.message}</span>
          </div>
        )}

  <ArticleTable pageSize={10} onScanClick={openScanner} />
      </div>

      {/* QR Scanner Modal */}
      <QrScannerModal
        isOpen={isOpen}
        onClose={closeScanner}
        onScanResult={combinedScanHandler}
        title="Artikel Asset-Tag scannen"
        description="Scanne den QR-Code oder Barcode auf dem Asset-Tag, um den Artikel zu finden"
      />

      <Dialog open={importOpen} onOpenChange={(open) => { setImportOpen(open); if (!open) setImportError(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Artikel von Thomann importieren</DialogTitle>
            <DialogDescription>Gib die Thomann-Produkt-URL ein. Wir holen die Metadaten ab und erstellen einen neuen Artikel.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              value={importUrl}
              onChange={(e) => setImportUrl(e.target.value)}
              placeholder="https://www.thomann.de/de/..."
              autoFocus
            />
            {importError && <p className="text-sm text-red-600">{importError}</p>}
          </div>
          <DialogFooter className="sm:space-x-2">
            <Button variant="outline" onClick={() => setImportOpen(false)} disabled={importing}>Abbrechen</Button>
            <Button onClick={handleImport} disabled={importing || importUrl.trim().length === 0}>
              {importing ? "Importiere…" : "Importieren"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
