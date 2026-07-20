import {
  AppSettings,
  Employee,
  AttendanceRecord,
  PayrollRecord,
  LeaveRecord,
  Candidate,
  PerformanceReview,
  PerformanceGoal,
  TrainingModule,
  TrainingAssignment,
  EmployeeDocument,
  Department,
  Designation,
  BiometricDeviceConfig,
  EmployeeHistoryEntry,
  ExitRecord,
  ExitChecklistTemplate,
  ExitInterviewTemplate,
  LegacyOnboardingTask,
  OnboardingTemplate,
  JobDescription,
  StageTemplate,
  InterviewPanel,
  EvaluationScorecard,
  JDResumeMatch,
} from '../types';
import { IDataAdapter } from './interfaces/IDataAdapter';
import { LocalStorageAdapter } from './adapters/LocalStorageAdapter';
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
  private adapterSignature: string;

  constructor(settings?: AppSettings) {
    this.settings = settings || getSettings();
    this.adapter = this.createAdapter(this.settings);
    this.adapterSignature = this.getAdapterSignature(this.settings);
  }

  private shouldSkipValidation(): boolean {
    return process.env.NODE_ENV === 'test';
  }

  private getAdapterSignature(settings: AppSettings): string {
    return JSON.stringify({
      storageType: settings.storageType || 'local',
      isMockMode: settings.isMockMode,
      googleSheets: settings.googleSheets?.spreadsheetId || '',
      mysqlHost: settings.mysqlHost || settings.database?.mysql?.host || '',
      mysqlDatabase: settings.mysqlDatabase || settings.database?.mysql?.database || '',
      postgresHost: settings.postgresHost || settings.database?.postgres?.host || '',
      postgresDatabase: settings.postgresDatabase || settings.database?.postgres?.database || '',
    });
  }

  private getResolvedSettings(): AppSettings {
    return getSettings();
  }

  private getAdapter(): IDataAdapter {
    const latestSettings = this.getResolvedSettings();
    const nextSignature = this.getAdapterSignature(latestSettings);
    if (nextSignature !== this.adapterSignature) {
      this.settings = latestSettings;
      this.adapter = this.createAdapter(latestSettings);
      this.adapterSignature = nextSignature;
    }
    return this.adapter;
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
    if (this.shouldSkipValidation()) return data;
    const schema = Schemas[entity];
    if (!schema) return data;
    const result = schema.safeParse(data);
    if (!result.success) {
      const firstIssue = result.error.issues[0];
      throw new Error(
        `Validation failed for ${entity}: ${firstIssue?.message ?? 'invalid data'} (path: ${firstIssue?.path?.join('.') ?? '?'})`,
      );
    }
    return result.data as T;
  }

  private validateArray<T>(entity: EntityType, data: T[]): T[] {
    if (!Array.isArray(data)) {
      throw new Error(`Validation failed for ${entity}: expected an array, received ${data === null ? 'null' : typeof data}`);
    }
    if (this.shouldSkipValidation()) return data;
    return data.map((item) => this.validate(entity, item));
  }

  private isOffline(): boolean {
    return typeof navigator !== 'undefined' && navigator.onLine === false;
  }

  // ---- Employees ----
  async getEmployees(): Promise<Employee[]> {
    const adapter = this.getAdapter();
    const data = await adapter.getEmployees();
    try {
      return this.validateArray('employee', data);
    } catch (error) {
      showToast('Failed to validate employees. Using available data.', 'error');
      throw error;
    }
  }

  async getEmployee(id: string): Promise<Employee | null> {
    const data = await this.getAdapter().getEmployee(id);
    if (!data) return null;
    try {
      return this.validate('employee', data);
    } catch {
      return data;
    }
  }

  async saveEmployee(employee: Employee): Promise<Employee> {
    if (this.isOffline()) {
      enqueueRequest({
        endpoint: `/api/v1/employees/${employee.id}`,
        method: 'PUT',
        body: employee,
      });
      return this.validate('employee', employee);
    }

    const adapter = this.getAdapter();
    try {
      const saved = await adapter.saveEmployee(this.validate('employee', employee));
      showToast('Employee saved successfully.', 'success');
      return saved;
    } catch (error) {
      showToast('Failed to save employee. Check connection.', 'error');
      throw error;
    }
  }

  async saveEmployees(employees: Array<Partial<Employee>>): Promise<void> {
    if (this.isOffline()) {
      enqueueRequest({
        endpoint: '/api/v1/employees/bulk',
        method: 'PUT',
        body: { employees },
      });
      return;
    }

    try {
      await this.getAdapter().saveEmployees(this.validateArray('employee', employees as Employee[]) as Employee[]);
      showToast('Employees saved successfully.', 'success');
    } catch (error) {
      showToast('Failed to save employees. Check connection.', 'error');
      throw error;
    }
  }

  async deleteEmployee(id: string): Promise<void> {
    return this.getAdapter().deleteEmployee(id);
  }

  // ---- Attendance ----
  async getAttendance(): Promise<AttendanceRecord[]> {
    return this.validateArray('attendance', await this.getAdapter().getAttendance());
  }

  async getAttendanceByEmployee(employeeId: string): Promise<AttendanceRecord[]> {
    return this.validateArray('attendance', await this.getAdapter().getAttendanceByEmployee(employeeId));
  }

  async saveAttendance(records: AttendanceRecord[]): Promise<void> {
    if (this.isOffline()) {
      enqueueRequest({
        endpoint: '/api/v1/attendance/bulk',
        method: 'PUT',
        body: { records },
      });
      return;
    }
    return this.getAdapter().saveAttendance(this.validateArray('attendance', records));
  }

  async saveAttendanceRecord(record: AttendanceRecord): Promise<void> {
    return this.getAdapter().saveAttendanceRecord(this.validate('attendance', record));
  }

  // ---- Leave ----
  async getLeaves(): Promise<LeaveRecord[]> {
    return this.validateArray('leave', await this.getAdapter().getLeaves());
  }

  async getLeavesByEmployee(employeeId: string): Promise<LeaveRecord[]> {
    return this.validateArray('leave', await this.getAdapter().getLeavesByEmployee(employeeId));
  }

  async saveLeave(leave: LeaveRecord): Promise<void> {
    return this.getAdapter().saveLeave(this.validate('leave', leave));
  }

  async saveLeaves(leaves: LeaveRecord[]): Promise<void> {
    if (this.isOffline()) {
      enqueueRequest({
        endpoint: '/api/v1/leaves/bulk',
        method: 'PUT',
        body: { leaves },
      });
      return;
    }
    return this.getAdapter().saveLeaves(this.validateArray('leave', leaves));
  }

  // ---- Payroll ----
  async getPayroll(): Promise<PayrollRecord[]> {
    return this.validateArray('payroll', await this.getAdapter().getPayroll());
  }

  async getPayrollByEmployee(employeeId: string): Promise<PayrollRecord[]> {
    return this.validateArray('payroll', await this.getAdapter().getPayrollByEmployee(employeeId));
  }

  async savePayroll(records: PayrollRecord[]): Promise<void> {
    if (this.isOffline()) {
      enqueueRequest({
        endpoint: '/api/v1/payroll/bulk',
        method: 'PUT',
        body: { records },
      });
      return;
    }
    return this.getAdapter().savePayroll(this.validateArray('payroll', records));
  }

  // ---- Recruitment ----
  async getCandidates(): Promise<Candidate[]> {
    return this.validateArray('candidate', await this.getAdapter().getCandidates());
  }

  async saveCandidate(candidate: Candidate): Promise<void> {
    return this.getAdapter().saveCandidate(this.validate('candidate', candidate));
  }

  async saveCandidates(candidates: Candidate[]): Promise<void> {
    if (this.isOffline()) {
      enqueueRequest({
        endpoint: '/api/v1/candidates/bulk',
        method: 'PUT',
        body: { candidates },
      });
      return;
    }
    return this.getAdapter().saveCandidates(this.validateArray('candidate', candidates));
  }

  async getStageTemplates(): Promise<StageTemplate[]> {
    return this.getAdapter().getStageTemplates();
  }

  async saveStageTemplates(templates: StageTemplate[]): Promise<void> {
    return this.getAdapter().saveStageTemplates(templates);
  }

  async getInterviewPanels(): Promise<InterviewPanel[]> {
    return this.getAdapter().getInterviewPanels();
  }

  async saveInterviewPanels(panels: InterviewPanel[]): Promise<void> {
    return this.getAdapter().saveInterviewPanels(panels);
  }

  async getScorecards(): Promise<EvaluationScorecard[]> {
    return this.getAdapter().getScorecards();
  }

  async saveScorecards(scorecards: EvaluationScorecard[]): Promise<void> {
    return this.getAdapter().saveScorecards(scorecards);
  }

  async getJDMatches(): Promise<JDResumeMatch[]> {
    return this.getAdapter().getJDMatches();
  }

  async saveJDMatches(matches: JDResumeMatch[]): Promise<void> {
    return this.getAdapter().saveJDMatches(matches);
  }

  // ---- Performance ----
  async getPerformanceReviews(): Promise<PerformanceReview[]> {
    return this.getAdapter().getPerformanceReviews();
  }

  async savePerformanceReview(review: PerformanceReview): Promise<void> {
    return this.getAdapter().savePerformanceReview(review);
  }

  async savePerformanceReviews(reviews: PerformanceReview[]): Promise<void> {
    return this.getAdapter().savePerformanceReviews(reviews);
  }

  async getPerformanceGoals(): Promise<PerformanceGoal[]> {
    return this.getAdapter().getPerformanceGoals();
  }

  async savePerformanceGoal(goal: PerformanceGoal): Promise<void> {
    return this.getAdapter().savePerformanceGoal(goal);
  }

  // ---- Training ----
  async getTrainingModules(): Promise<TrainingModule[]> {
    return this.getAdapter().getTrainingModules();
  }

  async saveTrainingModule(module: TrainingModule): Promise<void> {
    return this.getAdapter().saveTrainingModule(module);
  }

  async getTrainingAssignments(): Promise<TrainingAssignment[]> {
    return this.getAdapter().getTrainingAssignments();
  }

  async saveTrainingAssignment(assignment: TrainingAssignment): Promise<void> {
    return this.getAdapter().saveTrainingAssignment(assignment);
  }

  // ---- Documents ----
  async getDocuments(): Promise<EmployeeDocument[]> {
    return this.validateArray('document', await this.getAdapter().getDocuments());
  }

  async saveDocument(document: EmployeeDocument): Promise<void> {
    return this.getAdapter().saveDocument(this.validate('document', document));
  }

  async getEmployeeDocuments(): Promise<EmployeeDocument[]> {
    return this.validateArray('document', await this.getAdapter().getEmployeeDocuments());
  }

  async saveEmployeeDocuments(docs: EmployeeDocument[]): Promise<void> {
    return this.getAdapter().saveEmployeeDocuments(this.validateArray('document', docs));
  }

  async uploadFile(file: File, folderId: string): Promise<string> {
    return this.getAdapter().uploadFile(file, folderId);
  }

  // ---- Job Descriptions / Onboarding ----
  async getOnboardingTasks(): Promise<LegacyOnboardingTask[]> {
    return this.getAdapter().getOnboardingTasks();
  }

  async getOnboardingTemplates(): Promise<OnboardingTemplate[]> {
    return this.getAdapter().getOnboardingTemplates();
  }

  async getJobDescriptions(): Promise<JobDescription[]> {
    return this.getAdapter().getJobDescriptions();
  }

  async saveJobDescriptions(jobs: JobDescription[]): Promise<void> {
    return this.getAdapter().saveJobDescriptions(jobs);
  }

  // ---- Departments & Designations ----
  async getDepartments(): Promise<Department[]> {
    return this.validateArray('department', await this.getAdapter().getDepartments());
  }

  async saveDepartment(department: Department): Promise<void> {
    return this.getAdapter().saveDepartment(this.validate('department', department));
  }

  async getDesignations(): Promise<Designation[]> {
    return this.validateArray('designation', await this.getAdapter().getDesignations());
  }

  async saveDesignation(designation: Designation): Promise<void> {
    return this.getAdapter().saveDesignation(this.validate('designation', designation));
  }

  // ---- Settings ----
  async getSettings(): Promise<AppSettings> {
    return this.getAdapter().getSettings();
  }

  async saveSettings(settings: AppSettings): Promise<void> {
    await this.getAdapter().saveSettings(settings);
    this.settings = settings;
    this.adapter = this.createAdapter(settings);
    this.adapterSignature = this.getAdapterSignature(settings);
  }

  // ---- Biometric Devices ----
  getBiometricDevices(): BiometricDeviceConfig[] {
    return this.getAdapter().getBiometricDevices();
  }

  saveBiometricDevices(devices: BiometricDeviceConfig[]): void {
    this.getAdapter().saveBiometricDevices(devices);
  }

  // ---- Storage Helpers / Logging ----
  async addSheetLog(
    sheetName: string,
    action: 'INSERT' | 'UPDATE' | 'DELETE' | 'SYNC',
    rowData: object,
  ): Promise<void> {
    return this.getAdapter().addSheetLog(sheetName, action, rowData);
  }

  generateEmployeeDiff(
    oldEmp: Employee | null,
    newEmp: Employee,
    changedBy?: string,
    changedByName?: string,
    changeType?: 'CREATE' | 'UPDATE' | 'DELETE' | 'BULK_UPDATE',
    source?: 'MANUAL' | 'TRANSITION' | 'BULK_IMPORT' | 'SYSTEM_AUTO' | 'API',
    reason?: string,
    notes?: string,
  ): any {
    return this.getAdapter().generateEmployeeDiff(oldEmp, newEmp, changedBy, changedByName, changeType, source, reason, notes);
  }

  // ---- History & Exit ----
  async addEmployeeHistory(entry: EmployeeHistoryEntry): Promise<void> {
    return this.getAdapter().addEmployeeHistory(entry);
  }

  async getEmployeeHistory(employeeId: string): Promise<EmployeeHistoryEntry[]> {
    return this.getAdapter().getEmployeeHistory(employeeId);
  }

  async createExitRecord(record: ExitRecord): Promise<void> {
    return this.getAdapter().createExitRecord(record);
  }

  async getExitRecords(): Promise<ExitRecord[]> {
    return this.getAdapter().getExitRecords();
  }

  // ---- Exit Templates ----
  async getExitChecklistTemplates(): Promise<ExitChecklistTemplate[]> {
    return this.getAdapter().getExitChecklistTemplates();
  }

  async getExitInterviewTemplates(): Promise<ExitInterviewTemplate[]> {
    return this.getAdapter().getExitInterviewTemplates();
  }

  // ---- Sync ----
  async sync(): Promise<void> {
    return this.getAdapter().syncAll();
  }

  async syncAll(): Promise<void> {
    return this.getAdapter().syncAll();
  }

  async syncModule(module: string): Promise<void> {
    return this.getAdapter().syncModule(module);
  }
}
