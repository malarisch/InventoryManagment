"use client";

import { useState } from 'react';

/**
 * Hook for managing QR scanner modal state
 * 
 * Provides functions to open/close the scanner modal and handle scan results.
 * 
 * @returns Object with modal state and control functions
 */
export function useQrScanner() {
  const [isOpen, setIsOpen] = useState(false);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);

  const openScanner = () => setIsOpen(true);
  
  const closeScanner = () => setIsOpen(false);
  
  const handleScanResult = (scannedCode: string) => {
    setLastScannedCode(scannedCode);
    setIsOpen(false);
  };

  return {
    isOpen,
    lastScannedCode,
    openScanner,
    closeScanner,
    handleScanResult,
  };
}