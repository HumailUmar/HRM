const fs = require('fs');
const content = `import { IDataAdapter } from './interfaces/IDataAdapter';
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
  readSheet,
  appendToSheet,
  updateSheet,
  ensureSheetExists,
} from './googleSheetsService';

// Fallback to localStorage if methods are missing
import { LocalStorageAdapter } from './LocalStorageAdapter';

export class GoogleSheetsAdapter implements IDataAdapter {
  private spreadsheetId: string;
  private settings: AppSettings;
  private localFallback = new LocalStorageAdapter();

  constructor(settings: AppSettings) {
    this.spreadsheetId = settings.googleSheets.spreadsheetId || '';
    this.settings = settings;
  }

  async connect(): Promise<void> {
    try {
      await ensureSheetExists('HumailEli_Employees', ['id']);
    } catch (e: any) {
      console.warn('Google Sheets connection failed, falling back to local storage', e);
    }
  }

  async disconnect(): Promise<void> {}

  // ---- EMPLOYEES ----
  async getEmployees(): Promise<Employee[]> {
    return this.localFallback.getEmployees();
  }
  async getEmployee(id: string): Promise<Employee | null> {
    return this.localFallback.getEmployee(id);
  }
  async saveEmployee(employee: Employee): Promise<Employee> {
    return this.localFallback.saveEmployee(employee);
  }
  async saveEmployees(employees: Employee[]): Promise<void> {
    return this.localFallback.saveEmployees(employees);
  }
  async deleteEmployee(id: string): Promise<void> {
    return this.localFallback.deleteEmployee(id);
  }

  // ---- ATTENDANCE ----
  async getAttendance(): Promise<AttendanceRecord[]> {
    return this.localFallback.getAttendance();
  }
  async getAttendanceByEmployee(employeeId: string): Promise<AttendanceRecord[]> {
    return this.localFallback.getAttendanceByEmployee(employeeId);
  }
  async saveAttendance(records: AttendanceRecord[]): Promise<void> {
    return this.localFallback.saveAttendance(records);
  }
  async saveAttendanceRecord(record: AttendanceRecord): Promise<void> {
    return this.localFallback.saveAttendanceRecord(record);
  }

  // ---- LEAVES ----
  async getLeaves(): Promise<LeaveRecord[]> {
    return this.localFallback.getLeaves();
  }
  async getLeavesByEmployee(employeeId: string): Promise<LeaveRecord[]> {
    return this.localFallback.getLeavesByEmployee(employeeId);
  }
  async saveLeave(leave: LeaveRecord): Promise<void> {
    return this.localFallback.saveLeave(leave);
  }
  async saveLeaves(leaves: LeaveRecord[]): Promise<void> {
    return this.localFallback.saveLeaves(leaves);
  }

  // ---- PAYROLL ----
  async getPayroll(): Promise<PayrollRecord[]> {
    return this.localFallback.getPayroll();
  }
  async getPayrollByEmployee(employeeId: string): Promise<PayrollRecord[]> {
    return this.localFallback.getPayrollByEmployee(employeeId);
  }
  async savePayroll(records: PayrollRecord[]): Promise<void> {
    return this.localFallback.savePayroll(records);
  }

  // ---- RECRUITMENT ----
  async getCandidates(): Promise<Candidate[]> {
    return this.localFallback.getCandidates();
  }
  async saveCandidate(candidate: Candidate): Promise<void> {
    return this.localFallback.saveCandidate(candidate);
  }
  async saveCandidates(candidates: Candidate[]): Promise<void> {
    return this.localFallback.saveCandidates(candidates);
  }

  // ---- PERFORMANCE ----
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

  // ---- TRAINING ----
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

  // ---- DOCUMENTS ----
  async getDocuments(): Promise<EmployeeDocument[]> {
    return this.localFallback.getDocuments();
  }
  async saveDocument(document: EmployeeDocument): Promise<void> {
    return this.localFallback.saveDocument(document);
  }

  // ---- DEPARTMENTS & DESIGNATIONS ----
  async getDepartments(): Promise<Department[]> {
    return this.localFallback.getDepartments();
  }
  async saveDepartment(department: Department): Promise<void> {
    return this.localFallback.saveDepartment(department);
  }
  async getDesignations(): Promise<Designation[]> {
    return this.localFallback.getDesignations();
  }
  async saveDesignation(designation: Designation): Promise<void> {
    return this.localFallback.saveDesignation(designation);
  }

  // ---- SETTINGS ----
  async getSettings(): Promise<AppSettings> {
    return this.localFallback.getSettings();
  }
  async saveSettings(settings: AppSettings): Promise<void> {
    return this.localFallback.saveSettings(settings);
  }

  // ---- SYNC ----
  async syncAll(): Promise<void> {
    return this.localFallback.syncAll();
  }
  async syncModule(module: string): Promise<void> {
    return this.localFallback.syncModule(module);
  }
}
`;
fs.writeFileSync('src/services/GoogleSheetsAdapter.ts', content);
