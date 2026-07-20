import { logger } from '../../lib/logger';
import { IBiometricAdapter } from './IBiometricAdapter';
import { BiometricPunchRecord, BiometricTestResult, BiometricDeviceConfig } from '../../types';

export class MockBiometricAdapter implements IBiometricAdapter {
  private connected = false;
  private config: BiometricDeviceConfig | null = null;

  async connect(config: BiometricDeviceConfig): Promise<boolean> {
    this.config = config;
    this.connected = true;
    logger.info('🔵 Mock Biometric Device connected');
    return true;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    this.config = null;
    logger.info('🔴 Mock Biometric Device disconnected');
  }

  isConnected(): boolean {
    return this.connected;
  }

  async testConnection(config: BiometricDeviceConfig): Promise<BiometricTestResult> {
    await this.simulateLatency(800);
    return {
      success: true,
      message: `Successfully connected to Mock Device (${config.name})`,
      deviceInfo: {
        model: 'Mock Biometric V1.0',
        firmware: '2.1.0',
        serialNumber: 'MOCK-001',
        totalUsers: Math.floor(Math.random() * 50) + 10
      }
    };
  }

  async fetchPunches(startDate?: string, endDate?: string): Promise<BiometricPunchRecord[]> {
    await this.simulateLatency(500);
    const punches: BiometricPunchRecord[] = [];
    const numPunches = Math.floor(Math.random() * 10) + 5;
    const employeeNames = ['John Doe', 'Jane Smith', 'Bob Johnson', 'Alice Williams', 'Charlie Brown'];
    
    for (let i = 0; i < numPunches; i++) {
      const date = new Date();
      date.setHours(date.getHours() - i * 2);
      punches.push({
        id: `MOCK-PUNCH-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
        deviceId: this.config?.id || 'mock-device',
        employeeId: `EMP-${String(Math.floor(Math.random() * 5) + 1).padStart(3, '0')}`,
        employeeName: employeeNames[i % 5],
        punchTime: date.toISOString(),
        punchType: i % 2 === 0 ? 'check-in' : 'check-out',
        verified: Math.random() > 0.1,
        deviceName: this.config?.name || 'Mock Device (Demo)',
        createdAt: date.toISOString(),
        mock: true, // <-- CRITICAL: mark as mock data
      });
    }
    return punches;
  }

  async fetchPunchesByEmployee(employeeId: string, startDate?: string, endDate?: string): Promise<BiometricPunchRecord[]> {
    const all = await this.fetchPunches(startDate, endDate);
    return all.filter(p => p.employeeId === employeeId);
  }

  async fetchUsers(): Promise<{ id: string; name: string; employeeId?: string }[]> {
    await this.simulateLatency(300);
    return [
      { id: '1', name: 'John Doe', employeeId: 'EMP-001' },
      { id: '2', name: 'Jane Smith', employeeId: 'EMP-002' },
      { id: '3', name: 'Bob Johnson', employeeId: 'EMP-003' },
    ];
  }

  async syncUsers(employees: any[]): Promise<{ synced: number; failed: number }> {
    await this.simulateLatency(1000);
    return { synced: employees.length, failed: 0 };
  }

  async getDeviceInfo(): Promise<{ model: string; firmware: string; serialNumber: string; totalUsers: number }> {
    return {
      model: 'Mock Biometric V1.0',
      firmware: '2.1.0',
      serialNumber: 'MOCK-001',
      totalUsers: 42
    };
  }

  async ping(): Promise<boolean> {
    await this.simulateLatency(100);
    return this.connected;
  }

  async syncAttendance(): Promise<{ records: BiometricPunchRecord[]; count: number; isMock?: boolean }> {
    const records = await this.fetchPunches();
    return { records, count: records.length, isMock: true };
  }

  private simulateLatency(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
