import { JobDescription, Employee, EmployeeDocument, AttendanceRecord, Candidate, AppSettings, AttendanceRules, PayrollRules, RecruitmentRules, CompanySettings, OrgChartNode, Department, Designation, LeavePolicy } from '../types';

export const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: "EMP-101",
    name: "Eliyah Humail",
    email: "eliyah.h@humaileli.com",
    status: "Active",
    personal: {
      name: "Eliyah Humail",
      email: "eliyah.h@humaileli.com",
      personalEmail: "eliyah.personal@gmail.com",
      phone: "+92 300 1234567",
      phonePersonal: "+92 333 9876543",
      cnic: "12345-1234567-8",
      dateOfBirth: "1985-03-15",
      gender: "Male",
      maritalStatus: "Married",
      nationality: "Pakistani",
      religion: "Islam",
      bloodGroup: "O+",
      currentAddress: "123 Main Street, Islamabad, Pakistan",
      permanentAddress: "456 Village Road, Lahore, Pakistan",
      city: "Islamabad",
      state: "Federal",
      country: "Pakistan",
      postalCode: "44000",
      emergencyContactName: "Sara Humail",
      emergencyContactPhone: "+92 300 9876543",
      emergencyContactRelationship: "Spouse",
      linkedinUrl: "https://linkedin.com/in/eliyahhumail",
      githubUrl: "https://github.com/eliyahhumail",
    },
    employment: {
      joiningDate: "2024-01-15",
      status: "Active",
      departmentId: "DEPT-001",
      designationId: "DSGN-001",
      role: "Admin",
      grade: "Level 4",
      jobCategory: "Executive",
      employmentType: "Permanent",
      contractStartDate: "2024-01-15",
      contractEndDate: "2027-01-14",
      isProbation: false,
      probationEndDate: "2024-04-15",
      confirmationDate: "2024-04-16",
      workLocation: "Office",
      shift: "Morning",
      costCenter: "CC-001",
      reportingManagerId: "",
      hrBusinessPartnerId: "",
      payrollGroup: "Executive",
      seatNumber: 1,
    },
    compensation: {
      currency: "USD",
    },
    onboarding: {
      contractSigned: true,
      trainingAssigned: true,
      trainingCompleted: true,
      welcomeEmailSent: true,
      feedbackSubmitted: true
    },
    exit: null,
    education: [
      {
        id: "EDU-001",
        degree: "BS Computer Science",
        fieldOfStudy: "Computer Science",
        institution: "Stanford University",
        startDate: "2003-09-01",
        endDate: "2007-06-15",
        yearOfGraduation: "2007",
        grade: "3.8/4.0",
        isHighest: true
      }
    ],
    certifications: [],
    previousEmployers: [],
  },
  {
    id: "EMP-102",
    name: "Sarah Jenkins",
    email: "sarah.j@humaileli.com",
    status: "Active",
    personal: {
      name: "Sarah Jenkins",
      email: "sarah.j@humaileli.com",
      phone: "+1 (555) 019-2834",
    },
    employment: {
      joiningDate: "2024-06-01",
      status: "Active",
      departmentId: "DEPT-002",
      designationId: "DSGN-003",
      role: "HR",
      seatNumber: 4,
    },
    compensation: {
      currency: "USD",
    },
    onboarding: {
      contractSigned: true,
      trainingAssigned: true,
      trainingCompleted: true,
      welcomeEmailSent: true,
      feedbackSubmitted: true
    },
    exit: null,
  },
  {
    id: "EMP-103",
    name: "Arsalan Khan",
    email: "arsalan.k@humaileli.com",
    status: "Active",
    personal: {
      name: "Arsalan Khan",
      email: "arsalan.k@humaileli.com",
      phone: "+92 321 9876543",
    },
    employment: {
      joiningDate: "2024-09-10",
      status: "Active",
      departmentId: "DEPT-003",
      designationId: "DSGN-005",
      role: "Manager",
      seatNumber: 8,
    },
    compensation: {
      currency: "USD",
    },
    onboarding: {
      contractSigned: true,
      trainingAssigned: true,
      trainingCompleted: true,
      welcomeEmailSent: true,
      feedbackSubmitted: true
    },
    exit: null,
  },
  {
    id: "EMP-104",
    name: "Michael Chen",
    email: "michael.c@humaileli.com",
    status: "Active",
    personal: {
      name: "Michael Chen",
      email: "michael.c@humaileli.com",
      phone: "+1 (555) 014-9922",
    },
    employment: {
      joiningDate: "2025-02-15",
      status: "Active",
      departmentId: "DEPT-004",
      role: "Employee",
      seatNumber: 14,
    },
    compensation: {
      currency: "USD",
    },
    onboarding: {
      contractSigned: true,
      trainingAssigned: true,
      trainingCompleted: true,
      welcomeEmailSent: true,
      feedbackSubmitted: true
    },
    exit: null,
  },
  {
    id: "EMP-105",
    name: "Zoya Patel",
    email: "zoya.p@humaileli.com",
    status: "Active",
    personal: {
      name: "Zoya Patel",
      email: "zoya.p@humaileli.com",
      phone: "+91 98765 43210",
    },
    employment: {
      joiningDate: "2025-05-01",
      status: "Active",
      departmentId: "DEPT-005",
      seatNumber: 22,
    },
    compensation: {
      currency: "USD",
    },
    onboarding: {
      contractSigned: true,
      trainingAssigned: true,
      trainingCompleted: true,
      welcomeEmailSent: true,
      feedbackSubmitted: true,
      tasksStatus: {},
      tasksCompleted: []
    },
    exit: null,
  },
  {
    id: "EMP-106",
    name: "David Miller",
    email: "david.m@humaileli.com",
    status: "Onboarding",
    personal: {
      name: "David Miller",
      email: "david.m@humaileli.com",
      phone: "+1 (555) 017-8833",
    },
    employment: {
      joiningDate: "2026-07-01",
      status: "Onboarding",
      departmentId: "DEPT-001",
      designationId: "DSGN-002",
      seatNumber: 15,
    },
    compensation: {
      currency: "USD",
      salaryStructure: {
        id: "SAL-106",
        employeeId: "EMP-106",
        components: [{ id: "BASIC", name: "Basic Salary", type: "fixed", taxable: true, amount: 3200 }],
        totalMonthly: 3200,
        totalAnnual: 38400,
        ctc: 41600,
        employerContributions: { pf: 384, esi: 128, gratuity: 154 },
        currency: "USD",
        effectiveFrom: "2026-07-01",
        isActive: true,
        createdAt: "2026-07-01",
        updatedAt: "2026-07-01"
      },
      salaryHistory: []
    },
    onboarding: {
      contractSigned: true,
      trainingAssigned: true,
      trainingCompleted: false,
      welcomeEmailSent: true,
      feedbackSubmitted: false,
      tasksStatus: {},
      tasksCompleted: []
    },
    exit: null
  },
  {
    id: "EMP-107",
    name: "Fatima Ali",
    email: "fatima.a@humaileli.com",
    status: "Onboarding",
    personal: {
      name: "Fatima Ali",
      email: "fatima.a@humaileli.com",
      phone: "+92 333 5554433",
    },
    employment: {
      joiningDate: "2026-07-10",
      status: "Onboarding",
      departmentId: "DEPT-001",
      designationId: "DSGN-003",
      seatNumber: 18,
    },
    compensation: {
      currency: "USD",
      salaryStructure: {
        id: "SAL-107",
        employeeId: "EMP-107",
        components: [{ id: "BASIC", name: "Basic Salary", type: "fixed", taxable: true, amount: 3000 }],
        totalMonthly: 3000,
        totalAnnual: 36000,
        ctc: 39000,
        employerContributions: { pf: 360, esi: 120, gratuity: 144 },
        currency: "USD",
        effectiveFrom: "2026-07-10",
        isActive: true,
        createdAt: "2026-07-10",
        updatedAt: "2026-07-10"
      },
      salaryHistory: []
    },
    onboarding: {
      contractSigned: false,
      trainingAssigned: false,
      trainingCompleted: false,
      welcomeEmailSent: false,
      feedbackSubmitted: false,
      tasksStatus: {},
      tasksCompleted: []
    },
    exit: null
  },
  {
    id: "EMP-108",
    name: "Robert Taylor",
    email: "robert.t@outlook.com",
    status: "Terminated",
    personal: {
      name: "Robert Taylor",
      email: "robert.t@outlook.com",
      phone: "+1 (555) 012-7744",
    },
    employment: {
      joiningDate: "2023-03-01",
      status: "Terminated",
      departmentId: "DEPT-002",
      designationId: "DSGN-004",
      seatNumber: 0,
    },
    compensation: {
      currency: "USD",
      salaryStructure: {
        id: "SAL-108",
        employeeId: "EMP-108",
        components: [{ id: "BASIC", name: "Basic Salary", type: "fixed", taxable: true, amount: 3500 }],
        totalMonthly: 3500,
        totalAnnual: 42000,
        ctc: 45000,
        employerContributions: { pf: 420, esi: 140, gratuity: 168 },
        currency: "USD",
        effectiveFrom: "2023-03-01",
        isActive: true,
        createdAt: "2023-03-01",
        updatedAt: "2023-03-01"
      },
      salaryHistory: []
    },
    onboarding: {
      contractSigned: true,
      trainingAssigned: true,
      trainingCompleted: true,
      welcomeEmailSent: true,
      feedbackSubmitted: true,
      tasksStatus: {},
      tasksCompleted: []
    },
    exit: {
      resignationAccepted: true,
      assetHandover: true,
      ndaRenewed: true,
      finalSettlement: true,
      exitInterview: true
    }
  }
];

