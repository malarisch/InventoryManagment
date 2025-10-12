"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  IonContent, 
  IonHeader, 
  IonTitle, 
  IonToolbar,
  IonCard,
  IonCardContent,
  IonItem,
  IonInput,
  IonButton,
  IonAlert,
  IonIcon,
  IonText,
  IonSpinner,
  IonApp,
  IonPage
} from '@ionic/react';
import { logIn, eye, eyeOff } from 'ionicons/icons';
import { createSupabaseClient } from '../lib/supabase/client';
import type { User } from '@supabase/supabase-js';

interface LoginComponentProps {
  onLogin: (user: User) => void;
}

export function LoginComponent({ onLogin }: LoginComponentProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const supabase = useMemo(() => createSupabaseClient(), []);

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      if (!supabase) return;
      
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        onLogin(user);
      }
    };
    checkUser();
  }, [onLogin, supabase]);

  const handleLogin = async () => {
    if (!supabase) {
      setAlertMessage('Konfigurationsfehler: Supabase nicht verfügbar.');
      setAlertOpen(true);
      return;
    }

    if (!email || !password) {
      setAlertMessage('Bitte geben Sie E-Mail und Passwort ein.');
      setAlertOpen(true);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setAlertMessage(`Anmeldung fehlgeschlagen: ${error.message}`);
        setAlertOpen(true);
      } else if (data.user) {
        onLogin(data.user);
      }
    } catch (_err) {
      setAlertMessage('Ein unerwarteter Fehler ist aufgetreten.');
      setAlertOpen(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonApp>
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Inventory Scanner</IonTitle>
          </IonToolbar>
        </IonHeader>
        
        <IonContent className="ion-padding">
          <div className="login-container">
            <IonCard>
              <IonCardContent>
                <div className="login-header">
                  <IonIcon icon={logIn} size="large" className="login-icon" />
                  <IonText>
                    <h2>Anmelden</h2>
                    <p>Melden Sie sich mit Ihren Zugangsdaten an.</p>
                  </IonText>
                </div>

                <IonItem>
                  <IonInput
                    type="email"
                    fill="outline"
                    label="E-Mail"
                    labelPlacement="floating"
                    value={email}
                    onIonInput={(e) => setEmail(e.detail.value!)}
                    disabled={loading}
                    clearInput
                  />
                </IonItem>

                <IonItem className="password-item">
                  <IonInput
                    type={showPassword ? 'text' : 'password'}
                    fill="outline"
                    label="Passwort"
                    labelPlacement="floating"
                    value={password}
                    onIonInput={(e) => setPassword(e.detail.value!)}
                    disabled={loading}
                  />
                  <IonButton
                    fill="clear"
                    slot="end"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <IonIcon icon={showPassword ? eyeOff : eye} />
                  </IonButton>
                </IonItem>

                <IonButton
                  expand="block"
                  onClick={handleLogin}
                  disabled={loading || !email || !password}
                  className="login-button"
                >
                  {loading ? (
                    <>
                      <IonSpinner name="circular" />
                      &nbsp; Anmelden...
                    </>
                  ) : (
                    'Anmelden'
                  )}
                </IonButton>
              </IonCardContent>
            </IonCard>
          </div>

          <IonAlert
            isOpen={alertOpen}
            onDidDismiss={() => setAlertOpen(false)}
            header="Hinweis"
            message={alertMessage}
            buttons={['OK']}
          />
        </IonContent>

        <style jsx>{`
          .login-container {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 50vh;
            padding: 20px;
          }
          
          .login-header {
            text-align: center;
            margin-bottom: 2rem;
          }
          
          .login-icon {
            margin-bottom: 1rem;
            color: var(--ion-color-primary);
          }
          
          .password-item {
            margin: 1rem 0;
          }
          
          .login-button {
            margin-top: 2rem;
          }
        `}</style>
      </IonPage>
    </IonApp>
  );
}