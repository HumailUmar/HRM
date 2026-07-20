import { logger } from './logger';
import { StageTemplate, EvaluationScorecard, InterviewPanel, Employee, RecruitmentAnalytics, HireDetails, EmployeeDocument, EmployeeStatusHistory, EmployeeHistoryEntry, AttendanceRecord, PayrollRecord, Candidate, AppSettings, LeaveRecord, DocumentRecord, SuccessionPlan, LegacyOnboardingTask, OnboardingTemplate, OrgChartNode, Department, Designation, JobDescription, JDResumeMatch, WhatsAppMessage, WhatsAppTemplate, WhatsAppConversation, InterviewSchedule, LeavePolicy, Shift, ShiftAssignment, ShiftSwapRequest, ShiftTemplate, Currency, TaxRule, StatutoryDeduction, PayrollCalculation, PerformanceReviewCycle, PerformanceReview, PerformanceGoal, PerformanceReviewTemplate, TrainingModule, TrainingSubmission, ExitChecklistTemplate, ExitChecklistItem, ExitInterviewTemplate, ExitInterviewQuestion, ExitProcessStage, SettlementConfig, PeerAssignment, TrainingRequest, TrainingMentorship, TrainingCheckIn, TrainingMessage, TrainingAssignment, TrainingQuiz, ExitRecord, SalaryComponent, SalaryStructure, PayGrade, SalaryRevision } from '../types';
import { INITIAL_EMPLOYEES, INITIAL_DOCUMENTS, INITIAL_ATTENDANCE, INITIAL_CANDIDATES, DEFAULT_SETTINGS, INITIAL_ORG_CHART, INITIAL_DEPARTMENTS, INITIAL_DESIGNATIONS,
  INITIAL_JOB_DESCRIPTIONS, INITIAL_STAGE_TEMPLATES, INITIAL_SCORECARDS, INITIAL_INTERVIEW_PANELS, DEFAULT_LEAVE_POLICIES
} from './mockData';
import { BiometricDeviceConfig, BiometricPunchRecord, BiometricSyncLog } from '../types';
import { DEFAULT_PERFORMANCE_TEMPLATES } from './performanceReviewTemplates';
import { 
  readSheet, appendToSheet, updateSheet, findRowById, ensureSheetExists 
} from '../services/googleSheetsService';
import { getSyncTracker, updateSyncTracker, clearSyncTracker } from './syncTracker';
import { getColumnLetterFromZero } from './columnUtils';
import { SettingsSchema } from './settingsSchema';

// Headers constants
export const JD_MATCHES_HEADERS = ['id', 'jobId', 'candidateId', 'candidateName', 'overallScore', 'matchLevel', 'skillMatchScore', 'experienceMatchScore', 'educationMatchScore', 'certificationMatchScore', 'matchingSkills', 'missingSkills', 'aiSummary', 'aiRecommendation', 'aiReasoning', 'status', 'reviewedBy', 'reviewedAt', 'notes', 'createdAt', 'updatedAt'];
export const STATUS_HISTORY_HEADERS = ['id', 'employeeId', 'employeeName', 'oldStatus', 'newStatus', 'changedBy', 'changedByName', 'changedAt', 'reason', 'notes'];

/**
 * Maps rows through a deserializer, isolating per-row failures so a single
 * malformed row cannot crash the entire batch read. Bad rows are logged and skipped.
 */
function mapRowsSafe<T>(rows: any[][], deserialize: (row: any[]) => T, label: string): T[] {
  if (!Array.isArray(rows)) return [];
  const out: T[] = [];
  for (const row of rows) {
    try {
      out.push(deserialize(row));
    } catch (err) {
      logger.error(`mapRowsSafe: skipping malformed ${label} row:`, err);
    }
  }
  return out;
}

export const EMPLOYEE_HEADERS = [
  'id', 'name', 'email', 'phone', 'joiningDate', 'status', 'seatNumber',
  'contractSigned', 'trainingAssigned', 'trainingCompleted', 'welcomeEmailSent', 'feedbackSubmitted',
  'exitResignationAccepted', 'exitAssetHandover', 'exitNdaRenewed', 'exitFinalSettlement', 'exitExitInterview',
  'mentorId', 'mentorName', 'journeyTimelineJson',
  'onboardingTemplateId', 'onboardingTasksStatus', 'onboardingTasksCompleted',
  // ===== PERSONAL INFORMATION =====
  'cnic', 'cnicFrontImage', 'cnicBackImage', 'passportNumber', 'passportExpiry', 'nationality', 'religion',
  'dateOfBirth', 'gender', 'maritalStatus', 'bloodGroup', 'personalEmail', 'workEmail', 'phonePersonal', 'phoneWork',
  'currentAddress', 'permanentAddress', 'city', 'state', 'country', 'postalCode',
  'emergencyContactName', 'emergencyContactPhone', 'emergencyContactRelationship',
  'linkedinUrl', 'githubUrl', 'otherSocialUrls', 'profileImage',
  'educationJson', 'certificationsJson', 'previousEmployersJson',
  // ===== EMPLOYMENT DETAILS =====
  'grade', 'jobCategory', 'employmentType', 'contractStartDate', 'contractEndDate',
  'isProbation', 'probationEndDate', 'confirmationDate', 'workLocation', 'shift',
  'costCenter', 'reportingManagerId', 'hrBusinessPartnerId', 'payrollGroup',
  'departmentId', 'designationId', 'role', 'punchCode',
  'leaveStartDate', 'leaveEndDate', 'leaveType', 'suspensionStartDate', 'suspensionEndDate', 'suspensionReason',
  'resignationDate', 'lastWorkingDate', 'retirementDate', 'terminationDate', 'terminationReason',
  // ===== COMPENSATION =====
  'salaryStructureJson', 'salaryHistoryJson', 'payGradeId', 'currency'
];

export const DEPARTMENT_HEADERS = [
  'id', 'name', 'code', 'description', 'headId', 'headName', 'parentDepartmentId', 'location', 'budget', 'costCenter', 'employeeCount', 'isActive', 'createdAt', 'updatedAt'
];

export const DESIGNATION_HEADERS = [
  'id', 'name', 'code', 'description', 'departmentId', 'level', 'category', 'reportingToDesignationId', 'minSalary', 'maxSalary', 'isActive', 'createdAt', 'updatedAt'
];

export const ATTENDANCE_HEADERS = [
  'id', 'employeeId', 'employeeName', 'date', 'checkIn', 'checkOut', 'lateMinutes', 'earlyDepartureMinutes', 'status'
];

export const PAYROLL_HEADERS = [
  'id', 'employeeId', 'employeeName', 'month', 'baseSalary', 'bonus', 'penalty', 'leaveDeductions', 'netSalary', 'status', 'calculatedAt'
];

export const LEAVES_HEADERS = [
  'id', 'employeeId', 'employeeName', 'leaveType', 'startDate', 'endDate', 'reason', 'status', 'approvedBy', 'approvedAt'
];

export const DOCUMENTS_HEADERS = [
  'id', 'employeeId', 'employeeName', 'documentType', 'documentTypeLabel',
  'fileName', 'fileSize', 'fileType', 'fileUrl', 'driveFileId',
  'uploadedBy', 'uploadedByName', 'uploadedAt',
  'isVerified', 'verifiedBy', 'verifiedByName', 'verifiedAt',
  'expiryDate', 'notes', 'tags', 'version', 'parentDocumentId', 'status'
];

export const RECRUITMENT_HEADERS = [
  'id', 'name', 'email', 'phone', 'skills', 'experienceYears', 'resumeFileName', 'status',
  'screeningTotalScore', 'whatsappSent', 'chatbotScore', 'videoScore', 'combinedScore', 'chatbotTranscript', 'videoUrl'
];

export const WHATSAPP_MESSAGE_HEADERS = ['id', 'candidateId', 'candidateName', 'phoneNumber', 'templateName', 'templateLanguage', 'components', 'status', 'sentAt', 'deliveredAt', 'readAt', 'failureReason', 'errorCode', 'conversationId', 'messageId', 'cost'];
export const WHATSAPP_TEMPLATE_HEADERS = ['id', 'name', 'namespace', 'language', 'category', 'status', 'headerText', 'bodyText', 'footerText', 'buttons', 'sampleData', 'createdBy', 'createdAt', 'updatedAt'];
export const WHATSAPP_CONVERSATION_HEADERS = ['id', 'candidateId', 'candidateName', 'phoneNumber', 'startedAt', 'endedAt', 'messages', 'status'];

export const INTERVIEW_SCHEDULE_HEADERS = [
  'id', 'candidateId', 'candidateName', 'jobId', 'jobTitle', 'stage',
  'proposedDate', 'proposedTime', 'durationMinutes', 'timezone',
  'interviewersJson', 'meetingLink', 'meetingLocation', 'meetingInstructions',
  'candidateEmail', 'candidatePhone',
  'status', 'confirmedAt', 'completedAt', 'cancelledAt', 'cancellationReason',
  'remindersJson', 'feedback', 'scorecardId', 'createdAt', 'updatedAt', 'createdBy'
];

export const LEAVE_POLICY_HEADERS = ['id', 'name', 'description', 'isDefault', 'isActive', 'appliesToDepartments', 'appliesToRoles', 'appliesToEmploymentTypes', 'accrualFrequency', 'accrualDayOfMonth', 'accrualStartDate', 'carryOverEnabled', 'carryOverLimit', 'carryOverExpiryMonths', 'requireManagerApproval', 'requireHRApproval', 'requireMultipleApprovals', 'additionalApprovers', 'maxConsecutiveDays', 'minDaysBeforeLeave', 'blackoutDates', 'encashmentAllowed', 'encashmentLimit', 'encashmentRate', 'createdAt', 'updatedAt', 'createdBy'];
export const LEAVE_TYPE_CONFIG_HEADERS = ['policyId', 'id', 'name', 'code', 'description', 'color', 'icon', 'quota', 'quotaPeriod', 'proRataEnabled', 'accrualRate', 'accrualPeriod', 'accrualStart', 'accrualCustomDate', 'carryOverMax', 'carryOverExpiry', 'isPaid', 'requiresMedicalCertificate', 'minimumNoticeDays', 'maximumConsecutiveDays', 'availableTo', 'encashmentAllowed', 'encashmentMaxDays', 'encashmentRate', 'totalAllocated', 'totalUsed', 'totalRemaining'];
export const PAYSLIP_HEADERS = ['id', 'employeeId', 'employeeName', 'month', 'year', 'baseSalary', 'bonuses', 'deductions', 'netSalary', 'pdfUrl', 'generatedAt', 'isDownloaded'];
export const NOTIFICATION_HEADERS = ['id', 'employeeId', 'title', 'message', 'type', 'isRead', 'link', 'createdAt'];

export const SHIFT_HEADERS = ['id', 'name', 'code', 'description', 'startTime', 'endTime', 'breakDurationMinutes', 'totalWorkHours', 'workingDays', 'isRotating', 'rotationPattern', 'shiftDifferential', 'nightShiftAllowance', 'applicableDepartments', 'isActive', 'createdAt', 'updatedAt'];
export const SHIFT_ASSIGNMENT_HEADERS = ['id', 'employeeId', 'employeeName', 'shiftId', 'shiftName', 'date', 'startTime', 'endTime', 'status', 'swapRequestId', 'approvedBy', 'approvedAt', 'notes'];
export const SHIFT_SWAP_REQUEST_HEADERS = ['id', 'employeeId', 'employeeName', 'shiftAssignmentId', 'date', 'currentShiftId', 'currentShiftName', 'requestedShiftId', 'requestedShiftName', 'reason', 'status', 'approvedBy', 'approvedAt', 'createdAt'];
export const SHIFT_TEMPLATE_HEADERS = ['id', 'name', 'description', 'shifts', 'applicableDepartments', 'isActive', 'createdAt'];

export const CURRENCY_HEADERS = ['id', 'code', 'symbol', 'name', 'exchangeRate', 'baseCurrency', 'isActive', 'updatedAt'];
export const TAX_RULE_HEADERS = ['id', 'country', 'name', 'description', 'taxType', 'calculationBasis', 'calculationMethod', 'percentages', 'fixedAmount', 'percentageOfSalary', 'maxAmount', 'minAmount', 'appliesTo', 'isActive', 'effectiveDate', 'expiresDate', 'createdAt', 'updatedAt'];
export const STATUTORY_DEDUCTION_HEADERS = ['id', 'country', 'name', 'description', 'deductionType', 'employeeContribution', 'employerContribution', 'calculationBasis', 'fixedAmount', 'maxAmount', 'minAmount', 'appliesTo', 'isActive', 'effectiveDate', 'expiresDate', 'createdAt', 'updatedAt'];
export const PAYROLL_CALCULATION_HEADERS = ['id', 'employeeId', 'employeeName', 'month', 'year', 'currency', 'exchangeRate', 'baseSalary', 'allowances', 'bonuses', 'overtime', 'commission', 'otherEarnings', 'totalEarnings', 'incomeTax', 'socialSecurity', 'pension', 'healthInsurance', 'loanDeduction', 'otherDeductions', 'totalDeductions', 'netSalary', 'netSalaryInBaseCurrency', 'employerSocialSecurity', 'employerPension', 'employerHealthInsurance', 'totalEmployerCost', 'status', 'calculatedAt', 'paidAt', 'annualTaxableIncome', 'annualTaxPaid', 'taxBracket'];

export const PERFORMANCE_REVIEW_CYCLE_HEADERS = ['id', 'name', 'description', 'type', 'status', 'startDate', 'endDate', 'selfReviewDeadline', 'managerReviewDeadline', 'peerReviewDeadline', 'includesSelfReview', 'includesManagerReview', 'includesPeerReview', 'includesSubordinateReview', 'sections', 'ratingScale', 'ratingDescriptions', 'isActive', 'createdBy', 'createdAt', 'updatedAt'];
export const PERFORMANCE_REVIEW_HEADERS = ['id', 'employeeId', 'employeeName', 'reviewerId', 'reviewerName', 'reviewerType', 'reviewCycleId', 'reviewCycleName', 'sectionScores', 'questionScores', 'overallScore', 'weightedOverallScore', 'strengths', 'areasForImprovement', 'goals', 'recommendation', 'additionalComments', 'status', 'submittedAt', 'acknowledgedAt', 'createdAt', 'updatedAt'];
export const PERFORMANCE_GOAL_HEADERS = ['id', 'employeeId', 'employeeName', 'title', 'description', 'category', 'priority', 'targetDate', 'progress', 'status', 'createdBy', 'createdAt', 'updatedAt', 'completedAt'];

export const TEMPLATE_TYPE_HEADERS = ['id', 'name', 'description', 'isActive'];
export const TEMPLATE_SECTION_HEADERS = ['id', 'templateId', 'name', 'description', 'weight'];
export const TEMPLATE_KPI_HEADERS = ['id', 'sectionId', 'name', 'description', 'type', 'targetValue', 'weight'];
export const TEMPLATE_DECISION_MATRIX_HEADERS = ['id', 'templateId', 'condition', 'recommendation'];
export const TEMPLATE_RED_FLAG_HEADERS = ['id', 'templateId', 'condition', 'alertMessage'];
export const TEMPLATE_FIELD_HEADERS = ['id', 'templateId', 'sectionId', 'label', 'type', 'targetValue', 'options'];
export const PERFORMANCE_REVIEW_TEMPLATE_HEADERS = ['id', 'name', 'description', 'department', 'role', 'isActive', 'sectionsJson', 'createdBy', 'createdAt', 'updatedAt'];

export const USER_HEADERS = ['id', 'employeeId', 'email', 'password', 'role', 'permissions', 'isActive', 'isPasswordChanged', 'lastLogin', 'createdAt', 'updatedAt'];
export const LOGIN_SESSION_HEADERS = ['id', 'userId', 'token', 'ipAddress', 'userAgent', 'expiresAt', 'isActive', 'createdAt'];
export const PASSWORD_RESET_HEADERS = ['id', 'userId', 'token', 'expiresAt', 'isUsed', 'createdAt'];

export const SUCCESSION_HEADERS = [
  'id', 'roleName', 'department', 'currentIncumbentId', 'currentIncumbentName', 'successorId', 'successorName', 'potentialRating', 'readiness', 'notes'
];

