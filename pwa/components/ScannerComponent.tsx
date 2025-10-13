"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  IonContent, 
  IonHeader, 
  IonTitle, 
  IonToolbar,
  IonButton,
  IonAlert,
  IonIcon,
  IonText,
  IonFab,
  IonFabButton,
  IonPage,
  IonLoading,
  IonCard,
  IonCardContent
} from '@ionic/react';
import { 
  flashlight, 
  flashOffOutline, 
  camera,
  logOut,
  business
} from 'ionicons/icons';
import { BarcodeScanner, BarcodeFormat } from '@capacitor-mlkit/barcode-scanning';
import type { Barcode } from '@capacitor-mlkit/barcode-scanning';
import { Capacitor } from '@capacitor/core';
import { createSupabaseClient } from '../lib/supabase/client';
import { lookupAssetByCode, createLogEntry } from '../lib/scanner-utils';
import type { User } from '@supabase/supabase-js';
import type { ScanMode, ScannedEntity, ActiveTarget, ScanLogEntry } from '../lib/scanner-types';
import { AssetDetailCard } from './AssetDetailCard';
import { ScanLog } from './ScanLog';
import { ScannerControls } from './ScannerControls';
import { TargetSelector } from './TargetSelector';

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

export function ScannerComponent({ company, onLogout, onChangeCompany }: ScannerComponentProps) {
  const [scanning, setScanning] = useState(false);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertHeader, setAlertHeader] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Scanner mode and state
  const [scanMode, setScanMode] = useState<ScanMode>('asset');
  const [activeTarget, setActiveTarget] = useState<ActiveTarget | null>(null);
  const [lastScannedEntity, setLastScannedEntity] = useState<ScannedEntity | null>(null);
  const [scanLog, setScanLog] = useState<ScanLogEntry[]>([]);
  const [showTargetSelector, setShowTargetSelector] = useState(false);
  
  const supabase = useMemo(() => createSupabaseClient(), []);

  useEffect(() => {
    checkSupport();
  }, []);

  const checkSupport = async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        const { supported } = await BarcodeScanner.isSupported();
        setIsSupported(supported);
        
        if (!supported) {
          setAlertHeader('Scanner nicht verfügbar');
          setAlertMessage('Der native Barcode-Scanner funktioniert nur auf einem echten iOS-Gerät mit Kamera.');
        }
      } else {
        setIsSupported(false);
        setAlertHeader('Web-Version');
        setAlertMessage('Der Scanner ist nur in der nativen iOS-App verfügbar.');
      }
    } catch (error) {
      console.error('Error checking scanner support:', error);
      setIsSupported(false);
      
      if (error && typeof error === 'object' && 'code' in error && error.code === 'UNIMPLEMENTED') {
        setAlertHeader('Simulator erkannt');
        setAlertMessage('Der Barcode-Scanner funktioniert nur auf einem echten iOS-Gerät.');
      } else {
        setAlertHeader('Fehler');
        setAlertMessage('Der Scanner konnte nicht initialisiert werden.');
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
        const result = await BarcodeScanner.scan({
          formats: [BarcodeFormat.QrCode, BarcodeFormat.Code128, BarcodeFormat.Ean13]
        });

        if (result.barcodes && result.barcodes.length > 0) {
          const barcode = result.barcodes[0];
          await handleScanResult(barcode);
        }
      }
    } catch (error) {
      console.error('Scanning error:', error);
      showAlert('Scan-Fehler', 'Fehler beim Scannen des Barcodes.');
    } finally {
      setScanning(false);
    }
  };

  const handleScanResult = async (barcode: Barcode) => {
    const code = barcode.rawValue || barcode.displayValue;
    
    if (!supabase) {
      showAlert('Fehler', 'Datenbankverbindung nicht verfügbar.');
      return;
    }

    try {
      // Look up the scanned code
      const entity = await lookupAssetByCode(supabase, code, company.id);
      
      if (!entity) {
        const logEntry = createLogEntry(
          'Scan',
          { type: 'unknown', id: '', name: 'Unbekannt', code },
          'error',
          'Code nicht gefunden'
        );
        setScanLog(prev => [logEntry, ...prev]);
        showAlert('Nicht gefunden', `Code "${code}" wurde in der Datenbank nicht gefunden.`);
        return;
      }

      setLastScannedEntity(entity);

      if (scanMode === 'asset') {
        // Asset mode: Just show the details
        const logEntry = createLogEntry(
          'Asset gescannt',
          entity,
          'success',
          `${entity.name} wurde gescannt`
        );
        setScanLog(prev => [logEntry, ...prev]);
      } else {
        // Location mode: Complex workflow
        await handleLocationModeScan(entity, code);
      }
    } catch (error) {
      console.error('Error processing scan:', error);
      showAlert('Fehler', 'Fehler beim Verarbeiten des Scans.');
    }
  };

  const handleLocationModeScan = async (entity: ScannedEntity, _code: string) => {
    if (!supabase) return;

    // Handle location scan - sets as active target
    if (entity.type === 'location') {
      setActiveTarget({ type: 'location', id: entity.id, name: entity.name });
      const logEntry = createLogEntry(
        'Location aktiv',
        entity,
        'success',
        `${entity.name} ist jetzt die aktive Location`
      );
      setScanLog(prev => [logEntry, ...prev]);
      return;
    }

    // Handle case scan
    if (entity.type === 'case') {
      // If no active target and this is first scan, set case as active
      if (!activeTarget) {
        setActiveTarget({ type: 'case', id: entity.id, name: entity.name });
        const logEntry = createLogEntry(
          'Case aktiv',
          entity,
          'success',
          `${entity.name} ist jetzt das aktive Case`
        );
        setScanLog(prev => [logEntry, ...prev]);
        return;
      }

      // If active location, update case equipment location
      if (activeTarget.type === 'location') {
        await updateCaseLocation(entity, activeTarget);
        return;
      }
    }

    // Handle article scan - error in location mode
    if (entity.type === 'article') {
      const logEntry = createLogEntry(
        'Fehler',
        entity,
        'error',
        'Artikel können nicht umgebucht werden'
      );
      setScanLog(prev => [logEntry, ...prev]);
      showAlert('Fehler', 'Artikel können im Location-Modus nicht umgebucht werden. Nur Equipment und Cases.');
      return;
    }

    // Handle equipment scan
    if (entity.type === 'equipment') {
      if (!activeTarget) {
        // No active target - just show info
        const logEntry = createLogEntry(
          'Equipment gescannt',
          entity,
          'warning',
          'Kein aktives Ziel. Wählen Sie zuerst eine Location oder ein Case aus.'
        );
        setScanLog(prev => [logEntry, ...prev]);
        showAlert('Kein Ziel', 'Bitte wählen Sie zuerst eine Location oder ein Case aus, bevor Sie Equipment scannen.');
        return;
      }

      if (activeTarget.type === 'case') {
        await addEquipmentToCase(entity, activeTarget);
      } else {
        await updateEquipmentLocation(entity, activeTarget);
      }
    }
  };

  const updateCaseLocation = async (caseEntity: ScannedEntity, location: ActiveTarget) => {
    if (!supabase) return;

    try {
      // Get case equipment ID
      const { data: caseData, error: caseError } = await supabase
        .from('cases')
        .select('case_equipment')
        .eq('id', caseEntity.id)
        .single();

      if (caseError || !caseData?.case_equipment) {
        throw new Error('Case Equipment nicht gefunden');
      }

      // Check if already at this location
      const { data: equipData } = await supabase
        .from('equipments')
        .select('current_location')
        .eq('id', caseData.case_equipment)
        .single();

      if (equipData?.current_location === location.id) {
        const logEntry = createLogEntry(
          'Bereits vorhanden',
          caseEntity,
          'warning',
          `Case ist bereits an Location ${location.name}`
        );
        setScanLog(prev => [logEntry, ...prev]);
        showAlert('Bereits vorhanden', `Dieses Case ist bereits an Location "${location.name}".`);
        return;
      }

      // Update location
      const { error: updateError } = await supabase
        .from('equipments')
        .update({ current_location: location.id })
        .eq('id', caseData.case_equipment);

      if (updateError) throw updateError;

      const logEntry = createLogEntry(
        'Case umgebucht',
        caseEntity,
        'success',
        `Case → ${location.name}`
      );
      setScanLog(prev => [logEntry, ...prev]);
      showAlert('Erfolg', `Case "${caseEntity.name}" wurde zu Location "${location.name}" umgebucht.`);
    } catch (error) {
      console.error('Error updating case location:', error);
      const logEntry = createLogEntry(
        'Fehler',
        caseEntity,
        'error',
        'Fehler beim Umbuchen'
      );
      setScanLog(prev => [logEntry, ...prev]);
      showAlert('Fehler', 'Fehler beim Umbuchen des Cases.');
    }
  };

  const addEquipmentToCase = async (equipment: ScannedEntity, caseTarget: ActiveTarget) => {
    if (!supabase) return;

    try {
      // Get case contents
      const { data: caseData, error: caseError } = await supabase
        .from('cases')
        .select('contained_equipment_ids')
        .eq('id', caseTarget.id)
        .single();

      if (caseError) throw caseError;

      const containedIds = (caseData?.contained_equipment_ids || []) as string[];

      // Check if already in case
      if (containedIds.includes(equipment.id)) {
        const logEntry = createLogEntry(
          'Bereits im Case',
          equipment,
          'warning',
          `Equipment ist bereits in Case ${caseTarget.name}`
        );
        setScanLog(prev => [logEntry, ...prev]);
        showAlert('Bereits vorhanden', `Equipment "${equipment.name}" ist bereits in diesem Case.`);
        return;
      }

      // Add to case
      const { error: updateError } = await supabase
        .from('cases')
        .update({ 
          contained_equipment_ids: [...containedIds, equipment.id] 
        })
        .eq('id', caseTarget.id);

      if (updateError) throw updateError;

      const logEntry = createLogEntry(
        'Equipment → Case',
        equipment,
        'success',
        `${equipment.name} → ${caseTarget.name}`
      );
      setScanLog(prev => [logEntry, ...prev]);
      showAlert('Erfolg', `Equipment "${equipment.name}" wurde zu Case "${caseTarget.name}" hinzugefügt.`);
    } catch (error) {
      console.error('Error adding equipment to case:', error);
      const logEntry = createLogEntry(
        'Fehler',
        equipment,
        'error',
        'Fehler beim Hinzufügen zum Case'
      );
      setScanLog(prev => [logEntry, ...prev]);
      showAlert('Fehler', 'Fehler beim Hinzufügen des Equipments zum Case.');
    }
  };

  const updateEquipmentLocation = async (equipment: ScannedEntity, location: ActiveTarget) => {
    if (!supabase) return;

    try {
      // Check if already at this location
      if (equipment.details?.currentLocation === location.name) {
        const logEntry = createLogEntry(
          'Bereits vorhanden',
          equipment,
          'warning',
          `Equipment ist bereits an Location ${location.name}`
        );
        setScanLog(prev => [logEntry, ...prev]);
        showAlert('Bereits vorhanden', `Equipment "${equipment.name}" ist bereits an Location "${location.name}".`);
        return;
      }

      // Update location
      const { error: updateError } = await supabase
        .from('equipments')
        .update({ current_location: location.id })
        .eq('id', equipment.id);

      if (updateError) throw updateError;

      const logEntry = createLogEntry(
        'Equipment umgebucht',
        equipment,
        'success',
        `${equipment.name} → ${location.name}`
      );
      setScanLog(prev => [logEntry, ...prev]);
      showAlert('Erfolg', `Equipment "${equipment.name}" wurde zu Location "${location.name}" umgebucht.`);
    } catch (error) {
      console.error('Error updating equipment location:', error);
      const logEntry = createLogEntry(
        'Fehler',
        equipment,
        'error',
        'Fehler beim Umbuchen'
      );
      setScanLog(prev => [logEntry, ...prev]);
      showAlert('Fehler', 'Fehler beim Umbuchen des Equipments.');
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

  const handleScanModeChange = (mode: ScanMode) => {
    setScanMode(mode);
    setActiveTarget(null);
    setLastScannedEntity(null);
    setScanLog([]);
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
        <div className="scanner-content" style={{ padding: '1rem', paddingBottom: '300px' }}>
          <ScannerControls
            scanMode={scanMode}
            onScanModeChange={handleScanModeChange}
            activeTarget={activeTarget}
            onClearTarget={() => setActiveTarget(null)}
            onSelectTarget={() => setShowTargetSelector(true)}
          />

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

          {lastScannedEntity && scanMode === 'asset' && (
            <AssetDetailCard entity={lastScannedEntity} />
          )}
        </div>

        {/* Scan Log for Location Mode */}
        {scanMode === 'location' && scanLog.length > 0 && (
          <ScanLog entries={scanLog} />
        )}

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

        <TargetSelector
          isOpen={showTargetSelector}
          onDidDismiss={() => setShowTargetSelector(false)}
          onTargetSelected={setActiveTarget}
          companyId={company.id}
        />
      </IonContent>
    </IonPage>
  );
}
