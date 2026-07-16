import { IDataAdapter } from '../interfaces/IDataAdapter';
import { Employee, AttendanceRecord, PayrollRecord, LeaveRecord, Candidate } from '../../types';
import { getToken } from '../../lib/auth';

export class PostgreSQLAdapter implements IDataAdapter {
  private config: any;

  constructor(config: any) {
    this.config = config;
  }

  private getHeaders() {
    const token = getToken();
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };
  }

  async connect(): Promise<void> {
    // Connection and schema validation is automatically handled on the secure server database layer
  }

  async disconnect(): Promise<void> {
    // Managed on the secure server database layer
  }

  // ---- EMPLOYEES ----
  async getEmployees(): Promise<Employee[]> {
    const res = await fetch('/api/v1/employees', {
      headers: this.getHeaders(),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data || [];
  }

  async getEmployee(id: string): Promise<Employee | null> {
    const res = await fetch(`/api/v1/employees/${id}`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data || null;
  }

  async saveEmployee(employee: Employee): Promise<Employee> {
    const isNew = !employee.id || employee.id.startsWith('EMP-TEMP');
    const url = isNew ? '/api/v1/employees' : `/api/v1/employees/${employee.id}`;
    const method = isNew ? 'POST' : 'PUT';
    
    const res = await fetch(url, {
      method,
      headers: this.getHeaders(),
      body: JSON.stringify(employee),
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    return data.data || employee;
  }

  async saveEmployees(employees: Employee[]): Promise<void> {
    if (!employees?.length) return;
    const results = await Promise.allSettled(employees.map(emp => this.saveEmployee(emp)));
    const failed = results.filter(r => r.status === 'rejected');
    if (failed.length) {
      throw new Error(`Failed to save ${failed.length}/${employees.length} employees`);
    }
  }

  async deleteEmployee(id: string): Promise<void> {
    const res = await fetch(`/api/v1/employees/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error(await res.text());
  }

  // ---- ATTENDANCE ----
  async getAttendance(): Promise<AttendanceRecord[]> {
    const res = await fetch('/api/v1/attendance', {
      headers: this.getHeaders(),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data || [];
  }

  async getAttendanceByEmployee(employeeId: string): Promise<AttendanceRecord[]> {
    const res = await fetch(`/api/v1/attendance?employeeId=${employeeId}`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data || [];
  }

  async saveAttendanceRecord(record: AttendanceRecord): Promise<void> {
    const res = await fetch('/api/v1/attendance', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(record),
    });
    if (!res.ok) throw new Error(await res.text());
  }

  async saveAttendance(records: AttendanceRecord[]): Promise<void> {
    if (!records?.length) return;
    const results = await Promise.allSettled(records.map(rec => this.saveAttendanceRecord(rec)));
    const failed = results.filter(r => r.status === 'rejected');
    if (failed.length) {
      throw new Error(`Failed to save ${failed.length}/${records.length} attendance records`);
    }
  }

  // ---- PAYROLL ----
  async getPayroll(): Promise<PayrollRecord[]> {
    const res = await fetch('/api/v1/payroll', {
      headers: this.getHeaders(),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data || [];
  }

  async getPayrollByEmployee(employeeId: string): Promise<PayrollRecord[]> {
    const res = await fetch(`/api/v1/payroll?employeeId=${employeeId}`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data || [];
  }

  async savePayroll(records: PayrollRecord[]): Promise<void> {
    if (!records?.length) return;
    const results = await Promise.allSettled(records.map(async (rec) => {
      const res = await fetch('/api/v1/payroll', {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(rec),
      });
      if (!res.ok) throw new Error(await res.text());
    }));
    const failed = results.filter(r => r.status === 'rejected');
    if (failed.length) {
      throw new Error(`Failed to save ${failed.length}/${records.length} payroll records`);
    }
  }

  // ---- LEAVES ----
  async getLeaves(): Promise<LeaveRecord[]> {
    const res = await fetch('/api/v1/leaves', {
      headers: this.getHeaders(),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data || [];
  }

  async getLeavesByEmployee(employeeId: string): Promise<LeaveRecord[]> {
    const res = await fetch(`/api/v1/leaves?employeeId=${employeeId}`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data || [];
  }

  async saveLeave(leave: LeaveRecord): Promise<void> {
    const isNew = !leave.id || leave.id.startsWith('LR-TEMP');
    const url = isNew ? '/api/v1/leaves' : `/api/v1/leaves/${leave.id}/approve`;
    const method = isNew ? 'POST' : 'PUT';

    const res = await fetch(url, {
      method,
      headers: this.getHeaders(),
      body: JSON.stringify(leave),
    });
    if (!res.ok) throw new Error(await res.text());
  }

  async saveLeaves(leaves: LeaveRecord[]): Promise<void> {
    if (!leaves?.length) return;
    const results = await Promise.allSettled(leaves.map(leave => this.saveLeave(leave)));
    const failed = results.filter(r => r.status === 'rejected');
    if (failed.length) {
      throw new Error(`Failed to save ${failed.length}/${leaves.length} leave records`);
    }
  }

  // ---- CANDIDATES ----
  async getCandidates(): Promise<Candidate[]> {
    const res = await fetch('/api/v1/candidates', {
      headers: this.getHeaders(),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data || [];
  }

  async saveCandidate(candidate: Candidate): Promise<void> {
    const res = await fetch('/api/v1/candidates', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(candidate),
    });
    if (!res.ok) throw new Error(await res.text());
  }

  async saveCandidates(candidates: Candidate[]): Promise<void> {
    if (!candidates?.length) return;
    const results = await Promise.allSettled(candidates.map(c => this.saveCandidate(c)));
    const failed = results.filter(r => r.status === 'rejected');
    if (failed.length) {
      throw new Error(`Failed to save ${failed.length}/${candidates.length} candidates`);
    }
  }

  // Remaining methods satisfy IDataAdapter interface
  async getPerformanceReviews(): Promise<any[]> { return []; }
  async savePerformanceReview(review: any): Promise<void> { return ; }
  async savePerformanceReviews(reviews: any[]): Promise<void> { return ; }
  async getPerformanceGoals(): Promise<any[]> { return []; }
  async savePerformanceGoal(goal: any): Promise<void> { return ; }
  async getTrainingModules(): Promise<any[]> { return []; }
  async saveTrainingModule(module: any): Promise<void> { return ; }
  async getTrainingAssignments(): Promise<any[]> { return []; }
  async saveTrainingAssignment(assignment: any): Promise<void> { return ; }
  async getDocuments(): Promise<any[]> { return []; }
  async saveDocument(document: any): Promise<void> { return ; }
  async getDepartments(): Promise<any[]> { return []; }
  async saveDepartment(department: any): Promise<void> { return ; }
  async getDesignations(): Promise<any[]> { return []; }
  async saveDesignation(designation: any): Promise<void> { return ; }
  async getSettings(): Promise<any> { return null as any; }
  async saveSettings(settings: any): Promise<void> { return ; }

  // RECRUITMENT HELPERS
  async getStageTemplates(): Promise<any[]> { return []; }
  async saveStageTemplates(templates: any[]): Promise<void> { }
  async getInterviewPanels(): Promise<any[]> { return []; }
  async saveInterviewPanels(panels: any[]): Promise<void> { }
  async getScorecards(): Promise<any[]> { return []; }
  async saveScorecards(scorecards: any[]): Promise<void> { }
  async getJDMatches(): Promise<any[]> { return []; }
  async saveJDMatches(matches: any[]): Promise<void> { }

  // HISTORY & EXIT
  async addEmployeeHistory(entry: any): Promise<void> { }
  async getEmployeeHistory(employeeId: string): Promise<any[]> { return []; }
  async createExitRecord(record: any): Promise<void> { }
  async getExitRecords(): Promise<any[]> { return []; }

  // EXIT TEMPLATES
  async getExitChecklistTemplates(): Promise<any[]> { return []; }
  async getExitInterviewTemplates(): Promise<any[]> { return []; }

  // STORAGE HELPERS / LOGGING
  async addSheetLog(sheetName: string, action: 'INSERT' | 'UPDATE' | 'DELETE' | 'SYNC', rowData: object): Promise<void> { }
  generateEmployeeDiff(
    oldEmp: Employee | null,
    newEmp: Employee,
    changedBy?: string,
    changedByName?: string,
    changeType?: 'CREATE' | 'UPDATE' | 'DELETE' | 'BULK_UPDATE',
    source?: 'MANUAL' | 'TRANSITION' | 'BULK_IMPORT' | 'SYSTEM_AUTO' | 'API',
    reason?: string,
    notes?: string
  ): any { return null; }
  async uploadFile(file: File, folderId: string): Promise<string> { return ''; }
  
  // BIOMETRIC DEVICES
  getBiometricDevices(): any[] { return []; }
  saveBiometricDevices(devices: any[]): void { }

  async syncAll(): Promise<void> { return ; }
  async syncModule(module: string): Promise<void> { return ; }
}
