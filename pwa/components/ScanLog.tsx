"use client";

import React from 'react';
import {
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonList,
  IonItem,
  IonLabel,
  IonBadge,
  IonIcon
} from '@ionic/react';
import { checkmarkCircle, alertCircle, warning } from 'ionicons/icons';
import type { ScanLogEntry } from '../lib/scanner-types';

interface ScanLogProps {
  entries: ScanLogEntry[];
}

export function ScanLog({ entries }: ScanLogProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return checkmarkCircle;
      case 'error': return alertCircle;
      case 'warning': return warning;
      default: return checkmarkCircle;
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

  if (entries.length === 0) {
    return null;
  }

  return (
    <IonCard style={{ 
      position: 'fixed', 
      bottom: '80px', 
      left: '1rem', 
      right: '1rem', 
      margin: 0,
      maxHeight: '200px',
      overflow: 'auto'
    }}>
      <IonCardHeader>
        <IonCardTitle style={{ fontSize: '1rem' }}>Scan-Log</IonCardTitle>
      </IonCardHeader>
      <IonCardContent style={{ padding: '0' }}>
        <IonList>
          {entries.slice().reverse().slice(0, 5).map((entry) => (
            <IonItem key={entry.id} lines="none">
              <IonIcon 
                icon={getStatusIcon(entry.status)} 
                color={getStatusColor(entry.status)}
                slot="start" 
              />
              <IonLabel>
                <h3>{entry.action}</h3>
                <p>{entry.message}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--ion-color-medium)' }}>
                  {entry.timestamp.toLocaleTimeString('de-DE')}
                </p>
              </IonLabel>
              <IonBadge 
                color={getStatusColor(entry.status)}
                slot="end"
              >
                {entry.entity.type}
              </IonBadge>
            </IonItem>
          ))}
        </IonList>
      </IonCardContent>
    </IonCard>
  );
}
