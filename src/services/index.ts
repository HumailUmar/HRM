export type { IDataAdapter } from './interfaces/IDataAdapter';
export { LocalStorageAdapter } from './LocalStorageAdapter';
export { GoogleSheetsAdapter } from './GoogleSheetsAdapter';
export { BaseDatabaseAdapter } from './adapters/BaseDatabaseAdapter';
export { MySQLAdapter } from './adapters/MySQLAdapter';
export { getDataAdapter, refreshDataAdapter } from './DataAdapterFactory';
export type { StorageType } from './DataAdapterFactory';
export { EmployeeService, employeeService } from './EmployeeService';
export { AttendanceService, attendanceService } from './AttendanceService';
export { LeaveService, leaveService } from './LeaveService';
export { PayrollService, payrollService } from './PayrollService';
export { RecruitmentService, recruitmentService } from './RecruitmentService';
export { PerformanceService, performanceService } from './PerformanceService';
export { TrainingService, trainingService } from './TrainingService';
export { DocumentService, documentService } from './DocumentService';

// Biometric Device Integration Services
export type { IBiometricAdapter } from './biometric/IBiometricAdapter';
export { getBiometricAdapter } from './biometric/BiometricAdapterFactory';
export { MockBiometricAdapter } from './biometric/MockBiometricAdapter';
