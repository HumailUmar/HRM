export interface WhatsAppMessage {
  id: string;
  candidateId: string;
  candidateName: string;
  phoneNumber: string;
  templateName: string; // e.g., "Interview_Invitation", "Rejection_Notification"
  templateLanguage: string;
  components: {
    type: 'body' | 'header' | 'footer' | 'button';
    text: string;
  }[];
  status: 'Queued' | 'Sent' | 'Delivered' | 'Read' | 'Failed';
  sentAt: string;
  deliveredAt?: string;
  readAt?: string;
  failureReason?: string;
  errorCode?: string;
  conversationId?: string;
  messageId?: string; // WhatsApp API message ID
  cost?: number; // Cost in USD
}

export interface WhatsAppTemplate {
  id: string;
  name: string;
  namespace: string; // WhatsApp namespace
  language: string; // e.g., "en_US"
  category: 'UTILITY' | 'MARKETING' | 'AUTHENTICATION';
  status: 'ACTIVE' | 'APPROVED' | 'PENDING' | 'REJECTED';
  headerText?: string;
  bodyText: string;
  footerText?: string;
  buttons: {
    type: 'PHONE_NUMBER' | 'URL' | 'QUICK_REPLY';
    text: string;
    url?: string;
    phoneNumber?: string;
  }[];
  sampleData: {
    candidateName: string;
    interviewDate: string;
    interviewTime: string;
    interviewerName: string;
    companyName: string;
    meetingLink: string;
  };
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface WhatsAppConversation {
  id: string;
  candidateId: string;
  candidateName: string;
  phoneNumber: string;
  startedAt: string;
  endedAt?: string;
  messages: {
    id: string;
    direction: 'INCOMING' | 'OUTGOING';
    text: string;
    timestamp: string;
    status: 'Sent' | 'Delivered' | 'Read' | 'Failed';
  }[];
  status: 'Active' | 'Completed' | 'Abandoned';
}

export interface EmployeeEducation {
  id: string;
  degree: string; // e.g., "BS Computer Science"
  fieldOfStudy: string; // e.g., "Computer Science"
  institution: string; // e.g., "Stanford University"
  startDate: string;
  endDate: string;
  yearOfGraduation: string;
  grade?: string; // e.g., "A", "3.5/4.0", "First Class"
  isHighest: boolean;
}

export interface EmployeeCertification {
  id: string;
  name: string; // e.g., "PMP", "AWS Certified"
  issuingOrganization: string; // e.g., "PMI", "Amazon"
  issueDate: string;
  expiryDate?: string;
  credentialId?: string;
  fileUrl?: string; // Certificate file
}

export interface PreviousEmployer {
  id: string;
  companyName: string;
  jobTitle: string;
  startDate: string;
  endDate: string;
  reasonForLeaving?: string;
  contactPerson?: string;
  contactPhone?: string;
}

export interface PersonalInfo {
  name: string;
  email: string; // Work email
  personalEmail?: string;
  phone: string; // Work phone
  phonePersonal?: string;
  cnic?: string;
  cnicFrontImage?: string;
  cnicBackImage?: string;
  passportNumber?: string;
  passportExpiry?: string;
  nationality?: string;
  religion?: string;
  dateOfBirth?: string;
  gender?: 'Male' | 'Female' | 'Other' | 'Prefer not to say';
  maritalStatus?: 'Single' | 'Married' | 'Divorced' | 'Widowed' | 'Separated';
  bloodGroup?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'Unknown';
  currentAddress?: string;
  permanentAddress?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelationship?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  otherSocialUrls?: string;
  profileImage?: string;
}

export interface EmploymentDetails {
  joiningDate: string;
  status: 'Active' | 'Onboarding' | 'On Leave' | 'Suspended' | 'Probation' |
          'Resigned' | 'Retired' | 'Deceased' | 'Contract Expired' | 'Terminated';
  departmentId?: string;
  designationId?: string;
  role?: 'Employee' | 'Manager' | 'HR' | 'Admin';
  grade?: string;
  jobCategory?: string;
  employmentType?: 'Permanent' | 'Contract' | 'Intern' | 'Part-time' | 'Freelance' | 'Consultant';
  contractStartDate?: string;
  contractEndDate?: string;
  isProbation?: boolean;
  probationEndDate?: string;
  confirmationDate?: string;
  workLocation?: 'Office' | 'Remote' | 'Hybrid';
  shift?: string;
  costCenter?: string;
  reportingManagerId?: string;
  hrBusinessPartnerId?: string;
  payrollGroup?: string;
  punchCode?: string;
  seatNumber?: number;
  
  // Status specific dates
  leaveStartDate?: string;
  leaveEndDate?: string;
  leaveType?: 'Maternity' | 'Paternity' | 'Sabbatical' | 'Study' | 'Medical' | 'Personal' | 'Other';
  suspensionStartDate?: string;
  suspensionEndDate?: string;
  suspensionReason?: string;
  resignationDate?: string;
  lastWorkingDate?: string;
  retirementDate?: string;
  terminationDate?: string;
  terminationReason?: string;
}

export interface CompensationDetails {
  payGradeId?: string;
  currency?: string;
  salaryStructure?: SalaryStructure;
  salaryHistory?: SalaryRevision[];
}

export interface OnboardingChecklist {
  contractSigned: boolean;
  trainingAssigned: boolean;
  trainingCompleted: boolean;
  welcomeEmailSent: boolean;
  feedbackSubmitted: boolean;
  templateId?: string;
  tasksCompleted?: string[];
  tasksStatus?: { [taskId: string]: 'pending' | 'in-progress' | 'completed' | 'overdue' };
}

export interface ExitChecklist {
  resignationAccepted: boolean;
  assetHandover: boolean;
  ndaRenewed: boolean;
  finalSettlement: boolean;
  exitInterview: boolean;
}

export interface Employee {
  id: string;

  // ===== ROOT-LEVEL ALIASES =====
  punchCode?: string;
  name: string;
  email: string;
  status: EmploymentDetails["status"];
  role?: string;
  department?: string;
  baseSalary?: number;

