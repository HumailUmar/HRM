import { z } from 'zod';

// --- EMPLOYEE ---
export const EmployeeSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  role: z.string().default('Employee'),
  department: z.string().optional(),
  baseSalary: z.number().min(0).default(0),
  joiningDate: z.string().optional(),
  status: z.string().default('Active'),
  seatNumber: z.number().int().min(0).default(0),
  punchCode: z.string().optional(),
  // nested objects
  personal: z.object({
    name: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    dateOfBirth: z.string().optional(),
    gender: z.enum(['Male', 'Female', 'Other']).optional(),
  }).optional(),
  employment: z.object({
    joiningDate: z.string().optional(),
    status: z.string().default('Active'),
    designationId: z.string().optional(),
    departmentId: z.string().optional(),
  }).optional(),
}).passthrough();

// --- ATTENDANCE ---
export const AttendanceSchema = z.object({
  id: z.string().min(1),
  employeeId: z.string().min(1),
  employeeName: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
  lateMinutes: z.number().int().min(0).default(0),
  earlyDepartureMinutes: z.number().int().min(0).default(0),
  status: z.enum(['Full Day', 'Half Day', 'Absent']).default('Full Day'),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
}).passthrough();

// --- PAYROLL ---
export const PayrollSchema = z.object({
  id: z.string().min(1),
  employeeId: z.string().min(1),
  employeeName: z.string().min(1),
  month: z.string().min(1),
  baseSalary: z.number().min(0).default(0),
  bonus: z.number().min(0).default(0),
  penalty: z.number().min(0).default(0),
  leaveDeductions: z.number().min(0).default(0),
  netSalary: z.number().min(0).default(0),
  status: z.enum(['Pending', 'Paid']).default('Pending'),
  calculatedAt: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
}).passthrough();

// --- LEAVE ---
export const LeaveSchema = z.object({
  id: z.string().min(1),
  employeeId: z.string().min(1),
  employeeName: z.string().min(1),
  leaveType: z.string().min(1),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: z.string().optional(),
  status: z.enum(['Pending', 'Approved', 'Rejected', 'Cancelled']).default('Pending'),
  approvedBy: z.string().optional(),
  approvedAt: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
}).passthrough();

// --- CANDIDATE ---
export const CandidateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  skills: z.array(z.string()).default([]),
  experienceYears: z.number().min(0).default(0),
  resumeFileName: z.string().optional(),
  status: z.enum(['Applied', 'Shortlisted', 'Screened', 'Invited', 'Rejected', 'Hired', 'Parsed']).default('Applied'),
  screeningTotalScore: z.number().min(0).max(100).optional(),
  chatbotScore: z.number().min(0).max(100).optional(),
  videoScore: z.number().min(0).max(100).optional(),
  combinedScore: z.number().min(0).max(100).optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
}).passthrough();

// --- DEPARTMENT ---
export const DepartmentSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  code: z.string().optional(),
  description: z.string().optional(),
  headId: z.string().optional(),
  headName: z.string().optional(),
  parentDepartmentId: z.string().optional(),
  isActive: z.boolean().default(true),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
}).passthrough();

// --- DESIGNATION ---
export const DesignationSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  code: z.string().optional(),
  description: z.string().optional(),
  departmentId: z.string().optional(),
  level: z.number().int().min(0).default(1),
  category: z.string().default('Staff'), // <-- changed from enum to string
  isActive: z.boolean().default(true),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
}).passthrough();

// --- DOCUMENT ---
export const DocumentSchema = z.object({
  id: z.string().min(1),
  employeeId: z.string().min(1),
  employeeName: z.string().min(1),
  documentType: z.string().min(1),
  documentTypeLabel: z.string().optional(),
  fileName: z.string().min(1),
  fileSize: z.number().min(0).default(0),
  fileType: z.string().optional(),
  fileUrl: z.string().optional(),
  driveFileId: z.string().optional(),
  uploadedBy: z.string().optional(),
  uploadedByName: z.string().optional(),
  uploadedAt: z.string().optional(),
  isVerified: z.boolean().default(false),
  status: z.enum(['Pending Verification', 'Verified', 'Rejected']).default('Pending Verification'),
  notes: z.string().optional(),
  tags: z.array(z.string()).default([]),
  version: z.number().int().min(1).default(1),
}).passthrough();

// --- SALARY STRUCTURE ---
export const SalaryStructureSchema = z.object({
  id: z.string().min(1),
  employeeId: z.string().min(1),
  components: z.array(z.object({
    id: z.string(),
    name: z.string(),
    type: z.enum(['fixed', 'variable']),
    taxable: z.boolean().default(true),
    amount: z.number().min(0),
  })).default([]),
  totalMonthly: z.number().min(0).default(0),
  totalAnnual: z.number().min(0).default(0),
  ctc: z.number().min(0).default(0),
  currency: z.string().default('USD'),
  isActive: z.boolean().default(true),
  effectiveFrom: z.string().optional(),
  effectiveTo: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
}).passthrough();

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