export const INITIAL_ATTENDANCE: AttendanceRecord[] = [
  // 2026-07-10 - Full Day & normal check-ins
  { id: "ATT-001", employeeId: "EMP-101", employeeName: "Eliyah Humail", date: "2026-07-10", checkIn: "08:52", checkOut: "18:05", lateMinutes: 0, earlyDepartureMinutes: 0, status: "Full Day" },
  { id: "ATT-002", employeeId: "EMP-102", employeeName: "Sarah Jenkins", date: "2026-07-10", checkIn: "08:45", checkOut: "18:00", lateMinutes: 0, earlyDepartureMinutes: 0, status: "Full Day" },
  { id: "ATT-003", employeeId: "EMP-103", employeeName: "Arsalan Khan", date: "2026-07-10", checkIn: "09:02", checkOut: "18:15", lateMinutes: 0, earlyDepartureMinutes: 0, status: "Full Day" },
  { id: "ATT-004", employeeId: "EMP-104", employeeName: "Michael Chen", date: "2026-07-10", checkIn: "09:12", checkOut: "18:00", lateMinutes: 7, earlyDepartureMinutes: 0, status: "Full Day" }, // Late (9:05 cut) -> 7 minutes late
  { id: "ATT-005", employeeId: "EMP-105", employeeName: "Zoya Patel", date: "2026-07-10", checkIn: "08:50", checkOut: "15:30", lateMinutes: 0, earlyDepartureMinutes: 145, status: "Half Day" }, // Worked 6h40m, but left before 17:55 (5:55 PM is 17:55). Early departure = 145m. Left early.
  { id: "ATT-006", employeeId: "EMP-106", employeeName: "David Miller", date: "2026-07-10", checkIn: "08:58", checkOut: "18:02", lateMinutes: 0, earlyDepartureMinutes: 0, status: "Full Day" },

  // 2026-07-11 - Weekend / Some worked or absent
  { id: "ATT-007", employeeId: "EMP-101", employeeName: "Eliyah Humail", date: "2026-07-11", checkIn: "09:30", checkOut: "13:00", lateMinutes: 25, earlyDepartureMinutes: 295, status: "Half Day" }, // Worked 3.5h (<4h) -> Half Day / Absent

  // 2026-07-12 - Sunday - Absents
  
  // 2026-07-13 (Today) - Real-time Checkins (updated dynamically)
  { id: "ATT-101", employeeId: "EMP-101", employeeName: "Eliyah Humail", date: "2026-07-13", checkIn: "08:48", checkOut: "", lateMinutes: 0, earlyDepartureMinutes: 0, status: "Full Day" },
  { id: "ATT-102", employeeId: "EMP-102", employeeName: "Sarah Jenkins", date: "2026-07-13", checkIn: "08:55", checkOut: "", lateMinutes: 0, earlyDepartureMinutes: 0, status: "Full Day" },
  { id: "ATT-103", employeeId: "EMP-103", employeeName: "Arsalan Khan", date: "2026-07-13", checkIn: "09:14", checkOut: "", lateMinutes: 9, earlyDepartureMinutes: 0, status: "Full Day" }, // 9 mins late
  { id: "ATT-104", employeeId: "EMP-104", employeeName: "Michael Chen", date: "2026-07-13", checkIn: "08:59", checkOut: "", lateMinutes: 0, earlyDepartureMinutes: 0, status: "Full Day" },
  { id: "ATT-105", employeeId: "EMP-105", employeeName: "Zoya Patel", date: "2026-07-13", checkIn: "10:30", checkOut: "13:45", lateMinutes: 85, earlyDepartureMinutes: 250, status: "Half Day" }, // Worked 3.25 hrs (less than 4 hours worked) -> Half Day
];