export const ONBOARDING_TASK_HEADERS = [
  'id', 'employeeId', 'employeeName', 'taskName', 'dueDate', 'assignedToId', 'assignedToName', 'completed'
];

export const ORG_CHART_HEADERS = [
  'id', 'positionName', 'department', 'employeeId', 'parentId', 'isCritical', 'riskLevel', 'successors'
];

export const HIRE_HEADERS = [
  'employeeId', 'candidateId', 'jobId', 'hireDate', 'employmentType', 'contractStartDate', 'contractEndDate',
  'probationPeriodMonths', 'salary', 'currency', 'onboardingTemplateId', 'onboardingTasksJson', 'createdBy', 'createdAt', 'status'
];

export const SALARY_STRUCTURE_HEADERS = [
  'id', 'employeeId', 'components', 'totalMonthly', 'totalAnnual', 'ctc',
  'employerContributions', 'payGradeId', 'currency', 'effectiveFrom',
  'effectiveTo', 'isActive', 'createdAt', 'updatedAt'
];

export const EXIT_RECORDS_HEADERS = [
  'id', 'employeeId', 'employeeName', 'initiatedBy', 'initiatedByName', 'initiatedAt', 'status',
  'checklistTemplateId', 'checklistItemsJson', 'interviewTemplateId',
  'interviewResponsesJson', 'settlementJson', 'resignationDate',
  'lastWorkingDate', 'reason', 'notes', 'completedAt', 'updatedAt'
];

export const TRAINING_MODULE_HEADERS = [
  'id', 'title', 'description', 'contentType', 'contentUrl', 'textContent',
  'expectedDurationMinutes', 'isMentorVerificationRequired',
  'isAutoCompleteAllowed', 'passFailThreshold', 'createdBy', 'createdAt', 'updatedAt'
];

export const TRAINING_SUBMISSIONS_HEADERS = ['id', 'moduleId', 'employeeId', 'status', 'progress', 'submittedContentUrl', 'feedback', 'grade', 'submittedAt', 'reviewedAt'];

export const EXIT_CHECKLIST_TEMPLATES_HEADERS = ['id', 'name', 'description', 'applicableDepartments', 'applicableRoles'];
export const EXIT_CHECKLIST_ITEMS_HEADERS = ['id', 'checklistTemplateId', 'name', 'description', 'responsibleDepartment', 'isRequired', 'dueDays', 'order'];
export const EXIT_INTERVIEW_TEMPLATE_HEADERS = ['id', 'name', 'description', 'applicableDepartments', 'applicableRoles'];
export const EXIT_INTERVIEW_QUESTIONS_HEADERS = ['id', 'templateId', 'questionText', 'category', 'isRequired', 'answerType', 'options', 'order'];
export const EXIT_PROCESS_STAGES_HEADERS = ['id', 'name', 'description', 'order', 'dependentStageId', 'responsibleRole'];
export const EXIT_SETTLEMENT_CONFIG_HEADERS = ['leaveEncashmentPercentage', 'gratuityPercentage', 'bonusPercentage', 'deductionTypes', 'paymentTypes'];

// Initial mock leaves for offline/sandbox mode
export const INITIAL_LEAVES: LeaveRecord[] = [
  { id: "LR-101", employeeId: "EMP-001", employeeName: "Arsalan Khan", leaveType: "Sick Leave", startDate: "2026-07-15", endDate: "2026-07-16", reason: "Medical recovery post dental surgery.", status: "Pending" },
  { id: "LR-102", employeeId: "EMP-002", employeeName: "Zoya Patel", leaveType: "Casual Leave", startDate: "2026-07-20", endDate: "2026-07-20", reason: "Attending family event.", status: "Pending" }
];

/**
 * Parse a row array into an object using the provided headers.
 * - If the row has fewer columns than headers, missing fields get undefined.
 * - If the row has more columns, extra fields are ignored.
 */
export function parseRow<T = any>(
  row: any[],
  headers: string[],
  defaultValue: any = undefined
): Record<string, any> {
  const obj: Record<string, any> = {};
  const len = Math.min(row.length, headers.length);
  for (let i = 0; i < len; i++) {
    obj[headers[i]] = row[i] !== undefined ? row[i] : defaultValue;
  }
  return obj;
}

export function parseJson(value: any, defaultValue: any = undefined): any {
  if (!value || typeof value !== 'string') return defaultValue;
  try {
    return JSON.parse(value);
  } catch {
    return defaultValue;
  }
}

// Serializers
export function serializeEmployee(emp: Employee): any[] {
  const personal = emp.personal || ({} as Employee['personal']);
  const employment = emp.employment || ({} as Employee['employment']);
  const onboarding = emp.onboarding || ({} as Employee['onboarding']);
  return [
    emp.id || "",
    personal.name || emp.name || "",
    personal.email || emp.email || "",
    personal.phone || "",
    employment.joiningDate || "",
    employment.status || emp.status || "Active",
    employment.seatNumber || 0,
    onboarding.contractSigned ? "TRUE" : "FALSE",
    onboarding.trainingAssigned ? "TRUE" : "FALSE",
    onboarding.trainingCompleted ? "TRUE" : "FALSE",
    onboarding.welcomeEmailSent ? "TRUE" : "FALSE",
    onboarding.feedbackSubmitted ? "TRUE" : "FALSE",
    emp.exit?.resignationAccepted ? "TRUE" : "FALSE",
    emp.exit?.assetHandover ? "TRUE" : "FALSE",
    emp.exit?.ndaRenewed ? "TRUE" : "FALSE",
    emp.exit?.finalSettlement ? "TRUE" : "FALSE",
    emp.exit?.exitInterview ? "TRUE" : "FALSE",
    emp.mentorId || "",
    emp.mentorName || "",
    emp.journeyTimeline ? JSON.stringify(emp.journeyTimeline) : "",
    onboarding.templateId || "",
    onboarding.tasksStatus ? JSON.stringify(onboarding.tasksStatus) : "{}",
    onboarding.tasksCompleted ? onboarding.tasksCompleted.join(",") : "",
    
    // ===== PERSONAL INFORMATION =====
    emp.personal.cnic || "",
    emp.personal.cnicFrontImage || "",
    emp.personal.cnicBackImage || "",
    emp.personal.passportNumber || "",
    emp.personal.passportExpiry || "",
    emp.personal.nationality || "",
    emp.personal.religion || "",
    emp.personal.dateOfBirth || "",
    emp.personal.gender || "",
    emp.personal.maritalStatus || "",
    emp.personal.bloodGroup || "",
    emp.personal.personalEmail || "",
    emp.personal.email || "",
    emp.personal.phonePersonal || "",
    emp.personal.phone || "",
    emp.personal.currentAddress || "",
    emp.personal.permanentAddress || "",
    emp.personal.city || "",
    emp.personal.state || "",
    emp.personal.country || "",
    emp.personal.postalCode || "",
    emp.personal.emergencyContactName || "",
    emp.personal.emergencyContactPhone || "",
    emp.personal.emergencyContactRelationship || "",
    emp.personal.linkedinUrl || "",
    emp.personal.githubUrl || "",
    emp.personal.otherSocialUrls || "",
    emp.personal.profileImage || "",
    emp.education ? JSON.stringify(emp.education) : "[]",
    emp.certifications ? JSON.stringify(emp.certifications) : "[]",
    emp.previousEmployers ? JSON.stringify(emp.previousEmployers) : "[]",

    // ===== EMPLOYMENT DETAILS =====
    emp.employment.grade || "",
    emp.employment.jobCategory || "",
    emp.employment.employmentType || "",
    emp.employment.contractStartDate || "",
    emp.employment.contractEndDate || "",
    emp.employment.isProbation ? "TRUE" : "FALSE",
    emp.employment.probationEndDate || "",
    emp.employment.confirmationDate || "",
    emp.employment.workLocation || "",
    emp.employment.shift || "",
    emp.employment.costCenter || "",
    emp.employment.reportingManagerId || "",
    emp.employment.hrBusinessPartnerId || "",
    emp.employment.payrollGroup || "",
    emp.employment.departmentId || emp.department || "",
    emp.employment.designationId || emp.role || "",
    emp.employment.role || "",
    emp.employment.punchCode || "",
    emp.employment.leaveStartDate || "",
    emp.employment.leaveEndDate || "",
    emp.employment.leaveType || "",
    emp.employment.suspensionStartDate || "",
    emp.employment.suspensionEndDate || "",
    emp.employment.suspensionReason || "",
    emp.employment.resignationDate || "",
    emp.employment.lastWorkingDate || "",
    emp.employment.retirementDate || "",
    emp.employment.terminationDate || "",
    emp.employment.terminationReason || "",

    // ===== COMPENSATION =====
    emp.compensation.salaryStructure ? JSON.stringify(emp.compensation.salaryStructure) : (emp.baseSalary ? JSON.stringify({ totalMonthly: emp.baseSalary }) : ""),
    emp.compensation.salaryHistory ? JSON.stringify(emp.compensation.salaryHistory) : "[]",
    emp.compensation.payGradeId || "",
    emp.compensation.currency || "USD"
  ];
}

export function deserializeEmployee(row: any[]): Employee {
  const legacyRow = row || [];

  // Backward compatibility with legacy/simple row format used in some tests and imports:
  // [id, name, email, phone, role]
  if (legacyRow.length > 0 && legacyRow.length <= 5) {
    const [id = '', name = '', email = '', phone = '', role = ''] = legacyRow;
    return {
      id,
      name,
      email,
      phone,
      status: 'Active',
      role,
      department: '',
      personal: {
        name,
        email,
        phone,
      },
      employment: {
        joiningDate: '',
        status: 'Active',
        seatNumber: 0,
        role: (role as any) || undefined,
      },
      compensation: {
        currency: 'USD',
        salaryStructure: {},
        salaryHistory: [],
      },
      onboarding: {
        contractSigned: false,
        trainingAssigned: false,
        trainingCompleted: false,
        welcomeEmailSent: false,
        feedbackSubmitted: false,
        tasksStatus: {},
        tasksCompleted: [],
      },
      exit: null,
      journeyTimeline: [],
      education: [],
      certifications: [],
      previousEmployers: [],
    } as Employee;
  }

  const expectedLength = EMPLOYEE_HEADERS.length;
  if (!row || row.length < expectedLength) {
    row = [...(row || []), ...Array(expectedLength - (row ? row.length : 0)).fill('')];
  }

  const data = parseRow(row, EMPLOYEE_HEADERS);
  const getBool = (val: any) => String(val).toUpperCase() === 'TRUE';

  const id = data.id || '';
  const name = data.name || '';
  const email = data.email || '';
  const phone = data.phone || '';
  const status = (data.status as any) || 'Active';
  const role = data.role || data.designationId || '';

  return {
    id,
    name,
    email,
    phone,
    status,
    role,
    department: data.departmentId || '',
    baseSalary: parseJson(data.salaryStructureJson, {}).totalMonthly || undefined,

    personal: {
      name,
      email,
      phone,
      cnic: data.cnic || undefined,
      cnicFrontImage: data.cnicFrontImage || undefined,
      cnicBackImage: data.cnicBackImage || undefined,
      passportNumber: data.passportNumber || undefined,
      passportExpiry: data.passportExpiry || undefined,
      nationality: data.nationality || undefined,
      religion: data.religion || undefined,
      dateOfBirth: data.dateOfBirth || undefined,
      gender: (data.gender as any) || undefined,
      maritalStatus: (data.maritalStatus as any) || undefined,
      bloodGroup: (data.bloodGroup as any) || undefined,
      personalEmail: data.personalEmail || undefined,
      phonePersonal: data.phonePersonal || undefined,
      currentAddress: data.currentAddress || undefined,
      permanentAddress: data.permanentAddress || undefined,
      city: data.city || undefined,
      state: data.state || undefined,
      country: data.country || undefined,
      postalCode: data.postalCode || undefined,
      emergencyContactName: data.emergencyContactName || undefined,
      emergencyContactPhone: data.emergencyContactPhone || undefined,
      emergencyContactRelationship: data.emergencyContactRelationship || undefined,
      linkedinUrl: data.linkedinUrl || undefined,
      githubUrl: data.githubUrl || undefined,
      otherSocialUrls: data.otherSocialUrls || undefined,
      profileImage: data.profileImage || undefined,
    },
    employment: {
      joiningDate: data.joiningDate || '',
      status,
      seatNumber: Number(data.seatNumber) || 0,
      grade: data.grade || undefined,
      jobCategory: data.jobCategory || undefined,
      employmentType: (data.employmentType as any) || undefined,
      contractStartDate: data.contractStartDate || undefined,
      contractEndDate: data.contractEndDate || undefined,
      isProbation: data.isProbation ? getBool(data.isProbation) : undefined,
      probationEndDate: data.probationEndDate || undefined,
      confirmationDate: data.confirmationDate || undefined,
      workLocation: (data.workLocation as any) || undefined,
      shift: data.shift || undefined,
      costCenter: data.costCenter || undefined,
      reportingManagerId: data.reportingManagerId || undefined,
      hrBusinessPartnerId: data.hrBusinessPartnerId || undefined,
      payrollGroup: data.payrollGroup || undefined,
      departmentId: data.departmentId || undefined,
      designationId: data.designationId || undefined,
      role: (data.role as any) || undefined,
      punchCode: data.punchCode || undefined,
      leaveStartDate: data.leaveStartDate || undefined,
      leaveEndDate: data.leaveEndDate || undefined,
      leaveType: (data.leaveType as any) || undefined,
      suspensionStartDate: data.suspensionStartDate || undefined,
      suspensionEndDate: data.suspensionEndDate || undefined,
      suspensionReason: data.suspensionReason || undefined,
      resignationDate: data.resignationDate || undefined,
      lastWorkingDate: data.lastWorkingDate || undefined,
      retirementDate: data.retirementDate || undefined,
      terminationDate: data.terminationDate || undefined,
      terminationReason: data.terminationReason || undefined,
    },
    compensation: {
      salaryStructure: parseJson(data.salaryStructureJson, {}),
      salaryHistory: parseJson(data.salaryHistoryJson, []),
      payGradeId: data.payGradeId || undefined,
      currency: data.currency || 'USD',
    },
    onboarding: {
      contractSigned: getBool(data.contractSigned),
      trainingAssigned: getBool(data.trainingAssigned),
      trainingCompleted: getBool(data.trainingCompleted),
      welcomeEmailSent: getBool(data.welcomeEmailSent),
      feedbackSubmitted: getBool(data.feedbackSubmitted),
      templateId: data.onboardingTemplateId || undefined,
      tasksStatus: parseJson(data.onboardingTasksStatus, {}),
      tasksCompleted: data.onboardingTasksCompleted ? data.onboardingTasksCompleted.split(',').filter(Boolean) : [],
    },
    exit: data.exitResignationAccepted
      ? {
          resignationAccepted: getBool(data.exitResignationAccepted),
          assetHandover: getBool(data.exitAssetHandover),
          ndaRenewed: getBool(data.exitNdaRenewed),
          finalSettlement: getBool(data.exitFinalSettlement),
          exitInterview: getBool(data.exitExitInterview),
        }
      : null,
    mentorId: data.mentorId || undefined,
    mentorName: data.mentorName || undefined,
    journeyTimeline: parseJson(data.journeyTimelineJson, []),
    education: parseJson(data.educationJson, []),
    certifications: parseJson(data.certificationsJson, []),
    previousEmployers: parseJson(data.previousEmployersJson, []),
  };
}

export function serializeAttendance(att: AttendanceRecord): any[] {
  return [
    att.id || "",
    att.employeeId || "",
    att.employeeName || "",
    att.date || "",
    att.checkIn || "",
    att.checkOut || "",
    att.lateMinutes || 0,
    att.earlyDepartureMinutes || 0,
    att.status || "Full Day"
  ];
}

