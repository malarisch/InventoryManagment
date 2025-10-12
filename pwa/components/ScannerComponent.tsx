"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  IonContent, 
  IonHeader, 
  IonTitle, 
  IonToolbar,
  IonCard,
  IonCardContent,
  IonButton,
  IonAlert,
  IonIcon,
  IonText,
  IonList,
  IonItem,
  IonLabel,
  IonBadge,
  IonFab,
  IonFabButton,
  IonPage,
  IonLoading
} from '@ionic/react';
import { 
  qrCode, 
  flashlight, 
  flashOffOutline, 
  checkmarkCircle, 
  alertCircle,
  camera,
  logOut,
  business
} from 'ionicons/icons';
import { BarcodeScanner, BarcodeFormat } from '@capacitor-mlkit/barcode-scanning';
import type { Barcode } from '@capacitor-mlkit/barcode-scanning';
import { Capacitor } from '@capacitor/core';
import { createSupabaseClient } from '../lib/supabase/client';
import type { User } from '@supabase/supabase-js';

interface Company {
  id: string;
  name: string;
  description: string | null;
}

interface ScannerComponentProps {
  user: User;
  company: Company;
  onLogout: () => void;
  onChangeCompany: () => void;
}

interface ScanResult {
  id: string;
  code: string;
  format: string;
  timestamp: string;
  status: 'success' | 'error' | 'warning';
}