export const SCREENING_QUESTIONS: { index: number; question: string; category: string }[] = [
  { index: 1, question: "Tell me about your experience managing human resources or technical teams.", category: "Leadership" },
  { index: 2, question: "How do you handle conflict resolution between employees?", category: "Conflict Management" },
  { index: 3, question: "What is your process for designing and implementing payroll systems?", category: "Technical Skill" },
  { index: 4, question: "How do you ensure company policies align with local labor laws?", category: "Compliance" },
  { index: 5, question: "Describe a successful employee recruitment campaign you orchestrated.", category: "Recruitment" },
  { index: 6, question: "How do you maintain accurate records of employee performance and training?", category: "Administration" },
  { index: 7, question: "What strategies do you use to foster positive employee engagement?", category: "Culture" },
  { index: 8, question: "Describe a situation where you had to manage an difficult exit or termination process.", category: "Offboarding" },
  { index: 9, question: "How comfortable are you using modern HRIS platforms and spreadsheets?", category: "Tech Savviness" },
  { index: 10, question: "Why are you interested in joining Humail Eli, and what value do you bring?", category: "Cultural Fit" },
];

export const INITIAL_CANDIDATES: Candidate[] = [
  {
    id: "CAN-001",
    name: "Alex Johnson",
    email: "alex.johnson@example.com",
    phone: "+92 300 9988776",
    skills: ["Recruiting", "Payroll", "Labor Law", "Excel"],
    experienceYears: 4,
    resumeFileName: "alex_johnson_hr_resume.pdf",
    status: "Shortlisted",
  },
  {
    id: "CAN-002",
    name: "Hamza Malik",
    email: "hamza.malik@example.com",
    phone: "+92 345 5566778",
    skills: ["TypeScript", "React", "NodeJS", "MongoDB"],
    experienceYears: 5,
    resumeFileName: "hamza_malik_dev_resume.pdf",
    status: "Invited",
    screeningScores: {
      1: 8, 2: 9, 3: 7, 4: 8, 5: 7, 6: 9, 7: 8, 8: 8, 9: 10, 10: 9
    },
    screeningTotalScore: 83,
    whatsappSent: true
  },
  {
    id: "CAN-003",
    name: "Jessica Smith",
    email: "jess.smith@example.com",
    phone: "+1 (555) 019-3321",
    skills: ["Sourcing", "Onboarding", "Conflict Resolution"],
    experienceYears: 2, // Less than 3 years, not shortlisted by rule!
    resumeFileName: "jessica_smith_resume.docx",
    status: "Parsed"
  },
  {
    id: "CAN-004",
    name: "Syed Bilal",
    email: "bilal.s@example.com",
    phone: "+92 312 4433221",
    skills: ["HRIS", "Compliance", "Benefits Administration", "Labor Law"],
    experienceYears: 6,
    resumeFileName: "syed_bilal_hr_manager.pdf",
    status: "Screened",
    screeningScores: {
      1: 7, 2: 8, 3: 8, 4: 9, 5: 6, 6: 7, 7: 8, 8: 7, 9: 8, 10: 7
    },
    screeningTotalScore: 75,
    whatsappSent: false
  },
  {
    id: "CAN-005",
    name: "Emily Watson",
    email: "emily.w@example.com",
    phone: "+44 7911 123456",
    skills: ["Talent Acquisition", "Technical Recruiting", "LinkedIn Recruiter"],
    experienceYears: 3,
    resumeFileName: "emily_watson_cv.pdf",
    status: "Shortlisted"
  }
];

export const DEFAULT_ATTENDANCE_RULES: AttendanceRules = {
  lateThreshold: "09:05",
  earlyDepartureThreshold: "17:55",
  halfDayHours: 4,
  fullDayHours: 8,
  gracePeriodMinutes: 5
};

export const DEFAULT_PAYROLL_RULES: PayrollRules = {
  perfectAttendanceBonus: 150,
  latePenalty: 5,
  halfDayDeduction: 50,
  absentPenalty: 100,
  overtimeRate: 1.5,
  taxRate: 10,
  socialSecurityRate: 5,
  healthInsuranceDeduction: 50
};

export const DEFAULT_RECRUITMENT_RULES: RecruitmentRules = {
  minExperienceYears: 3,
  minScreeningScore: 70,
  screeningQuestionsCount: 10,
  whatsAppMessageTemplate: "Dear {name},\n\nCongratulations! Based on your AI screening results, you have been selected for the next round.\n\nInterview Date: {date}\nInterview Time: {time}\nInterviewer: {interviewer}\n\nPlease confirm your availability.\n\nBest regards,\n{company_name} HR Team"
};

