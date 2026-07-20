import { logger } from '../lib/logger';
import { IDataAdapter } from './interfaces/IDataAdapter';
import {
  getEmployees,
  saveEmployees,
  getEmployeeDocuments,
  saveEmployeeDocuments,
  getAttendance,
  saveAttendance,
  getLeaves,
  saveLeaves,
  getPayroll,
  savePayroll,
  getCandidates,
  saveCandidates,
  getPerformanceReviews,
  savePerformanceReviews,
  getPerformanceGoals,
  savePerformanceGoals,
  getTrainingModules,
  saveTrainingModules,
  getTrainingAssignments,
  saveTrainingAssignments,
  getDepartments,
  saveDepartments,
  getDesignations,
  saveDesignations,
  getSettings,
  saveSettings,
  getBiometricDevices,
  saveBiometricDevices,
  addSheetLog,
  generateEmployeeDiff,
  addEmployeeHistory,
  getEmployeeHistory,
  createExitRecord,
  getExitRecords,
  getExitChecklistTemplates,
  getExitInterviewTemplates,
  getOnboardingTasks,
  getOnboardingTemplates,
  getJobDescriptions,
  saveJobDescriptions,
  getStageTemplates,
  saveStageTemplates,
  getInterviewPanels,
  saveInterviewPanels,
  getScorecards,
  saveScorecards,
  getJDMatches,
  saveJDMatches,
} from '../lib/storage';
import { DEFAULT_SETTINGS } from '../lib/mockData';
import {
  Employee,
  AttendanceRecord,
  LeaveRecord,
  PayrollRecord,
  Candidate,
  PerformanceReview,
  PerformanceGoal,
  TrainingModule,
  TrainingAssignment,
  EmployeeDocument,
  Department,
  Designation,
  AppSettings,
  BiometricDeviceConfig,
  EmployeeHistoryEntry,
  ExitRecord,
  ExitChecklistTemplate,
  ExitInterviewTemplate,
  StageTemplate,
  InterviewPanel,
  EvaluationScorecard,
  JDResumeMatch,
  LegacyOnboardingTask,
  OnboardingTemplate,
  JobDescription,
} from '../types';

export class LocalStorageAdapter implements IDataAdapter {
  // EMPLOYEE
  async getEmployees(): Promise<Employee[]> {
    return getEmployees();
  }

  async getEmployee(id: string): Promise<Employee | null> {
    const employees = getEmployees();
    return employees.find((e) => e.id === id) || null;
  }

  async saveEmployee(employee: Employee): Promise<Employee> {
    const employees = getEmployees();
    const index = employees.findIndex((e) => e.id === employee.id);
    if (index >= 0) employees[index] = employee;
    else employees.push(employee);
    saveEmployees(employees);
    return employee;
  }

  async saveEmployees(employees: Employee[]): Promise<void> {
    saveEmployees(employees);
  }

  async deleteEmployee(id: string): Promise<void> {
    const employees = getEmployees();
    saveEmployees(employees.filter((e) => e.id !== id));
  }

  // ATTENDANCE
  async getAttendance(): Promise<AttendanceRecord[]> {
    return getAttendance();
  }

  async getAttendanceByEmployee(employeeId: string): Promise<AttendanceRecord[]> {
    return getAttendance().filter((a) => a.employeeId === employeeId);
  }

  async saveAttendance(records: AttendanceRecord[]): Promise<void> {
    saveAttendance(records);
  }

  async saveAttendanceRecord(record: AttendanceRecord): Promise<void> {
    const records = getAttendance();
    const index = records.findIndex((r) => r.id === record.id);
    if (index >= 0) records[index] = record;
    else records.push(record);
    saveAttendance(records);
  }

  // LEAVE
  async getLeaves(): Promise<LeaveRecord[]> {
    return getLeaves();
  }

  async getLeavesByEmployee(employeeId: string): Promise<LeaveRecord[]> {
    return getLeaves().filter((l) => l.employeeId === employeeId);
  }

