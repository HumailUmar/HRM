import { logger } from '../../lib/logger';
import { IDataAdapter } from '../interfaces/IDataAdapter';
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
  StageTemplate,
  InterviewPanel,
  EvaluationScorecard,
  JDResumeMatch,
  EmployeeHistoryEntry,
  ExitRecord,
  ExitChecklistTemplate,
  ExitInterviewTemplate
} from '../../types';

export interface DatabaseConnectionConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
  poolSize?: number;
  timeout?: number;
}

export abstract class BaseDatabaseAdapter implements IDataAdapter {
  protected config: DatabaseConnectionConfig;
  protected isConnected: boolean = false;
  protected lastSyncTime: string | null = null;

  constructor(config: DatabaseConnectionConfig) {
    this.config = config;
  }

  // ===== CONNECTION MANAGEMENT =====
  abstract connect(): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract testConnection(): Promise<{ success: boolean; message: string }>;

  // ===== QUERY EXECUTION =====
  protected abstract executeQuery<T>(query: string, params?: any[]): Promise<T[]>;
  protected abstract executeNonQuery(query: string, params?: any[]): Promise<{ affectedRows: number }>;
  protected abstract getLastInsertId(): Promise<string>;

  // ===== TABLE INITIALIZATION =====
  abstract initializeTables(): Promise<void>;

  // ===== EMPLOYEE =====
  abstract getEmployees(): Promise<Employee[]>;
  abstract getEmployee(id: string): Promise<Employee | null>;
  abstract saveEmployee(employee: Employee): Promise<Employee>;
  abstract saveEmployees(employees: Employee[]): Promise<void>;
  abstract deleteEmployee(id: string): Promise<void>;

  // ===== ATTENDANCE =====
  abstract getAttendance(): Promise<AttendanceRecord[]>;
  abstract getAttendanceByEmployee(employeeId: string): Promise<AttendanceRecord[]>;
  abstract saveAttendance(records: AttendanceRecord[]): Promise<void>;
  abstract saveAttendanceRecord(record: AttendanceRecord): Promise<void>;

  // ===== LEAVE =====
  abstract getLeaves(): Promise<LeaveRecord[]>;
  abstract getLeavesByEmployee(employeeId: string): Promise<LeaveRecord[]>;
  abstract saveLeave(leave: LeaveRecord): Promise<void>;
  abstract saveLeaves(leaves: LeaveRecord[]): Promise<void>;

  // ===== PAYROLL =====
  abstract getPayroll(): Promise<PayrollRecord[]>;
  abstract getPayrollByEmployee(employeeId: string): Promise<PayrollRecord[]>;
  abstract savePayroll(records: PayrollRecord[]): Promise<void>;

  // ===== RECRUITMENT =====
  abstract getCandidates(): Promise<Candidate[]>;
  abstract saveCandidate(candidate: Candidate): Promise<void>;
  abstract saveCandidates(candidates: Candidate[]): Promise<void>;

  // ===== RECRUITMENT HELPERS =====
  abstract getStageTemplates(): Promise<StageTemplate[]>;
  abstract saveStageTemplates(templates: StageTemplate[]): Promise<void>;
  abstract getInterviewPanels(): Promise<InterviewPanel[]>;
  abstract saveInterviewPanels(panels: InterviewPanel[]): Promise<void>;
  abstract getScorecards(): Promise<EvaluationScorecard[]>;
  abstract saveScorecards(scorecards: EvaluationScorecard[]): Promise<void>;
  abstract getJDMatches(): Promise<JDResumeMatch[]>;
  abstract saveJDMatches(matches: JDResumeMatch[]): Promise<void>;

  // ===== HISTORY & EXIT =====
  abstract addEmployeeHistory(entry: EmployeeHistoryEntry): Promise<void>;
  abstract getEmployeeHistory(employeeId: string): Promise<EmployeeHistoryEntry[]>;
  abstract createExitRecord(record: ExitRecord): Promise<void>;
  abstract getExitRecords(): Promise<ExitRecord[]>;

