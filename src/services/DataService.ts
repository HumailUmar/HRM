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
  SuccessionPlan,
  StageTemplate,
  InterviewPanel,
  EvaluationScorecard,
  JDResumeMatch,
  ExitProcessStage,
  SettlementConfig,
  PerformanceReviewCycle,
  PerformanceReviewTemplate,
  TrainingSubmission,
  PeerAssignment,
  TrainingRequest,
  TrainingMentorship,
  TrainingCheckIn,
  TrainingMessage,
  SalaryComponent,
  SalaryStructure,
  PayGrade,
  SalaryRevision,
  Shift,
  ShiftAssignment,
  ShiftSwapRequest,
  ShiftTemplate,
  Currency,
  TaxRule,
  StatutoryDeduction,
  PayrollCalculation,
  LeavePolicy,
  RecruitmentAnalytics,
  HireDetails,
  InterviewSchedule,
  OrgChartNode,
  SheetLog,
  EmployeeStatusHistory,
  TrainingQuiz,
  BiometricPunchRecord,
  BiometricSyncLog,
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
import { logger } from '../lib/logger';

export class DataService {
  private adapter: IDataAdapter;
  private settings: AppSettings;
  private adapterSignature: string;

  constructor(settings: AppSettings) {
    this.settings = settings;
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
    try {
      return getSettings();
    } catch (error) {
      logger.error('Failed to resolve settings:', error);
      return this.settings;
    }
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

  private validatePersistable<T extends { id?: unknown }>(entity: string, value: T): T {
    if (!value || typeof value !== 'object' || typeof value.id !== 'string' || value.id.trim().length === 0) {
      throw new Error(`Validation failed for ${entity}: a non-empty id is required`);
    }
    try { JSON.stringify(value); } catch { throw new Error(`Validation failed for ${entity}: value is not serializable`); }
    return value;
  }

  private validatePersistableArray<T extends { id?: unknown }>(entity: string, values: T[]): T[] {
    if (!Array.isArray(values)) throw new Error(`Validation failed for ${entity}: expected an array`);
    return values.map(value => this.validatePersistable(entity, value));
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
    if (!id) {
      logger.warn('DataService.getEmployee called with empty id');
      return null;
    }
    const data = await this.getAdapter().getEmployee(id);
    if (!data) return null;
    try {
      return this.validate('employee', data);
    } catch {
      return null;
    }
  }

  async saveEmployee(employee: Employee): Promise<Employee> {
    if (!employee) {
      throw new Error('DataService.saveEmployee called with null/undefined employee');
    }
    if (this.isOffline()) {
      enqueueRequest({
        endpoint: `/api/v1/employees/${employee.id}`,
        method: 'PUT',
        body: employee,
      });
      return this.validate('employee', employee);
    }

    const adapter = this.getAdapter();
    const validated = this.validate('employee', employee);
    const previous = await adapter.getEmployee(validated.id);
    try {
      const saved = await adapter.saveEmployee(validated);
      const history = typeof (adapter as any).generateEmployeeDiff === 'function'
        ? this.generateEmployeeDiff(previous, saved, 'system', 'System', previous ? 'UPDATE' : 'CREATE', 'API') as EmployeeHistoryEntry[]
        : [];
      if (typeof (adapter as any).addEmployeeHistory === 'function') await Promise.all(history.map(entry => this.addEmployeeHistory(entry)));
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
      const validated = this.validateArray('employee', employees as Employee[]) as Employee[];
      const adapter = this.getAdapter();
      const previous = await adapter.getEmployees();
      await adapter.saveEmployees(validated);
      const byId = new Map(previous.map(employee => [employee.id, employee]));
      const history = typeof (adapter as any).generateEmployeeDiff === 'function'
        ? validated.flatMap(employee => this.generateEmployeeDiff(byId.get(employee.id) ?? null, employee, 'system', 'System', byId.has(employee.id) ? 'BULK_UPDATE' : 'CREATE', 'BULK_IMPORT') as EmployeeHistoryEntry[])
        : [];
      if (typeof (adapter as any).addEmployeeHistory === 'function') await Promise.all(history.map(entry => this.addEmployeeHistory(entry)));
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
    if (!employeeId) {
      logger.warn('DataService.getAttendanceByEmployee called with empty employeeId');
      return [];
    }
    return this.validateArray('attendance', await this.getAdapter().getAttendanceByEmployee(employeeId));
  }

  async saveAttendance(records: AttendanceRecord[]): Promise<void> {
    if (!records?.length) return;
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
    const validated = this.validate('attendance', record);
    if (this.isOffline()) { enqueueRequest({ endpoint: '/api/v1/attendance', method: 'POST', body: validated }); return; }
    return this.getAdapter().saveAttendanceRecord(validated);
  }

  // ---- Leave ----
  async getLeaves(): Promise<LeaveRecord[]> {
    return this.validateArray('leave', await this.getAdapter().getLeaves());
  }

  async getLeavesByEmployee(employeeId: string): Promise<LeaveRecord[]> {
    if (!employeeId) {
      logger.warn('DataService.getLeavesByEmployee called with empty employeeId');
      return [];
    }
    return this.validateArray('leave', await this.getAdapter().getLeavesByEmployee(employeeId));
  }

  async saveLeave(leave: LeaveRecord): Promise<void> {
    if (!leave) {
      throw new Error('DataService.saveLeave called with null/undefined leave');
    }
    const validated = this.validate('leave', leave);
    if (this.isOffline()) { enqueueRequest({ endpoint: '/api/v1/leaves', method: 'POST', body: validated }); return; }
    return this.getAdapter().saveLeave(validated);
  }

  async saveLeaves(leaves: LeaveRecord[]): Promise<void> {
    if (!leaves?.length) return;
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
    if (!employeeId) {
      logger.warn('DataService.getPayrollByEmployee called with empty employeeId');
      return [];
    }
    return this.validateArray('payroll', await this.getAdapter().getPayrollByEmployee(employeeId));
  }

  async savePayroll(records: PayrollRecord[]): Promise<void> {
    if (!records?.length) return;
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
    const validated = this.validate('candidate', candidate);
    if (this.isOffline()) { enqueueRequest({ endpoint: '/api/v1/candidates', method: 'POST', body: validated }); return; }
    return this.getAdapter().saveCandidate(validated);
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
    return this.validatePersistableArray('stage template', await this.getAdapter().getStageTemplates());
  }

  async saveStageTemplates(templates: StageTemplate[]): Promise<void> {
    return this.getAdapter().saveStageTemplates(this.validatePersistableArray('stage template', templates));
  }

  async getInterviewPanels(): Promise<InterviewPanel[]> {
    return this.validatePersistableArray('interview panel', await this.getAdapter().getInterviewPanels());
  }

  async saveInterviewPanels(panels: InterviewPanel[]): Promise<void> {
    return this.getAdapter().saveInterviewPanels(this.validatePersistableArray('interview panel', panels));
  }

  async getScorecards(): Promise<EvaluationScorecard[]> {
    return this.validatePersistableArray('scorecard', await this.getAdapter().getScorecards());
  }

  async saveScorecards(scorecards: EvaluationScorecard[]): Promise<void> {
    return this.getAdapter().saveScorecards(this.validatePersistableArray('scorecard', scorecards));
  }

  async getJDMatches(): Promise<JDResumeMatch[]> {
    return this.validatePersistableArray('JD match', await this.getAdapter().getJDMatches());
  }

  async saveJDMatches(matches: JDResumeMatch[]): Promise<void> {
    return this.getAdapter().saveJDMatches(this.validatePersistableArray('JD match', matches));
  }

  // ---- Performance ----
  async getPerformanceReviews(): Promise<PerformanceReview[]> {
    return this.validatePersistableArray('performance review', await this.getAdapter().getPerformanceReviews());
  }

  async savePerformanceReview(review: PerformanceReview): Promise<void> {
    return this.getAdapter().savePerformanceReview(this.validatePersistable('performance review', review));
  }

  async savePerformanceReviews(reviews: PerformanceReview[]): Promise<void> {
    return this.getAdapter().savePerformanceReviews(this.validatePersistableArray('performance review', reviews));
  }

  async getPerformanceGoals(): Promise<PerformanceGoal[]> {
    return this.validatePersistableArray('performance goal', await this.getAdapter().getPerformanceGoals());
  }

  async savePerformanceGoal(goal: PerformanceGoal): Promise<void> {
    return this.getAdapter().savePerformanceGoal(this.validatePersistable('performance goal', goal));
  }

  async savePerformanceGoals(goals: PerformanceGoal[]): Promise<void> {
    return this.getAdapter().savePerformanceGoals(this.validatePersistableArray('performance goal', goals));
  }

  // ---- Training ----
  async getTrainingModules(): Promise<TrainingModule[]> {
    return this.validatePersistableArray('training module', await this.getAdapter().getTrainingModules());
  }

  async saveTrainingModule(module: TrainingModule): Promise<void> {
    return this.getAdapter().saveTrainingModule(this.validatePersistable('training module', module));
  }

  async saveTrainingModules(modules: TrainingModule[]): Promise<void> {
    return this.getAdapter().saveTrainingModules(this.validatePersistableArray('training module', modules));
  }

  async getTrainingAssignments(): Promise<TrainingAssignment[]> {
    return this.validatePersistableArray('training assignment', await this.getAdapter().getTrainingAssignments());
  }

  async saveTrainingAssignment(assignment: TrainingAssignment): Promise<void> {
    return this.getAdapter().saveTrainingAssignment(this.validatePersistable('training assignment', assignment));
  }

  async saveTrainingAssignments(assignments: TrainingAssignment[]): Promise<void> {
    return this.getAdapter().saveTrainingAssignments(this.validatePersistableArray('training assignment', assignments));
  }

  async getTrainingQuizzes(): Promise<TrainingQuiz[]> {
    return this.getAdapter().getTrainingQuizzes();
  }

  // ---- Documents ----
  async getDocuments(): Promise<EmployeeDocument[]> {
    return this.validateArray('document', await this.getAdapter().getDocuments());
  }

  async saveDocument(document: EmployeeDocument): Promise<void> {
    if (!document) {
      throw new Error('DataService.saveDocument called with null/undefined document');
    }
    return this.getAdapter().saveDocument(this.validate('document', document));
  }

  async getEmployeeDocuments(): Promise<EmployeeDocument[]> {
    return this.validateArray('document', await this.getAdapter().getEmployeeDocuments());
  }

  async getEmployeeDocumentsByEmployee(employeeId: string): Promise<EmployeeDocument[]> {
    if (!employeeId) {
      logger.warn('DataService.getEmployeeDocumentsByEmployee called with empty employeeId');
      return [];
    }
    return this.validateArray('document', await this.getAdapter().getEmployeeDocumentsByEmployee(employeeId));
  }

  async saveEmployeeDocuments(docs: EmployeeDocument[]): Promise<void> {
    if (!docs?.length) return;
    return this.getAdapter().saveEmployeeDocuments(this.validateArray('document', docs));
  }

  async uploadFile(file: File, folderId: string): Promise<string> {
    return this.getAdapter().uploadFile(file, folderId);
  }

  // ---- Job Descriptions / Onboarding ----
  async getOnboardingTasks(): Promise<LegacyOnboardingTask[]> {
    return this.validatePersistableArray('onboarding task', await this.getAdapter().getOnboardingTasks());
  }

  async getOnboardingTemplates(): Promise<OnboardingTemplate[]> {
    return this.validatePersistableArray('onboarding template', await this.getAdapter().getOnboardingTemplates());
  }

  async saveOnboardingTasks(tasks: LegacyOnboardingTask[]): Promise<void> {
    return this.getAdapter().saveOnboardingTasks(this.validatePersistableArray('onboarding task', tasks));
  }

  async getSuccessionPlans(): Promise<SuccessionPlan[]> {
    return this.validatePersistableArray('succession plan', await this.getAdapter().getSuccessionPlans());
  }

  async saveSuccessionPlans(plans: SuccessionPlan[]): Promise<void> {
    return this.getAdapter().saveSuccessionPlans(this.validatePersistableArray('succession plan', plans));
  }

  async getJobDescriptions(): Promise<JobDescription[]> {
    return this.validatePersistableArray('job description', await this.getAdapter().getJobDescriptions());
  }

  async saveJobDescriptions(jobs: JobDescription[]): Promise<void> {
    return this.getAdapter().saveJobDescriptions(this.validatePersistableArray('job description', jobs));
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

  async getBiometricPunchRecords(): Promise<BiometricPunchRecord[]> {
    return this.validatePersistableArray('biometric punch', await this.getAdapter().getBiometricPunchRecords());
  }

  async saveBiometricPunchRecords(records: BiometricPunchRecord[]): Promise<void> {
    return this.getAdapter().saveBiometricPunchRecords(this.validatePersistableArray('biometric punch', records));
  }

  async getBiometricSyncLogs(): Promise<BiometricSyncLog[]> {
    return this.validatePersistableArray('biometric sync log', await this.getAdapter().getBiometricSyncLogs());
  }

  async saveBiometricSyncLogs(logs: BiometricSyncLog[]): Promise<void> {
    return this.getAdapter().saveBiometricSyncLogs(this.validatePersistableArray('biometric sync log', logs));
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
    return this.validatePersistableArray('exit record', await this.getAdapter().getExitRecords());
  }

  async saveExitRecords(records: ExitRecord[]): Promise<void> {
    return this.getAdapter().saveExitRecords(this.validatePersistableArray('exit record', records));
  }

  // ---- Exit Templates ----
  async getExitChecklistTemplates(): Promise<ExitChecklistTemplate[]> {
    return this.getAdapter().getExitChecklistTemplates();
  }

  async getExitInterviewTemplates(): Promise<ExitInterviewTemplate[]> {
    return this.getAdapter().getExitInterviewTemplates();
  }

  async getExitProcessStages(): Promise<ExitProcessStage[]> {
    return this.validatePersistableArray('exit process stage', await this.getAdapter().getExitProcessStages());
  }

  async saveExitProcessStages(stages: ExitProcessStage[]): Promise<void> {
    return this.getAdapter().saveExitProcessStages(this.validatePersistableArray('exit process stage', stages));
  }

  async getSettlementConfig(): Promise<SettlementConfig | null> {
    return this.getAdapter().getSettlementConfig();
  }

  async saveSettlementConfig(config: SettlementConfig): Promise<void> {
    return this.getAdapter().saveSettlementConfig(config);
  }

  async getPerformanceReviewCycles(): Promise<PerformanceReviewCycle[]> {
    return this.validatePersistableArray('performance review cycle', await this.getAdapter().getPerformanceReviewCycles());
  }

  async savePerformanceReviewCycles(cycles: PerformanceReviewCycle[]): Promise<void> {
    return this.getAdapter().savePerformanceReviewCycles(this.validatePersistableArray('performance review cycle', cycles));
  }

  async getPerformanceReviewTemplates(): Promise<PerformanceReviewTemplate[]> {
    return this.validatePersistableArray('performance review template', await this.getAdapter().getPerformanceReviewTemplates());
  }

  async savePerformanceReviewTemplates(templates: PerformanceReviewTemplate[]): Promise<void> {
    return this.getAdapter().savePerformanceReviewTemplates(this.validatePersistableArray('performance review template', templates));
  }

  async getTrainingSubmissions(): Promise<TrainingSubmission[]> {
    return this.validatePersistableArray('training submission', await this.getAdapter().getTrainingSubmissions());
  }

  async saveTrainingSubmissions(submissions: TrainingSubmission[]): Promise<void> {
    return this.getAdapter().saveTrainingSubmissions(this.validatePersistableArray('training submission', submissions));
  }

  async getPeerAssignments(): Promise<PeerAssignment[]> {
    return this.validatePersistableArray('peer assignment', await this.getAdapter().getPeerAssignments());
  }

  async savePeerAssignments(assignments: PeerAssignment[]): Promise<void> {
    return this.getAdapter().savePeerAssignments(this.validatePersistableArray('peer assignment', assignments));
  }

  async getTrainingRequests(): Promise<TrainingRequest[]> {
    return this.validatePersistableArray('training request', await this.getAdapter().getTrainingRequests());
  }

  async saveTrainingRequests(requests: TrainingRequest[]): Promise<void> {
    return this.getAdapter().saveTrainingRequests(this.validatePersistableArray('training request', requests));
  }

  async getTrainingMentorships(): Promise<TrainingMentorship[]> {
    return this.validatePersistableArray('training mentorship', await this.getAdapter().getTrainingMentorships());
  }

  async saveTrainingMentorships(mentorships: TrainingMentorship[]): Promise<void> {
    return this.getAdapter().saveTrainingMentorships(this.validatePersistableArray('training mentorship', mentorships));
  }

  async getTrainingCheckIns(): Promise<TrainingCheckIn[]> {
    return this.validatePersistableArray('training check-in', await this.getAdapter().getTrainingCheckIns());
  }

  async saveTrainingCheckIns(checkIns: TrainingCheckIn[]): Promise<void> {
    return this.getAdapter().saveTrainingCheckIns(this.validatePersistableArray('training check-in', checkIns));
  }

  async getTrainingMessages(): Promise<TrainingMessage[]> {
    return this.validatePersistableArray('training message', await this.getAdapter().getTrainingMessages());
  }

  async saveTrainingMessages(messages: TrainingMessage[]): Promise<void> {
    return this.getAdapter().saveTrainingMessages(this.validatePersistableArray('training message', messages));
  }

  async getSalaryComponents(): Promise<SalaryComponent[]> {
    return this.validatePersistableArray('salary component', await this.getAdapter().getSalaryComponents());
  }

  async saveSalaryComponents(components: SalaryComponent[]): Promise<void> {
    return this.getAdapter().saveSalaryComponents(this.validatePersistableArray('salary component', components));
  }

  async getSalaryStructures(): Promise<SalaryStructure[]> {
    return this.validatePersistableArray('salary structure', await this.getAdapter().getSalaryStructures());
  }

  async saveSalaryStructures(structures: SalaryStructure[]): Promise<void> {
    return this.getAdapter().saveSalaryStructures(this.validatePersistableArray('salary structure', structures));
  }

  async getPayGrades(): Promise<PayGrade[]> {
    return this.validatePersistableArray('pay grade', await this.getAdapter().getPayGrades());
  }

  async savePayGrades(payGrades: PayGrade[]): Promise<void> {
    return this.getAdapter().savePayGrades(this.validatePersistableArray('pay grade', payGrades));
  }

  async getSalaryRevisions(): Promise<SalaryRevision[]> {
    return this.validatePersistableArray('salary revision', await this.getAdapter().getSalaryRevisions());
  }

  async saveSalaryRevisions(revisions: SalaryRevision[]): Promise<void> {
    return this.getAdapter().saveSalaryRevisions(this.validatePersistableArray('salary revision', revisions));
  }

  async getSalaryRevisionsByEmployee(employeeId: string): Promise<SalaryRevision[]> {
    return this.getAdapter().getSalaryRevisionsByEmployee(employeeId);
  }

  async saveSalaryStructure(structure: SalaryStructure): Promise<void> {
    return this.getAdapter().saveSalaryStructure(this.validatePersistable('salary structure', structure));
  }

  async getSalaryStructureByEmployee(employeeId: string): Promise<SalaryStructure | null> {
    return this.getAdapter().getSalaryStructureByEmployee(employeeId);
  }

  async addSalaryRevision(revision: SalaryRevision): Promise<void> {
    return this.getAdapter().addSalaryRevision(revision);
  }

  async getShifts(): Promise<Shift[]> {
    return this.validatePersistableArray('shift', await this.getAdapter().getShifts());
  }

  async saveShifts(shifts: Shift[]): Promise<void> {
    return this.getAdapter().saveShifts(this.validatePersistableArray('shift', shifts));
  }

  async getShiftAssignments(): Promise<ShiftAssignment[]> {
    return this.validatePersistableArray('shift assignment', await this.getAdapter().getShiftAssignments());
  }

  async saveShiftAssignments(assignments: ShiftAssignment[]): Promise<void> {
    return this.getAdapter().saveShiftAssignments(this.validatePersistableArray('shift assignment', assignments));
  }

  async getShiftSwapRequests(): Promise<ShiftSwapRequest[]> {
    return this.validatePersistableArray('shift swap request', await this.getAdapter().getShiftSwapRequests());
  }

  async saveShiftSwapRequests(requests: ShiftSwapRequest[]): Promise<void> {
    return this.getAdapter().saveShiftSwapRequests(this.validatePersistableArray('shift swap request', requests));
  }

  async getShiftTemplates(): Promise<ShiftTemplate[]> {
    return this.validatePersistableArray('shift template', await this.getAdapter().getShiftTemplates());
  }

  async saveShiftTemplates(templates: ShiftTemplate[]): Promise<void> {
    return this.getAdapter().saveShiftTemplates(this.validatePersistableArray('shift template', templates));
  }

  async getCurrencies(): Promise<Currency[]> {
    return this.validatePersistableArray('currency', await this.getAdapter().getCurrencies());
  }

  async saveCurrencies(currencies: Currency[]): Promise<void> {
    return this.getAdapter().saveCurrencies(this.validatePersistableArray('currency', currencies));
  }

  async getTaxRules(): Promise<TaxRule[]> {
    return this.validatePersistableArray('tax rule', await this.getAdapter().getTaxRules());
  }

  async saveTaxRules(rules: TaxRule[]): Promise<void> {
    return this.getAdapter().saveTaxRules(this.validatePersistableArray('tax rule', rules));
  }

  async getStatutoryDeductions(): Promise<StatutoryDeduction[]> {
    return this.validatePersistableArray('statutory deduction', await this.getAdapter().getStatutoryDeductions());
  }

  async saveStatutoryDeductions(deductions: StatutoryDeduction[]): Promise<void> {
    return this.getAdapter().saveStatutoryDeductions(this.validatePersistableArray('statutory deduction', deductions));
  }

  async getPayrollCalculations(): Promise<PayrollCalculation[]> {
    return this.validatePersistableArray('payroll calculation', await this.getAdapter().getPayrollCalculations());
  }

  async savePayrollCalculations(calculations: PayrollCalculation[]): Promise<void> {
    return this.getAdapter().savePayrollCalculations(this.validatePersistableArray('payroll calculation', calculations));
  }

  async getLeavePolicies(): Promise<LeavePolicy[]> {
    return this.validatePersistableArray('leave policy', await this.getAdapter().getLeavePolicies());
  }

  async saveLeavePolicies(policies: LeavePolicy[]): Promise<void> {
    return this.getAdapter().saveLeavePolicies(this.validatePersistableArray('leave policy', policies));
  }

  async getLeaveTypeConfigs(): Promise<any[]> {
    return this.validatePersistableArray('leave type config', await this.getAdapter().getLeaveTypeConfigs());
  }

  async saveLeaveTypeConfigs(configs: any[]): Promise<void> {
    return this.getAdapter().saveLeaveTypeConfigs(this.validatePersistableArray('leave type config', configs));
  }

  async getRecruitmentAnalytics(): Promise<RecruitmentAnalytics[]> {
    return this.validatePersistableArray('recruitment analytics', await this.getAdapter().getRecruitmentAnalytics());
  }

  async saveRecruitmentAnalytics(analytics: RecruitmentAnalytics[]): Promise<void> {
    return this.getAdapter().saveRecruitmentAnalytics(this.validatePersistableArray('recruitment analytics', analytics));
  }

  async getHires(): Promise<HireDetails[]> {
    return this.getAdapter().getHires();
  }

  async saveHires(hires: HireDetails[]): Promise<void> {
    return this.getAdapter().saveHires(hires);
  }

  async getInterviewSchedules(): Promise<InterviewSchedule[]> {
    return this.validatePersistableArray('interview schedule', await this.getAdapter().getInterviewSchedules());
  }

  async saveInterviewSchedules(schedules: InterviewSchedule[]): Promise<void> {
    return this.getAdapter().saveInterviewSchedules(this.validatePersistableArray('interview schedule', schedules));
  }

  async getOrgChartNodes(): Promise<OrgChartNode[]> {
    return this.validatePersistableArray('org chart node', await this.getAdapter().getOrgChartNodes());
  }

  async saveOrgChartNodes(nodes: OrgChartNode[]): Promise<void> {
    return this.getAdapter().saveOrgChartNodes(this.validatePersistableArray('org chart node', nodes));
  }

  async getPayslips(): Promise<any[]> {
    return this.validatePersistableArray('payslip', await this.getAdapter().getPayslips());
  }

  async savePayslips(payslips: any[]): Promise<void> {
    return this.getAdapter().savePayslips(this.validatePersistableArray('payslip', payslips));
  }

  async getNotifications(): Promise<any[]> {
    return this.validatePersistableArray('notification', await this.getAdapter().getNotifications());
  }

  async saveNotifications(notifications: any[]): Promise<void> {
    return this.getAdapter().saveNotifications(this.validatePersistableArray('notification', notifications));
  }

  async getUsers(): Promise<any[]> {
    return this.validatePersistableArray('user', await this.getAdapter().getUsers());
  }

  async saveUsers(users: any[]): Promise<void> {
    return this.getAdapter().saveUsers(this.validatePersistableArray('user', users));
  }

  async getStatusHistory(): Promise<EmployeeStatusHistory[]> {
    return this.validatePersistableArray('status history', await this.getAdapter().getStatusHistory());
  }

  async saveStatusHistory(history: EmployeeStatusHistory[]): Promise<void> {
    return this.getAdapter().saveStatusHistory(this.validatePersistableArray('status history', history));
  }

  async getSheetLogs(): Promise<SheetLog[]> {
    return this.getAdapter().getSheetLogs();
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
