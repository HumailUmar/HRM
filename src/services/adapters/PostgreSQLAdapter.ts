import { Employee, AttendanceRecord, PayrollRecord, LeaveRecord, Candidate, AppSettings } from '../../types';
import { getToken } from '../../lib/auth';
import { LocalStorageAdapter } from '../LocalStorageAdapter';

export class PostgreSQLAdapter extends LocalStorageAdapter {
  private config: AppSettings | Record<string, unknown>;

  constructor(config: AppSettings | Record<string, unknown>) {
    super();
    this.config = config;
  }

  private getHeaders() {
    return { 'Content-Type': 'application/json' };
  }

  async connect(): Promise<void> {
    // Connection and schema validation are handled on the server.
  }

  async disconnect(): Promise<void> {
    // Managed on the server.
  }

  // ---- EMPLOYEES ----
  async getEmployees(): Promise<Employee[]> {
    try {
      const res = await fetch('/api/v1/employees', { headers: this.getHeaders(), credentials: 'same-origin' });
      if (!res.ok) return super.getEmployees();
      const data = await res.json();
      return data.data || [];
    } catch {
      return super.getEmployees();
    }
  }

  async getEmployee(id: string): Promise<Employee | null> {
    try {
      const res = await fetch(`/api/v1/employees/${id}`, { headers: this.getHeaders(), credentials: 'same-origin' });
      if (!res.ok) return super.getEmployee(id);
      const data = await res.json();
      return data.data || null;
    } catch {
      return super.getEmployee(id);
    }
  }

