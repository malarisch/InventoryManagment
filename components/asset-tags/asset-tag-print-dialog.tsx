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
import { NiimbotPrinter } from "./niimbot-printer";

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

  const handleNormalPrint = () => {
    // Open asset tag in new window for system print dialog
    const printUrl = `/api/asset-tags/${assetTagId}/render?format=svg`;
    const printWindow = window.open(printUrl, "_blank");
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  };

  const handleBack = () => {
    setPrintMode("select");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
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
              className="h-auto flex-col items-start gap-2 p-4"
              onClick={handleNormalPrint}
            >
              <div className="flex items-center gap-2">
                <Printer className="h-5 w-5" />
                <span className="font-semibold">Normal drucken</span>
              </div>
              <span className="text-sm text-muted-foreground">
                Asset-Tag wird gerendert und über den System-Druckdialog gedruckt
              </span>
            </Button>

            <Button
              variant="outline"
              className="h-auto flex-col items-start gap-2 p-4"
              onClick={() => setPrintMode("niimbot")}
            >
              <div className="flex items-center gap-2">
                <Bluetooth className="h-5 w-5" />
                <span className="font-semibold">Niimbot Bluetooth-Drucker</span>
              </div>
              <span className="text-sm text-muted-foreground">
                Direkt per Bluetooth an Niimbot-Labeldrucker drucken
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
