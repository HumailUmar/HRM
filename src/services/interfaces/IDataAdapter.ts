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
  TrainingQuiz,
  SalaryStructure,
  SalaryRevision,
  BiometricPunchRecord,
  BiometricSyncLog,
} from '../../types';

export interface IDataAdapter {
  // EMPLOYEE
  getEmployees(): Promise<Employee[]>;
  getEmployee(id: string): Promise<Employee | null>;
  saveEmployee(employee: Employee): Promise<Employee>;
  saveEmployees(employees: Employee[]): Promise<void>;
  deleteEmployee(id: string): Promise<void>;

  // ATTENDANCE
  getAttendance(): Promise<AttendanceRecord[]>;
  getAttendanceByEmployee(employeeId: string): Promise<AttendanceRecord[]>;
  saveAttendance(records: AttendanceRecord[]): Promise<void>;
  saveAttendanceRecord(record: AttendanceRecord): Promise<void>;

  // LEAVE
  getLeaves(): Promise<LeaveRecord[]>;
  getLeavesByEmployee(employeeId: string): Promise<LeaveRecord[]>;
  saveLeave(leave: LeaveRecord): Promise<void>;
  saveLeaves(leaves: LeaveRecord[]): Promise<void>;

  // PAYROLL
  getPayroll(): Promise<PayrollRecord[]>;
  getPayrollByEmployee(employeeId: string): Promise<PayrollRecord[]>;
  savePayroll(records: PayrollRecord[]): Promise<void>;

  // RECRUITMENT
  getCandidates(): Promise<Candidate[]>;
  saveCandidate(candidate: Candidate): Promise<void>;
  saveCandidates(candidates: Candidate[]): Promise<void>;

  // PERFORMANCE
  getPerformanceReviews(): Promise<PerformanceReview[]>;
  savePerformanceReview(review: PerformanceReview): Promise<void>;
  savePerformanceReviews(reviews: PerformanceReview[]): Promise<void>;
  getPerformanceGoals(): Promise<PerformanceGoal[]>;
  savePerformanceGoal(goal: PerformanceGoal): Promise<void>;
  savePerformanceGoals(goals: PerformanceGoal[]): Promise<void>;

  // TRAINING
  getTrainingModules(): Promise<TrainingModule[]>;
  saveTrainingModule(module: TrainingModule): Promise<void>;
  saveTrainingModules(modules: TrainingModule[]): Promise<void>;
  getTrainingAssignments(): Promise<TrainingAssignment[]>;
  saveTrainingAssignment(assignment: TrainingAssignment): Promise<void>;
  saveTrainingAssignments(assignments: TrainingAssignment[]): Promise<void>;
  getTrainingQuizzes(): Promise<TrainingQuiz[]>;

  // DOCUMENTS
  getDocuments(): Promise<EmployeeDocument[]>;
  saveDocument(document: EmployeeDocument): Promise<void>;
  getEmployeeDocuments(): Promise<EmployeeDocument[]>;
  getEmployeeDocumentsByEmployee(employeeId: string): Promise<EmployeeDocument[]>;
  saveEmployeeDocuments(docs: EmployeeDocument[]): Promise<void>;

  // JOB DESCRIPTIONS / ONBOARDING
  getJobDescriptions(): Promise<JobDescription[]>;
  saveJobDescriptions(jobs: JobDescription[]): Promise<void>;
  getOnboardingTasks(): Promise<LegacyOnboardingTask[]>;
  getOnboardingTemplates(): Promise<OnboardingTemplate[]>;

  // DEPARTMENTS & DESIGNATIONS
  getDepartments(): Promise<Department[]>;
  saveDepartment(department: Department): Promise<void>;
  getDesignations(): Promise<Designation[]>;
  saveDesignation(designation: Designation): Promise<void>;

  // SETTINGS
  getSettings(): Promise<AppSettings>;
  saveSettings(settings: AppSettings): Promise<void>;

