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
    return this.getAdapter().saveAttendanceRecord(this.validate('attendance', record));
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
    return this.getAdapter().saveLeave(this.validate('leave', leave));
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

  async savePerformanceGoals(goals: PerformanceGoal[]): Promise<void> {
    return this.getAdapter().savePerformanceGoals(goals);
  }

  // ---- Training ----
  async getTrainingModules(): Promise<TrainingModule[]> {
    return this.getAdapter().getTrainingModules();
  }

  async saveTrainingModule(module: TrainingModule): Promise<void> {
    return this.getAdapter().saveTrainingModule(module);
  }

  async saveTrainingModules(modules: TrainingModule[]): Promise<void> {
    return this.getAdapter().saveTrainingModules(modules);
  }

  async getTrainingAssignments(): Promise<TrainingAssignment[]> {
    return this.getAdapter().getTrainingAssignments();
  }

  async saveTrainingAssignment(assignment: TrainingAssignment): Promise<void> {
    return this.getAdapter().saveTrainingAssignment(assignment);
  }

  async saveTrainingAssignments(assignments: TrainingAssignment[]): Promise<void> {
    return this.getAdapter().saveTrainingAssignments(assignments);
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

  async getBiometricPunchRecords(): Promise<BiometricPunchRecord[]> {
    return this.getAdapter().getBiometricPunchRecords();
  }

  async saveBiometricPunchRecords(records: BiometricPunchRecord[]): Promise<void> {
    return this.getAdapter().saveBiometricPunchRecords(records);
  }

  async getBiometricSyncLogs(): Promise<BiometricSyncLog[]> {
    return this.getAdapter().getBiometricSyncLogs();
  }

  async saveBiometricSyncLogs(logs: BiometricSyncLog[]): Promise<void> {
    return this.getAdapter().saveBiometricSyncLogs(logs);
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

  async getExitProcessStages(): Promise<ExitProcessStage[]> {
    return this.getAdapter().getExitProcessStages();
  }

  async saveExitProcessStages(stages: ExitProcessStage[]): Promise<void> {
    return this.getAdapter().saveExitProcessStages(stages);
  }

  async getSettlementConfig(): Promise<SettlementConfig | null> {
    return this.getAdapter().getSettlementConfig();
  }

  async saveSettlementConfig(config: SettlementConfig): Promise<void> {
    return this.getAdapter().saveSettlementConfig(config);
  }

  async getPerformanceReviewCycles(): Promise<PerformanceReviewCycle[]> {
    return this.getAdapter().getPerformanceReviewCycles();
  }

  async savePerformanceReviewCycles(cycles: PerformanceReviewCycle[]): Promise<void> {
    return this.getAdapter().savePerformanceReviewCycles(cycles);
  }

  async getPerformanceReviewTemplates(): Promise<PerformanceReviewTemplate[]> {
    return this.getAdapter().getPerformanceReviewTemplates();
  }

  async savePerformanceReviewTemplates(templates: PerformanceReviewTemplate[]): Promise<void> {
    return this.getAdapter().savePerformanceReviewTemplates(templates);
  }

  async getTrainingSubmissions(): Promise<TrainingSubmission[]> {
    return this.getAdapter().getTrainingSubmissions();
  }

  async saveTrainingSubmissions(submissions: TrainingSubmission[]): Promise<void> {
    return this.getAdapter().saveTrainingSubmissions(submissions);
  }

  async getPeerAssignments(): Promise<PeerAssignment[]> {
    return this.getAdapter().getPeerAssignments();
  }

  async savePeerAssignments(assignments: PeerAssignment[]): Promise<void> {
    return this.getAdapter().savePeerAssignments(assignments);
  }

  async getTrainingRequests(): Promise<TrainingRequest[]> {
    return this.getAdapter().getTrainingRequests();
  }

  async saveTrainingRequests(requests: TrainingRequest[]): Promise<void> {
    return this.getAdapter().saveTrainingRequests(requests);
  }

  async getTrainingMentorships(): Promise<TrainingMentorship[]> {
    return this.getAdapter().getTrainingMentorships();
  }

  async saveTrainingMentorships(mentorships: TrainingMentorship[]): Promise<void> {
    return this.getAdapter().saveTrainingMentorships(mentorships);
  }

  async getTrainingCheckIns(): Promise<TrainingCheckIn[]> {
    return this.getAdapter().getTrainingCheckIns();
  }

  async saveTrainingCheckIns(checkIns: TrainingCheckIn[]): Promise<void> {
    return this.getAdapter().saveTrainingCheckIns(checkIns);
  }

  async getTrainingMessages(): Promise<TrainingMessage[]> {
    return this.getAdapter().getTrainingMessages();
  }

  async saveTrainingMessages(messages: TrainingMessage[]): Promise<void> {
    return this.getAdapter().saveTrainingMessages(messages);
  }

  async getSalaryComponents(): Promise<SalaryComponent[]> {
    return this.getAdapter().getSalaryComponents();
  }

  async saveSalaryComponents(components: SalaryComponent[]): Promise<void> {
    return this.getAdapter().saveSalaryComponents(components);
  }

  async getSalaryStructures(): Promise<SalaryStructure[]> {
    return this.getAdapter().getSalaryStructures();
  }

  async saveSalaryStructures(structures: SalaryStructure[]): Promise<void> {
    return this.getAdapter().saveSalaryStructures(structures);
  }

  async getPayGrades(): Promise<PayGrade[]> {
    return this.getAdapter().getPayGrades();
  }

  async savePayGrades(payGrades: PayGrade[]): Promise<void> {
    return this.getAdapter().savePayGrades(payGrades);
  }

  async getSalaryRevisions(): Promise<SalaryRevision[]> {
    return this.getAdapter().getSalaryRevisions();
  }

  async saveSalaryRevisions(revisions: SalaryRevision[]): Promise<void> {
    return this.getAdapter().saveSalaryRevisions(revisions);
  }

  async getSalaryRevisionsByEmployee(employeeId: string): Promise<SalaryRevision[]> {
    return this.getAdapter().getSalaryRevisionsByEmployee(employeeId);
  }

  async saveSalaryStructure(structure: SalaryStructure): Promise<void> {
    return this.getAdapter().saveSalaryStructure(structure);
  }

  async getSalaryStructureByEmployee(employeeId: string): Promise<SalaryStructure | null> {
    return this.getAdapter().getSalaryStructureByEmployee(employeeId);
  }

  async addSalaryRevision(revision: SalaryRevision): Promise<void> {
    return this.getAdapter().addSalaryRevision(revision);
  }

  async getShifts(): Promise<Shift[]> {
    return this.getAdapter().getShifts();
  }

  async saveShifts(shifts: Shift[]): Promise<void> {
    return this.getAdapter().saveShifts(shifts);
  }

  async getShiftAssignments(): Promise<ShiftAssignment[]> {
    return this.getAdapter().getShiftAssignments();
  }

  async saveShiftAssignments(assignments: ShiftAssignment[]): Promise<void> {
    return this.getAdapter().saveShiftAssignments(assignments);
  }

  async getShiftSwapRequests(): Promise<ShiftSwapRequest[]> {
    return this.getAdapter().getShiftSwapRequests();
  }

  async saveShiftSwapRequests(requests: ShiftSwapRequest[]): Promise<void> {
    return this.getAdapter().saveShiftSwapRequests(requests);
  }

  async getShiftTemplates(): Promise<ShiftTemplate[]> {
    return this.getAdapter().getShiftTemplates();
  }

  async saveShiftTemplates(templates: ShiftTemplate[]): Promise<void> {
    return this.getAdapter().saveShiftTemplates(templates);
  }

  async getCurrencies(): Promise<Currency[]> {
    return this.getAdapter().getCurrencies();
  }

  async saveCurrencies(currencies: Currency[]): Promise<void> {
    return this.getAdapter().saveCurrencies(currencies);
  }

  async getTaxRules(): Promise<TaxRule[]> {
    return this.getAdapter().getTaxRules();
  }

  async saveTaxRules(rules: TaxRule[]): Promise<void> {
    return this.getAdapter().saveTaxRules(rules);
  }

  async getStatutoryDeductions(): Promise<StatutoryDeduction[]> {
    return this.getAdapter().getStatutoryDeductions();
  }

  async saveStatutoryDeductions(deductions: StatutoryDeduction[]): Promise<void> {
    return this.getAdapter().saveStatutoryDeductions(deductions);
  }

  async getPayrollCalculations(): Promise<PayrollCalculation[]> {
    return this.getAdapter().getPayrollCalculations();
  }

  async savePayrollCalculations(calculations: PayrollCalculation[]): Promise<void> {
    return this.getAdapter().savePayrollCalculations(calculations);
  }

  async getLeavePolicies(): Promise<LeavePolicy[]> {
    return this.getAdapter().getLeavePolicies();
  }

  async saveLeavePolicies(policies: LeavePolicy[]): Promise<void> {
    return this.getAdapter().saveLeavePolicies(policies);
  }

  async getLeaveTypeConfigs(): Promise<any[]> {
    return this.getAdapter().getLeaveTypeConfigs();
  }

  async saveLeaveTypeConfigs(configs: any[]): Promise<void> {
    return this.getAdapter().saveLeaveTypeConfigs(configs);
  }

  async getRecruitmentAnalytics(): Promise<RecruitmentAnalytics[]> {
    return this.getAdapter().getRecruitmentAnalytics();
  }

  async saveRecruitmentAnalytics(analytics: RecruitmentAnalytics[]): Promise<void> {
    return this.getAdapter().saveRecruitmentAnalytics(analytics);
  }

  async getHires(): Promise<HireDetails[]> {
    return this.getAdapter().getHires();
  }

  async saveHires(hires: HireDetails[]): Promise<void> {
    return this.getAdapter().saveHires(hires);
  }

  async getInterviewSchedules(): Promise<InterviewSchedule[]> {
    return this.getAdapter().getInterviewSchedules();
  }

  async saveInterviewSchedules(schedules: InterviewSchedule[]): Promise<void> {
    return this.getAdapter().saveInterviewSchedules(schedules);
  }

  async getOrgChartNodes(): Promise<OrgChartNode[]> {
    return this.getAdapter().getOrgChartNodes();
  }

  async saveOrgChartNodes(nodes: OrgChartNode[]): Promise<void> {
    return this.getAdapter().saveOrgChartNodes(nodes);
  }

  async getPayslips(): Promise<any[]> {
    return this.getAdapter().getPayslips();
  }

  async savePayslips(payslips: any[]): Promise<void> {
    return this.getAdapter().savePayslips(payslips);
  }

  async getNotifications(): Promise<any[]> {
    return this.getAdapter().getNotifications();
  }

  async saveNotifications(notifications: any[]): Promise<void> {
    return this.getAdapter().saveNotifications(notifications);
  }

  async getUsers(): Promise<any[]> {
    return this.getAdapter().getUsers();
  }

  async saveUsers(users: any[]): Promise<void> {
    return this.getAdapter().saveUsers(users);
  }

  async getStatusHistory(): Promise<EmployeeStatusHistory[]> {
    return this.getAdapter().getStatusHistory();
  }

  async saveStatusHistory(history: EmployeeStatusHistory[]): Promise<void> {
    return this.getAdapter().saveStatusHistory(history);
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
