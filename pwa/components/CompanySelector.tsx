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
  IonIcon,
  IonText,
  IonSpinner
} from '@ionic/react';
import { checkmark, business } from 'ionicons/icons';
import { createSupabaseClient } from '../lib/supabase/client';

interface Company {
  id: string;
  name: string;
  description: string | null;
}

interface CompanySelectorProps {
  isOpen: boolean;
  onDidDismiss: () => void;
  onCompanySelected: (company: Company) => void;
  currentCompanyId?: string;
}

export function CompanySelector({ 
  isOpen, 
  onDidDismiss, 
  onCompanySelected,
  currentCompanyId 
}: CompanySelectorProps) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedId, setSelectedId] = useState<string>(currentCompanyId || '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const supabase = createSupabaseClient();

  useEffect(() => {
    if (isOpen) {
      loadCompanies();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const loadCompanies = async () => {
    if (!supabase) {
      setError('Datenbankverbindung nicht verfügbar');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);

      // Get user's companies
      const { data: userCompanies, error: companiesError } = await supabase
        .from('users_companies')
        .select(`
          company_id,
          companies!inner (
            id,
            name,
            description
          )
        `);

      if (companiesError) throw companiesError;

      const companyList = (userCompanies || [])
        .map(uc => {
          const comp = uc.companies as unknown as Company | Company[];
          return Array.isArray(comp) ? comp[0] : comp;
        })
        .filter((c): c is Company => c !== null && c !== undefined);

      setCompanies(companyList || []);

      if (!currentCompanyId && companyList.length > 0) {
        setSelectedId(companyList[0].id);
      }
    } catch (err) {
      console.error('Error loading companies:', err);
      setError('Fehler beim Laden der Firmen');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    const selected = companies.find(c => c.id === selectedId);
    if (selected) {
      onCompanySelected(selected);
      onDidDismiss();
    }
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onDidDismiss}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Firma auswählen</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onDidDismiss}>Abbrechen</IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      
      <IonContent>
        {loading ? (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100%' 
          }}>
            <IonSpinner />
          </div>
        ) : error ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <IonText color="danger">
              <p>{error}</p>
            </IonText>
          </div>
        ) : companies.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <IonIcon icon={business} size="large" color="medium" />
            <IonText color="medium">
              <h3>Keine Firmen gefunden</h3>
              <p>Sie sind noch keiner Firma zugeordnet.</p>
            </IonText>
          </div>
        ) : (
          <>
            <IonList>
              <IonRadioGroup 
                value={selectedId} 
                onIonChange={(e) => setSelectedId(e.detail.value)}
              >
                {companies.map((company) => (
                  <IonItem key={company.id}>
                    <IonLabel>
                      <h2>{company.name}</h2>
                      {company.description && (
                        <p>{company.description}</p>
                      )}
                    </IonLabel>
                    <IonRadio slot="start" value={company.id} />
                  </IonItem>
                ))}
              </IonRadioGroup>
            </IonList>

            <div style={{ padding: '1rem' }}>
              <IonButton 
                expand="block" 
                onClick={handleConfirm}
                disabled={!selectedId}
              >
                <IonIcon icon={checkmark} slot="start" />
                Bestätigen
              </IonButton>
            </div>
          </>
        )}
      </IonContent>
    </IonModal>
  );
}
