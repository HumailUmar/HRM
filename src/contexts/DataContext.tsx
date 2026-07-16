import React, { createContext, useContext, useEffect, useState } from 'react';
import { DataService } from '../services/DataService';
import { AppSettings } from '../types';

const DataContext = createContext<DataService | null>(null);

export const DataProvider: React.FC<{ settings: AppSettings; children: React.ReactNode }> = ({ settings, children }) => {
  const [service, setService] = useState<DataService>(() => new DataService(settings));

  useEffect(() => {
    // Recreate the service when settings change (e.g., storageType changes)
    setService(new DataService(settings));
  }, [settings]);

  return <DataContext.Provider value={service}>{children}</DataContext.Provider>;
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within DataProvider');
  return context;
};
