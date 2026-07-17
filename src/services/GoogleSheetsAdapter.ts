import { IDataAdapter } from './interfaces/IDataAdapter';
import {
  Employee, AttendanceRecord, PayrollRecord, LeaveRecord, Candidate,
  Department, Designation, EmployeeDocument, SuccessionPlan, LegacyOnboardingTask,
  OrgChartNode, JobDescription, JDResumeMatch, WhatsAppMessage, WhatsAppTemplate,
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
      return rows.map(deserializeEmployee);
    } catch (e: any) { logger.warn('GoogleSheetsAdapter read failed, serving error:', e?.message); throw e; }
  }

  async getEmployee(id: string): Promise<Employee | null> {
    const emps = await this.getEmployees();
    return emps.find(e => e.id === id) || null;
  }

  async saveEmployee(employee: Employee): Promise<Employee> {
    const emps = await this.getEmployees();
    const idx = emps.findIndex(e => e.id === employee.id);
    if (idx >= 0) emps[idx] = employee;
    else emps.push(employee);
    await this.saveEmployees(emps);
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
      return rows.map(deserializeAttendance);
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
    const recs = await this.getAttendance();
    const idx = recs.findIndex(r => r.id === record.id);
    if (idx >= 0) recs[idx] = record;
    else recs.push(record);
    await this.saveAttendance(recs);
  }

  // ============================================================
  //  PAYROLL
  // ============================================================
  async getPayroll(): Promise<PayrollRecord[]> {
    try {
      const sheetName = this.settings.googleSheets.payrollSheet || 'HumailEli_Payroll';
      const rows = await readSheet(sheetName, 'A2:K');
      return rows.map(deserializePayroll);
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
      return rows.map(deserializeLeave);
    } catch (e: any) { logger.warn('GoogleSheetsAdapter read failed, serving error:', e?.message); throw e; }
  }

  async getLeavesByEmployee(employeeId: string): Promise<LeaveRecord[]> {
    const leaves = await this.getLeaves();
    return leaves.filter(l => l.employeeId === employeeId);
  }

  async saveLeave(leave: LeaveRecord): Promise<void> {
    const leaves = await this.getLeaves();
    const idx = leaves.findIndex(l => l.id === leave.id);
    if (idx >= 0) leaves[idx] = leave;
    else leaves.push(leave);
    await this.saveLeaves(leaves);
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
      return rows.map(deserializeCandidate);
    } catch (e: any) { logger.warn('GoogleSheetsAdapter read failed, serving error:', e?.message); throw e; }
  }

  async saveCandidate(candidate: Candidate): Promise<void> {
    const cands = await this.getCandidates();
    const idx = cands.findIndex(c => c.id === candidate.id);
    if (idx >= 0) cands[idx] = candidate;
    else cands.push(candidate);
    await this.saveCandidates(cands);
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
      return rows.map(deserializeDepartment);
    } catch (e: any) { logger.warn('GoogleSheetsAdapter read failed, serving error:', e?.message); throw e; }
  }

  async saveDepartment(department: Department): Promise<void> {
    const depts = await this.getDepartments();
    const idx = depts.findIndex(d => d.id === department.id);
    if (idx >= 0) depts[idx] = department;
    else depts.push(department);
    await this.saveDepartments(depts);
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
      return rows.map(deserializeDesignation);
    } catch (e: any) { logger.warn('GoogleSheetsAdapter read failed, serving error:', e?.message); throw e; }
  }

  async saveDesignation(designation: Designation): Promise<void> {
    const desigs = await this.getDesignations();
    const idx = desigs.findIndex(d => d.id === designation.id);
    if (idx >= 0) desigs[idx] = designation;
    else desigs.push(designation);
    await this.saveDesignations(desigs);
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
      return rows.map(deserializeEmployeeDocument);
    } catch (e: any) { logger.warn('GoogleSheetsAdapter read failed, serving error:', e?.message); throw e; }
  }

  async saveDocument(document: EmployeeDocument): Promise<void> {
    const docs = await this.getDocuments();
    const idx = docs.findIndex(d => d.id === document.id);
    if (idx >= 0) docs[idx] = document;
    else docs.push(document);
    await this.saveEmployeeDocuments(docs);
  }

  async saveEmployeeDocuments(docs: EmployeeDocument[]): Promise<void> {
    try {
      const rows = docs.map(serializeEmployeeDocument);
      await updateSheet('HumailEli_Employee_Documents', 'A1', [DOCUMENTS_HEADERS, ...rows]);
    } catch (e: any) { logger.error('GoogleSheetsAdapter write failed; data NOT persisted:', e?.message); throw e; }
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
