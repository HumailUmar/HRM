import { z } from 'zod';

export const DatabaseConfigSchema = z.object({
  mysql: z.object({
    host: z.string().optional(),
    port: z.union([z.number(), z.string()]).optional(),
    database: z.string().optional(),
    username: z.string().optional(),
    password: z.string().optional(),
    ssl: z.boolean().optional(),
    poolSize: z.union([z.number(), z.string()]).optional(),
    timeout: z.union([z.number(), z.string()]).optional(),
  }).default({}),
  postgres: z.object({
    host: z.string().optional(),
    port: z.union([z.number(), z.string()]).optional(),
    database: z.string().optional(),
    username: z.string().optional(),
    password: z.string().optional(),
    ssl: z.boolean().optional(),
    poolSize: z.union([z.number(), z.string()]).optional(),
    timeout: z.union([z.number(), z.string()]).optional(),
  }).default({}),
}).default({ mysql: {}, postgres: {} });

export const GoogleSheetsConfigSchema = z.object({
  spreadsheetId: z.string().default(''),
  attendanceSheet: z.string().default('HumailEli_Attendance'),
  payrollSheet: z.string().default('HumailEli_Payroll'),
  recruitmentSheet: z.string().optional(),
  leaveSheet: z.string().default('HumailEli_Leaves'),
  employeeSheet: z.string().optional(),
  documentsSheet: z.string().optional(),
  successionSheet: z.string().optional(),
  onboardingTasksSheet: z.string().optional(),
  orgChartSheet: z.string().optional(),
  hiresSheet: z.string().optional(),
  reviewTemplatesSheet: z.string().optional(),
  performanceReviewsSheet: z.string().optional(),
  interviewScheduleSheet: z.string().optional(),
  leavePoliciesSheet: z.string().optional(),
  leaveTypeConfigsSheet: z.string().optional(),
  payslipsSheet: z.string().optional(),
  notificationsSheet: z.string().optional(),
  shiftsSheet: z.string().optional(),
  shiftAssignmentsSheet: z.string().optional(),
  shiftSwapRequestsSheet: z.string().optional(),
  shiftTemplatesSheet: z.string().optional(),
  currenciesSheet: z.string().optional(),
  taxRulesSheet: z.string().optional(),
  statutoryDeductionsSheet: z.string().optional(),
  payrollCalculationsSheet: z.string().optional(),
  reviewCyclesSheet: z.string().optional(),
  usersSheet: z.string().optional(),
  loginSessionsSheet: z.string().optional(),
  passwordResetsSheet: z.string().optional(),
  departmentsSheet: z.string().optional(),
  statusHistorySheet: z.string().optional(),
  designationsSheet: z.string().optional(),
  whatsappMessagesSheet: z.string().optional(),
  whatsappTemplatesSheet: z.string().optional(),
  whatsappConversationsSheet: z.string().optional(),
  driveFolderId: z.string().optional(),
}).default({
  spreadsheetId: '',
  attendanceSheet: 'HumailEli_Attendance',
  payrollSheet: 'HumailEli_Payroll',
  leaveSheet: 'HumailEli_Leaves',
});

export const AIConfigSchema = z.object({
  provider: z.enum(['gemini', 'anthropic', 'openai', 'custom', 'none']).default('none'),
  apiKey: z.string().optional(),
  customEndpoint: z.string().optional(),
  enableResumeParsing: z.boolean().default(false),
  enableScreening: z.boolean().default(false),
  enableJDMatching: z.boolean().default(false),
  enableAnalytics: z.boolean().default(false),
}).default({
  provider: 'none',
  enableResumeParsing: false,
  enableScreening: false,
  enableJDMatching: false,
  enableAnalytics: false,
});

export const WhatsAppConfigSchema = z.object({
  apiUrl: z.string().default(''),
  phoneNumberId: z.string().optional(),
  accessToken: z.string().optional(),
  businessAccountId: z.string().optional(),
  verifyToken: z.string().optional(),
}).default({ apiUrl: '' });

export const BiometricConfigSchema = z.object({
  apiUrl: z.string().default(''),
}).default({ apiUrl: '' });

export const AttendanceRulesSchema = z.object({
  lateThreshold: z.string().default('09:05'),
  earlyDepartureThreshold: z.string().default('17:55'),
  halfDayHours: z.number().default(4),
  fullDayHours: z.number().default(8),
  gracePeriodMinutes: z.number().default(5),
}).default({
  lateThreshold: '09:05',
  earlyDepartureThreshold: '17:55',
  halfDayHours: 4,
  fullDayHours: 8,
  gracePeriodMinutes: 5,
});

