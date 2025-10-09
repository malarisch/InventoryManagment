"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { 
  NiimbotBluetoothClient, 
  ImageEncoder, 
  type ConnectionInfo,
  type RfidInfo,
  type PrinterModelMeta
} from "@mmote/niimbluelib";
import type { AssetTagTemplate } from "@/components/asset-tag-templates/types";

type PrinterStatus = 
  | "disconnected" 
  | "connecting" 
  | "connected" 
  | "fetching-specs" 
  | "ready"
  | "preparing"
  | "preview"
  | "printing" 
  | "error";

interface AssetTag {
  id: string;
  printed_template: AssetTagTemplate | null;
}

interface NiimbotPrinterProps {
  assetTagId: string;
  onComplete?: () => void;
  onCancel?: () => void;
}

export function NiimbotPrinter({ assetTagId, onComplete, onCancel }: NiimbotPrinterProps) {
  const [status, setStatus] = useState<PrinterStatus>("disconnected");
  const [error, setError] = useState<string | null>(null);
  const [printerInfo, setPrinterInfo] = useState<{ model?: string; dpi?: number; resolution?: string } | null>(null);
  const [rfidInfo, setRfidInfo] = useState<RfidInfo | null>(null);
  const [assetTag, setAssetTag] = useState<AssetTag | null>(null);
  const [loadingAssetTag, setLoadingAssetTag] = useState(true);
  const [debugInfo, setDebugInfo] = useState<{ 
    templateMm: string; 
    calculatedPx: string; 
    alignedPx: string; 
    canvasPx: string;
    imgPx: string;
  } | null>(null);
  
  const clientRef = useRef<NiimbotBluetoothClient | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Load asset tag data
    const loadAssetTag = async () => {
      try {
        setLoadingAssetTag(true);
        const response = await fetch(`/api/asset-tags/${assetTagId}`);
        if (!response.ok) throw new Error("Failed to load asset tag");
        const data = await response.json();
        console.log("Loaded asset tag:", data);
        console.log("Template exists:", !!data.printed_template);
        setAssetTag(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load asset tag");
      } finally {
        setLoadingAssetTag(false);
      }
    };

    loadAssetTag();

    // Cleanup on unmount
    return () => {
      if (clientRef.current) {
        clientRef.current.disconnect();
      }
    };
  }, [assetTagId]);

  const handleConnect = async () => {
    setStatus("connecting");
    setError(null);

    try {
      const client = new NiimbotBluetoothClient();
      clientRef.current = client;

      const connectionInfo: ConnectionInfo = await client.connect();
      
      if (!connectionInfo.deviceName) {
        throw new Error("No device selected");
      }

      setStatus("connected");
      await fetchPrinterSpecs(client);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed");
      setStatus("error");
    }
  };

  const fetchPrinterSpecs = async (client: NiimbotBluetoothClient) => {
    setStatus("fetching-specs");

    try {
      // Fetch printer info
      await client.fetchPrinterInfo();
      
      // Get model metadata from library
      const modelMeta: PrinterModelMeta | undefined = client.getModelMetadata();
      
      if (!modelMeta) {
        throw new Error("Unknown printer model");
      }

      setPrinterInfo({
        model: modelMeta.model,
        dpi: modelMeta.dpi,
        resolution: `${modelMeta.printheadPixels}px`,
      });

      // Check for RFID label info if supported
      try {
        const rfid: RfidInfo = await client.abstraction.rfidInfo();
        setRfidInfo(rfid);
      } catch {
        // RFID not supported or no label detected
        setRfidInfo(null);
      }

      setStatus("ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch printer specs");
      setStatus("error");
    }
  };

  const handleDisconnect = () => {
    if (clientRef.current) {
      clientRef.current.disconnect();
      clientRef.current = null;
    }
    setStatus("disconnected");
    setPrinterInfo(null);
    setRfidInfo(null);
    setDebugInfo(null);
  };

  const handlePrepareLabel = async () => {
    if (!printerInfo) {
      setError("Printer not connected or specs not fetched");
      return;
    }
    if (!canvasRef.current) {
      setError("Canvas element not ready");
      return;
    }
    if (!assetTag) {
      setError("Asset tag not loaded yet");
      return;
    }
    if (!assetTag.printed_template) {
      setError("Asset tag has no template assigned. Please assign a template to this asset tag first.");
      return;
    }

    setStatus("preparing");
    setError(null);

    try {
      const template = assetTag.printed_template;
      const mmToInch = 1 / 25.4;
      const dpi = printerInfo.dpi || 203; // Fallback to 203 DPI
      const widthPxCalculated = Math.round(template.tagWidthMm * mmToInch * dpi);
      const heightPxCalculated = Math.round(template.tagHeightMm * mmToInch * dpi);
      
      // Niimbot printers require width to be a multiple of 8
      const widthPx = Math.ceil(widthPxCalculated / 8) * 8;
      const heightPx = heightPxCalculated;
      
      // Store debug info
      setDebugInfo({
        templateMm: `${template.tagWidthMm}mm × ${template.tagHeightMm}mm`,
        calculatedPx: `${widthPxCalculated}px × ${heightPxCalculated}px`,
        alignedPx: `${widthPx}px × ${heightPx}px`,
        canvasPx: "", // Will be set after canvas is drawn
        imgPx: "", // Will be set after image loads
      });
      
      // Fetch asset tag render as PNG at calculated dimensions
      const renderUrl = `/api/asset-tags/${assetTagId}/render?format=png&width=${widthPx}&height=${heightPx}`;
      const response = await fetch(renderUrl);
      
      if (!response.ok) {
        throw new Error("Failed to render asset tag");
      }

      const blob = await response.blob();
      const img = new Image();
      const imgUrl = URL.createObjectURL(blob);

      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          URL.revokeObjectURL(imgUrl);
          // Update debug info with actual image dimensions
          setDebugInfo(prev => prev ? { ...prev, imgPx: `${img.width}px × ${img.height}px` } : null);
          resolve();
        };
        img.onerror = () => {
          URL.revokeObjectURL(imgUrl);
          reject(new Error("Failed to load image"));
        };
        img.src = imgUrl;
      });

      // Draw to canvas
      const canvas = canvasRef.current;
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas context unavailable");
      
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      
      // Update debug info with actual canvas dimensions
      setDebugInfo(prev => prev ? { 
        ...prev, 
        canvasPx: `${canvas.width}px × ${canvas.height}px` 
      } : null);

      setStatus("preview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to prepare label");
      setStatus("error");
    }
  };

  const handlePrint = async () => {
    if (!clientRef.current || !canvasRef.current) {
      setError("Printer not connected or canvas not ready");
      return;
    }

    setStatus("printing");
    setError(null);

    try {
      const client = clientRef.current;
      const canvas = canvasRef.current;

      // Encode for printer (ImageEncoder is a static class)
      const modelMeta = client.getModelMetadata();
      const printDirection = modelMeta?.printDirection || "left";
      const encodedImage = ImageEncoder.encodeCanvas(canvas, printDirection);

      // Create and execute print task
      const printTaskType = client.getPrintTaskType() || "B1"; // Fallback to B1
      const printTask = client.abstraction.newPrintTask(printTaskType, {
        totalPages: 1,
        density: 3,
      });

      await printTask.printInit();
      await printTask.printPage(encodedImage, 1);
      await printTask.waitForFinished();
      await printTask.printEnd();

      setStatus("preview");
      onComplete?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Print failed");
      setStatus("error");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Niimbot Bluetooth Printer</CardTitle>
        <CardDescription>
          Connect and print directly to your Niimbot label printer
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loadingAssetTag && (
          <div className="p-3 bg-muted rounded-md text-sm flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading asset tag...
          </div>
        )}

        {!loadingAssetTag && assetTag && !assetTag.printed_template && (
          <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
            <CardContent className="pt-4 text-yellow-800 dark:text-yellow-200 text-sm">
              ⚠️ This asset tag has no template assigned. Please assign a template first.
            </CardContent>
          </Card>
        )}

        {error && (
          <Card className="border-destructive">
            <CardContent className="pt-4 text-destructive text-sm">
              {error}
            </CardContent>
          </Card>
        )}

        {printerInfo && (
          <div className="p-3 bg-muted rounded-md space-y-1 text-sm">
            <div><strong>Model:</strong> {printerInfo.model}</div>
            <div><strong>DPI:</strong> {printerInfo.dpi}</div>
            <div><strong>Resolution:</strong> {printerInfo.resolution}</div>
            {rfidInfo?.tagPresent && (
              <>
                <div><strong>Paper Remaining:</strong> {rfidInfo.allPaper - rfidInfo.usedPaper} / {rfidInfo.allPaper}</div>
              </>
            )}
          </div>
        )}

        {debugInfo && (
          <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-md space-y-1 text-sm border border-blue-200 dark:border-blue-800">
            <div className="font-semibold mb-2">Debug Information:</div>
            <div><strong>Template Size:</strong> {debugInfo.templateMm}</div>
            <div><strong>Calculated:</strong> {debugInfo.calculatedPx}</div>
            <div><strong>Aligned (÷8):</strong> {debugInfo.alignedPx}</div>
            {debugInfo.imgPx && <div><strong>Image Loaded:</strong> {debugInfo.imgPx}</div>}
            {debugInfo.canvasPx && <div><strong>Canvas Size:</strong> {debugInfo.canvasPx}</div>}
          </div>
        )}

        {/* Canvas Preview - show when we have content to display */}
        {debugInfo && (status === "preview" || status === "printing") && (
          <div className="border rounded-md p-3 bg-white dark:bg-gray-900">
            <div className="text-sm font-semibold mb-2">Canvas Preview (will be sent to printer):</div>
            <div className="overflow-auto max-h-96 border border-gray-300 dark:border-gray-700 rounded">
              <canvas 
                ref={canvasRef} 
                className="max-w-full h-auto"
              />
            </div>
          </div>
        )}

        {/* Hidden canvas for initial rendering - always mounted so ref is available */}
        {(status !== "preview" && status !== "printing") && (
          <canvas ref={canvasRef} className="hidden" />
        )}

        <div className="flex gap-2 flex-wrap">
          {status === "disconnected" && (
            <Button onClick={handleConnect}>
              Connect Printer
            </Button>
          )}

          {status === "connecting" && (
            <Button disabled>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Connecting...
            </Button>
          )}

          {status === "fetching-specs" && (
            <Button disabled>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Fetching Printer Info...
            </Button>
          )}

          {status === "ready" && (
            <>
              <Button 
                onClick={handlePrepareLabel}
                disabled={!assetTag?.printed_template || loadingAssetTag}
              >
                Prepare Label
              </Button>
              <Button variant="outline" onClick={handleDisconnect}>
                Disconnect
              </Button>
            </>
          )}

          {status === "preparing" && (
            <Button disabled>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Preparing Label...
            </Button>
          )}

          {status === "preview" && (
            <>
              <Button onClick={handlePrint}>
                Send to Printer
              </Button>
              <Button variant="outline" onClick={() => setStatus("ready")}>
                Back
              </Button>
              <Button variant="outline" onClick={handleDisconnect}>
                Disconnect
              </Button>
            </>
          )}

          {status === "printing" && (
            <Button disabled>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Printing...
            </Button>
          )}

          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
