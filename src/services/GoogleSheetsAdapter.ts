import { IDataAdapter } from './interfaces/IDataAdapter';
import {
  Employee, AttendanceRecord, PayrollRecord, LeaveRecord, Candidate,
  Department, Designation, EmployeeDocument, SuccessionPlan, LegacyOnboardingTask,
  OnboardingTemplate, OrgChartNode, JobDescription, JDResumeMatch, WhatsAppMessage, WhatsAppTemplate,
  InterviewSchedule, LeavePolicy, Shift, ShiftAssignment, ShiftSwapRequest,
  ShiftTemplate, Currency, TaxRule, StatutoryDeduction, PayrollCalculation,
  PerformanceReviewCycle, PerformanceReview, PerformanceGoal, TrainingModule,
  TrainingSubmission, ExitRecord, SalaryStructure, PayGrade, SalaryRevision,
  AppSettings, TrainingAssignment
} from '../types';
import {
  BiometricDeviceConfig, StageTemplate, InterviewPanel, EvaluationScorecard,
  EmployeeHistoryEntry, ExitChecklistTemplate, ExitInterviewTemplate
} from '../types';
import {
  serializeEmployee, deserializeEmployee,
  serializeAttendance, deserializeAttendance,
  serializePayroll, deserializePayroll,
  serializeLeave, deserializeLeave,
  serializeCandidate, deserializeCandidate,
  serializeDepartment, deserializeDepartment,
  serializeDesignation, deserializeDesignation,
  serializeEmployeeDocument, deserializeEmployeeDocument,
  serializeSuccession, deserializeSuccession,
  serializeOnboardingTask, deserializeOnboardingTask,
  serializeOrgChart, deserializeOrgChart,
  serializeHire, deserializeHire,
  serializeInterviewSchedule, deserializeInterviewSchedule,
  serializeWhatsAppMessage, deserializeWhatsAppMessage,
  EMPLOYEE_HEADERS, ATTENDANCE_HEADERS, PAYROLL_HEADERS, LEAVES_HEADERS,
  RECRUITMENT_HEADERS, DEPARTMENT_HEADERS, DESIGNATION_HEADERS, DOCUMENTS_HEADERS
} from '../lib/storage';
import {
  readSheet,
  appendToSheet,
  updateSheet,
  findRowById,
  ensureSheetExists,
} from './googleSheetsService';
import { LocalStorageAdapter } from './LocalStorageAdapter';
import { logger } from '../lib/logger';
import { getColumnLetter } from '../lib/columnUtils';

/** Maps rows through a deserializer, isolating per-row failures. */
function mapRowsSafe<T>(rows: any[][], deserialize: (row: any[]) => T): T[] {
  if (!Array.isArray(rows)) return [];
  const out: T[] = [];
  for (const row of rows) {
    try {
      out.push(deserialize(row));
    } catch (err) {
      logger.error('mapRowsSafe: skipping malformed row:', err);
    }
  }
  return out;
}

export class GoogleSheetsAdapter implements IDataAdapter {
  private spreadsheetId: string;
  private settings: AppSettings;
  private localFallback = new LocalStorageAdapter();

  constructor(settings: AppSettings) {
    if (!settings?.googleSheets?.spreadsheetId) {
      throw new Error('GoogleSheetsAdapter requires settings.googleSheets.spreadsheetId');
    }
    this.spreadsheetId = settings.googleSheets.spreadsheetId;
    this.settings = settings;
  }

  async connect(): Promise<void> {
    try {
      await ensureSheetExists('HumailEli_Employees', ['id']);
    } catch (e: any) {
      console.warn(`Google Sheets connection failed: ${e.message}`);
    }
  }

  async disconnect(): Promise<void> {}

  // ============================================================
  //  EMPLOYEES
  // ============================================================
  async getEmployees(): Promise<Employee[]> {
    try {
      const rows = await readSheet('HumailEli_Employees', 'A2:CZ');
      return mapRowsSafe(rows, deserializeEmployee);
    } catch (e: any) { logger.warn('GoogleSheetsAdapter read failed, serving error:', e?.message); throw e; }
  }

  async getEmployee(id: string): Promise<Employee | null> {
    const emps = await this.getEmployees();
    return emps.find(e => e.id === id) || null;
  }

