"use client";
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

interface JobNameContextValue {
  name: string;
  setName: (name: string) => void;
}

const JobNameContext = createContext<JobNameContextValue | null>(null);

export function JobNameProvider({ initialName, children }: { initialName: string; children: React.ReactNode }) {
  const [name, setName] = useState(initialName);
  const update = useCallback((n: string) => setName(n), []);
  useEffect(() => {
    function listener(e: Event) {
      const ce = e as CustomEvent<{ id?: number; name?: string }>;
      if (ce.detail?.name) setName(ce.detail.name);
    }
    // Debug log to confirm listener attached
    console.log('[JobNameProvider] mount initialName=', initialName);
    window.addEventListener('job:name:updated', listener as EventListener);
    return () => window.removeEventListener('job:name:updated', listener as EventListener);
  }, [initialName]);
  return <JobNameContext.Provider value={{ name, setName: update }}>{children}</JobNameContext.Provider>;
}

export function useJobName() {
  const ctx = useContext(JobNameContext);
  if (!ctx) throw new Error('useJobName must be used within JobNameProvider');
  return ctx;
}

export function JobNameHeading(props: { fallback: string; 'data-testid'?: string }) {
  const { name } = useJobName();
  return <div data-testid={props['data-testid']} className="font-semibold leading-none tracking-tight">{name || props.fallback}</div>;
}
