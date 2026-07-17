import express from "express";
import {
  getEmployeesFromDB,
  getEmployeeByIdFromDB,
  saveEmployeesToDB,
  deleteEmployeeFromDB,
  getAttendanceFromDB,
  saveAttendanceToDB,
  getPayrollFromDB,
  savePayrollToDB,
  getLeavesFromDB,
  saveLeavesToDB,
  getCandidatesFromDB,
  saveCandidatesToDB,
  getSalaryStructureFromDB,
  getDepartmentsFromDB,
  getDesignationsFromDB,
} from './src/services/serverDatabase.js';

import { getNextId } from './src/lib/idHelper.js';
import { getColumnLetter } from './src/lib/columnUtils.js';
import { encryptText, decryptText } from './src/lib/crypto.js';

import * as mysql from 'mysql2/promise';
import { Pool } from 'pg';

import path from "path";
import fs from "fs";
import crypto from "crypto";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createServer as createViteServer } from "vite";
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import { z } from 'zod';
import {
  EMPLOYEE_HEADERS,
  ATTENDANCE_HEADERS,
  PAYROLL_HEADERS,
  LEAVES_HEADERS,
  RECRUITMENT_HEADERS,
  DOCUMENTS_HEADERS,
  DEPARTMENT_HEADERS,
  DESIGNATION_HEADERS,
  PERFORMANCE_REVIEW_HEADERS,
  PERFORMANCE_GOAL_HEADERS,
  TRAINING_MODULE_HEADERS,
  SUCCESSION_HEADERS,
  ONBOARDING_TASK_HEADERS,
  ORG_CHART_HEADERS,
  WHATSAPP_MESSAGE_HEADERS,
  WHATSAPP_TEMPLATE_HEADERS,
  INTERVIEW_SCHEDULE_HEADERS,
  LEAVE_POLICY_HEADERS,
  SHIFT_HEADERS,
  SHIFT_ASSIGNMENT_HEADERS,
  CURRENCY_HEADERS,
  TAX_RULE_HEADERS,
  STATUTORY_DEDUCTION_HEADERS,
  getEmployees as getEmployeesFromLocalStore,
  saveEmployees as saveEmployeesToLocalStore,
  getAttendance as getAttendanceFromLocalStore,
  saveAttendance as saveAttendanceToLocalStore,
  getLeaves as getLeavesFromLocalStore,
  saveLeaves as saveLeavesToLocalStore,
  getPayroll as getPayrollFromLocalStore,
  savePayroll as savePayrollToLocalStore,
  getCandidates as getCandidatesFromLocalStore,
  saveCandidates as saveCandidatesToLocalStore,
  getSalaryStructureByEmployee,
  getPayGrades,
  saveSalaryStructure,
  addSalaryRevision,
  getDepartments,
  getDesignations,
  getEmployeeDocuments,
  saveEmployeeDocuments,
  getUsers
} from "./src/lib/storage.js";
import { fetchWithRetry, circuitStates } from "./src/lib/retry.js";


const TRAINING_ASSIGNMENT_HEADERS = [
  'id', 'trainingRequestId', 'courseId', 'courseTitle', 'employeeId', 'employeeName',
  'mentorId', 'mentorName', 'status', 'progress', 'assignedAt', 'dueDate',
  'completedAt', 'score', 'certificateUrl', 'feedback', 'notes'
];

// Load environment variables
dotenv.config();

// Startup Validation: Check for required environment variables
if (!process.env.GEMINI_API_KEY) {
  console.warn("⚠️ WARNING: GEMINI_API_KEY is not defined. AI-powered features will be disabled.");
}

export const app = express();
const PORT = 3000;

const isNoDatabaseConfiguredError = (error: unknown): boolean => {
  return error instanceof Error && error.message.includes('No database configured');
};

async function getEmployeesStore() {
  try {
    return await getEmployeesFromDB();
  } catch (error) {
    if (isNoDatabaseConfiguredError(error)) {
      return getEmployeesFromLocalStore();
    }
    throw error;
  }
}

async function saveEmployeesStore(employees: any[]) {
  try {
    await saveEmployeesToDB(employees);
  } catch (error) {
    if (isNoDatabaseConfiguredError(error)) {
      saveEmployeesToLocalStore(employees);
      return;
    }
    throw error;
  }
}

// ===== CORS CONFIGURATION =====
// ALLOWED_ORIGINS accepts a comma-separated list of absolute origins. Wildcards
// are deliberately limited to a complete subdomain label, e.g.
// https://*.example.com. A bare "*" is never accepted with credentials.
const parseAllowedOrigins = (raw: string | undefined): string[] => {
  if (!raw) return [];
  return raw.split(',').map(value => value.trim()).filter(value => {
    if (!value || value === '*') {
      console.warn('Ignoring insecure CORS origin entry:', value || '(empty)');
      return false;
    }
    const candidate = value.replace('://*.', '://placeholder.');
    try {
      const parsed = new URL(candidate);
      const validWildcard = /^https?:\/\/\*\.[a-z0-9.-]+(?::\d+)?$/i.test(value);
      const validExact = /^https?:\/\/[^/]+$/i.test(value);
      if (!validExact && !validWildcard || parsed.pathname !== '/') throw new Error('invalid origin');
      return true;
    } catch {
      console.warn('Ignoring invalid CORS origin entry:', value);
      return false;
    }
  });
};

const allowedOrigins = [
  ...parseAllowedOrigins(process.env.ALLOWED_ORIGINS),
  ...(process.env.NODE_ENV === 'production' ? [] : [
    'http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173', 'http://127.0.0.1:5173'
  ])
];

const originMatches = (origin: string, allowed: string): boolean => {
  if (origin === allowed) return true;
  const wildcard = allowed.match(/^(https?):\/\/\*\.([^/:]+)(?::(\d+))?$/i);
  if (!wildcard) return false;
  try {
    const request = new URL(origin);
    const [, protocol, domain, port] = wildcard;
    // Require a real subdomain boundary: evil-example.com must not match example.com.
    return request.protocol === `${protocol}:` && request.hostname.endsWith(`.${domain}`) &&
      request.hostname !== domain && (port ? request.port === port : !request.port);
  } catch { return false; }
};

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) return process.env.NODE_ENV === 'production'
      ? callback(new Error('Origin not allowed by CORS policy')) : callback(null, true);
    if (allowedOrigins.some(allowed => originMatches(origin, allowed))) return callback(null, true);
    if (process.env.NODE_ENV !== 'production') console.warn(`CORS denied for origin: ${origin}`);
    return callback(new Error('Origin not allowed by CORS policy'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count', 'X-RateLimit-Limit', 'X-RateLimit-Remaining'],
  credentials: true,
  maxAge: 86400,
};

// Apply CORS middleware
app.use(cors(corsOptions));

// For preflight requests, respond with 204 (No Content)
app.options('*', cors(corsOptions) as any);

app.use(express.json({ limit: '200mb' }));
app.use(express.urlencoded({ extended: true, limit: '200mb' }));

// ===== INPUT VALIDATION SCHEMAS =====
const EmployeeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email").optional().or(z.literal('')),
  role: z.string().min(1, "Role is required"),
  department: z.string().optional(),
  status: z.enum(['Active', 'Onboarding', 'On Leave', 'Suspended', 'Probation', 'Resigned', 'Retired', 'Deceased', 'Contract Expired', 'Terminated']).optional().default('Active'),
});

const AttendanceSchema = z.object({
  employeeId: z.string().min(1, "Employee ID is required"),
  employeeName: z.string().optional().default("Unknown"),
  date: z.string().min(1, "Date is required"),
  checkIn: z.string().optional().default("09:00"),
  checkOut: z.string().optional().default("18:00"),
  status: z.enum(['Full Day', 'Half Day', 'Absent']).optional().default('Full Day'),
  lateMinutes: z.number().optional().default(0),
  earlyDepartureMinutes: z.number().optional().default(0),
});

const LeaveSchema = z.object({
  employeeId: z.string().min(1, "Employee ID is required"),
  employeeName: z.string().optional().default("Unknown"),
  leaveType: z.string().min(1, "Leave type is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  reason: z.string().optional().default(""),
});

const PayrollRunSchema = z.object({
  month: z.string().min(1, "Month is required"),
  year: z.string().min(1, "Year is required"),
});

// ===== AUTHENTICATION MIDDLEWARE =====
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET environment variable is required in production');
}
const DEFAULT_TIMEOUT_MS = 10000;
const AVERAGE_WORKING_DAYS = 22;

const ACTUAL_JWT_SECRET = JWT_SECRET || (process.env.NODE_ENV === 'test' ? 'humail_eli_secret_key_2026' : crypto.randomBytes(32).toString('hex'));
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const ADMIN_EMAILS = new Set((process.env.ADMIN_EMAILS || '').split(',').map(email => email.trim().toLowerCase()).filter(Boolean));
if (process.env.NODE_ENV === 'production' && !GOOGLE_CLIENT_ID) {
  throw new Error('GOOGLE_CLIENT_ID environment variable is required in production');
}
const AUTH_COOKIE = 'hrm_session';

// ===== BIOMETRIC DEVICE INTEGRATION HELPERS =====

/**
 * Generic helper for device requests with timeout and authentication
 */
async function fetchFromDevice(url: string, options: any = {}) {
  const { username, password, apiKey, timeout = DEFAULT_TIMEOUT_MS, method = 'GET', body } = options;
  
  const headers: Record<string, string> = {
    'Content-Type': options.contentType || 'application/json',
    ...(options.headers || {})
  };

  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  } else if (username || password) {
    headers['Authorization'] = buildDeviceAuthHeader(apiKey, username, password);
  }

  return fetchWithRetry(url, {
    method,
    headers,
    body: body ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
    timeout
  }, {
    maxRetries: 2,
    baseDelay: 1000,
    retryableStatuses: [429, 500, 502, 503, 504],
    onRetry: (attempt, error) => {
      console.warn(`fetchFromDevice retry ${attempt}: ${error.message}`);
    }
  });
}

/**
 * Common punch record transformer
 */
function transformPunchRecord(punch: any, index: number, deviceId: string, deviceName: string, fieldMapping: any = null) {
  const punchTime = punch[fieldMapping?.punchTime || 'punchTime'] || 
                    punch[fieldMapping?.time || 'time'] || 
                    punch[fieldMapping?.datetime || 'datetime'] || 
                    punch[fieldMapping?.recordTime || 'recordTime'] || 
                    new Date().toISOString();
                    
  const employeeId = String(punch[fieldMapping?.employeeId || 'userId'] || 
                           punch[fieldMapping?.employeeNo || 'employeeNo'] || 
                           punch[fieldMapping?.id || 'id'] || 
                           `EMP-${String(index + 1).padStart(3, '0')}`);
                           
  const employeeName = String(punch[fieldMapping?.employeeName || 'userName'] || 
                             punch[fieldMapping?.name || 'name'] || 
                             `Employee ${employeeId}`);
                             
  const rawType = String(punch[fieldMapping?.punchType || 'type'] || 
                        punch[fieldMapping?.punchType || 'punchType'] || 
                        punch[fieldMapping?.inOut || 'inOut'] || '').toLowerCase();
                        
  const punchType = (rawType === 'in' || rawType === 'check-in' || rawType === '1' || rawType === 'true') ? 'check-in' : 'check-out';

  return {
    id: punch.id || `${deviceId.toUpperCase()}-${Date.now()}-${index}`,
    deviceId,
    employeeId,
    employeeName,
    punchTime,
    punchType,
    verified: punch.verified !== false,
    deviceName,
    createdAt: new Date().toISOString()
  };
}

const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const bearerToken = authHeader && authHeader.split(' ')[1];
  const cookieToken = String(req.headers.cookie || '').split(';').map((value: string) => value.trim())
    .find((value: string) => value.startsWith(`${AUTH_COOKIE}=`))?.slice(AUTH_COOKIE.length + 1);
  const token = bearerToken || cookieToken;

  // If no JWT, fallback to API key
  if (!token) {
    return validateApiKey(req, res, next);
  }

  jwt.verify(token, ACTUAL_JWT_SECRET, (err: any, decoded: any) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = decoded; // Attach user payload (id, role, employeeId, etc.)
    next();
  });
};

const authorize = (allowedRoles: string[]) => {
  return (req: any, res: any, next: any) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthenticated' });
    }
    // If it's an API Key, the role might be Admin
    const userRole = req.user.role || 'Employee';
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        error: `Access denied. Required roles: ${allowedRoles.join(', ')}` 
      });
    }
    next();
  };
};

// Helper for compatible timeouts in older Node.js versions
async function fetchWithTimeout(resource, options: any = {}) {
  const { timeout = 8000 } = options;
  
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(resource, {
      ...options,
      signal: controller.signal
    });
    return response;
  } finally {
    clearTimeout(id);
  }
}
const API_KEYS_FILE = path.join(process.cwd(), 'api_keys.json');

