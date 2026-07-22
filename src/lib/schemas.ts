import { z } from 'zod';

// --- EMPLOYEE ---
export const EmployeeSchema = z.object({
  id: z.string().min(1).max(50),
  name: z.string().min(1).max(100),
  email: z.string().email().max(255).optional(),
  phone: z.string().max(20).optional(),
  role: z.string().max(50).default('Employee'),
  department: z.string().max(100).optional(),
  baseSalary: z.number().min(0).default(0),
  joiningDate: z.string().max(10).optional(),
  leaveStartDate: z.string().max(10).optional(),
  leaveEndDate: z.string().max(10).optional(),
  suspensionStartDate: z.string().max(10).optional(),
  suspensionReason: z.string().max(500).optional(),
  resignationDate: z.string().max(10).optional(),
  lastWorkingDate: z.string().max(10).optional(),
  retirementDate: z.string().max(10).optional(),
  terminationDate: z.string().max(10).optional(),
  terminationReason: z.string().max(500).optional(),
  contractStartDate: z.string().max(10).optional(),
  contractEndDate: z.string().max(10).optional(),
  status: z.enum(['Active', 'Onboarding', 'On Leave', 'Suspended', 'Probation', 'Resigned', 'Retired', 'Deceased', 'Contract Expired', 'Terminated']).default('Active'),
  seatNumber: z.number().int().min(0).default(0),
  punchCode: z.string().max(50).optional(),
  personal: z.object({
    name: z.string().max(100).optional(),
    email: z.string().email().max(255).optional(),
    phone: z.string().max(20).optional(),
    dateOfBirth: z.string().max(10).optional(),
    gender: z.string().max(20).optional(),
    maritalStatus: z.string().max(20).optional(),
    personalEmail: z.string().email().max(255).optional(),
    phonePersonal: z.string().max(20).optional(),
    cnic: z.string().max(20).optional(),
    passportNumber: z.string().max(30).optional(),
    nationality: z.string().max(50).optional(),
    address: z.string().max(500).optional(),
    emergencyContactName: z.string().max(100).optional(),
    emergencyContactPhone: z.string().max(20).optional(),
    profileImage: z.string().max(500).optional(),
  }).optional(),
  employment: z.object({
    joiningDate: z.string().max(10).optional(),
    status: z.string().max(50).optional(),
    designationId: z.string().max(50).optional(),
    departmentId: z.string().max(50).optional(),
    employmentType: z.string().max(50).optional(),
    workLocation: z.string().max(100).optional(),
    shift: z.string().max(50).optional(),
    seatNumber: z.number().int().min(0).optional(),
    role: z.string().max(50).optional(),
    punchCode: z.string().max(50).optional(),
    reportingManagerId: z.string().max(50).optional(),
    probationEndDate: z.string().max(10).optional(),
    confirmationDate: z.string().max(10).optional(),
    contractStartDate: z.string().max(10).optional(),
    contractEndDate: z.string().max(10).optional(),
    resignationDate: z.string().max(10).optional(),
    lastWorkingDate: z.string().max(10).optional(),
    terminationDate: z.string().max(10).optional(),
    terminationReason: z.string().max(500).optional(),
  }).optional(),
  compensation: z.object({
    payGradeId: z.string().max(50).optional(),
    currency: z.string().max(10).optional(),
    baseSalary: z.number().min(0).optional(),
    salaryStructureJson: z.string().max(5000).optional(),
  }).optional(),
  onboarding: z.object({
    contractSigned: z.boolean().optional(),
    trainingAssigned: z.boolean().optional(),
    trainingCompleted: z.boolean().optional(),
    welcomeEmailSent: z.boolean().optional(),
    feedbackSubmitted: z.boolean().optional(),
  }).optional(),
}).superRefine((employee, ctx) => {
  const status = employee.status;
  const employment = employee.employment;
  const requiredByStatus: Record<string, string[]> = {
    'On Leave': ['leaveStartDate', 'leaveEndDate'],
    Suspended: ['suspensionStartDate', 'suspensionReason'],
    Resigned: ['resignationDate', 'lastWorkingDate'],
    Retired: ['retirementDate'],
    Terminated: ['terminationDate', 'terminationReason'],
    'Contract Expired': ['contractEndDate'],
  };
  const required = requiredByStatus[status] || [];
  for (const field of required) {
    if (!(employee as Record<string, unknown>)[field] && !(employment as Record<string, unknown> | undefined)?.[field]) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: [field], message: `${field} is required for status ${status}` });
    }
  }
  if (employment?.contractStartDate && employment.contractEndDate && employment.contractEndDate < employment.contractStartDate) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['employment', 'contractEndDate'], message: 'Contract end date must not precede contract start date' });
  }
});

// --- ATTENDANCE ---
export const AttendanceSchema = z.object({
  id: z.string().min(1).max(50),
  employeeId: z.string().min(1).max(50),
  employeeName: z.string().min(1).max(100),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).max(10),
  checkIn: z.string().max(10).optional(),
  checkOut: z.string().max(10).optional(),
  lateMinutes: z.number().int().min(0).default(0),
  earlyDepartureMinutes: z.number().int().min(0).default(0),
  status: z.enum(['Full Day', 'Half Day', 'Absent']).default('Full Day'),
  createdAt: z.string().max(30).optional(),
  updatedAt: z.string().max(30).optional(),
});

