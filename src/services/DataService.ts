import { 
  AppSettings, Employee, AttendanceRecord, PayrollRecord, LeaveRecord, Candidate, 
  PerformanceReview, PerformanceGoal, TrainingModule, TrainingAssignment, 
  EmployeeDocument, Department, Designation, BiometricDeviceConfig, 
  EmployeeHistoryEntry, ExitRecord, ExitChecklistTemplate, ExitInterviewTemplate 
} from '../types';
import { IDataAdapter } from './interfaces/IDataAdapter';
import { LocalStorageAdapter } from './LocalStorageAdapter';
import { GoogleSheetsAdapter } from './GoogleSheetsAdapter';
import { MySQLAdapter } from './adapters/MySQLAdapter';
import { PostgreSQLAdapter } from './adapters/PostgreSQLAdapter';
import { getSettings } from '../lib/storage';
import { Schemas, EntityType } from '../lib/schemas';
import { enqueueRequest } from '../lib/offlineQueue';
import { showToast } from '../components/Toast';

export class DataService {
  private adapter: IDataAdapter;
  private settings: AppSettings;

  constructor(settings?: AppSettings) {
    this.settings = settings || getSettings();
    this.adapter = this.createAdapter(this.settings);
  }

  private createAdapter(settings: AppSettings): IDataAdapter {
    switch (settings.storageType) {
      case 'google-sheets':
        return new GoogleSheetsAdapter(settings);
      case 'mysql':
        return new MySQLAdapter(settings);
      case 'postgresql':
        return new PostgreSQLAdapter(settings);
      case 'local':
      default:
        return new LocalStorageAdapter();
    }
  }

  private validate<T>(entity: EntityType, data: T): T {
    const schema = Schemas[entity];
    if (!schema) return data;
    const result = schema.safeParse(data);
    if (!result.success) {
      // Validation failure must NOT silently pass invalid data to persistence.
      const firstIssue = result.error.issues[0];
      throw new Error(`Validation failed for ${entity}: ${firstIssue?.message ?? 'invalid data'} (path: ${firstIssue?.path?.join('.') ?? '?'})`);
    }
    return result.data as T;
  }

  private validateArray<T>(entity: EntityType, data: T[]): T[] {
    return data.map(item => this.validate(entity, item));
  }

  // ---- Employees ----
  async getEmployees(): Promise<Employee[]> { 
    try {
      return this.validateArray('employee', await this.adapter.getEmployees());
    } catch (error) {
      showToast('Failed to load employees. Please retry.', 'error');
      throw error;
    }
  }
  async getEmployee(id: string): Promise<Employee | null> {
    const data = await this.adapter.getEmployee(id);
    if (!data) return null;
    try {
      return this.validate('employee', data);
    } catch {
      return data;
    }
  }
  async saveEmployee(employee: Employee): Promise<Employee> { 
    if (!navigator.onLine) {
        enqueueRequest({
            endpoint: `/api/v1/employees/${employee.id}`,
            method: 'PUT',
            body: { employee },
        });
        return this.validate('employee', employee);
    }
    try {
        const saved = await this.adapter.saveEmployee(this.validate('employee', employee));
        showToast('Employee saved successfully.', 'success');
        return saved;
    } catch (error) {
        showToast('Failed to save employee. Check connection.', 'error');
        throw error;
    }
  }
  async saveEmployees(employees: Employee[]): Promise<void> { 
    if (!navigator.onLine) {
        enqueueRequest({
            endpoint: `/api/v1/employees/bulk`,
            method: 'PUT',
            body: { employees },
        });
        return;
    }
    try {
        await this.adapter.saveEmployees(this.validateArray('employee', employees));
        showToast('Employees saved successfully.', 'success');
    } catch (error) {
        showToast('Failed to save employees. Check connection.', 'error');
        throw error;
    }
  }
  async deleteEmployee(id: string): Promise<void> { return this.adapter.deleteEmployee(id); }