// Helper to encrypt/decrypt API keys file
function cryptApiKeys(data: string, decrypt = false): string {
  try {
    const algorithm = 'aes-256-ctr';
    const secretKey = crypto.createHash('sha256').update(ACTUAL_JWT_SECRET).digest();
    const iv = Buffer.alloc(16, 0); // Using fixed IV for simplicity in this internal tool context, though not ideal for high security

    if (decrypt) {
      const decipher = crypto.createDecipheriv(algorithm, secretKey, iv);
      return Buffer.concat([decipher.update(Buffer.from(data, 'hex')), decipher.final()]).toString();
    } else {
      const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
      return Buffer.concat([cipher.update(data), cipher.final()]).toString('hex');
    }
  } catch (err) {
    console.error('Crypt error:', err);
    return data;
  }
}

function getApiKeys() {
  try {
    if (!fs.existsSync(API_KEYS_FILE)) {
      return [];
    }
    const data = fs.readFileSync(API_KEYS_FILE, 'utf8');
    // If it looks like JSON, it's old unencrypted data
    if (data.trim().startsWith('[')) {
      return JSON.parse(data);
    }
    try {
        const decrypted = decryptText(data);
        return JSON.parse(decrypted);
    } catch(e) {
        // Fallback for old encrypted format
        const decrypted = cryptApiKeys(data, true);
        return JSON.parse(decrypted);
    }
  } catch (err) {
    console.error('Error reading API keys:', err);
    return [];
  }
}

function saveApiKeys(keys: any[]) {
  try {
    const encrypted = encryptText(JSON.stringify(keys));
    fs.writeFileSync(API_KEYS_FILE, encrypted, 'utf8');
  } catch (err) {
    console.error('Error saving API keys:', err);
  }
}

function migrateApiKeys() {
  if (!fs.existsSync(API_KEYS_FILE)) return;
  console.log('Migrating API keys to new encryption...');
  const keys = getApiKeys();
  saveApiKeys(keys);
  console.log('API keys migration complete.');
}

// Startup checks
if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'humail_eli_secret_key_2026') {
    if (process.env.NODE_ENV === 'production') {
        console.error('CRITICAL: JWT_SECRET must be set and cannot be the default value.');
        process.exit(1);
    } else if (process.env.NODE_ENV !== 'test') {
        console.warn('WARNING: JWT_SECRET is not set or using default value. Security compromised.');
    }
}

if (!process.env.ENCRYPTION_KEY || process.env.ENCRYPTION_KEY === 'humail_eli_secret_key_2026') {
    if (process.env.NODE_ENV === 'production') {
        console.error('CRITICAL: ENCRYPTION_KEY must be set and cannot be the default value.');
        process.exit(1);
    } else if (process.env.NODE_ENV !== 'test') {
        console.warn('WARNING: ENCRYPTION_KEY is not set or using default value. Security compromised.');
    }
}

migrateApiKeys();

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: { error: 'Too many requests, please try again later.' }
});

// API Key validation middleware
const validateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.query.apiKey;
  if (!apiKey) {
    return res.status(401).json({ error: 'API key is required' });
  }
  const keys = getApiKeys();
  const validKey = keys.find(k => k.key === apiKey && k.isActive === true);
  if (!validKey) {
    return res.status(401).json({ error: 'Invalid or revoked API key' });
  }
  next();
};

// JWT token generation
app.post('/api/v1/auth/token', (req: any, res: any) => {
  const { apiKey } = req.body;
  if (!apiKey || !apiKey.startsWith('he_')) {
    return res.status(401).json({ error: 'Invalid API key' });
  }
  const keys = getApiKeys();
  const validKey = keys.find((k: any) => k.key === apiKey && k.isActive === true);
  if (!validKey) {
    return res.status(401).json({ error: 'Invalid or revoked API key' });
  }
  
  const token = jwt.sign(
    { apiKey, role: 'Admin' }, 
    ACTUAL_JWT_SECRET, 
    { expiresIn: '24h' }
  );
  res.json({ token, expiresIn: 86400 });
});

// ===== AUTH ENDPOINTS =====

// POST /api/v1/auth/google – Exchange Google ID token for our JWT
app.post('/api/v1/auth/google', async (req: any, res: any) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ error: 'Missing idToken' });
    }

    // Verify Google ID token with Google before trusting user identity.
    let googleResponse: Response;
    try {
      googleResponse = await fetchWithRetry(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`,
        { timeout: 10000 },
        {
          maxRetries: 1,
          baseDelay: 500,
          retryableStatuses: [429, 500, 502, 503, 504],
        }
      );
    } catch (verificationError: any) {
      return res.status(503).json({ error: `Google token verification unavailable: ${verificationError.message || 'request failed'}` });
    }

    if (!googleResponse.ok) {
      return res.status(401).json({ error: 'Invalid Google ID token' });
    }

    const googleTokenInfo: any = await googleResponse.json();
    const email = typeof googleTokenInfo.email === 'string' ? googleTokenInfo.email.toLowerCase() : '';
    const now = Math.floor(Date.now() / 1000);
    // tokeninfo validates the signature. Validate the claims that bind that token to
    // this application before using any identity data from it.
    const validIssuer = googleTokenInfo.iss === 'accounts.google.com' || googleTokenInfo.iss === 'https://accounts.google.com';
    const validAudience = !!GOOGLE_CLIENT_ID && (googleTokenInfo.aud === GOOGLE_CLIENT_ID || googleTokenInfo.azp === GOOGLE_CLIENT_ID);
    const validExpiry = Number(googleTokenInfo.exp) > now;
    if (!email || googleTokenInfo.email_verified !== 'true' && googleTokenInfo.email_verified !== true || !validIssuer || !validAudience || !validExpiry) {
      return res.status(401).json({ error: 'Google ID token claims could not be verified' });
    }
    const name = googleTokenInfo.name || googleTokenInfo.given_name || email || 'Unknown User';
    const picture = googleTokenInfo.picture || '';

    // Find or create employee
    const employees = await getEmployeesStore();
    let employee = employees.find(e => e.email === email || e.personal?.email === email);
    if (!employee) {
      // Create new employee with default role 'Employee', or 'Admin' if it's the owner/user email
      const isUserEmail = ADMIN_EMAILS.has(email);
      const role = isUserEmail ? 'Admin' : 'Employee';

      employee = {
        id: `EMP-${Date.now()}`,
        personal: {
          name,
          email,
          phone: '',
          profileImage: picture,
          gender: 'Prefer not to say'
        },
        employment: {
          joiningDate: new Date().toISOString().split('T')[0],
          status: 'Active',
          designationId: isUserEmail ? 'ADMIN-001' : 'DEPT-STAFF',
          departmentId: isUserEmail ? 'DEPT-EXEC' : 'DEPT-GEN',
          employmentType: 'Permanent',
          workLocation: 'Office',
          role,
          seatNumber: 0
        },
        compensation: {
          payGradeId: isUserEmail ? 'PG-EXEC' : 'PG-STAFF',
          currency: 'USD'
        },
        onboarding: {
          contractSigned: true,
          trainingAssigned: true,
          trainingCompleted: true,
          welcomeEmailSent: true,
          feedbackSubmitted: true
        },
        exit: null,
        name,
        email
      } as any;
      employees.push(employee);
      await saveEmployeesStore(employees);
    }

    // Determine role from employee record (server-side)
    const role = employee.employment?.role || employee.role || 'Employee';

    // Generate JWT
    const token = jwt.sign(
      { employeeId: employee.id, email, role },
      ACTUAL_JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Keep the session credential out of JavaScript-accessible storage.
    res.cookie(AUTH_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
      path: '/',
    });

    // Return only non-sensitive user information.
    res.json({
      user: {
        employeeId: employee.id,
        email,
        name: employee.name || name,
        role,
      },
    });
  } catch (error: any) {
    console.error('Auth error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/v1/auth/verify – Validate token and return user info
app.get('/api/v1/auth/verify', authenticateToken, (req: any, res: any) => {
  // authenticateToken already validates the token and attaches req.user
  res.json({
    valid: true,
    user: req.user,
  });
});

// POST /api/v1/auth/logout – No-op (client-side clear)
app.post('/api/v1/auth/logout', (req: any, res: any) => {
  res.clearCookie(AUTH_COOKIE, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/' });
  res.json({ success: true });
});

// ===== API v1 ROUTES =====

// Apply rate limiting and API key validation to all /api/v1 routes
app.use('/api/v1', apiLimiter);


// GET /api/v1/employees
app.get('/api/v1/employees', authenticateToken, authorize(['HR', 'Admin', 'Manager']), async (req: any, res: any) => {
  try {
    const employees = await getEmployeesStore();
    res.json({
      success: true,
      data: employees,
      count: employees.length
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/v1/employees/:id
app.get('/api/v1/employees/:id', authenticateToken, authorize(['HR', 'Admin', 'Manager', 'Employee']), async (req: any, res: any) => {
  try {
    const employee = (await getEmployeesStore()).find(e => e.id === req.params.id);
    if (!employee) return res.status(404).json({ error: 'Employee not found' });

    if (req.user.role === 'Employee' && req.user.employeeId !== req.params.id) {
      return res.status(403).json({ error: 'You can only view your own profile' });
    }
    res.json({ success: true, data: employee });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/v1/employees
app.post('/api/v1/employees', authenticateToken, authorize(['HR', 'Admin']), async (req: any, res: any) => {
  try {
    const validation = EmployeeSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.issues[0].message });
    }
    
    const employees = await getEmployeesStore();
    const newId = await getNextId('employee', 'EMP-');
    const newEmployee = {
      id: newId,
      ...req.body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    employees.push(newEmployee);
    await saveEmployeesStore(employees);

    // Create a default salary structure for the new employee
    const defaultStructure = getSalaryStructureByEmployee(newEmployee.id, newEmployee.baseSalary || 0);
    if (defaultStructure) {
      saveSalaryStructure(defaultStructure);
    }

    res.status(201).json({ success: true, data: newEmployee });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/v1/employees/:id
app.put('/api/v1/employees/:id', authenticateToken, async (req: any, res: any) => {
  try {
    const isSelf = req.user.employeeId === req.params.id;
    const isHRorAdmin = ['HR', 'Admin'].includes(req.user.role);

    if (!isSelf && !isHRorAdmin) {
      return res.status(403).json({ error: 'Access denied. You can only update your own profile or must be HR/Admin.' });
    }

    const validation = EmployeeSchema.partial().safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.issues[0].message });
    }

    const employees = await getEmployeesStore();
    const index = employees.findIndex(e => e.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const existingEmployee = employees[index];
    const updateData = { ...req.body } as any;

    // Prevent non-HR/Admin from changing role
    if (!isHRorAdmin) {
      // If updating employment, ensure role is NOT changed
      if (updateData.employment) {
        updateData.employment = {
          ...updateData.employment,
          role: existingEmployee.employment?.role || 'Employee' // force keep existing role
        };
      }
      // If there's top-level role field, ensure it is NOT changed
      if ('role' in updateData) {
        updateData.role = existingEmployee.role || 'Employee';
      }
    }

    employees[index] = { 
      ...existingEmployee, 
      ...updateData, 
      personal: updateData.personal ? { ...existingEmployee.personal, ...updateData.personal } : existingEmployee.personal,
      employment: updateData.employment ? { ...existingEmployee.employment, ...updateData.employment } : existingEmployee.employment,
      compensation: updateData.compensation ? { ...existingEmployee.compensation, ...updateData.compensation } : existingEmployee.compensation,
      onboarding: updateData.onboarding ? { ...existingEmployee.onboarding, ...updateData.onboarding } : existingEmployee.onboarding,
      updatedAt: new Date().toISOString() 
    };

    await saveEmployeesStore(employees);
    res.json({ success: true, data: employees[index] });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/v1/employees/:id
app.delete('/api/v1/employees/:id', authenticateToken, authorize(['Admin']), async (req: any, res: any) => {
  try {
    await deleteEmployeeFromDB(req.params.id);
    res.json({ success: true, message: 'Employee deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ===== ATTENDANCE API =====

// GET /api/v1/attendance
app.get('/api/v1/attendance', authenticateToken, authorize(['HR', 'Admin', 'Manager']), async (req, res) => {
  try {
    const { employeeId, startDate, endDate } = req.query as Record<string, string | undefined>;
    let records = await getAttendanceFromDB();
    if (employeeId) records = records.filter(r => r.employeeId === employeeId);
    if (startDate) records = records.filter(r => r.date >= startDate);
    if (endDate) records = records.filter(r => r.date <= endDate);
    res.json({ success: true, data: records, count: records.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/v1/employees/bulk
app.put('/api/v1/employees/bulk', authenticateToken, authorize(['HR', 'Admin']), async (req: any, res: any) => {
  try {
    const employees = Array.isArray(req.body?.employees) ? req.body.employees : [];
    await saveEmployeesStore(employees);
    res.json({ success: true, count: employees.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/v1/attendance
app.post('/api/v1/attendance', authenticateToken, authorize(['HR', 'Admin']), async (req, res) => {
  try {
    const validation = AttendanceSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.issues[0].message });
    }

    const records = await getAttendanceFromDB();
    const newRecord = {
      id: `ATT-${Date.now()}`,
      ...validation.data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    records.push(newRecord);
    await saveAttendanceToDB(records);
    res.status(201).json({ success: true, data: newRecord });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/v1/attendance/bulk
app.put('/api/v1/attendance/bulk', authenticateToken, authorize(['HR', 'Admin']), async (req, res) => {
  try {
    const records = Array.isArray((req as any).body?.records) ? (req as any).body.records : [];
    await saveAttendanceToDB(records);
    res.json({ success: true, count: records.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ===== LEAVE API =====

// GET /api/v1/leaves
app.get('/api/v1/leaves', authenticateToken, authorize(['HR', 'Admin', 'Manager']), async (req, res) => {
  try {
    const { employeeId, status } = req.query as Record<string, string | undefined>;
    let leaves = await getLeavesFromDB();
    if (employeeId) leaves = leaves.filter(l => l.employeeId === employeeId);
    if (status) leaves = leaves.filter(l => l.status === status);
    res.json({ success: true, data: leaves, count: leaves.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/v1/leaves
app.post('/api/v1/leaves', authenticateToken, authorize(['HR', 'Admin']), async (req, res) => {
  try {
    const validation = LeaveSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.issues[0].message });
    }

    const leaves = await getLeavesFromDB();
    const newLeave = {
      id: `LR-${Date.now()}`,
      ...validation.data,
      status: 'Pending' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    leaves.push(newLeave);
    await saveLeavesToDB(leaves);
    res.status(201).json({ success: true, data: newLeave });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/v1/leaves/:id/approve
app.put('/api/v1/leaves/:id/approve', authenticateToken, authorize(['HR', 'Admin', 'Manager']), async (req: any, res: any) => {
  try {
    const leaves = await getLeavesFromDB();
    const index = leaves.findIndex(l => l.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Leave not found' });
    }
    leaves[index].status = 'Approved';
    leaves[index].approvedAt = new Date().toISOString();
    leaves[index].approvedBy = req.body.approvedBy || 'API';
    await saveLeavesToDB(leaves);
    res.json({ success: true, data: leaves[index] });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/v1/leaves/bulk
app.put('/api/v1/leaves/bulk', authenticateToken, authorize(['HR', 'Admin']), async (req, res) => {
  try {
    const leaves = Array.isArray((req as any).body?.leaves) ? (req as any).body.leaves : [];
    await saveLeavesToDB(leaves);
    res.json({ success: true, count: leaves.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ===== PAYROLL API =====

// GET /api/v1/payroll
app.get('/api/v1/payroll', authenticateToken, authorize(['HR', 'Admin']), async (req, res) => {
  try {
    const { employeeId, month } = req.query as Record<string, string | undefined>;
    let payroll = await getPayrollFromDB();
    if (employeeId) payroll = payroll.filter(p => p.employeeId === employeeId);
    if (month) payroll = payroll.filter(p => p.month === month);
    res.json({ success: true, data: payroll, count: payroll.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/v1/payroll
app.post('/api/v1/payroll', authenticateToken, authorize(['HR', 'Admin']), async (req, res) => {
  try {
    const records = Array.isArray(req.body) ? req.body : [req.body];
    await savePayrollToDB(records);
    res.status(201).json({ success: true, count: records.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/v1/payroll/bulk
app.put('/api/v1/payroll/bulk', authenticateToken, authorize(['HR', 'Admin']), async (req, res) => {
  try {
    const records = Array.isArray((req as any).body?.records) ? (req as any).body.records : [];
    await savePayrollToDB(records);
    res.json({ success: true, count: records.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/v1/payroll/run
app.post('/api/v1/payroll/run', authenticateToken, authorize(['HR', 'Admin']), async (req: any, res: any) => {
  try {
    const validation = PayrollRunSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.issues[0].message });
    }

    const { month, year } = validation.data;
    const employees = await getEmployeesStore();
    const attendance = await getAttendanceFromDB();
    const payrollRecords: any[] = [];
    
    // Better payroll calculation using Salary Structure
    for (const emp of employees) {
      const empAttendance = attendance.filter(a => a.employeeId === emp.id && a.date.includes(`${year}-${month}`));
      const presentDays = empAttendance.filter(a => a.status === 'Full Day').length;
      
      // Fetch Salary Structure asynchronously from database, fallback to local/default structure
      const salaryStructure = await getSalaryStructureFromDB(emp.id) || getSalaryStructureByEmployee(emp.id, emp.baseSalary || 0) || {
        totalMonthly: emp.baseSalary || 0,
      };
      
      const monthlyGross = salaryStructure.totalMonthly || emp.baseSalary || 0;
      
      const dailyRate = monthlyGross / AVERAGE_WORKING_DAYS;
      const netSalary = presentDays * dailyRate;
      
      payrollRecords.push({
        id: `PAY-${Date.now()}-${emp.id}`,
        employeeId: emp.id,
        employeeName: emp.name,
        month: `${month} ${year}`,
        baseSalary: monthlyGross,
        bonus: 0,
        penalty: 0,
        leaveDeductions: Math.max(0, (AVERAGE_WORKING_DAYS - presentDays) * dailyRate),
        netSalary: Math.round(netSalary * 100) / 100,
        status: 'Pending',
        calculatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    
    await savePayrollToDB(payrollRecords);
    res.json({ success: true, data: payrollRecords, count: payrollRecords.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ===== CANDIDATES API =====

app.get('/api/v1/candidates', authenticateToken, authorize(['HR', 'Admin', 'Manager']), async (req, res) => {
  try {
    const candidates = await getCandidatesFromDB();
    res.json({ success: true, data: candidates, count: candidates.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/v1/candidates', authenticateToken, authorize(['HR', 'Admin', 'Manager']), async (req, res) => {
  try {
    const candidates = Array.isArray(req.body) ? req.body : [req.body];
    await saveCandidatesToDB(candidates);
    res.status(201).json({ success: true, count: candidates.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/v1/candidates/bulk', authenticateToken, authorize(['HR', 'Admin', 'Manager']), async (req, res) => {
  try {
    const candidates = Array.isArray((req as any).body?.candidates) ? (req as any).body.candidates : [];
    await saveCandidatesToDB(candidates);
    res.json({ success: true, count: candidates.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ===== API KEY MANAGEMENT =====

// POST /api/v1/api-keys/generate
app.post('/api/v1/api-keys/generate', authenticateToken, authorize(['Admin']), (req: any, res: any) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'API key name is required' });
  }
  const apiKey = `he_${uuidv4().replace(/-/g, '').slice(0, 24)}`;
  const keyData = {
    key: apiKey,
    name: name.trim(),
    createdAt: new Date().toISOString(),
    isActive: true
  };
  const keys = getApiKeys();
  keys.push(keyData);
  saveApiKeys(keys);
  res.json({ success: true, data: keyData });
});

// GET /api/v1/api-keys
app.get('/api/v1/api-keys', authenticateToken, authorize(['Admin']), (req: any, res: any) => {
  res.json({ success: true, data: getApiKeys() });
});

// DELETE /api/v1/api-keys/:key
app.delete('/api/v1/api-keys/:key', authenticateToken, authorize(['Admin']), (req: any, res: any) => {
  let keys = getApiKeys();
  const keyExists = keys.some(k => k.key === req.params.key);
  if (!keyExists) {
    return res.status(404).json({ error: 'API key not found' });
  }
  keys = keys.filter(k => k.key !== req.params.key);
  saveApiKeys(keys);
  res.json({ success: true, message: 'API key revoked' });
});

// ===== CIRCUIT BREAKER MANAGEMENT =====

// POST /api/admin/circuit-breaker/reset
app.post('/api/admin/circuit-breaker/reset', authenticateToken, authorize(['Admin']), (req: any, res: any) => {
  const { service } = req.body;
  if (service) {
    const key = service;
    const state = circuitStates.get(key);
    if (state) {
      state.state = 'CLOSED';
      state.failures = 0;
      res.json({ success: true, message: `Circuit breaker for ${service} reset` });
    } else {
      res.json({ success: false, message: `Service ${service} not found` });
    }
  } else {
    // Reset all
    for (const [key] of circuitStates) {
      const state = circuitStates.get(key)!;
      state.state = 'CLOSED';
      state.failures = 0;
    }
    res.json({ success: true, message: 'All circuit breakers reset' });
  }
});

// ===== API DOCUMENTATION (Swagger/OpenAPI) =====

app.get('/api/docs', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Humail Eli - API Documentation</title>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.10.5/swagger-ui.min.css" />
      <style>
        body { margin: 0; padding: 0; }
        .topbar { display: none; }
      </style>
    </head>
    <body>
      <div id="swagger-ui"></div>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.10.5/swagger-ui-bundle.min.js"></script>
      <script>
        const ui = SwaggerUIBundle({
          url: '/api/docs.json',
          dom_id: '#swagger-ui',
          presets: [SwaggerUIBundle.presets.apis],
          layout: 'BaseLayout',
          deepLinking: true,
        });
      </script>
    </body>
    </html>
  `);
});