  // ===== EXIT TEMPLATES =====
  abstract getExitChecklistTemplates(): Promise<ExitChecklistTemplate[]>;
  abstract getExitInterviewTemplates(): Promise<ExitInterviewTemplate[]>;

  // ===== STORAGE HELPERS / LOGGING =====
  abstract addSheetLog(sheetName: string, action: 'INSERT' | 'UPDATE' | 'DELETE' | 'SYNC', rowData: object): Promise<void>;
  abstract generateEmployeeDiff(
    oldEmp: Employee | null,
    newEmp: Employee,
    changedBy?: string,
    changedByName?: string,
    changeType?: 'CREATE' | 'UPDATE' | 'DELETE' | 'BULK_UPDATE',
    source?: 'MANUAL' | 'TRANSITION' | 'BULK_IMPORT' | 'SYSTEM_AUTO' | 'API',
    reason?: string,
    notes?: string
  ): any;
  abstract uploadFile(file: File, folderId: string): Promise<string>;
  
  // ===== BIOMETRIC DEVICES =====
  abstract getBiometricDevices(): BiometricDeviceConfig[];
  abstract saveBiometricDevices(devices: BiometricDeviceConfig[]): void;

  // ===== PERFORMANCE =====
  abstract getPerformanceReviews(): Promise<PerformanceReview[]>;
  abstract savePerformanceReview(review: PerformanceReview): Promise<void>;
  abstract savePerformanceReviews(reviews: PerformanceReview[]): Promise<void>;
  abstract getPerformanceGoals(): Promise<PerformanceGoal[]>;
  abstract savePerformanceGoal(goal: PerformanceGoal): Promise<void>;

  // ===== TRAINING =====
  abstract getTrainingModules(): Promise<TrainingModule[]>;
  abstract saveTrainingModule(module: TrainingModule): Promise<void>;
  abstract getTrainingAssignments(): Promise<TrainingAssignment[]>;
  abstract saveTrainingAssignment(assignment: TrainingAssignment): Promise<void>;

  // ===== DOCUMENTS =====
  abstract getDocuments(): Promise<EmployeeDocument[]>;
  abstract saveDocument(document: EmployeeDocument): Promise<void>;

  // ===== DEPARTMENTS & DESIGNATIONS =====
  abstract getDepartments(): Promise<Department[]>;
  abstract saveDepartment(department: Department): Promise<void>;
  abstract getDesignations(): Promise<Designation[]>;
  abstract saveDesignation(designation: Designation): Promise<void>;

  // ===== SETTINGS =====
  abstract getSettings(): Promise<AppSettings>;
  abstract saveSettings(settings: AppSettings): Promise<void>;

  // ===== SYNC =====
  async syncAll(): Promise<void> {
    this.lastSyncTime = new Date().toISOString();
    logger.info('Full sync completed at:', this.lastSyncTime);
  }

  async syncModule(module: string): Promise<void> {
    logger.info(`Module ${module} synced at:`, new Date().toISOString());
  }

  // ===== UTILITY =====
  protected formatDate(date: string): string {
    return new Date(date).toISOString().split('T')[0];
  }

  protected formatDateTime(date: string): string {
    return new Date(date).toISOString();
  }

  protected toJson(data: any): string {
    return JSON.stringify(data);
  }

  protected fromJson<T>(data: string): T {
    return JSON.parse(data);
  }

  protected escapeString(str: string): string {
    return str.replace(/'/g, "''");
  }

  protected getTableName(module: string): string {
    const prefix = 'humail_eli_';
    const map: Record<string, string> = {
      employees: 'employees',
      attendance: 'attendance',
      leaves: 'leaves',
      payroll: 'payroll',
      candidates: 'candidates',
      performance_reviews: 'performance_reviews',
      performance_goals: 'performance_goals',
      training_modules: 'training_modules',
      training_assignments: 'training_assignments',
      documents: 'documents',
      departments: 'departments',
      designations: 'designations',
      settings: 'settings'
    };
    return `${prefix}${map[module] || module}`;
  }
}