  // ---- Attendance ----
  async getAttendance(): Promise<AttendanceRecord[]> { return this.validateArray('attendance', await this.adapter.getAttendance()); }
  async getAttendanceByEmployee(employeeId: string): Promise<AttendanceRecord[]> { return this.validateArray('attendance', await this.adapter.getAttendanceByEmployee(employeeId)); }
  async saveAttendance(records: AttendanceRecord[]): Promise<void> { 
    if (!navigator.onLine) {
        enqueueRequest({
            endpoint: `/api/v1/attendance/bulk`,
            method: 'PUT',
            body: { records },
        });
        return;
    }
    return this.adapter.saveAttendance(this.validateArray('attendance', records)); 
  }
  async saveAttendanceRecord(record: AttendanceRecord): Promise<void> { return this.adapter.saveAttendanceRecord(this.validate('attendance', record)); }

  // ---- Leave ----
  async getLeaves(): Promise<LeaveRecord[]> { return this.validateArray('leave', await this.adapter.getLeaves()); }
  async getLeavesByEmployee(employeeId: string): Promise<LeaveRecord[]> { return this.validateArray('leave', await this.adapter.getLeavesByEmployee(employeeId)); }
  async saveLeave(leave: LeaveRecord): Promise<void> { return this.adapter.saveLeave(this.validate('leave', leave)); }
  async saveLeaves(leaves: LeaveRecord[]): Promise<void> { 
    if (!navigator.onLine) {
        enqueueRequest({
            endpoint: `/api/v1/leaves/bulk`,
            method: 'PUT',
            body: { leaves },
        });
        return;
    }
    return this.adapter.saveLeaves(this.validateArray('leave', leaves)); 
  }

  // ---- Payroll ----
  async getPayroll(): Promise<PayrollRecord[]> { return this.validateArray('payroll', await this.adapter.getPayroll()); }
  async getPayrollByEmployee(employeeId: string): Promise<PayrollRecord[]> { return this.validateArray('payroll', await this.adapter.getPayrollByEmployee(employeeId)); }
  async savePayroll(records: PayrollRecord[]): Promise<void> { 
    if (!navigator.onLine) {
        enqueueRequest({
            endpoint: `/api/v1/payroll/bulk`,
            method: 'PUT',
            body: { records },
        });
        return;
    }
    return this.adapter.savePayroll(this.validateArray('payroll', records)); 
  }

  // ---- Recruitment ----
  async getCandidates(): Promise<Candidate[]> { return this.validateArray('candidate', await this.adapter.getCandidates()); }
  async saveCandidate(candidate: Candidate): Promise<void> { return this.adapter.saveCandidate(this.validate('candidate', candidate)); }
  async saveCandidates(candidates: Candidate[]): Promise<void> { 
    if (!navigator.onLine) {
        enqueueRequest({
            endpoint: `/api/v1/candidates/bulk`,
            method: 'PUT',
            body: { candidates },
        });
        return;
    }
    return this.adapter.saveCandidates(this.validateArray('candidate', candidates)); 
  }

  // ---- Performance ----
  async getPerformanceReviews(): Promise<PerformanceReview[]> { return this.adapter.getPerformanceReviews(); }
  async savePerformanceReview(review: PerformanceReview): Promise<void> { return this.adapter.savePerformanceReview(review); }
  async savePerformanceReviews(reviews: PerformanceReview[]): Promise<void> { return this.adapter.savePerformanceReviews(reviews); }
  async getPerformanceGoals(): Promise<PerformanceGoal[]> { return this.adapter.getPerformanceGoals(); }
  async savePerformanceGoal(goal: PerformanceGoal): Promise<void> { return this.adapter.savePerformanceGoal(goal); }

  // ---- Training ----
  async getTrainingModules(): Promise<TrainingModule[]> { return this.adapter.getTrainingModules(); }
  async saveTrainingModule(module: TrainingModule): Promise<void> { return this.adapter.saveTrainingModule(module); }
  async getTrainingAssignments(): Promise<TrainingAssignment[]> { return this.adapter.getTrainingAssignments(); }
  async saveTrainingAssignment(assignment: TrainingAssignment): Promise<void> { return this.adapter.saveTrainingAssignment(assignment); }