// GET /api/docs.json - OpenAPI spec
app.get('/api/docs.json', (req, res) => {
  res.json({
    openapi: '3.0.0',
    info: {
      title: 'Humail Eli - HRM API',
      version: '1.0.0',
      description: 'RESTful API for Humail Eli Human Resource Management System'
    },
    servers: [
      { url: 'http://localhost:3000/api/v1', description: 'Development Server' }
    ],
    security: [
      { apiKeyAuth: [] }
    ],
    components: {
      securitySchemes: {
        apiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key'
        }
      },
      schemas: {
        Employee: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string' },
            role: { type: 'string' },
            department: { type: 'string' }
          }
        },
        Attendance: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            employeeId: { type: 'string' },
            date: { type: 'string' },
            checkIn: { type: 'string' },
            checkOut: { type: 'string' },
            status: { type: 'string' }
          }
        },
        Leave: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            employeeId: { type: 'string' },
            leaveType: { type: 'string' },
            startDate: { type: 'string' },
            endDate: { type: 'string' },
            status: { type: 'string' }
          }
        },
        Payroll: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            employeeId: { type: 'string' },
            month: { type: 'string' },
            netSalary: { type: 'number' },
            status: { type: 'string' }
          }
        }
      }
    },
    paths: {
      '/employees': {
        get: {
          summary: 'Get all employees',
          responses: { '200': { description: 'Successful', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Employee' } } } } } },
          security: [{ apiKeyAuth: [] }]
        },
        post: {
          summary: 'Create new employee',
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Employee' } } } },
          responses: { '201': { description: 'Created' } },
          security: [{ apiKeyAuth: [] }]
        }
      },
      '/employees/{id}': {
        get: {
          summary: 'Get employee by ID',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'Successful' } },
          security: [{ apiKeyAuth: [] }]
        },
        put: {
          summary: 'Update employee',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Employee' } } } },
          responses: { '200': { description: 'Updated' } },
          security: [{ apiKeyAuth: [] }]
        },
        delete: {
          summary: 'Delete employee',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'Deleted' } },
          security: [{ apiKeyAuth: [] }]
        }
      },
      '/attendance': {
        get: {
          summary: 'Get attendance records',
          parameters: [
            { name: 'employeeId', in: 'query', schema: { type: 'string' } },
            { name: 'startDate', in: 'query', schema: { type: 'string' } },
            { name: 'endDate', in: 'query', schema: { type: 'string' } }
          ],
          responses: { '200': { description: 'Successful' } },
          security: [{ apiKeyAuth: [] }]
        },
        post: {
          summary: 'Create attendance record',
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Attendance' } } } },
          responses: { '201': { description: 'Created' } },
          security: [{ apiKeyAuth: [] }]
        }
      },
      '/leaves': {
        get: {
          summary: 'Get leave requests',
          parameters: [
            { name: 'employeeId', in: 'query', schema: { type: 'string' } },
            { name: 'status', in: 'query', schema: { type: 'string' } }
          ],
          responses: { '200': { description: 'Successful' } },
          security: [{ apiKeyAuth: [] }]
        },
        post: {
          summary: 'Create leave request',
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Leave' } } } },
          responses: { '201': { description: 'Created' } },
          security: [{ apiKeyAuth: [] }]
        }
      },
      '/leaves/{id}/approve': {
        put: {
          summary: 'Approve leave request',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'Approved' } },
          security: [{ apiKeyAuth: [] }]
        }
      },
      '/payroll': {
        get: {
          summary: 'Get payroll records',
          parameters: [
            { name: 'employeeId', in: 'query', schema: { type: 'string' } },
            { name: 'month', in: 'query', schema: { type: 'string' } }
          ],
          responses: { '200': { description: 'Successful' } },
          security: [{ apiKeyAuth: [] }]
        }
      },
      '/payroll/run': {
        post: {
          summary: 'Run payroll calculation',
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { month: { type: 'string' }, year: { type: 'string' } } } } } },
          responses: { '200': { description: 'Payroll calculated' } },
          security: [{ apiKeyAuth: [] }]
        }
      },
      '/api-keys/generate': {
        post: {
          summary: 'Generate new API key',
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { name: { type: 'string' } } } } } },
          responses: { '200': { description: 'API key generated' } }
        }
      }
    }
  });
});

