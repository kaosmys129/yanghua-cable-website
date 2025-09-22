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
      // Only initialize monitoring in development or when explicitly enabled
      const isProduction = process.env.NODE_ENV === 'production';
      const monitoringEnabled = process.env.NEXT_PUBLIC_MONITORING_ENABLED === 'true';
      
      if (!isProduction || monitoringEnabled) {
        initializeMonitoring();
      }
    }
  }, []);

  return <>{children}</>;
}