  async saveEmployee(employee: Employee): Promise<Employee> {
    try {
      const isNew = !employee.id || employee.id.startsWith('EMP-TEMP');
      const url = isNew ? '/api/v1/employees' : `/api/v1/employees/${employee.id}`;
      const method = isNew ? 'POST' : 'PUT';
      const res = await fetch(url, {
        method,
        headers: this.getHeaders(), credentials: 'same-origin',
        body: JSON.stringify(employee),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      return data.data || employee;
    } catch {
      return super.saveEmployee(employee);
    }
  }

  async saveEmployees(employees: Employee[]): Promise<void> {
    try {
      if (!employees?.length) return;
      const results = await Promise.allSettled(employees.map((emp) => this.saveEmployee(emp)));
      const failed = results.filter((r) => r.status === 'rejected');
      if (failed.length) throw new Error(`Failed to save ${failed.length}/${employees.length} employees`);
    } catch {
      return super.saveEmployees(employees);
    }
  }

  async deleteEmployee(id: string): Promise<void> {
    try {
      const res = await fetch(`/api/v1/employees/${id}`, {
        method: 'DELETE',
        headers: this.getHeaders(), credentials: 'same-origin',
      });
      if (!res.ok) throw new Error(await res.text());
    } catch {
      return super.deleteEmployee(id);
    }
  }

  // ---- ATTENDANCE ----
  async getAttendance(): Promise<AttendanceRecord[]> {
    try {
      const res = await fetch('/api/v1/attendance', { headers: this.getHeaders(), credentials: 'same-origin' });
      if (!res.ok) return super.getAttendance();
      const data = await res.json();
      return data.data || [];
    } catch {
      return super.getAttendance();
    }
  }

  async getAttendanceByEmployee(employeeId: string): Promise<AttendanceRecord[]> {
    try {
      const res = await fetch(`/api/v1/attendance?employeeId=${employeeId}`, { headers: this.getHeaders(), credentials: 'same-origin' });
      if (!res.ok) return super.getAttendanceByEmployee(employeeId);
      const data = await res.json();
      return data.data || [];
    } catch {
      return super.getAttendanceByEmployee(employeeId);
    }
  }

  async saveAttendanceRecord(record: AttendanceRecord): Promise<void> {
    try {
      const res = await fetch('/api/v1/attendance', {
        method: 'POST',
        headers: this.getHeaders(), credentials: 'same-origin',
        body: JSON.stringify(record),
      });
      if (!res.ok) throw new Error(await res.text());
    } catch {
      return super.saveAttendanceRecord(record);
    }
  }

  async saveAttendance(records: AttendanceRecord[]): Promise<void> {
    try {
      if (!records?.length) return;
      const results = await Promise.allSettled(records.map((rec) => this.saveAttendanceRecord(rec)));
      const failed = results.filter((r) => r.status === 'rejected');
      if (failed.length) throw new Error(`Failed to save ${failed.length}/${records.length} attendance records`);
    } catch {
      return super.saveAttendance(records);
    }
  }

  // ---- PAYROLL ----
  async getPayroll(): Promise<PayrollRecord[]> {
    try {
      const res = await fetch('/api/v1/payroll', { headers: this.getHeaders(), credentials: 'same-origin' });
      if (!res.ok) return super.getPayroll();
      const data = await res.json();
      return data.data || [];
    } catch {
      return super.getPayroll();
    }
  }

  async getPayrollByEmployee(employeeId: string): Promise<PayrollRecord[]> {
    try {
      const res = await fetch(`/api/v1/payroll?employeeId=${employeeId}`, { headers: this.getHeaders(), credentials: 'same-origin' });
      if (!res.ok) return super.getPayrollByEmployee(employeeId);
      const data = await res.json();
      return data.data || [];
    } catch {
      return super.getPayrollByEmployee(employeeId);
    }
  }

  async savePayroll(records: PayrollRecord[]): Promise<void> {
    try {
      if (!records?.length) return;
      const results = await Promise.allSettled(
        records.map(async (rec) => {
          const res = await fetch('/api/v1/payroll', {
            method: 'POST',
            headers: this.getHeaders(), credentials: 'same-origin',
            body: JSON.stringify(rec),
          });
          if (!res.ok) throw new Error(await res.text());
        }),
      );
      const failed = results.filter((r) => r.status === 'rejected');
      if (failed.length) throw new Error(`Failed to save ${failed.length}/${records.length} payroll records`);
    } catch {
      return super.savePayroll(records);
    }
  }

  // ---- LEAVES ----
  async getLeaves(): Promise<LeaveRecord[]> {
    try {
      const res = await fetch('/api/v1/leaves', { headers: this.getHeaders(), credentials: 'same-origin' });
      if (!res.ok) return super.getLeaves();
      const data = await res.json();
      return data.data || [];
    } catch {
      return super.getLeaves();
    }
  }

  async getLeavesByEmployee(employeeId: string): Promise<LeaveRecord[]> {
    try {
      const res = await fetch(`/api/v1/leaves?employeeId=${employeeId}`, { headers: this.getHeaders(), credentials: 'same-origin' });
      if (!res.ok) return super.getLeavesByEmployee(employeeId);
      const data = await res.json();
      return data.data || [];
    } catch {
      return super.getLeavesByEmployee(employeeId);
    }
  }

  async saveLeave(leave: LeaveRecord): Promise<void> {
    try {
      const isNew = !leave.id || leave.id.startsWith('LR-TEMP');
      const url = isNew ? '/api/v1/leaves' : `/api/v1/leaves/${leave.id}/approve`;
      const method = isNew ? 'POST' : 'PUT';
      const res = await fetch(url, {
        method,
        headers: this.getHeaders(), credentials: 'same-origin',
        body: JSON.stringify(leave),
      });
      if (!res.ok) throw new Error(await res.text());
    } catch {
      return super.saveLeave(leave);
    }
  }

  async saveLeaves(leaves: LeaveRecord[]): Promise<void> {
    try {
      if (!leaves?.length) return;
      const results = await Promise.allSettled(leaves.map((leave) => this.saveLeave(leave)));
      const failed = results.filter((r) => r.status === 'rejected');
      if (failed.length) throw new Error(`Failed to save ${failed.length}/${leaves.length} leave records`);
    } catch {
      return super.saveLeaves(leaves);
    }
  }

  // ---- CANDIDATES ----
  async getCandidates(): Promise<Candidate[]> {
    try {
      const res = await fetch('/api/v1/candidates', { headers: this.getHeaders(), credentials: 'same-origin' });
      if (!res.ok) return super.getCandidates();
      const data = await res.json();
      return data.data || [];
    } catch {
      return super.getCandidates();
    }
  }

  async saveCandidate(candidate: Candidate): Promise<void> {
    try {
      const res = await fetch('/api/v1/candidates', {
        method: 'POST',
        headers: this.getHeaders(), credentials: 'same-origin',
        body: JSON.stringify(candidate),
      });
      if (!res.ok) throw new Error(await res.text());
    } catch {
      return super.saveCandidate(candidate);
    }
  }

  async saveCandidates(candidates: Candidate[]): Promise<void> {
    try {
      if (!candidates?.length) return;
      const results = await Promise.allSettled(candidates.map((c) => this.saveCandidate(c)));
      const failed = results.filter((r) => r.status === 'rejected');
      if (failed.length) throw new Error(`Failed to save ${failed.length}/${candidates.length} candidates`);
    } catch {
      return super.saveCandidates(candidates);
    }
  }
}