// Lazy-initialize Gemini API client to prevent crashing on boot if key is missing
let aiClient: GoogleGenerativeAI | null = null;
function getGeminiClient(): GoogleGenerativeAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is not defined");
    }
    aiClient = new GoogleGenerativeAI(key);
  }
  return aiClient;
}

async function callGeminiWithRetry<T>(fn: () => Promise<T>, context: string): Promise<T> {
  let lastError: Error | null = null;
  let attempt = 0;
  const maxRetries = 2;
  
  while (attempt <= maxRetries) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const msg = error.message ? error.message.toLowerCase() : '';
      // Check if it's a rate limit or server error
      if (msg.includes('429') || msg.includes('500') || 
          msg.includes('503') || msg.includes('timed out') || msg.includes('overloaded')) {
        attempt++;
        if (attempt <= maxRetries) {
          const delay = 1000 * Math.pow(2, attempt - 1) + Math.random() * 300;
          console.warn(`Gemini ${context} retry ${attempt} after ${delay}ms: ${error.message}`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }
      throw error;
    }
  }
  
  throw lastError || new Error(`Failed after ${maxRetries} retries`);
}

// API Routes FIRST

// Health check
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    geminiConfigured: !!process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString() 
  });
});

// Chatbot screening endpoint: handles dynamic screening chat
app.post("/api/chat-screen", authenticateToken, authorize(['HR', 'Admin', 'Manager']), async (req, res) => {
  try {
    const { messages, candidateName, candidateRole, candidateExperience } = req.body;

    // 1. Validate required fields
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ 
        error: "Messages array is required and must not be empty" 
      });
    }
    if (!candidateName || candidateName.trim().length === 0) {
      return res.status(400).json({ 
        error: "candidateName is required" 
      });
    }
    if (!candidateRole || candidateRole.trim().length === 0) {
      return res.status(400).json({ 
        error: "candidateRole is required" 
      });
    }

    // 2. Check that the last message is from the user
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.sender !== "user") {
      return res.status(400).json({ 
        error: "The last message must be from the user" 
      });
    }

    // 3. Use server API key if not provided by client
    const effectiveKey = process.env.GEMINI_API_KEY;
    if (!effectiveKey) {
      return res.status(501).json({ 
        error: "Gemini API key not configured on server or request. Please add GEMINI_API_KEY in Settings." 
      });
    }

    // 4. Initialize Gemini client
    const ai = getGeminiClient();
    const experience = candidateExperience || "some";
    const model = ai.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      systemInstruction: `You are Eli, an expert AI Recruitment Specialist at Humail Eli. 
You are conducting a professional screening chat with ${candidateName}, who has applied for the ${candidateRole} role with ${experience} years of experience.
Conduct a friendly, polite, but rigorous screening. Ask relevant technical, behavioral, and cultural questions one by one.
Keep your responses conversational, professional, and relatively short (under 3-4 sentences). 
Focus on assessing if they fit the technical expectations of the role. Do not exceed 1 question per turn.`,
    });

    // 5. Build history (all messages except the last one)
    const history = messages.slice(0, -1).map((msg: any) => ({
      // Gemini accepts only 'user' and 'model' roles; map any non-'user' to 'model'
      role: msg.sender === "user" ? "user" : "model",
      parts: [{ text: msg.content || "" }],
    }));

    // 6. Start chat with history
    const chat = model.startChat({
      history: history,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 250,
      }
    });

    // 7. Send the last user message
    const userMessage = lastMessage.content?.trim() || "Hello";
    const result = await callGeminiWithRetry(
      () => chat.sendMessage(userMessage),
      'chat-screen'
    );
    const responseText = result.response.text();

    // 8. Return the assistant's reply
    res.json({
      reply: responseText || "Hello! Could you tell me a bit more about your previous experience in this role?"
    });

  } catch (error: any) {
    console.error("Gemini Chatbot Screen Error:", error);
    res.status(500).json({ 
      error: error.message || "Failed to generate screening response" 
    });
  }
});

// Chatbot evaluation endpoint: evaluates chat transcript and outputs a scorecard score
app.post("/api/evaluate-transcript", authenticateToken, authorize(['HR', 'Admin', 'Manager']), async (req, res) => {
  try {
    const { transcript, candidateName, candidateRole } = req.body;

    const effectiveKey = process.env.GEMINI_API_KEY;
    if (!effectiveKey) {
      return res.status(501).json({ 
        error: "Gemini API key not configured. Using simulated scores." 
      });
    }

    const ai = getGeminiClient();
    const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const evaluationPrompt = `Analyze the following interview screening transcript between our AI Recruiter and candidate ${candidateName} for the role of ${candidateRole}.
Return a strict JSON response with:
1. score: a number between 0 and 100 assessing their communication, role fit, and skill relevancy.
2. summary: a concise, scannable paragraphs (2-3 sentences max) highlighting strengths and potential yellow/red flags.
3. rating: one of 'High Match', 'Medium Match', 'Low Match'.

Transcript:
${transcript}

Strictly output ONLY valid JSON. No markdown wrappers like \`\`\`json.`;

    const result = await callGeminiWithRetry(
      () => model.generateContent({
        contents: [{ role: 'user', parts: [{ text: evaluationPrompt }] }],
        generationConfig: {
          responseMimeType: "application/json"
        }
      }),
      'evaluate-transcript'
    );

    // ---- SAFE JSON PARSING ----
    let rawText = result.response.text() || "{}";
    let parsed: any = null;
    let parseError: string | null = null;

    // Attempt to extract JSON using regex (if the model adds markdown or extra text)
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      rawText = jsonMatch[0];
    }

    try {
      parsed = JSON.parse(rawText);
    } catch (e: any) {
      parseError = e.message;
      // If parsing fails, we'll fall back to a default response
    }

    // ---- SCHEMA VALIDATION ----
    const validateScore = (val: any): number => {
      if (typeof val === 'number' && val >= 0 && val <= 100) return val;
      if (typeof val === 'string') {
        const parsedNum = Number(val);
        if (!isNaN(parsedNum) && parsedNum >= 0 && parsedNum <= 100) return parsedNum;
      }
      return 0;
    };
    const validateSummary = (val: any): string => {
      if (typeof val === 'string' && val.length > 0) return val;
      return 'Candidate completed the screening.';
    };
    const validateRating = (val: any): string => {
      if (['High Match', 'Medium Match', 'Low Match'].includes(val)) return val;
      const score = validateScore(parsed?.score);
      if (score >= 70) return 'High Match';
      if (score >= 40) return 'Medium Match';
      return 'Low Match';
    };

    // Default object if parse failed or fields missing
    const defaultResult = {
      score: 0,
      summary: 'Unable to evaluate transcript. Please check the input and try again.',
      rating: 'Low Match',
    };

    let responseData = defaultResult;

    if (parsed && typeof parsed === 'object') {
      responseData = {
        score: validateScore(parsed.score),
        summary: validateSummary(parsed.summary),
        rating: validateRating(parsed.rating),
      };
    }

    // If parsing failed, log the raw response for debugging
    if (parseError) {
      console.warn('Transcript evaluation: JSON parse failed:', parseError);
      console.warn('Raw LLM response:', rawText);
    }

    // Return the validated response
    res.json(responseData);

  } catch (error: any) {
    console.error("Gemini Evaluation Error:", error);
    res.status(500).json({ 
      error: error.message || "Failed to evaluate candidate transcript" 
    });
  }
});

// Helper: check if URL is safe (no internal/private IPs)
function isUrlSafe(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    // Only allow http/https
    if (!['http:', 'https:'].includes(url.protocol)) return false;
    
    // Block localhost and private IP ranges
    const hostname = url.hostname.toLowerCase();
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0') return false;
    // Block link-local and private IPs (IPv4)
    const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const match = hostname.match(ipv4Regex);
    if (match) {
      const octets = match.slice(1, 5).map(Number);
      // Block link-local / metadata style ranges, but allow RFC1918 LAN ranges
      // because biometric devices commonly live on private networks.
      if (octets[0] === 169 && octets[1] === 254) return false; // 169.254.0.0/16
    }
    // Block IPv6 private ranges (simplified)
    if (hostname.startsWith('fe80:') || hostname.startsWith('fd00:') || hostname === '::1') return false;
    
    return true;
  } catch {
    return false;
  }
}

function buildDeviceAuthHeader(apiKey?: string, username?: string, password?: string): string {
  if (apiKey) return `Bearer ${apiKey}`;
  if (!username || !password) {
    throw new Error('Device username and password are required when apiKey is not provided');
  }
  return `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
}

// Video Analysis endpoint (simulated / multimodal evaluation)
// POST /api/evaluate-video – analyze a candidate's video interview
app.post('/api/evaluate-video', authenticateToken, authorize(['HR', 'Admin', 'Manager']), async (req: any, res: any) => {
  try {
    const { videoUrl, candidateName, candidateRole } = req.body;

    // Validate required fields
    if (!videoUrl) {
      return res.status(400).json({ 
        success: false, 
        error: 'videoUrl is required (must be a publicly accessible URL, Google Drive link, or data URL)' 
      });
    }

    const isInlineDataUrl = typeof videoUrl === 'string' && videoUrl.startsWith('data:video/');

    // SECURITY: Validate URL safety (SSRF Protection) for remote URLs only
    if (!isInlineDataUrl && !isUrlSafe(videoUrl)) {
      return res.status(403).json({ 
        success: false, 
        error: 'URL is not allowed (must be public HTTP/HTTPS, no internal IPs)' 
      });
    }

    // Use server's API key only (do not accept user-provided key for security)
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(501).json({ 
        error: 'Gemini API key not configured on server. Please add GEMINI_API_KEY.' 
      });
    }

    const ai = new GoogleGenerativeAI(apiKey);
    // Use Gemini 1.5 Pro – supports video
    const model = ai.getGenerativeModel({ model: 'gemini-1.5-pro' });

    // Fetch the video file from the URL (if it's a Drive link, we need to handle it)
    let base64Video = '';
    let mimeType = 'video/mp4';

    // Set limits
    const MAX_SIZE = 100 * 1024 * 1024; // 100 MB
    const TIMEOUT = 30000; // 30 seconds

    if (isInlineDataUrl) {
      const match = videoUrl.match(/^data:(video\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
      if (!match) {
        return res.status(400).json({ success: false, error: 'Invalid video data URL format' });
      }
      mimeType = match[1];
      base64Video = match[2];
      const estimatedSize = Math.floor((base64Video.length * 3) / 4);
      if (estimatedSize > MAX_SIZE) {
        return res.status(413).json({ success: false, error: `Video too large (${Math.round(estimatedSize/1024/1024)} MB > 100 MB limit)` });
      }
    } else {
      let videoUrlForAI = videoUrl;
      if (videoUrl.includes('drive.google.com')) {
        const fileIdMatch = videoUrl.match(/[-\w]{25,}/);
        if (fileIdMatch) {
          videoUrlForAI = `https://drive.google.com/uc?export=download&id=${fileIdMatch[0]}`;
        }
      }

      if (!isUrlSafe(videoUrlForAI)) {
        return res.status(403).json({ 
          success: false, 
          error: 'Final transformed URL is not allowed' 
        });
      }

      let response;
      try {
        response = await fetchWithRetry(videoUrlForAI, {
          timeout: TIMEOUT,
          method: 'GET',
          headers: { 'Accept': 'video/*' },
        }, {
          maxRetries: 2,
          baseDelay: 2000,
          retryableStatuses: [429, 500, 502, 503, 504],
          onRetry: (attempt, error) => {
            console.warn(`Video fetch retry ${attempt}: ${error.message}`);
          },
        });
      } catch (error: any) {
        return res.status(400).json({ 
          success: false, 
          error: `Failed to fetch video: ${error.message}` 
        });
      }

      if (!response.ok) {
        return res.status(400).json({ 
          success: false, 
          error: `Video download failed: HTTP ${response.status}` 
        });
      }

      const contentLength = response.headers.get('content-length');
      if (contentLength && parseInt(contentLength) > MAX_SIZE) {
        return res.status(413).json({ 
          success: false, 
          error: `Video too large (${Math.round(parseInt(contentLength)/1024/1024)} MB > 100 MB limit)` 
        });
      }

      if (!response.body) {
        return res.status(400).json({
          success: false,
          error: 'Response body is empty'
        });
      }

      const reader = (response.body as any).getReader();
      const chunks: any[] = [];
      let totalSize = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        totalSize += value.length;
        if (totalSize > MAX_SIZE) {
          await reader.cancel();
          return res.status(413).json({ 
            success: false, 
            error: `Video size exceeded limit (${Math.round(totalSize/1024/1024)} MB > 100 MB)` 
          });
        }
        chunks.push(value);
      }

      const videoBuffer = Buffer.concat(chunks);
      base64Video = videoBuffer.toString('base64');
      mimeType = response.headers.get('content-type') || 'video/mp4';
    }

    const prompt = `
You are an expert hiring manager evaluating a candidate's video interview for the role of "${candidateRole}".
Candidate name: ${candidateName}

Please watch the video carefully and evaluate the candidate on the following criteria:
1. Communication clarity and articulation (0-100)
2. Confidence and composure (0-100)
3. Relevance of answers to the role (0-100)
4. Overall fit and cultural alignment (0-100)

Then, provide:
- A final score (0-100) that is the weighted average of the above.
- A concise summary (2-3 sentences) highlighting strengths and any concerns.
- A rating: 'High Match', 'Medium Match', or 'Low Match'.

Return your response as a JSON object with keys: score, summary, rating.
`;

    const result = await callGeminiWithRetry(
      () => model.generateContent({
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: mimeType,
                  data: base64Video
                }
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 500,
          responseMimeType: 'application/json'
        }
      }),
      'video-interview-analysis'
    );

    const responseText = result.response.text();
    let parsed;
    try {
      parsed = JSON.parse(responseText);
    } catch (e) {
      const match = responseText.match(/\{[\s\S]*\}/);
      if (match) parsed = JSON.parse(match[0]);
      else throw new Error('AI response not in valid JSON format');
    }

    const score = parsed.score || Math.round((parsed.communication + parsed.confidence + parsed.relevance + parsed.fit) / 4) || 0;
    const summary = parsed.summary || 'Candidate completed the video interview.';
    const rating = parsed.rating || (score >= 70 ? 'High Match' : score >= 40 ? 'Medium Match' : 'Low Match');

    res.json({
      success: true,
      score,
      summary,
      rating,
      raw: parsed
    });

  } catch (error: any) {
    console.error('Video analysis error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to analyze video. Please try again later.' 
    });
  }
});

