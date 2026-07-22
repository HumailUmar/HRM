import { logger } from '../lib/logger';
import { IDataAdapter } from './interfaces/IDataAdapter';
import {
  getEmployees as getEmployeesLocal,
  saveEmployees as saveEmployeesLocal,
  getEmployeeDocuments as getEmployeeDocumentsLocal,
  saveEmployeeDocuments as saveEmployeeDocumentsLocal,
  getAttendance as getAttendanceLocal,
  saveAttendance as saveAttendanceLocal,
  getLeaves as getLeavesLocal,
  saveLeaves as saveLeavesLocal,
  getPayroll as getPayrollLocal,
  savePayroll as savePayrollLocal,
  getCandidates as getCandidatesLocal,
  saveCandidates as saveCandidatesLocal,
  getPerformanceReviews as getPerformanceReviewsLocal,
  savePerformanceReviews as savePerformanceReviewsLocal,
  getPerformanceGoals as getPerformanceGoalsLocal,
  savePerformanceGoals as savePerformanceGoalsLocal,
  getTrainingModules as getTrainingModulesLocal,
  saveTrainingModules as saveTrainingModulesLocal,
  getTrainingAssignments as getTrainingAssignmentsLocal,
  saveTrainingAssignments as saveTrainingAssignmentsLocal,
  getDepartments as getDepartmentsLocal,
  saveDepartments as saveDepartmentsLocal,
  getDesignations as getDesignationsLocal,
  saveDesignations as saveDesignationsLocal,
  getSettings as getSettingsLocal,
  saveSettings as saveSettingsLocal,
  getBiometricDevices as getBiometricDevicesLocal,
  saveBiometricDevices as saveBiometricDevicesLocal,
  addSheetLog as addSheetLogLocal,
  generateEmployeeDiff as generateEmployeeDiffLocal,
  addEmployeeHistory as addEmployeeHistoryLocal,
  getEmployeeHistory as getEmployeeHistoryLocal,
  createExitRecord as createExitRecordLocal,
  getExitRecords as getExitRecordsLocal,
  saveExitRecords as saveExitRecordsLocal,
  getExitChecklistTemplates as getExitChecklistTemplatesLocal,
  getExitInterviewTemplates as getExitInterviewTemplatesLocal,
  getExitProcessStages as getExitProcessStagesLocal,
  saveExitProcessStages as saveExitProcessStagesLocal,
  getSettlementConfig as getSettlementConfigLocal,
  saveSettlementConfig as saveSettlementConfigLocal,
  getOnboardingTasks as getOnboardingTasksLocal,
  getOnboardingTemplates as getOnboardingTemplatesLocal,
  getJobDescriptions as getJobDescriptionsLocal,
  saveJobDescriptions as saveJobDescriptionsLocal,
  getStageTemplates as getStageTemplatesLocal,
  saveStageTemplates as saveStageTemplatesLocal,
  getInterviewPanels as getInterviewPanelsLocal,
  saveInterviewPanels as saveInterviewPanelsLocal,
  getScorecards as getScorecardsLocal,
  saveScorecards as saveScorecardsLocal,
  getJDMatches as getJDMatchesLocal,
  saveJDMatches as saveJDMatchesLocal,
  getPerformanceReviewCycles as getPerformanceReviewCyclesLocal,
  savePerformanceReviewCycles as savePerformanceReviewCyclesLocal,
  getPerformanceReviewTemplates as getPerformanceReviewTemplatesLocal,
  savePerformanceReviewTemplates as savePerformanceReviewTemplatesLocal,
  getTrainingSubmissions as getTrainingSubmissionsLocal,
  saveTrainingSubmissions as saveTrainingSubmissionsLocal,
  getPeerAssignments as getPeerAssignmentsLocal,
  savePeerAssignments as savePeerAssignmentsLocal,
  getTrainingRequests as getTrainingRequestsLocal,
  saveTrainingRequests as saveTrainingRequestsLocal,
  getTrainingMentorships as getTrainingMentorshipsLocal,
  saveTrainingMentorships as saveTrainingMentorshipsLocal,
  getTrainingCheckIns as getTrainingCheckInsLocal,
  saveTrainingCheckIns as saveTrainingCheckInsLocal,
  getTrainingMessages as getTrainingMessagesLocal,
  saveTrainingMessages as saveTrainingMessagesLocal,
  getSalaryComponents as getSalaryComponentsLocal,
  saveSalaryComponents as saveSalaryComponentsLocal,
  getSalaryStructures as getSalaryStructuresLocal,
  saveSalaryStructures as saveSalaryStructuresLocal,
  getPayGrades as getPayGradesLocal,
  savePayGrades as savePayGradesLocal,
  getSalaryRevisions as getSalaryRevisionsLocal,
  saveSalaryRevisions as saveSalaryRevisionsLocal,
  getShifts as getShiftsLocal,
  saveShifts as saveShiftsLocal,
  getShiftAssignments as getShiftAssignmentsLocal,
  saveShiftAssignments as saveShiftAssignmentsLocal,
  getShiftSwapRequests as getShiftSwapRequestsLocal,
  saveShiftSwapRequests as saveShiftSwapRequestsLocal,
  getShiftTemplates as getShiftTemplatesLocal,
  saveShiftTemplates as saveShiftTemplatesLocal,
  getCurrencies as getCurrenciesLocal,
  saveCurrencies as saveCurrenciesLocal,
  getTaxRules as getTaxRulesLocal,
  saveTaxRules as saveTaxRulesLocal,
  getStatutoryDeductions as getStatutoryDeductionsLocal,
  saveStatutoryDeductions as saveStatutoryDeductionsLocal,
  getPayrollCalculations as getPayrollCalculationsLocal,
  savePayrollCalculations as savePayrollCalculationsLocal,
  getLeavePolicies as getLeavePoliciesLocal,
  saveLeavePolicies as saveLeavePoliciesLocal,
  getLeaveTypeConfigs as getLeaveTypeConfigsLocal,
  saveLeaveTypeConfigs as saveLeaveTypeConfigsLocal,
  getRecruitmentAnalytics as getRecruitmentAnalyticsLocal,
  saveRecruitmentAnalytics as saveRecruitmentAnalyticsLocal,
  getHires as getHiresLocal,
  saveHires as saveHiresLocal,
  getInterviewSchedules as getInterviewSchedulesLocal,
  saveInterviewSchedules as saveInterviewSchedulesLocal,
  getOrgChartNodes as getOrgChartNodesLocal,
  saveOrgChartNodes as saveOrgChartNodesLocal,
  getPayslips as getPayslipsLocal,
  savePayslips as savePayslipsLocal,
  getNotifications as getNotificationsLocal,
  saveNotifications as saveNotificationsLocal,
  getUsers as getUsersLocal,
  saveUsers as saveUsersLocal,
  getStatusHistory as getStatusHistoryLocal,
  saveStatusHistory as saveStatusHistoryLocal,
  getSheetLogs as getSheetLogsLocal,
  getTrainingQuizzes as getTrainingQuizzesLocal,
  saveSalaryStructure as saveSalaryStructureLocal,
  getSalaryStructureByEmployee as getSalaryStructureByEmployeeLocal,
  addSalaryRevision as addSalaryRevisionLocal,
  getBiometricPunchRecords as getBiometricPunchRecordsLocal,
  saveBiometricPunchRecords as saveBiometricPunchRecordsLocal,
  getBiometricSyncLogs as getBiometricSyncLogsLocal,
  saveBiometricSyncLogs as saveBiometricSyncLogsLocal,
  getSuccessionPlans as getSuccessionPlansLocal,
  saveSuccessionPlans as saveSuccessionPlansLocal,
  saveOnboardingTasks as saveOnboardingTasksLocal,
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
  SuccessionPlan,
} from '../types';

