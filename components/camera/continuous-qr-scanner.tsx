"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Camera as CameraIcon,
  CameraOff,
  Flashlight,
  FlashlightOff,
  Loader2,
  ScanLine,
  X,
} from "lucide-react";

interface ScanResult {
  data: string;
}

interface QrScannerInstance {
  start: () => Promise<void>;
  stop: () => void;
  destroy: () => void;
  setCamera: (cameraId: string) => Promise<void>;
  hasFlash: () => Promise<boolean>;
  isFlashOn: () => boolean;
  toggleFlash: () => Promise<void>;
}

export interface ContinuousQrScannerProps {
  onScan: (code: string) => Promise<void> | void;
  instructions?: string;
  className?: string;
  disabled?: boolean;
  manualEntryLabel?: string;
}

const SCAN_COOLDOWN_MS = 1500;

export function ContinuousQrScanner({
  onScan,
  instructions = "Halte den Code mittig in den Rahmen",
  className,
  disabled = false,
  manualEntryLabel = "Code manuell eingeben",
}: ContinuousQrScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scannerRef = useRef<QrScannerInstance | null>(null);
  const lastScanRef = useRef<{ code: string; timestamp: number }>({ code: "", timestamp: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const isProcessingRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [hasCamera, setHasCamera] = useState<boolean>(false);
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>("");
  const [hasFlash, setHasFlash] = useState<boolean>(false);
  const [isFlashOn, setIsFlashOn] = useState<boolean>(false);
  const [manualCode, setManualCode] = useState<string>("");

  const resetScanner = useCallback(() => {
    setError(null);
    lastScanRef.current = { code: "", timestamp: 0 };
  }, []);

  useEffect(() => {
    let isActive = true;

    async function initialize() {
      if (!videoRef.current || disabled) return;

      try {
        setIsLoading(true);
        setError(null);

        const { default: QrScanner } = await import("qr-scanner");
        const cameraAvailable = await QrScanner.hasCamera();
        setHasCamera(cameraAvailable);

        if (!cameraAvailable) {
          setError("Keine Kamera gefunden oder Zugriff verweigert.");
          setIsLoading(false);
          return;
        }

        const instance = new QrScanner(
          videoRef.current,
          async (result: ScanResult | string) => {
            const payload = typeof result === "string" ? result : result.data;
            const now = Date.now();
            const last = lastScanRef.current;
            if (!payload) return;
            if (isProcessingRef.current) return;
            if (payload === last.code && now - last.timestamp < SCAN_COOLDOWN_MS) {
              return;
            }
            lastScanRef.current = { code: payload, timestamp: now };
            try {
              isProcessingRef.current = true;
              setIsProcessing(true);
              await onScan(payload);
            } catch (err) {
              console.error("onScan handler failed", err);
              setError(err instanceof Error ? err.message : String(err));
            } finally {
              isProcessingRef.current = false;
              setIsProcessing(false);
            }
          },
          {
            returnDetailedScanResult: true,
            highlightScanRegion: true,
          },
        );

        scannerRef.current = instance as QrScannerInstance;
        await instance.start();

        const flashSupported = await instance.hasFlash().catch(() => false);
        if (isActive) setHasFlash(Boolean(flashSupported));

        const availableCameras = await QrScanner.listCameras(true);
        if (isActive) {
          setCameras(availableCameras);
          if (availableCameras.length > 0) {
            setSelectedCamera(availableCameras[0]?.id ?? "");
          }
        }
      } catch (err) {
        console.error("Scanner initialization error", err);
        if (!isActive) return;
        setError(err instanceof Error ? err.message : "Unbekannter Fehler beim Starten der Kamera.");
      } finally {
        if (isActive) setIsLoading(false);
      }
    }

    void initialize();

    return () => {
      isActive = false;
      if (scannerRef.current) {
        try {
          scannerRef.current.stop();
          scannerRef.current.destroy();
        } catch (err) {
          console.error("Scanner cleanup error", err);
        }
        scannerRef.current = null;
      }
    };
  }, [onScan, disabled, resetScanner]);

  const switchCamera = useCallback(async (cameraId: string) => {
    if (!scannerRef.current) return;
    try {
      await scannerRef.current.setCamera(cameraId);
      setSelectedCamera(cameraId);
      const flashSupported = await scannerRef.current.hasFlash();
      setHasFlash(flashSupported);
      if (!flashSupported) setIsFlashOn(false);
      resetScanner();
    } catch (err) {
      console.error("Camera switch failed", err);
      setError("Kamera konnte nicht gewechselt werden.");
    }
  }, [resetScanner]);

  const toggleFlash = useCallback(async () => {
    if (!scannerRef.current || !hasFlash) return;
    try {
      await scannerRef.current.toggleFlash();
      setIsFlashOn(scannerRef.current.isFlashOn());
    } catch (err) {
      console.error("Flash toggle failed", err);
      setError("Blitz konnte nicht umgeschaltet werden.");
    }
  }, [hasFlash]);

  const submitManualCode = useCallback(async () => {
    const code = manualCode.trim();
    if (!code || isProcessingRef.current) return;
    resetScanner();
    try {
      isProcessingRef.current = true;
      setIsProcessing(true);
      await onScan(code);
      setManualCode("");
    } catch (err) {
      console.error("Manual scan failed", err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      isProcessingRef.current = false;
      setIsProcessing(false);
    }
  }, [manualCode, onScan, resetScanner]);

  return (
    <div className={className}>
      <div className="relative w-full rounded-xl overflow-hidden bg-black aspect-[9/16] md:aspect-video">
        <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-4/5 max-w-sm aspect-square border-2 border-white/70 rounded-xl flex items-center justify-center">
            <ScanLine className="w-10 h-10 text-white/80" />
          </div>
        </div>
        <div className="absolute inset-x-4 top-4 flex items-center justify-between gap-2">
          <Badge variant="secondary" className="bg-white/20 text-white backdrop-blur">
            {isProcessing ? "Verarbeite…" : instructions}
          </Badge>
          {isLoading && <Loader2 className="h-5 w-5 animate-spin text-white" />}
        </div>
        <div className="absolute inset-x-4 bottom-4 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CameraIcon className="h-5 w-5 text-white" />
              <span className="text-sm text-white/80">
                {cameras.length > 1 ? `${cameras.length} Kameras verfügbar` : "Kamera aktiv"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {hasFlash && (
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="h-9 w-9 bg-white/20 text-white hover:bg-white/30"
                  onClick={toggleFlash}
                >
                  {isFlashOn ? <Flashlight className="h-5 w-5" /> : <FlashlightOff className="h-5 w-5" />}
                </Button>
              )}
              {cameras.length > 1 && (
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="h-9 w-9 bg-white/20 text-white hover:bg-white/30"
                  onClick={() => {
                    const idx = cameras.findIndex((camera) => camera.id === selectedCamera);
                    const next = cameras[(idx + 1) % cameras.length];
                    if (next) {
                      void switchCamera(next.id);
                    }
                  }}
                >
                  <CameraOff className="h-5 w-5" />
                </Button>
              )}
            </div>
          </div>
          {!hasCamera && (
            <div className="rounded-md bg-white/10 backdrop-blur p-3 text-sm text-white">
              Keine Kamera verfügbar. Verwende die manuelle Eingabe unten.
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-3 flex items-center justify-between rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <span>{error}</span>
          <button type="button" title="Fehler ausblenden" onClick={() => setError(null)}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="mt-4 space-y-2">
        <label className="text-sm font-medium text-muted-foreground" htmlFor="manual-code">
          {manualEntryLabel}
        </label>
        <div className="flex items-center gap-2">
          <Input
            id="manual-code"
            value={manualCode}
            onChange={(event) => setManualCode(event.target.value)}
            placeholder="z. B. EQP-00123"
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            className="flex-1"
            disabled={isProcessing}
          />
          <Button type="button" onClick={submitManualCode} disabled={!manualCode.trim() || isProcessing}>
            Einlösen
          </Button>
        </div>
      </div>

      {cameras.length > 1 && (
        <div className="mt-3 text-xs text-muted-foreground">
          Aktive Kamera: {cameras.find((c) => c.id === selectedCamera)?.label || "—"}
        </div>
      )}
    </div>
  );
}
