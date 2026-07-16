import { useEffect, useState } from 'react';
import { 
  getActiveBiometricDevice, 
  getBiometricPunchRecords, 
  saveBiometricPunchRecords, 
  getBiometricSyncLogs, 
  saveBiometricSyncLogs, 
  saveBiometricDevices, 
  getBiometricDevices,
  getSettings
} from '../lib/storage';
import { getBiometricAdapter } from '../services/biometric/BiometricAdapterFactory';
import { BiometricSyncLog } from '../types';

export function useBiometricSync() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);

  useEffect(() => {
    const activeDevice = getActiveBiometricDevice();
    if (!activeDevice || !activeDevice.isActive) return;

    const MS_PER_MINUTE = 60 * 1000;
    const DEFAULT_SYNC_INTERVAL_MINS = 15;
    const intervalMs = (activeDevice.syncInterval || DEFAULT_SYNC_INTERVAL_MINS) * MS_PER_MINUTE;

    const performSync = async () => {
      setIsSyncing(true);
      const startTime = new Date().toISOString();
      const log: BiometricSyncLog = {
        id: `SYNC-AUTO-${Date.now()}`,
        deviceId: activeDevice.id,
        status: 'success',
        recordsSynced: 0,
        errors: [],
        startTime
      };

      try {
        const settings = getSettings();
        if (activeDevice.type === 'mock' && !settings.isMockMode) {
          throw new Error('Mock Mode must be enabled in Settings to use a Mock biometric device.');
        }

        const adapter = getBiometricAdapter(activeDevice.type);
        await adapter.connect(activeDevice);
        const result = await adapter.syncAttendance();

        // Guard: ensure records is an array
        if (!result || typeof result !== 'object') {
          throw new Error(`Invalid response from device: expected object, got ${typeof result}`);
        }
        
        if (!Array.isArray(result.records)) {
          throw new Error(
            `Invalid response shape: expected result.records to be an array, got ${typeof result.records}. ` +
            `Full response: ${JSON.stringify(result).slice(0, 300)}`
          );
        }

        const existingRecords = getBiometricPunchRecords();
        
        // Only save non-mock records to storage
        const realRecords = result.records.filter(r => !r.mock);
        const existingRealRecords = existingRecords.filter(r => !r.mock);

        const newRecords = realRecords.filter(r => 
          !existingRealRecords.some(e => e.id === r.id)
        );

        if (newRecords.length > 0) {
          const updatedRecords = [...existingRealRecords, ...newRecords];
          saveBiometricPunchRecords(updatedRecords);
        }

        log.recordsSynced = newRecords.length;
        log.endTime = new Date().toISOString();
        log.durationMs = Date.now() - new Date(startTime).getTime();

        const logs = getBiometricSyncLogs();
        logs.unshift(log);
        if (logs.length > 100) logs.length = 100;
        saveBiometricSyncLogs(logs);

        // Update active device's lastSync in storage
        const devices = getBiometricDevices();
        const updatedDevices = devices.map(d => 
          d.id === activeDevice.id ? { ...d, lastSync: new Date().toISOString() } : d
        );
        saveBiometricDevices(updatedDevices);

        setLastSync(new Date().toISOString());
      } catch (error: any) {
        console.error('Biometric sync failed:', error);
        log.status = 'failed';
        log.errors = [error.message || 'Unknown auto-sync error'];
        log.endTime = new Date().toISOString();

        const logs = getBiometricSyncLogs();
        logs.unshift(log);
        if (logs.length > 100) logs.length = 100;
        saveBiometricSyncLogs(logs);
      } finally {
        setIsSyncing(false);
      }
    };

    // Initial sync and set interval
    performSync();
    const interval = setInterval(performSync, intervalMs);

    return () => clearInterval(interval);
  }, []);

  return { isSyncing, lastSync };
}