export const DEFAULT_COMPANY_SETTINGS: CompanySettings = {
  companyName: "Humail Eli",
  companyEmail: "hr@humaileli.com",
  companyPhone: "+92 300 1234567",
  companyAddress: "",
  workStartTime: "09:00",
  workEndTime: "18:00",
  weekends: ["Saturday", "Sunday"],
  publicHolidays: [],
  baseCurrency: "USD"
};

export const DEFAULT_SETTINGS: AppSettings = {
  isMockMode: true,
  storageType: 'local',
  
  database: {
    mysql: {
      host: 'localhost',
      port: 3306,
      database: 'humail_eli_hrm',
      username: 'admin',
      ssl: false,
      poolSize: 10,
      timeout: 10000,
    },
    postgres: {
      host: 'localhost',
      port: 5432,
      database: 'humail_eli_hrm',
      username: 'postgres',
      ssl: false,
      poolSize: 10,
      timeout: 10000,
    },
  },

  googleSheets: {
    spreadsheetId: "1-HumailEli_HRM_Spreadsheet_ID_Placeholder",
    attendanceSheet: "HumailEli_Attendance",
    payrollSheet: "HumailEli_Payroll",
    recruitmentSheet: "HumailEli_Recruitment",
    leaveSheet: "HumailEli_Leaves",
    employeeSheet: "HumailEli_Employees",
    documentsSheet: "HumailEli_Employee_Documents",
    successionSheet: "HumailEli_Succession",
    onboardingTasksSheet: "HumailEli_OnboardingTasks",
    orgChartSheet: "HumailEli_Org_Chart",
    hiresSheet: "HumailEli_Hires",
    reviewTemplatesSheet: "HumailEli_Review_Templates",
    performanceReviewsSheet: "HumailEli_Performance_Reviews",
    interviewScheduleSheet: "HumailEli_Interview_Schedule",
    leavePoliciesSheet: "HumailEli_Leave_Policies",
    leaveTypeConfigsSheet: "HumailEli_Leave_Type_Configs",
    payslipsSheet: "HumailEli_Payslips",
    notificationsSheet: "HumailEli_Notifications",
    shiftsSheet: "HumailEli_Shifts",
    shiftAssignmentsSheet: "HumailEli_Shift_Assignments",
    shiftSwapRequestsSheet: "HumailEli_Shift_Swap_Requests",
    shiftTemplatesSheet: "HumailEli_Shift_Templates",
    currenciesSheet: "HumailEli_Currencies",
    taxRulesSheet: "HumailEli_Tax_Rules",
    statutoryDeductionsSheet: "HumailEli_Statutory_Deductions",
    payrollCalculationsSheet: "HumailEli_Payroll_Calculations",
    reviewCyclesSheet: "HumailEli_Review_Cycles",
    usersSheet: "HumailEli_Users",
    loginSessionsSheet: "HumailEli_Login_Sessions",
    passwordResetsSheet: "HumailEli_Password_Resets",
    departmentsSheet: "HumailEli_Departments",
    statusHistorySheet: "HumailEli_Status_History",
    designationsSheet: "HumailEli_Designations",
    whatsappMessagesSheet: "HumailEli_WhatsApp_Messages",
    whatsappTemplatesSheet: "HumailEli_WhatsApp_Templates",
    whatsappConversationsSheet: "HumailEli_WhatsApp_Conversations",
    driveFolderId: "drive_folder_id_resumes_placeholder",
  },

  ai: {
    provider: 'none',
    apiKey: '',
    customEndpoint: '',
    enableResumeParsing: false,
    enableScreening: false,
    enableJDMatching: false,
    enableAnalytics: false,
  },

  whatsApp: {
    apiUrl: "https://api.whatsapp-gateway.com/send",
  },

  biometric: {
    apiUrl: "https://api.humaileli-hrm.com/v1/biometrics/sync",
  },

  attendanceRules: DEFAULT_ATTENDANCE_RULES,
  payrollRules: DEFAULT_PAYROLL_RULES,
  recruitmentRules: DEFAULT_RECRUITMENT_RULES,
  companySettings: DEFAULT_COMPANY_SETTINGS,
  statusRules: {
    enableStatusManagement: true,
    autoExpireOnLeave: false,
    autoExpireProbation: true,
    autoResignToTerminated: true,
    enableBulkStatusUpdate: true,
    allowRehireTerminated: false
  },
  auditTrailRules: {
    enableAuditTrail: true,
    trackAllFields: true,
    trackedFields: [],
    requireReason: false,
    requireReasonHighImpact: true,
    retentionPeriod: '7 years'
  },
};