  async saveEmployee(employee: Employee): Promise<Employee> {
    // Row-level upsert to avoid read-modify-write race conditions.
    const rowIndex = await findRowById('HumailEli_Employees', employee.id);
    const serialized = serializeEmployee(employee);
    if (rowIndex !== -1) {
      const endCol = getColumnLetter(EMPLOYEE_HEADERS.length);
      await updateSheet('HumailEli_Employees', `A${rowIndex}:${endCol}${rowIndex}`, [serialized]);
    } else {
      await appendToSheet('HumailEli_Employees', [serialized]);
    }
    return employee;
  }

  async saveEmployees(employees: Employee[]): Promise<void> {
    try {
      const headers = EMPLOYEE_HEADERS;
      const rows = employees.map(serializeEmployee);
      await updateSheet('HumailEli_Employees', 'A1', [headers, ...rows]);
    } catch (e: any) { logger.error('GoogleSheetsAdapter write failed; data NOT persisted:', e?.message); throw e; }
  }

  async deleteEmployee(id: string): Promise<void> {
    const emps = await this.getEmployees();
    await this.saveEmployees(emps.filter(e => e.id !== id));
  }

  // ============================================================
  //  ATTENDANCE
  // ============================================================
  async getAttendance(): Promise<AttendanceRecord[]> {
    try {
      const sheetName = this.settings.googleSheets.attendanceSheet || 'HumailEli_Attendance';
      const rows = await readSheet(sheetName, 'A2:I');
      return mapRowsSafe(rows, deserializeAttendance);
    } catch (e: any) { logger.warn('GoogleSheetsAdapter read failed, serving error:', e?.message); throw e; }
  }

  async getAttendanceByEmployee(employeeId: string): Promise<AttendanceRecord[]> {
    const records = await this.getAttendance();
    return records.filter(r => r.employeeId === employeeId);
  }

  async saveAttendance(records: AttendanceRecord[]): Promise<void> {
    try {
      const sheetName = this.settings.googleSheets.attendanceSheet || 'HumailEli_Attendance';
      const rows = records.map(serializeAttendance);
      await updateSheet(sheetName, 'A1', [ATTENDANCE_HEADERS, ...rows]);
    } catch (e: any) { logger.error('GoogleSheetsAdapter write failed; data NOT persisted:', e?.message); throw e; }
  }

  async saveAttendanceRecord(record: AttendanceRecord): Promise<void> {
    const sheetName = this.settings.googleSheets.attendanceSheet || 'HumailEli_Attendance';
    const rowIndex = await findRowById(sheetName, record.id);
    const serialized = serializeAttendance(record);
    if (rowIndex !== -1) {
      const endCol = getColumnLetter(ATTENDANCE_HEADERS.length);
      await updateSheet(sheetName, `A${rowIndex}:${endCol}${rowIndex}`, [serialized]);
    } else {
      await appendToSheet(sheetName, [serialized]);
    }
  }

  // ============================================================
  //  PAYROLL
  // ============================================================
  async getPayroll(): Promise<PayrollRecord[]> {
    try {
      const sheetName = this.settings.googleSheets.payrollSheet || 'HumailEli_Payroll';
      const rows = await readSheet(sheetName, 'A2:K');
      return mapRowsSafe(rows, deserializePayroll);
    } catch (e: any) { logger.warn('GoogleSheetsAdapter read failed, serving error:', e?.message); throw e; }
  }

  async getPayrollByEmployee(employeeId: string): Promise<PayrollRecord[]> {
    const records = await this.getPayroll();
    return records.filter(p => p.employeeId === employeeId);
  }

  async savePayroll(records: PayrollRecord[]): Promise<void> {
    try {
      const sheetName = this.settings.googleSheets.payrollSheet || 'HumailEli_Payroll';
      const rows = records.map(serializePayroll);
      await updateSheet(sheetName, 'A1', [PAYROLL_HEADERS, ...rows]);
    } catch (e: any) { logger.error('GoogleSheetsAdapter write failed; data NOT persisted:', e?.message); throw e; }
  }

