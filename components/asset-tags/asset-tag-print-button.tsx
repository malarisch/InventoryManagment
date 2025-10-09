"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AssetTagPrintDialog } from "@/components/asset-tags/asset-tag-print-dialog";
import { Printer } from "lucide-react";

interface AssetTagPrintButtonProps {
  assetTagId: number;
}

export function AssetTagPrintButton({ assetTagId }: AssetTagPrintButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Printer className="mr-2 h-4 w-4" />
        Drucken
      </Button>
      
      <AssetTagPrintDialog
        assetTagId={assetTagId}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