export const INITIAL_ORG_CHART: OrgChartNode[] = [
  {
    id: 'node-ceo',
    positionName: 'Chief Executive Officer',
    department: 'Executive',
    employeeId: 'EMP-101',
    isCritical: true,
    riskLevel: 'High',
    successors: [],
    parentId: undefined,
    children: ['node-hrd', 'node-cto', 'node-md', 'node-sd']
  },
  {
    id: 'node-hrd',
    positionName: 'HR Director',
    department: 'Human Resources',
    employeeId: undefined,
    isCritical: true,
    riskLevel: 'High',
    successors: ['EMP-102'],
    parentId: 'node-ceo',
    children: ['node-hrs', 'node-hra']
  },
  {
    id: 'node-hrs',
    positionName: 'HR Specialist',
    department: 'Human Resources',
    employeeId: 'EMP-102',
    isCritical: false,
    riskLevel: 'Low',
    successors: [],
    parentId: 'node-hrd',
    children: []
  },
  {
    id: 'node-hra',
    positionName: 'HR Associate',
    department: 'Human Resources',
    employeeId: undefined,
    isCritical: false,
    riskLevel: 'Low',
    successors: [],
    parentId: 'node-hrd',
    children: []
  },
  {
    id: 'node-cto',
    positionName: 'Chief Technology Officer',
    department: 'Engineering',
    employeeId: undefined,
    isCritical: true,
    riskLevel: 'High',
    successors: ['EMP-103'],
    parentId: 'node-ceo',
    children: ['node-le', 'node-se', 'node-qe']
  },
  {
    id: 'node-le',
    positionName: 'Lead Software Engineer',
    department: 'Engineering',
    employeeId: 'EMP-103',
    isCritical: false,
    riskLevel: 'Low',
    successors: [],
    parentId: 'node-cto',
    children: []
  },
  {
    id: 'node-se',
    positionName: 'Senior Software Engineer',
    department: 'Engineering',
    employeeId: undefined,
    isCritical: false,
    riskLevel: 'Low',
    successors: [],
    parentId: 'node-cto',
    children: []
  },
  {
    id: 'node-qe',
    positionName: 'QA Engineer',
    department: 'Engineering',
    employeeId: 'EMP-107',
    isCritical: false,
    riskLevel: 'Low',
    successors: [],
    parentId: 'node-cto',
    children: []
  },
  {
    id: 'node-md',
    positionName: 'Marketing Director',
    department: 'Marketing',
    employeeId: 'EMP-105',
    isCritical: true,
    riskLevel: 'Medium',
    successors: [],
    parentId: 'node-ceo',
    children: ['node-mm', 'node-ma']
  },
  {
    id: 'node-mm',
    positionName: 'Marketing Manager',
    department: 'Marketing',
    employeeId: undefined,
    isCritical: false,
    riskLevel: 'Low',
    successors: [],
    parentId: 'node-md',
    children: []
  },
  {
    id: 'node-ma',
    positionName: 'Marketing Associate',
    department: 'Marketing',
    employeeId: undefined,
    isCritical: false,
    riskLevel: 'Low',
    successors: [],
    parentId: 'node-md',
    children: []
  },
  {
    id: 'node-sd',
    positionName: 'Sales Director',
    department: 'Sales',
    employeeId: undefined,
    isCritical: false,
    riskLevel: 'Low',
    successors: [],
    parentId: 'node-ceo',
    children: ['node-sx', 'node-sa']
  },
  {
    id: 'node-sx',
    positionName: 'Sales Executive',
    department: 'Sales',
    employeeId: 'EMP-108',
    isCritical: false,
    riskLevel: 'Low',
    successors: [],
    parentId: 'node-sd',
    children: []
  },
  {
    id: 'node-sa',
    positionName: 'Sales Associate',
    department: 'Sales',
    employeeId: undefined,
    isCritical: false,
    riskLevel: 'Low',
    successors: [],
    parentId: 'node-sd',
    children: []
  }
];

export const INITIAL_DEPARTMENTS: Department[] = [
  {
    id: "DEPT-001",
    name: "Executive",
    code: "EXEC",
    description: "Executive Leadership Team overseeing organization strategy and growth.",
    headId: "EMP-101",
    headName: "Eliyah Humail",
    location: "Executive Suite, Islamabad",
    budget: 500000,
    costCenter: "CC-EXEC",
    employeeCount: 1,
    isActive: true,
    createdAt: "2024-01-15T00:00:00.000Z",
    updatedAt: "2024-01-15T00:00:00.000Z"
  },
  {
    id: "DEPT-002",
    name: "Human Resources",
    code: "HR",
    description: "Talent acquisition, management, payroll, and organizational development.",
    headId: "EMP-102",
    headName: "Sarah Jenkins",
    location: "Floor 2, Room 204",
    budget: 120000,
    costCenter: "CC-HR",
    employeeCount: 1,
    isActive: true,
    createdAt: "2024-01-15T00:00:00.000Z",
    updatedAt: "2024-01-15T00:00:00.000Z"
  },
  {
    id: "DEPT-003",
    name: "Engineering",
    code: "ENG",
    description: "Software engineering, product development, quality assurance, and IT operations.",
    headId: "EMP-103",
    headName: "Arsalan Khan",
    location: "Floor 3, Engineering Wing",
    budget: 800000,
    costCenter: "CC-ENG",
    employeeCount: 2,
    isActive: true,
    createdAt: "2024-01-15T00:00:00.000Z",
    updatedAt: "2024-01-15T00:00:00.000Z"
  },
  {
    id: "DEPT-004",
    name: "Design",
    code: "DES",
    description: "Visual design, user experience research, UI layout and graphics.",
    headId: "EMP-104",
    headName: "Michael Chen",
    location: "Floor 2, Creative Lab",
    budget: 90000,
    costCenter: "CC-DES",
    employeeCount: 1,
    isActive: true,
    createdAt: "2024-02-15T00:00:00.000Z",
    updatedAt: "2024-02-15T00:00:00.000Z"
  },
  {
    id: "DEPT-005",
    name: "Marketing",
    code: "MKT",
    description: "Brand strategy, growth hacking, public relations, and advertising campaigns.",
    headId: "EMP-105",
    headName: "Zoya Patel",
    location: "Floor 2, Marketing Desk",
    budget: 150000,
    costCenter: "CC-MKT",
    employeeCount: 1,
    isActive: true,
    createdAt: "2024-01-15T00:00:00.000Z",
    updatedAt: "2024-01-15T00:00:00.000Z"
  },
  {
    id: "DEPT-006",
    name: "Sales",
    code: "SAL",
    description: "Business development, customer success, and client acquisitions.",
    location: "Floor 1, Sales Hub",
    budget: 200000,
    costCenter: "CC-SAL",
    employeeCount: 1,
    isActive: true,
    createdAt: "2024-01-15T00:00:00.000Z",
    updatedAt: "2024-01-15T00:00:00.000Z"
  },
  {
    id: "DEPT-007",
    name: "Finance",
    code: "FIN",
    description: "Accounting, cashflow auditing, taxations, and payroll budgeting.",
    location: "Floor 4, Finance Dept",
    budget: 100000,
    costCenter: "CC-FIN",
    employeeCount: 0,
    isActive: true,
    createdAt: "2024-01-15T00:00:00.000Z",
    updatedAt: "2024-01-15T00:00:00.000Z"
  },
  {
    id: "DEPT-008",
    name: "Operations",
    code: "OPS",
    description: "General facility management, logistics, and resource allocations.",
    location: "Ground Floor, Ops Desk",
    budget: 80000,
    costCenter: "CC-OPS",
    employeeCount: 0,
    isActive: true,
    createdAt: "2024-01-15T00:00:00.000Z",
    updatedAt: "2024-01-15T00:00:00.000Z"
  }
];