  // ============================================================
  //  LEAVES
  // ============================================================
  async getLeaves(): Promise<LeaveRecord[]> {
    try {
      const sheetName = this.settings.googleSheets.leaveSheet || 'HumailEli_Leaves';
      const rows = await readSheet(sheetName, 'A2:J');
      return mapRowsSafe(rows, deserializeLeave);
    } catch (e: any) { logger.warn('GoogleSheetsAdapter read failed, serving error:', e?.message); throw e; }
  }

  async getLeavesByEmployee(employeeId: string): Promise<LeaveRecord[]> {
    const leaves = await this.getLeaves();
    return leaves.filter(l => l.employeeId === employeeId);
  }

  async saveLeave(leave: LeaveRecord): Promise<void> {
    const sheetName = this.settings.googleSheets.leaveSheet || 'HumailEli_Leaves';
    const rowIndex = await findRowById(sheetName, leave.id);
    const serialized = serializeLeave(leave);
    if (rowIndex !== -1) {
      const endCol = getColumnLetter(LEAVES_HEADERS.length);
      await updateSheet(sheetName, `A${rowIndex}:${endCol}${rowIndex}`, [serialized]);
    } else {
      await appendToSheet(sheetName, [serialized]);
    }
  }

  async saveLeaves(records: LeaveRecord[]): Promise<void> {
    try {
      const sheetName = this.settings.googleSheets.leaveSheet || 'HumailEli_Leaves';
      const rows = records.map(serializeLeave);
      await updateSheet(sheetName, 'A1', [LEAVES_HEADERS, ...rows]);
    } catch (e: any) { logger.error('GoogleSheetsAdapter write failed; data NOT persisted:', e?.message); throw e; }
  }

  // ============================================================
  //  CANDIDATES
  // ============================================================
  async getCandidates(): Promise<Candidate[]> {
    try {
      const rows = await readSheet('HumailEli_Recruitment', 'A2:O');
      return mapRowsSafe(rows, deserializeCandidate);
    } catch (e: any) { logger.warn('GoogleSheetsAdapter read failed, serving error:', e?.message); throw e; }
  }

  async saveCandidate(candidate: Candidate): Promise<void> {
    const rowIndex = await findRowById('HumailEli_Recruitment', candidate.id);
    const serialized = serializeCandidate(candidate);
    if (rowIndex !== -1) {
      const endCol = getColumnLetter(RECRUITMENT_HEADERS.length);
      await updateSheet('HumailEli_Recruitment', `A${rowIndex}:${endCol}${rowIndex}`, [serialized]);
    } else {
      await appendToSheet('HumailEli_Recruitment', [serialized]);
    }
  }

  async saveCandidates(candidates: Candidate[]): Promise<void> {
    try {
      const rows = candidates.map(serializeCandidate);
      await updateSheet('HumailEli_Recruitment', 'A1', [RECRUITMENT_HEADERS, ...rows]);
    } catch (e: any) { logger.error('GoogleSheetsAdapter write failed; data NOT persisted:', e?.message); throw e; }
  }

  // ============================================================
  //  DEPARTMENTS & DESIGNATIONS
  // ============================================================
  async getDepartments(): Promise<Department[]> {
    try {
      const rows = await readSheet('HumailEli_Departments', 'A2:N');
      return mapRowsSafe(rows, deserializeDepartment);
    } catch (e: any) { logger.warn('GoogleSheetsAdapter read failed, serving error:', e?.message); throw e; }
  }

  async saveDepartment(department: Department): Promise<void> {
    const rowIndex = await findRowById('HumailEli_Departments', department.id);
    const serialized = serializeDepartment(department);
    if (rowIndex !== -1) {
      const endCol = getColumnLetter(DEPARTMENT_HEADERS.length);
      await updateSheet('HumailEli_Departments', `A${rowIndex}:${endCol}${rowIndex}`, [serialized]);
    } else {
      await appendToSheet('HumailEli_Departments', [serialized]);
    }
  }

  async saveDepartments(depts: Department[]): Promise<void> {
    try {
      const rows = depts.map(serializeDepartment);
      await updateSheet('HumailEli_Departments', 'A1', [DEPARTMENT_HEADERS, ...rows]);
    } catch (e: any) { logger.error('GoogleSheetsAdapter write failed; data NOT persisted:', e?.message); throw e; }
  }