export function ScannerComponent({ user, company, onLogout, onChangeCompany }: ScannerComponentProps) {
  const [scanning, setScanning] = useState(false);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [scanResults, setScanResults] = useState<ScanResult[]>([]);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertHeader, setAlertHeader] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const supabase = useMemo(() => createSupabaseClient(), []);

  useEffect(() => {
    checkSupport();
  }, []);

  const checkSupport = async () => {
    try {
      // Check if platform supports native scanning
      if (Capacitor.isNativePlatform()) {
        const { supported } = await BarcodeScanner.isSupported();
        setIsSupported(supported);
        
        if (!supported) {
          setAlertHeader('Scanner nicht verfügbar');
          setAlertMessage('Der native Barcode-Scanner funktioniert nur auf einem echten iOS-Gerät mit Kamera. Im Simulator steht diese Funktion nicht zur Verfügung.');
        }
      } else {
        // On web, use fallback
        setIsSupported(false);
        setAlertHeader('Web-Version');
        setAlertMessage('Der Scanner ist nur in der nativen iOS-App verfügbar.');
      }
    } catch (error) {
      console.error('Error checking scanner support:', error);
      setIsSupported(false);
      
      // Check if it's the simulator UNIMPLEMENTED error
      if (error && typeof error === 'object' && 'code' in error && error.code === 'UNIMPLEMENTED') {
        setAlertHeader('Simulator erkannt');
        setAlertMessage('Der Barcode-Scanner funktioniert nur auf einem echten iOS-Gerät. Bitte testen Sie die App auf einem physischen iPhone mit Kamera.');
      } else {
        setAlertHeader('Fehler');
        setAlertMessage('Der Scanner konnte nicht initialisiert werden. Bitte überprüfen Sie die Kameraberechtigungen.');
      }
    } finally {
      setLoading(false);
    }
  };

  const requestPermissions = async () => {
    try {
      const { camera } = await BarcodeScanner.requestPermissions();
      return camera === 'granted';
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  };

  const startScan = async () => {
    if (!isSupported) {
      showAlert('Nicht unterstützt', 'Barcode-Scanner wird auf diesem Gerät nicht unterstützt.');
      return;
    }

    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      showAlert('Berechtigung erforderlich', 'Kamera-Berechtigung wird benötigt, um Barcodes zu scannen.');
      return;
    }

    try {
      setScanning(true);
      
      if (Capacitor.isNativePlatform()) {
        // Use native scanner
        const result = await BarcodeScanner.scan({
          formats: [BarcodeFormat.QrCode, BarcodeFormat.Code128, BarcodeFormat.Ean13]
        });

        if (result.barcodes && result.barcodes.length > 0) {
          const barcode = result.barcodes[0];
          handleScanResult(barcode);
        }
      } else {
        // Web fallback - show a message
        showAlert('Web-Modus', 'Auf dem Web verwenden Sie bitte die native App für optimale Scanner-Funktionalität.');
      }
    } catch (error) {
      console.error('Scanning error:', error);
      showAlert('Scan-Fehler', 'Fehler beim Scannen des Barcodes. Bitte versuchen Sie es erneut.');
    } finally {
      setScanning(false);
    }
  };

  const handleScanResult = (barcode: Barcode) => {
    const newResult: ScanResult = {
      id: Date.now().toString(),
      code: barcode.rawValue || barcode.displayValue,
      format: barcode.format,
      timestamp: new Date().toLocaleTimeString('de-DE'),
      status: 'success'
    };

    setScanResults(prev => [newResult, ...prev.slice(0, 9)]); // Keep last 10 results
    
    // Here you would typically process the scanned code
    // For example, look up equipment in database, update location, etc.
    processScannedCode(newResult.code);
  };

  const processScannedCode = async (code: string) => {
    try {
      // Example: Look up equipment by asset tag or barcode
      // This would integrate with your inventory system
      console.log('Processing scanned code:', code);
      
      // For demonstration, just show success
      showAlert('Scan erfolgreich', `Code gescannt: ${code}`);
    } catch (error) {
      console.error('Error processing scan:', error);
      showAlert('Verarbeitungsfehler', 'Fehler beim Verarbeiten des gescannten Codes.');
    }
  };

  const toggleFlash = async () => {
    try {
      if (flashEnabled) {
        await BarcodeScanner.disableTorch();
      } else {
        await BarcodeScanner.enableTorch();
      }
      setFlashEnabled(!flashEnabled);
    } catch (error) {
      console.error('Flash toggle error:', error);
      showAlert('Flash-Fehler', 'Fehler beim Umschalten der Taschenlampe.');
    }
  };

  const showAlert = (header: string, message: string) => {
    setAlertHeader(header);
    setAlertMessage(message);
    setAlertOpen(true);
  };

  const handleLogout = async () => {
    try {
      if (supabase) {
        await supabase.auth.signOut();
      }
      onLogout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'success';
      case 'error': return 'danger';
      case 'warning': return 'warning';
      default: return 'medium';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return checkmarkCircle;
      case 'error': return alertCircle;
      case 'warning': return alertCircle;
      default: return qrCode;
    }
  };

  if (loading) {
    return (
      <IonLoading
        isOpen={loading}
        message="Scanner wird geladen..."
      />
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{company.name}</IonTitle>
          <IonButton
            slot="start"
            fill="clear"
            onClick={onChangeCompany}
          >
            <IonIcon icon={business} />
          </IonButton>
          <IonButton
            slot="end"
            fill="clear"
            onClick={handleLogout}
          >
            <IonIcon icon={logOut} />
          </IonButton>
        </IonToolbar>
      </IonHeader>
      
      <IonContent>
        <div className="scanner-content">
          <IonCard>
            <IonCardContent>
              <div className="scanner-header">
                <IonIcon icon={qrCode} size="large" className="scanner-icon" />
                <IonText>
                  <h2>Barcode Scanner</h2>
                  <p>Scannen Sie Asset-Tags und Barcodes für Ihre Inventarverwaltung. hehe huhu</p>
                </IonText>
              </div>

              <div className="user-info">
                <IonText color="medium">
                  <p>Angemeldet als: {user.email}</p>
                </IonText>
              </div>

              {!isSupported && (
                <IonCard color="warning">
                  <IonCardContent>
                    <IonText>
                      <h3>⚠️ Scanner nicht verfügbar</h3>
                      <p><strong>{alertHeader}</strong></p>
                      <p>{alertMessage}</p>
                      <p style={{ marginTop: '1rem', fontSize: '0.9rem' }}>
                        💡 <strong>Tipp:</strong> Um den Scanner zu testen, installieren Sie die App auf einem echten iPhone.
                      </p>
                    </IonText>
                  </IonCardContent>
                </IonCard>
              )}
            </IonCardContent>
          </IonCard>

          {scanResults.length > 0 && (
            <IonCard>
              <IonCardContent>
                <IonText>
                  <h3>Letzte Scans</h3>
                </IonText>
                <IonList>
                  {scanResults.map((result) => (
                    <IonItem key={result.id}>
                      <IonIcon 
                        icon={getStatusIcon(result.status)} 
                        color={getStatusColor(result.status)}
                        slot="start" 
                      />
                      <IonLabel>
                        <h3>{result.code}</h3>
                        <p>{result.format} • {result.timestamp}</p>
                      </IonLabel>
                      <IonBadge 
                        color={getStatusColor(result.status)}
                        slot="end"
                      >
                        {result.status}
                      </IonBadge>
                    </IonItem>
                  ))}
                </IonList>
              </IonCardContent>
            </IonCard>
          )}
        </div>

        {/* Floating Action Buttons */}
        <IonFab vertical="bottom" horizontal="center" slot="fixed">
          <IonFabButton 
            onClick={startScan} 
            disabled={!isSupported || scanning}
            color="primary"
            size="small"
          >
            <IonIcon icon={camera} />
          </IonFabButton>
        </IonFab>

        {Capacitor.isNativePlatform() && (
          <IonFab vertical="bottom" horizontal="end" slot="fixed">
            <IonFabButton 
              onClick={toggleFlash}
              color={flashEnabled ? "warning" : "medium"}
            >
              <IonIcon icon={flashEnabled ? flashlight : flashOffOutline} />
            </IonFabButton>
          </IonFab>
        )}

        <IonAlert
          isOpen={alertOpen}
          onDidDismiss={() => setAlertOpen(false)}
          header={alertHeader}
          message={alertMessage}
          buttons={['OK']}
        />
      </IonContent>

      <style jsx>{`
        .scanner-content {
          padding: 1rem;
          padding-bottom: 100px; /* Space for FABs */
        }
        
        .scanner-header {
          text-align: center;
          margin-bottom: 1rem;
        }
        
        .scanner-icon {
          margin-bottom: 1rem;
          color: var(--ion-color-primary);
        }
        
        .user-info {
          text-align: center;
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid var(--ion-color-light);
        }
      `}</style>
    </IonPage>
  );
}