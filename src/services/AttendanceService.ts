import { IDataAdapter } from './interfaces/IDataAdapter';
import { getDataAdapter } from './DataAdapterFactory';
import { AttendanceRecord } from '../types';

export class AttendanceService {
  private getAdapter(): IDataAdapter {
    return getDataAdapter();
  }

  async getAll(): Promise<AttendanceRecord[]> {
    return this.getAdapter().getAttendance();
  }

  async getByEmployee(employeeId: string): Promise<AttendanceRecord[]> {
    return this.getAdapter().getAttendanceByEmployee(employeeId);
  }

  async getByDateRange(employeeId: string, startDate: string, endDate: string): Promise<AttendanceRecord[]> {
    const records = await this.getAdapter().getAttendanceByEmployee(employeeId);
    return records.filter(r => r.date >= startDate && r.date <= endDate);
  }

  async getMonthly(employeeId: string, year: number, month: number): Promise<AttendanceRecord[]> {
    const records = await this.getAdapter().getAttendanceByEmployee(employeeId);
    return records.filter(r => {
      const d = new Date(r.date);
      return d.getFullYear() === year && d.getMonth() === month;
    });
  }

  async log(record: AttendanceRecord): Promise<void> {
    if (!record.employeeId) throw new Error('Employee ID is required');
    if (!record.date) throw new Error('Date is required');
    return this.getAdapter().saveAttendanceRecord(record);
  }

  async bulkLog(records: AttendanceRecord[]): Promise<void> {
    return this.getAdapter().saveAttendance(records);
  }

  async sync(): Promise<void> {
    return this.getAdapter().syncModule('attendance');
  }

  calculateStats(records: AttendanceRecord[]) {
    return {
      present: records.filter(r => r.status === 'Full Day').length,
      absent: records.filter(r => r.status === 'Absent').length,
      halfDay: records.filter(r => r.status === 'Half Day').length,
      onLeave: records.filter(r => (r.status as any) === 'On Leave').length,
    };
  }
}

export const attendanceService = new AttendanceService();
export default attendanceService;