export const INITIAL_DESIGNATIONS: Designation[] = [
  {
    id: "DSGN-001",
    name: "Chief Executive Officer",
    code: "CEO",
    description: "Highest-ranking corporate officer responsible for overall organization decisions.",
    departmentId: "DEPT-001",
    level: 10,
    category: "Executive",
    minSalary: 10000,
    maxSalary: 25000,
    isActive: true,
    createdAt: "2024-01-15T00:00:00.000Z",
    updatedAt: "2024-01-15T00:00:00.000Z"
  },
  {
    id: "DSGN-002",
    name: "Chief Technology Officer",
    code: "CTO",
    description: "Executive lead on technology roadmap, infrastructure, and engineering research.",
    departmentId: "DEPT-001",
    level: 10,
    category: "Executive",
    reportingToDesignationId: "DSGN-001",
    minSalary: 9000,
    maxSalary: 20000,
    isActive: true,
    createdAt: "2024-01-15T00:00:00.000Z",
    updatedAt: "2024-01-15T00:00:00.000Z"
  },
  {
    id: "DSGN-003",
    name: "HR Director",
    code: "HR-DIR",
    description: "Management lead for human resources strategy, benefits, and employee relations.",
    departmentId: "DEPT-002",
    level: 9,
    category: "Management",
    reportingToDesignationId: "DSGN-001",
    minSalary: 5000,
    maxSalary: 10000,
    isActive: true,
    createdAt: "2024-01-15T00:00:00.000Z",
    updatedAt: "2024-01-15T00:00:00.000Z"
  },
  {
    id: "DSGN-004",
    name: "Engineering Manager",
    code: "ENG-MGR",
    description: "Manager for technical execution, sprint planning, and people leadership in Engineering.",
    departmentId: "DEPT-003",
    level: 8,
    category: "Management",
    reportingToDesignationId: "DSGN-002",
    minSalary: 6000,
    maxSalary: 12000,
    isActive: true,
    createdAt: "2024-01-15T00:00:00.000Z",
    updatedAt: "2024-01-15T00:00:00.000Z"
  },
  {
    id: "DSGN-005",
    name: "Lead Engineer",
    code: "LEAD-ENG",
    description: "Senior technical lead guiding software architecture, code reviews, and deployments.",
    departmentId: "DEPT-003",
    level: 6,
    category: "Senior Staff",
    reportingToDesignationId: "DSGN-004",
    minSalary: 5000,
    maxSalary: 9500,
    isActive: true,
    createdAt: "2024-01-15T00:00:00.000Z",
    updatedAt: "2024-01-15T00:00:00.000Z"
  },
  {
    id: "DSGN-006",
    name: "Senior Engineer",
    code: "SR-ENG",
    description: "Experienced software engineer driving complex features and component designs.",
    departmentId: "DEPT-003",
    level: 5,
    category: "Senior Staff",
    reportingToDesignationId: "DSGN-005",
    minSalary: 4000,
    maxSalary: 7500,
    isActive: true,
    createdAt: "2024-01-15T00:00:00.000Z",
    updatedAt: "2024-01-15T00:00:00.000Z"
  },
  {
    id: "DSGN-007",
    name: "Software Engineer",
    code: "ENG",
    description: "Individual contributor developing software features, testing, and documentation.",
    departmentId: "DEPT-003",
    level: 3,
    category: "Staff",
    reportingToDesignationId: "DSGN-005",
    minSalary: 3000,
    maxSalary: 5500,
    isActive: true,
    createdAt: "2024-01-15T00:00:00.000Z",
    updatedAt: "2024-01-15T00:00:00.000Z"
  },
  {
    id: "DSGN-008",
    name: "Junior Engineer",
    code: "JR-ENG",
    description: "Entry-level developer learning team processes and implementing basic features.",
    departmentId: "DEPT-003",
    level: 2,
    category: "Entry Level",
    reportingToDesignationId: "DSGN-004",
    minSalary: 2000,
    maxSalary: 3500,
    isActive: true,
    createdAt: "2024-01-15T00:00:00.000Z",
    updatedAt: "2024-01-15T00:00:00.000Z"
  },
  {
    id: "DSGN-009",
    name: "Intern",
    code: "INT",
    description: "Temporary student or recent graduate placement receiving training and project tasks.",
    departmentId: "DEPT-003",
    level: 1,
    category: "Intern",
    reportingToDesignationId: "DSGN-004",
    minSalary: 1000,
    maxSalary: 1800,
    isActive: true,
    createdAt: "2024-01-15T00:00:00.000Z",
    updatedAt: "2024-01-15T00:00:00.000Z"
  }
];

export const INITIAL_DOCUMENTS: EmployeeDocument[] = [
  {
    id: "DOC-001",
    employeeId: "EMP-101",
    employeeName: "Eliyah Humail",
    documentType: "CNIC_FRONT",
    documentTypeLabel: "CNIC Front",
    fileName: "eliyah_cnic_front.jpg",
    fileSize: 245000,
    fileType: "image/jpeg",
    fileUrl: "https://drive.google.com/file/d/xxxxx/view",
    driveFileId: "xxxxx",
    uploadedBy: "EMP-101",
    uploadedByName: "Eliyah Humail",
    uploadedAt: "2024-01-15",
    isVerified: true,
    verifiedBy: "EMP-102",
    verifiedByName: "Sarah Jenkins",
    verifiedAt: "2024-01-16",
    expiryDate: "2029-01-14",
    notes: "CNIC front image verified.",
    tags: ["identity", "official"],
    version: 1,
    status: "Verified",
    parentDocumentId: undefined
  },
  {
    id: "DOC-002",
    employeeId: "EMP-106",
    employeeName: "David Miller",
    documentType: "EMPLOYMENT_CONTRACT",
    documentTypeLabel: "Employment Contract",
    fileName: "david_miller_contract.pdf",
    fileSize: 1500000,
    fileType: "application/pdf",
    fileUrl: "https://drive.google.com/file/d/yyyyy/view",
    driveFileId: "yyyyy",
    uploadedBy: "EMP-102",
    uploadedByName: "Sarah Jenkins",
    uploadedAt: "2026-07-01",
    isVerified: true,
    verifiedBy: "EMP-102",
    verifiedByName: "Sarah Jenkins",
    verifiedAt: "2026-07-01",
    expiryDate: "2027-07-14",
    notes: "Signed employment contract for 1-year probation period.",
    tags: ["contract", "probation"],
    version: 1,
    status: "Verified",
    parentDocumentId: undefined
  }
];