// WhatsApp webhook endpoint (Event Handler)
app.post("/api/whatsapp/webhook", (req, res) => {
  console.log("Received WhatsApp webhook:", JSON.stringify(req.body, null, 2));
  res.sendStatus(200);
});

// WhatsApp send message endpoint
app.post("/api/whatsapp/send", authenticateToken, async (req, res) => {
  try {
    const { phoneNumberId, accessToken, to, templateName, components } = req.body;

    // 1. Validate required fields
    if (!phoneNumberId) {
      return res.status(400).json({ success: false, error: 'phoneNumberId is required' });
    }
    if (!accessToken) {
      return res.status(400).json({ success: false, error: 'accessToken is required' });
    }
    if (!to) {
      return res.status(400).json({ success: false, error: 'recipient phone number (to) is required' });
    }
    if (!templateName) {
      return res.status(400).json({ success: false, error: 'templateName is required' });
    }

    // 2. Build the request payload
    const payload = {
      messaging_product: 'whatsapp',
      to: to,
      type: 'template',
      template: {
        name: templateName,
        language: { code: 'en_US' },
        components: components || [],
      },
    };

    // 3. Call Meta WhatsApp API using fetchWithRetry
    const url = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`;
    const response = await fetchWithRetry(
      url,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        timeout: 10000,
      },
      {
        maxRetries: 2,
        baseDelay: 2000,
        onRetry: (attempt, error) => {
          console.warn(`WhatsApp send retry ${attempt}: ${error.message}`);
        },
      }
    );

    // 4. Parse the response
    const data = await response.json();

    // 5. Check for Meta API errors (even with HTTP 200)
    if (data.error) {
      console.error('WhatsApp API error:', data.error);
      return res.status(400).json({
        success: false,
        error: data.error.message || 'WhatsApp API error',
        code: data.error.code,
        meta: data.error,
      });
    }

    // 6. Check if the message was actually sent (look for messages array)
    if (!data.messages || !Array.isArray(data.messages) || data.messages.length === 0) {
      console.error('WhatsApp API returned no messages:', data);
      return res.status(500).json({
        success: false,
        error: 'Message was not sent (no messages in response)',
        meta: data,
      });
    }

    // 7. Extract message ID(s) – usually at least one
    const messageIds = data.messages.map((m: any) => m.id).filter(Boolean);
    if (messageIds.length === 0) {
      console.error('WhatsApp API returned messages without IDs:', data);
      return res.status(500).json({
        success: false,
        error: 'Message was sent but no ID was returned',
        meta: data,
      });
    }

    // 8. Success! Return a clean response
    res.json({
      success: true,
      messageId: messageIds[0],
      messageIds: messageIds,
      conversationId: data.conversation_id || undefined,
      meta: data, // optional: include full response for debugging
    });

  } catch (error: any) {
    console.error('WhatsApp send error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to send WhatsApp message',
    });
  }
});

// ===== DRIVE & SHEETS API =====

// GET /api/drive/folders - List available folders
app.get('/api/drive/folders', authenticateToken, async (req, res) => {
  try {
    const { accessToken } = req.query;
    
    if (!accessToken) {
      return res.status(400).json({
        success: false,
        error: 'Access token is required'
      });
    }

    const response = await fetchWithRetry(
      'https://www.googleapis.com/drive/v3/files?q=mimeType="application/vnd.google-apps.folder" and trashed=false&fields=files(id,name,parents)',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        timeout: DEFAULT_TIMEOUT_MS
      },
      {
        maxRetries: 3,
        baseDelay: 1000,
        retryableStatuses: [429, 500, 502, 503, 504],
        onRetry: (attempt, error) => {
          console.warn(`Drive list folders retry ${attempt}: ${error.message}`);
        },
        circuitBreaker: {
          failureThreshold: 5,
          successThreshold: 3,
          timeout: 60000,
        },
      }
    );

    const data: any = await response.json();
    
    res.json({
      success: true,
      folders: data.files || []
    });
  } catch (error: any) {
    console.error('Drive folder listing error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to list folders'
    });
  }
});

// POST /api/drive/create-folder - Create a new folder
app.post('/api/drive/create-folder', authenticateToken, authorize(['HR', 'Admin']), async (req, res) => {
  try {
    const { accessToken, folderName, parentFolderId } = req.body;
    
    if (!accessToken || !folderName) {
      return res.status(400).json({
        success: false,
        error: 'Access token and folder name are required'
      });
    }

    const body: any = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder'
    };
    
    if (parentFolderId) {
      body.parents = [parentFolderId];
    }

    const response = await fetchWithRetry(
      'https://www.googleapis.com/drive/v3/files',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body),
        timeout: DEFAULT_TIMEOUT_MS
      },
      {
        maxRetries: 3,
        baseDelay: 1000,
        retryableStatuses: [429, 500, 502, 503, 504],
        onRetry: (attempt, error) => {
          console.warn(`Drive create folder retry ${attempt}: ${error.message}`);
        },
        circuitBreaker: {
          failureThreshold: 5,
          successThreshold: 3,
          timeout: 60000,
        },
      }
    );

    const data: any = await response.json();
    
    res.json({
      success: true,
      folderId: data.id,
      folderName: data.name,
      folderUrl: `https://drive.google.com/drive/folders/${data.id}`
    });
  } catch (error: any) {
    console.error('Create folder error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create folder'
    });
  }
});

// POST /api/sheets/create-in-folder - Create sheets in specific folder
app.post('/api/sheets/create-in-folder', authenticateToken, async (req, res) => {
  try {
    const { accessToken, spreadsheetName, folderId, sheetsToCreate } = req.body;
    
    if (!accessToken || !spreadsheetName) {
      return res.status(400).json({
        success: false,
        error: 'Access token and spreadsheet name are required'
      });
    }

    // 1. Get the folder ID for the spreadsheet
    let parentId = folderId || null;
    
    // 2. Create the spreadsheet
    const createResponse = await fetchWithRetry(
      'https://sheets.googleapis.com/v4/spreadsheets',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          properties: {
            title: spreadsheetName
          }
        }),
        timeout: 30000
      },
      {
        maxRetries: 3,
        baseDelay: 1000,
        onRetry: (attempt, error) => {
          console.warn(`Google Sheets create retry ${attempt}: ${error.message}`);
        },
        circuitBreaker: {
          failureThreshold: 5,
          successThreshold: 3,
          timeout: 60000,
        },
      }
    );

    const spreadsheet: any = await createResponse.json();
    
    if (!spreadsheet.spreadsheetId) {
      throw new Error(spreadsheet.error?.message || 'Failed to create spreadsheet');
    }

    const sheetId = spreadsheet.spreadsheetId;

    // 3. If folderId provided, move spreadsheet to folder
    if (parentId) {
      try {
        const driveUpdateUrl = `https://www.googleapis.com/drive/v3/files/${sheetId}?addParents=${parentId}`;
        const moveRes = await fetchWithRetry(
          driveUpdateUrl,
          {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            timeout: DEFAULT_TIMEOUT_MS
          },
          {
            maxRetries: 2,
            baseDelay: 1000,
            onRetry: (attempt, error) => {
              console.warn(`Drive move spreadsheet retry ${attempt}: ${error.message}`);
            },
          }
        );
        if (!moveRes.ok) {
          const errData = await moveRes.json();
          console.warn('Failed to move spreadsheet to folder:', errData);
        }
      } catch (err) {
        console.error('Error moving spreadsheet to folder:', err);
      }
    }

    // 4. Define all sheets with headers
    const allSheets = [
      { name: 'HumailEli_Employees', headers: EMPLOYEE_HEADERS },
      { name: 'HumailEli_Attendance', headers: ATTENDANCE_HEADERS },
      { name: 'HumailEli_Payroll', headers: PAYROLL_HEADERS },
      { name: 'HumailEli_Leaves', headers: LEAVES_HEADERS },
      { name: 'HumailEli_Recruitment', headers: RECRUITMENT_HEADERS },
      { name: 'HumailEli_Documents', headers: DOCUMENTS_HEADERS },
      { name: 'HumailEli_Departments', headers: DEPARTMENT_HEADERS },
      { name: 'HumailEli_Designations', headers: DESIGNATION_HEADERS },
      { name: 'HumailEli_Performance_Reviews', headers: PERFORMANCE_REVIEW_HEADERS },
      { name: 'HumailEli_Performance_Goals', headers: PERFORMANCE_GOAL_HEADERS },
      { name: 'HumailEli_Training_Modules', headers: TRAINING_MODULE_HEADERS },
      { name: 'HumailEli_Training_Assignments', headers: TRAINING_ASSIGNMENT_HEADERS },
      { name: 'HumailEli_Succession', headers: SUCCESSION_HEADERS },
      { name: 'HumailEli_Onboarding_Tasks', headers: ONBOARDING_TASK_HEADERS },
      { name: 'HumailEli_Org_Chart', headers: ORG_CHART_HEADERS },
      { name: 'HumailEli_WhatsApp_Messages', headers: WHATSAPP_MESSAGE_HEADERS },
      { name: 'HumailEli_WhatsApp_Templates', headers: WHATSAPP_TEMPLATE_HEADERS },
      { name: 'HumailEli_Interview_Schedule', headers: INTERVIEW_SCHEDULE_HEADERS },
      { name: 'HumailEli_Leave_Policies', headers: LEAVE_POLICY_HEADERS },
      { name: 'HumailEli_Shifts', headers: SHIFT_HEADERS },
      { name: 'HumailEli_Shift_Assignments', headers: SHIFT_ASSIGNMENT_HEADERS },
      { name: 'HumailEli_Currencies', headers: CURRENCY_HEADERS },
      { name: 'HumailEli_Tax_Rules', headers: TAX_RULE_HEADERS },
      { name: 'HumailEli_Statutory_Deductions', headers: STATUTORY_DEDUCTION_HEADERS },
    ];

    // Filter sheets if specific ones requested
    const sheetsToCreateList = sheetsToCreate || allSheets.map(s => s.name);
    const selectedSheets = allSheets.filter(s => sheetsToCreateList.includes(s.name));

    if (selectedSheets.length === 0) {
      throw new Error('No valid sheets selected for creation');
    }

    // 5. Add sheets to spreadsheet
    // Rename the first default sheet to selectedSheets[0].name and then add the others
    const requests: any[] = [
      {
        updateSheetProperties: {
          properties: {
            sheetId: 0,
            title: selectedSheets[0].name
          },
          fields: 'title'
        }
      }
    ];

    for (let i = 1; i < selectedSheets.length; i++) {
      requests.push({
        addSheet: {
          properties: {
            title: selectedSheets[i].name,
            gridProperties: {
              rowCount: 1000,
              columnCount: selectedSheets[i].headers.length + 5
            }
          }
        }
      });
    }

    // 6. Execute batch update
    const updateResponse = await fetchWithRetry(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}:batchUpdate`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          requests
        }),
        timeout: 20000
      },
      {
        maxRetries: 3,
        baseDelay: 1000,
        retryableStatuses: [429, 500, 502, 503, 504],
        onRetry: (attempt, error) => {
          console.warn(`Drive batchUpdate sheets retry ${attempt}: ${error.message}`);
        },
        circuitBreaker: {
          failureThreshold: 5,
          successThreshold: 3,
          timeout: 60000,
        },
      }
    );

    const updateData: any = await updateResponse.json();
    if (updateData.error) {
      throw new Error(updateData.error.message || 'Failed to update sheets schema');
    }

    // 7. Write headers to each sheet
    for (const sheet of selectedSheets) {
      const colLetter = getColumnLetter(sheet.headers.length);
      const headerRange = `${sheet.name}!A1:${colLetter}1`;
      await fetchWithRetry(
        `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${headerRange}?valueInputOption=RAW`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            values: [sheet.headers]
          }),
          timeout: DEFAULT_TIMEOUT_MS
        },
        {
          maxRetries: 3,
          baseDelay: 1000,
          retryableStatuses: [429, 500, 502, 503, 504],
          onRetry: (attempt, error) => {
            console.warn(`Drive write sheets headers retry ${attempt}: ${error.message}`);
          }
        }
      );
    }

    // 8. Return success
    res.json({
      success: true,
      spreadsheetId: sheetId,
      spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${sheetId}`,
      sheetsCreated: selectedSheets.map(s => s.name),
      totalSheets: selectedSheets.length,
      folderId: parentId,
      message: `✅ Successfully created ${selectedSheets.length} sheets!`
    });

  } catch (error: any) {
    console.error('Google Sheets creation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create Google Sheets'
    });
  }
});