  // BIOMETRIC DEVICES
  getBiometricDevices(): BiometricDeviceConfig[];
  saveBiometricDevices(devices: BiometricDeviceConfig[]): void;
  getBiometricPunchRecords(): Promise<BiometricPunchRecord[]>;
  saveBiometricPunchRecords(records: BiometricPunchRecord[]): Promise<void>;
  getBiometricSyncLogs(): Promise<BiometricSyncLog[]>;
  saveBiometricSyncLogs(logs: BiometricSyncLog[]): Promise<void>;

  // STORAGE HELPERS / LOGGING
  addSheetLog(sheetName: string, action: 'INSERT' | 'UPDATE' | 'DELETE' | 'SYNC', rowData: object): Promise<void>;
  generateEmployeeDiff(
    oldEmp: Employee | null,
    newEmp: Employee,
    changedBy?: string,
    changedByName?: string,
    changeType?: 'CREATE' | 'UPDATE' | 'DELETE' | 'BULK_UPDATE',
    source?: 'MANUAL' | 'TRANSITION' | 'BULK_IMPORT' | 'SYSTEM_AUTO' | 'API',
    reason?: string,
    notes?: string
  ): any;
  uploadFile(file: File, folderId: string): Promise<string>;

  // RECRUITMENT HELPERS
  getStageTemplates(): Promise<StageTemplate[]>;
  saveStageTemplates(templates: StageTemplate[]): Promise<void>;
  getInterviewPanels(): Promise<InterviewPanel[]>;
  saveInterviewPanels(panels: InterviewPanel[]): Promise<void>;
  getScorecards(): Promise<EvaluationScorecard[]>;
  saveScorecards(scorecards: EvaluationScorecard[]): Promise<void>;
  getJDMatches(): Promise<JDResumeMatch[]>;
  saveJDMatches(matches: JDResumeMatch[]): Promise<void>;

  // HISTORY & EXIT
  addEmployeeHistory(entry: EmployeeHistoryEntry): Promise<void>;
  getEmployeeHistory(employeeId: string): Promise<EmployeeHistoryEntry[]>;
  createExitRecord(record: ExitRecord): Promise<void>;
  getExitRecords(): Promise<ExitRecord[]>;

  // EXIT TEMPLATES
  getExitChecklistTemplates(): Promise<ExitChecklistTemplate[]>;
  getExitInterviewTemplates(): Promise<ExitInterviewTemplate[]>;

  // EXIT PROCESS
  getExitProcessStages(): Promise<ExitProcessStage[]>;
  saveExitProcessStages(stages: ExitProcessStage[]): Promise<void>;
  getSettlementConfig(): Promise<SettlementConfig | null>;
  saveSettlementConfig(config: SettlementConfig): Promise<void>;

  // PERFORMANCE REVIEW CYCLES
  getPerformanceReviewCycles(): Promise<PerformanceReviewCycle[]>;
  savePerformanceReviewCycles(cycles: PerformanceReviewCycle[]): Promise<void>;

  // PERFORMANCE REVIEW TEMPLATES
  getPerformanceReviewTemplates(): Promise<PerformanceReviewTemplate[]>;
  savePerformanceReviewTemplates(templates: PerformanceReviewTemplate[]): Promise<void>;

  // TRAINING
  getTrainingSubmissions(): Promise<TrainingSubmission[]>;
  saveTrainingSubmissions(submissions: TrainingSubmission[]): Promise<void>;
  getPeerAssignments(): Promise<PeerAssignment[]>;
  savePeerAssignments(assignments: PeerAssignment[]): Promise<void>;
  getTrainingRequests(): Promise<TrainingRequest[]>;
  saveTrainingRequests(requests: TrainingRequest[]): Promise<void>;
  getTrainingMentorships(): Promise<TrainingMentorship[]>;
  saveTrainingMentorships(mentorships: TrainingMentorship[]): Promise<void>;
  getTrainingCheckIns(): Promise<TrainingCheckIn[]>;
  saveTrainingCheckIns(checkIns: TrainingCheckIn[]): Promise<void>;
  getTrainingMessages(): Promise<TrainingMessage[]>;
  saveTrainingMessages(messages: TrainingMessage[]): Promise<void>;

