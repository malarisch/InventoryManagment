"use client";

import React, { useState, useEffect } from 'react';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonRadioGroup,
  IonRadio,
  IonButton,
  IonButtons,
  IonSegment,
  IonSegmentButton,
  IonIcon,
  IonSpinner,
  IonText,
  IonSearchbar
} from '@ionic/react';
import { location, cube, checkmark } from 'ionicons/icons';
import { createSupabaseClient } from '../lib/supabase/client';
import type { ActiveTarget } from '../lib/scanner-types';

interface TargetSelectorProps {
  isOpen: boolean;
  onDidDismiss: () => void;
  onTargetSelected: (target: ActiveTarget) => void;
  companyId: string;
}

type TargetType = 'location' | 'case';

interface Location {
  id: string;
  name: string;
  description: string | null;
}

interface Case {
  id: string;
  name: string | null;
  case_equipment: {
    name: string;
  } | null;
}

export function TargetSelector({ 
  isOpen, 
  onDidDismiss, 
  onTargetSelected,
  companyId
}: TargetSelectorProps) {
  const [targetType, setTargetType] = useState<TargetType>('location');
  const [locations, setLocations] = useState<Location[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  
  const supabase = createSupabaseClient();

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, targetType, companyId]);

  const loadData = async () => {
    if (!supabase) return;
    
    try {
      setLoading(true);
      setSelectedId('');

      if (targetType === 'location') {
        const { data, error } = await supabase
          .from('locations')
          .select('id, name, description')
          .eq('company_id', companyId)
          .order('name');

        if (error) throw error;
        setLocations(data || []);
      } else {
        const { data, error } = await supabase
          .from('cases')
          .select(`
            id, 
            name,
            case_equipment:equipments!cases_case_equipment_fkey(name)
          `)
          .eq('company_id', companyId)
          .order('name');

        if (error) throw error;
        
        // Transform data to match Case type
        const transformedCases = (data || []).map(c => ({
          id: c.id,
          name: c.name,
          case_equipment: Array.isArray(c.case_equipment) && c.case_equipment.length > 0
            ? c.case_equipment[0]
            : null
        }));
        
        setCases(transformedCases);
      }
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (!selectedId) return;

    if (targetType === 'location') {
      const loc = locations.find(l => l.id === selectedId);
      if (loc) {
        onTargetSelected({ type: 'location', id: loc.id, name: loc.name });
      }
    } else {
      const cas = cases.find(c => c.id === selectedId);
      if (cas) {
        const name = cas.name || cas.case_equipment?.name || 'Unbenanntes Case';
        onTargetSelected({ type: 'case', id: cas.id, name });
      }
    }
    onDidDismiss();
  };

  const filteredLocations = locations.filter(loc => 
    loc.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const filteredCases = cases.filter(cas => {
    const name = cas.name || cas.case_equipment?.name || '';
    return name.toLowerCase().includes(searchText.toLowerCase());
  });

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onDidDismiss}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Ziel auswählen</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onDidDismiss}>Abbrechen</IonButton>
          </IonButtons>
        </IonToolbar>
        <IonToolbar>
          <IonSegment 
            value={targetType} 
            onIonChange={(e) => setTargetType(e.detail.value as TargetType)}
          >
            <IonSegmentButton value="location">
              <IonIcon icon={location} />
              <IonLabel>Location</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="case">
              <IonIcon icon={cube} />
              <IonLabel>Case</IonLabel>
            </IonSegmentButton>
          </IonSegment>
        </IonToolbar>
      </IonHeader>
      
      <IonContent>
        <IonSearchbar
          value={searchText}
          onIonInput={(e) => setSearchText(e.detail.value || '')}
          placeholder={`${targetType === 'location' ? 'Location' : 'Case'} suchen...`}
        />

        {loading ? (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '200px' 
          }}>
            <IonSpinner />
          </div>
        ) : (
          <>
            <IonList>
              <IonRadioGroup 
                value={selectedId} 
                onIonChange={(e) => setSelectedId(e.detail.value)}
              >
                {targetType === 'location' ? (
                  filteredLocations.length > 0 ? (
                    filteredLocations.map((loc) => (
                      <IonItem key={loc.id}>
                        <IonLabel>
                          <h2>{loc.name}</h2>
                          {loc.description && <p>{loc.description}</p>}
                        </IonLabel>
                        <IonRadio slot="start" value={loc.id} />
                      </IonItem>
                    ))
                  ) : (
                    <div style={{ padding: '2rem', textAlign: 'center' }}>
                      <IonText color="medium">
                        <p>Keine Locations gefunden</p>
                      </IonText>
                    </div>
                  )
                ) : (
                  filteredCases.length > 0 ? (
                    filteredCases.map((cas) => (
                      <IonItem key={cas.id}>
                        <IonLabel>
                          <h2>{cas.name || cas.case_equipment?.name || 'Unbenannt'}</h2>
                          {cas.case_equipment && <p>Equipment: {cas.case_equipment.name}</p>}
                        </IonLabel>
                        <IonRadio slot="start" value={cas.id} />
                      </IonItem>
                    ))
                  ) : (
                    <div style={{ padding: '2rem', textAlign: 'center' }}>
                      <IonText color="medium">
                        <p>Keine Cases gefunden</p>
                      </IonText>
                    </div>
                  )
                )}
              </IonRadioGroup>
            </IonList>

            <div style={{ padding: '1rem' }}>
              <IonButton 
                expand="block" 
                onClick={handleConfirm}
                disabled={!selectedId}
              >
                <IonIcon icon={checkmark} slot="start" />
                Auswählen
              </IonButton>
            </div>
          </>
        )}
      </IonContent>
    </IonModal>
  );
}