  async saveLeave(leave: LeaveRecord): Promise<void> {
    const leaves = getLeaves();
    const index = leaves.findIndex((l) => l.id === leave.id);
    if (index >= 0) leaves[index] = leave;
    else leaves.push(leave);
    saveLeaves(leaves);
  }

  async saveLeaves(leaves: LeaveRecord[]): Promise<void> {
    saveLeaves(leaves);
  }

  // PAYROLL
  async getPayroll(): Promise<PayrollRecord[]> {
    return getPayroll();
  }

  async getPayrollByEmployee(employeeId: string): Promise<PayrollRecord[]> {
    return getPayroll().filter((p) => p.employeeId === employeeId);
  }

  async savePayroll(records: PayrollRecord[]): Promise<void> {
    savePayroll(records);
  }

  // RECRUITMENT
  async getCandidates(): Promise<Candidate[]> {
    return getCandidates();
  }

  async saveCandidate(candidate: Candidate): Promise<void> {
    const candidates = getCandidates();
    const index = candidates.findIndex((c) => c.id === candidate.id);
    if (index >= 0) candidates[index] = candidate;
    else candidates.push(candidate);
    saveCandidates(candidates);
  }

  async saveCandidates(candidates: Candidate[]): Promise<void> {
    saveCandidates(candidates);
  }

  // PERFORMANCE
  async getPerformanceReviews(): Promise<PerformanceReview[]> {
    return getPerformanceReviews();
  }

  async savePerformanceReview(review: PerformanceReview): Promise<void> {
    const reviews = getPerformanceReviews();
    const index = reviews.findIndex((r) => r.id === review.id);
    if (index >= 0) reviews[index] = review;
    else reviews.push(review);
    savePerformanceReviews(reviews);
  }

  async savePerformanceReviews(reviews: PerformanceReview[]): Promise<void> {
    savePerformanceReviews(reviews);
  }

  async getPerformanceGoals(): Promise<PerformanceGoal[]> {
    return getPerformanceGoals();
  }

  async savePerformanceGoal(goal: PerformanceGoal): Promise<void> {
    const goals = getPerformanceGoals();
    const index = goals.findIndex((g) => g.id === goal.id);
    if (index >= 0) goals[index] = goal;
    else goals.push(goal);
    savePerformanceGoals(goals);
  }

  // TRAINING
  async getTrainingModules(): Promise<TrainingModule[]> {
    return getTrainingModules();
  }

  async saveTrainingModule(module: TrainingModule): Promise<void> {
    const modules = getTrainingModules();
    const index = modules.findIndex((m) => m.id === module.id);
    if (index >= 0) modules[index] = module;
    else modules.push(module);
    saveTrainingModules(modules);
  }

  async getTrainingAssignments(): Promise<TrainingAssignment[]> {
    return getTrainingAssignments();
  }

  async saveTrainingAssignment(assignment: TrainingAssignment): Promise<void> {
    const assignments = getTrainingAssignments();
    const index = assignments.findIndex((a) => a.id === assignment.id);
    if (index >= 0) assignments[index] = assignment;
    else assignments.push(assignment);
    saveTrainingAssignments(assignments);
  }

  // DOCUMENTS
  async getDocuments(): Promise<EmployeeDocument[]> {
    return getEmployeeDocuments();
  }

  async saveDocument(document: EmployeeDocument): Promise<void> {
    const docs = getEmployeeDocuments();
    const index = docs.findIndex((d) => d.id === document.id);
    if (index >= 0) docs[index] = document;
    else docs.push(document);
    saveEmployeeDocuments(docs);
  }

  async getEmployeeDocuments(): Promise<EmployeeDocument[]> {
    return getEmployeeDocuments();
  }

  async saveEmployeeDocuments(docs: EmployeeDocument[]): Promise<void> {
    saveEmployeeDocuments(docs);
  }

  // JOB DESCRIPTIONS / ONBOARDING
  async getJobDescriptions(): Promise<JobDescription[]> {
    return getJobDescriptions();
  }

  async saveJobDescriptions(jobs: JobDescription[]): Promise<void> {
    saveJobDescriptions(jobs);
  }