export const PayrollRulesSchema = z.object({
  perfectAttendanceBonus: z.number().default(150),
  latePenalty: z.number().default(5),
  halfDayDeduction: z.number().default(50),
  absentPenalty: z.number().default(100),
  overtimeRate: z.number().default(1.5),
  taxRate: z.number().default(10),
  socialSecurityRate: z.number().default(5),
  healthInsuranceDeduction: z.number().default(50),
}).default({
  perfectAttendanceBonus: 150,
  latePenalty: 5,
  halfDayDeduction: 50,
  absentPenalty: 100,
  overtimeRate: 1.5,
  taxRate: 10,
  socialSecurityRate: 5,
  healthInsuranceDeduction: 50,
});

export const RecruitmentRulesSchema = z.object({
  minExperienceYears: z.number().default(3),
  minScreeningScore: z.number().default(70),
  screeningQuestionsCount: z.number().default(10),
  whatsAppMessageTemplate: z.string().default(''),
}).default({
  minExperienceYears: 3,
  minScreeningScore: 70,
  screeningQuestionsCount: 10,
  whatsAppMessageTemplate: '',
});

export const CompanySettingsSchema = z.object({
  companyName: z.string().default(''),
  companyEmail: z.string().default(''),
  companyPhone: z.string().default(''),
  companyAddress: z.string().default(''),
  workStartTime: z.string().default('09:00'),
  workEndTime: z.string().default('18:00'),
  weekends: z.array(z.string()).default(['Saturday', 'Sunday']),
  publicHolidays: z.array(z.string()).default([]),
  baseCurrency: z.string().default('USD'),
}).default({
  companyName: '',
  companyEmail: '',
  companyPhone: '',
  companyAddress: '',
  workStartTime: '09:00',
  workEndTime: '18:00',
  weekends: ['Saturday', 'Sunday'],
  publicHolidays: [],
  baseCurrency: 'USD',
});

export const StatusManagementRulesSchema = z.object({
  enableStatusManagement: z.boolean().default(false),
  autoExpireOnLeave: z.boolean().default(false),
  autoExpireProbation: z.boolean().default(false),
  autoResignToTerminated: z.boolean().default(false),
  enableBulkStatusUpdate: z.boolean().default(false),
  allowRehireTerminated: z.boolean().default(false),
}).default({
  enableStatusManagement: false,
  autoExpireOnLeave: false,
  autoExpireProbation: false,
  autoResignToTerminated: false,
  enableBulkStatusUpdate: false,
  allowRehireTerminated: false,
});

export const AuditTrailRulesSchema = z.object({
  enableAuditTrail: z.boolean().default(false),
  trackAllFields: z.boolean().default(false),
  trackedFields: z.array(z.string()).default([]),
  requireReason: z.boolean().default(false),
  requireReasonHighImpact: z.boolean().default(false),
  retentionPeriod: z.string().default('30d'),
}).default({
  enableAuditTrail: false,
  trackAllFields: false,
  trackedFields: [],
  requireReason: false,
  requireReasonHighImpact: false,
  retentionPeriod: '30d',
});

export const SettingsSchema = z.object({
  storageType: z.enum(['local', 'mysql', 'postgresql', 'google-sheets', 'api']).default('local'),
  mysqlHost: z.string().optional(),
  mysqlPort: z.union([z.number(), z.string()]).optional(),
  mysqlDatabase: z.string().optional(),
  mysqlUsername: z.string().optional(),
  mysqlPassword: z.string().optional(),
  mysqlSSL: z.boolean().optional(),
  mysqlPoolSize: z.union([z.number(), z.string()]).optional(),
  mysqlTimeout: z.union([z.number(), z.string()]).optional(),
  
  postgresHost: z.string().optional(),
  postgresPort: z.union([z.number(), z.string()]).optional(),
  postgresDatabase: z.string().optional(),
  postgresUsername: z.string().optional(),
  postgresPassword: z.string().optional(),
  postgresSSL: z.boolean().optional(),
  postgresPoolSize: z.union([z.number(), z.string()]).optional(),
  postgresTimeout: z.union([z.number(), z.string()]).optional(),

  isMockMode: z.boolean().default(true),
  googleSheetId: z.string().optional(),
  attendanceSheetName: z.string().optional(),
  payrollSheetName: z.string().optional(),
  leaveSheetName: z.string().optional(),

  database: DatabaseConfigSchema,
  googleSheets: GoogleSheetsConfigSchema,
  ai: AIConfigSchema,
  whatsApp: WhatsAppConfigSchema,
  biometric: BiometricConfigSchema,

  resumeParserApiUrl: z.string().optional(),
  aiScreeningApiUrl: z.string().optional(),

  attendanceRules: AttendanceRulesSchema,
  payrollRules: PayrollRulesSchema,
  recruitmentRules: RecruitmentRulesSchema,
  companySettings: CompanySettingsSchema,
  statusRules: StatusManagementRulesSchema.optional(),
  auditTrailRules: AuditTrailRulesSchema.optional(),
});