export class LocalStorageAdapter implements IDataAdapter {
  // EMPLOYEE
  async getEmployees(): Promise<Employee[]> {
    return getEmployeesLocal();
  }

  async getEmployee(id: string): Promise<Employee | null> {
    const employees = getEmployeesLocal();
    return employees.find((e) => e.id === id) || null;
  }

  async saveEmployee(employee: Employee): Promise<Employee> {
    const employees = getEmployeesLocal();
    const index = employees.findIndex((e) => e.id === employee.id);
    if (index >= 0) employees[index] = employee;
    else employees.push(employee);
    await saveEmployeesLocal(employees);
    return employee;
  }

  async saveEmployees(employees: Employee[]): Promise<void> {
    await saveEmployeesLocal(employees);
  }

  async deleteEmployee(id: string): Promise<void> {
    const employees = getEmployeesLocal();
    await saveEmployeesLocal(employees.filter((e) => e.id !== id));
  }

  // ATTENDANCE
  async getAttendance(): Promise<AttendanceRecord[]> {
    return getAttendanceLocal();
  }

  async getAttendanceByEmployee(employeeId: string): Promise<AttendanceRecord[]> {
    return getAttendanceLocal().filter((a) => a.employeeId === employeeId);
  }

  async saveAttendance(records: AttendanceRecord[]): Promise<void> {
    await saveAttendanceLocal(records);
  }

