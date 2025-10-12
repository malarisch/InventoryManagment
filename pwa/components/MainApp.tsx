"use client";

import React, { useState, useEffect } from 'react';
import { setupIonicReact } from '@ionic/react';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';
import { LoginComponent } from './LoginComponent';
import { ScannerComponent } from './ScannerComponent';
import { CompanySelector } from './CompanySelector';
import type { User } from '@supabase/supabase-js';

interface Company {
  id: string;
  name: string;
  description: string | null;
}

export function MainApp() {
  const [user, setUser] = useState<User | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [showCompanySelector, setShowCompanySelector] = useState(false);

  useEffect(() => {
    // Initialize Ionic only on client side
    setupIonicReact({
      mode: 'ios' // Force iOS mode for consistent styling
    });
    
    // Configure Status Bar for iOS
    if (Capacitor.isNativePlatform()) {
      StatusBar.setStyle({ style: Style.Dark }).catch(console.error);
      StatusBar.setOverlaysWebView({ overlay: true }).catch(console.error);
    }
    
    setIsInitialized(true);
  }, []);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    // Show company selector after login
    setShowCompanySelector(true);
  };

  const handleLogout = () => {
    setUser(null);
    setSelectedCompany(null);
  };

  const handleCompanySelected = (company: Company) => {
    setSelectedCompany(company);
    // Save selected company to localStorage for persistence
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedCompanyId', company.id);
    }
  };

  // Load saved company on mount
  useEffect(() => {
    if (user && typeof window !== 'undefined') {
      const savedCompanyId = localStorage.getItem('selectedCompanyId');
      if (savedCompanyId && !selectedCompany) {
        // Company will be loaded by CompanySelector
        setShowCompanySelector(true);
      }
    }
  }, [user, selectedCompany]);

  if (!isInitialized) {
    return null; // or a loading spinner
  }

  if (!user) {
    return <LoginComponent onLogin={handleLogin} />;
  }

  return (
    <>
      <CompanySelector
        isOpen={showCompanySelector}
        onDidDismiss={() => setShowCompanySelector(false)}
        onCompanySelected={handleCompanySelected}
        currentCompanyId={selectedCompany?.id}
      />
      
      {selectedCompany ? (
        <ScannerComponent 
          user={user} 
          company={selectedCompany}
          onLogout={handleLogout}
          onChangeCompany={() => setShowCompanySelector(true)}
        />
      ) : (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <p>Bitte wählen Sie eine Firma aus...</p>
        </div>
      )}
    </>
  );
}