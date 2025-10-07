"use client";

import { EquipmentTable } from "@/components/equipmentTable";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { QrScannerModal } from "@/components/camera/qr-scanner-modal";
import { useQrScanner } from "@/components/camera/use-qr-scanner";
import { createClient } from "@/lib/supabase/client";
import { Plus, AlertCircle, CheckCircle2 } from "lucide-react";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";

export default function EquipmentsPage() {
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
      
      // Look up equipment by asset tag printed_code
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

      // Find equipment with this asset tag
      const { data: equipment, error: equipmentError } = await supabase
        .from('equipments')
        .select('id')
        .eq('asset_tag', assetTag.id)
        .single();

      if (equipmentError || !equipment) {
        setScanStatus({
          type: 'error',
          message: `Kein Equipment mit Asset-Tag "${scannedCode}" gefunden.`
        });
        return;
      }

      setScanStatus({
        type: 'success',
        message: `Equipment #${equipment.id} gefunden!`
      });

      // Navigate to equipment details after a short delay
      setTimeout(() => {
        router.push(`/management/equipments/${equipment.id}`);
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
    <main className="min-h-screen w-full flex flex-col items-center px-3 py-4 sm:px-5 sm:py-6">
      <div className="w-full max-w-none flex-1 flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-semibold">Equipments</h1>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <Button asChild className="w-full sm:w-auto">
              <Link
                href="/management/equipments/new"
                className="flex w-full items-center justify-center gap-2 sm:w-auto sm:justify-start"
              >
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

        <EquipmentTable
          pageSize={10}
          className="-mx-3 rounded-none border-x-0 sm:mx-0 sm:rounded-xl"
          onScanClick={openScanner}
        />
      </div>

      {/* QR Scanner Modal */}
      <QrScannerModal
        isOpen={isOpen}
        onClose={closeScanner}
        onScanResult={combinedScanHandler}
        title="Equipment Asset-Tag scannen"
        description="Scanne den QR-Code oder Barcode auf dem Asset-Tag, um das Equipment zu finden"
      />
    </main>
  );
}
