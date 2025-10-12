"use client";

import React from 'react';
import {
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonIcon,
  IonBadge,
  IonLabel,
  IonItem,
  IonList
} from '@ionic/react';
import { cube, location, documentText, pricetag } from 'ionicons/icons';
import type { ScannedEntity } from '../lib/scanner-types';

interface AssetDetailCardProps {
  entity: ScannedEntity;
}

export function AssetDetailCard({ entity }: AssetDetailCardProps) {
  const getEntityIcon = () => {
    switch (entity.type) {
      case 'equipment': return cube;
      case 'case': return cube;
      case 'location': return location;
      case 'article': return documentText;
      default: return pricetag;
    }
  };

  const getEntityColor = () => {
    switch (entity.type) {
      case 'equipment': return 'primary';
      case 'case': return 'secondary';
      case 'location': return 'tertiary';
      case 'article': return 'warning';
      default: return 'medium';
    }
  };

  const getEntityLabel = () => {
    switch (entity.type) {
      case 'equipment': return 'Equipment';
      case 'case': return 'Case';
      case 'location': return 'Standort';
      case 'article': return 'Artikel';
      default: return 'Unbekannt';
    }
  };

  return (
    <IonCard>
      <IonCardHeader>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <IonIcon icon={getEntityIcon()} color={getEntityColor()} size="large" />
          <div style={{ flex: 1 }}>
            <IonCardTitle>{entity.name}</IonCardTitle>
            <IonBadge color={getEntityColor()}>{getEntityLabel()}</IonBadge>
          </div>
        </div>
      </IonCardHeader>

      <IonCardContent>
        <IonList>
          <IonItem>
            <IonLabel>
              <h3>Code</h3>
              <p>{entity.code}</p>
            </IonLabel>
          </IonItem>

          {entity.details?.article && (
            <IonItem>
              <IonIcon icon={documentText} slot="start" />
              <IonLabel>
                <h3>Artikel</h3>
                <p>{entity.details.article}</p>
              </IonLabel>
            </IonItem>
          )}

          {entity.details?.currentLocation && (
            <IonItem>
              <IonIcon icon={location} slot="start" />
              <IonLabel>
                <h3>Aktueller Standort</h3>
                <p>{entity.details.currentLocation}</p>
              </IonLabel>
            </IonItem>
          )}

          {entity.details?.caseEquipment && (
            <IonItem>
              <IonIcon icon={cube} slot="start" />
              <IonLabel>
                <h3>Case Equipment</h3>
                <p>{entity.details.caseEquipment}</p>
              </IonLabel>
            </IonItem>
          )}

          {entity.details?.description && (
            <IonItem>
              <IonLabel>
                <h3>Beschreibung</h3>
                <p>{entity.details.description}</p>
              </IonLabel>
            </IonItem>
          )}
        </IonList>
      </IonCardContent>
    </IonCard>
  );
}