  async saveAttendanceRecord(record: AttendanceRecord): Promise<void> {
    const records = getAttendanceLocal();
    const index = records.findIndex((r) => r.id === record.id);
    if (index >= 0) records[index] = record;
    else records.push(record);
    await saveAttendanceLocal(records);
  }

  // LEAVE
  async getLeaves(): Promise<LeaveRecord[]> {
    return getLeavesLocal();
  }

  async getLeavesByEmployee(employeeId: string): Promise<LeaveRecord[]> {
    return getLeavesLocal().filter((l) => l.employeeId === employeeId);
  }

  async saveLeave(leave: LeaveRecord): Promise<void> {
    const leaves = getLeavesLocal();
    const index = leaves.findIndex((l) => l.id === leave.id);
    if (index >= 0) leaves[index] = leave;
    else leaves.push(leave);
    await saveLeavesLocal(leaves);
  }

  async saveLeaves(leaves: LeaveRecord[]): Promise<void> {
    await saveLeavesLocal(leaves);
  }

  // PAYROLL
  async getPayroll(): Promise<PayrollRecord[]> {
    return getPayrollLocal();
  }

  async getPayrollByEmployee(employeeId: string): Promise<PayrollRecord[]> {
    return getPayrollLocal().filter((p) => p.employeeId === employeeId);
  }

  async savePayroll(records: PayrollRecord[]): Promise<void> {
    await savePayrollLocal(records);
  }

  // RECRUITMENT
  async getCandidates(): Promise<Candidate[]> {
    return getCandidatesLocal();
  }

  async saveCandidate(candidate: Candidate): Promise<void> {
    const candidates = getCandidatesLocal();
    const index = candidates.findIndex((c) => c.id === candidate.id);
    if (index >= 0) candidates[index] = candidate;
    else candidates.push(candidate);
    await saveCandidatesLocal(candidates);
  }

  async saveCandidates(candidates: Candidate[]): Promise<void> {
    await saveCandidatesLocal(candidates);
  }

  // PERFORMANCE
  async getPerformanceReviews(): Promise<PerformanceReview[]> {
    return getPerformanceReviewsLocal();
  }

  async savePerformanceReview(review: PerformanceReview): Promise<void> {
    const reviews = getPerformanceReviewsLocal();
    const index = reviews.findIndex((r) => r.id === review.id);
    if (index >= 0) reviews[index] = review;
    else reviews.push(review);
    await savePerformanceReviewsLocal(reviews);
  }

  async savePerformanceReviews(reviews: PerformanceReview[]): Promise<void> {
    await savePerformanceReviewsLocal(reviews);
  }

  async getPerformanceGoals(): Promise<PerformanceGoal[]> {
    return getPerformanceGoalsLocal();
  }

  async savePerformanceGoal(goal: PerformanceGoal): Promise<void> {
    const goals = getPerformanceGoalsLocal();
    const index = goals.findIndex((g) => g.id === goal.id);
    if (index >= 0) goals[index] = goal;
    else goals.push(goal);
    await savePerformanceGoalsLocal(goals);
  }

  async savePerformanceGoals(goals: PerformanceGoal[]): Promise<void> {
    await savePerformanceGoalsLocal(goals);
  }

  // TRAINING
  async getTrainingModules(): Promise<TrainingModule[]> {
    return getTrainingModulesLocal();
  }

  async saveTrainingModule(module: TrainingModule): Promise<void> {
    const modules = getTrainingModulesLocal();
    const index = modules.findIndex((m) => m.id === module.id);
    if (index >= 0) modules[index] = module;
    else modules.push(module);
    await saveTrainingModulesLocal(modules);
  }