// ===== BIOMETRIC DEVICE ENDPOINTS =====

// POST /api/biometric/test - Test connection to biometric device
app.post('/api/biometric/test', authenticateToken, authorize(['Admin', 'HR']), async (req, res) => {
  try {
    const { deviceType, config } = req.body;
    
    // Validate
    if (!deviceType) {
      return res.status(400).json({
        success: false,
        error: 'Device type is required'
      });
    }

    // Validate required config fields for device testing
    if (!config?.host) {
      return res.status(400).json({
        success: false,
        error: 'Device host is required in config for testing'
      });
    }

    res.json({
      success: true,
      message: `Biometric device configuration accepted for ${deviceType}. Use the device-specific test endpoint (e.g., /api/zkteco/test) for actual connectivity verification.`,
      deviceType,
      config: {
        host: config.host,
        port: config.port || 80
      }
    });
  } catch (error: any) {
    console.error('Biometric test error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to test device connection'
    });
  }
});

// POST /api/biometric/sync - Sync attendance from biometric device
app.post('/api/biometric/sync', authenticateToken, authorize(['Admin', 'HR']), async (req, res) => {
  try {
    const { deviceType, config, startDate, endDate, isMockMode } = req.body;
    
    // If not in mock mode and no device/real device type, reject
    if (!isMockMode && (!deviceType || deviceType === 'mock')) {
      return res.status(400).json({
        success: false,
        error: 'No active device configured. Please configure a real biometric device or enable Mock Mode for demo/fabricated data.'
      });
    }

    // Generate mock records only if mock mode or device type is mock
    if (isMockMode || deviceType === 'mock') {
      const mockPunches = [];
      const numPunches = Math.floor(Math.random() * 10) + 5;
      
      for (let i = 0; i < numPunches; i++) {
        const date = new Date();
        date.setHours(date.getHours() - i * 3);
        mockPunches.push({
          id: `MOCK-${Date.now()}-${i}`,
          employeeId: `EMP-${String(Math.floor(Math.random() * 10) + 1).padStart(3, '0')}`,
          employeeName: ['John Doe', 'Jane Smith', 'Bob Johnson', 'Alice Williams', 'Charlie Brown'][i % 5],
          punchTime: date.toISOString(),
          punchType: i % 2 === 0 ? 'check-in' : 'check-out',
          verified: true,
          deviceName: config?.name || 'Mock Biometric Device',
          mock: true // <-- CRITICAL: mark as mock data
        });
      }

      return res.json({
        success: true,
        records: mockPunches,
        count: mockPunches.length,
        isMock: true
      });
    }

    // Default response for actual devices (normally handled through individual routes or direct connections)
    res.json({
      success: true,
      records: [],
      count: 0,
      isMock: false
    });
  } catch (error: any) {
    console.error('Biometric sync error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to sync attendance'
    });
  }
});

// GET /api/biometric/status - Get device status
app.get('/api/biometric/status', authenticateToken, authorize(['Admin', 'HR']), async (req, res) => {
  res.json({
    success: true,
    status: 'online',
    devices: [
      { id: 'DEV-001', name: 'Main Door', status: 'online', lastSync: new Date().toISOString() },
      { id: 'DEV-002', name: 'Back Door', status: 'offline', lastSync: new Date(Date.now() - 86400000).toISOString() }
    ]
  });
});

// ===== AI CONFIGURATION TEST ENDPOINT =====

// POST /api/ai/test - Test connection to AI provider
app.post('/api/ai/test', authenticateToken, async (req, res) => {
  try {
    const { provider } = req.body;
    
    if (!provider || provider === 'none') {
      return res.status(400).json({
        success: false,
        error: 'A valid AI provider is required for testing'
      });
    }

    if (provider !== 'gemini') {
      return res.status(400).json({ success: false, error: 'Only the server-configured Gemini provider is supported.' });
    }
    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ success: false, error: 'Gemini is not configured on this server.' });
    }
    res.json({ success: true, message: 'Gemini is configured on the server.' });
  } catch (error: any) {
    console.error('AI test error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to connect to the AI Provider'
    });
  }
});

// ===== ZKTECO DEVICE INTEGRATION =====

// POST /api/zkteco/test - Test connection to ZKTeco device
app.post('/api/zkteco/test', authenticateToken, authorize(['Admin', 'HR']), async (req, res) => {
  try {
    const { host, port, username, password, apiKey } = req.body;
    
    if (!host) {
      return res.status(400).json({
        success: false,
        message: 'Device host/IP is required'
      });
    }

    const endpoints = [
      { path: '/api/status', label: 'Status API' },
      { path: '/cgi-bin/status.cgi', label: 'CGI Status' },
      { path: '/device/info', label: 'Device Info' },
      { path: '/api/attendance?limit=1', label: 'Attendance API' },
    ];

    const errors: string[] = [];
    let deviceInfo = null;
    let connected = false;

    for (const endpoint of endpoints) {
      try {
        const rawUrl = `http://${host}:${port || 80}${endpoint.path}`;
      if (!isUrlSafe(rawUrl)) return res.status(403).json({ success: false, error: "Host not allowed (internal IP blocked)" });
      const url = rawUrl;
        const authHeader = buildDeviceAuthHeader(apiKey, username, password);

        const response = await fetchWithRetry(
          url,
          {
            headers: {
              'Authorization': authHeader,
              'Content-Type': 'application/json'
            },
            timeout: 5000,
          },
          {
            maxRetries: 1,
            baseDelay: 1000,
            retryableStatuses: [429, 500, 502, 503, 504],
            onRetry: (attempt, error) => {
              console.warn(`Biometric endpoint retry ${attempt}: ${error.message}`);
            },
          }
        );

        if (response.status === 401 || response.status === 403) {
          errors.push(`❌ ${endpoint.label}: Authentication failed (HTTP ${response.status})`);
          // Stop early – auth failure means all endpoints will fail
          break;
        }

        if (response.ok) {
          const data = (await response.json()) as Record<string, any>;
          deviceInfo = {
            model: data.model || data.deviceName || 'ZKTeco Device',
            firmware: data.firmware || data.version || 'Unknown',
            serialNumber: data.sn || data.serialNumber || 'Unknown',
            totalUsers: data.userCount || data.totalUsers || 0
          };
          connected = true;
          break;
        } else {
          errors.push(`⚠️ ${endpoint.label}: HTTP ${response.status}`);
        }
      } catch (error: any) {
        let errorMsg = `❌ ${endpoint.label}: `;
        if (error.name === 'AbortError' || error.name === 'TimeoutError') {
          errorMsg += 'Timeout (5s)';
        } else if (error.code === 'ECONNREFUSED') {
          errorMsg += 'Connection refused – device offline or wrong port';
        } else if (error.code === 'ENOTFOUND') {
          errorMsg += 'Host not found – wrong IP address';
        } else {
          errorMsg += error.message || 'Unknown error';
        }
        errors.push(errorMsg);
      }
    }

    if (connected && deviceInfo) {
      res.json({
        success: true,
        message: `✅ Connected to ZKTeco device at ${host}:${port}`,
        deviceInfo,
        details: errors.length > 0 ? `(Some endpoints failed: ${errors.join('; ')})` : 'All endpoints OK'
      });
    } else {
      // Build a detailed error message
      let message = `❌ Could not connect to ZKTeco device at ${host}:${port}. `;
      if (errors.length > 0) {
        message += errors.join('; ');
      } else {
        message += 'No response from any endpoint.';
      }
      res.status(400).json({
        success: false,
        message,
        errors,
        suggestedAction: 'Check IP address, port, and credentials. Ensure the device is powered on and reachable.'
      });
    }
  } catch (error: any) {
    console.error('ZKTeco test error:', error);
    res.status(500).json({
      success: false,
      message: `Connection failed: ${error.message}`
    });
  }
});

// POST /api/zkteco/punches - Fetch attendance punches from ZKTeco
app.post('/api/zkteco/punches', authenticateToken, authorize(['Admin', 'HR']), async (req, res) => {
  try {
    const { host, port, username, password, apiKey, startDate, endDate } = req.body;
    if (!host) return res.status(400).json({ success: false, error: 'Device host/IP is required' });

    let url = `http://${host}:${port || 80}/api/attendance`;
    const params = [];
    if (startDate) params.push(`from=${startDate}`);
    if (endDate) params.push(`to=${endDate}`);
    if (params.length) url += `?${params.join('&')}`;

    const response = await fetchFromDevice(url, { username, password, apiKey });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);

    const data = await response.json() as Record<string, any>;
    const list = data.data || data.records || data || [];
    const records = list.map((punch: any, index: number) => transformPunchRecord(punch, index, 'zkteco-device', 'ZKTeco Device'));

    res.json({ success: true, records, count: records.length });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch punches' });
  }
});

// POST /api/zkteco/users - Fetch users from ZKTeco
app.post('/api/zkteco/users', authenticateToken, authorize(['Admin', 'HR']), async (req, res) => {
  try {
    const { host, port, username, password, apiKey } = req.body;
    
    if (!host) {
      return res.status(400).json({
        success: false,
        error: 'Device host/IP is required'
      });
    }

    const rawUrl = `http://${host}:${port || 80}/api/users`;
      if (!isUrlSafe(rawUrl)) return res.status(403).json({ success: false, error: "Host not allowed (internal IP blocked)" });
      const url = rawUrl;
    const response = await fetchWithRetry(
      url,
      {
        headers: {
          'Authorization': buildDeviceAuthHeader(apiKey, username, password),
          'Content-Type': 'application/json'
        },
        timeout: DEFAULT_TIMEOUT_MS
      },
      {
        maxRetries: 2,
        baseDelay: 1000,
        retryableStatuses: [429, 500, 502, 503, 504],
        onRetry: (attempt, error) => {
          console.warn(`ZKTeco fetch users retry ${attempt}: ${error.message}`);
        }
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json() as Record<string, any>;
    const users = (data.data || data.users || data || []).map((user: any) => ({
      id: user.id || user.userId || user.uid,
      name: user.name || user.userName || user.fullName || `User ${user.id}`,
      employeeId: user.employeeId || user.userId || user.id
    }));

    res.json({
      success: true,
      users,
      count: users.length
    });
  } catch (error: any) {
    console.error('ZKTeco fetch users error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch users'
    });
  }
});

// POST /api/zkteco/sync-users - Sync employees to ZKTeco
app.post('/api/zkteco/sync-users', authenticateToken, authorize(['Admin', 'HR']), async (req, res) => {
  try {
    const { host, port, username, password, apiKey, employees } = req.body;
    
    if (!host) {
      return res.status(400).json({
        success: false,
        error: 'Device host/IP is required'
      });
    }

    const rawUrl = `http://${host}:${port || 80}/api/users/sync`;
      if (!isUrlSafe(rawUrl)) return res.status(403).json({ success: false, error: "Host not allowed (internal IP blocked)" });
      const url = rawUrl;
    const response = await fetchWithRetry(
      url,
      {
        method: 'POST',
        headers: {
          'Authorization': buildDeviceAuthHeader(apiKey, username, password),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ users: employees.map((e: any) => ({ id: e.id, name: e.name })) }),
        timeout: 15000
      },
      {
        maxRetries: 2,
        baseDelay: 1000,
        retryableStatuses: [429, 500, 502, 503, 504],
        onRetry: (attempt, error) => {
          console.warn(`ZKTeco sync users retry ${attempt}: ${error.message}`);
        }
      }
    );

    const data = await response.json() as Record<string, any>;
    if (response.ok) {
      res.json({
        success: true,
        synced: data.synced || employees.length,
        failed: data.failed || 0
      });
    } else {
      res.status(response.status).json({
        success: false,
        synced: 0,
        failed: employees.length,
        error: data.error || data.message || 'Device rejected sync request'
      });
    }
  } catch (error: any) {
    console.error('ZKTeco sync users error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to sync users'
    });
  }
});

// ===== BIOSTAR DEVICE INTEGRATION =====