  // ===== DOMAINS =====
  personal: PersonalInfo;
  employment: EmploymentDetails;
  compensation: CompensationDetails;
  onboarding: OnboardingChecklist;
  exit: ExitChecklist | null;
  
  // Historical & Relational
  statusHistory?: EmployeeStatusHistory[];
  education?: EmployeeEducation[];
  certifications?: EmployeeCertification[];
  previousEmployers?: PreviousEmployer[];
  journeyTimeline?: TimelineEvent[];
  
  // Mentorship
  mentorId?: string;
  mentorName?: string;
  mentees?: string[];
  
  // Meta
  createdAt?: string;
  updatedAt?: string;
  syncedAt?: string;
  
  // Training
  trainingFeedback?: {
    trainerName: string;
    rating: number;
    comments: string;
    submittedAt: string;
  };
  
}

export interface TimelineEvent {
  id: string;
  stage: 'Recruitment' | 'Onboarding' | 'Performance' | 'Promotion' | 'Exit';
  date: string;
  title: string;
  description: string;
}

export interface LegacyOnboardingTask {
  id: string;
  employeeId: string;
  employeeName: string;
  taskName: string;
  dueDate: string;
  assignedToId: string;
  assignedToName: string;
  completed: boolean;
}

export interface OnboardingTask {
  id: string;
  taskName: string;
  description: string;
  assignedTo: 'HR' | 'IT' | 'Manager' | 'Employee' | 'Facilities' | 'Finance';
  dueDaysAfterJoining: number; // Number of days after joining to complete
  isRequired: boolean;
  autoTrigger: boolean; // Auto-trigger when certain conditions are met
  triggerCondition?: string; // e.g., "contractSigned" or "trainingCompleted"
}

export interface EmployeeDocument {
  id: string;
  employeeId: string;
  employeeName: string;
  documentType: 'CNIC_FRONT' | 'CNIC_BACK' | 'PASSPORT' | 'PROFILE_IMAGE' |
                  'EDUCATION_CERTIFICATE' | 'EMPLOYMENT_CONTRACT' | 'NDA' |
                  'OFFER_LETTER' | 'PERFORMANCE_REVIEW' | 'TRAINING_CERTIFICATE' |
                  'MEDICAL_REPORT' | 'POLICE_CLEARANCE' | 'EXPERIENCE_LETTER' |
                  'BANK_DETAILS' | 'TAX_DOCUMENT' | 'OTHER';
  documentTypeLabel: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  fileUrl: string;
  driveFileId: string;
  uploadedBy: string;
  uploadedByName: string;
  uploadedAt: string;
  isVerified: boolean;
  verifiedBy?: string;
  verifiedByName?: string;
  verifiedAt?: string;
  expiryDate?: string;
  status: 'Pending Verification' | 'Verified' | 'Rejected' | 'Expired';
  notes: string;
  tags: string[];
  version: number;
  parentDocumentId?: string;
}

export interface DocumentCategory {
  id: string;
  name: string;
  description: string;
  allowedFileTypes: string[];
  maxFileSize: number; // In MB
  isRequired: boolean;
  requiresVerification: boolean;
  hasExpiry: boolean;
}

export interface OnboardingTemplate {
  id: string;
  name: string;
  description: string;
  department?: string; // Optional: apply to specific department
  role?: string; // Optional: apply to specific role
  tasks: OnboardingTask[];
  isActive: boolean;
  createdBy: string;
  createdAt: string;
}

export interface SuccessionPlan {
  id: string;
  roleName: string;
  department: string;
  currentIncumbentId: string;
  currentIncumbentName: string;
  successorId: string;
  successorName: string;
  potentialRating: 'Low' | 'Medium' | 'High';
  readiness: 'Ready Now' | 'Ready in 1 Year' | 'Ready in 2+ Years';
  notes?: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string; // YYYY-MM-DD
  checkIn: string; // HH:MM
  checkOut: string; // HH:MM
  lateMinutes: number;
  earlyDepartureMinutes: number;
  status: 'Full Day' | 'Half Day' | 'Absent';
  createdAt?: string;
  updatedAt?: string;
}

export interface PayrollRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  month: string; // e.g., "July 2026"
  baseSalary: number;
  bonus: number;
  penalty: number;
  leaveDeductions: number;
  netSalary: number;
  status: 'Pending' | 'Paid';
  calculatedAt: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Candidate {
  matchScore?: number;
  id: string;
  name: string;
  email: string;
  phone: string;
  skills: string[];
  experienceYears: number;
  resumeFileName: string;
  status: 'Applied' | 'Parsed' | 'Shortlisted' | 'Screened' | 'Invited' | 'Rejected' | 'Hired';
  screeningScores?: { [key: string]: number }; // questionIndex (0-9) -> score (1-10)
  screeningTotalScore?: number; // sum of scores
  whatsappSent?: boolean;
  
  // ===== NEW: Education & Certification for Accurate Matching =====
  education?: {
    degree: string;        // e.g., "BS Computer Science"
    fieldOfStudy?: string; // e.g., "Computer Science"
    institution?: string;  // e.g., "Stanford University"
    yearOfGraduation?: string;
  }[];
  
  certifications?: {
    name: string;          // e.g., "PMP", "AWS Certified"
    issuingOrganization?: string;
    issueDate?: string;
    expiryDate?: string;
  }[];
  
  // AI screening chatbot, video responses and combined scoring
  chatbotScore?: number;
  videoScore?: number;
  combinedScore?: number;
  chatbotTranscript?: string; // JSON or string transcript
  videoUrl?: string; // simulated response video URL
  createdAt?: string;
  updatedAt?: string;
}

export interface AttendanceRules {
  lateThreshold: string; // "09:05"
  earlyDepartureThreshold: string; // "17:55"
  halfDayHours: number; // 4
  fullDayHours: number; // 8
  gracePeriodMinutes: number; // 5
}

export interface PayrollRules {
  perfectAttendanceBonus: number; // 150
  latePenalty: number; // 5
  halfDayDeduction: number; // 50
  absentPenalty: number; // 100
  overtimeRate: number; // 1.5
  taxRate: number; // 10
  socialSecurityRate: number; // 5
  healthInsuranceDeduction: number; // 50
}

export interface RecruitmentRules {
  minExperienceYears: number; // 3
  minScreeningScore: number; // 70
  screeningQuestionsCount: number; // 10
  whatsAppMessageTemplate: string;
}


export interface StatusManagementRules {
  enableStatusManagement: boolean;
  autoExpireOnLeave: boolean;
  autoExpireProbation: boolean;
  autoResignToTerminated: boolean;
  enableBulkStatusUpdate: boolean;
  allowRehireTerminated: boolean;
}

export interface CompanySettings {
  companyName: string;
  companyEmail: string;
  companyPhone: string;
  companyAddress: string;
  workStartTime: string; // "09:00"
  workEndTime: string; // "18:00"
  weekends: string[]; // ["Saturday", "Sunday"]
  publicHolidays: string[]; // ["2026-01-01"]
  baseCurrency?: string;
}

export interface DatabaseConfig {
  mysql: {
    host?: string;
    port?: number;
    database?: string;
    username?: string;
    password?: string;
    ssl?: boolean;
    poolSize?: number;
    timeout?: number;
  };
  postgres: {
    host?: string;
    port?: number;
    database?: string;
    username?: string;
    password?: string;
    ssl?: boolean;
    poolSize?: number;
    timeout?: number;
  };
}

export interface GoogleSheetsConfig {
  spreadsheetId: string;
  attendanceSheet: string;
  payrollSheet: string;
  recruitmentSheet?: string;
  leaveSheet: string;
  employeeSheet?: string;
  documentsSheet?: string;
  successionSheet?: string;
  onboardingTasksSheet?: string;
  orgChartSheet?: string;
  hiresSheet?: string;
  reviewTemplatesSheet?: string;
  performanceReviewsSheet?: string;
  interviewScheduleSheet?: string;
  leavePoliciesSheet?: string;
  leaveTypeConfigsSheet?: string;
  payslipsSheet?: string;
  notificationsSheet?: string;
  shiftsSheet?: string;
  shiftAssignmentsSheet?: string;
  shiftSwapRequestsSheet?: string;
  shiftTemplatesSheet?: string;
  currenciesSheet?: string;
  taxRulesSheet?: string;
  statutoryDeductionsSheet?: string;
  payrollCalculationsSheet?: string;
  reviewCyclesSheet?: string;
  usersSheet?: string;
  loginSessionsSheet?: string;
  passwordResetsSheet?: string;
  departmentsSheet?: string;
  statusHistorySheet?: string;
  designationsSheet?: string;
  whatsappMessagesSheet?: string;
  whatsappTemplatesSheet?: string;
  whatsappConversationsSheet?: string;
  driveFolderId?: string;
}

export interface AIConfig {
  provider: 'gemini' | 'anthropic' | 'openai' | 'custom' | 'none';
  apiKey?: string;
  customEndpoint?: string;
  enableResumeParsing?: boolean;
  enableScreening?: boolean;
  enableJDMatching?: boolean;
  enableAnalytics?: boolean;
}

export interface WhatsAppConfig {
  apiUrl: string;
  phoneNumberId?: string;
  accessToken?: string;
  businessAccountId?: string;
  verifyToken?: string;
}

export interface BiometricConfig {
  apiUrl: string;
}

export interface AppSettings {
  storageType?: "local" | "mysql" | "postgresql" | "google-sheets" | "api";
  mysqlHost?: string;
  mysqlPort?: number | string;
  mysqlDatabase?: string;
  mysqlUsername?: string;
  mysqlPassword?: string;
  mysqlSSL?: boolean;
  mysqlPoolSize?: number | string;
  mysqlTimeout?: number | string;
  