export const INITIAL_JOB_DESCRIPTIONS: JobDescription[] = [
  {
    id: "JD-001",
    title: "Senior Software Engineer",
    department: "Engineering",
    location: "Remote",
    employmentType: "Full-time",
    experienceLevel: "Senior Level",
    minSalary: 120000,
    maxSalary: 160000,
    currency: "USD",
    postingDate: "2026-07-01",
    isActive: true,
    summary: "We are looking for an experienced Senior Software Engineer to build scalable web applications.",
    responsibilities: [
      "Architect and develop full-stack applications",
      "Mentor junior developers",
      "Participate in code reviews"
    ],
    requirements: [
      { id: "req-1", category: "Skill", name: "JavaScript", isRequired: true, weight: 20, priority: "Must Have" },
      { id: "req-2", category: "Skill", name: "React", isRequired: true, weight: 20, priority: "Must Have" },
      { id: "req-3", category: "Skill", name: "Node.js", isRequired: true, weight: 20, priority: "Must Have" },
      { id: "req-4", category: "Skill", name: "AWS", isRequired: false, weight: 10, priority: "Preferred" },
      { id: "req-5", category: "Experience", name: "Software Development", isRequired: true, weight: 30, minValue: 5, priority: "Must Have" }
    ],
    benefits: ["Health Insurance", "401k", "Unlimited PTO"],
    evaluationDimensions: [
      {
        id: "dim-1",
        name: "Technical Skills",
        description: "Core programming and system design.",
        weight: 40,
        questions: []
      },
      {
        id: "dim-2",
        name: "Communication",
        description: "Ability to explain technical concepts.",
        weight: 30,
        questions: []
      },
      {
        id: "dim-3",
        name: "Cultural Fit",
        description: "Alignment with company values.",
        weight: 30,
        questions: []
      }
    ],
    hiringManagerId: "EMP-001",
    recruitingLeadId: "EMP-002",
    interviewers: ["EMP-001", "EMP-003"],
    workflowStages: ["Applied", "Screening", "Interview", "Offer", "Hired"],
    autoAdvance: false,
    requireApprovalForHire: true,
    totalApplications: 12,
    candidatesInPipeline: 3,
    averageTimeToHire: 0,
    createdAt: "2026-07-01T00:00:00Z",
    updatedAt: "2026-07-01T00:00:00Z",
    createdBy: "EMP-002"
  },
  {
    id: "JD-002",
    title: "Marketing Manager",
    department: "Marketing",
    location: "New York, NY",
    employmentType: "Full-time",
    experienceLevel: "Mid Level",
    minSalary: 80000,
    maxSalary: 110000,
    currency: "USD",
    postingDate: "2026-07-05",
    isActive: true,
    summary: "Seeking a creative Marketing Manager to drive our digital campaigns.",
    responsibilities: [
      "Develop digital marketing strategies",
      "Manage social media presence",
      "Analyze campaign performance"
    ],
    requirements: [
      { id: "req-1", category: "Skill", name: "Digital Marketing", isRequired: true, weight: 30, priority: "Must Have" },
      { id: "req-2", category: "Skill", name: "SEO", isRequired: true, weight: 20, priority: "Must Have" },
      { id: "req-3", category: "Skill", name: "Content Strategy", isRequired: true, weight: 20, priority: "Must Have" },
      { id: "req-4", category: "Experience", name: "Marketing", isRequired: true, weight: 30, minValue: 3, priority: "Must Have" }
    ],
    benefits: ["Health Insurance", "Remote Work Options", "Gym Membership"],
    evaluationDimensions: [
      {
        id: "dim-1",
        name: "Marketing Expertise",
        description: "Knowledge of marketing principles.",
        weight: 35,
        questions: []
      },
      {
        id: "dim-2",
        name: "Communication",
        description: "Verbal and written communication.",
        weight: 35,
        questions: []
      },
      {
        id: "dim-3",
        name: "Cultural Fit",
        description: "Team collaboration and values.",
        weight: 30,
        questions: []
      }
    ],
    hiringManagerId: "EMP-002",
    recruitingLeadId: "EMP-004",
    interviewers: ["EMP-002"],
    workflowStages: ["Applied", "Under Review", "Interview", "Offer", "Hired"],
    autoAdvance: true,
    requireApprovalForHire: false,
    totalApplications: 25,
    candidatesInPipeline: 5,
    averageTimeToHire: 0,
    createdAt: "2026-07-05T00:00:00Z",
    updatedAt: "2026-07-05T00:00:00Z",
    createdBy: "EMP-004"
  },
  {
    id: "JD-003",
    title: "HR Specialist",
    department: "Human Resources",
    location: "London, UK",
    employmentType: "Full-time",
    experienceLevel: "Entry Level",
    minSalary: 50000,
    maxSalary: 65000,
    currency: "GBP",
    postingDate: "2026-07-10",
    isActive: true,
    summary: "Looking for an HR Specialist to assist with recruitment and employee relations.",
    responsibilities: [
      "Assist with full-cycle recruiting",
      "Manage payroll operations",
      "Ensure labor law compliance"
    ],
    requirements: [
      { id: "req-1", category: "Skill", name: "Recruitment", isRequired: true, weight: 30, priority: "Must Have" },
      { id: "req-2", category: "Skill", name: "Payroll", isRequired: true, weight: 20, priority: "Must Have" },
      { id: "req-3", category: "Skill", name: "Labor Law", isRequired: true, weight: 20, priority: "Must Have" },
      { id: "req-4", category: "Experience", name: "HR Operations", isRequired: true, weight: 30, minValue: 2, priority: "Must Have" }
    ],
    benefits: ["Health Insurance", "Pension Plan", "Training Budget"],
    evaluationDimensions: [
      {
        id: "dim-1",
        name: "Technical Knowledge",
        description: "HR processes and laws.",
        weight: 30,
        questions: []
      },
      {
        id: "dim-2",
        name: "Communication",
        description: "Interpersonal skills.",
        weight: 40,
        questions: []
      },
      {
        id: "dim-3",
        name: "Cultural Fit",
        description: "Empathy and alignment.",
        weight: 30,
        questions: []
      }
    ],
    hiringManagerId: "EMP-003",
    recruitingLeadId: "EMP-004",
    interviewers: ["EMP-003"],
    workflowStages: ["Applied", "Screening", "Interview", "Offer", "Hired"],
    autoAdvance: false,
    requireApprovalForHire: true,
    totalApplications: 8,
    candidatesInPipeline: 2,
    averageTimeToHire: 0,
    createdAt: "2026-07-10T00:00:00Z",
    updatedAt: "2026-07-10T00:00:00Z",
    createdBy: "EMP-004"
  }
];

