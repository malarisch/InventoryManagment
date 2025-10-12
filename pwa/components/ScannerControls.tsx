"use client";

import React from 'react';
import {
  IonCard,
  IonCardContent,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonIcon,
  IonButton,
  IonChip,
  IonText
} from '@ionic/react';
import { qrCode, location, cube, close } from 'ionicons/icons';
import type { ScanMode, ActiveTarget } from '../lib/scanner-types';

interface ScannerControlsProps {
  scanMode: ScanMode;
  onScanModeChange: (mode: ScanMode) => void;
  activeTarget: ActiveTarget | null;
  onClearTarget: () => void;
  onSelectTarget: () => void;
}

export function ScannerControls({
  scanMode,
  onScanModeChange,
  activeTarget,
  onClearTarget,
  onSelectTarget
}: ScannerControlsProps) {
  return (
    <IonCard>
      <IonCardContent>
        <div style={{ marginBottom: '1rem' }}>
          <IonText>
            <h3>Scanner-Modus</h3>
          </IonText>
          <IonSegment 
            value={scanMode} 
            onIonChange={(e) => onScanModeChange(e.detail.value as ScanMode)}
          >
            <IonSegmentButton value="asset">
              <IonIcon icon={qrCode} />
              <IonLabel>Asset</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="location">
              <IonIcon icon={location} />
              <IonLabel>Location</IonLabel>
            </IonSegmentButton>
          </IonSegment>
        </div>

        {scanMode === 'location' && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            flexWrap: 'wrap'
          }}>
            <IonText color="medium">
              <small>Aktives Ziel:</small>
            </IonText>
            {activeTarget ? (
              <IonChip color={activeTarget.type === 'location' ? 'tertiary' : 'secondary'}>
                <IonIcon icon={activeTarget.type === 'location' ? location : cube} />
                <IonLabel>{activeTarget.name}</IonLabel>
                <IonIcon icon={close} onClick={onClearTarget} />
              </IonChip>
            ) : (
              <IonButton size="small" fill="outline" onClick={onSelectTarget}>
                Ziel auswählen
              </IonButton>
            )}
          </div>
        )}
      </IonCardContent>
    </IonCard>
  );
}