  async getDesignations(): Promise<Designation[]> {
    try {
      const rows = await readSheet('HumailEli_Designations', 'A2:M');
      return mapRowsSafe(rows, deserializeDesignation);
    } catch (e: any) { logger.warn('GoogleSheetsAdapter read failed, serving error:', e?.message); throw e; }
  }

  async saveDesignation(designation: Designation): Promise<void> {
    const rowIndex = await findRowById('HumailEli_Designations', designation.id);
    const serialized = serializeDesignation(designation);
    if (rowIndex !== -1) {
      const endCol = getColumnLetter(DESIGNATION_HEADERS.length);
      await updateSheet('HumailEli_Designations', `A${rowIndex}:${endCol}${rowIndex}`, [serialized]);
    } else {
      await appendToSheet('HumailEli_Designations', [serialized]);
    }
  }

  async saveDesignations(designations: Designation[]): Promise<void> {
    try {
      const rows = designations.map(serializeDesignation);
      await updateSheet('HumailEli_Designations', 'A1', [DESIGNATION_HEADERS, ...rows]);
    } catch (e: any) {
      logger.error('GoogleSheetsAdapter write failed for designations; data NOT persisted:', e?.message);
      throw e;
    }
  }

  // ============================================================
  //  DOCUMENTS
  // ============================================================
  async getDocuments(): Promise<EmployeeDocument[]> {
    try {
      const rows = await readSheet('HumailEli_Employee_Documents', 'A2:W');
      return mapRowsSafe(rows, deserializeEmployeeDocument);
    } catch (e: any) { logger.warn('GoogleSheetsAdapter read failed, serving error:', e?.message); throw e; }
  }

  async saveDocument(document: EmployeeDocument): Promise<void> {
    const rowIndex = await findRowById('HumailEli_Employee_Documents', document.id);
    const serialized = serializeEmployeeDocument(document);
    if (rowIndex !== -1) {
      const endCol = getColumnLetter(DOCUMENTS_HEADERS.length);
      await updateSheet('HumailEli_Employee_Documents', `A${rowIndex}:${endCol}${rowIndex}`, [serialized]);
    } else {
      await appendToSheet('HumailEli_Employee_Documents', [serialized]);
    }
  }

  async saveEmployeeDocuments(docs: EmployeeDocument[]): Promise<void> {
    try {
      const rows = docs.map(serializeEmployeeDocument);
      await updateSheet('HumailEli_Employee_Documents', 'A1', [DOCUMENTS_HEADERS, ...rows]);
    } catch (e: any) { logger.error('GoogleSheetsAdapter write failed; data NOT persisted:', e?.message); throw e; }
  }

  async getEmployeeDocuments(): Promise<EmployeeDocument[]> {
    return this.getDocuments();
  }

  async getJobDescriptions(): Promise<JobDescription[]> {
    return this.localFallback.getJobDescriptions();
  }

  async saveJobDescriptions(jobs: JobDescription[]): Promise<void> {
    return this.localFallback.saveJobDescriptions(jobs);
  }

  async getOnboardingTasks(): Promise<LegacyOnboardingTask[]> {
    return this.localFallback.getOnboardingTasks();
  }

  async getOnboardingTemplates(): Promise<OnboardingTemplate[]> {
    return this.localFallback.getOnboardingTemplates();
  }

  // BIOMETRIC DEVICES
  getBiometricDevices(): BiometricDeviceConfig[] { return this.localFallback.getBiometricDevices(); }
  saveBiometricDevices(devices: BiometricDeviceConfig[]): void { this.localFallback.saveBiometricDevices(devices); }

  // RECRUITMENT HELPERS
  async getStageTemplates(): Promise<StageTemplate[]> { return this.localFallback.getStageTemplates(); }
  async saveStageTemplates(templates: StageTemplate[]): Promise<void> { await this.localFallback.saveStageTemplates(templates); }
  async getInterviewPanels(): Promise<InterviewPanel[]> { return this.localFallback.getInterviewPanels(); }
  async saveInterviewPanels(panels: InterviewPanel[]): Promise<void> { await this.localFallback.saveInterviewPanels(panels); }
  async getScorecards(): Promise<EvaluationScorecard[]> { return this.localFallback.getScorecards(); }
  async saveScorecards(scorecards: EvaluationScorecard[]): Promise<void> { await this.localFallback.saveScorecards(scorecards); }
  async getJDMatches(): Promise<JDResumeMatch[]> { return this.localFallback.getJDMatches(); }
  async saveJDMatches(matches: JDResumeMatch[]): Promise<void> { await this.localFallback.saveJDMatches(matches); }

