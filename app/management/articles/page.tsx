"use client";

import { ArticleTable } from "@/components/articleTable";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { QrScannerModal } from "@/components/camera/qr-scanner-modal";
import { useQrScanner } from "@/components/camera/use-qr-scanner";
import { createClient } from "@/lib/supabase/client";
import { Camera, Plus, AlertCircle, CheckCircle2 } from "lucide-react";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";

export default function ArticlesPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const { isOpen, openScanner, closeScanner, handleScanResult } = useQrScanner();
  const [scanStatus, setScanStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  const handleAssetTagScan = async (scannedCode: string) => {
    try {
      setScanStatus({ type: null, message: '' });
      
      // Look up article by asset tag printed_code
      const { data: assetTag, error: assetError } = await supabase
        .from('asset_tags')
        .select('id')
        .eq('printed_code', scannedCode)
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

  return (
    <main className="min-h-screen w-full flex flex-col items-center p-5">
      <div className="w-full max-w-5xl flex-1 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Articles</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={openScanner} className="flex items-center gap-2">
              <Camera className="w-4 h-4" />
              Asset-Tag scannen
            </Button>
            <Button asChild>
              <Link href="/management/articles/new" className="flex items-center gap-2">
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

        <ArticleTable pageSize={10} />
      </div>

      {/* QR Scanner Modal */}
      <QrScannerModal
        isOpen={isOpen}
        onClose={closeScanner}
        onScanResult={combinedScanHandler}
        title="Artikel Asset-Tag scannen"
        description="Scanne den QR-Code oder Barcode auf dem Asset-Tag, um den Artikel zu finden"
      />
    </main>
  );
}