export const INITIAL_STAGE_TEMPLATES: import('../types').StageTemplate[] = [
  {
    id: 'st_init_screen',
    name: 'Initial Screening',
    description: 'First round behavioral and communication screening.',
    order: 1,
    isDefault: true,
    questions: [
      {
        id: 'sq_1',
        question: 'Tell me about yourself and your background.',
        description: 'General introduction.',
        category: 'Behavioral',
        type: 'Voice',
        isRequired: true,
        weight: 20,
        scoringRubric: {
          1: 'Unclear, rambling, or irrelevant.',
          2: 'Somewhat structured but lacks focus.',
          3: 'Clear and relevant background summary.',
          4: 'Strong, concise, highlights key achievements.',
          5: 'Exceptional, highly engaging and perfectly aligned.'
        }
      },
      {
        id: 'sq_2',
        question: 'Why are you interested in this role?',
        description: 'Motivation and alignment.',
        category: 'General',
        type: 'Text',
        isRequired: true,
        weight: 20,
        scoringRubric: {
          1: 'No clear reason.',
          2: 'Generic reasons, lack of research.',
          3: 'Good understanding of the role.',
          4: 'Strong alignment with company goals.',
          5: 'Deep passion and perfect alignment.'
        }
      }
    ],
    evaluationDimensions: [
      {
        id: 'ed_comm',
        name: 'Communication Skills',
        description: 'Clarity and structure of answers.',
        weight: 50,
        questionIds: ['sq_1']
      },
      {
        id: 'ed_mot',
        name: 'Motivation',
        description: 'Alignment with the role.',
        weight: 50,
        questionIds: ['sq_2']
      }
    ],
    passingScore: 70,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'st_tech_assess',
    name: 'Technical Assessment',
    description: 'Technical and problem solving evaluation.',
    order: 2,
    isDefault: true,
    questions: [],
    evaluationDimensions: [],
    passingScore: 75,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'st_mgr_round',
    name: 'Manager Round',
    description: 'Leadership and strategic thinking.',
    order: 3,
    isDefault: true,
    questions: [],
    evaluationDimensions: [],
    passingScore: 80,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'st_hr_round',
    name: 'HR Round',
    description: 'Cultural fit and career goals.',
    order: 4,
    isDefault: true,
    questions: [],
    evaluationDimensions: [],
    passingScore: 70,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'st_final_panel',
    name: 'Final Panel',
    description: 'Executive and vision focused.',
    order: 5,
    isDefault: true,
    questions: [],
    evaluationDimensions: [],
    passingScore: 85,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const INITIAL_SCORECARDS: import('../types').EvaluationScorecard[] = [];
export const INITIAL_INTERVIEW_PANELS: import('../types').InterviewPanel[] = [];

export const DEFAULT_LEAVE_POLICIES: LeavePolicy[] = [
  {
    id: 'LP-001',
    name: 'Annual Leave Policy',
    description: 'Standard annual leave for all employees.',
    isDefault: true,
    isActive: true,
    appliesToDepartments: [],
    appliesToRoles: [],
    appliesToEmploymentTypes: ['Permanent', 'Contract'],
    accrualFrequency: 'Monthly',
    accrualDayOfMonth: 1,
    accrualStartDate: new Date().toISOString().split('T')[0],
    carryOverEnabled: true,
    carryOverLimit: 10,
    carryOverExpiryMonths: 6,
    requireManagerApproval: true,
    requireHRApproval: false,
    requireMultipleApprovals: false,
    additionalApprovers: [],
    maxConsecutiveDays: 15,
    minDaysBeforeLeave: 2,
    blackoutDates: [],
    encashmentAllowed: true,
    encashmentLimit: 5,
    encashmentRate: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'system',
  },
  {
    id: 'LP-002',
    name: 'Sick Leave Policy',
    description: 'Sick leave with medical certificate requirement.',
    isDefault: false,
    isActive: true,
    appliesToDepartments: [],
    appliesToRoles: [],
    appliesToEmploymentTypes: ['Permanent', 'Contract', 'Intern'],
    accrualFrequency: 'Yearly',
    accrualDayOfMonth: 1,
    accrualStartDate: new Date().toISOString().split('T')[0],
    carryOverEnabled: false,
    carryOverLimit: 0,
    carryOverExpiryMonths: 0,
    requireManagerApproval: true,
    requireHRApproval: false,
    requireMultipleApprovals: false,
    additionalApprovers: [],
    maxConsecutiveDays: 7,
    minDaysBeforeLeave: 0,
    blackoutDates: [],
    encashmentAllowed: false,
    encashmentLimit: 0,
    encashmentRate: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'system',
  },
];

