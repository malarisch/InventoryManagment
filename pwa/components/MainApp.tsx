"use client";

import React, { useState, useEffect } from 'react';
import { setupIonicReact } from '@ionic/react';
import { LoginComponent } from './LoginComponent';
import { ScannerComponent } from './ScannerComponent';
import type { User } from '@supabase/supabase-js';

export function MainApp() {
  const [user, setUser] = useState<User | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Initialize Ionic only on client side
    setupIonicReact({});
    setIsInitialized(true);
  }, []);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    setUser(null);
  };

  if (!isInitialized) {
    return null; // or a loading spinner
  }

  if (!user) {
    return <LoginComponent onLogin={handleLogin} />;
  }

  return <ScannerComponent user={user} onLogout={handleLogout} />;
}