  async saveTrainingModules(modules: TrainingModule[]): Promise<void> {
    await saveTrainingModulesLocal(modules);
  }

  async getTrainingAssignments(): Promise<TrainingAssignment[]> {
    return getTrainingAssignmentsLocal();
  }

  async saveTrainingAssignment(assignment: TrainingAssignment): Promise<void> {
    const assignments = getTrainingAssignmentsLocal();
    const index = assignments.findIndex((a) => a.id === assignment.id);
    if (index >= 0) assignments[index] = assignment;
    else assignments.push(assignment);
    await saveTrainingAssignmentsLocal(assignments);
  }

  async saveTrainingAssignments(assignments: TrainingAssignment[]): Promise<void> {
    await saveTrainingAssignmentsLocal(assignments);
  }

  async getTrainingQuizzes(): Promise<TrainingQuiz[]> {
    return getTrainingQuizzesLocal();
  }

  // DOCUMENTS
  async getDocuments(): Promise<EmployeeDocument[]> {
    return getEmployeeDocumentsLocal();
  }

  async saveDocument(document: EmployeeDocument): Promise<void> {
    const docs = getEmployeeDocumentsLocal();
    const index = docs.findIndex((d) => d.id === document.id);
    if (index >= 0) docs[index] = document;
    else docs.push(document);
    await saveEmployeeDocumentsLocal(docs);
  }

  async getEmployeeDocuments(): Promise<EmployeeDocument[]> {
    return getEmployeeDocumentsLocal();
  }

  async getEmployeeDocumentsByEmployee(employeeId: string): Promise<EmployeeDocument[]> {
    const docs = getEmployeeDocumentsLocal();
    return docs.filter(d => d.employeeId === employeeId);
  }

  async saveEmployeeDocuments(docs: EmployeeDocument[]): Promise<void> {
    await saveEmployeeDocumentsLocal(docs);
  }

  // JOB DESCRIPTIONS / ONBOARDING
  async getJobDescriptions(): Promise<JobDescription[]> {
    return getJobDescriptionsLocal();
  }

  async saveJobDescriptions(jobs: JobDescription[]): Promise<void> {
    await saveJobDescriptionsLocal(jobs);
  }

  async getOnboardingTasks(): Promise<LegacyOnboardingTask[]> {
    return getOnboardingTasksLocal();
  }

  async getOnboardingTemplates(): Promise<OnboardingTemplate[]> {
    return getOnboardingTemplatesLocal();
  }

  async saveOnboardingTasks(tasks: LegacyOnboardingTask[]): Promise<void> {
    await saveOnboardingTasksLocal(tasks);
  }

  // DEPARTMENTS & DESIGNATIONS
  async getDepartments(): Promise<Department[]> {
    return getDepartmentsLocal();
  }

  async saveDepartment(department: Department): Promise<void> {
    const departments = getDepartmentsLocal();
    const index = departments.findIndex((d) => d.id === department.id);
    if (index >= 0) departments[index] = department;
    else departments.push(department);
    await saveDepartmentsLocal(departments);
  }

  async getDesignations(): Promise<Designation[]> {
    return getDesignationsLocal();
  }

  async saveDesignation(designation: Designation): Promise<void> {
    const designations = getDesignationsLocal();
    const index = designations.findIndex((d) => d.id === designation.id);
    if (index >= 0) designations[index] = designation;
    else designations.push(designation);
    await saveDesignationsLocal(designations);
  }

  // SETTINGS
  async getSettings(): Promise<AppSettings> {
    const settings = getSettingsLocal();
    return settings ?? DEFAULT_SETTINGS;
  }

  async saveSettings(settings: AppSettings): Promise<void> {
    await saveSettingsLocal(settings);
  }

  // BIOMETRIC DEVICES
  getBiometricDevices(): BiometricDeviceConfig[] {
    return getBiometricDevicesLocal();
  }

  saveBiometricDevices(devices: BiometricDeviceConfig[]): void {
    saveBiometricDevicesLocal(devices);
  }

  async getBiometricPunchRecords(): Promise<BiometricPunchRecord[]> {
    return getBiometricPunchRecordsLocal();
  }

  async saveBiometricPunchRecords(records: BiometricPunchRecord[]): Promise<void> {
    await saveBiometricPunchRecordsLocal(records);
  }