// POST /api/biostar/test - Test connection to BioStar device
app.post('/api/biostar/test', authenticateToken, authorize(['Admin', 'HR']), async (req, res) => {
  try {
    const { host, port, username, password, apiKey } = req.body;
    
    if (!host) {
      return res.status(400).json({ success: false, message: 'Device host/IP is required' });
    }

    const endpoints = [
      { path: '/api/v1/status', label: 'Status API' },
      { path: '/api/v1/system/info', label: 'System Info' },
    ];

    const errors: string[] = [];
    let deviceInfo = null;
    let connected = false;

    for (const endpoint of endpoints) {
      try {
        const rawUrl = `http://${host}:${port || 80}${endpoint.path}`;
      if (!isUrlSafe(rawUrl)) return res.status(403).json({ success: false, error: "Host not allowed (internal IP blocked)" });
      const url = rawUrl;
        const authHeader = buildDeviceAuthHeader(apiKey, username, password);

        const response = await fetchWithRetry(
          url,
          {
            headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' },
            timeout: 5000,
          },
          {
            maxRetries: 1,
            baseDelay: 1000,
            retryableStatuses: [429, 500, 502, 503, 504],
            onRetry: (attempt, error) => {
              console.warn(`Biometric endpoint retry ${attempt}: ${error.message}`);
            },
          }
        );

        if (response.status === 401 || response.status === 403) {
          errors.push(`❌ ${endpoint.label}: Authentication failed (HTTP ${response.status})`);
          break;
        }

        if (response.ok) {
          const data = (await response.json()) as Record<string, any>;
          deviceInfo = {
            model: data.model || data.deviceName || 'BioStar Device',
            firmware: data.firmware || data.version || 'Unknown',
            serialNumber: data.sn || data.serialNumber || 'Unknown',
            totalUsers: data.userCount || data.totalUsers || 0
          };
          connected = true;
          break;
        } else {
          errors.push(`⚠️ ${endpoint.label}: HTTP ${response.status}`);
        }
      } catch (error: any) {
        let errorMsg = `❌ ${endpoint.label}: `;
        if (error.name === 'AbortError' || error.name === 'TimeoutError') {
          errorMsg += 'Timeout (5s)';
        } else if (error.code === 'ECONNREFUSED') {
          errorMsg += 'Connection refused – device offline or wrong port';
        } else if (error.code === 'ENOTFOUND') {
          errorMsg += 'Host not found – wrong IP address';
        } else {
          errorMsg += error.message || 'Unknown error';
        }
        errors.push(errorMsg);
      }
    }

    if (connected && deviceInfo) {
      res.json({ success: true, message: `✅ Connected to BioStar device at ${host}:${port}`, deviceInfo });
    } else {
      const message = `❌ Could not connect to BioStar device at ${host}:${port}. ${errors.join('; ')}`;
      res.status(400).json({ success: false, message, errors });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: `Connection failed: ${error.message}` });
  }
});

