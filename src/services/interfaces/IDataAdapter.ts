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
  JDResumeMatch
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

  // TRAINING
  getTrainingModules(): Promise<TrainingModule[]>;
  saveTrainingModule(module: TrainingModule): Promise<void>;
  getTrainingAssignments(): Promise<TrainingAssignment[]>;
  saveTrainingAssignment(assignment: TrainingAssignment): Promise<void>;

  // DOCUMENTS
  getDocuments(): Promise<EmployeeDocument[]>;
  saveDocument(document: EmployeeDocument): Promise<void>;
  getEmployeeDocuments(): Promise<EmployeeDocument[]>;
  saveEmployeeDocuments(docs: EmployeeDocument[]): Promise<void>;
  
  getJobDescriptions(): Promise<JobDescription[]>;
  saveJobDescriptions(jobs: JobDescription[]): Promise<void>;

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
  
  // ONBOARDING
  getOnboardingTasks(): Promise<LegacyOnboardingTask[]>;
  getOnboardingTemplates(): Promise<OnboardingTemplate[]>;
  
  // EXIT TEMPLATES
  getExitChecklistTemplates(): Promise<ExitChecklistTemplate[]>;
  getExitInterviewTemplates(): Promise<ExitInterviewTemplate[]>;

  // SYNC
  syncAll(): Promise<void>;
  syncModule(module: string): Promise<void>;
}