  async getOnboardingTasks(): Promise<LegacyOnboardingTask[]> {
    return getOnboardingTasks();
  }

  async getOnboardingTemplates(): Promise<OnboardingTemplate[]> {
    return getOnboardingTemplates();
  }

  // DEPARTMENTS & DESIGNATIONS
  async getDepartments(): Promise<Department[]> {
    return getDepartments();
  }

  async saveDepartment(department: Department): Promise<void> {
    const departments = getDepartments();
    const index = departments.findIndex((d) => d.id === department.id);
    if (index >= 0) departments[index] = department;
    else departments.push(department);
    saveDepartments(departments);
  }

  async getDesignations(): Promise<Designation[]> {
    return getDesignations();
  }

  async saveDesignation(designation: Designation): Promise<void> {
    const designations = getDesignations();
    const index = designations.findIndex((d) => d.id === designation.id);
    if (index >= 0) designations[index] = designation;
    else designations.push(designation);
    saveDesignations(designations);
  }

  // SETTINGS
  async getSettings(): Promise<AppSettings> {
    const settings = getSettings();
    return settings ?? DEFAULT_SETTINGS;
  }

  async saveSettings(settings: AppSettings): Promise<void> {
    saveSettings(settings);
  }

  // BIOMETRIC DEVICES
  getBiometricDevices(): BiometricDeviceConfig[] {
    return getBiometricDevices();
  }

  saveBiometricDevices(devices: BiometricDeviceConfig[]): void {
    saveBiometricDevices(devices);
  }

  // RECRUITMENT HELPERS
  async getStageTemplates(): Promise<StageTemplate[]> {
    return getStageTemplates();
  }

  async saveStageTemplates(templates: StageTemplate[]): Promise<void> {
    saveStageTemplates(templates);
  }

  async getInterviewPanels(): Promise<InterviewPanel[]> {
    return getInterviewPanels();
  }

  async saveInterviewPanels(panels: InterviewPanel[]): Promise<void> {
    saveInterviewPanels(panels);
  }

  async getScorecards(): Promise<EvaluationScorecard[]> {
    return getScorecards();
  }

  async saveScorecards(scorecards: EvaluationScorecard[]): Promise<void> {
    saveScorecards(scorecards);
  }

  async getJDMatches(): Promise<JDResumeMatch[]> {
    return getJDMatches();
  }

  async saveJDMatches(matches: JDResumeMatch[]): Promise<void> {
    saveJDMatches(matches);
  }

  // STORAGE HELPERS / LOGGING
  async addSheetLog(
    sheetName: string,
    action: 'INSERT' | 'UPDATE' | 'DELETE' | 'SYNC',
    rowData: object,
  ): Promise<void> {
    addSheetLog(sheetName, action, rowData);
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
    return generateEmployeeDiff(oldEmp, newEmp, changedBy, changedByName, changeType, source, reason, notes);
  }

  async uploadFile(file: File, _folderId: string): Promise<string> {
    if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
      return URL.createObjectURL(file);
    }
    return file.name;
  }

  // HISTORY & EXIT
  async addEmployeeHistory(entry: EmployeeHistoryEntry): Promise<void> {
    addEmployeeHistory([entry]);
  }

  async getEmployeeHistory(employeeId: string): Promise<EmployeeHistoryEntry[]> {
    return getEmployeeHistory().filter((entry) => entry.employeeId === employeeId);
  }

  async createExitRecord(record: ExitRecord): Promise<void> {
    createExitRecord(record);
  }

  async getExitRecords(): Promise<ExitRecord[]> {
    return getExitRecords();
  }

  // EXIT TEMPLATES
  async getExitChecklistTemplates(): Promise<ExitChecklistTemplate[]> {
    return getExitChecklistTemplates();
  }

  async getExitInterviewTemplates(): Promise<ExitInterviewTemplate[]> {
    return getExitInterviewTemplates();
  }

  // SYNC
  async syncAll(): Promise<void> {
    logger.info('LocalStorage sync complete');
  }

  async syncModule(module: string): Promise<void> {
    logger.info(`Module ${module} synced (local)`);
  }
}
