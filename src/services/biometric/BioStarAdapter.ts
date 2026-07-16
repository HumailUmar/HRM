import { logger } from '../../lib/logger';
import { IBiometricAdapter } from './IBiometricAdapter';
import { BiometricPunchRecord, BiometricTestResult, BiometricDeviceConfig } from '../../types';

export class BioStarAdapter implements IBiometricAdapter {
  private connected = false;
  private config: BiometricDeviceConfig | null = null;

  private async request<T>(endpoint: string, body: any): Promise<T> {
    const response = await fetch(`/api/biostar/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || error.message || 'Request failed');
    }
    return response.json();
  }

  async connect(config: BiometricDeviceConfig): Promise<boolean> {
    this.config = config;
    this.connected = true;
    logger.info(`🔵 BioStar Device connected: ${config.host}:${config.port}`);
    return true;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    this.config = null;
    logger.info('🔴 BioStar Device disconnected');
  }

  isConnected(): boolean {
    return this.connected;
  }

  async testConnection(config: BiometricDeviceConfig): Promise<BiometricTestResult> {
    try {
      const result = await this.request<{ success: boolean; message: string; deviceInfo?: any }>('test', {
        host: config.host,
        port: config.port,
        username: config.username,
        password: config.password,
        apiKey: config.apiKey
      });
      return {
        success: result.success,
        message: result.message,
        deviceInfo: result.deviceInfo
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Connection failed',
        error: error.message
      };
    }
  }

  async fetchPunches(startDate?: string, endDate?: string): Promise<BiometricPunchRecord[]> {
    if (!this.config) throw new Error('Device not configured');
    const result = await this.request<{ success: boolean; records: BiometricPunchRecord[]; count: number }>('punches', {
      host: this.config.host,
      port: this.config.port,
      username: this.config.username,
      password: this.config.password,
      apiKey: this.config.apiKey,
      startDate,
      endDate
    });
    
    if (!result || typeof result !== 'object' || !Array.isArray(result.records)) {
      throw new Error(`Invalid response from BioStar device: expected records array, got ${JSON.stringify(result)}`);
    }

    return result.records;
  }

  async fetchPunchesByEmployee(employeeId: string, startDate?: string, endDate?: string): Promise<BiometricPunchRecord[]> {
    const all = await this.fetchPunches(startDate, endDate);
    return all.filter(p => p.employeeId === employeeId);
  }

  async fetchUsers(): Promise<{ id: string; name: string; employeeId?: string }[]> {
    if (!this.config) throw new Error('Device not configured');
    try {
      const result = await this.request<{ success: boolean; users: { id: string; name: string; employeeId?: string }[] }>('users', {
        host: this.config.host,
        port: this.config.port,
        username: this.config.username,
        password: this.config.password,
        apiKey: this.config.apiKey
      });
      return result.users || [];
    } catch (error) {
      logger.error('Failed to fetch BioStar users:', error);
    }
    return [];
  }

  async syncUsers(employees: any[]): Promise<{ synced: number; failed: number }> {
    if (!this.config) throw new Error('Device not configured');
    try {
      const result = await this.request<{ success: boolean; synced: number; failed: number }>('sync-users', {
        host: this.config.host,
        port: this.config.port,
        username: this.config.username,
        password: this.config.password,
        apiKey: this.config.apiKey,
        employees
      });
      return { synced: result.synced || 0, failed: result.failed || 0 };
    } catch (error) {
      logger.error('Failed to sync BioStar users:', error);
    }
    return { synced: employees.length, failed: 0 };
  }

  async getDeviceInfo(): Promise<{ model: string; firmware: string; serialNumber: string; totalUsers: number }> {
    if (!this.config) throw new Error('Device not configured');
    const result = await this.testConnection(this.config);
    if (result.success && result.deviceInfo) {
      return result.deviceInfo;
    }
    return { model: 'BioStar', firmware: 'Unknown', serialNumber: 'Unknown', totalUsers: 0 };
  }

  async ping(): Promise<boolean> {
    if (!this.config) return false;
    try {
      const result = await this.testConnection(this.config);
      return result.success;
    } catch {
      return false;
    }
  }

  async syncAttendance(): Promise<{ records: BiometricPunchRecord[]; count: number }> {
    const records = await this.fetchPunches();
    return { records, count: records.length };
  }
}