  postgresHost?: string;
  postgresPort?: number | string;
  postgresDatabase?: string;
  postgresUsername?: string;
  postgresPassword?: string;
  postgresSSL?: boolean;
  postgresPoolSize?: number | string;
  postgresTimeout?: number | string;

  isMockMode: boolean;
  // ===== DEPRECATED FLAT FIELDS =====
  googleSheetId?: string;
  attendanceSheetName?: string;
  payrollSheetName?: string;
  leaveSheetName?: string;
  
  database: DatabaseConfig;
  googleSheets: GoogleSheetsConfig;
  ai: AIConfig;
  whatsApp: WhatsAppConfig;
  biometric: BiometricConfig;

  // Legacy URLs for compatibility (deprecated)
  resumeParserApiUrl?: string;
  aiScreeningApiUrl?: string;

  // Company Policies & Settings
  attendanceRules: AttendanceRules;
  payrollRules: PayrollRules;
  recruitmentRules: RecruitmentRules;
  companySettings: CompanySettings;
  statusRules?: StatusManagementRules;
  auditTrailRules?: AuditTrailRules;
}

export interface LeaveRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  approvedBy?: string;
  approvedAt?: string;
  rejectedReason?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DocumentRecord {
  id: string;
  employeeId: string;
  fileName: string;
  driveFileId: string;
  uploadedAt: string;
}

export interface OrgChartNode {
  id: string;
  positionName: string;
  department: string;
  employeeId?: string; // If assigned to an employee
  parentId?: string; // Reports to whom
  isCritical: boolean;
  riskLevel: 'Low' | 'Medium' | 'High';
  successors: string[]; // Employee IDs of potential successors
  children: string[]; // Child node IDs
}

export interface Department {
  id: string;
  name: string;
  code: string; // e.g., "HR", "ENG", "MKT"
  description: string;
  headId?: string; // Employee ID of department head
  headName?: string; // Name of department head
  parentDepartmentId?: string; // For sub-departments
  location?: string;
  budget?: number;
  costCenter?: string;
  employeeCount: number; // Auto-calculated
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Designation {
  id: string;
  name: string;
  code: string; // e.g., "CEO", "CTO", "SE-3"
  description: string;
  departmentId?: string; // Default department for this designation
  level: number; // 1 = Entry, 10 = Executive, etc.
  category: 'Executive' | 'Management' | 'Senior Staff' | 'Staff' | 'Entry Level' | 'Intern';
  reportingToDesignationId?: string; // Default reporting line
  minSalary?: number;
  maxSalary?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}



export interface EmployeeStatusHistory {
  id: string;
  employeeId: string;
  employeeName: string;
  oldStatus: string;
  newStatus: string;
  changedBy: string;
  changedByName: string;
  changedAt: string;
  reason: string;
  notes: string;
}


export interface EmployeeHistoryEntry {
  id: string;
  employeeId: string;
  employeeName: string;
  fieldName: string;
  fieldLabel: string;
  oldValue: string;
  newValue: string;
  changedBy: string;
  changedByName: string;
  changedAt: string;
  reason: string;
  notes: string;
  changeType: 'CREATE' | 'UPDATE' | 'DELETE' | 'BULK_UPDATE';
  source: 'MANUAL' | 'TRANSITION' | 'BULK_IMPORT' | 'SYSTEM_AUTO' | 'API';
  ipAddress?: string;
  userAgent?: string;
}

export interface EmployeeHistorySummary {
  employeeId: string;
  employeeName: string;
  totalChanges: number;
  lastChangeDate: string;
  mostChangedFields: string[];
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedBy: string;
  updatedByName: string;
  updatedAt: string;
}

export interface AuditTrailRules {
  enableAuditTrail: boolean;
  trackAllFields: boolean;
  trackedFields: string[];
  requireReason: boolean;
  requireReasonHighImpact: boolean;
  retentionPeriod: string;
}


export interface JobRequirement {
  id: string;
  category: 'Skill' | 'Experience' | 'Education' | 'Certification';
  name: string;
  isRequired: boolean;
  weight: number;
  minValue?: number;
  maxValue?: number;
  priority: 'Must Have' | 'Nice to Have' | 'Preferred';
}

export interface EvaluationQuestion {
  id: string;
  question: string;
  category: string;
  scoringRubric: {
    1: string;
    2: string;
    3: string;
    4: string;
    5: string;
  };
  weight: number;
  isRequired: boolean;
}

export interface EvaluationDimension {
  id: string;
  name: string;
  description: string;
  weight: number;
  questions?: EvaluationQuestion[];
  questionIds?: string[];
}

export interface StageQuestion {
  id: string;
  question: string;
  description: string;
  category: string; // e.g., "Technical", "Behavioral", "Cultural", "Leadership"
  type: 'Text' | 'Voice' | 'Video' | 'Multiple Choice' | 'Coding';
  isRequired: boolean;
  weight: number; // 0-100
  scoringRubric: {
    1: string; // Poor response description
    2: string; // Below average response description
    3: string; // Average response description
    4: string; // Good response description
    5: string; // Excellent response description
  };
  maxTimeSeconds?: number; // For video/voice responses
  followUpQuestion?: string; // Default follow-up if candidate answer is unclear
  keywords?: string[]; // Keywords to look for in responses
  aiHints?: string; // Hints for AI to evaluate this question
}

export interface StageTemplate {
  id: string;
  name: string; // e.g., "Initial Screening", "Technical Assessment", "Manager Round", "HR Round"
  description: string;
  order: number;
  isDefault: boolean;
  questions: StageQuestion[];
  evaluationDimensions: EvaluationDimension[];
  passingScore: number; // Minimum score to advance
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EvaluationScorecard {
  id: string;
  candidateId: string;
  jobId: string;
  stageId: string;
  interviewerId: string;
  interviewerName: string;
  scores: {
    questionId: string;
    questionText: string;
    score: number; // 1-5
    notes: string;
    evidence: string; // What the candidate said
  }[];
  dimensionScores: {
    dimensionName: string;
    score: number; // 0-100
    weightedScore: number;
  }[];
  overallScore: number; // 0-100
  recommendation: 'Advance' | 'Consider' | 'Reject';
  comments: string;
  submittedAt: string;
  submittedBy: string;
}

export interface InterviewPanel {
  id: string;
  candidateId: string;
  jobId: string;
  stageId: string;
  interviewers: string[]; // Employee IDs
  scheduledDate: string;
  scheduledTime: string;
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled';
  meetingLink?: string;
  notes: string;
}

export interface JobDescription {
  id: string;
  title: string;
  department: string;
  location: string;
  employmentType: 'Full-time' | 'Part-time' | 'Contract' | 'Internship' | 'Freelance';
  experienceLevel: 'Entry Level' | 'Mid Level' | 'Senior Level' | 'Executive' | 'Director';
  minSalary?: number;
  maxSalary?: number;
  currency: string;
  postingDate: string;
  closingDate?: string;
  isActive: boolean;