export function deserializeAttendance(row: any[]): AttendanceRecord {
  const expectedLength = ATTENDANCE_HEADERS.length;
  if (!row || row.length < expectedLength) {
    row = [...(row || []), ...Array(expectedLength - (row ? row.length : 0)).fill('')];
  }
  const data = parseRow(row, ATTENDANCE_HEADERS);
  return {
    id: data.id || '',
    employeeId: data.employeeId || '',
    employeeName: data.employeeName || '',
    date: data.date || '',
    checkIn: data.checkIn || '',
    checkOut: data.checkOut || '',
    lateMinutes: Number(data.lateMinutes) || 0,
    earlyDepartureMinutes: Number(data.earlyDepartureMinutes) || 0,
    status: (data.status as any) || 'Full Day',
  };
}

export function serializePayroll(pay: PayrollRecord): any[] {
  return [
    pay.id || "",
    pay.employeeId || "",
    pay.employeeName || "",
    pay.month || "",
    pay.baseSalary || 0,
    pay.bonus || 0,
    pay.penalty || 0,
    pay.leaveDeductions || 0,
    pay.netSalary || 0,
    pay.status || "Pending",
    pay.calculatedAt || ""
  ];
}

export function deserializePayroll(row: any[]): PayrollRecord {
  const expectedLength = PAYROLL_HEADERS.length;
  if (!row || row.length < expectedLength) {
    row = [...(row || []), ...Array(expectedLength - (row ? row.length : 0)).fill("")];
  }
  const data = parseRow(row, PAYROLL_HEADERS);
  return {
    id: data.id || "",
    employeeId: data.employeeId || "",
    employeeName: data.employeeName || "",
    month: data.month || "",
    baseSalary: Number(data.baseSalary) || 0,
    bonus: Number(data.bonus) || 0,
    penalty: Number(data.penalty) || 0,
    leaveDeductions: Number(data.leaveDeductions) || 0,
    netSalary: Number(data.netSalary) || 0,
    status: (data.status as any) || "Pending",
    calculatedAt: data.calculatedAt || ""
  };
}

export function serializeLeave(lv: LeaveRecord): any[] {
  return [
    lv.id || "",
    lv.employeeId || "",
    lv.employeeName || "",
    lv.leaveType || "",
    lv.startDate || "",
    lv.endDate || "",
    lv.reason || "",
    lv.status || "Pending",
    lv.approvedBy || "",
    lv.approvedAt || ""
  ];
}

export function deserializeLeave(row: any[]): LeaveRecord {
  const expectedLength = LEAVES_HEADERS.length;
  if (!row || row.length < expectedLength) {
    row = [...(row || []), ...Array(expectedLength - (row ? row.length : 0)).fill("")];
  }
  const data = parseRow(row, LEAVES_HEADERS);
  return {
    id: data.id || "",
    employeeId: data.employeeId || "",
    employeeName: data.employeeName || "",
    leaveType: data.leaveType || "",
    startDate: data.startDate || "",
    endDate: data.endDate || "",
    reason: data.reason || "",
    status: (data.status as any) || "Pending",
    approvedBy: data.approvedBy || undefined,
    approvedAt: data.approvedAt || undefined
  };
}

export function serializeEmployeeDocument(doc: EmployeeDocument): any[] {
  return [
    doc.id || "",
    doc.employeeId || "",
    doc.employeeName || "",
    doc.documentType || "",
    doc.documentTypeLabel || "",
    doc.fileName || "",
    doc.fileSize || 0,
    doc.fileType || "",
    doc.fileUrl || "",
    doc.driveFileId || "",
    doc.uploadedBy || "",
    doc.uploadedByName || "",
    doc.uploadedAt || "",
    doc.isVerified ? "TRUE" : "FALSE",
    doc.verifiedBy || "",
    doc.verifiedByName || "",
    doc.verifiedAt || "",
    doc.expiryDate || "",
    doc.notes || "",
    (doc.tags || []).join(", "),
    doc.version || 1,
    doc.parentDocumentId || "",
    doc.status || "Pending Verification"
  ];
}

export function deserializeEmployeeDocument(row: any[]): EmployeeDocument {
  const expectedLength = DOCUMENTS_HEADERS.length;
  if (!row || row.length < expectedLength) {
    row = [...(row || []), ...Array(expectedLength - (row ? row.length : 0)).fill("")];
  }
  const data = parseRow(row, DOCUMENTS_HEADERS);
  const isVerifiedBool = String(data.isVerified).toUpperCase() === "TRUE";
  return {
    id: data.id || "",
    employeeId: data.employeeId || "",
    employeeName: data.employeeName || "",
    documentType: (data.documentType as any) || "",
    documentTypeLabel: data.documentTypeLabel || "",
    fileName: data.fileName || "",
    fileSize: Number(data.fileSize) || 0,
    fileType: data.fileType || "",
    fileUrl: data.fileUrl || "",
    driveFileId: data.driveFileId || "",
    uploadedBy: data.uploadedBy || "",
    uploadedByName: data.uploadedByName || "",
    uploadedAt: data.uploadedAt || "",
    isVerified: isVerifiedBool,
    verifiedBy: data.verifiedBy || undefined,
    verifiedByName: data.verifiedByName || undefined,
    verifiedAt: data.verifiedAt || undefined,
    expiryDate: data.expiryDate || undefined,
    notes: data.notes || "",
    tags: data.tags ? String(data.tags).split(",").map(t => t.trim()) : [],
    version: Number(data.version) || 1,
    parentDocumentId: data.parentDocumentId || undefined,
    status: (data.status as any) || (isVerifiedBool ? "Verified" : "Pending Verification")
  };
}

export function serializeCandidate(c: Candidate): any[] {
  return [
    c.id || "",
    c.name || "",
    c.email || "",
    c.phone || "",
    Array.isArray(c.skills) ? c.skills.join(', ') : c.skills || "",
    Number(c.experienceYears) || 0,
    c.resumeFileName || "",
    c.status || "Applied",
    Number(c.screeningTotalScore) || 0,
    c.whatsappSent ? "TRUE" : "FALSE",
    Number(c.chatbotScore) || 0,
    Number(c.videoScore) || 0,
    Number(c.combinedScore) || 0,
    c.chatbotTranscript || "",
    c.videoUrl || ""
  ];
}

export function deserializeCandidate(row: any[]): Candidate {
  const expectedLength = RECRUITMENT_HEADERS.length;
  if (!row || row.length < expectedLength) {
    row = [...(row || []), ...Array(expectedLength - (row ? row.length : 0)).fill("")];
  }
  const data = parseRow(row, RECRUITMENT_HEADERS);
  return {
    id: data.id || "",
    name: data.name || "",
    email: data.email || "",
    phone: data.phone || undefined,
    skills: data.skills ? String(data.skills).split(', ').filter(Boolean) : [],
    experienceYears: Number(data.experienceYears) || 0,
    resumeFileName: data.resumeFileName || undefined,
    status: (data.status as Candidate['status']) || "Applied",
    screeningTotalScore: Number(data.screeningTotalScore) || 0,
    whatsappSent: String(data.whatsappSent).toUpperCase() === "TRUE",
    chatbotScore: Number(data.chatbotScore) || 0,
    videoScore: Number(data.videoScore) || 0,
    combinedScore: Number(data.combinedScore) || 0,
    chatbotTranscript: data.chatbotTranscript || undefined,
    videoUrl: data.videoUrl || undefined
  };
}

export function serializeWhatsAppMessage(msg: WhatsAppMessage): any[] {
  return [
    msg.id, msg.candidateId, msg.candidateName, msg.phoneNumber, msg.templateName, msg.templateLanguage,
    JSON.stringify(msg.components), msg.status, msg.sentAt, msg.deliveredAt || "", msg.readAt || "",
    msg.failureReason || "", msg.errorCode || "", msg.conversationId || "", msg.messageId || "", msg.cost || 0
  ];
}

export function deserializeWhatsAppMessage(row: any[]): WhatsAppMessage {
  const data = parseRow(row, WHATSAPP_MESSAGE_HEADERS);
  return {
    id: data.id || '',
    candidateId: data.candidateId || '',
    candidateName: data.candidateName || '',
    phoneNumber: data.phoneNumber || '',
    templateName: data.templateName || '',
    templateLanguage: data.templateLanguage || '',
    components: parseJson(data.components, []),
    status: data.status || 'Queued',
    sentAt: data.sentAt || '',
    deliveredAt: data.deliveredAt || undefined,
    readAt: data.readAt || undefined,
    failureReason: data.failureReason || undefined,
    errorCode: data.errorCode || undefined,
    conversationId: data.conversationId || undefined,
    messageId: data.messageId || undefined,
    cost: Number(data.cost) || 0,
  };
}

export function serializeInterviewSchedule(s: InterviewSchedule): any[] {
  return [
    s.id || "",
    s.candidateId || "",
    s.candidateName || "",
    s.jobId || "",
    s.jobTitle || "",
    s.stage || "",
    s.proposedDate || "",
    s.proposedTime || "",
    s.durationMinutes || 45,
    s.timezone || "UTC",
    s.interviewers ? JSON.stringify(s.interviewers) : "[]",
    s.meetingLink || "",
    s.meetingLocation || "",
    s.meetingInstructions || "",
    s.candidateEmail || "",
    s.candidatePhone || "",
    s.status || "Draft",
    s.confirmedAt || "",
    s.completedAt || "",
    s.cancelledAt || "",
    s.cancellationReason || "",
    s.reminders ? JSON.stringify(s.reminders) : "[]",
    s.feedback || "",
    s.scorecardId || "",
    s.createdAt || "",
    s.updatedAt || "",
    s.createdBy || ""
  ];
}

export function deserializeInterviewSchedule(row: any[]): InterviewSchedule {
  const data = parseRow(row, INTERVIEW_SCHEDULE_HEADERS);
  return {
    id: data.id || '',
    candidateId: data.candidateId || '',
    candidateName: data.candidateName || '',
    jobId: data.jobId || '',
    jobTitle: data.jobTitle || '',
    stage: data.stage || '',
    proposedDate: data.proposedDate || '',
    proposedTime: data.proposedTime || '',
    durationMinutes: Number(data.durationMinutes) || 45,
    timezone: data.timezone || 'UTC',
    interviewers: parseJson(data.interviewersJson, []),
    meetingLink: data.meetingLink || undefined,
    meetingLocation: data.meetingLocation || undefined,
    meetingInstructions: data.meetingInstructions || '',
    candidateEmail: data.candidateEmail || '',
    candidatePhone: data.candidatePhone || '',
    status: (data.status as any) || 'Draft',
    confirmedAt: data.confirmedAt || undefined,
    completedAt: data.completedAt || undefined,
    cancelledAt: data.cancelledAt || undefined,
    cancellationReason: data.cancellationReason || undefined,
    reminders: parseJson(data.remindersJson, []),
    feedback: data.feedback || '',
    scorecardId: data.scorecardId || undefined,
    createdAt: data.createdAt || '',
    updatedAt: data.updatedAt || '',
    createdBy: data.createdBy || '',
  };
}

export function serializeSuccession(s: SuccessionPlan): any[] {
  return [
    s.id || "",
    s.roleName || "",
    s.department || "",
    s.currentIncumbentId || "",
    s.currentIncumbentName || "",
    s.successorId || "",
    s.successorName || "",
    s.potentialRating || "High",
    s.readiness || "Ready Now",
    s.notes || ""
  ];
}

export function deserializeSuccession(row: any[]): SuccessionPlan {
  const data = parseRow(row, SUCCESSION_HEADERS);
  return {
    id: data.id || "",
    roleName: data.roleName || "",
    department: data.department || "",
    currentIncumbentId: data.currentIncumbentId || "",
    currentIncumbentName: data.currentIncumbentName || "",
    successorId: data.successorId || "",
    successorName: data.successorName || "",
    potentialRating: (data.potentialRating as any) || "High",
    readiness: (data.readiness as any) || "Ready Now",
    notes: data.notes || ""
  };
}

export function serializeOnboardingTask(t: LegacyOnboardingTask): any[] {
  return [
    t.id || "",
    t.employeeId || "",
    t.employeeName || "",
    t.taskName || "",
    t.dueDate || "",
    t.assignedToId || "",
    t.assignedToName || "",
    t.completed ? "TRUE" : "FALSE"
  ];
}

export function deserializeOnboardingTask(row: any[]): LegacyOnboardingTask {
  const data = parseRow(row, ONBOARDING_TASK_HEADERS);
  return {
    id: data.id || "",
    employeeId: data.employeeId || "",
    employeeName: data.employeeName || "",
    taskName: data.taskName || "",
    dueDate: data.dueDate || "",
    assignedToId: data.assignedToId || "",
    assignedToName: data.assignedToName || "",
    completed: String(data.completed).toUpperCase() === 'TRUE'
  };
}

export function serializeOrgChart(node: OrgChartNode): any[] {
  return [
    node.id || "",
    node.positionName || "",
    node.department || "",
    node.employeeId || "",
    node.parentId || "",
    node.isCritical ? "TRUE" : "FALSE",
    node.riskLevel || "Low",
    Array.isArray(node.successors) ? node.successors.join(",") : ""
  ];
}

export function deserializeOrgChart(row: any[]): OrgChartNode {
  const data = parseRow(row, ORG_CHART_HEADERS);
  return {
    id: data.id || "",
    positionName: data.positionName || "",
    department: data.department || "",
    employeeId: data.employeeId || undefined,
    parentId: data.parentId || undefined,
    isCritical: String(data.isCritical).toUpperCase() === 'TRUE',
    riskLevel: (data.riskLevel as any) || 'Low',
    successors: data.successors ? String(data.successors).split(',').filter(Boolean) : [],
    children: []
  };
}

export function serializeHire(h: HireDetails): any[] {
  return [
    h.employeeId || "",
    h.candidateId || "",
    h.jobId || "",
    h.hireDate || "",
    h.employmentType || "Permanent",
    h.contractStartDate || "",
    h.contractEndDate || "",
    h.probationPeriodMonths || 0,
    h.salary || 0,
    h.currency || "USD",
    h.onboardingTemplateId || "",
    h.onboardingTasks ? JSON.stringify(h.onboardingTasks) : "[]",
    h.createdBy || "",
    h.createdAt || "",
    h.status || "Draft"
  ];
}

export function deserializeHire(row: any[]): HireDetails {
  const data = parseRow(row, HIRE_HEADERS);
  return {
    employeeId: data.employeeId || "",
    candidateId: data.candidateId || "",
    jobId: data.jobId || "",
    hireDate: data.hireDate || "",
    employmentType: data.employmentType || "Permanent",
    contractStartDate: data.contractStartDate || "",
    contractEndDate: data.contractEndDate || undefined,
    probationPeriodMonths: Number(data.probationPeriodMonths) || 0,
    salary: Number(data.salary) || 0,
    currency: data.currency || "USD",
    onboardingTemplateId: data.onboardingTemplateId || "",
    onboardingTasks: parseJson(data.onboardingTasksJson, []),
    createdBy: data.createdBy || "",
    createdAt: data.createdAt || "",
    status: data.status || "Draft"
  };
}


// Local Storage Core Helpers (Local Mock Mode)
export const loadData = <T>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const item = localStorage.getItem(`humail_eli_${key}`);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    logger.error(`Error loading key ${key}:`, error);
    return defaultValue;
  }
};

export const saveData = <T>(key: string, value: T): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`humail_eli_${key}`, JSON.stringify(value));
  } catch (error) {
    logger.error(`Error saving key ${key}:`, error);
  }
};

// Sync Logs System (to display live GSheet broadcasts in the Dashboard)
export interface SheetLog {
  id: string;
  sheetName: string;
  timestamp: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE' | 'SYNC';
  rowData: string;
}

