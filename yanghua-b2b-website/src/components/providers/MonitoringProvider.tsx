'use client';

import { useEffect } from 'react';
import { initializeMonitoring } from '@/lib/monitoring';

interface MonitoringProviderProps {
  children: React.ReactNode;
}

export function MonitoringProvider({ children }: MonitoringProviderProps) {
  useEffect(() => {
    // Initialize monitoring on client side
    if (typeof window !== 'undefined') {
      initializeMonitoring();
    }
  }, []);

  return <>{children}</>;
}