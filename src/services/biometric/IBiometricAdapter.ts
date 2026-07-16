import { BiometricPunchRecord, BiometricTestResult, BiometricDeviceConfig } from '../../types';

export interface IBiometricAdapter {
  // Connection
  connect(config: BiometricDeviceConfig): Promise<boolean>;
  disconnect(): Promise<void>;
  testConnection(config: BiometricDeviceConfig): Promise<BiometricTestResult>;
  isConnected(): boolean;

  // Punch Records
  fetchPunches(startDate?: string, endDate?: string): Promise<BiometricPunchRecord[]>;
  fetchPunchesByEmployee(employeeId: string, startDate?: string, endDate?: string): Promise<BiometricPunchRecord[]>;
  
  // Users
  fetchUsers(): Promise<{ id: string; name: string; employeeId?: string }[]>;
  syncUsers(employees: any[]): Promise<{ synced: number; failed: number }>;

  // Health
  getDeviceInfo(): Promise<{ model: string; firmware: string; serialNumber: string; totalUsers: number }>;
  ping(): Promise<boolean>;

  // Sync
  syncAttendance(): Promise<{ records: BiometricPunchRecord[]; count: number; isMock?: boolean }>;
}

export const BiometricDeviceTypeNames: Record<string, string> = {
  'zkteco': 'ZKTeco',
  'biostar': 'BioStar',
  'hikvision': 'Hikvision',
  'mock': 'Mock (Demo)',
  'generic': 'Generic HTTP API'
};
