"use client";

import { LocationTable } from "@/components/locationTable";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { QrScannerModal } from "@/components/camera/qr-scanner-modal";
import { useQrScanner } from "@/components/camera/use-qr-scanner";
import { createClient } from "@/lib/supabase/client";
import { Plus, AlertCircle, CheckCircle2 } from "lucide-react";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useCompany } from "@/app/management/_libs/companyHook";

export default function LocationsPage() {
  const { company } = useCompany();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const { isOpen, openScanner, closeScanner, handleScanResult } = useQrScanner();
  const [scanStatus, setScanStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

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
      
      // Look up location by asset tag printed_code
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

      // Find location with this asset tag
      const { data: location, error: locationError } = await supabase
        .from('locations')
        .select('id, name')
        .eq('asset_tag', assetTag.id)
        .eq('company_id', company.id)
        .single();

      if (locationError || !location) {
        setScanStatus({
          type: 'error',
          message: `Kein Standort mit Asset-Tag "${scannedCode}" gefunden.`
        });
        return;
      }

      setScanStatus({
        type: 'success',
        message: `Standort gefunden: ${location.name || `Standort #${location.id}`}`
      });

      // Navigate to location details after a short delay
      setTimeout(() => {
        router.push(`/management/locations/${location.id}`);
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
      <div className="w-full max-w-none flex-1 flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-semibold">Standorte</h1>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <Button asChild>
              <Link href="/management/locations/new" className="flex items-center justify-center gap-2 sm:justify-start">
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

  <LocationTable pageSize={10} onScanClick={openScanner} />
      </div>

      {/* QR Scanner Modal */}
      <QrScannerModal
        isOpen={isOpen}
        onClose={closeScanner}
        onScanResult={combinedScanHandler}
        title="Standort Asset-Tag scannen"
        description="Scanne den QR-Code oder Barcode auf dem Asset-Tag, um den Standort zu finden"
      />
    </main>
  );
}
