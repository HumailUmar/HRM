import { IDataAdapter } from './interfaces/IDataAdapter';
import {
  Employee, AttendanceRecord, PayrollRecord, LeaveRecord, Candidate,
  Department, Designation, EmployeeDocument, SuccessionPlan, LegacyOnboardingTask,
  OnboardingTemplate, OrgChartNode, JobDescription, JDResumeMatch, WhatsAppMessage, WhatsAppTemplate,
  InterviewSchedule, LeavePolicy, Shift, ShiftAssignment, ShiftSwapRequest,
  ShiftTemplate, Currency, TaxRule, StatutoryDeduction, PayrollCalculation,
  PerformanceReviewCycle, PerformanceReview, PerformanceGoal, TrainingModule,
  TrainingSubmission, ExitRecord, SalaryStructure, PayGrade, SalaryRevision,
  AppSettings, TrainingAssignment, ExitProcessStage, SettlementConfig,
  PerformanceReviewTemplate, PeerAssignment, TrainingRequest, TrainingMentorship,
  TrainingCheckIn, TrainingMessage, SalaryComponent, RecruitmentAnalytics,
  HireDetails, SheetLog, EmployeeStatusHistory
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

export class GoogleSheetsAdapter extends LocalStorageAdapter {
  private spreadsheetId: string;
  private settings: AppSettings;
  private localFallback = new LocalStorageAdapter();

  constructor(settings: AppSettings) {
    super();
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
    // Use findRowById + read the row directly instead of fetching all employees.
    const rowIndex = await findRowById('HumailEli_Employees', id);
    if (rowIndex === -1) return null;
    const endCol = getColumnLetter(EMPLOYEE_HEADERS.length);
    try {
      const rows = await readSheet('HumailEli_Employees', `A${rowIndex}:${endCol}${rowIndex}`);
      if (!rows || rows.length === 0 || !Array.isArray(rows[0])) return null;
      const safeRows = mapRowsSafe(rows, deserializeEmployee);
      return safeRows.length > 0 ? safeRows[0] : null;
    } catch {
      // Fall back to full scan if row-level read fails
      const emps = await this.getEmployees();
      return emps.find(e => e.id === id) || null;
    }
  }

  async saveEmployee(employee: Employee): Promise<Employee> {
    // Row-level upsert to avoid read-modify-write race conditions.
    const rowIndex = await findRowById('HumailEli_Employees', employee.id);
    const serialized = serializeEmployee(employee);
    if (rowIndex !== -1) {
      const current = await this.getEmployee(employee.id);
      if (current?.updatedAt && employee.updatedAt && current.updatedAt > employee.updatedAt) {
        throw new Error(`Employee ${employee.id} has a newer Google Sheets version; reload before saving`);
      }
      const endCol = getColumnLetter(EMPLOYEE_HEADERS.length);
      await updateSheet('HumailEli_Employees', `A${rowIndex}:${endCol}${rowIndex}`, [serialized]);
    } else {
      await appendToSheet('HumailEli_Employees', [serialized]);
    }
    return employee;
  }

  async saveEmployees(employees: Employee[]): Promise<void> {
    try {
      await ensureSheetExists('HumailEli_Employees', EMPLOYEE_HEADERS);
      for (const employee of employees) {
        const rowIndex = await findRowById('HumailEli_Employees', employee.id);
        const serialized = serializeEmployee(employee);
        if (rowIndex !== -1) {
          const current = await this.getEmployee(employee.id);
          if (current?.updatedAt && employee.updatedAt && current.updatedAt > employee.updatedAt) {
            throw new Error(`Employee ${employee.id} has a newer Google Sheets version; reload before saving`);
          }
          const endCol = getColumnLetter(EMPLOYEE_HEADERS.length);
          await updateSheet('HumailEli_Employees', `A${rowIndex}:${endCol}${rowIndex}`, [serialized]);
        } else {
          await appendToSheet('HumailEli_Employees', [serialized]);
        }
      }
    } catch (e: any) { logger.error('GoogleSheetsAdapter write failed; data NOT persisted:', e?.message); throw e; }
  }

  async deleteEmployee(id: string): Promise<void> {
    // Row-level operation: find the row and mark it as deleted via status cell,
    // then truncate row contents so stale data doesn't persist.
    const rowIndex = await findRowById('HumailEli_Employees', id);
    if (rowIndex === -1) return;
    const endCol = getColumnLetter(EMPLOYEE_HEADERS.length);
    // Clear the row contents (keep headers in row 1 intact)
    const emptyRow = Array(EMPLOYEE_HEADERS.length).fill('');
    emptyRow[0] = id; // preserve ID for audit trail
    emptyRow[5] = 'Deleted'; // status column at index 5
    await updateSheet('HumailEli_Employees', `A${rowIndex}:${endCol}${rowIndex}`, [emptyRow]);
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
      await ensureSheetExists(sheetName, ATTENDANCE_HEADERS);
      const current = await this.getAttendance();
      for (const record of records) {
        const rowIndex = await findRowById(sheetName, record.id);
        const existing = current.find(item => item.id === record.id);
        if (existing?.updatedAt && record.updatedAt && existing.updatedAt > record.updatedAt) {
          throw new Error(`Attendance ${record.id} has a newer Google Sheets version; reload before saving`);
        }
        const serialized = serializeAttendance(record);
        if (rowIndex === -1) await appendToSheet(sheetName, [serialized]);
        else await updateSheet(sheetName, `A${rowIndex}:${getColumnLetter(ATTENDANCE_HEADERS.length)}${rowIndex}`, [serialized]);
      }
    } catch (e: any) { logger.error('GoogleSheetsAdapter write failed; data NOT persisted:', e?.message); throw e; }
  }

  async saveAttendanceRecord(record: AttendanceRecord): Promise<void> {
    const sheetName = this.settings.googleSheets.attendanceSheet || 'HumailEli_Attendance';
    const rowIndex = await findRowById(sheetName, record.id);
    const serialized = serializeAttendance(record);
    if (rowIndex !== -1) {
      const current = (await this.getAttendance()).find(item => item.id === record.id);
      if (current?.updatedAt && record.updatedAt && current.updatedAt > record.updatedAt) {
        throw new Error(`Attendance ${record.id} has a newer Google Sheets version; reload before saving`);
      }
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
      await ensureSheetExists(sheetName, PAYROLL_HEADERS);
      const current = await this.getPayroll();
      for (const record of records) {
        const rowIndex = await findRowById(sheetName, record.id);
        const existing = current.find(item => item.id === record.id);
        if (existing?.updatedAt && record.updatedAt && existing.updatedAt > record.updatedAt) {
          throw new Error(`Payroll ${record.id} has a newer Google Sheets version; reload before saving`);
        }
        const serialized = serializePayroll(record);
        if (rowIndex === -1) await appendToSheet(sheetName, [serialized]);
        else await updateSheet(sheetName, `A${rowIndex}:${getColumnLetter(PAYROLL_HEADERS.length)}${rowIndex}`, [serialized]);
      }
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
      const current = (await this.getLeaves()).find(item => item.id === leave.id);
      if (current?.updatedAt && leave.updatedAt && current.updatedAt > leave.updatedAt) {
        throw new Error(`Leave ${leave.id} has a newer Google Sheets version; reload before saving`);
      }
      const endCol = getColumnLetter(LEAVES_HEADERS.length);
      await updateSheet(sheetName, `A${rowIndex}:${endCol}${rowIndex}`, [serialized]);
    } else {
      await appendToSheet(sheetName, [serialized]);
    }
  }

  async saveLeaves(records: LeaveRecord[]): Promise<void> {
    try {
      const sheetName = this.settings.googleSheets.leaveSheet || 'HumailEli_Leaves';
      await ensureSheetExists(sheetName, LEAVES_HEADERS);
      const current = await this.getLeaves();
      for (const leave of records) {
        const rowIndex = await findRowById(sheetName, leave.id);
        const existing = current.find(item => item.id === leave.id);
        if (existing?.updatedAt && leave.updatedAt && existing.updatedAt > leave.updatedAt) {
          throw new Error(`Leave ${leave.id} has a newer Google Sheets version; reload before saving`);
        }
        const serialized = serializeLeave(leave);
        if (rowIndex === -1) await appendToSheet(sheetName, [serialized]);
        else await updateSheet(sheetName, `A${rowIndex}:${getColumnLetter(LEAVES_HEADERS.length)}${rowIndex}`, [serialized]);
      }
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
      const current = (await this.getCandidates()).find(item => item.id === candidate.id);
      if (current?.updatedAt && candidate.updatedAt && current.updatedAt > candidate.updatedAt) {
        throw new Error(`Candidate ${candidate.id} has a newer Google Sheets version; reload before saving`);
      }
      const endCol = getColumnLetter(RECRUITMENT_HEADERS.length);
      await updateSheet('HumailEli_Recruitment', `A${rowIndex}:${endCol}${rowIndex}`, [serialized]);
    } else {
      await appendToSheet('HumailEli_Recruitment', [serialized]);
    }
  }

  async saveCandidates(candidates: Candidate[]): Promise<void> {
    try {
      await ensureSheetExists('HumailEli_Recruitment', RECRUITMENT_HEADERS);
      const current = await this.getCandidates();
      for (const candidate of candidates) {
        const rowIndex = await findRowById('HumailEli_Recruitment', candidate.id);
        const existing = current.find(item => item.id === candidate.id);
        if (existing?.updatedAt && candidate.updatedAt && existing.updatedAt > candidate.updatedAt) {
          throw new Error(`Candidate ${candidate.id} has a newer Google Sheets version; reload before saving`);
        }
        const serialized = serializeCandidate(candidate);
        if (rowIndex === -1) await appendToSheet('HumailEli_Recruitment', [serialized]);
        else await updateSheet('HumailEli_Recruitment', `A${rowIndex}:${getColumnLetter(RECRUITMENT_HEADERS.length)}${rowIndex}`, [serialized]);
      }
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
      const current = (await this.getDepartments()).find(item => item.id === department.id);
      if (current?.updatedAt && department.updatedAt && current.updatedAt > department.updatedAt) {
        throw new Error(`Department ${department.id} has a newer Google Sheets version; reload before saving`);
      }
      const endCol = getColumnLetter(DEPARTMENT_HEADERS.length);
      await updateSheet('HumailEli_Departments', `A${rowIndex}:${endCol}${rowIndex}`, [serialized]);
    } else {
      await appendToSheet('HumailEli_Departments', [serialized]);
    }
  }

  async saveDepartments(depts: Department[]): Promise<void> {
    try {
      await ensureSheetExists('HumailEli_Departments', DEPARTMENT_HEADERS);
      const current = await this.getDepartments();
      for (const department of depts) {
        const rowIndex = await findRowById('HumailEli_Departments', department.id);
        const existing = current.find(item => item.id === department.id);
        if (existing?.updatedAt && department.updatedAt && existing.updatedAt > department.updatedAt) {
          throw new Error(`Department ${department.id} has a newer Google Sheets version; reload before saving`);
        }
        const serialized = serializeDepartment(department);
        if (rowIndex === -1) await appendToSheet('HumailEli_Departments', [serialized]);
        else await updateSheet('HumailEli_Departments', `A${rowIndex}:${getColumnLetter(DEPARTMENT_HEADERS.length)}${rowIndex}`, [serialized]);
      }
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
      const current = (await this.getDesignations()).find(item => item.id === designation.id);
      if (current?.updatedAt && designation.updatedAt && current.updatedAt > designation.updatedAt) {
        throw new Error(`Designation ${designation.id} has a newer Google Sheets version; reload before saving`);
      }
      const endCol = getColumnLetter(DESIGNATION_HEADERS.length);
      await updateSheet('HumailEli_Designations', `A${rowIndex}:${endCol}${rowIndex}`, [serialized]);
    } else {
      await appendToSheet('HumailEli_Designations', [serialized]);
    }
  }

  async saveDesignations(designations: Designation[]): Promise<void> {
    try {
      await ensureSheetExists('HumailEli_Designations', DESIGNATION_HEADERS);
      const current = await this.getDesignations();
      for (const designation of designations) {
        const rowIndex = await findRowById('HumailEli_Designations', designation.id);
        const existing = current.find(item => item.id === designation.id);
        if (existing?.updatedAt && designation.updatedAt && existing.updatedAt > designation.updatedAt) {
          throw new Error(`Designation ${designation.id} has a newer Google Sheets version; reload before saving`);
        }
        const serialized = serializeDesignation(designation);
        if (rowIndex === -1) await appendToSheet('HumailEli_Designations', [serialized]);
        else await updateSheet('HumailEli_Designations', `A${rowIndex}:${getColumnLetter(DESIGNATION_HEADERS.length)}${rowIndex}`, [serialized]);
      }
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
      const current = (await this.getDocuments()).find(item => item.id === document.id);
      if (current?.uploadedAt && document.uploadedAt && current.uploadedAt > document.uploadedAt) {
        throw new Error(`Document ${document.id} has a newer Google Sheets version; reload before saving`);
      }
      const endCol = getColumnLetter(DOCUMENTS_HEADERS.length);
      await updateSheet('HumailEli_Employee_Documents', `A${rowIndex}:${endCol}${rowIndex}`, [serialized]);
    } else {
      await appendToSheet('HumailEli_Employee_Documents', [serialized]);
    }
  }

  async saveEmployeeDocuments(docs: EmployeeDocument[]): Promise<void> {
    try {
      const sheetName = 'HumailEli_Employee_Documents';
      await ensureSheetExists(sheetName, DOCUMENTS_HEADERS);
      const current = await this.getDocuments();
      for (const document of docs) {
        const rowIndex = await findRowById(sheetName, document.id);
        const existing = current.find(item => item.id === document.id);
        if (existing?.uploadedAt && document.uploadedAt && existing.uploadedAt > document.uploadedAt) {
          throw new Error(`Document ${document.id} has a newer Google Sheets version; reload before saving`);
        }
        const serialized = serializeEmployeeDocument(document);
        if (rowIndex === -1) await appendToSheet(sheetName, [serialized]);
        else await updateSheet(sheetName, `A${rowIndex}:${getColumnLetter(DOCUMENTS_HEADERS.length)}${rowIndex}`, [serialized]);
      }
    } catch (e: any) { logger.error('GoogleSheetsAdapter write failed; data NOT persisted:', e?.message); throw e; }
  }

  async getEmployeeDocuments(): Promise<EmployeeDocument[]> {
    return this.getDocuments();
  }

  async getEmployeeDocumentsByEmployee(employeeId: string): Promise<EmployeeDocument[]> {
    const docs = await this.getDocuments();
    return docs.filter(d => d.employeeId === employeeId);
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

  async getExitProcessStages(): Promise<ExitProcessStage[]> {
    return this.localFallback.getExitProcessStages();
  }

  async saveExitProcessStages(stages: ExitProcessStage[]): Promise<void> {
    return this.localFallback.saveExitProcessStages(stages);
  }

  async getSettlementConfig(): Promise<SettlementConfig | null> {
    return this.localFallback.getSettlementConfig();
  }

  async saveSettlementConfig(config: SettlementConfig): Promise<void> {
    return this.localFallback.saveSettlementConfig(config);
  }

  async getPerformanceReviewCycles(): Promise<PerformanceReviewCycle[]> {
    return this.localFallback.getPerformanceReviewCycles();
  }

  async savePerformanceReviewCycles(cycles: PerformanceReviewCycle[]): Promise<void> {
    return this.localFallback.savePerformanceReviewCycles(cycles);
  }

  async getPerformanceReviewTemplates(): Promise<PerformanceReviewTemplate[]> {
    return this.localFallback.getPerformanceReviewTemplates();
  }

  async savePerformanceReviewTemplates(templates: PerformanceReviewTemplate[]): Promise<void> {
    return this.localFallback.savePerformanceReviewTemplates(templates);
  }

  async getTrainingSubmissions(): Promise<TrainingSubmission[]> {
    return this.localFallback.getTrainingSubmissions();
  }

  async saveTrainingSubmissions(submissions: TrainingSubmission[]): Promise<void> {
    return this.localFallback.saveTrainingSubmissions(submissions);
  }

  async getPeerAssignments(): Promise<PeerAssignment[]> {
    return this.localFallback.getPeerAssignments();
  }

  async savePeerAssignments(assignments: PeerAssignment[]): Promise<void> {
    return this.localFallback.savePeerAssignments(assignments);
  }

  async getTrainingRequests(): Promise<TrainingRequest[]> {
    return this.localFallback.getTrainingRequests();
  }

  async saveTrainingRequests(requests: TrainingRequest[]): Promise<void> {
    return this.localFallback.saveTrainingRequests(requests);
  }

  async getTrainingMentorships(): Promise<TrainingMentorship[]> {
    return this.localFallback.getTrainingMentorships();
  }

  async saveTrainingMentorships(mentorships: TrainingMentorship[]): Promise<void> {
    return this.localFallback.saveTrainingMentorships(mentorships);
  }

  async getTrainingCheckIns(): Promise<TrainingCheckIn[]> {
    return this.localFallback.getTrainingCheckIns();
  }

  async saveTrainingCheckIns(checkIns: TrainingCheckIn[]): Promise<void> {
    return this.localFallback.saveTrainingCheckIns(checkIns);
  }

  async getTrainingMessages(): Promise<TrainingMessage[]> {
    return this.localFallback.getTrainingMessages();
  }

  async saveTrainingMessages(messages: TrainingMessage[]): Promise<void> {
    return this.localFallback.saveTrainingMessages(messages);
  }

  async getSalaryComponents(): Promise<SalaryComponent[]> {
    return this.localFallback.getSalaryComponents();
  }

  async saveSalaryComponents(components: SalaryComponent[]): Promise<void> {
    return this.localFallback.saveSalaryComponents(components);
  }

  async getSalaryStructures(): Promise<SalaryStructure[]> {
    return this.localFallback.getSalaryStructures();
  }

  async saveSalaryStructures(structures: SalaryStructure[]): Promise<void> {
    return this.localFallback.saveSalaryStructures(structures);
  }

  async getPayGrades(): Promise<PayGrade[]> {
    return this.localFallback.getPayGrades();
  }

  async savePayGrades(payGrades: PayGrade[]): Promise<void> {
    return this.localFallback.savePayGrades(payGrades);
  }

  async getSalaryRevisions(): Promise<SalaryRevision[]> {
    return this.localFallback.getSalaryRevisions();
  }

  async saveSalaryRevisions(revisions: SalaryRevision[]): Promise<void> {
    return this.localFallback.saveSalaryRevisions(revisions);
  }

  async getSalaryRevisionsByEmployee(employeeId: string): Promise<SalaryRevision[]> {
    return this.localFallback.getSalaryRevisionsByEmployee(employeeId);
  }

  async getShifts(): Promise<Shift[]> {
    return this.localFallback.getShifts();
  }

  async saveShifts(shifts: Shift[]): Promise<void> {
    return this.localFallback.saveShifts(shifts);
  }

  async getShiftAssignments(): Promise<ShiftAssignment[]> {
    return this.localFallback.getShiftAssignments();
  }

  async saveShiftAssignments(assignments: ShiftAssignment[]): Promise<void> {
    return this.localFallback.saveShiftAssignments(assignments);
  }

  async getShiftSwapRequests(): Promise<ShiftSwapRequest[]> {
    return this.localFallback.getShiftSwapRequests();
  }

  async saveShiftSwapRequests(requests: ShiftSwapRequest[]): Promise<void> {
    return this.localFallback.saveShiftSwapRequests(requests);
  }

  async getShiftTemplates(): Promise<ShiftTemplate[]> {
    return this.localFallback.getShiftTemplates();
  }

  async saveShiftTemplates(templates: ShiftTemplate[]): Promise<void> {
    return this.localFallback.saveShiftTemplates(templates);
  }

  async getCurrencies(): Promise<Currency[]> {
    return this.localFallback.getCurrencies();
  }

  async saveCurrencies(currencies: Currency[]): Promise<void> {
    return this.localFallback.saveCurrencies(currencies);
  }

  async getTaxRules(): Promise<TaxRule[]> {
    return this.localFallback.getTaxRules();
  }

  async saveTaxRules(rules: TaxRule[]): Promise<void> {
    return this.localFallback.saveTaxRules(rules);
  }

  async getStatutoryDeductions(): Promise<StatutoryDeduction[]> {
    return this.localFallback.getStatutoryDeductions();
  }

  async saveStatutoryDeductions(deductions: StatutoryDeduction[]): Promise<void> {
    return this.localFallback.saveStatutoryDeductions(deductions);
  }

  async getPayrollCalculations(): Promise<PayrollCalculation[]> {
    return this.localFallback.getPayrollCalculations();
  }

  async savePayrollCalculations(calculations: PayrollCalculation[]): Promise<void> {
    return this.localFallback.savePayrollCalculations(calculations);
  }

  async getLeavePolicies(): Promise<LeavePolicy[]> {
    return this.localFallback.getLeavePolicies();
  }

  async saveLeavePolicies(policies: LeavePolicy[]): Promise<void> {
    return this.localFallback.saveLeavePolicies(policies);
  }

  async getLeaveTypeConfigs(): Promise<any[]> {
    return this.localFallback.getLeaveTypeConfigs();
  }

  async saveLeaveTypeConfigs(configs: any[]): Promise<void> {
    return this.localFallback.saveLeaveTypeConfigs(configs);
  }

  async getRecruitmentAnalytics(): Promise<RecruitmentAnalytics[]> {
    return this.localFallback.getRecruitmentAnalytics();
  }

  async saveRecruitmentAnalytics(analytics: RecruitmentAnalytics[]): Promise<void> {
    return this.localFallback.saveRecruitmentAnalytics(analytics);
  }

  async getHires(): Promise<HireDetails[]> {
    return this.localFallback.getHires();
  }

  async saveHires(hires: HireDetails[]): Promise<void> {
    return this.localFallback.saveHires(hires);
  }

  async getInterviewSchedules(): Promise<InterviewSchedule[]> {
    return this.localFallback.getInterviewSchedules();
  }

  async saveInterviewSchedules(schedules: InterviewSchedule[]): Promise<void> {
    return this.localFallback.saveInterviewSchedules(schedules);
  }

  async getOrgChartNodes(): Promise<OrgChartNode[]> {
    return this.localFallback.getOrgChartNodes();
  }

  async saveOrgChartNodes(nodes: OrgChartNode[]): Promise<void> {
    return this.localFallback.saveOrgChartNodes(nodes);
  }

  async getPayslips(): Promise<any[]> {
    return this.localFallback.getPayslips();
  }

  async savePayslips(payslips: any[]): Promise<void> {
    return this.localFallback.savePayslips(payslips);
  }

  async getNotifications(): Promise<any[]> {
    return this.localFallback.getNotifications();
  }

  async saveNotifications(notifications: any[]): Promise<void> {
    return this.localFallback.saveNotifications(notifications);
  }

  async getUsers(): Promise<any[]> {
    return this.localFallback.getUsers();
  }

  async saveUsers(users: any[]): Promise<void> {
    return this.localFallback.saveUsers(users);
  }

  async getStatusHistory(): Promise<EmployeeStatusHistory[]> {
    return this.localFallback.getStatusHistory();
  }

  async saveStatusHistory(history: EmployeeStatusHistory[]): Promise<void> {
    return this.localFallback.saveStatusHistory(history);
  }

  async getSheetLogs(): Promise<SheetLog[]> {
    return this.localFallback.getSheetLogs();
  }

  // ============================================================
  //  SYNC
  // ============================================================
  async syncAll(): Promise<void> {
    await this.connect();
    // Read every supported Google Sheets-backed collection so the following
    // DataService refresh observes one completed synchronization boundary.
    await Promise.all([
      this.getEmployees(),
      this.getAttendance(),
      this.getPayroll(),
      this.getLeaves(),
      this.getCandidates(),
      this.getDepartments(),
      this.getDesignations(),
      this.getEmployeeDocuments(),
    ]);
    logger.info('Google Sheets synchronization completed for core HR modules.');
  }

  async syncModule(module: string): Promise<void> {
    switch (module) {
      case 'employees': await this.getEmployees(); break;
      case 'attendance': await this.getAttendance(); break;
      case 'payroll': await this.getPayroll(); break;
      case 'leaves': await this.getLeaves(); break;
      case 'candidates': await this.getCandidates(); break;
      case 'departments': await this.getDepartments(); break;
      case 'designations': await this.getDesignations(); break;
      case 'documents': await this.getEmployeeDocuments(); break;
      default: throw new Error(`Unsupported Google Sheets module: ${module}`);
    }
  }
}