  summary: string;
  responsibilities: string[];
  requirements: JobRequirement[];
  benefits: string[];
  evaluationDimensions: EvaluationDimension[];
  stageTemplates?: {
    [stageId: string]: string; // stageId -> templateId
  };
  overrideQuestions?: {
    [stageId: string]: StageQuestion[];
  };

  hiringManagerId: string;
  recruitingLeadId: string;
  interviewers: string[];

  matchingConfig?: MatchingConfig;
  workflowStages: string[];
  autoAdvance: boolean;
  requireApprovalForHire: boolean;

  totalApplications: number;
  candidatesInPipeline: number;
  averageTimeToHire: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface JobCandidate {
  id: string;
  jobId: string;
  candidateId: string;
  candidateName: string;
  matchScore: number;
  status: 'Applied' | 'Under Review' | 'Shortlisted' | 'Rejected' | 'Hired';
  appliedDate: string;
  currentStage: string;
  notes: string;
  rejectionReason?: string;
  offerSentDate?: string;
  offerAcceptedDate?: string;
}


export interface JDResumeMatch {
  id: string;
  jobId: string;
  candidateId: string;
  candidateName: string;

  overallScore: number;
  matchPercentage: number;
  matchLevel: 'Strong Match' | 'Good Match' | 'Potential Match' | 'Weak Match' | 'Not a Match';

  skillMatchScore: number;
  experienceMatchScore: number;
  educationMatchScore: number;
  certificationMatchScore: number;

  matchingSkills: string[];
  missingSkills: string[];
  partialSkills: string[];
  experienceYears: number;
  experienceRequired: number;
  educationMatch: boolean;
  certificationMatch: boolean;

  scoringDetails: {
    category: string;
    score: number;
    weight: number;
    weightedScore: number;
    matchedItems: string[];
    missingItems: string[];
  }[];