  // SALARY & COMPENSATION
  getSalaryComponents(): Promise<SalaryComponent[]>;
  saveSalaryComponents(components: SalaryComponent[]): Promise<void>;
  getSalaryStructures(): Promise<SalaryStructure[]>;
  saveSalaryStructures(structures: SalaryStructure[]): Promise<void>;
  saveSalaryStructure(structure: SalaryStructure): Promise<void>;
  getSalaryStructureByEmployee(employeeId: string): Promise<SalaryStructure | null>;
  getPayGrades(): Promise<PayGrade[]>;
  savePayGrades(payGrades: PayGrade[]): Promise<void>;
  getSalaryRevisions(): Promise<SalaryRevision[]>;
  saveSalaryRevisions(revisions: SalaryRevision[]): Promise<void>;
  getSalaryRevisionsByEmployee(employeeId: string): Promise<SalaryRevision[]>;
  addSalaryRevision(revision: SalaryRevision): Promise<void>;

  // SHIFTS
  getShifts(): Promise<Shift[]>;
  saveShifts(shifts: Shift[]): Promise<void>;
  getShiftAssignments(): Promise<ShiftAssignment[]>;
  saveShiftAssignments(assignments: ShiftAssignment[]): Promise<void>;
  getShiftSwapRequests(): Promise<ShiftSwapRequest[]>;
  saveShiftSwapRequests(requests: ShiftSwapRequest[]): Promise<void>;
  getShiftTemplates(): Promise<ShiftTemplate[]>;
  saveShiftTemplates(templates: ShiftTemplate[]): Promise<void>;

  // PAYROLL CONFIG
  getCurrencies(): Promise<Currency[]>;
  saveCurrencies(currencies: Currency[]): Promise<void>;
  getTaxRules(): Promise<TaxRule[]>;
  saveTaxRules(rules: TaxRule[]): Promise<void>;
  getStatutoryDeductions(): Promise<StatutoryDeduction[]>;
  saveStatutoryDeductions(deductions: StatutoryDeduction[]): Promise<void>;
  getPayrollCalculations(): Promise<PayrollCalculation[]>;
  savePayrollCalculations(calculations: PayrollCalculation[]): Promise<void>;

  // LEAVE CONFIG
  getLeavePolicies(): Promise<LeavePolicy[]>;
  saveLeavePolicies(policies: LeavePolicy[]): Promise<void>;
  getLeaveTypeConfigs(): Promise<any[]>;
  saveLeaveTypeConfigs(configs: any[]): Promise<void>;

  // RECRUITMENT
  getRecruitmentAnalytics(): Promise<RecruitmentAnalytics[]>;
  saveRecruitmentAnalytics(analytics: RecruitmentAnalytics[]): Promise<void>;
  getHires(): Promise<HireDetails[]>;
  saveHires(hires: HireDetails[]): Promise<void>;
  getInterviewSchedules(): Promise<InterviewSchedule[]>;
  saveInterviewSchedules(schedules: InterviewSchedule[]): Promise<void>;

  // ORG CHART
  getOrgChartNodes(): Promise<OrgChartNode[]>;
  saveOrgChartNodes(nodes: OrgChartNode[]): Promise<void>;

  // PAYSLIPS & NOTIFICATIONS
  getPayslips(): Promise<any[]>;
  savePayslips(payslips: any[]): Promise<void>;
  getNotifications(): Promise<any[]>;
  saveNotifications(notifications: any[]): Promise<void>;

  // USERS & STATUS
  getUsers(): Promise<any[]>;
  saveUsers(users: any[]): Promise<void>;
  getStatusHistory(): Promise<EmployeeStatusHistory[]>;
  saveStatusHistory(history: EmployeeStatusHistory[]): Promise<void>;

  // SHEET LOGS
  getSheetLogs(): Promise<SheetLog[]>;

  // SYNC
  syncAll(): Promise<void>;
  syncModule(module: string): Promise<void>;
}
