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
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

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

export interface FullscreenScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (code: string) => Promise<void> | void;
  title?: string;
  instructions?: string;
  manualEntryLabel?: string;
}

const SCAN_COOLDOWN_MS = 1500;

export function FullscreenScanner({
  isOpen,
  onClose,
  onScan,
  title = "Scanner",
  instructions = "Code auf Höhe der Markierung halten",
  manualEntryLabel = "Code manuell eingeben",
}: FullscreenScannerProps) {
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
  const [showManualEntry, setShowManualEntry] = useState(false);

  const resetScanner = useCallback(() => {
    setError(null);
    lastScanRef.current = { code: "", timestamp: 0 };
  }, []);

  // Prevent body scroll when scanner is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    let isActive = true;

    async function initialize() {
      if (!videoRef.current) return;

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
  }, [isOpen, onScan, resetScanner]);

  // Ensure video element stays active
  useEffect(() => {
    if (!isOpen || !videoRef.current || !scannerRef.current) return;

    const video = videoRef.current;
    const checkInterval = setInterval(() => {
      if (video.paused && video.readyState >= 2) {
        // Video is paused but ready - try to play it
        video.play().catch((err) => {
          console.error("Failed to resume video", err);
        });
      }
    }, 1000);

    return () => clearInterval(checkInterval);
  }, [isOpen]);

  const switchCamera = useCallback(
    async (cameraId: string) => {
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
    },
    [resetScanner],
  );

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
      setShowManualEntry(false);
    } catch (err) {
      console.error("Manual scan failed", err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      isProcessingRef.current = false;
      setIsProcessing(false);
    }
  }, [manualCode, onScan, resetScanner]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Header Overlay */}
      <div className="absolute inset-x-0 top-0 z-10 bg-gradient-to-b from-black/70 to-transparent p-4">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 text-white hover:bg-white/20"
            onClick={onClose}
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-lg font-semibold text-white">{title}</h1>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 text-white hover:bg-white/20"
            onClick={onClose}
          >
            <X className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {/* Video Container */}
      <div className="relative h-full w-full">
        <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />

        {/* Scan Region Overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-4/5 max-w-md aspect-square border-4 border-white/80 rounded-2xl flex items-center justify-center shadow-2xl">
            <ScanLine className="w-16 h-16 text-white/90" />
          </div>
        </div>

        {/* Status Badge */}
        <div className="absolute inset-x-0 top-20 flex justify-center pointer-events-none px-4">
          <Badge variant="secondary" className="bg-white/30 text-white backdrop-blur-md text-base py-2 px-4">
            {isProcessing ? "Verarbeite…" : isLoading ? "Lädt…" : instructions}
          </Badge>
        </div>

        {/* Loading Indicator */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <Loader2 className="h-12 w-12 animate-spin text-white" />
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="absolute inset-x-4 top-32 z-10">
            <div className="flex items-center justify-between rounded-lg bg-red-500/90 backdrop-blur-md px-4 py-3 text-white shadow-lg">
              <span className="text-sm font-medium">{error}</span>
              <button type="button" onClick={() => setError(null)}>
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {/* Bottom Controls */}
        <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/80 to-transparent p-6 pb-8">
          <div className="space-y-4">
            {/* Camera Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-white/80">
                <CameraIcon className="h-5 w-5" />
                <span className="text-sm">
                  {hasCamera
                    ? cameras.length > 1
                      ? `${cameras.length} Kameras`
                      : "Kamera aktiv"
                    : "Keine Kamera"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {hasFlash && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    className={cn(
                      "h-10 w-10 bg-white/20 text-white hover:bg-white/30 border-0",
                      isFlashOn && "bg-white/40",
                    )}
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
                    className="h-10 w-10 bg-white/20 text-white hover:bg-white/30 border-0"
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

            {/* Manual Entry Toggle */}
            <div className="flex justify-center">
              <Button
                type="button"
                variant="secondary"
                className="bg-white/20 text-white hover:bg-white/30 border-0 backdrop-blur-md"
                onClick={() => setShowManualEntry(!showManualEntry)}
              >
                {showManualEntry ? "Manuelle Eingabe ausblenden" : "Code manuell eingeben"}
              </Button>
            </div>

            {/* Manual Entry Field */}
            {showManualEntry && (
              <div className="space-y-2 rounded-lg bg-black/50 backdrop-blur-md p-4">
                <label className="text-sm font-medium text-white/90" htmlFor="manual-code-fullscreen">
                  {manualEntryLabel}
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    id="manual-code-fullscreen"
                    value={manualCode}
                    onChange={(event) => setManualCode(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        void submitManualCode();
                      }
                    }}
                    placeholder="z. B. EQP-00123"
                    autoCapitalize="characters"
                    autoComplete="off"
                    spellCheck={false}
                    className="flex-1 bg-white/20 text-white border-white/30 placeholder:text-white/50"
                    disabled={isProcessing}
                  />
                  <Button
                    type="button"
                    onClick={submitManualCode}
                    disabled={!manualCode.trim() || isProcessing}
                    className="bg-white/20 text-white hover:bg-white/30 border-0"
                  >
                    Scannen
                  </Button>
                </div>
              </div>
            )}

            {/* Camera Info */}
            {cameras.length > 1 && selectedCamera && (
              <div className="text-center text-xs text-white/60">
                {cameras.find((c) => c.id === selectedCamera)?.label || "—"}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