// --- PAYROLL ---
export const PayrollSchema = z.object({
  id: z.string().min(1).max(50),
  employeeId: z.string().min(1).max(50),
  employeeName: z.string().min(1).max(100),
  month: z.string().min(1).max(20),
  baseSalary: z.number().min(0).default(0),
  bonus: z.number().min(0).default(0),
  penalty: z.number().min(0).default(0),
  leaveDeductions: z.number().min(0).default(0),
  netSalary: z.number().min(0).default(0),
  status: z.enum(['Pending', 'Paid']).default('Pending'),
  calculatedAt: z.string().max(30).optional(),
  createdAt: z.string().max(30).optional(),
  updatedAt: z.string().max(30).optional(),
});

// --- LEAVE ---
export const LeaveSchema = z.object({
  id: z.string().min(1).max(50),
  employeeId: z.string().min(1).max(50),
  employeeName: z.string().min(1).max(100),
  leaveType: z.string().min(1).max(100),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).max(10),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).max(10),
  reason: z.string().max(1000).optional(),
  status: z.enum(['Pending', 'Approved', 'Rejected', 'Cancelled']).default('Pending'),
  approvedBy: z.string().max(100).optional(),
  approvedAt: z.string().max(30).optional(),
  createdAt: z.string().max(30).optional(),
  updatedAt: z.string().max(30).optional(),
});

// --- CANDIDATE ---
export const CandidateSchema = z.object({
  id: z.string().min(1).max(50),
  name: z.string().min(1).max(100),
  email: z.string().email().max(255).optional(),
  phone: z.string().max(20).optional(),
  skills: z.array(z.string().max(100)).default([]),
  experienceYears: z.number().min(0).default(0),
  resumeFileName: z.string().max(255).optional(),
  status: z.enum(['Applied', 'Shortlisted', 'Screened', 'Invited', 'Rejected', 'Hired', 'Parsed']).default('Applied'),
  screeningTotalScore: z.number().min(0).max(100).optional(),
  chatbotScore: z.number().min(0).max(100).optional(),
  videoScore: z.number().min(0).max(100).optional(),
  combinedScore: z.number().min(0).max(100).optional(),
  createdAt: z.string().max(30).optional(),
  updatedAt: z.string().max(30).optional(),
});

// --- DEPARTMENT ---
export const DepartmentSchema = z.object({
  id: z.string().min(1).max(50),
  name: z.string().min(1).max(100),
  code: z.string().max(20).optional(),
  description: z.string().max(500).optional(),
  headId: z.string().max(50).optional(),
  headName: z.string().max(100).optional(),
  parentDepartmentId: z.string().max(50).optional(),
  isActive: z.boolean().default(true),
  createdAt: z.string().max(30).optional(),
  updatedAt: z.string().max(30).optional(),
});

// --- DESIGNATION ---
export const DesignationSchema = z.object({
  id: z.string().min(1).max(50),
  name: z.string().min(1).max(100),
  code: z.string().max(20).optional(),
  description: z.string().max(500).optional(),
  departmentId: z.string().max(50).optional(),
  level: z.number().int().min(0).default(1),
  category: z.string().max(50).default('Staff'),
  isActive: z.boolean().default(true),
  createdAt: z.string().max(30).optional(),
  updatedAt: z.string().max(30).optional(),
});

// --- DOCUMENT ---
export const DocumentSchema = z.object({
  id: z.string().min(1).max(50),
  employeeId: z.string().min(1).max(50),
  employeeName: z.string().min(1).max(100),
  documentType: z.string().min(1).max(50),
  documentTypeLabel: z.string().max(100).optional(),
  fileName: z.string().min(1).max(255),
  fileSize: z.number().min(0).default(0),
  fileType: z.string().max(100).optional(),
  fileUrl: z.string().max(500).optional(),
  driveFileId: z.string().max(100).optional(),
  uploadedBy: z.string().max(50).optional(),
  uploadedByName: z.string().max(100).optional(),
  uploadedAt: z.string().max(30).optional(),
  isVerified: z.boolean().default(false),
  status: z.enum(['Pending Verification', 'Verified', 'Rejected']).default('Pending Verification'),
  notes: z.string().max(1000).optional(),
  tags: z.array(z.string().max(50)).default([]),
  version: z.number().int().min(1).default(1),
});

// --- SALARY STRUCTURE ---
export const SalaryStructureSchema = z.object({
  id: z.string().min(1).max(50),
  employeeId: z.string().min(1).max(50),
  components: z.array(z.object({
    id: z.string().max(50),
    name: z.string().max(100),
    type: z.enum(['fixed', 'variable']),
    taxable: z.boolean().default(true),
    amount: z.number().min(0),
  })).default([]),
  totalMonthly: z.number().min(0).default(0),
  totalAnnual: z.number().min(0).default(0),
  ctc: z.number().min(0).default(0),
  currency: z.string().max(10).default('USD'),
  isActive: z.boolean().default(true),
  effectiveFrom: z.string().max(10).optional(),
  effectiveTo: z.string().max(10).optional(),
  createdAt: z.string().max(30).optional(),
  updatedAt: z.string().max(30).optional(),
});

// --- Entity Map for Dynamic Validation ---
export const Schemas = {
  employee: EmployeeSchema,
  attendance: AttendanceSchema,
  payroll: PayrollSchema,
  leave: LeaveSchema,
  candidate: CandidateSchema,
  department: DepartmentSchema,
  designation: DesignationSchema,
  document: DocumentSchema,
  salaryStructure: SalaryStructureSchema,
};

export type EntityType = keyof typeof Schemas;