  // ---- Documents ----
  async getDocuments(): Promise<EmployeeDocument[]> { return this.validateArray('document', await this.adapter.getDocuments()); }
  async saveDocument(document: EmployeeDocument): Promise<void> { return this.adapter.saveDocument(this.validate('document', document)); }
  async getEmployeeDocuments(): Promise<EmployeeDocument[]> { return this.validateArray('document', await this.adapter.getEmployeeDocuments()); }
  async saveEmployeeDocuments(docs: EmployeeDocument[]): Promise<void> { return this.adapter.saveEmployeeDocuments(this.validateArray('document', docs)); }

  // ---- Departments & Designations ----
  async getDepartments(): Promise<Department[]> { return this.validateArray('department', await this.adapter.getDepartments()); }
  async saveDepartment(department: Department): Promise<void> { return this.adapter.saveDepartment(this.validate('department', department)); }
  async getDesignations(): Promise<Designation[]> { return this.validateArray('designation', await this.adapter.getDesignations()); }
  async saveDesignation(designation: Designation): Promise<void> { return this.adapter.saveDesignation(this.validate('designation', designation)); }

  // ---- Settings ----
  async getSettings(): Promise<AppSettings> { return this.adapter.getSettings(); }
  async saveSettings(settings: AppSettings): Promise<void> { return this.adapter.saveSettings(settings); }

  // ---- Biometric Devices ----
  getBiometricDevices(): BiometricDeviceConfig[] { return this.adapter.getBiometricDevices(); }
  saveBiometricDevices(devices: BiometricDeviceConfig[]): void { return this.adapter.saveBiometricDevices(devices); }

  // ---- Storage Helpers / Logging ----
  async addSheetLog(sheetName: string, action: 'INSERT' | 'UPDATE' | 'DELETE' | 'SYNC', rowData: object): Promise<void> { return this.adapter.addSheetLog(sheetName, action, rowData); }
  generateEmployeeDiff(
    oldEmp: Employee | null,
    newEmp: Employee,
    changedBy?: string,
    changedByName?: string,
    changeType?: 'CREATE' | 'UPDATE' | 'DELETE' | 'BULK_UPDATE',
    source?: 'MANUAL' | 'TRANSITION' | 'BULK_IMPORT' | 'SYSTEM_AUTO' | 'API',
    reason?: string,
    notes?: string
  ): any { return this.adapter.generateEmployeeDiff(oldEmp, newEmp, changedBy, changedByName, changeType, source, reason, notes); }

  // ---- History & Exit ----
  async addEmployeeHistory(entry: EmployeeHistoryEntry): Promise<void> { return this.adapter.addEmployeeHistory(entry); }
  async getEmployeeHistory(employeeId: string): Promise<EmployeeHistoryEntry[]> { return this.adapter.getEmployeeHistory(employeeId); }
  async createExitRecord(record: ExitRecord): Promise<void> { return this.adapter.createExitRecord(record); }
  async getExitRecords(): Promise<ExitRecord[]> { return this.adapter.getExitRecords(); }

  // ---- Onboarding ----
  async getOnboardingTasks(): Promise<LegacyOnboardingTask[]> { return this.adapter.getOnboardingTasks(); }
  async getOnboardingTemplates(): Promise<OnboardingTemplate[]> { return this.adapter.getOnboardingTemplates(); }

  async getJobDescriptions(): Promise<JobDescription[]> { return this.adapter.getJobDescriptions(); }
  async saveJobDescriptions(jobs: JobDescription[]): Promise<void> { return this.adapter.saveJobDescriptions(jobs); }

  // ---- Exit Templates ----
  async getExitChecklistTemplates(): Promise<ExitChecklistTemplate[]> { return this.adapter.getExitChecklistTemplates(); }
  async getExitInterviewTemplates(): Promise<ExitInterviewTemplate[]> { return this.adapter.getExitInterviewTemplates(); }

  // ---- Sync ----
  async syncAll(): Promise<void> { return this.adapter.syncAll(); }
  async syncModule(module: string): Promise<void> { return this.adapter.syncModule(module); }
}