  async getBiometricSyncLogs(): Promise<BiometricSyncLog[]> {
    return getBiometricSyncLogsLocal();
  }

  async saveBiometricSyncLogs(logs: BiometricSyncLog[]): Promise<void> {
    await saveBiometricSyncLogsLocal(logs);
  }

  // RECRUITMENT HELPERS
  async getStageTemplates(): Promise<StageTemplate[]> {
    return getStageTemplatesLocal();
  }

  async saveStageTemplates(templates: StageTemplate[]): Promise<void> {
    await saveStageTemplatesLocal(templates);
  }

  async getInterviewPanels(): Promise<InterviewPanel[]> {
    return getInterviewPanelsLocal();
  }

  async saveInterviewPanels(panels: InterviewPanel[]): Promise<void> {
    await saveInterviewPanelsLocal(panels);
  }

  async getScorecards(): Promise<EvaluationScorecard[]> {
    return getScorecardsLocal();
  }

  async saveScorecards(scorecards: EvaluationScorecard[]): Promise<void> {
    await saveScorecardsLocal(scorecards);
  }

  async getJDMatches(): Promise<JDResumeMatch[]> {
    return getJDMatchesLocal();
  }

  async saveJDMatches(matches: JDResumeMatch[]): Promise<void> {
    await saveJDMatchesLocal(matches);
  }

  // STORAGE HELPERS / LOGGING
  async addSheetLog(
    sheetName: string,
    action: 'INSERT' | 'UPDATE' | 'DELETE' | 'SYNC',
    rowData: object,
  ): Promise<void> {
    await addSheetLogLocal(sheetName, action, rowData);
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
    return generateEmployeeDiffLocal(oldEmp, newEmp, changedBy, changedByName, changeType, source, reason, notes);
  }

