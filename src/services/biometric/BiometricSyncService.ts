import { logger } from '../../lib/logger';
import { Employee, AttendanceRecord, BiometricDeviceConfig } from '../../types';
import { getEmployees, saveAttendance, getAttendance } from '../../lib/storage';
import { getActiveBiometricDevice } from '../../lib/storage';
import { getBiometricAdapter } from './BiometricAdapterFactory';

export class BiometricSyncService {
  
  /**
   * Sync attendance from biometric device and match by punch code
   */
  async syncAttendanceByPunchCode(): Promise<{
    synced: number;
    failed: number;
    errors: string[];
  }> {
    const device = getActiveBiometricDevice();
    if (!device) {
      return { synced: 0, failed: 0, errors: ['No active biometric device configured'] };
    }

    const employees = getEmployees();
    const existingAttendance = getAttendance();

    // Create a map of punchCode -> employeeId
    const punchCodeMap = new Map<string, string>();
    employees.forEach(emp => {
      const code = emp.employment.punchCode || emp.id; // Fallback to employee ID
      punchCodeMap.set(code, emp.id);
    });

    const adapter = getBiometricAdapter(device.type);
    await adapter.connect(device);
    
    const result = await adapter.syncAttendance();
    let synced = 0;
    let failed = 0;
    const errors: string[] = [];

    // Process each punch record
    for (const punch of result.records) {
      // Use punch.employeeId as the punch code to look up
      const punchCode = punch.employeeId;
      const employeeId = punchCodeMap.get(punchCode);
      
      if (employeeId) {
        // Check if this punch already exists
        const exists = existingAttendance.some(a => 
          a.employeeId === employeeId && 
          a.date === punch.punchTime.split('T')[0] &&
          a.checkIn === new Date(punch.punchTime).toTimeString().slice(0, 5)
        );
        
        if (!exists) {
          // Create attendance record
          const date = punch.punchTime.split('T')[0];
          const time = new Date(punch.punchTime).toTimeString().slice(0, 5);
          const newRecord: AttendanceRecord = {
            id: `ATT-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            employeeId: employeeId,
            employeeName: punch.employeeName || employees.find(e => e.id === employeeId)?.name || 'Unknown',
            date: date,
            checkIn: punch.punchType === 'check-in' ? time : '',
            checkOut: punch.punchType === 'check-out' ? time : '',
            lateMinutes: 0,
            earlyDepartureMinutes: 0,
            status: 'Full Day',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          existingAttendance.push(newRecord);
          synced++;
        }
      } else {
        failed++;
        errors.push(`No employee found for punch code: ${punchCode}`);
      }
    }

    // Save updated attendance
    saveAttendance(existingAttendance);
    
    return { synced, failed, errors };
  }

  /**
   * Push employees to biometric device (sync punch codes)
   */
  async syncEmployeesToDevice(employees: Employee[]): Promise<{
    synced: number;
    failed: number;
    errors: string[];
  }> {
    const device = getActiveBiometricDevice();
    if (!device) {
      return { synced: 0, failed: 0, errors: ['No active biometric device configured'] };
    }

    // Filter employees with punch codes or use ID as fallback
    const employeesToSync = employees.map(emp => ({
      id: emp.employment.punchCode || emp.id,
      name: emp.name,
      employeeId: emp.employment.punchCode || emp.id
    }));

    const adapter = getBiometricAdapter(device.type);
    await adapter.connect(device);
    
    const result = await adapter.syncUsers(employeesToSync);
    
    const errors: string[] = [];
    if (result.failed > 0) {
      errors.push(`Failed to sync ${result.failed} employees to device`);
    }
    
    return {
      synced: result.synced,
      failed: result.failed,
      errors
    };
  }

  /**
   * Sync a single employee to device on create/update
   */
  async syncSingleEmployeeToDevice(employee: Employee): Promise<boolean> {
    const device = getActiveBiometricDevice();
    if (!device) {
      logger.warn('No active biometric device configured');
      return false;
    }

    const punchCode = employee.employment.punchCode || employee.id;
    const adapter = getBiometricAdapter(device.type);
    await adapter.connect(device);
    
    try {
      // First check if user exists, then create/update
      const existingUsers = await adapter.fetchUsers();
      const userExists = existingUsers.some(u => u.id === punchCode);
      
      if (userExists) {
        // Update user
        await adapter.syncUsers([{ id: punchCode, name: employee.name, employeeId: punchCode }]);
      } else {
        // Create new user
        await adapter.syncUsers([{ id: punchCode, name: employee.name, employeeId: punchCode }]);
      }
      
      logger.info(`✅ Employee ${employee.name} synced to device with punch code: ${punchCode}`);
      return true;
    } catch (error) {
      logger.error(`❌ Failed to sync employee ${employee.name} to device:`, error);
      return false;
    }
  }
}

export const biometricSyncService = new BiometricSyncService();