  aiSummary: string;
  aiRecommendation: 'Advance' | 'Consider' | 'Reject';
  aiReasoning: string;

  status: 'Pending' | 'Reviewed' | 'Shortlisted' | 'Rejected';
  reviewedBy?: string;
  reviewedAt?: string;
  notes: string;

  createdAt: string;
  updatedAt: string;
}

export interface MatchingConfig {
  id?: string;
  jobId?: string;

  skillWeight: number;
  experienceWeight: number;
  educationWeight: number;
  certificationWeight: number;

  strongMatchThreshold: number;
  goodMatchThreshold: number;
  potentialMatchThreshold: number;
  weakMatchThreshold: number;

  mustHaveExperience: boolean;
  mustHaveEducation: boolean;
  mustHaveCertifications: boolean;
  minExperienceYears: number;

  useAI: boolean;
  aiModel: string;
  autoShortlist: boolean;
}

export interface HireDetails {
  employeeId: string;
  candidateId: string;
  jobId: string;
  hireDate: string; // Joining date
  employmentType: 'Permanent' | 'Contract' | 'Intern' | 'Part-time' | 'Freelance' | 'Consultant';
  contractStartDate: string;
  contractEndDate?: string;
  probationPeriodMonths: number;
  salary: number;
  currency: string;
  onboardingTemplateId: string;
  onboardingTasks: {
    taskId: string;
    taskName: string;
    assignedTo: 'HR' | 'IT' | 'Manager' | 'Employee' | 'Facilities' | 'Finance';
    dueDaysAfterJoining: number;
    status: 'pending' | 'completed';
  }[];
  createdBy: string;
  createdAt: string;
  status: 'Draft' | 'Confirmed' | 'Completed';
}

export interface RecruitmentMetrics {
  totalCandidates: number;
  candidatesByStage: {
    stage: string;
    count: number;
  }[];
  candidatesByJob: {
    jobTitle: string;
    count: number;
  }[];
  candidatesByDepartment: {
    department: string;
    count: number;
  }[];

  funnelConversion: {
    stage: string;
    incoming: number;
    passing: number;
    conversionRate: number;
  }[];

  averageTimeToHire: number;
  averageTimeInStage: {
    stage: string;
    averageDays: number;
  }[];
  medianTimeToHire: number;
  maxTimeToHire: number;

  dropOffRate: {
    stage: string;
    dropOffCount: number;
    dropOffRate: number;
  }[];
  rejectionReasons: {
    reason: string;
    count: number;
  }[];

  applicationsPerJob: number;
  applicationsPerMonth: {
    month: string;
    count: number;
  }[];
  interviewToOfferRate: number;
  offerAcceptanceRate: number;

  recruiters: {
    recruiterName: string;
    totalApplications: number;
    shortlisted: number;
    screened: number;
    offersMade: number;
    offersAccepted: number;
  }[];
}

export interface RecruitmentAnalytics {
  id: string;
  period: 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly' | 'Yearly';
  startDate: string;
  endDate: string;
  metrics: RecruitmentMetrics;
  createdAt: string;
}

export interface InterviewSchedule {
  id: string;
  candidateId: string;
  candidateName: string;
  jobId: string;
  jobTitle: string;
  stage: string; 

  proposedDate: string;
  proposedTime: string;
  durationMinutes: number; 
  timezone: string; 

  interviewers: {
    id: string;
    name: string;
    email: string;
    status: 'Pending' | 'Confirmed' | 'Declined' | 'Tentative';
    calendarEventId?: string; 
    availabilitySlots?: string[]; 
  }[];

  meetingLink?: string;
  meetingLocation?: string; 
  meetingInstructions: string;

  candidateEmail: string;
  candidatePhone: string;
  candidateResume?: string; 

  status: 'Draft' | 'Proposed' | 'Confirmed' | 'Rescheduled' | 'Completed' | 'Cancelled';
  confirmedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;

  reminders: {
    type: 'Email' | 'SMS' | 'WhatsApp';
    sentAt: string;
    sentTo: string;
  }[];