  async uploadFile(file: File, _folderId: string): Promise<string> {
    if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
      return URL.createObjectURL(file);
    }
    return file.name;
  }

  // HISTORY & EXIT
  async addEmployeeHistory(entry: EmployeeHistoryEntry): Promise<void> {
    await addEmployeeHistoryLocal([entry]);
  }

  async getEmployeeHistory(employeeId: string): Promise<EmployeeHistoryEntry[]> {
    return getEmployeeHistoryLocal().filter((entry) => entry.employeeId === employeeId);
  }

  async createExitRecord(record: ExitRecord): Promise<void> {
    await createExitRecordLocal(record);
  }

  async getExitRecords(): Promise<ExitRecord[]> {
    return getExitRecordsLocal();
  }

  async saveExitRecords(records: ExitRecord[]): Promise<void> {
    await saveExitRecordsLocal(records);
  }

  // EXIT TEMPLATES
  async getExitChecklistTemplates(): Promise<ExitChecklistTemplate[]> {
    return getExitChecklistTemplatesLocal();
  }

  async getExitInterviewTemplates(): Promise<ExitInterviewTemplate[]> {
    return getExitInterviewTemplatesLocal();
  }

  async getExitProcessStages(): Promise<ExitProcessStage[]> {
    return getExitProcessStagesLocal();
  }

  async saveExitProcessStages(stages: ExitProcessStage[]): Promise<void> {
    await saveExitProcessStagesLocal(stages);
  }

  async getSettlementConfig(): Promise<SettlementConfig | null> {
    return getSettlementConfigLocal();
  }

  async saveSettlementConfig(config: SettlementConfig): Promise<void> {
    await saveSettlementConfigLocal(config);
  }

  async getPerformanceReviewCycles(): Promise<PerformanceReviewCycle[]> {
    return getPerformanceReviewCyclesLocal();
  }

  async savePerformanceReviewCycles(cycles: PerformanceReviewCycle[]): Promise<void> {
    await savePerformanceReviewCyclesLocal(cycles);
  }

  async getPerformanceReviewTemplates(): Promise<PerformanceReviewTemplate[]> {
    return getPerformanceReviewTemplatesLocal();
  }

  async savePerformanceReviewTemplates(templates: PerformanceReviewTemplate[]): Promise<void> {
    await savePerformanceReviewTemplatesLocal(templates);
  }

  async getTrainingSubmissions(): Promise<TrainingSubmission[]> {
    return getTrainingSubmissionsLocal();
  }

  async saveTrainingSubmissions(submissions: TrainingSubmission[]): Promise<void> {
    await saveTrainingSubmissionsLocal(submissions);
  }

  async getPeerAssignments(): Promise<PeerAssignment[]> {
    return getPeerAssignmentsLocal();
  }

  async savePeerAssignments(assignments: PeerAssignment[]): Promise<void> {
    await savePeerAssignmentsLocal(assignments);
  }

  async getTrainingRequests(): Promise<TrainingRequest[]> {
    return getTrainingRequestsLocal();
  }

  async saveTrainingRequests(requests: TrainingRequest[]): Promise<void> {
    await saveTrainingRequestsLocal(requests);
  }

  async getTrainingMentorships(): Promise<TrainingMentorship[]> {
    return getTrainingMentorshipsLocal();
  }

  async saveTrainingMentorships(mentorships: TrainingMentorship[]): Promise<void> {
    await saveTrainingMentorshipsLocal(mentorships);
  }

  async getTrainingCheckIns(): Promise<TrainingCheckIn[]> {
    return getTrainingCheckInsLocal();
  }

  async saveTrainingCheckIns(checkIns: TrainingCheckIn[]): Promise<void> {
    await saveTrainingCheckInsLocal(checkIns);
  }

  async getTrainingMessages(): Promise<TrainingMessage[]> {
    return getTrainingMessagesLocal();
  }

  async saveTrainingMessages(messages: TrainingMessage[]): Promise<void> {
    await saveTrainingMessagesLocal(messages);
  }

  async getSalaryComponents(): Promise<SalaryComponent[]> {
    return getSalaryComponentsLocal();
  }

  async saveSalaryComponents(components: SalaryComponent[]): Promise<void> {
    await saveSalaryComponentsLocal(components);
  }

  async getSalaryStructures(): Promise<SalaryStructure[]> {
    return getSalaryStructuresLocal();
  }

  async saveSalaryStructures(structures: SalaryStructure[]): Promise<void> {
    await saveSalaryStructuresLocal(structures);
  }

  async getPayGrades(): Promise<PayGrade[]> {
    return getPayGradesLocal();
  }

  async savePayGrades(payGrades: PayGrade[]): Promise<void> {
    await savePayGradesLocal(payGrades);
  }

  async getSalaryRevisions(): Promise<SalaryRevision[]> {
    return getSalaryRevisionsLocal();
  }

  async saveSalaryRevisions(revisions: SalaryRevision[]): Promise<void> {
    await saveSalaryRevisionsLocal(revisions);
  }

  async getSalaryRevisionsByEmployee(employeeId: string): Promise<SalaryRevision[]> {
    const revisions = getSalaryRevisionsLocal();
    return revisions.filter(r => r.employeeId === employeeId);
  }

  async saveSalaryStructure(structure: SalaryStructure): Promise<void> {
    const structures = getSalaryStructuresLocal();
    const index = structures.findIndex((s) => s.employeeId === structure.employeeId);
    if (index >= 0) structures[index] = structure;
    else structures.push(structure);
    await saveSalaryStructuresLocal(structures);
  }

  async getSalaryStructureByEmployee(employeeId: string): Promise<SalaryStructure | null> {
    return getSalaryStructureByEmployeeLocal(employeeId);
  }

  async addSalaryRevision(revision: SalaryRevision): Promise<void> {
    const revisions = getSalaryRevisionsLocal();
    revisions.push(revision);
    await saveSalaryRevisionsLocal(revisions);
  }

  async getShifts(): Promise<Shift[]> {
    return getShiftsLocal();
  }

  async saveShifts(shifts: Shift[]): Promise<void> {
    await saveShiftsLocal(shifts);
  }

  async getShiftAssignments(): Promise<ShiftAssignment[]> {
    return getShiftAssignmentsLocal();
  }

  async saveShiftAssignments(assignments: ShiftAssignment[]): Promise<void> {
    await saveShiftAssignmentsLocal(assignments);
  }

  async getShiftSwapRequests(): Promise<ShiftSwapRequest[]> {
    return getShiftSwapRequestsLocal();
  }

  async saveShiftSwapRequests(requests: ShiftSwapRequest[]): Promise<void> {
    await saveShiftSwapRequestsLocal(requests);
  }

  async getShiftTemplates(): Promise<ShiftTemplate[]> {
    return getShiftTemplatesLocal();
  }

  async saveShiftTemplates(templates: ShiftTemplate[]): Promise<void> {
    await saveShiftTemplatesLocal(templates);
  }

  async getCurrencies(): Promise<Currency[]> {
    return getCurrenciesLocal();
  }

  async saveCurrencies(currencies: Currency[]): Promise<void> {
    await saveCurrenciesLocal(currencies);
  }

  async getTaxRules(): Promise<TaxRule[]> {
    return getTaxRulesLocal();
  }

  async saveTaxRules(rules: TaxRule[]): Promise<void> {
    await saveTaxRulesLocal(rules);
  }

  async getStatutoryDeductions(): Promise<StatutoryDeduction[]> {
    return getStatutoryDeductionsLocal();
  }

  async saveStatutoryDeductions(deductions: StatutoryDeduction[]): Promise<void> {
    await saveStatutoryDeductionsLocal(deductions);
  }

  async getPayrollCalculations(): Promise<PayrollCalculation[]> {
    return getPayrollCalculationsLocal();
  }

  async savePayrollCalculations(calculations: PayrollCalculation[]): Promise<void> {
    await savePayrollCalculationsLocal(calculations);
  }

  async getLeavePolicies(): Promise<LeavePolicy[]> {
    return getLeavePoliciesLocal();
  }

  async saveLeavePolicies(policies: LeavePolicy[]): Promise<void> {
    await saveLeavePoliciesLocal(policies);
  }

  async getLeaveTypeConfigs(): Promise<any[]> {
    return getLeaveTypeConfigsLocal();
  }

  async saveLeaveTypeConfigs(configs: any[]): Promise<void> {
    await saveLeaveTypeConfigsLocal(configs);
  }

  async getRecruitmentAnalytics(): Promise<RecruitmentAnalytics[]> {
    return getRecruitmentAnalyticsLocal();
  }

  async saveRecruitmentAnalytics(analytics: RecruitmentAnalytics[]): Promise<void> {
    await saveRecruitmentAnalyticsLocal(analytics);
  }

  async getHires(): Promise<HireDetails[]> {
    return getHiresLocal();
  }

  async saveHires(hires: HireDetails[]): Promise<void> {
    await saveHiresLocal(hires);
  }

  async getInterviewSchedules(): Promise<InterviewSchedule[]> {
    return getInterviewSchedulesLocal();
  }

  async saveInterviewSchedules(schedules: InterviewSchedule[]): Promise<void> {
    await saveInterviewSchedulesLocal(schedules);
  }

  async getOrgChartNodes(): Promise<OrgChartNode[]> {
    return getOrgChartNodesLocal();
  }

  async saveOrgChartNodes(nodes: OrgChartNode[]): Promise<void> {
    await saveOrgChartNodesLocal(nodes);
  }

  async getPayslips(): Promise<any[]> {
    return getPayslipsLocal();
  }

  async savePayslips(payslips: any[]): Promise<void> {
    await savePayslipsLocal(payslips);
  }

  async getNotifications(): Promise<any[]> {
    return getNotificationsLocal();
  }

  async saveNotifications(notifications: any[]): Promise<void> {
    await saveNotificationsLocal(notifications);
  }

  async getUsers(): Promise<any[]> {
    return getUsersLocal();
  }

  async saveUsers(users: any[]): Promise<void> {
    await saveUsersLocal(users);
  }

  async getStatusHistory(): Promise<EmployeeStatusHistory[]> {
    return getStatusHistoryLocal();
  }

  async saveStatusHistory(history: EmployeeStatusHistory[]): Promise<void> {
    await saveStatusHistoryLocal(history);
  }

  async getSheetLogs(): Promise<SheetLog[]> {
    return getSheetLogsLocal();
  }

  // SUCCESSION
  async getSuccessionPlans(): Promise<SuccessionPlan[]> {
    return getSuccessionPlansLocal();
  }

  async saveSuccessionPlans(plans: SuccessionPlan[]): Promise<void> {
    await saveSuccessionPlansLocal(plans);
  }

  // SYNC
  async syncAll(): Promise<void> {
    logger.info('LocalStorage sync complete');
  }

  async syncModule(module: string): Promise<void> {
    logger.info(`Module ${module} synced (local)`);
  }
}
