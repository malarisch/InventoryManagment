"use client";

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Camera, CameraOff, Flashlight, FlashlightOff, X, Scan, CheckCircle2, AlertCircle } from 'lucide-react';

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanResult: (scannedCode: string) => void;
  title?: string;
  description?: string;
}

interface ScanResult {
  data: string;
  cornerPoints?: Array<{ x: number; y: number }>;
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

export function QrScannerModal({ 
  isOpen, 
  onClose, 
  onScanResult, 
  title = "Asset-Tag scannen",
  description = "Halte die Kamera auf den QR-Code oder Barcode des Asset-Tags"
}: QrScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const [scanner, setScanner] = useState<QrScannerInstance | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasCamera, setHasCamera] = useState<boolean>(false);
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const [hasFlash, setHasFlash] = useState<boolean>(false);
  const [isFlashOn, setIsFlashOn] = useState<boolean>(false);
  const [scanSuccess, setScanSuccess] = useState<string | null>(null);

  // Handle modal close
  const handleClose = useCallback(() => {
    if (scanner) {
      scanner.stop();
    }
    setScanSuccess(null);
    setError(null);
    onClose();
  }, [scanner, onClose]);

  // Initialize QR Scanner when modal opens
  useEffect(() => {
    if (!isOpen || !videoRef.current) return;

    const initializeScanner = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Dynamic import to handle SSR
        const { default: QrScanner } = await import('qr-scanner');
        
        // Check if camera is available
        const cameraAvailable = await QrScanner.hasCamera();
        setHasCamera(cameraAvailable);
        
        if (!cameraAvailable) {
          setError('Keine Kamera verfügbar. Bitte stelle sicher, dass dein Gerät eine Kamera hat und die Berechtigung erteilt wurde.');
          setIsLoading(false);
          return;
        }

        // Create scanner instance
        const qrScanner = new QrScanner(
          videoRef.current!,
          (result: ScanResult | string) => {
            const scannedData = typeof result === 'string' ? result : result.data;
            setScanSuccess(scannedData);
            qrScanner.stop();
            setTimeout(() => {
              onScanResult(scannedData);
              setScanSuccess(null);
              handleClose();
            }, 1500); // Show success message for 1.5 seconds
          },
          {
            returnDetailedScanResult: true,
          }
        );

        // Start the scanner
        await qrScanner.start();
        
        // Check flash support
        const flashSupported = await qrScanner.hasFlash();
        setHasFlash(flashSupported);
        
        // List cameras
        const availableCameras = await QrScanner.listCameras(true);
        setCameras(availableCameras);
        
        setScanner(qrScanner);
        setIsLoading(false);
        
      } catch (err: unknown) {
        console.error('Scanner initialization error:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unbekannter Fehler';
        setError(`Fehler beim Initialisieren der Kamera: ${errorMessage}. Bitte erlaube den Kamerazugriff und lade die Seite neu.`);
        setIsLoading(false);
      }
    };

    initializeScanner();

    // Cleanup function
    return () => {
      // Note: scanner variable is captured in the closure from the effect
      // We don't need to add it to dependencies since it's created within this effect
    };
  }, [isOpen, onScanResult, handleClose]);

  // Handle camera switch
  const switchCamera = async (cameraId: string) => {
    if (!scanner) return;
    
    try {
      await scanner.setCamera(cameraId);
      setSelectedCamera(cameraId);
      
      // Update flash availability for new camera
      const flashSupported = await scanner.hasFlash();
      setHasFlash(flashSupported);
      if (!flashSupported) {
        setIsFlashOn(false);
      }
    } catch (err: unknown) {
      console.error('Camera switch error:', err);
      setError('Fehler beim Wechseln der Kamera.');
    }
  };

  // Handle flash toggle
  const toggleFlash = async () => {
    if (!scanner || !hasFlash) return;
    
    try {
      await scanner.toggleFlash();
      setIsFlashOn(scanner.isFlashOn());
    } catch (err: unknown) {
      console.error('Flash toggle error:', err);
      setError('Fehler beim Aktivieren des Blitzes.');
    }
  };

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, handleClose]);

  // Escape key to close
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
      <div className="flex min-h-full items-center justify-center p-4">
        <div 
          ref={modalRef}
          className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <Scan className="w-5 h-5" />
                  {title}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {description}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Video Container */}
          <div className="relative bg-black" style={{ aspectRatio: '4/3' }}>
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
            />
            
            {/* Loading Overlay */}
            {isLoading && (
              <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                <div className="text-center text-white">
                  <Camera className="w-8 h-8 mx-auto mb-2 animate-pulse" />
                  <p className="text-sm">Kamera wird geladen...</p>
                </div>
              </div>
            )}

            {/* Success Overlay */}
            {scanSuccess && (
              <div className="absolute inset-0 bg-green-600/90 flex items-center justify-center">
                <div className="text-center text-white">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-2" />
                  <p className="text-lg font-semibold">Scan erfolgreich!</p>
                  <p className="text-sm opacity-90 font-mono break-all">{scanSuccess}</p>
                </div>
              </div>
            )}

            {/* No Camera Overlay */}
            {!hasCamera && !isLoading && (
              <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                <div className="text-center text-white">
                  <CameraOff className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm">Keine Kamera verfügbar</p>
                </div>
              </div>
            )}
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mx-6 mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            </div>
          )}

          {/* Controls */}
          {hasCamera && !isLoading && !scanSuccess && (
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                {/* Flash Toggle */}
                {hasFlash && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleFlash}
                    className="flex items-center gap-2"
                  >
                    {isFlashOn ? (
                      <FlashlightOff className="w-4 h-4" />
                    ) : (
                      <Flashlight className="w-4 h-4" />
                    )}
                    {isFlashOn ? 'Blitz aus' : 'Blitz an'}
                  </Button>
                )}

                {/* Camera Selection */}
                {cameras.length > 1 && (
                  <div className="flex flex-wrap gap-1">
                    {cameras.map((camera, index) => (
                      <Button
                        key={camera.id}
                        variant={selectedCamera === camera.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => switchCamera(camera.id)}
                        className="text-xs"
                      >
                        {camera.label || `Kamera ${index + 1}`}
                      </Button>
                    ))}
                  </div>
                )}
              </div>

              {/* Instructions */}
              <div className="text-center">
                <Badge variant="secondary" className="mb-2">
                  <Scan className="w-3 h-3 mr-1" />
                  Bereit zum Scannen
                </Badge>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Positioniere den QR-Code oder Barcode mittig im Bild
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}