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
  getExitProcessStages,
  saveExitProcessStages,
  getSettlementConfig,
  saveSettlementConfig,
  getOnboardingTasks,
  saveOnboardingTasks,
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
  getPerformanceReviewCycles,
  savePerformanceReviewCycles,
  getPerformanceReviewTemplates,
  savePerformanceReviewTemplates,
  getTrainingSubmissions,
  saveTrainingSubmissions,
  getPeerAssignments,
  savePeerAssignments,
  getTrainingRequests,
  saveTrainingRequests,
  getTrainingMentorships,
  saveTrainingMentorships,
  getTrainingCheckIns,
  saveTrainingCheckIns,
  getTrainingMessages,
  saveTrainingMessages,
  getSalaryComponents,
  saveSalaryComponents,
  getSalaryStructures,
  saveSalaryStructures,
  getPayGrades,
  savePayGrades,
  getSalaryRevisions,
  saveSalaryRevisions,
  getShifts,
  saveShifts,
  getShiftAssignments,
  saveShiftAssignments,
  getShiftSwapRequests,
  saveShiftSwapRequests,
  getShiftTemplates,
  saveShiftTemplates,
  getCurrencies,
  saveCurrencies,
  getTaxRules,
  saveTaxRules,
  getStatutoryDeductions,
  saveStatutoryDeductions,
  getPayrollCalculations,
  savePayrollCalculations,
  getLeavePolicies,
  saveLeavePolicies,
  getLeaveTypeConfigs,
  getRecruitmentAnalytics,
  saveRecruitmentAnalytics,
  getHires,
  saveHires,
  getInterviewSchedules,
  saveInterviewSchedules,
  getOrgChartNodes,
  saveOrgChartNodes,
  getPayslips,
  savePayslips,
  getNotifications,
  saveNotifications,
  getUsers,
  saveUsers,
  getStatusHistory,
  saveStatusHistory,
  getSheetLogs,
  getTrainingQuizzes,
  saveSalaryStructure,
  getSalaryStructureByEmployee,
  addSalaryRevision,
  getBiometricPunchRecords,
  saveBiometricPunchRecords,
  getBiometricSyncLogs,
  saveBiometricSyncLogs,
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
  JobDescription,
  LegacyOnboardingTask,
  OnboardingTemplate,
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

  async savePerformanceGoals(goals: PerformanceGoal[]): Promise<void> {
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

  async saveTrainingModules(modules: TrainingModule[]): Promise<void> {
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

  async saveTrainingAssignments(assignments: TrainingAssignment[]): Promise<void> {
    saveTrainingAssignments(assignments);
  }

  async getTrainingQuizzes(): Promise<TrainingQuiz[]> {
    return getTrainingQuizzes();
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

  async getEmployeeDocumentsByEmployee(employeeId: string): Promise<EmployeeDocument[]> {
    const docs = getEmployeeDocuments();
    return docs.filter(d => d.employeeId === employeeId);
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

  async getBiometricPunchRecords(): Promise<BiometricPunchRecord[]> {
    return getBiometricPunchRecords();
  }

  async saveBiometricPunchRecords(records: BiometricPunchRecord[]): Promise<void> {
    saveBiometricPunchRecords(records);
  }

  async getBiometricSyncLogs(): Promise<BiometricSyncLog[]> {
    return getBiometricSyncLogs();
  }

  async saveBiometricSyncLogs(logs: BiometricSyncLog[]): Promise<void> {
    saveBiometricSyncLogs(logs);
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

  async getExitProcessStages(): Promise<ExitProcessStage[]> {
    return getExitProcessStages();
  }

  async saveExitProcessStages(stages: ExitProcessStage[]): Promise<void> {
    saveExitProcessStages(stages);
  }

  async getSettlementConfig(): Promise<SettlementConfig | null> {
    return getSettlementConfig();
  }

  async saveSettlementConfig(config: SettlementConfig): Promise<void> {
    saveSettlementConfig(config);
  }

  async getPerformanceReviewCycles(): Promise<PerformanceReviewCycle[]> {
    return getPerformanceReviewCycles();
  }

  async savePerformanceReviewCycles(cycles: PerformanceReviewCycle[]): Promise<void> {
    savePerformanceReviewCycles(cycles);
  }

  async getPerformanceReviewTemplates(): Promise<PerformanceReviewTemplate[]> {
    return getPerformanceReviewTemplates();
  }

  async savePerformanceReviewTemplates(templates: PerformanceReviewTemplate[]): Promise<void> {
    savePerformanceReviewTemplates(templates);
  }

  async getTrainingSubmissions(): Promise<TrainingSubmission[]> {
    return getTrainingSubmissions();
  }

  async saveTrainingSubmissions(submissions: TrainingSubmission[]): Promise<void> {
    saveTrainingSubmissions(submissions);
  }

  async getPeerAssignments(): Promise<PeerAssignment[]> {
    return getPeerAssignments();
  }

  async savePeerAssignments(assignments: PeerAssignment[]): Promise<void> {
    savePeerAssignments(assignments);
  }

  async getTrainingRequests(): Promise<TrainingRequest[]> {
    return getTrainingRequests();
  }

  async saveTrainingRequests(requests: TrainingRequest[]): Promise<void> {
    saveTrainingRequests(requests);
  }

  async getTrainingMentorships(): Promise<TrainingMentorship[]> {
    return getTrainingMentorships();
  }

  async saveTrainingMentorships(mentorships: TrainingMentorship[]): Promise<void> {
    saveTrainingMentorships(mentorships);
  }

  async getTrainingCheckIns(): Promise<TrainingCheckIn[]> {
    return getTrainingCheckIns();
  }

  async saveTrainingCheckIns(checkIns: TrainingCheckIn[]): Promise<void> {
    saveTrainingCheckIns(checkIns);
  }

  async getTrainingMessages(): Promise<TrainingMessage[]> {
    return getTrainingMessages();
  }

  async saveTrainingMessages(messages: TrainingMessage[]): Promise<void> {
    saveTrainingMessages(messages);
  }

  async getSalaryComponents(): Promise<SalaryComponent[]> {
    return getSalaryComponents();
  }

  async saveSalaryComponents(components: SalaryComponent[]): Promise<void> {
    saveSalaryComponents(components);
  }

  async getSalaryStructures(): Promise<SalaryStructure[]> {
    return getSalaryStructures();
  }

  async saveSalaryStructures(structures: SalaryStructure[]): Promise<void> {
    saveSalaryStructures(structures);
  }

  async getPayGrades(): Promise<PayGrade[]> {
    return getPayGrades();
  }

  async savePayGrades(payGrades: PayGrade[]): Promise<void> {
    savePayGrades(payGrades);
  }

  async getSalaryRevisions(): Promise<SalaryRevision[]> {
    return getSalaryRevisions();
  }

  async saveSalaryRevisions(revisions: SalaryRevision[]): Promise<void> {
    saveSalaryRevisions(revisions);
  }

  async getSalaryRevisionsByEmployee(employeeId: string): Promise<SalaryRevision[]> {
    const revisions = getSalaryRevisions();
    return revisions.filter(r => r.employeeId === employeeId);
  }

  async saveSalaryStructure(structure: SalaryStructure): Promise<void> {
    const structures = getSalaryStructures();
    const index = structures.findIndex((s) => s.employeeId === structure.employeeId);
    if (index >= 0) structures[index] = structure;
    else structures.push(structure);
    saveSalaryStructures(structures);
  }

  async getSalaryStructureByEmployee(employeeId: string): Promise<SalaryStructure | null> {
    return getSalaryStructureByEmployee(employeeId);
  }

  async addSalaryRevision(revision: SalaryRevision): Promise<void> {
    const revisions = getSalaryRevisions();
    revisions.push(revision);
    saveSalaryRevisions(revisions);
  }

  async getShifts(): Promise<Shift[]> {
    return getShifts();
  }

  async saveShifts(shifts: Shift[]): Promise<void> {
    saveShifts(shifts);
  }

  async getShiftAssignments(): Promise<ShiftAssignment[]> {
    return getShiftAssignments();
  }

  async saveShiftAssignments(assignments: ShiftAssignment[]): Promise<void> {
    saveShiftAssignments(assignments);
  }

  async getShiftSwapRequests(): Promise<ShiftSwapRequest[]> {
    return getShiftSwapRequests();
  }

  async saveShiftSwapRequests(requests: ShiftSwapRequest[]): Promise<void> {
    saveShiftSwapRequests(requests);
  }

  async getShiftTemplates(): Promise<ShiftTemplate[]> {
    return getShiftTemplates();
  }

  async saveShiftTemplates(templates: ShiftTemplate[]): Promise<void> {
    saveShiftTemplates(templates);
  }

  async getCurrencies(): Promise<Currency[]> {
    return getCurrencies();
  }

  async saveCurrencies(currencies: Currency[]): Promise<void> {
    saveCurrencies(currencies);
  }

  async getTaxRules(): Promise<TaxRule[]> {
    return getTaxRules();
  }

  async saveTaxRules(rules: TaxRule[]): Promise<void> {
    saveTaxRules(rules);
  }

  async getStatutoryDeductions(): Promise<StatutoryDeduction[]> {
    return getStatutoryDeductions();
  }

  async saveStatutoryDeductions(deductions: StatutoryDeduction[]): Promise<void> {
    saveStatutoryDeductions(deductions);
  }

  async getPayrollCalculations(): Promise<PayrollCalculation[]> {
    return getPayrollCalculations();
  }

  async savePayrollCalculations(calculations: PayrollCalculation[]): Promise<void> {
    savePayrollCalculations(calculations);
  }

  async getLeavePolicies(): Promise<LeavePolicy[]> {
    return getLeavePolicies();
  }

  async saveLeavePolicies(policies: LeavePolicy[]): Promise<void> {
    saveLeavePolicies(policies);
  }

  async getLeaveTypeConfigs(): Promise<any[]> {
    return getLeaveTypeConfigs();
  }

  async saveLeaveTypeConfigs(configs: any[]): Promise<void> {
    saveLeaveTypeConfigs(configs);
  }

  async getRecruitmentAnalytics(): Promise<RecruitmentAnalytics[]> {
    return getRecruitmentAnalytics();
  }

  async saveRecruitmentAnalytics(analytics: RecruitmentAnalytics[]): Promise<void> {
    saveRecruitmentAnalytics(analytics);
  }

  async getHires(): Promise<HireDetails[]> {
    return getHires();
  }

  async saveHires(hires: HireDetails[]): Promise<void> {
    saveHires(hires);
  }

  async getInterviewSchedules(): Promise<InterviewSchedule[]> {
    return getInterviewSchedules();
  }

  async saveInterviewSchedules(schedules: InterviewSchedule[]): Promise<void> {
    saveInterviewSchedules(schedules);
  }

  async getOrgChartNodes(): Promise<OrgChartNode[]> {
    return getOrgChartNodes();
  }

  async saveOrgChartNodes(nodes: OrgChartNode[]): Promise<void> {
    saveOrgChartNodes(nodes);
  }

  async getPayslips(): Promise<any[]> {
    return getPayslips();
  }

  async savePayslips(payslips: any[]): Promise<void> {
    savePayslips(payslips);
  }

  async getNotifications(): Promise<any[]> {
    return getNotifications();
  }

  async saveNotifications(notifications: any[]): Promise<void> {
    saveNotifications(notifications);
  }

  async getUsers(): Promise<any[]> {
    return getUsers();
  }

  async saveUsers(users: any[]): Promise<void> {
    saveUsers(users);
  }

  async getStatusHistory(): Promise<EmployeeStatusHistory[]> {
    return getStatusHistory();
  }

  async saveStatusHistory(history: EmployeeStatusHistory[]): Promise<void> {
    saveStatusHistory(history);
  }

  async getSheetLogs(): Promise<SheetLog[]> {
    return getSheetLogs();
  }

  // SYNC
  async syncAll(): Promise<void> {
    logger.info('LocalStorage sync complete');
  }

  async syncModule(module: string): Promise<void> {
    logger.info(`Module ${module} synced (local)`);
  }
}