export const getSheetLogs = (): SheetLog[] => loadData<SheetLog[]>('sheet_logs', []);
export const addSheetLog = (sheetName: string, action: 'INSERT' | 'UPDATE' | 'DELETE' | 'SYNC', rowData: object) => {
  try {
    const logs = loadData<SheetLog[]>('sheet_logs', []);
    const newLog: SheetLog = {
      id: `LOG-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
      sheetName,
      timestamp: new Date().toISOString(),
      action,
      rowData: JSON.stringify(rowData)
    };
    saveData<SheetLog[]>('sheet_logs', [newLog, ...logs]);
  } catch (err) {
    // Fire-and-forget logging must never throw into callers (unhandled rejection).
    logger.error('addSheetLog failed:', err);
  }
};

// Synchronous Getters & Setters for UI state / Offline fallback / Mock mode
export const getEmployees = (): Employee[] => loadData<Employee[]>('employees', INITIAL_EMPLOYEES);
export const saveEmployees = (data: Employee[]) => {
  const withTimestamps = data.map(emp => ({
    ...emp,
    createdAt: emp.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
  saveData<Employee[]>('employees', withTimestamps);
};


export const getStatusHistory = (): EmployeeStatusHistory[] => loadData<EmployeeStatusHistory[]>('status_history', []);

export const getEmployeeHistory = (): EmployeeHistoryEntry[] => {
  return loadData<EmployeeHistoryEntry[]>('employee_history', []);
};
export const saveEmployeeHistory = (history: EmployeeHistoryEntry[]) => saveData('employee_history', history);
export const addEmployeeHistory = (entries: EmployeeHistoryEntry[]) => {
  const current = getEmployeeHistory();
  saveEmployeeHistory([...entries, ...current]);
  
  // Also log to GSheets if needed, but for now we'll handle LocalStorage
  if (!getSettings().isMockMode) {
    // In production, we'd send to a dedicated History sheet
    entries.forEach(entry => {
      appendToSheet('HumailEli_Employee_History', [[
        entry.id,
        entry.employeeId,
        entry.employeeName,
        entry.fieldName,
        entry.fieldLabel,
        entry.oldValue,
        entry.newValue,
        entry.changedBy,
        entry.changedByName,
        entry.changedAt,
        entry.reason,
        entry.notes,
        entry.changeType,
        entry.source,
        entry.ipAddress || '',
        entry.userAgent || ''
      ]]);
    });
  }
};

export const saveStatusHistory = (data: EmployeeStatusHistory[]) => saveData<EmployeeStatusHistory[]>('status_history', data);

export const getDepartments = (): Department[] => loadData<Department[]>('departments', INITIAL_DEPARTMENTS);
export const saveDepartments = (data: Department[]) => saveData<Department[]>('departments', data);

export const getDesignations = (): Designation[] => loadData<Designation[]>('designations', INITIAL_DESIGNATIONS);
export const saveDesignations = (data: Designation[]) => saveData<Designation[]>('designations', data);

export const getEmployeeDocuments = (): EmployeeDocument[] => loadData<EmployeeDocument[]>('employee_documents', INITIAL_DOCUMENTS);
export const saveEmployeeDocuments = (data: EmployeeDocument[]) => saveData<EmployeeDocument[]>('employee_documents', data);

export const getAttendance = (): AttendanceRecord[] => loadData<AttendanceRecord[]>('attendance', INITIAL_ATTENDANCE);
export const saveAttendance = (data: AttendanceRecord[]) => {
  const withTimestamps = data.map(record => ({
    ...record,
    createdAt: record.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
  saveData<AttendanceRecord[]>('attendance', withTimestamps);
};

export const getCandidates = (): Candidate[] => loadData<Candidate[]>('candidates', INITIAL_CANDIDATES);
export const saveCandidates = (data: Candidate[]) => {
  const withTimestamps = data.map(candidate => ({
    ...candidate,
    createdAt: candidate.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
  saveData<Candidate[]>('candidates', withTimestamps);
};

export const getPayroll = (): PayrollRecord[] => loadData<PayrollRecord[]>('payroll', []);
export const savePayroll = (data: PayrollRecord[]) => {
  const withTimestamps = data.map(record => ({
    ...record,
    createdAt: record.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
  saveData<PayrollRecord[]>('payroll', withTimestamps);
};

export const getLeaves = (): LeaveRecord[] => loadData<LeaveRecord[]>('leaves', INITIAL_LEAVES);
export const saveLeaves = (data: LeaveRecord[]) => {
  const withTimestamps = data.map(record => ({
    ...record,
    createdAt: record.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
  saveData<LeaveRecord[]>('leaves', withTimestamps);
};

export const getSuccessionPlans = (): SuccessionPlan[] => loadData<SuccessionPlan[]>('succession_plans', []);
export const saveSuccessionPlans = (data: SuccessionPlan[]) => saveData<SuccessionPlan[]>('succession_plans', data);

export const getShifts = (): Shift[] => loadData<Shift[]>('shifts', []);
export const saveShifts = (data: Shift[]) => saveData<Shift[]>('shifts', data);
export const getShiftAssignments = (): ShiftAssignment[] => loadData<ShiftAssignment[]>('shift_assignments', []);
export const saveShiftAssignments = (data: ShiftAssignment[]) => saveData<ShiftAssignment[]>('shift_assignments', data);
export const getShiftSwapRequests = (): ShiftSwapRequest[] => loadData<ShiftSwapRequest[]>('shift_swap_requests', []);
export const saveShiftSwapRequests = (data: ShiftSwapRequest[]) => saveData<ShiftSwapRequest[]>('shift_swap_requests', data);
export const getShiftTemplates = (): ShiftTemplate[] => loadData<ShiftTemplate[]>('shift_templates', []);
export const saveShiftTemplates = (data: ShiftTemplate[]) => saveData<ShiftTemplate[]>('shift_templates', data);

export const getCurrencies = (): Currency[] => loadData<Currency[]>('currencies', []);
export const saveCurrencies = (data: Currency[]) => saveData<Currency[]>('currencies', data);
export const getTaxRules = (): TaxRule[] => loadData<TaxRule[]>('tax_rules', []);
export const saveTaxRules = (data: TaxRule[]) => saveData<TaxRule[]>('tax_rules', data);
export const getStatutoryDeductions = (): StatutoryDeduction[] => loadData<StatutoryDeduction[]>('statutory_deductions', []);
export const saveStatutoryDeductions = (data: StatutoryDeduction[]) => saveData<StatutoryDeduction[]>('statutory_deductions', data);
export const getPayrollCalculations = (): PayrollCalculation[] => loadData<PayrollCalculation[]>('payroll_calculations', []);
export const savePayrollCalculations = (data: PayrollCalculation[]) => saveData<PayrollCalculation[]>('payroll_calculations', data);

export const getPerformanceReviewCycles = (): PerformanceReviewCycle[] => loadData<PerformanceReviewCycle[]>('review_cycles', []);
export const savePerformanceReviewCycles = (cycles: PerformanceReviewCycle[]) => {
  saveData('review_cycles', cycles);
  syncReviewCyclesToGSheet(cycles);
};
export const syncPerformanceReviewTemplatesToGSheet = async (templates: PerformanceReviewTemplate[]) => {
  if (getSettings().isMockMode) return;
  const rows = templates.map(t => [
    t.id, t.name, t.description, t.department || '', t.role || '',
    t.isActive ? 'TRUE' : 'FALSE',
    JSON.stringify(t.sections),
    t.createdBy || 'System',
    t.createdAt || new Date().toISOString(),
    t.updatedAt || new Date().toISOString()
  ]);
  await updateSheet('HumailEli_Review_Templates', 'A1', [PERFORMANCE_REVIEW_TEMPLATE_HEADERS, ...rows]);
};

// Review Cycles - Google Sheets sync
export const syncReviewCyclesToGSheet = async (cycles: PerformanceReviewCycle[]) => {
  if (getSettings().isMockMode) return;
  const rows = cycles.map(c => [
    c.id, c.name, c.description || '', c.type, c.status, c.startDate, c.endDate,
    c.selfReviewDeadline || '', c.managerReviewDeadline || '', c.peerReviewDeadline || '',
    c.includesSelfReview ? 'TRUE' : 'FALSE',
    c.includesManagerReview ? 'TRUE' : 'FALSE',
    c.includesPeerReview ? 'TRUE' : 'FALSE',
    c.includesSubordinateReview ? 'TRUE' : 'FALSE',
    JSON.stringify(c.sections || []),
    c.ratingScale || '1-5',
    JSON.stringify(c.ratingDescriptions || []),
    c.isActive ? 'TRUE' : 'FALSE',
    c.createdBy || 'System',
    c.createdAt || new Date().toISOString(),
    c.updatedAt || new Date().toISOString()
  ]);
  await updateSheet('HumailEli_Review_Cycles', 'A1', [PERFORMANCE_REVIEW_CYCLE_HEADERS, ...rows]);
};

// Performance Reviews - Google Sheets sync
export const syncPerformanceReviewsToGSheet = async (reviews: PerformanceReview[]) => {
  if (getSettings().isMockMode) return;
  const rows = reviews.map(r => [
    r.id, r.employeeId, r.employeeName, r.reviewerId, r.reviewerName, r.reviewerType,
    r.reviewCycleId, r.reviewCycleName,
    JSON.stringify(r.sectionScores || []),
    JSON.stringify(r.questionScores || []),
    r.overallScore || 0,
    r.weightedOverallScore || 0,
    r.strengths || '', r.areasForImprovement || '', r.goals || '',
    r.recommendation || 'Retain', r.additionalComments || '',
    r.status, r.submittedAt || '', r.acknowledgedAt || '',
    r.createdAt || new Date().toISOString(),
    r.updatedAt || new Date().toISOString()
  ]);
  await updateSheet('HumailEli_Performance_Reviews', 'A1', [PERFORMANCE_REVIEWS_HEADERS, ...rows]);
};

// Performance Goals - Google Sheets sync
export const syncPerformanceGoalsToGSheet = async (goals: PerformanceGoal[]) => {
  if (getSettings().isMockMode) return;
  const rows = goals.map(g => [
    g.id, g.employeeId, g.employeeName, g.title, g.description || '',
    g.category || 'Performance', g.priority || 'Medium',
    g.targetDate || '', g.progress || 0, g.status || 'Not Started',
    g.createdBy || 'System', g.createdAt || new Date().toISOString(),
    g.updatedAt || new Date().toISOString(), g.completedAt || ''
  ]);
  await updateSheet('HumailEli_Performance_Goals', 'A1', [PERFORMANCE_GOAL_HEADERS, ...rows]);
};

export const getPerformanceGoals = (): PerformanceGoal[] => loadData<PerformanceGoal[]>('performance_goals', []);
export const savePerformanceGoals = (data: PerformanceGoal[]) => {
  saveData('performance_goals', data);
  syncPerformanceGoalsToGSheet(data);
};

export const getPeerAssignments = (): PeerAssignment[] => {
  return loadData<PeerAssignment[]>('peer_assignments', []);
};

export const savePeerAssignments = (assignments: PeerAssignment[]) => {
  saveData('peer_assignments', assignments);
};

export const getOnboardingTasks = (): LegacyOnboardingTask[] => loadData<LegacyOnboardingTask[]>('onboarding_tasks', []);
export const saveOnboardingTasks = (data: LegacyOnboardingTask[]) => saveData<LegacyOnboardingTask[]>('onboarding_tasks', data);

export const getOrgChartNodes = (): OrgChartNode[] => {
  const nodes = loadData<OrgChartNode[]>('org_chart_nodes', INITIAL_ORG_CHART);
  return nodes.map(node => ({
    ...node,
    children: nodes.filter(n => n.parentId === node.id).map(n => n.id)
  }));
};

export const saveOrgChartNodes = (data: OrgChartNode[]) => {
  const nodesWithChildren = data.map(node => ({
    ...node,
    children: data.filter(n => n.parentId === node.id).map(n => n.id)
  }));
  saveData<OrgChartNode[]>('org_chart_nodes', nodesWithChildren);
};


import { DEFAULT_ONBOARDING_TEMPLATES } from './defaultTemplates';
export const getOnboardingTemplates = (): OnboardingTemplate[] => loadData<OnboardingTemplate[]>('onboarding_templates', DEFAULT_ONBOARDING_TEMPLATES);
export const saveOnboardingTemplates = (data: OnboardingTemplate[]) => saveData<OnboardingTemplate[]>('onboarding_templates', data);

export const getUsers = () => loadData('users', []);
export const saveUsers = (users: any[]) => saveData('users', users);

export const getInterviewSchedules = (): InterviewSchedule[] => loadData<InterviewSchedule[]>('interview_schedules', []);
export const saveInterviewSchedules = (data: InterviewSchedule[]) => saveData<InterviewSchedule[]>('interview_schedules', data);

export const getHires = (): HireDetails[] => loadData<HireDetails[]>('hires', []);
export const saveHires = (data: HireDetails[]) => saveData<HireDetails[]>('hires', data);


export const getJobDescriptions = (): JobDescription[] => {
  const jds = loadData<JobDescription[]>('job_descriptions', INITIAL_JOB_DESCRIPTIONS);
  // Ensure we always return a valid array
  if (Array.isArray(jds) && jds.length > 0) {
    return jds;
  }
  // If the stored data is empty, null, or invalid, return the default
  return INITIAL_JOB_DESCRIPTIONS;
};
export const saveJobDescriptions = (jds: JobDescription[]) => saveData('job_descriptions', jds);

export const getJDMatches = (): JDResumeMatch[] => loadData('jd_matches', []);
export const saveJDMatches = (matches: JDResumeMatch[]) => {
  saveData('jd_matches', matches);
  if (!getSettings().isMockMode) {
    const rows = matches.map(match => [
      match.id, match.jobId, match.candidateId, match.candidateName,
      match.overallScore, match.matchLevel,
      match.skillMatchScore, match.experienceMatchScore, match.educationMatchScore, match.certificationMatchScore,
      match.matchingSkills.join(','), match.missingSkills.join(','),
      match.aiSummary, match.aiRecommendation, match.aiReasoning,
      match.status, match.reviewedBy || '', match.reviewedAt || '', match.notes,
      match.createdAt, match.updatedAt
    ]);
    void appendToSheet('HumailEli_JD_Matches', rows);
  }
};

export const getSettings = (): AppSettings => {
  const persisted = loadData<any>('settings', DEFAULT_SETTINGS);
  const loaded = withoutSecrets(persisted);
  // Remove credentials written by older versions as soon as settings are read.
  if (JSON.stringify(persisted) !== JSON.stringify(loaded)) {
    saveData<AppSettings>('settings', loaded);
  }
  try {
    const result = SettingsSchema.safeParse(loaded);
    if (result.success) {
      return result.data as unknown as AppSettings;
    } else {
      console.warn('Settings validation failed, using defaults:', result.error.issues);
      return DEFAULT_SETTINGS;
    }
  } catch (error) {
    console.error('Unexpected error parsing settings:', error);
    return DEFAULT_SETTINGS;
  }
};
// Settings are persisted for UI behavior only. Credentials must be provisioned
// server-side; never write them to localStorage (including legacy settings).
const withoutSecrets = <T>(value: T): T => {
  if (Array.isArray(value)) return value.map(withoutSecrets) as T;
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value as Record<string, unknown>)
    .filter(([key]) => !/(?:api[_-]?key|access[_-]?token|verify[_-]?token|password|secret|username)$/i.test(key))
    .map(([key, child]) => [key, withoutSecrets(child)])) as T;
};
export const saveSettings = (data: AppSettings) => saveData<AppSettings>('settings', withoutSecrets(data));

export const getPerformanceReviewTemplates = (): PerformanceReviewTemplate[] => {
  return loadData<PerformanceReviewTemplate[]>('performance_review_templates', DEFAULT_PERFORMANCE_TEMPLATES);
};

export const savePerformanceReviewTemplates = (templates: PerformanceReviewTemplate[]) => {
  saveData('performance_review_templates', templates);
  syncPerformanceReviewTemplatesToGSheet(templates);
};

// --- Google Sheets Async Synchronization Logic (Real Mode) ---

/**
 * Initializes and ensures all sheets exist in the spreadsheet with correct headers.
 */
export async function initializeSpreadsheetSheets() {
  const settings = getSettings();
  const sheets = settings.googleSheets;
  if (!sheets.spreadsheetId || sheets.spreadsheetId.includes('Placeholder')) {
    logger.warn("Google Sheet ID not set, skipping spreadsheet initialization.");
    return;
  }
  await ensureSheetExists(sheets.employeeSheet || 'HumailEli_Employees', EMPLOYEE_HEADERS);
  await ensureSheetExists(sheets.attendanceSheet, ATTENDANCE_HEADERS);
  await ensureSheetExists(sheets.payrollSheet, PAYROLL_HEADERS);
  await ensureSheetExists(sheets.leaveSheet, LEAVES_HEADERS);
  await ensureSheetExists(sheets.documentsSheet || 'HumailEli_Employee_Documents', DOCUMENTS_HEADERS);
  await ensureSheetExists(sheets.recruitmentSheet || 'HumailEli_Recruitment', RECRUITMENT_HEADERS);
  await ensureSheetExists(sheets.successionSheet || 'HumailEli_Succession', SUCCESSION_HEADERS);
  await ensureSheetExists(sheets.onboardingTasksSheet || 'HumailEli_OnboardingTasks', ONBOARDING_TASK_HEADERS);
  await ensureSheetExists(sheets.orgChartSheet || 'HumailEli_Org_Chart', ORG_CHART_HEADERS);
  await ensureSheetExists(sheets.hiresSheet || 'HumailEli_Hires', HIRE_HEADERS);
  await ensureSheetExists(sheets.reviewTemplatesSheet || 'HumailEli_Review_Templates', PERFORMANCE_REVIEW_TEMPLATE_HEADERS);
  await ensureSheetExists(sheets.performanceReviewsSheet || 'HumailEli_Performance_Reviews', PERFORMANCE_REVIEWS_HEADERS);
  await ensureSheetExists(sheets.interviewScheduleSheet || 'HumailEli_Interview_Schedule', INTERVIEW_SCHEDULE_HEADERS);
  await ensureSheetExists(sheets.leavePoliciesSheet || 'HumailEli_Leave_Policies', LEAVE_POLICY_HEADERS);
  await ensureSheetExists(sheets.leaveTypeConfigsSheet || 'HumailEli_Leave_Type_Configs', LEAVE_TYPE_CONFIG_HEADERS);
  await ensureSheetExists(sheets.payslipsSheet || 'HumailEli_Payslips', PAYSLIP_HEADERS);
  await ensureSheetExists(sheets.notificationsSheet || 'HumailEli_Notifications', NOTIFICATION_HEADERS);
  await ensureSheetExists(sheets.shiftsSheet || 'HumailEli_Shifts', SHIFT_HEADERS);
  await ensureSheetExists(sheets.shiftAssignmentsSheet || 'HumailEli_Shift_Assignments', SHIFT_ASSIGNMENT_HEADERS);
  await ensureSheetExists(sheets.shiftSwapRequestsSheet || 'HumailEli_Shift_Swap_Requests', SHIFT_SWAP_REQUEST_HEADERS);
  await ensureSheetExists(sheets.shiftTemplatesSheet || 'HumailEli_Shift_Templates', SHIFT_TEMPLATE_HEADERS);
  await ensureSheetExists(sheets.currenciesSheet || 'HumailEli_Currencies', CURRENCY_HEADERS);
  await ensureSheetExists(sheets.taxRulesSheet || 'HumailEli_Tax_Rules', TAX_RULE_HEADERS);
  await ensureSheetExists(sheets.statutoryDeductionsSheet || 'HumailEli_Statutory_Deductions', STATUTORY_DEDUCTION_HEADERS);
  await ensureSheetExists(sheets.payrollCalculationsSheet || 'HumailEli_Payroll_Calculations', PAYROLL_CALCULATION_HEADERS);
  await ensureSheetExists(sheets.reviewCyclesSheet || 'HumailEli_Review_Cycles', PERFORMANCE_REVIEW_CYCLE_HEADERS);
  await ensureSheetExists(sheets.usersSheet || 'HumailEli_Users', USER_HEADERS);
  await ensureSheetExists(sheets.loginSessionsSheet || 'HumailEli_Login_Sessions', LOGIN_SESSION_HEADERS);
  await ensureSheetExists(sheets.passwordResetsSheet || 'HumailEli_Password_Resets', PASSWORD_RESET_HEADERS);
  await ensureSheetExists(sheets.departmentsSheet || 'HumailEli_Departments', DEPARTMENT_HEADERS);
  await ensureSheetExists(sheets.statusHistorySheet || 'HumailEli_Status_History', STATUS_HISTORY_HEADERS);
  await ensureSheetExists(sheets.designationsSheet || 'HumailEli_Designations', DESIGNATION_HEADERS);
  await ensureSheetExists(sheets.whatsappMessagesSheet || 'HumailEli_WhatsApp_Messages', WHATSAPP_MESSAGE_HEADERS);
  await ensureSheetExists(sheets.whatsappTemplatesSheet || 'HumailEli_WhatsApp_Templates', WHATSAPP_TEMPLATE_HEADERS);
  await ensureSheetExists(sheets.whatsappConversationsSheet || 'HumailEli_WhatsApp_Conversations', WHATSAPP_CONVERSATION_HEADERS);
  await ensureSheetExists('HumailEli_Exit_Records', EXIT_RECORDS_HEADERS);
  await ensureSheetExists('HumailEli_Salary_Structures', SALARY_STRUCTURE_HEADERS);
  await ensureSheetExists('HumailEli_Training_Modules', TRAINING_MODULE_HEADERS);
}

/**
 * Fetches employees from Google Sheets
 */
export async function fetchEmployeesFromGSheet(): Promise<Employee[]> {
  const settings = getSettings();
  try {
    const rows = await readSheet(settings.googleSheets.employeeSheet || 'HumailEli_Employees', 'A2:CZ');
    if (!rows || rows.length === 0) return [];
    return mapRowsSafe(rows, deserializeEmployee, 'employee');
  } catch (e) {
    logger.error('fetchEmployeesFromGSheet error:', e);
    throw e;
  }
}

/**
 * Syncs a single Employee back to Google Sheets (inserts or updates row)
 */
export async function syncEmployeeToGSheet(emp: Employee): Promise<void> {
  const rowIndex = await findRowById('HumailEli_Employees', emp.id);
  if (rowIndex !== -1) {
    await updateSheet('HumailEli_Employees', `A${rowIndex}:CZ${rowIndex}`, [serializeEmployee(emp)]);
    addSheetLog('HumailEli_Employees', 'UPDATE', { id: emp.id, name: emp.name });
  } else {
    await appendToSheet('HumailEli_Employees', [serializeEmployee(emp)]);
    addSheetLog('HumailEli_Employees', 'INSERT', { id: emp.id, name: emp.name });
  }
}

/**
 * Generic helper for incremental module synchronization with Google Sheets.
 */
export async function syncModuleIncremental<T extends { id: string; name?: string; employeeName?: string; updatedAt?: string; createdAt?: string }>(
  moduleName: string,
  sheetName: string,
  records: T[],
  serializer: (item: T) => any[],
  statusColumnIndex: number,
  forceOverwrite: boolean = false
): Promise<void> {
  try {
    const { new: newRecords, updated: updatedRecords, deleted: deletedIds } = getChangedRecords(records, moduleName);

    if (forceOverwrite) {
      // For force overwrite, we replace everything after headers
      const rows = records.map(serializer);
      // We need to know the headers. We'll try to read them or assume they are there.
      const currentHeaders = await readSheet(sheetName, '1:1');
      await updateSheet(sheetName, 'A1', [currentHeaders[0] || [], ...rows]);
      addSheetLog(sheetName, 'SYNC', { count: records.length, action: 'OVERWRITE' });
      updateSyncTracker(moduleName, records.length);
      savePreviousSyncIds(moduleName, records.map(r => r.id));
      return;
    }

    // If there are no changes, still log and update tracker timestamp
    if (newRecords.length === 0 && updatedRecords.length === 0 && deletedIds.length === 0) {
      addSheetLog(sheetName, 'SYNC', { count: records.length, status: 'No Change' });
      updateSyncTracker(moduleName, records.length);
      savePreviousSyncIds(moduleName, records.map(r => r.id));
      return;
    }

    // Fetch column A (IDs) to map IDs to row indices in GSheet
    const rows = await readSheet(sheetName, 'A:A');
    const idToRowIndex = new Map<string, number>();
    if (rows) {
      for (let i = 1; i < rows.length; i++) {
        if (rows[i] && rows[i][0]) {
          idToRowIndex.set(rows[i][0], i + 1); // 1-based index (A1 is row 1)
        }
      }
    }

    // 1. Process New Records: Append them
    if (newRecords.length > 0) {
      await appendToSheet(sheetName, newRecords.map(serializer));
      newRecords.forEach(rec => {
        addSheetLog(sheetName, 'INSERT', { id: rec.id, name: rec.name || rec.employeeName || '' });
      });
    }

    // 2. Process Updated Records: Update specific rows
    for (const rec of updatedRecords) {
      const rowIndex = idToRowIndex.get(rec.id);
      if (rowIndex) {
        const serialized = serializer(rec);
        const endCol = getColumnLetterFromZero(serialized.length - 1);
        await updateSheet(sheetName, `A${rowIndex}:${endCol}${rowIndex}`, [serialized]);
        addSheetLog(sheetName, 'UPDATE', { id: rec.id, name: rec.name || rec.employeeName || '' });
      } else {
        // Fallback: If not found in sheet, append it
        await appendToSheet(sheetName, [serializer(rec)]);
        addSheetLog(sheetName, 'INSERT', { id: rec.id, name: rec.name || rec.employeeName || '', fallback: true });
      }
    }

    // 3. Process Deleted Records: Mark as deleted in the sheet
    for (const id of deletedIds) {
      const rowIndex = idToRowIndex.get(id);
      if (rowIndex) {
        const statusColLetter = getColumnLetterFromZero(statusColumnIndex);
        await updateSheet(sheetName, `${statusColLetter}${rowIndex}:${statusColLetter}${rowIndex}`, [["Deleted"]]);
        addSheetLog(sheetName, 'DELETE', { id, markedDeleted: true });
      }
    }

    // 4. Update track logs, sync tracker and previous sync IDs
    addSheetLog(sheetName, 'SYNC', {
      added: newRecords.length,
      updated: updatedRecords.length,
      deleted: deletedIds.length,
      total: records.length
    });

    updateSyncTracker(moduleName, records.length);
    savePreviousSyncIds(moduleName, records.map(r => r.id));
  } catch (error) {
    logger.error(`syncModuleIncremental error for ${moduleName}:`, error);
    // Log the error but don't crash the app
    addSheetLog(sheetName, 'SYNC', { status: 'Error', message: String(error) });
  }
}

/**
 * Syncs the Employee array incrementally by updating existing rows or appending new ones.
 */
export async function syncAllEmployeesToGSheet(employees: Employee[], forceOverwrite: boolean = false): Promise<void> {
  const settings = getSettings();
  await syncModuleIncremental<Employee>(
    'employees',
    settings.googleSheets.employeeSheet || 'HumailEli_Employees',
    employees,
    serializeEmployee,
    8, // status column index in EMPLOYEE_HEADERS
    forceOverwrite
  );
}

/**
 * Fetches attendance from Google Sheets
 */
export async function fetchAttendanceFromGSheet(): Promise<AttendanceRecord[]> {
  const settings = getSettings();
  try {
    const rows = await readSheet(settings.googleSheets.attendanceSheet, 'A2:I');
    if (!rows || rows.length === 0) return [];
    return mapRowsSafe(rows, deserializeAttendance, 'attendance');
  } catch (e) {
    logger.error('fetchAttendanceFromGSheet error:', e);
    throw e;
  }
}

/**
 * Appends new attendance records to Google Sheets incrementally (avoiding duplicates and updating changes)
 */
export async function syncAttendanceToGSheet(records: AttendanceRecord[], forceOverwrite: boolean = false): Promise<void> {
  const settings = getSettings();
  await syncModuleIncremental<AttendanceRecord>(
    'attendance',
    settings.googleSheets.attendanceSheet,
    records,
    serializeAttendance,
    8, // status column index in ATTENDANCE_HEADERS
    forceOverwrite
  );
}

/**
 * Fetches payroll from Google Sheets
 */
export async function fetchPayrollFromGSheet(): Promise<PayrollRecord[]> {
  const settings = getSettings();
  try {
    const rows = await readSheet(settings.googleSheets.payrollSheet, 'A2:K');
    if (!rows || rows.length === 0) return [];
    return mapRowsSafe(rows, deserializePayroll, 'payroll');
  } catch (e) {
    logger.error('fetchPayrollFromGSheet error:', e);
    throw e;
  }
}

/**
 * Appends new payroll records to Google Sheets incrementally (avoiding duplicates and updating changes)
 */
export async function syncPayrollToGSheet(records: PayrollRecord[], forceOverwrite: boolean = false): Promise<void> {
  const settings = getSettings();
  await syncModuleIncremental<PayrollRecord>(
    'payroll',
    settings.googleSheets.payrollSheet,
    records,
    serializePayroll,
    9, // status column index in PAYROLL_HEADERS
    forceOverwrite
  );
}

/**
 * Fetches leaves from Google Sheets
 */
export async function fetchLeavesFromGSheet(): Promise<LeaveRecord[]> {
  const settings = getSettings();
  try {
    const rows = await readSheet(settings.googleSheets.leaveSheet, 'A2:J');
    if (!rows || rows.length === 0) return [];
    return mapRowsSafe(rows, deserializeLeave, 'leave');
  } catch (e) {
    logger.error('fetchLeavesFromGSheet error:', e);
    throw e;
  }
}

/**
 * Syncs a single Leave record (inserts if new, updates status if exists)
 */
export async function syncLeaveToGSheet(lv: LeaveRecord): Promise<void> {
  const settings = getSettings();
  const rowIndex = await findRowById(settings.googleSheets.leaveSheet, lv.id);
  if (rowIndex !== -1) {
    await updateSheet(settings.googleSheets.leaveSheet, `A${rowIndex}:J${rowIndex}`, [serializeLeave(lv)]);
    addSheetLog(settings.googleSheets.leaveSheet, 'UPDATE', { id: lv.id, employeeName: lv.employeeName, status: lv.status });
  } else {
    await appendToSheet(settings.googleSheets.leaveSheet, [serializeLeave(lv)]);
    addSheetLog(settings.googleSheets.leaveSheet, 'INSERT', { id: lv.id, employeeName: lv.employeeName, status: lv.status });
  }
}

/**
 * Syncs multiple leaves to Google Sheets incrementally (avoiding duplicates and updating changes)
 */
export async function syncAllLeavesToGSheet(records: LeaveRecord[], forceOverwrite: boolean = false): Promise<void> {
  const settings = getSettings();
  await syncModuleIncremental<LeaveRecord>(
    'leaves',
    settings.googleSheets.leaveSheet,
    records,
    serializeLeave,
    7, // status column index in LEAVES_HEADERS
    forceOverwrite
  );
}

export async function fetchEmployeeDocumentsFromGSheet(): Promise<EmployeeDocument[]> {
  const settings = getSettings();
  try {
    const rows = await readSheet(settings.googleSheets.documentsSheet || 'HumailEli_Employee_Documents', 'A2:W');
    if (!rows || rows.length === 0) return [];
    return mapRowsSafe(rows, deserializeEmployeeDocument, 'employeeDocument');
  } catch (e) {
    logger.error('fetchEmployeeDocumentsFromGSheet error:', e);
    throw e;
  }
}

export async function syncEmployeeDocumentToGSheet(doc: EmployeeDocument): Promise<void> {
  const settings = getSettings();
  const sheetName = settings.googleSheets.documentsSheet || 'HumailEli_Employee_Documents';
  const rowIndex = await findRowById(sheetName, doc.id);
  if (rowIndex !== -1) {
    await updateSheet(sheetName, `A${rowIndex}:W${rowIndex}`, [serializeEmployeeDocument(doc)]);
    addSheetLog(sheetName, 'UPDATE', { id: doc.id, fileName: doc.fileName });
  } else {
    await appendToSheet(sheetName, [serializeEmployeeDocument(doc)]);
    addSheetLog(sheetName, 'INSERT', { id: doc.id, fileName: doc.fileName });
  }
}

export async function syncAllEmployeeDocumentsToGSheet(records: EmployeeDocument[], forceOverwrite: boolean = false): Promise<void> {
  const settings = getSettings();
  const sheetName = settings.googleSheets.documentsSheet || 'HumailEli_Employee_Documents';
  if (forceOverwrite) {
    await updateSheet(sheetName, 'A1', [DOCUMENTS_HEADERS, ...records.map(serializeEmployeeDocument)]);
  } else {
    await syncModuleIncremental<EmployeeDocument>(
      'employee_documents',
      sheetName,
      records,
      serializeEmployeeDocument,
      22, // status column index
      forceOverwrite
    );
  }
  addSheetLog(sheetName, 'SYNC', { count: records.length });
}

// Biometric sync simulation
export const generateMockBiometricLogs = (employees: Employee[], dateStr: string): AttendanceRecord[] => {
  const currentAttendance = getAttendance();
  const settings = getSettings();
  const lateThreshold = settings.attendanceRules?.lateThreshold || "09:05";
  const earlyDepartureThreshold = settings.attendanceRules?.earlyDepartureThreshold || "17:55";

  // Parse thresholds to minutes
  const [lh, lm] = lateThreshold.split(':').map(Number);
  const lateThresholdMinutes = lh * 60 + lm;

  const [eh, em] = earlyDepartureThreshold.split(':').map(Number);
  const earlyThresholdMinutes = eh * 60 + em;

  const activeEmployees = employees.filter(e => e.status !== 'Terminated');
  const newRecords: AttendanceRecord[] = [];

  activeEmployees.forEach((emp, index) => {
    // Randomly determine the day's status
    const rand = Math.random();
    let checkIn = "";
    let checkOut = "";
    let status: 'Full Day' | 'Half Day' | 'Absent' = "Full Day";
    let lateMinutes = 0;
    let earlyDepartureMinutes = 0;

    if (rand < 0.1) {
      // 10% chance: Absent
      status = "Absent";
      checkIn = "";
      checkOut = "";
    } else if (rand < 0.25) {
      // 15% chance: Late arrival
      const lateMins = 6 + Math.floor(Math.random() * 45); // 6 to 50 minutes late
      lateMinutes = lateMins;
      const totalInMinutes = lateThresholdMinutes + lateMins;
      const hours = Math.floor(totalInMinutes / 60);
      const mins = totalInMinutes % 60;
      checkIn = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
      // Normal check‑out
      const outHours = 17 + Math.floor(Math.random() * 2); // 5-6 PM
      const outMins = Math.floor(Math.random() * 60);
      checkOut = `${outHours.toString().padStart(2, '0')}:${outMins.toString().padStart(2, '0')}`;
      status = "Full Day";
    } else if (rand < 0.35) {
      // 10% chance: Early departure
      const earlyMins = 10 + Math.floor(Math.random() * 120); // 10 to 130 minutes early
      earlyDepartureMinutes = earlyMins;
      const totalMinutesOut = earlyThresholdMinutes - earlyMins;
      const hours = Math.floor(totalMinutesOut / 60);
      const mins = totalMinutesOut % 60;
      checkOut = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
      // Normal check‑in
      const inHours = 8 + Math.floor(Math.random() * 2); // 8-9 AM
      const inMins = Math.floor(Math.random() * 60);
      checkIn = `${inHours.toString().padStart(2, '0')}:${inMins.toString().padStart(2, '0')}`;
      status = "Full Day";
    } else if (rand < 0.45) {
      // 10% chance: Half Day (morning shift)
      checkIn = "08:30";
      checkOut = "13:00";
      status = "Half Day";
      // Calculate late minutes if check-in is after threshold
      const [inH, inM] = checkIn.split(':').map(Number);
      const checkInMinutes = inH * 60 + inM;
      if (checkInMinutes > lateThresholdMinutes) {
        lateMinutes = checkInMinutes - lateThresholdMinutes;
      } else {
        lateMinutes = 0;
      }
      // Calculate early departure
      const [outH, outM] = checkOut.split(':').map(Number);
      const checkOutMinutes = outH * 60 + outM;
      if (checkOutMinutes < earlyThresholdMinutes) {
        earlyDepartureMinutes = earlyThresholdMinutes - checkOutMinutes;
      } else {
        earlyDepartureMinutes = 0;
      }
    } else {
      // 55% chance: Normal Full Day
      const inH = 8 + Math.floor(Math.random() * 2);
      const inM = Math.floor(Math.random() * 60);
      const outH = 17 + Math.floor(Math.random() * 2);
      const outM = Math.floor(Math.random() * 60);
      checkIn = `${inH.toString().padStart(2, '0')}:${inM.toString().padStart(2, '0')}`;
      checkOut = `${outH.toString().padStart(2, '0')}:${outM.toString().padStart(2, '0')}`;
      status = "Full Day";
      // Calculate late minutes
      const [inHh, inMm] = checkIn.split(':').map(Number);
      const checkInMinutes = inHh * 60 + inMm;
      if (checkInMinutes > lateThresholdMinutes) {
        lateMinutes = checkInMinutes - lateThresholdMinutes;
      }
      // Calculate early departure
      const [outHh, outMm] = checkOut.split(':').map(Number);
      const checkOutMinutes = outHh * 60 + outMm;
      if (checkOutMinutes < earlyThresholdMinutes) {
        earlyDepartureMinutes = earlyThresholdMinutes - checkOutMinutes;
      }
    }

    // Ensure we have check-in/out for records that are not Absent
    if (status !== 'Absent' && (!checkIn || !checkOut)) {
      // Fallback to reasonable defaults
      if (!checkIn) checkIn = "08:30";
      if (!checkOut) checkOut = "17:30";
      status = "Full Day";
    }

    newRecords.push({
      id: `ATT-M${Date.now().toString().slice(-4)}${index}`,
      employeeId: emp.id,
      employeeName: emp.name,
      date: dateStr,
      checkIn,
      checkOut,
      lateMinutes,
      earlyDepartureMinutes,
      status: status as 'Full Day' | 'Half Day' | 'Absent'
    });
  });

  return newRecords;
};

/**
 * Migration helper to sync all local storage data into Google Sheets
 */
export async function syncExitRecordsToGSheet(records: ExitRecord[], forceOverwrite: boolean = false): Promise<void> {
  await syncModuleIncremental<ExitRecord>(
    'exit_records',
    'HumailEli_Exit_Records',
    records,
    serializeExitRecord,
    6, // status column index
    forceOverwrite
  );
}

export async function syncSalaryStructuresToGSheet(records: SalaryStructure[], forceOverwrite: boolean = false): Promise<void> {
  await syncModuleIncremental<SalaryStructure>(
    'salary_structures',
    'HumailEli_Salary_Structures',
    records,
    serializeSalaryStructure,
    11, // isActive column index
    forceOverwrite
  );
}

export async function syncTrainingModulesToGSheet(records: TrainingModule[], forceOverwrite: boolean = false): Promise<void> {
  await syncModuleIncremental<TrainingModule>(
    'training_modules',
    'HumailEli_Training_Modules',
    records,
    serializeTrainingModule,
    0, // No status column for modules
    forceOverwrite
  );
}

export async function migrateLocalDataToGSheets(): Promise<void> {
  // 1. Ensure sheets and headers exist
  await initializeSpreadsheetSheets();

  // 2. Fetch all local records
  const localEmployees = getEmployees();
  const localAttendance = getAttendance();
  const localPayroll = getPayroll();
  const localLeaves = getLeaves();
  const localCandidates = getCandidates();
  const localSuccession = getSuccessionPlans();
  const localOnboarding = getOnboardingTasks();
  const localOrgChart = getOrgChartNodes();
  const localDepartments = getDepartments();
  const localDesignations = getDesignations();
  const localExit = getExitRecords();
  const localSalary = getSalaryStructures();
  const localTraining = getTrainingModules();

  // 3. Write them to sheets - forcing overwrite during migration to ensure clean state
  await syncAllEmployeesToGSheet(localEmployees, true);
  await syncAttendanceToGSheet(localAttendance, true);
  await syncPayrollToGSheet(localPayroll, true);
  await syncAllLeavesToGSheet(localLeaves, true);
  await syncAllCandidatesToGSheet(localCandidates, true);
  await syncAllSuccessionPlansToGSheet(localSuccession, true);
  await syncAllOnboardingTasksToGSheet(localOnboarding, true);
  await syncAllOrgChartToGSheet(localOrgChart, true);
  await syncAllDepartmentsToGSheet(localDepartments, true);
  await syncAllDesignationsToGSheet(localDesignations, true);
  
  await syncExitRecordsToGSheet(localExit, true);
  await syncSalaryStructuresToGSheet(localSalary, true);
  await syncTrainingModulesToGSheet(localTraining, true);
}


/**
 * Fetches candidates from Google Sheets
 */
export async function fetchCandidatesFromGSheet(): Promise<Candidate[]> {
  try {
    const rows = await readSheet('HumailEli_Recruitment', 'A2:O');
    if (!rows || rows.length === 0) return [];
    return mapRowsSafe(rows, deserializeCandidate, 'candidate');
  } catch (e) {
    logger.error('fetchCandidatesFromGSheet error:', e);
    throw e;
  }
}

/**
 * Syncs a single Candidate record
 */
export async function syncCandidateToGSheet(cand: Candidate): Promise<void> {
  const settings = getSettings();
  const sheetName = settings.googleSheets.recruitmentSheet || 'HumailEli_Recruitment';
  const rowIndex = await findRowById(sheetName, cand.id);
  if (rowIndex !== -1) {
    await updateSheet(sheetName, `A${rowIndex}:O${rowIndex}`, [serializeCandidate(cand)]);
    addSheetLog(sheetName, 'UPDATE', { id: cand.id, name: cand.name, status: cand.status });
  } else {
    await appendToSheet(sheetName, [serializeCandidate(cand)]);
    addSheetLog(sheetName, 'INSERT', { id: cand.id, name: cand.name, status: cand.status });
  }
}

/**
 * Syncs multiple Candidates incrementally (avoiding duplicates and updating changes)
 */
export async function syncAllCandidatesToGSheet(candidates: Candidate[], forceOverwrite: boolean = false): Promise<void> {
  const settings = getSettings();
  const sheetName = settings.googleSheets.recruitmentSheet || 'HumailEli_Recruitment';
  await syncModuleIncremental<Candidate>(
    'recruitment',
    sheetName,
    candidates,
    serializeCandidate,
    7, // status column index in RECRUITMENT_HEADERS
    forceOverwrite
  );
}

/**
 * Fetches succession plans from Google Sheets
 */
export async function fetchSuccessionPlansFromGSheet(): Promise<SuccessionPlan[]> {
  try {
    const rows = await readSheet('HumailEli_Succession', 'A2:J');
    if (!rows || rows.length === 0) return [];
    return mapRowsSafe(rows, deserializeSuccession, 'succession');
  } catch (e) {
    logger.error('fetchSuccessionPlansFromGSheet error:', e);
    throw e;
  }
}

/**
 * Syncs a single Succession Plan
 */
export async function syncSuccessionPlanToGSheet(plan: SuccessionPlan): Promise<void> {
  const settings = getSettings();
  const sheetName = settings.googleSheets.successionSheet || 'HumailEli_Succession';
  const rowIndex = await findRowById(sheetName, plan.id);
  if (rowIndex !== -1) {
    await updateSheet(sheetName, `A${rowIndex}:J${rowIndex}`, [serializeSuccession(plan)]);
    addSheetLog(sheetName, 'UPDATE', { id: plan.id, roleName: plan.roleName });
  } else {
    await appendToSheet(sheetName, [serializeSuccession(plan)]);
    addSheetLog(sheetName, 'INSERT', { id: plan.id, roleName: plan.roleName });
  }
}

/**
 * Syncs all Succession Plans
 */
export async function syncAllSuccessionPlansToGSheet(plans: SuccessionPlan[], forceOverwrite: boolean = false): Promise<void> {
  const settings = getSettings();
  const sheetName = settings.googleSheets.successionSheet || 'HumailEli_Succession';
  if (forceOverwrite) {
    await updateSheet(sheetName, 'A1', [SUCCESSION_HEADERS, ...plans.map(serializeSuccession)]);
  } else {
    await syncModuleIncremental<SuccessionPlan>(
      'succession',
      sheetName,
      plans,
      serializeSuccession,
      0, // No status column
      forceOverwrite
    );
  }
  addSheetLog(sheetName, 'SYNC', { count: plans.length });
}

/**
 * Fetches onboarding tasks from Google Sheets
 */
export async function fetchOnboardingTasksFromGSheet(): Promise<LegacyOnboardingTask[]> {
  try {
    const rows = await readSheet('HumailEli_OnboardingTasks', 'A2:H');
    if (!rows || rows.length === 0) return [];
    return mapRowsSafe(rows, deserializeOnboardingTask, 'onboardingTask');
  } catch (e) {
    logger.error('fetchOnboardingTasksFromGSheet error:', e);
    throw e;
  }
}

/**
 * Syncs a single Onboarding Task
 */
export async function syncOnboardingTaskToGSheet(task: LegacyOnboardingTask): Promise<void> {
  const settings = getSettings();
  const sheetName = settings.googleSheets.onboardingTasksSheet || 'HumailEli_OnboardingTasks';
  const rowIndex = await findRowById(sheetName, task.id);
  if (rowIndex !== -1) {
    await updateSheet(sheetName, `A${rowIndex}:H${rowIndex}`, [serializeOnboardingTask(task)]);
    addSheetLog(sheetName, 'UPDATE', { id: task.id, employeeName: task.employeeName, taskName: task.taskName });
  } else {
    await appendToSheet(sheetName, [serializeOnboardingTask(task)]);
    addSheetLog(sheetName, 'INSERT', { id: task.id, employeeName: task.employeeName, taskName: task.taskName });
  }
}

/**
 * Syncs all Onboarding Tasks
 */
export async function syncAllOnboardingTasksToGSheet(tasks: LegacyOnboardingTask[], forceOverwrite: boolean = false): Promise<void> {
  const settings = getSettings();
  const sheetName = settings.googleSheets.onboardingTasksSheet || 'HumailEli_OnboardingTasks';
  if (forceOverwrite) {
    await updateSheet(sheetName, 'A1', [ONBOARDING_TASK_HEADERS, ...tasks.map(serializeOnboardingTask)]);
  } else {
    await syncModuleIncremental<LegacyOnboardingTask>(
      'onboarding_tasks',
      sheetName,
      tasks,
      serializeOnboardingTask,
      7, // completed column index
      forceOverwrite
    );
  }
  addSheetLog(sheetName, 'SYNC', { count: tasks.length });
}

/**
 * Fetches Org Chart Nodes from Google Sheets
 */
export async function fetchOrgChartFromGSheet(): Promise<OrgChartNode[]> {
  try {
    const rows = await readSheet('HumailEli_Org_Chart', 'A2:H');
    if (!rows || rows.length === 0) return [];
    const nodes = rows.map(deserializeOrgChart);
    return nodes.map(node => ({
      ...node,
      children: nodes.filter(n => n.parentId === node.id).map(n => n.id)
    }));
  } catch (e) {
    logger.error('fetchOrgChartFromGSheet error:', e);
    throw e;
  }
}

/**
 * Syncs a single Org Chart Node
 */
export async function syncOrgChartNodeToGSheet(node: OrgChartNode): Promise<void> {
  const settings = getSettings();
  const sheetName = settings.googleSheets.orgChartSheet || 'HumailEli_Org_Chart';
  const rowIndex = await findRowById(sheetName, node.id);
  if (rowIndex !== -1) {
    await updateSheet(sheetName, `A${rowIndex}:H${rowIndex}`, [serializeOrgChart(node)]);
    addSheetLog(sheetName, 'UPDATE', { id: node.id, positionName: node.positionName });
  } else {
    await appendToSheet(sheetName, [serializeOrgChart(node)]);
    addSheetLog(sheetName, 'INSERT', { id: node.id, positionName: node.positionName });
  }
}

/**
 * Syncs all Org Chart Nodes
 */
export async function syncAllOrgChartToGSheet(nodes: OrgChartNode[], forceOverwrite: boolean = false): Promise<void> {
  const settings = getSettings();
  const sheetName = settings.googleSheets.orgChartSheet || 'HumailEli_Org_Chart';
  if (forceOverwrite) {
    await updateSheet(sheetName, 'A1', [ORG_CHART_HEADERS, ...nodes.map(serializeOrgChart)]);
  } else {
    await syncModuleIncremental<OrgChartNode>(
      'org_chart',
      sheetName,
      nodes,
      serializeOrgChart,
      0, // No status column
      forceOverwrite
    );
  }
  addSheetLog(sheetName, 'SYNC', { count: nodes.length });
}

// ===== DEPARTMENT SERIALIZERS & SYNC =====

export function serializeDepartment(dept: Department): any[] {
  return [
    dept.id || "",
    dept.name || "",
    dept.code || "",
    dept.description || "",
    dept.headId || "",
    dept.headName || "",
    dept.parentDepartmentId || "",
    dept.location || "",
    dept.budget || 0,
    dept.costCenter || "",
    dept.employeeCount || 0,
    dept.isActive ? "TRUE" : "FALSE",
    dept.createdAt || "",
    dept.updatedAt || ""
  ];
}

export function deserializeDepartment(row: any[]): Department {
  const getBool = (val: any) => String(val).toUpperCase() === 'TRUE';
  const data = parseRow(row, DEPARTMENT_HEADERS);
  return {
    id: data.id || "",
    name: data.name || "",
    code: data.code || "",
    description: data.description || "",
    headId: data.headId || undefined,
    headName: data.headName || undefined,
    parentDepartmentId: data.parentDepartmentId || undefined,
    location: data.location || undefined,
    budget: data.budget ? Number(data.budget) : undefined,
    costCenter: data.costCenter || undefined,
    employeeCount: Number(data.employeeCount) || 0,
    isActive: data.isActive !== undefined ? getBool(data.isActive) : true,
    createdAt: data.createdAt || "",
    updatedAt: data.updatedAt || ""
  };
}


export const serializeStatusHistory = (sh: EmployeeStatusHistory): string[] => [
  sh.id,
  sh.employeeId,
  sh.employeeName,
  sh.oldStatus,
  sh.newStatus,
  sh.changedBy,
  sh.changedByName,
  sh.changedAt,
  sh.reason,
  sh.notes
];

export const deserializeStatusHistory = (row: string[]): EmployeeStatusHistory => ({
  id: row[0] || '',
  employeeId: row[1] || '',
  employeeName: row[2] || '',
  oldStatus: row[3] || '',
  newStatus: row[4] || '',
  changedBy: row[5] || '',
  changedByName: row[6] || '',
  changedAt: row[7] || '',
  reason: row[8] || '',
  notes: row[9] || ''
});

export async function fetchStatusHistoryFromGSheet(): Promise<EmployeeStatusHistory[]> {
  try {
    const rows = await readSheet('HumailEli_Status_History', 'A2:J');
    if (!rows || rows.length === 0) return [];
    return mapRowsSafe(rows, deserializeStatusHistory, 'statusHistory');
  } catch (e) {
    logger.error('fetchStatusHistoryFromGSheet error:', e);
    return [];
  }
}

export async function syncStatusHistoryToGSheet(sh: EmployeeStatusHistory): Promise<void> {
  const rowIndex = await findRowById('HumailEli_Status_History', sh.id);
  if (rowIndex !== -1) {
    await updateSheet('HumailEli_Status_History', `A${rowIndex}:J${rowIndex}`, [serializeStatusHistory(sh)]);
  } else {
    await appendToSheet('HumailEli_Status_History', [serializeStatusHistory(sh)]);
  }
}

export async function syncAllStatusHistoryToGSheet(records: EmployeeStatusHistory[]): Promise<void> {
  await updateSheet('HumailEli_Status_History', 'A1', [STATUS_HISTORY_HEADERS, ...records.map(serializeStatusHistory)]);
}


export async function fetchDepartmentsFromGSheet(): Promise<Department[]> {
  try {
    const rows = await readSheet('HumailEli_Departments', 'A2:N');
    if (!rows || rows.length === 0) return [];
    return mapRowsSafe(rows, deserializeDepartment, 'department');
  } catch (e) {
    logger.error('fetchDepartmentsFromGSheet error:', e);
    throw e;
  }
}

export async function syncDepartmentToGSheet(dept: Department): Promise<void> {
  const settings = getSettings();
  const sheetName = settings.googleSheets.departmentsSheet || 'HumailEli_Departments';
  const rowIndex = await findRowById(sheetName, dept.id);
  if (rowIndex !== -1) {
    await updateSheet(sheetName, `A${rowIndex}:N${rowIndex}`, [serializeDepartment(dept)]);
    addSheetLog(sheetName, 'UPDATE', { id: dept.id, name: dept.name });
  } else {
    await appendToSheet(sheetName, [serializeDepartment(dept)]);
    addSheetLog(sheetName, 'INSERT', { id: dept.id, name: dept.name });
  }
}

export async function syncAllDepartmentsToGSheet(depts: Department[], forceOverwrite: boolean = false): Promise<void> {
  const settings = getSettings();
  const sheetName = settings.googleSheets.departmentsSheet || 'HumailEli_Departments';
  if (forceOverwrite) {
    await updateSheet(sheetName, 'A1', [DEPARTMENT_HEADERS, ...depts.map(serializeDepartment)]);
  } else {
    await syncModuleIncremental<Department>(
      'departments',
      sheetName,
      depts,
      serializeDepartment,
      11, // isActive column index
      forceOverwrite
    );
  }
  addSheetLog(sheetName, 'SYNC', { count: depts.length });
}

// ===== DESIGNATION SERIALIZERS & SYNC =====

export function serializeDesignation(dsg: Designation): any[] {
  return [
    dsg.id || "",
    dsg.name || "",
    dsg.code || "",
    dsg.description || "",
    dsg.departmentId || "",
    dsg.level || 1,
    dsg.category || "Staff",
    dsg.reportingToDesignationId || "",
    dsg.minSalary || 0,
    dsg.maxSalary || 0,
    dsg.isActive ? "TRUE" : "FALSE",
    dsg.createdAt || "",
    dsg.updatedAt || ""
  ];
}

export function deserializeDesignation(row: any[]): Designation {
  const getBool = (val: any) => String(val).toUpperCase() === 'TRUE';
  const data = parseRow(row, DESIGNATION_HEADERS);
  return {
    id: data.id || "",
    name: data.name || "",
    code: data.code || "",
    description: data.description || "",
    departmentId: data.departmentId || undefined,
    level: Number(data.level) || 1,
    category: (data.category as any) || "Staff",
    reportingToDesignationId: data.reportingToDesignationId || undefined,
    minSalary: data.minSalary ? Number(data.minSalary) : undefined,
    maxSalary: data.maxSalary ? Number(data.maxSalary) : undefined,
    isActive: data.isActive !== undefined ? getBool(data.isActive) : true,
    createdAt: data.createdAt || "",
    updatedAt: data.updatedAt || ""
  };
}

export async function fetchDesignationsFromGSheet(): Promise<Designation[]> {
  try {
    const rows = await readSheet('HumailEli_Designations', 'A2:M');
    if (!rows || rows.length === 0) return [];
    return mapRowsSafe(rows, deserializeDesignation, 'designation');
  } catch (e) {
    logger.error('fetchDesignationsFromGSheet error:', e);
    throw e;
  }
}

export async function syncDesignationToGSheet(dsg: Designation): Promise<void> {
  const settings = getSettings();
  const sheetName = settings.googleSheets.designationsSheet || 'HumailEli_Designations';
  const rowIndex = await findRowById(sheetName, dsg.id);
  if (rowIndex !== -1) {
    await updateSheet(sheetName, `A${rowIndex}:M${rowIndex}`, [serializeDesignation(dsg)]);
    addSheetLog(sheetName, 'UPDATE', { id: dsg.id, name: dsg.name });
  } else {
    await appendToSheet(sheetName, [serializeDesignation(dsg)]);
    addSheetLog(sheetName, 'INSERT', { id: dsg.id, name: dsg.name });
  }
}

export async function syncAllDesignationsToGSheet(dsgs: Designation[], forceOverwrite: boolean = false): Promise<void> {
  const settings = getSettings();
  const sheetName = settings.googleSheets.designationsSheet || 'HumailEli_Designations';
  if (forceOverwrite) {
    await updateSheet(sheetName, 'A1', [DESIGNATION_HEADERS, ...dsgs.map(serializeDesignation)]);
  } else {
    await syncModuleIncremental<Designation>(
      'designations',
      sheetName,
      dsgs,
      serializeDesignation,
      10, // isActive column index
      forceOverwrite
    );
  }
  addSheetLog(sheetName, 'SYNC', { count: dsgs.length });
}





export const generateEmployeeDiff = (
  oldEmp: Employee | null,
  newEmp: Employee,
  changedBy: string = 'currentUser',
  changedByName: string = 'Current User',
  changeType: 'CREATE' | 'UPDATE' | 'DELETE' | 'BULK_UPDATE' = 'UPDATE',
  source: 'MANUAL' | 'TRANSITION' | 'BULK_IMPORT' | 'SYSTEM_AUTO' | 'API' = 'MANUAL',
  reason: string = '',
  notes: string = ''
): EmployeeHistoryEntry[] => {
  const entries: EmployeeHistoryEntry[] = [];
  const settings = getSettings();
  if (settings.auditTrailRules && !settings.auditTrailRules.enableAuditTrail) return [];
  
  if (!oldEmp && changeType === 'CREATE') {
    entries.push({
      id: `HST-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      employeeId: newEmp.id,
      employeeName: newEmp.name,
      fieldName: 'all',
      fieldLabel: 'Employee Record Created',
      oldValue: '',
      newValue: 'Created',
      changedBy,
      changedByName,
      changedAt: new Date().toISOString(),
      reason,
      notes,
      changeType,
      source
    });
    return entries;
  }
  
  if (oldEmp) {
    const fieldsToTrack = [
      { key: 'name', label: 'Name' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' },
      { key: 'role', label: 'Role/Designation' },
      { key: 'department', label: 'Department' },
      { key: 'status', label: 'Status' },
      { key: 'joiningDate', label: 'Joining Date' },
      { key: 'salary', label: 'Base Salary' },
      { key: 'managerId', label: 'Reporting Manager ID' },
      { key: 'managerName', label: 'Reporting Manager Name' },
      { key: 'workLocation', label: 'Work Location' },
      { key: 'employmentType', label: 'Employment Type' },
      { key: 'cnic', label: 'CNIC' },
      { key: 'dob', label: 'Date of Birth' },
      { key: 'gender', label: 'Gender' },
      { key: 'maritalStatus', label: 'Marital Status' },
      { key: 'currentAddress', label: 'Current Address' },
      { key: 'city', label: 'City' },
      { key: 'country', label: 'Country' }
    ];
    
    fieldsToTrack.forEach(field => {
      const oldVal = (oldEmp as any)[field.key];
      const newVal = (newEmp as any)[field.key];
      
      if (oldVal !== newVal) {
        entries.push({
          id: `HST-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          employeeId: newEmp.id,
          employeeName: newEmp.name,
          fieldName: field.key,
          fieldLabel: field.label,
          oldValue: String(oldVal || ''),
          newValue: String(newVal || ''),
          changedBy,
          changedByName,
          changedAt: new Date().toISOString(),
          reason,
          notes,
          changeType,
          source
        });
      }
    });
  }
  
  return entries;
};

export function serializeSalaryStructure(s: SalaryStructure): any[] {
  return [
    s.id, s.employeeId, JSON.stringify(s.components), s.totalMonthly, s.totalAnnual, s.ctc,
    JSON.stringify(s.employerContributions), s.payGradeId || "", s.currency, s.effectiveFrom,
    s.effectiveTo || "", s.isActive ? "TRUE" : "FALSE", s.createdAt, s.updatedAt
  ];
}

export function deserializeSalaryStructure(row: any[]): SalaryStructure {
  const data = parseRow(row, SALARY_STRUCTURE_HEADERS);
  return {
    id: data.id || "",
    employeeId: data.employeeId || "",
    components: parseJson(data.components, []),
    totalMonthly: Number(data.totalMonthly) || 0,
    totalAnnual: Number(data.totalAnnual) || 0,
    ctc: Number(data.ctc) || 0,
    employerContributions: parseJson(data.employerContributions, {}),
    payGradeId: data.payGradeId || undefined,
    currency: data.currency || "USD",
    effectiveFrom: data.effectiveFrom || "",
    effectiveTo: data.effectiveTo || undefined,
    isActive: String(data.isActive).toUpperCase() === "TRUE",
    createdAt: data.createdAt || "",
    updatedAt: data.updatedAt || ""
  };
}

export function serializeExitRecord(r: ExitRecord): any[] {
  return [
    r.id, r.employeeId, r.employeeName, r.initiatedBy, r.initiatedByName, r.initiatedAt, r.status,
    r.checklistTemplateId || "", JSON.stringify(r.checklistItems || []), r.interviewTemplateId || "",
    JSON.stringify(r.interviewResponses || []), JSON.stringify(r.settlement || {}), r.resignationDate || "",
    r.lastWorkingDate || "", r.reason || "", r.notes || "", r.completedAt || "", r.updatedAt || ""
  ];
}

export function deserializeExitRecord(row: any[]): ExitRecord {
  const data = parseRow(row, EXIT_RECORDS_HEADERS);
  return {
    id: data.id || "",
    employeeId: data.employeeId || "",
    employeeName: data.employeeName || "",
    initiatedBy: data.initiatedBy || "",
    initiatedByName: data.initiatedByName || "",
    initiatedAt: data.initiatedAt || "",
    status: (data.status as any) || "Initiated",
    checklistTemplateId: data.checklistTemplateId || undefined,
    checklistItems: parseJson(data.checklistItemsJson, []),
    interviewTemplateId: data.interviewTemplateId || undefined,
    interviewResponses: parseJson(data.interviewResponsesJson, []),
    settlement: parseJson(data.settlementJson, {}),
    resignationDate: data.resignationDate || undefined,
    lastWorkingDate: data.lastWorkingDate || undefined,
    reason: data.reason || undefined,
    notes: data.notes || undefined,
    completedAt: data.completedAt || undefined,
    createdAt: data.updatedAt || "",
    updatedAt: data.updatedAt || ""
  };
}

export function serializeTrainingModule(m: TrainingModule): any[] {
  return [
    m.id, m.title, m.description, m.contentType, m.contentUrl || "", m.textContent || "",
    m.expectedDurationMinutes, m.isMentorVerificationRequired ? "TRUE" : "FALSE",
    m.isAutoCompleteAllowed ? "TRUE" : "FALSE", m.passFailThreshold, m.createdBy, m.createdAt, m.updatedAt || ""
  ];
}

export function deserializeTrainingModule(row: any[]): TrainingModule {
  const data = parseRow(row, TRAINING_MODULE_HEADERS);
  return {
    id: data.id || "",
    title: data.title || "",
    description: data.description || "",
    contentType: (data.contentType as any) || "Video",
    contentUrl: data.contentUrl || undefined,
    textContent: data.textContent || undefined,
    expectedDurationMinutes: Number(data.expectedDurationMinutes) || 0,
    isMentorVerificationRequired: String(data.isMentorVerificationRequired).toUpperCase() === "TRUE",
    isAutoCompleteAllowed: String(data.isAutoCompleteAllowed).toUpperCase() === "TRUE",
    passFailThreshold: Number(data.passFailThreshold) || 0,
    createdBy: data.createdBy || "",
    createdAt: data.createdAt || "",
    updatedAt: data.updatedAt || ""
  };
}
export const SCORECARDS_HEADERS = ['id', 'candidateId', 'jobId', 'stageId', 'interviewerId', 'interviewerName', 'scores', 'dimensionScores', 'overallScore', 'recommendation', 'comments', 'submittedAt', 'submittedBy'];
export const INTERVIEW_PANELS_HEADERS = ['id', 'candidateId', 'jobId', 'stageId', 'interviewers', 'scheduledDate', 'scheduledTime', 'status', 'meetingLink', 'notes'];

export const getStageTemplates = (): StageTemplate[] => loadData<StageTemplate[]>('stage_templates', INITIAL_STAGE_TEMPLATES);
export const saveStageTemplates = (data: StageTemplate[]) => saveData<StageTemplate[]>('stage_templates', data);

export const getScorecards = (): EvaluationScorecard[] => loadData<EvaluationScorecard[]>('evaluation_scorecards', INITIAL_SCORECARDS);
export const saveScorecards = (data: EvaluationScorecard[]) => saveData<EvaluationScorecard[]>('evaluation_scorecards', data);

export const getInterviewPanels = (): InterviewPanel[] => loadData<InterviewPanel[]>('interview_panels', INITIAL_INTERVIEW_PANELS);
export const saveInterviewPanels = (data: InterviewPanel[]) => saveData<InterviewPanel[]>('interview_panels', data);

export const PERFORMANCE_REVIEWS_HEADERS = ['id', 'employeeId', 'employeeName', 'reviewerId', 'reviewerName', 'reviewerType', 'reviewCycleId', 'reviewCycleName', 'sectionScores', 'questionScores', 'overallScore', 'weightedOverallScore', 'strengths', 'areasForImprovement', 'goals', 'recommendation', 'additionalComments', 'status', 'submittedAt', 'acknowledgedAt', 'createdAt', 'updatedAt'];


export const getTrainingModules = (): TrainingModule[] => loadData<TrainingModule[]>('training_modules', []);
export const saveTrainingModules = (data: TrainingModule[]) => saveData<TrainingModule[]>('training_modules', data);

export const getTrainingSubmissions = (): TrainingSubmission[] => loadData<TrainingSubmission[]>('training_submissions', []);
export const saveTrainingSubmissions = (data: TrainingSubmission[]) => saveData<TrainingSubmission[]>('training_submissions', data);

export const getExitChecklistTemplates = (): ExitChecklistTemplate[] => loadData<ExitChecklistTemplate[]>('exit_checklist_templates', []);
export const saveExitChecklistTemplates = (data: ExitChecklistTemplate[]) => saveData<ExitChecklistTemplate[]>('exit_checklist_templates', data);

export const getExitInterviewTemplates = (): ExitInterviewTemplate[] => loadData<ExitInterviewTemplate[]>('exit_interview_templates', []);
export const saveExitInterviewTemplates = (data: ExitInterviewTemplate[]) => saveData<ExitInterviewTemplate[]>('exit_interview_templates', data);

export const getExitProcessStages = (): ExitProcessStage[] => loadData<ExitProcessStage[]>('exit_process_stages', []);
export const saveExitProcessStages = (data: ExitProcessStage[]) => saveData<ExitProcessStage[]>('exit_process_stages', data);

export const getSettlementConfig = (): SettlementConfig | null => loadData<SettlementConfig | null>('settlement_config', null);
export const saveSettlementConfig = (data: SettlementConfig) => saveData<SettlementConfig>('settlement_config', data);

export const getPerformanceReviews = (): PerformanceReview[] => loadData<PerformanceReview[]>('performance_reviews', []);
export const savePerformanceReviews = (data: PerformanceReview[]) => {
  saveData('performance_reviews', data);
  if (!getSettings().isMockMode) {
    const rows = data.map(r => [
      r.id, r.employeeId, r.employeeName, r.reviewerId, r.reviewerName, r.reviewerType,
      r.reviewCycleId, r.reviewCycleName,
      JSON.stringify(r.sectionScores || []),
      JSON.stringify(r.questionScores || []),
      r.overallScore || 0, r.weightedOverallScore || 0,
      JSON.stringify(r.strengths || []),
      JSON.stringify(r.areasForImprovement || []),
      JSON.stringify(r.goals || []),
      r.recommendation || '', r.additionalComments || '',
      r.status, r.submittedAt || '', r.acknowledgedAt || '', r.createdAt, r.updatedAt
    ]);
    void updateSheet('HumailEli_Performance_Reviews', 'A1', [PERFORMANCE_REVIEW_HEADERS, ...rows]);
  }
};

export const getRecruitmentAnalytics = (): RecruitmentAnalytics[] => loadData<RecruitmentAnalytics[]>('recruitment_analytics', []);
export const saveRecruitmentAnalytics = (data: RecruitmentAnalytics[]) => saveData<RecruitmentAnalytics[]>('recruitment_analytics', data);

// Training Requests
export const getTrainingRequests = (): TrainingRequest[] => loadData<TrainingRequest[]>('training_requests', []);
export const saveTrainingRequests = (data: TrainingRequest[]) => saveData('training_requests', data);

// Training Mentorships
export const getTrainingMentorships = (): TrainingMentorship[] => loadData<TrainingMentorship[]>('training_mentorships', []);
export const saveTrainingMentorships = (data: TrainingMentorship[]) => saveData('training_mentorships', data);

// Training Check-ins
export const getTrainingCheckIns = (): TrainingCheckIn[] => loadData<TrainingCheckIn[]>('training_checkins', []);
export const saveTrainingCheckIns = (data: TrainingCheckIn[]) => saveData('training_checkins', data);

// Training Messages
export const getTrainingMessages = (): TrainingMessage[] => loadData<TrainingMessage[]>('training_messages', []);
export const saveTrainingMessages = (data: TrainingMessage[]) => saveData('training_messages', data);

// Training Assignments
export const getTrainingAssignments = (): TrainingAssignment[] => loadData<TrainingAssignment[]>('training_assignments', []);
export const saveTrainingAssignments = (data: TrainingAssignment[]) => saveData('training_assignments', data);

// Training Quizzes
export const getTrainingQuizzes = (): TrainingQuiz[] => loadData<TrainingQuiz[]>('training_quizzes', []);
export const saveTrainingQuizzes = (data: TrainingQuiz[]) => saveData('training_quizzes', data);

// ===== INCREMENTAL SYNC TRACKING HELPERS =====
export function getLastSyncTime(moduleName: string): string | null {
  const trackers = getSyncTracker();
  const found = trackers.find(t => t.module === moduleName);
  return found?.lastSync || null;
}

export function getChangedRecords<T extends { updatedAt?: string; createdAt?: string; id: string }>(
  records: T[],
  moduleName: string
): { new: T[]; updated: T[]; deleted: string[] } {
  const lastSync = getLastSyncTime(moduleName);
  const previousIds = getPreviousSyncIds(moduleName);
  const currentIds = new Set(records.map(r => r.id));
  
  // Deleted IDs are those present in previous sync but not in current records
  const deletedIds = previousIds.filter(id => !currentIds.has(id));

  if (!lastSync) {
    // First sync - everything is new
    return { new: records, updated: [], deleted: [] };
  }

  const newRecords: T[] = [];
  const updatedRecords: T[] = [];
  
  records.forEach(record => {
    const recordDate = record.updatedAt || record.createdAt;
    const isPreviouslySynced = previousIds.includes(record.id);
    
    if (!isPreviouslySynced) {
      newRecords.push(record);
    } else if (recordDate && recordDate > lastSync) {
      updatedRecords.push(record);
    }
  });

  return { new: newRecords, updated: updatedRecords, deleted: deletedIds };
}

export function clearPreviousSyncIds(moduleName: string): void {
  if (typeof window === 'undefined') return;
  const key = `humail_eli_sync_ids_${moduleName}`;
  localStorage.removeItem(key);
  clearSyncTracker(moduleName);
}

export function getPreviousSyncIds(moduleName: string): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const key = `humail_eli_sync_ids_${moduleName}`;
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
  } catch (error) {
    logger.error(`Error loading previous sync IDs for ${moduleName}:`, error);
    return [];
  }
}

export function savePreviousSyncIds(moduleName: string, ids: string[]): void {
  if (typeof window === 'undefined') return;
  const key = `humail_eli_sync_ids_${moduleName}`;
  localStorage.setItem(key, JSON.stringify(ids));
}

// ===== BIOMETRIC STORAGE FUNCTIONS =====

export const getBiometricDevices = (): BiometricDeviceConfig[] => {
  return loadData<BiometricDeviceConfig[]>('biometric_devices', []);
};

export const saveBiometricDevices = (devices: BiometricDeviceConfig[]): void => {
  saveData('biometric_devices', devices);
};

export const getBiometricPunchRecords = (): BiometricPunchRecord[] => {
  return loadData<BiometricPunchRecord[]>('biometric_punches', []);
};

export const saveBiometricPunchRecords = (records: BiometricPunchRecord[]): void => {
  saveData('biometric_punches', records);
};

export const getBiometricSyncLogs = (): BiometricSyncLog[] => {
  return loadData<BiometricSyncLog[]>('biometric_sync_logs', []);
};

export const saveBiometricSyncLogs = (logs: BiometricSyncLog[]): void => {
  saveData('biometric_sync_logs', logs);
};

export const getActiveBiometricDevice = (): BiometricDeviceConfig | null => {
  const devices = getBiometricDevices();
  return devices.find(d => d.isActive) || null;
};

export const getBiometricDeviceById = (id: string): BiometricDeviceConfig | null => {
  const devices = getBiometricDevices();
  return devices.find(d => d.id === id) || null;
};

export const addBiometricPunchRecord = (record: BiometricPunchRecord): void => {
  const records = getBiometricPunchRecords();
  records.push(record);
  saveBiometricPunchRecords(records);
};

export const addBiometricSyncLog = (log: BiometricSyncLog): void => {
  const logs = getBiometricSyncLogs();
  logs.unshift(log);
  // Keep only last 100 logs
  if (logs.length > 100) {
    logs.length = 100;
  }
  saveBiometricSyncLogs(logs);
};

// ===== EXIT RECORD FUNCTIONS =====

export const getExitRecords = (): ExitRecord[] => {
  return loadData<ExitRecord[]>('exit_records', []);
};

export const saveExitRecords = (records: ExitRecord[]): void => {
  saveData('exit_records', records);
};

export const getExitRecordById = (id: string): ExitRecord | null => {
  const records = getExitRecords();
  return records.find(r => r.id === id) || null;
};

export const getExitRecordsByEmployee = (employeeId: string): ExitRecord[] => {
  const records = getExitRecords();
  return records.filter(r => r.employeeId === employeeId);
};

export const getActiveExitRecords = (): ExitRecord[] => {
  const records = getExitRecords();
  return records.filter(r => r.status !== 'Completed' && r.status !== 'Cancelled');
};

export const createExitRecord = (record: ExitRecord): void => {
  const records = getExitRecords();
  records.push(record);
  saveExitRecords(records);
};

export const updateExitRecord = (id: string, updates: Partial<ExitRecord>): void => {
  const records = getExitRecords();
  const index = records.findIndex(r => r.id === id);
  if (index !== -1) {
    records[index] = { ...records[index], ...updates, updatedAt: new Date().toISOString() };
    saveExitRecords(records);
  }
};

export const completeExitRecord = (id: string): void => {
  const records = getExitRecords();
  const index = records.findIndex(r => r.id === id);
  if (index !== -1) {
    records[index].status = 'Completed';
    records[index].completedAt = new Date().toISOString();
    records[index].updatedAt = new Date().toISOString();
    saveExitRecords(records);
  }
};

// ===== SALARY STORAGE FUNCTIONS =====

export const getSalaryStructures = (): SalaryStructure[] => {
  return loadData<SalaryStructure[]>('salary_structures', []);
};

export const saveSalaryStructures = (structures: SalaryStructure[]): void => {
  saveData('salary_structures', structures);
};

export const getSalaryStructureByEmployee = (employeeId: string, fallbackBaseSalary?: number): SalaryStructure | null => {
  const structures = getSalaryStructures();
  const found = structures.find(s => s.employeeId === employeeId && s.isActive);
  if (found) return found;

  // No structure found – create a default one on the fly
  const employee = getEmployees().find(e => e.id === employeeId);
  if (!employee && fallbackBaseSalary === undefined) return null;

  // Create a default structure using the employee's baseSalary
  const baseSalary = fallbackBaseSalary !== undefined ? fallbackBaseSalary : (employee?.baseSalary || 0);
  const defaultStructure: SalaryStructure = {
    id: `SAL-${Date.now()}`,
    employeeId: employeeId,
    components: [
      { id: `comp-${Date.now()}-basic`, name: 'Basic', type: 'fixed', taxable: true, amount: baseSalary }
    ],
    totalMonthly: baseSalary,
    totalAnnual: baseSalary * 12,
    ctc: baseSalary * 12, // simplified CTC
    employerContributions: {
      pf: baseSalary * 0.12,
      esi: baseSalary * 0.04,
      gratuity: baseSalary * 0.0481,
    },
    payGradeId: '',
    currency: 'USD',
    effectiveFrom: new Date().toISOString().split('T')[0],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return defaultStructure;
};

export const saveSalaryStructure = (structure: SalaryStructure): void => {
  const structures = getSalaryStructures();
  const index = structures.findIndex(s => s.id === structure.id);
  if (index !== -1) {
    structures[index] = structure;
  } else {
    structures.push(structure);
  }
  saveSalaryStructures(structures);
};

export const getPayGrades = (): PayGrade[] => {
  return loadData<PayGrade[]>('pay_grades', []);
};

export const savePayGrades = (grades: PayGrade[]): void => {
  saveData('pay_grades', grades);
};

export const getPayGradeById = (id: string): PayGrade | null => {
  const grades = getPayGrades();
  return grades.find(g => g.id === id) || null;
};

export const getSalaryRevisions = (): SalaryRevision[] => {
  return loadData<SalaryRevision[]>('salary_revisions', []);
};

export const saveSalaryRevisions = (revisions: SalaryRevision[]): void => {
  saveData('salary_revisions', revisions);
};

export const getSalaryRevisionsByEmployee = (employeeId: string): SalaryRevision[] => {
  const revisions = getSalaryRevisions();
  return revisions.filter(r => r.employeeId === employeeId);
};

export const addSalaryRevision = (revision: SalaryRevision): void => {
  const revisions = getSalaryRevisions();
  revisions.push(revision);
  saveSalaryRevisions(revisions);
};

// ===== DEFAULT PAY GRADES =====
export const DEFAULT_PAY_GRADES: PayGrade[] = [
  {
    id: 'PG-001',
    name: 'Executive Level',
    code: 'EXEC',
    minSalary: 15000,
    maxSalary: 30000,
    currency: 'USD',
    level: 10,
    category: 'Executive',
    isActive: true,
    description: 'C-Level and Executive positions',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'PG-002',
    name: 'Senior Management',
    code: 'SM',
    minSalary: 8000,
    maxSalary: 15000,
    currency: 'USD',
    level: 8,
    category: 'Management',
    isActive: true,
    description: 'Senior Management roles',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'PG-003',
    name: 'Mid Management',
    code: 'MM',
    minSalary: 4000,
    maxSalary: 8000,
    currency: 'USD',
    level: 6,
    category: 'Management',
    isActive: true,
    description: 'Mid-level Management roles',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'PG-004',
    name: 'Senior Staff',
    code: 'SS',
    minSalary: 2500,
    maxSalary: 4000,
    currency: 'USD',
    level: 4,
    category: 'Senior Staff',
    isActive: true,
    description: 'Senior individual contributors',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'PG-005',
    name: 'Staff Level',
    code: 'STF',
    minSalary: 1200,
    maxSalary: 2500,
    currency: 'USD',
    level: 2,
    category: 'Staff',
    isActive: true,
    description: 'Regular staff positions',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'PG-006',
    name: 'Entry Level',
    code: 'ENT',
    minSalary: 500,
    maxSalary: 1200,
    currency: 'USD',
    level: 1,
    category: 'Entry Level',
    isActive: true,
    description: 'Entry level and intern positions',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Initialize pay grades if empty
export const initializePayGrades = (): void => {
  const existing = getPayGrades();
  if (existing.length === 0) {
    const settings = getSettings();
    const baseCurrency = settings.companySettings.baseCurrency || 'USD';
    const gradesWithCurrency = DEFAULT_PAY_GRADES.map(g => ({
      ...g,
      currency: baseCurrency
    }));
    savePayGrades(gradesWithCurrency);
  }
};


export const INITIAL_LEAVE_POLICIES = DEFAULT_LEAVE_POLICIES;

export const getLeavePolicies = (): LeavePolicy[] => {
  return loadData<LeavePolicy[]>('leave_policies', DEFAULT_LEAVE_POLICIES);
};

export const saveLeavePolicies = (policies: LeavePolicy[]): void => {
  saveData('leave_policies', policies);
};
