import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { DataService } from '../services/DataService';
import { AppSettings } from '../types';

const DataContext = createContext<DataService | null>(null);

export const DataProvider: React.FC<{ settings: AppSettings; children: React.ReactNode }> = ({ settings, children }) => {
  const service = useMemo(() => new DataService(settings), [settings.storageType, settings.isMockMode, settings.googleSheets?.spreadsheetId, settings.mysqlHost, settings.mysqlDatabase, settings.postgresHost, settings.postgresDatabase]);

  return <DataContext.Provider value={service}>{children}</DataContext.Provider>;
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within DataProvider');
  return context;
};