// POST /api/biostar/punches - Fetch attendance punches from BioStar
app.post('/api/biostar/punches', authenticateToken, authorize(['Admin', 'HR']), async (req, res) => {
  try {
    const { host, port, username, password, apiKey, startDate, endDate } = req.body;
    if (!host) return res.status(400).json({ success: false, error: 'Device host/IP is required' });

    let url = `http://${host}:${port || 80}/api/v1/attendance`;
    const params = [];
    if (startDate) params.push(`from=${startDate}`);
    if (endDate) params.push(`to=${endDate}`);
    if (params.length) url += `?${params.join('&')}`;

    const response = await fetchFromDevice(url, { username, password, apiKey });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json() as Record<string, any>;
    const list = data.data || data.records || data || [];
    const records = list.map((punch: any, index: number) => transformPunchRecord(punch, index, 'biostar-device', 'BioStar Device'));

    res.json({ success: true, records, count: records.length });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/biostar/users - Fetch users from BioStar
app.post('/api/biostar/users', authenticateToken, authorize(['Admin', 'HR']), async (req, res) => {
  try {
    const { host, port, username, password, apiKey } = req.body;
    
    const rawUrl = `http://${host}:${port || 80}/api/v1/users`;
      if (!isUrlSafe(rawUrl)) return res.status(403).json({ success: false, error: "Host not allowed (internal IP blocked)" });
      const url = rawUrl;
    const response = await fetchWithRetry(
      url,
      {
        headers: {
          'Authorization': buildDeviceAuthHeader(apiKey, username, password),
          'Content-Type': 'application/json'
        },
        timeout: DEFAULT_TIMEOUT_MS
      },
      {
        maxRetries: 2,
        baseDelay: 1000,
        retryableStatuses: [429, 500, 502, 503, 504],
        onRetry: (attempt, error) => {
          console.warn(`BioStar fetch users retry ${attempt}: ${error.message}`);
        }
      }
    );

    if (response.ok) {
      const data = await response.json() as Record<string, any>;
      const users = (data.data || data.users || data || []).map((user: any) => ({
        id: user.id || user.userId || user.uid,
        name: user.name || user.userName || user.fullName || `User ${user.id}`,
        employeeId: user.employeeId || user.userId || user.id
      }));
      res.json({ success: true, users, count: users.length });
    } else {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/biostar/sync-users - Sync employees to BioStar
app.post('/api/biostar/sync-users', authenticateToken, authorize(['Admin', 'HR']), async (req, res) => {
  try {
    const { host, port, username, password, apiKey, employees } = req.body;
    
    const rawUrl = `http://${host}:${port || 80}/api/v1/users/sync`;
      if (!isUrlSafe(rawUrl)) return res.status(403).json({ success: false, error: "Host not allowed (internal IP blocked)" });
      const url = rawUrl;
    const response = await fetchWithRetry(
      url,
      {
        method: 'POST',
        headers: {
          'Authorization': buildDeviceAuthHeader(apiKey, username, password),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ users: employees.map((e: any) => ({ id: e.id, name: e.name })) }),
        timeout: 15000
      },
      {
        maxRetries: 2,
        baseDelay: 1000,
        retryableStatuses: [429, 500, 502, 503, 504],
        onRetry: (attempt, error) => {
          console.warn(`BioStar sync users retry ${attempt}: ${error.message}`);
        }
      }
    );

    if (response.ok) {
      const data = await response.json() as Record<string, any>;
      res.json({
        success: true,
        synced: data.synced || employees.length,
        failed: data.failed || 0
      });
    } else {
      const data = await response.json().catch(() => ({}));
      res.status(response.status).json({
        success: false,
        synced: 0,
        failed: employees.length,
        error: data.error || data.message || 'Device rejected sync request'
      });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== HIKVISION DEVICE INTEGRATION =====

// POST /api/hikvision/test - Test connection to Hikvision device
app.post('/api/hikvision/test', authenticateToken, authorize(['Admin', 'HR']), async (req, res) => {
  try {
    const { host, port, username, password, apiKey } = req.body;
    
    if (!host) {
      return res.status(400).json({ success: false, message: 'Device host/IP is required' });
    }

    const rawUrl = `http://${host}:${port || 80}/ISAPI/System/deviceInfo`;
      if (!isUrlSafe(rawUrl)) return res.status(403).json({ success: false, error: "Host not allowed (internal IP blocked)" });
      const url = rawUrl;
    const authHeader = apiKey 
      ? `Bearer ${apiKey}`
      : buildDeviceAuthHeader(apiKey, username, password);

    let errors: string[] = [];

    try {
      const response = await fetchWithRetry(
        url,
        {
          headers: { 'Authorization': authHeader, 'Content-Type': 'application/xml' },
          timeout: 5000,
        },
        {
          maxRetries: 1,
          baseDelay: 1000,
          retryableStatuses: [429, 500, 502, 503, 504],
          onRetry: (attempt, error) => {
            console.warn(`Biometric endpoint retry ${attempt}: ${error.message}`);
          },
        }
      );

      if (response.status === 401 || response.status === 403) {
        errors.push(`Authentication failed (HTTP ${response.status})`);
      } else if (response.ok) {
        const text = await response.text();
        const modelMatch = text.match(/<model>(.*?)<\/model>/);
        const snMatch = text.match(/<serialNumber>(.*?)<\/serialNumber>/);
        res.json({
          success: true,
          message: `✅ Connected to Hikvision device at ${host}:${port}`,
          deviceInfo: {
            model: modelMatch ? modelMatch[1] : 'Hikvision Device',
            firmware: 'Unknown',
            serialNumber: snMatch ? snMatch[1] : 'Unknown',
            totalUsers: 0
          }
        });
        return;
      } else {
        errors.push(`HTTP ${response.status}`);
      }
    } catch (error: any) {
      let errorMsg = '';
      if (error.name === 'AbortError' || error.name === 'TimeoutError') {
        errorMsg = 'Timeout (5s)';
      } else if (error.code === 'ECONNREFUSED') {
        errorMsg = 'Connection refused – device offline or wrong port';
      } else if (error.code === 'ENOTFOUND') {
        errorMsg = 'Host not found – wrong IP address';
      } else {
        errorMsg = error.message || 'Unknown error';
      }
      errors.push(errorMsg);
    }

    res.status(400).json({
      success: false,
      message: `❌ Could not connect: ${errors.join('; ')}`,
      errors
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: `Connection failed: ${error.message}` });
  }
});

// POST /api/hikvision/punches - Fetch attendance punches from Hikvision
app.post('/api/hikvision/punches', authenticateToken, authorize(['Admin', 'HR']), async (req, res) => {
  try {
    const { host, port, username, password, apiKey, startDate, endDate } = req.body;
    if (!host) return res.status(400).json({ success: false, error: 'Device host/IP is required' });

    let url = `http://${host}:${port || 80}/ISAPI/AccessControl/attendanceInfo`;
    const params = [];
    if (startDate) params.push(`startTime=${startDate}`);
    if (endDate) params.push(`endTime=${endDate}`);
    if (params.length) url += `?${params.join('&')}`;

    const response = await fetchFromDevice(url, { username, password, apiKey, contentType: 'application/xml' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const text = await response.text();
    const records: any[] = [];
    const matches = text.match(/<attendanceInfo>(.*?)<\/attendanceInfo>/gs) || [];
    
    matches.forEach((match, index) => {
      const employeeIdMatch = match.match(/<employeeID>(.*?)<\/employeeID>/);
      const dateMatch = match.match(/<date>(.*?)<\/date>/);
      const timeMatch = match.match(/<time>(.*?)<\/time>/);
      const typeMatch = match.match(/<type>(.*?)<\/type>/);
      
      if (employeeIdMatch && dateMatch && timeMatch) {
        records.push(transformPunchRecord({
          employeeNo: employeeIdMatch[1],
          time: `${dateMatch[1]}T${timeMatch[1]}`,
          type: typeMatch && typeMatch[1] === '1' ? 'check-in' : 'check-out'
        }, index, 'hikvision-device', 'Hikvision Device', { employeeNo: 'employeeNo', time: 'time', type: 'type' }));
      }
    });

    res.json({ success: true, records, count: records.length });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/hikvision/users - Fetch users from Hikvision
app.post('/api/hikvision/users', authenticateToken, authorize(['Admin', 'HR']), async (req, res) => {
  try {
    const { host, port, username, password, apiKey } = req.body;
    const rawUrl = `http://${host}:${port || 80}/ISAPI/AccessControl/UserInfo/Search`;
      if (!isUrlSafe(rawUrl)) return res.status(403).json({ success: false, error: "Host not allowed (internal IP blocked)" });
      const url = rawUrl;
    const response = await fetchWithRetry(
      url,
      {
        method: 'POST',
        headers: {
          'Authorization': buildDeviceAuthHeader(apiKey, username, password),
          'Content-Type': 'application/xml'
        },
        body: `<UserInfoSearchCond><searchID>1</searchID><maxResults>100</maxResults></UserInfoSearchCond>`,
        timeout: DEFAULT_TIMEOUT_MS
      },
      {
        maxRetries: 2,
        baseDelay: 1000,
        retryableStatuses: [429, 500, 502, 503, 504],
        onRetry: (attempt, error) => {
          console.warn(`Hikvision fetch users retry ${attempt}: ${error.message}`);
        }
      }
    );

    const users: any[] = [];
    if (response.ok) {
      const text = await response.text();
      const matches = text.match(/<UserInfo>(.*?)<\/UserInfo>/gs) || [];
      matches.forEach((match) => {
        const idMatch = match.match(/<employeeNo>(.*?)<\/employeeNo>/);
        const nameMatch = match.match(/<name>(.*?)<\/name>/);
        if (idMatch) {
          users.push({
            id: idMatch[1],
            name: nameMatch ? nameMatch[1] : `User ${idMatch[1]}`,
            employeeId: idMatch[1]
          });
        }
      });
    }
    res.json({ success: true, users, count: users.length });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/hikvision/sync-users - Sync employees to Hikvision
app.post('/api/hikvision/sync-users', authenticateToken, authorize(['Admin', 'HR']), async (req, res) => {
  try {
    const { host, port, username, password, apiKey, employees } = req.body;
    
    if (!host) {
      return res.status(400).json({
        success: false,
        error: 'Device host/IP is required'
      });
    }

    const rawUrl = `http://${host}:${port || 80}/ISAPI/AccessControl/UserInfo/addUser`;
    if (!isUrlSafe(rawUrl)) return res.status(403).json({ success: false, error: "Host not allowed (internal IP blocked)" });
    const url = rawUrl;
    const response = await fetchWithRetry(
      url,
      {
        method: 'POST',
        headers: {
          'Authorization': buildDeviceAuthHeader(apiKey, username, password),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ users: employees.map((e: any) => ({ id: e.id, name: e.name })) }),
        timeout: 15000
      },
      {
        maxRetries: 2,
        baseDelay: 1000,
        retryableStatuses: [429, 500, 502, 503, 504],
        onRetry: (attempt, error) => {
          console.warn(`Hikvision sync users retry ${attempt}: ${error.message}`);
        }
      }
    );

    if (response.ok) {
      const data = await response.json() as Record<string, any>;
      res.json({
        success: true,
        synced: data.synced || employees.length,
        failed: data.failed || 0
      });
    } else {
      const data = await response.json().catch(() => ({}));
      res.status(response.status).json({
        success: false,
        synced: 0,
        failed: employees.length,
        error: data.error || data.message || 'Device rejected sync request'
      });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== GENERIC HTTP API DEVICE INTEGRATION =====

// POST /api/generic/test - Test connection to Generic HTTP API device
app.post('/api/generic/test', authenticateToken, authorize(['Admin', 'HR']), async (req, res) => {
  try {
    const { host, port, apiKey, endpoint, headers } = req.body;
    
    if (!host || !endpoint) {
      return res.status(400).json({ success: false, message: 'Host and endpoint are required' });
    }

    const rawUrl = `http://${host}:${port || 80}${endpoint}`;
      if (!isUrlSafe(rawUrl)) return res.status(403).json({ success: false, error: "Host not allowed (internal IP blocked)" });
      const url = rawUrl;
    const errors: string[] = [];

    try {
      const response = await fetchWithRetry(
        url,
        {
          headers: {
            'Authorization': apiKey ? `Bearer ${apiKey}` : '',
            'Content-Type': 'application/json',
            // Sanitize caller-supplied headers to prevent header injection
            ...(headers && typeof headers === 'object' ?
              Object.fromEntries(Object.entries(headers).filter(([k, v]) => typeof k === 'string' && typeof v === 'string' && !['host', 'content-length', 'authorization'].includes(k.toLowerCase()))) :
              {})
          },
          timeout: 5000,
        },
        {
          maxRetries: 1,
          baseDelay: 1000,
          retryableStatuses: [429, 500, 502, 503, 504],
          onRetry: (attempt, error) => {
            console.warn(`Biometric endpoint retry ${attempt}: ${error.message}`);
          },
        }
      );

      if (response.status === 401 || response.status === 403) {
        errors.push(`Authentication failed (HTTP ${response.status})`);
      } else if (response.ok) {
        const data = (await response.json()) as Record<string, any>;
        res.json({
          success: true,
          message: `✅ Connected to Generic API device at ${host}:${port}`,
          deviceInfo: {
            model: data.model || data.deviceName || 'Generic Device',
            firmware: data.firmware || data.version || 'Unknown',
            serialNumber: data.sn || data.serialNumber || 'Unknown',
            totalUsers: data.userCount || data.totalUsers || 0
          }
        });
        return;
      } else {
        errors.push(`HTTP ${response.status}`);
      }
    } catch (error: any) {
      let errorMsg = '';
      if (error.name === 'AbortError' || error.name === 'TimeoutError') {
        errorMsg = 'Timeout (5s)';
      } else if (error.code === 'ECONNREFUSED') {
        errorMsg = 'Connection refused – device offline or wrong port';
      } else if (error.code === 'ENOTFOUND') {
        errorMsg = 'Host not found – wrong IP address';
      } else {
        errorMsg = error.message || 'Unknown error';
      }
      errors.push(errorMsg);
    }

    res.status(400).json({
      success: false,
      message: `❌ Could not connect: ${errors.join('; ')}`,
      errors
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: `Connection failed: ${error.message}` });
  }
});

// POST /api/generic/punches - Fetch attendance punches from Generic API
app.post('/api/generic/punches', authenticateToken, authorize(['Admin', 'HR']), async (req, res) => {
  try {
    const { host, port, apiKey, endpoint, headers, fieldMapping, startDate, endDate } = req.body;
    if (!host || !endpoint) return res.status(400).json({ success: false, error: 'Host and endpoint are required' });

    let url = `http://${host}:${port || 80}${endpoint}`;
    const params = [];
    if (startDate && fieldMapping?.startDate) params.push(`${fieldMapping.startDate}=${startDate}`);
    if (endDate && fieldMapping?.endDate) params.push(`${fieldMapping.endDate}=${endDate}`);
    if (params.length) url += `?${params.join('&')}`;

    const response = await fetchFromDevice(url, { apiKey, headers, timeout: DEFAULT_TIMEOUT_MS });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json() as Record<string, any>;
    const list = data.data || data.records || data || [];
    const records = list.map((item: any, index: number) => {
      // Safely extract fields with fallbacks
      const id = item[fieldMapping?.id] || item.id || `GEN-${Date.now()}-${index}`;
      const employeeId = String(item[fieldMapping?.employeeId] || item.userId || `EMP-${index + 1}`);
      const employeeName = String(item[fieldMapping?.employeeName] || item.name || `Employee ${employeeId}`);
      
      // Punch time: try multiple fields, fallback to now
      const punchTime = item[fieldMapping?.punchTime] || item.time || item.datetime || item.recordTime || new Date().toISOString();
      
      // Punch type: normalize to 'check-in' or 'check-out'
      let rawType = item[fieldMapping?.punchType] || item.type || item.punchType || '';
      let punchType: 'check-in' | 'check-out' = 'check-in'; // default
      
      // Normalize: treat 'in', '1', 'check-in' as check-in; everything else as check-out
      const normalized = String(rawType).toLowerCase().trim();
      if (['in', '1', 'check-in', 'entry', 'in-out'].includes(normalized)) {
        punchType = 'check-in';
      } else if (['out', '0', 'check-out', 'exit'].includes(normalized)) {
        punchType = 'check-out';
      } else {
        // If unrecognized, use a heuristic: if the time is before 12 PM, assume check-in, else check-out
        const time = new Date(punchTime);
        const hours = time.getHours();
        if (hours < 12) {
          punchType = 'check-in';
        } else {
          punchType = 'check-out';
        }
        console.warn(`Unrecognized punch type "${rawType}" for employee ${employeeId}, defaulted to ${punchType} based on time.`);
      }

      // Verified status
      const verified = item[fieldMapping?.verified] !== undefined ? Boolean(item[fieldMapping.verified]) : true;

      return {
        id,
        deviceId: item.deviceId || 'generic-device',
        employeeId,
        employeeName,
        punchTime,
        punchType,
        verified,
        deviceName: item.deviceName || 'Generic Device',
        createdAt: new Date().toISOString(),
      };
    });

    res.json({ success: true, records, count: records.length });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/generic/users - Fetch users from Generic API
app.post('/api/generic/users', authenticateToken, authorize(['Admin', 'HR']), async (req, res) => {
  try {
    const { host, port, apiKey, endpoint, headers } = req.body;
    const rawUrl = `http://${host}:${port || 80}${endpoint || '/api/users'}`;
    if (!isUrlSafe(rawUrl)) return res.status(403).json({ success: false, error: 'Host not allowed (internal IP blocked)' });
    const url = rawUrl;
    const response = await fetchWithRetry(
      url,
      {
        headers: {
          'Authorization': apiKey ? `Bearer ${apiKey}` : '',
          // Sanitize caller-supplied headers to prevent header injection
          ...(headers && typeof headers === 'object' ?
            Object.fromEntries(Object.entries(headers).filter(([k, v]) => typeof k === 'string' && typeof v === 'string' && !['host', 'content-length', 'authorization'].includes(k.toLowerCase()))) :
            {})
        },
        timeout: DEFAULT_TIMEOUT_MS
      },
      {
        maxRetries: 2,
        baseDelay: 1000,
        retryableStatuses: [429, 500, 502, 503, 504],
        onRetry: (attempt, error) => {
          console.warn(`Generic fetch users retry ${attempt}: ${error.message}`);
        }
      }
    );

    if (response.ok) {
      const data = await response.json() as Record<string, any>;
      const list = data.data || data.users || data || [];
      const users = list.map((user: any) => ({
        id: user.id || user.userId || user.uid,
        name: user.name || user.userName || user.fullName || `User ${user.id}`,
        employeeId: user.employeeId || user.userId || user.id
      }));
      res.json({ success: true, users, count: users.length });
    } else {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/generic/sync-users - Sync employees to Generic API
app.post('/api/generic/sync-users', authenticateToken, authorize(['Admin', 'HR']), async (req, res) => {
  try {
    const { host, port, apiKey, endpoint, headers, employees } = req.body;
    const rawUrl = `http://${host}:${port || 80}${endpoint || '/api/users/sync'}`;
    if (!isUrlSafe(rawUrl)) return res.status(403).json({ success: false, error: 'Host not allowed (internal IP blocked)' });
    const url = rawUrl;
    const response = await fetchWithRetry(
      url,
      {
        method: 'POST',
        headers: {
          'Authorization': apiKey ? `Bearer ${apiKey}` : '',
          'Content-Type': 'application/json',
          // Sanitize caller-supplied headers to prevent header injection
          ...(headers && typeof headers === 'object' ?
            Object.fromEntries(Object.entries(headers).filter(([k, v]) => typeof k === 'string' && typeof v === 'string' && !['host', 'content-length', 'authorization'].includes(k.toLowerCase()))) :
            {})
        },
        body: JSON.stringify({ users: employees.map((e: any) => ({ id: e.id, name: e.name })) }),
        timeout: 15000
      },
      {
        maxRetries: 2,
        baseDelay: 1000,
        retryableStatuses: [429, 500, 502, 503, 504],
        onRetry: (attempt, error) => {
          console.warn(`Generic sync users retry ${attempt}: ${error.message}`);
        }
      }
    );

    if (response.ok) {
      const data = await response.json() as Record<string, any>;
      res.json({
        success: true,
        synced: data.synced || employees.length,
        failed: data.failed || 0
      });
    } else {
      const data = await response.json().catch(() => ({}));
      res.status(response.status).json({
        success: false,
        synced: 0,
        failed: employees.length,
        error: data.error || data.message || 'Device rejected sync request'
      });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});






// ============================================================
//  GOOGLE DRIVE FILE UPLOAD (for Documents)
// ============================================================
import multer from 'multer';
import { Readable } from 'stream';

// Configure multer to store in memory (we'll stream to Drive)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// POST /api/drive/upload – upload a file to Google Drive
app.post('/api/drive/upload', authenticateToken, upload.single('file'), async (req: any, res: any) => {
  try {
    const { accessToken, folderId, documentType, documentTypeLabel, employeeId, employeeName } = req.body;
    const file = req.file;

    if (!accessToken) {
      return res.status(400).json({ success: false, error: 'Access token is required' });
    }
    if (!file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    // Prepare file metadata for Drive
    const metadata = {
      name: file.originalname,
      mimeType: file.mimetype,
      parents: folderId ? [folderId] : [],
    };

    // Create a readable stream from the buffer
    const bufferStream = new Readable();
    bufferStream.push(file.buffer);
    bufferStream.push(null); // end stream

    // Use the Drive API to upload the file
    const formData = new FormData();
    formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    formData.append('file', new Blob([file.buffer], { type: file.mimetype }), file.originalname);

    const driveResponse = await fetchWithRetry(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          // Content-Type is set automatically by FormData with boundary
        },
        body: formData,
        timeout: 60000, // Longer timeout for large files
      },
      {
        maxRetries: 2,
        baseDelay: 2000,
        retryableStatuses: [429, 500, 502, 503, 504],
        onRetry: (attempt, error) => {
          console.warn(`Drive upload retry ${attempt}: ${error.message}`);
        },
        circuitBreaker: {
          failureThreshold: 3,
          successThreshold: 2,
          timeout: 120000,
        },
      }
    );

    if (!driveResponse.ok) {
      const errorText = await driveResponse.text();
      throw new Error(`Drive API error: ${driveResponse.status} ${errorText}`);
    }

    const driveData = await driveResponse.json() as any;

    // Return the file info
    res.json({
      success: true,
      fileId: driveData.id,
      fileName: driveData.name,
      mimeType: driveData.mimeType,
      webViewLink: driveData.webViewLink || `https://drive.google.com/file/d/${driveData.id}/view`,
      fileUrl: `https://drive.google.com/uc?export=view&id=${driveData.id}`,
    });
  } catch (error: any) {
    console.error('Drive upload error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Setup Vite Dev Server / Static Asset Serving
async function bootServer() {
  if (process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "test") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Mounted Vite middleware for local development.");
  } else if (process.env.NODE_ENV === "production") {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving static production assets from /dist.");
  }

  if (process.env.NODE_ENV !== "test") {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Humail Eli HRM server booting up on http://localhost:${PORT}`);
    });
  }
}

if (process.env.NODE_ENV !== "test" && typeof process.env.JEST_WORKER_ID === 'undefined') {
  bootServer();
}

export default app;