  // STORAGE HELPERS / LOGGING
  async addSheetLog(sheetName: string, action: 'INSERT' | 'UPDATE' | 'DELETE' | 'SYNC', rowData: object): Promise<void> {
    try {
      await this.localFallback.addSheetLog(sheetName, action, rowData);
    } catch (e: any) {
      logger.error('addSheetLog failed:', e?.message);
    }
  }
  generateEmployeeDiff(
    oldEmp: Employee | null,
    newEmp: Employee,
    changedBy?: string,
    changedByName?: string,
    changeType?: 'CREATE' | 'UPDATE' | 'DELETE' | 'BULK_UPDATE',
    source?: 'MANUAL' | 'TRANSITION' | 'BULK_IMPORT' | 'SYSTEM_AUTO' | 'API',
    reason?: string,
    notes?: string
  ): any { return this.localFallback.generateEmployeeDiff(oldEmp, newEmp, changedBy, changedByName, changeType, source, reason, notes); }
  async uploadFile(file: File, folderId: string): Promise<string> { return await this.localFallback.uploadFile(file, folderId); }

  // HISTORY & EXIT
  async addEmployeeHistory(entry: EmployeeHistoryEntry): Promise<void> { await this.localFallback.addEmployeeHistory(entry); }
  async getEmployeeHistory(employeeId: string): Promise<EmployeeHistoryEntry[]> { return await this.localFallback.getEmployeeHistory(employeeId); }
  async createExitRecord(record: ExitRecord): Promise<void> { await this.localFallback.createExitRecord(record); }
  async getExitRecords(): Promise<ExitRecord[]> { return await this.localFallback.getExitRecords(); }

  // EXIT TEMPLATES
  async getExitChecklistTemplates(): Promise<ExitChecklistTemplate[]> { return await this.localFallback.getExitChecklistTemplates(); }
  async getExitInterviewTemplates(): Promise<ExitInterviewTemplate[]> { return await this.localFallback.getExitInterviewTemplates(); }

  // ============================================================
  //  PERFORMANCE
  // ============================================================
  async getPerformanceReviews(): Promise<PerformanceReview[]> {
    return this.localFallback.getPerformanceReviews();
  }
  async savePerformanceReview(review: PerformanceReview): Promise<void> {
    return this.localFallback.savePerformanceReview(review);
  }
  async savePerformanceReviews(reviews: PerformanceReview[]): Promise<void> {
    return this.localFallback.savePerformanceReviews(reviews);
  }
  async getPerformanceGoals(): Promise<PerformanceGoal[]> {
    return this.localFallback.getPerformanceGoals();
  }
  async savePerformanceGoal(goal: PerformanceGoal): Promise<void> {
    return this.localFallback.savePerformanceGoal(goal);
  }

  // ============================================================
  //  TRAINING
  // ============================================================
  async getTrainingModules(): Promise<TrainingModule[]> {
    return this.localFallback.getTrainingModules();
  }
  async saveTrainingModule(module: TrainingModule): Promise<void> {
    return this.localFallback.saveTrainingModule(module);
  }
  async getTrainingAssignments(): Promise<TrainingAssignment[]> {
    return this.localFallback.getTrainingAssignments();
  }
  async saveTrainingAssignment(assignment: TrainingAssignment): Promise<void> {
    return this.localFallback.saveTrainingAssignment(assignment);
  }

  // ============================================================
  //  SETTINGS
  // ============================================================
  async getSettings(): Promise<AppSettings> {
    return this.localFallback.getSettings();
  }
  async saveSettings(settings: AppSettings): Promise<void> {
    return this.localFallback.saveSettings(settings);
  }

  // ============================================================
  //  SYNC
  // ============================================================
  async syncAll(): Promise<void> {
    return this.localFallback.syncAll();
  }
  async syncModule(module: string): Promise<void> {
    return this.localFallback.syncModule(module);
  }
}
