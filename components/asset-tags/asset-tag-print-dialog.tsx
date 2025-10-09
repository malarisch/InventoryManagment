"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Printer, Bluetooth } from "lucide-react";
import { NiimbotPrinter } from "@/components/asset-tags/niimbot-printer";

export interface AssetTagPrintDialogProps {
  assetTagId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AssetTagPrintDialog({
  assetTagId,
  open,
  onOpenChange,
}: AssetTagPrintDialogProps) {
  const [printMode, setPrintMode] = useState<"select" | "normal" | "niimbot">("select");

  const handleNormalPrint = async () => {
    // Generate printable HTML page with exact template dimensions
    setPrintMode("normal");
    
    try {
      // Fetch asset tag to get template dimensions
      const response = await fetch(`/api/asset-tags/${assetTagId}`);
      if (!response.ok) throw new Error("Failed to load asset tag");
      const assetTagData = await response.json();
      
      const template = assetTagData.printed_template;
      if (!template) {
        throw new Error("No template found");
      }
      
      // Open printable HTML page with exact dimensions
      const printUrl = `/api/asset-tags/${assetTagId}/print?width=${template.tagWidthMm}&height=${template.tagHeightMm}`;
      const pdfWindow = window.open(printUrl, "_blank");
      
      if (pdfWindow) {
        pdfWindow.onload = () => {
          setTimeout(() => {
            pdfWindow.print();
          }, 500);
        };
      }
      
      // Close dialog after opening print window
      setTimeout(() => {
        onOpenChange(false);
      }, 1000);
    } catch (err) {
      console.error("Print failed:", err);
      alert(err instanceof Error ? err.message : "Drucken fehlgeschlagen");
      setPrintMode("select");
    }
  };

  const handleBack = () => {
    setPrintMode("select");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Asset-Tag drucken</DialogTitle>
          <DialogDescription>
            {printMode === "select"
              ? "Wähle eine Druckmethode:"
              : printMode === "normal"
                ? "Drucken über System-Dialog"
                : "Drucken über Niimbot Bluetooth-Drucker"}
          </DialogDescription>
        </DialogHeader>

        {printMode === "select" && (
          <div className="flex flex-col gap-3">
            <Button
              variant="outline"
              className="h-auto flex-col items-start gap-2 p-4 whitespace-normal text-left"
              onClick={handleNormalPrint}
            >
              <div className="flex items-center gap-2">
                <Printer className="h-5 w-5 shrink-0" />
                <span className="font-semibold">Normal drucken</span>
              </div>
              <span className="text-sm text-muted-foreground">
                Asset-Tag als PDF mit exakten Dimensionen öffnen
              </span>
            </Button>

            <Button
              variant="outline"
              className="h-auto flex-col items-start gap-2 p-4 whitespace-normal text-left"
              onClick={() => setPrintMode("niimbot")}
            >
              <div className="flex items-center gap-2">
                <Bluetooth className="h-5 w-5 shrink-0" />
                <span className="font-semibold">Niimbot Bluetooth-Drucker</span>
              </div>
              <span className="text-sm text-muted-foreground">
                Direkt per Bluetooth drucken
              </span>
            </Button>
          </div>
        )}

        {printMode === "niimbot" && (
          <NiimbotPrinter
            assetTagId={assetTagId.toString()}
            onCancel={handleBack}
            onComplete={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