  feedback: string;
  scorecardId?: string;

  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface InterviewAvailability {
  interviewerId: string;
  interviewerName: string;
  availableSlots: {
    date: string;
    startTime: string;
    endTime: string;
  }[];
  timezone: string;
  updatedAt: string;
}

export interface CalendarIntegration {
  id: string;
  userId: string;
  userEmail: string;
  provider: 'Google' | 'Outlook' | 'Apple' | 'Other';
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  calendarId: string;
  isConnected: boolean;
  connectedAt: string;
}
export interface User {
  id: string;
  employeeId: string;
  email: string;
  password: string;
  role: 'Employee' | 'Manager' | 'HR' | 'Admin';
  permissions: string[];
  isActive: boolean;
  isPasswordChanged: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginSession {
  id: string;
  userId: string;
  token: string;
  ipAddress: string;
  userAgent: string;
  expiresAt: string;
  isActive: boolean;
  createdAt: string;
}

export interface PasswordReset {
  id: string;
  userId: string;
  token: string;
  expiresAt: string;
  isUsed: boolean;
  createdAt: string;
}

export interface RolePermissions {
  role: 'Employee' | 'Manager' | 'HR' | 'Admin';
  permissions: {
    viewOwnProfile: boolean;
    editOwnProfile: boolean;
    viewOwnAttendance: boolean;
    viewOwnPayslips: boolean;
    applyForLeave: boolean;
    viewOwnOnboarding: boolean;
    viewTeam: boolean;
    approveLeave: boolean;
    viewTeamAttendance: boolean;
    manageTeamOnboarding: boolean;
    requestPromotion: boolean;
    viewTeamPerformance: boolean;
    viewAllEmployees: boolean;
    manageEmployees: boolean;
    manageLeavePolicy: boolean;
    runPayroll: boolean;
    manageRecruitment: boolean;
    manageDocuments: boolean;
    viewAllAttendance: boolean;
    viewAllPayslips: boolean;
    viewReports: boolean;
    manageUsers: boolean;
    manageRoles: boolean;
    manageSystemSettings: boolean;
    viewAuditLogs: boolean;
    manageDepartments: boolean;
    manageDesignations: boolean;
  };
}
export interface Shift {
  id: string;
  name: string;
  code: string;
  description: string;
  startTime: string;
  endTime: string;
  breakDurationMinutes: number;
  totalWorkHours: number;
  workingDays: string[];
  isRotating: boolean;
  rotationPattern?: string;
  shiftDifferential: number;
  nightShiftAllowance: number;
  applicableDepartments: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ShiftAssignment {
  id: string;
  employeeId: string;
  employeeName: string;
  shiftId: string;
  shiftName: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'Scheduled' | 'Completed' | 'Absent' | 'Late';
  swapRequestId?: string;
  approvedBy?: string;
  approvedAt?: string;
  notes?: string;
}

export interface ShiftSwapRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  shiftAssignmentId: string;
  date: string;
  currentShiftId: string;
  currentShiftName: string;
  requestedShiftId: string;
  requestedShiftName: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
}

export interface ShiftTemplate {
  id: string;
  name: string;
  description: string;
  shifts: string[];
  applicableDepartments: string[];
  isActive: boolean;
  createdAt: string;
}

export interface LeavePolicy {
  id: string;
  name: string;
  description: string;
  isDefault: boolean;
  isActive?: boolean;
  type?: string;
  quota?: number;
  accrualRate?: number;
  carryForwardLimit?: number;
  minTenureDays?: number;
  requiresApproval?: boolean;
  appliesToDepartments?: string[];
  appliesToRoles?: string[];
  appliesToEmploymentTypes?: string[];
  accrualFrequency?: string;
  accrualDayOfMonth?: number;
  accrualStartDate?: string;
  carryOverEnabled?: boolean;
  carryOverLimit?: number;
  carryOverExpiryMonths?: number;
  requireManagerApproval?: boolean;
  requireHRApproval?: boolean;
  requireMultipleApprovals?: boolean;
  additionalApprovers?: string[];
  maxConsecutiveDays?: number;
  minDaysBeforeLeave?: number;
  blackoutDates?: string[];
  encashmentAllowed?: boolean;
  encashmentLimit?: number;
  encashmentRate?: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export interface Currency {
  id: string;
  code: string;
  symbol: string;
  name: string;
  exchangeRate: number;
  baseCurrency: boolean;
  isActive: boolean;
  updatedAt: string;
}

export interface TaxRule {
  id: string;
  country: string;
  name: string;
  description: string;
  taxType: string;
  calculationBasis: string;
  calculationMethod: string;
  percentages: number[];
  fixedAmount: number;
  percentageOfSalary: number;
  maxAmount: number;
  minAmount: number;
  appliesTo: string[];
  isActive: boolean;
  effectiveDate: string;
  expiresDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface StatutoryDeduction {
  id: string;
  country: string;
  name: string;
  description: string;
  deductionType: string;
  employeeContribution: number;
  employerContribution: number;
  calculationBasis: string;
  fixedAmount: number;
  maxAmount: number;
  minAmount: number;
  appliesTo: string[];
  isActive: boolean;
  effectiveDate: string;
  expiresDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface PayrollCalculation {
  id: string;
  employeeId: string;
  employeeName: string;
  month: string;
  year: string;
  currency: string;
  exchangeRate: number;
  baseSalary: number;
  allowances: number;
  bonuses: number;
  overtime: number;
  commission: number;
  otherEarnings: number;
  totalEarnings: number;
  incomeTax: number;
  socialSecurity: number;
  pension: number;
  healthInsurance: number;
  loanDeduction: number;
  otherDeductions: number;
  totalDeductions: number;
  netSalary: number;
  netSalaryInBaseCurrency: number;
  employerSocialSecurity: number;
  employerPension: number;
  employerHealthInsurance: number;
  totalEmployerCost: number;
  status: 'Pending' | 'Paid';
  calculatedAt: string;
  paidAt?: string;
  annualTaxableIncome: number;
  annualTaxPaid: number;
  taxBracket: string;
}

export interface UserRole {
  id: string;
  userId: string;
  role: 'Employee' | 'Manager' | 'HR' | 'Admin';
  permissions: string[];
  assignedAt: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  leaveType: 'Annual' | 'Sick' | 'Casual' | 'Maternity' | 'Paternity' | 'Study' | 'Without Pay' | 'Other';
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  attachment?: string; // File URL
  status: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: string;
  rejectedReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LeaveBalance {
  employeeId: string;
  leaveType: string;
  total: number;
  used: number;
  remaining: number;
  accrued: number;
  updatedAt: string;
}

export interface Payslip {
  id: string;
  employeeId: string;
  employeeName: string;
  month: string;
  year: string;
  baseSalary: number;
  bonuses: number;
  deductions: number;
  netSalary: number;
  pdfUrl: string;
  generatedAt: string;
  isDownloaded: boolean;
}
export interface EmployeeNotification {
  id: string;
  employeeId: string;
  title: string;
  message: string;
  type: 'Info' | 'Warning' | 'Success' | 'Action';
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export interface PerformanceReviewCycle {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: 'Draft' | 'Active' | 'Completed';
  reviewType: 'Self' | 'Manager' | '360';
  description: string;
  type: 'Annual' | 'Half-Yearly' | 'Quarterly' | 'Monthly' | 'Probation' | 'Ad-hoc';
  selfReviewDeadline: string;
  managerReviewDeadline: string;
  peerReviewDeadline: string;
  includesSelfReview: boolean;
  includesManagerReview: boolean;
  includesPeerReview: boolean;
  includesSubordinateReview: boolean;
  sections: ReviewSection[];
  ratingScale: '1-5' | '1-10' | '1-100' | 'A-F';
  ratingDescriptions: {
    rating: number;
    label: string;
    description: string;
  }[];
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewSection {
  id: string;
  name: string;
  description: string;
  weight: number;
  questions: ReviewQuestion[];
}

export interface ReviewQuestion {
  id: string;
  question: string;
  description: string;
  category: 'Skills' | 'Behavior' | 'Goals' | 'Leadership' | 'Communication' | 'Teamwork' | 'Innovation' | 'Customer Focus';
  isRequired: boolean;
  maxScore: number;
  defaultScore?: number;
}

export interface PerformanceReview {
  id: string;
  employeeId: string;
  employeeName: string;
  reviewerId: string;
  reviewerName: string;
  reviewerType: 'Self' | 'Manager' | 'Peer' | 'Subordinate' | 'External';
  reviewCycleId: string;
  reviewCycleName: string;
  sectionScores: {
    sectionId: string;
    sectionName: string;
    score: number;
    weightedScore: number;
  }[];
  questionScores: {
    questionId: string;
    questionText: string;
    score: number;
    comments: string;
  }[];
  overallScore: number;
  weightedOverallScore: number;
  strengths: string;
  areasForImprovement: string;
  goals: string;
  recommendation: 'Promote' | 'Retain' | 'Needs Improvement' | 'Performance Improvement Plan' | 'Terminate';
  additionalComments: string;
  status: 'Draft' | 'Submitted' | 'Acknowledged' | 'Completed';
  submittedAt?: string;
  acknowledgedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PerformanceGoal {
  id: string;
  employeeId: string;
  employeeName: string;
  title: string;
  description: string;
  category: 'Performance' | 'Development' | 'Career' | 'Team' | 'Personal';
  priority: 'High' | 'Medium' | 'Low';
  targetDate: string;
  progress: number;
  status: 'Not Started' | 'In Progress' | 'Completed' | 'Delayed' | 'Cancelled';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  targetValue?: number;
  actualValue?: number;
}

export interface PeerAssignment {
  id: string;
  reviewCycleId: string;
  employeeId: string; // The employee being reviewed
  peerId: string; // The peer doing the review
  status: 'Pending' | 'In Progress' | 'Completed';
  assignedAt: string;
  completedAt?: string;
}

export interface PerformanceReviewTemplateType {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
}

export interface ScoringScale {
  id: string;
  name: string; // e.g., "1-5", "A-F"
  min: number;
  max: number;
  steps?: number; // Optional for numeric scales
  options?: { value: number; label: string }[]; // For categorical scales like A-F
}

export interface ReviewTemplateSection {
  id: string;
  templateId: string;
  name: string;
  description: string;
  weight: number; // Percentage
  scoringScaleId: string; // Reference to the scoring scale
  questions: any[];
}

export interface ReviewTemplateKPI {
  id: string;
  sectionId: string;
  name: string;
  description: string;
  type: 'Percentage' | 'Number' | 'Time' | 'Binary' | 'Composite';
  targetValue: string;
  weight: number;
}

export interface DecisionMatrix {
  id: string;
  templateId: string;
  condition: string;
  recommendation: string;
}

export interface RedFlag {
  id: string;
  templateId: string;
  condition: string;
  alertMessage: string;
}

export interface ReviewTemplateField {
  id: string;
  templateId: string;
  sectionId: string;
  label: string;
  type: 'NumberInput' | 'RatingDropdown' | 'TextArea' | 'Toggle' | 'PercentageSlider';
  targetValue?: string;
  options?: { value: number; label: string }[];
}

export interface Test {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  status: 'Pending' | 'Running' | 'Passed' | 'Failed';
  errorMessage?: string;
  lastRunAt?: string;
  lastRunBy?: string;
}

export interface TestCategory {
  id: string;
  name: string;
  tests: Test[];
}

export interface PerformanceReviewTemplate {
  id: string;
  name: string;
  description: string;
  typeId: string;
  department?: string;
  role?: string;
  isActive: boolean;
  sections: ReviewTemplateSection[]; 
  fields: ReviewTemplateField[];
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type TrainingContentType = 'Link' | 'UploadFile' | 'EmbedVideo' | 'Text' | 'Quiz' | 'ExternalCertification' | 'PracticalTask';

export interface TrainingModule {
  id: string;
  title: string;
  description: string;
  contentType: TrainingContentType;
  contentUrl?: string; // For Link, Video, File
  textContent?: string; // For Text
  expectedDurationMinutes: number;
  isMentorVerificationRequired: boolean;
  isAutoCompleteAllowed: boolean;
  passFailThreshold?: number; // For Quiz, Practical Task
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
}

export interface TrainingSubmission {
  id: string;
  assignmentId?: string; // optional for compatibility
  moduleId: string;
  employeeId: string;
  employeeName?: string; // optional for compatibility
  content?: string; // URL, text, or file reference
  submittedContentUrl?: string; // compatibility
  status: 'Pending' | 'InProgress' | 'In Progress' | 'Completed' | 'PendingReview' | 'Rejected' | 'Approved';
  progress: number;
  submittedAt: string;
  reviewedAt?: string;
  feedback?: string;
  grade?: number;
}

export interface TrainingRequest {
  id: string;
  requestedBy: string; // Employee ID
  requestedByName: string;
  department: string;
  courseTitle: string;
  courseDescription: string;
  whyNeeded: string;
  urgency: 'Low' | 'Medium' | 'High';
  targetEmployees: string[]; // Employee IDs
  status: 'Pending' | 'Under Review' | 'Approved' | 'Rejected' | 'Added';
  assignedMentorId?: string;
  assignedMentorName?: string;
  hrReviewerId?: string;
  hrReviewerName?: string;
  reviewedAt?: string;
  feedback?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TrainingMentorship {
  id: string;
  trainingAssignmentId: string;
  mentorId: string;
  mentorName: string;
  menteeId: string;
  menteeName: string;
  status: 'Active' | 'Completed' | 'Cancelled';
  checkInFrequency: 'Weekly' | 'Bi-Weekly' | 'Monthly';
  lastCheckIn?: string;
  nextCheckIn?: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface TrainingCheckIn {
  id: string;
  mentorshipId: string;
  date: string;
  notes: string;
  feedback: string;
  nextAction: string;
  recordedBy: string;
  recordedByName: string;
}

export interface TrainingMessage {
  id: string;
  mentorshipId: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  receiverName: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface TrainingAssignment {
  id: string;
  trainingRequestId?: string;
  courseId: string;
  courseTitle: string;
  employeeId: string;
  employeeName: string;
  mentorId?: string;
  mentorName?: string;
  status: 'Pending' | 'InProgress' | 'In Progress' | 'Completed' | 'Overdue' | 'Dropped';
  progress: number; // 0-100
  assignedAt: string;
  dueDate?: string;
  completedAt?: string;
  score?: number;
  certificateUrl?: string;
  feedback?: string;
  notes: string;
}

export interface TrainingQuizQuestion {
  id: string;
  question: string;
  type: 'MultipleChoice' | 'TrueFalse' | 'Text';
  options?: string[];
  correctAnswer: string;
  weight: number;
}

export interface TrainingQuiz {
  id: string;
  moduleId: string;
  questions: TrainingQuizQuestion[];
  passingScore: number;
  maxAttempts: number;
}

export interface ExitChecklistItem {
  id: string;
  name: string;
  description: string;
  responsibleDepartment: 'IT' | 'HR' | 'Finance' | 'Facilities' | 'Manager' | 'Legal' | 'Other';
  isRequired: boolean;
  dueDays: number;
  order: number;
}

export interface ExitChecklistTemplate {
  id: string;
  name: string;
  description: string;
  applicableDepartments: string[];
  applicableRoles: string[];
  items: ExitChecklistItem[];
}

export interface ExitInterviewQuestion {
  id: string;
  questionText: string;
  category: string; // Reason for Leaving, Work Environment, Management, etc.
  isRequired: boolean;
  answerType: 'Text' | 'Rating 1-5' | 'Rating 1-10' | 'Yes/No' | 'Multiple Choice';
  options?: string[]; // For Multiple Choice
  order: number;
}

export interface ExitInterviewTemplate {
  id: string;
  name: string;
  description: string;
  applicableDepartments: string[];
  applicableRoles: string[];
  questions: ExitInterviewQuestion[];
}

export interface ExitProcessStage {
  id: string;
  name: string;
  description: string;
  order: number;
  dependentStageId?: string;
  responsibleRole: string;
}

export interface SettlementConfig {
  leaveEncashmentPercentage: number;
  gratuityPercentage: number;
  bonusPercentage: number;
  deductionTypes: string[];
  paymentTypes: string[];
}

// ===== ADD THESE NEW TYPES =====

export interface ExitRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  initiatedBy: string;
  initiatedByName: string;
  initiatedAt: string;
  status: 'Initiated' | 'In Progress' | 'Checklist Complete' | 'Interview Complete' | 'Settlement Pending' | 'Completed' | 'Cancelled';
  checklistTemplateId?: string;
  checklistItems: {
    itemId: string;
    itemName: string;
    status: 'Pending' | 'In Progress' | 'Completed';
    completedBy?: string;
    completedAt?: string;
    notes?: string;
  }[];
  interviewTemplateId?: string;
  interviewResponses: {
    questionId: string;
    questionText: string;
    answer: string;
    recordedBy: string;
    recordedAt: string;
  }[];
  settlement: {
    totalAmount: number;
    leaveEncashment: number;
    gratuity: number;
    bonus: number;
    deductions: number;
    paymentType: string;
    paidAt?: string;
  } | null;
  resignationDate?: string;
  lastWorkingDate?: string;
  reason?: string;
  notes?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ===== BIOMETRIC DEVICE TYPES =====

export type BiometricDeviceType = 'zkteco' | 'biostar' | 'hikvision' | 'mock' | 'generic';

export interface BiometricDeviceConfig {
  id: string;
  type: BiometricDeviceType;
  name: string;
  host: string;
  port: number;
  apiKey?: string;
  username?: string;
  password?: string;
  ssl?: boolean;
  timeout?: number;
  isActive: boolean;
  lastSync?: string;
  syncInterval: number; // in minutes
  createdAt: string;
  updatedAt: string;
}

export interface BiometricPunchRecord {
  id: string;
  deviceId: string;
  employeeId: string;
  employeeName?: string;
  punchTime: string;
  punchType: 'check-in' | 'check-out' | 'break-start' | 'break-end';
  isManual?: boolean;
  verified: boolean;
  deviceName?: string;
  createdAt: string;
  /** True for demo/fabricated data; never saved to production storage. */
  mock?: boolean;
}

export interface BiometricSyncLog {
  id: string;
  deviceId: string;
  status: 'success' | 'failed' | 'partial';
  recordsSynced: number;
  errors: string[];
  startTime: string;
  endTime?: string;
  durationMs?: number;
}

export interface BiometricTestResult {
  success: boolean;
  message: string;
  deviceInfo?: {
    model: string;
    firmware: string;
    serialNumber: string;
    totalUsers: number;
  };
  error?: string;
}

// ===== SALARY & COMPENSATION TYPES =====

export interface SalaryComponent {
  id: string;
  name: string; // 'Basic', 'HRA', 'Transport', 'Medical', 'Special Allowance', 'LTA'
  type: 'fixed' | 'variable';
  taxable: boolean;
  amount: number;
  percentageOfBasic?: number;
  description?: string;
}

export interface SalaryStructure {
  id: string;
  employeeId: string;
  components: SalaryComponent[];
  totalMonthly: number;
  totalAnnual: number;
  ctc: number; // Annual CTC
  employerContributions: {
    pf: number; // Provident Fund (12% of basic)
    esi: number; // ESI (4% of basic)
    gratuity: number; // Gratuity (4.81% of basic)
  };
  payGradeId?: string;
  currency: string; // 'PKR' | 'USD' | 'EUR' | 'GBP' | 'AED' | 'SAR' | 'INR' | 'CAD' | 'AUD' | 'JPY'
  effectiveFrom: string;
  effectiveTo?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PayGrade {
  id: string;
  name: string; // e.g., "Grade 1", "Senior Executive"
  code: string; // e.g., "G1", "SE"
  minSalary: number;
  maxSalary: number;
  currency: string;
  level: number; // 1 to 10
  category: 'Executive' | 'Management' | 'Senior Staff' | 'Staff' | 'Entry Level' | 'Intern';
  isActive: boolean;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SalaryRevision {
  id: string;
  employeeId: string;
  oldStructure: SalaryStructure;
  newStructure: SalaryStructure;
  revisionDate: string;
  reason: 'Annual Increment' | 'Promotion' | 'Market Adjustment' | 'Performance' | 'Contract Renewal' | 'Other';
  approvedBy: string;
  approvedByName: string;
  notes?: string;
  createdAt: string;
}
