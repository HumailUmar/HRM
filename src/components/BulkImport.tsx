import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { 
  Employee, AttendanceRecord, PayrollRecord, LeaveRecord, AppSettings, TimelineEvent 
} from '../types';
import { 
  UploadCloud, CheckCircle2, AlertTriangle, FileText, ArrowRight, Download, 
  RefreshCw, AlertCircle, Play, ChevronRight, CheckSquare, Square, X, Info
} from 'lucide-react';
import { getNextEmployeeId } from '../utils/idHelper';

// Custom CSV Parser supporting double quotes, escaped quotes, and commas inside fields
export function parseCSV(text: string): string[][] {
  const lines: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];
    
    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          cell += '"';
          i++; // Skip next quote
        } else {
          inQuotes = false;
        }
      } else {
        cell += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        row.push(cell.trim());
        cell = '';
      } else if (char === '\r' || char === '\n') {
        if (char === '\r' && nextChar === '\n') {
          i++; // Skip the \n
        }
        row.push(cell.trim());
        if (row.length > 1 || row[0] !== '') {
          lines.push(row);
        }
        row = [];
        cell = '';
      } else {
        cell += char;
      }
    }
  }
  if (cell !== '' || row.length > 0) {
    row.push(cell.trim());
    if (row.length > 1 || row[0] !== '') {
      lines.push(row);
    }
  }
  return lines;
}

interface BulkImportProps {
  employees: Employee[];
  setEmployees: (employees: Employee[]) => void;
  attendance: AttendanceRecord[];
  setAttendance: (records: AttendanceRecord[]) => void;
  payrolls: PayrollRecord[];
  setPayrolls: (records: PayrollRecord[]) => void;
  leaves: LeaveRecord[];
  setLeaves: (records: LeaveRecord[]) => void;
  settings: AppSettings;
}

type ImportType = 'employees' | 'attendance' | 'payroll' | 'leaves';

interface ColumnMapping {
  systemField: string;
  csvHeader: string; // The selected CSV header name
  required: boolean;
}

interface RowError {
  row: number;
  data: string;
  reason: string;
}

export default function BulkImport({
  employees,
  setEmployees,
  attendance,
  setAttendance,
  payrolls,
  setPayrolls,
  leaves,
  setLeaves,
  settings
}: BulkImportProps) {
  // Wizard Steps: 1: select & upload, 2: mapping & preview, 3: import & progress, 4: results
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [importType, setImportType] = useState<ImportType>('employees');
  const [fileName, setFileName] = useState('');
  const [rawCsvData, setRawCsvData] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [duplicateHandling, setDuplicateHandling] = useState<'skip' | 'overwrite'>('skip');
  
  // Drag and drop states
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Import execution states
  const [progress, setProgress] = useState(0);
  const [processedRowsCount, setProcessedRowsCount] = useState(0);
  const [successCount, setSuccessCount] = useState(0);
  const [skippedCount, setSkippedCount] = useState(0);
  const [currentErrors, setCurrentErrors] = useState<RowError[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  // System Fields Definition
  const systemFields: Record<ImportType, { key: string; label: string; required: boolean; synonyms: string[] }[]> = {
    employees: [
      { key: 'name', label: 'Name', required: true, synonyms: ['name', 'full name', 'employee name', 'employee'] },
      { key: 'email', label: 'Email', required: true, synonyms: ['email', 'email address', 'mail'] },
      { key: 'phone', label: 'Phone', required: false, synonyms: ['phone', 'phone number', 'contact', 'telephone', 'cell'] },
      { key: 'role', label: 'Role', required: false, synonyms: ['role', 'designation', 'job title', 'position'] },
      { key: 'department', label: 'Department', required: false, synonyms: ['department', 'dept', 'division'] },
      { key: 'baseSalary', label: 'Base Salary', required: false, synonyms: ['base salary', 'salary', 'pay', 'monthly pay', 'rate'] },
      { key: 'joiningDate', label: 'Joining Date', required: false, synonyms: ['joining date', 'join date', 'hire date', 'start date'] }
    ],
    attendance: [
      { key: 'employeeIdOrEmail', label: 'Employee ID/Email', required: true, synonyms: ['employee id', 'id', 'email', 'employee email', 'emp id'] },
      { key: 'date', label: 'Date', required: true, synonyms: ['date', 'attendance date', 'day'] },
      { key: 'checkIn', label: 'Check-In', required: false, synonyms: ['check-in', 'checkin', 'in time', 'time in', 'start'] },
      { key: 'checkOut', label: 'Check-Out', required: false, synonyms: ['check-out', 'checkout', 'out time', 'time out', 'end'] }
    ],
    payroll: [
      { key: 'employeeIdOrEmail', label: 'Employee ID/Email', required: true, synonyms: ['employee id', 'id', 'email', 'employee email', 'emp id'] },
      { key: 'month', label: 'Month', required: true, synonyms: ['month', 'payroll month', 'period', 'salary month'] },
      { key: 'baseSalary', label: 'Base Salary', required: true, synonyms: ['base salary', 'salary', 'basic', 'basic salary'] },
      { key: 'bonus', label: 'Bonus', required: false, synonyms: ['bonus', 'allowance', 'incentive'] },
      { key: 'deductions', label: 'Deductions', required: false, synonyms: ['deductions', 'penalty', 'deduction', 'tax'] },
      { key: 'netPay', label: 'Net Pay', required: true, synonyms: ['net pay', 'net salary', 'take home', 'payout', 'amount'] }
    ],
    leaves: [
      { key: 'employeeIdOrEmail', label: 'Employee ID/Email', required: true, synonyms: ['employee id', 'id', 'email', 'employee email', 'emp id'] },
      { key: 'leaveType', label: 'Leave Type', required: true, synonyms: ['leave type', 'type', 'category', 'leave category'] },
      { key: 'startDate', label: 'Start Date', required: true, synonyms: ['start date', 'from date', 'leave start'] },
      { key: 'endDate', label: 'End Date', required: true, synonyms: ['end date', 'to date', 'leave end'] },
      { key: 'status', label: 'Status', required: true, synonyms: ['status', 'leave status', 'approval status', 'approval'] }
    ]
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const processFile = (file: File) => {
    if (!file.name.endsWith('.csv')) {
      alert('Currently we only support CSV data files for reliable imports. Please export your Excel to CSV format and upload.');
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsed = parseCSV(text);
      if (parsed.length < 2) {
        alert('The uploaded file appears to be empty or lacks headers.');
        return;
      }

      const fileHeaders = parsed[0].map(h => h.trim());
      setHeaders(fileHeaders);
      setRawCsvData(parsed.slice(1)); // All rows except header

      // Attempt automatic mapping
      const autoMappings: Record<string, string> = {};
      const fields = systemFields[importType];

      fields.forEach(field => {
        const match = fileHeaders.find(header => 
          field.synonyms.includes(header.toLowerCase()) || 
          header.toLowerCase() === field.label.toLowerCase() ||
          header.toLowerCase().replace(/\s+/g, '') === field.key.toLowerCase()
        );
        if (match) {
          autoMappings[field.key] = match;
        } else {
          autoMappings[field.key] = '';
        }
      });

      setMappings(autoMappings);
      setStep(2);
    };
    reader.readAsText(file);
  };

  const handleMappingChange = (fieldKey: string, csvHeader: string) => {
    setMappings(prev => ({
      ...prev,
      [fieldKey]: csvHeader
    }));
  };

  // Helper: Get row index of mapped field
  const getMappedValue = (row: string[], fieldKey: string): string => {
    const headerName = mappings[fieldKey];
    if (!headerName) return '';
    const index = headers.indexOf(headerName);
    return index !== -1 ? row[index] || '' : '';
  };

  // Date check within 365 days
  const isValidDateWithinYear = (dateStr: string): boolean => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return false;
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - d.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 365;
  };

  // Run Bulk Import
  const startImporting = async () => {
    // Validate mapping selections
    const fields = systemFields[importType];
    const missingRequired = fields.filter(f => f.required && !mappings[f.key]);
    if (missingRequired.length > 0) {
      alert(`Please map all required system fields: ${missingRequired.map(f => f.label).join(', ')}`);
      return;
    }

    setIsImporting(true);
    setProgress(0);
    setProcessedRowsCount(0);
    setSuccessCount(0);
    setSkippedCount(0);
    setCurrentErrors([]);
    setStep(3);

    const errors: RowError[] = [];
    let success = 0;
    let skipped = 0;

    // We make clones of current states to modify row-by-row
    let currentEmployeesClone = [...employees];
    let currentAttendanceClone = [...attendance];
    let currentPayrollClone = [...payrolls];
    let currentLeavesClone = [...leaves];

    const totalRows = rawCsvData.length;

    for (let index = 0; index < totalRows; index++) {
      const row = rawCsvData[index];
      const rowNum = index + 2; // 1-based, including header row
      const rawRowStr = row.join(',');

      // Progress animation delay
      await new Promise(resolve => setTimeout(resolve, Math.max(50, Math.min(150, 500 / totalRows))));

      try {
        if (importType === 'employees') {
          const name = getMappedValue(row, 'name');
          const email = getMappedValue(row, 'email').trim();
          const phone = getMappedValue(row, 'phone');
          const designationValue = getMappedValue(row, 'role') || 'Employee';
          const department = getMappedValue(row, 'department') || 'General';
          const baseSalaryStr = getMappedValue(row, 'baseSalary');
          const joiningDateStr = getMappedValue(row, 'joiningDate');

          // Validation
          if (!name) {
            throw new Error('Name is required and cannot be empty.');
          }
          if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            throw new Error(`Invalid email address format: "${email || 'empty'}"`);
          }
          const baseSalary = Number(baseSalaryStr.replace(/[^0-9.]/g, '')) || 3000;
          if (baseSalaryStr && isNaN(Number(baseSalaryStr.replace(/[^0-9.]/g, '')))) {
            throw new Error(`Invalid salary format: "${baseSalaryStr}"`);
          }

          let finalJoiningDate = new Date().toISOString().split('T')[0];
          if (joiningDateStr) {
            const d = new Date(joiningDateStr);
            if (isNaN(d.getTime())) {
              throw new Error(`Invalid joining date: "${joiningDateStr}"`);
            }
            finalJoiningDate = d.toISOString().split('T')[0];
          }

          // Check duplicate
          const existingIndex = currentEmployeesClone.findIndex(e => e.email.toLowerCase() === email.toLowerCase());
          if (existingIndex !== -1) {
            if (duplicateHandling === 'skip') {
              skipped++;
              setSkippedCount(skipped);
              continue; // Skip silently
            } else {
              // Overwrite
              const existingEmp = currentEmployeesClone[existingIndex];
              const updatedEmp: Employee = {
                ...existingEmp,
                name,
                personal: { 
                  ...existingEmp.personal, 
                  phone: phone || existingEmp.personal.phone 
                },
                employment: { 
                  ...existingEmp.employment, 
                  joiningDate: finalJoiningDate,
                  designationId: designationValue,
                  departmentId: department,
                  role: existingEmp.employment.role || 'Employee'
                },
                compensation: {
                  ...existingEmp.compensation,
                  salaryStructure: existingEmp.compensation.salaryStructure ? {
                    ...existingEmp.compensation.salaryStructure,
                    totalMonthly: baseSalary
                  } : undefined
                }
              };
              currentEmployeesClone[existingIndex] = updatedEmp;
              success++;

              // Sync to GSheets in production mode
              if (!settings.isMockMode) {
                const { syncEmployeeToGSheet } = await import('../lib/storage');
                await syncEmployeeToGSheet(updatedEmp);
              }
            }
          } else {
            // Create brand new employee
            const nextId = getNextEmployeeId(currentEmployeesClone);
            const newEmp: Employee = {
              id: nextId,
              name,
              email,
              status: 'Active',
              personal: {
                name,
                email,
                phone: phone || '',
                profileImage: '',
                cnic: '',
                gender: 'Prefer not to say',
                dateOfBirth: '',
                currentAddress: '',
                emergencyContactName: '',
                emergencyContactPhone: '',
                emergencyContactRelationship: ''
              },
              employment: {
                designationId: designationValue,
                departmentId: department,
                joiningDate: finalJoiningDate,
                role: 'Employee',
                seatNumber: 0,
                workLocation: 'Office',
                employmentType: 'Permanent',
                status: 'Active'
              },
              compensation: {
                currency: 'USD',
                payGradeId: '',
                salaryStructure: {
                  id: `SAL-${Date.now()}`,
                  employeeId: nextId,
                  components: [],
                  totalMonthly: baseSalary,
                  totalAnnual: baseSalary * 12,
                  ctc: baseSalary * 13,
                  currency: 'USD',
                  effectiveFrom: finalJoiningDate,
                  isActive: true,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  employerContributions: { pf: 0, esi: 0, gratuity: 0 }
                }
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
              exit: null,
              journeyTimeline: [
                {
                  id: `EVT-${Date.now()}-hired`,
                  stage: 'Onboarding',
                  date: finalJoiningDate,
                  title: 'Employee Bulk Imported',
                  description: `Profile imported automatically via Bulk Data Import tool.`
                }
              ]
            };
            currentEmployeesClone.push(newEmp);
            success++;

            // Sync to GSheets in production mode
            if (!settings.isMockMode) {
              const { syncEmployeeToGSheet } = await import('../lib/storage');
              await syncEmployeeToGSheet(newEmp);
            }
          }

        } else if (importType === 'attendance') {
          const empIdOrEmail = getMappedValue(row, 'employeeIdOrEmail').trim();
          const dateStr = getMappedValue(row, 'date').trim();
          const checkIn = getMappedValue(row, 'checkIn').trim();
          const checkOut = getMappedValue(row, 'checkOut').trim();

          if (!empIdOrEmail) throw new Error('Employee ID or Email is required.');
          if (!dateStr) throw new Error('Attendance Date is required.');

          const emp = currentEmployeesClone.find(e => 
            e.id.toLowerCase() === empIdOrEmail.toLowerCase() || 
            e.email.toLowerCase() === empIdOrEmail.toLowerCase()
          );

          if (!emp) {
            throw new Error(`Employee with ID or Email "${empIdOrEmail}" does not exist in the database.`);
          }

          // Validate date within 365 days
          const dateObj = new Date(dateStr);
          if (isNaN(dateObj.getTime())) {
            throw new Error(`Invalid date format: "${dateStr}"`);
          }
          if (!isValidDateWithinYear(dateStr)) {
            throw new Error(`Attendance date "${dateStr}" is not within the last 365 days.`);
          }

          // Calculate status, late and early minutes
          let lateMinutes = 0;
          let earlyDepartureMinutes = 0;
          let calculatedStatus: 'Full Day' | 'Half Day' | 'Absent' = 'Full Day';

          if (!checkIn && !checkOut) {
            calculatedStatus = 'Absent';
          } else {
            if (checkIn) {
              const [inH, inM] = checkIn.split(':').map(Number);
              if (isNaN(inH) || isNaN(inM)) throw new Error(`Invalid Check-In time format: "${checkIn}"`);
              const inTotal = inH * 60 + inM;
              const lateThresholdStr = settings.attendanceRules?.lateThreshold || "09:05";
              const [lh, lm] = lateThresholdStr.split(':').map(Number);
              let threshold = lh * 60 + lm;

              if (settings.companySettings?.workStartTime && settings.attendanceRules?.gracePeriodMinutes !== undefined) {
                const [wsH, wsM] = settings.companySettings.workStartTime.split(':').map(Number);
                threshold = wsH * 60 + wsM + settings.attendanceRules.gracePeriodMinutes;
              }

              if (inTotal > threshold) {
                lateMinutes = inTotal - threshold;
              }
            }

            if (checkOut) {
              const [outH, outM] = checkOut.split(':').map(Number);
              if (isNaN(outH) || isNaN(outM)) throw new Error(`Invalid Check-Out time format: "${checkOut}"`);
              const outTotal = outH * 60 + outM;
              const earlyOutStr = settings.attendanceRules?.earlyDepartureThreshold || "17:55";
              const [eh, em] = earlyOutStr.split(':').map(Number);
              const threshold = eh * 60 + em;

              if (outTotal < threshold) {
                earlyDepartureMinutes = threshold - outTotal;
              }
            }

            if (checkIn && checkOut) {
              const [inH, inM] = checkIn.split(':').map(Number);
              const [outH, outM] = checkOut.split(':').map(Number);
              const workMins = (outH * 60 + outM) - (inH * 60 + inM);
              const workHours = workMins / 60;
              const halfLimit = settings.attendanceRules?.halfDayHours ?? 4;
              if (workHours < halfLimit) {
                calculatedStatus = 'Half Day';
              }
            }
          }

          // Create record
          const attendanceRecord: AttendanceRecord = {
            id: `ATT-IMP-${Date.now().toString().slice(-4)}-${index}`,
            employeeId: emp.id,
            employeeName: emp.name,
            date: dateStr,
            checkIn: checkIn || '',
            checkOut: checkOut || '',
            lateMinutes,
            earlyDepartureMinutes,
            status: calculatedStatus
          };

          currentAttendanceClone.push(attendanceRecord);
          success++;

          // Sync to GSheet in production
          if (!settings.isMockMode) {
            const { syncAttendanceToGSheet } = await import('../lib/storage');
            await syncAttendanceToGSheet([attendanceRecord]);
          }

        } else if (importType === 'payroll') {
          const empIdOrEmail = getMappedValue(row, 'employeeIdOrEmail').trim();
          const month = getMappedValue(row, 'month').trim();
          const baseSalaryStr = getMappedValue(row, 'baseSalary');
          const bonusStr = getMappedValue(row, 'bonus');
          const deductionsStr = getMappedValue(row, 'deductions');
          const netPayStr = getMappedValue(row, 'netPay');

          if (!empIdOrEmail) throw new Error('Employee ID/Email is required.');
          if (!month) throw new Error('Month name/period is required.');
          if (!baseSalaryStr) throw new Error('Base Salary value is required.');
          if (!netPayStr) throw new Error('Net Pay amount is required.');

          const emp = currentEmployeesClone.find(e => 
            e.id.toLowerCase() === empIdOrEmail.toLowerCase() || 
            e.email.toLowerCase() === empIdOrEmail.toLowerCase()
          );

          if (!emp) {
            throw new Error(`Employee with ID or Email "${empIdOrEmail}" does not exist in the database.`);
          }

          const baseSalary = Number(baseSalaryStr.replace(/[^0-9.]/g, ''));
          const bonus = Number((bonusStr || '0').replace(/[^0-9.]/g, '')) || 0;
          const deductions = Number((deductionsStr || '0').replace(/[^0-9.]/g, '')) || 0;
          const netSalary = Number(netPayStr.replace(/[^0-9.]/g, ''));

          if (isNaN(baseSalary) || baseSalary < 0) throw new Error(`Invalid Base Salary amount: "${baseSalaryStr}"`);
          if (isNaN(bonus) || bonus < 0) throw new Error(`Invalid Bonus amount: "${bonusStr}"`);
          if (isNaN(deductions) || deductions < 0) throw new Error(`Invalid Deductions amount: "${deductionsStr}"`);
          if (isNaN(netSalary) || netSalary < 0) throw new Error(`Invalid Net Pay amount: "${netPayStr}"`);

          const payrollRecord: PayrollRecord = {
            id: `PAY-IMP-${Date.now().toString().slice(-4)}-${index}`,
            employeeId: emp.id,
            employeeName: emp.name,
            month,
            baseSalary,
            bonus,
            penalty: deductions,
            leaveDeductions: 0,
            netSalary,
            status: 'Paid',
            calculatedAt: new Date().toISOString()
          };

          currentPayrollClone.push(payrollRecord);
          success++;

          // Sync to GSheet in production
          if (!settings.isMockMode) {
            const { syncPayrollToGSheet } = await import('../lib/storage');
            await syncPayrollToGSheet([payrollRecord]);
          }

        } else if (importType === 'leaves') {
          const empIdOrEmail = getMappedValue(row, 'employeeIdOrEmail').trim();
          const leaveType = getMappedValue(row, 'leaveType').trim();
          const startDateStr = getMappedValue(row, 'startDate').trim();
          const endDateStr = getMappedValue(row, 'endDate').trim();
          const statusStr = getMappedValue(row, 'status').trim();

          if (!empIdOrEmail) throw new Error('Employee ID/Email is required.');
          if (!leaveType) throw new Error('Leave Type is required.');
          if (!startDateStr || !endDateStr) throw new Error('Start and End Dates are required.');
          if (!statusStr) throw new Error('Leave approval status is required.');

          const emp = currentEmployeesClone.find(e => 
            e.id.toLowerCase() === empIdOrEmail.toLowerCase() || 
            e.email.toLowerCase() === empIdOrEmail.toLowerCase()
          );

          if (!emp) {
            throw new Error(`Employee with ID or Email "${empIdOrEmail}" does not exist in the database.`);
          }

          const startD = new Date(startDateStr);
          const endD = new Date(endDateStr);
          if (isNaN(startD.getTime())) throw new Error(`Invalid Start Date: "${startDateStr}"`);
          if (isNaN(endD.getTime())) throw new Error(`Invalid End Date: "${endDateStr}"`);
          if (endD < startD) throw new Error(`End Date "${endDateStr}" cannot precede Start Date "${startDateStr}"`);

          // Format status correctly
          let finalStatus: 'Pending' | 'Approved' | 'Rejected' = 'Approved';
          const statLower = statusStr.toLowerCase();
          if (statLower.includes('pend')) finalStatus = 'Pending';
          else if (statLower.includes('reject') || statLower.includes('deni')) finalStatus = 'Rejected';
          else if (statLower.includes('approv') || statLower.includes('allow') || statLower.includes('yes')) finalStatus = 'Approved';

          const leaveRecord: LeaveRecord = {
            id: `LR-IMP-${Date.now().toString().slice(-4)}-${index}`,
            employeeId: emp.id,
            employeeName: emp.name,
            leaveType,
            startDate: startDateStr,
            endDate: endDateStr,
            reason: 'Historical data bulk imported via settings.',
            status: finalStatus,
            approvedBy: finalStatus === 'Approved' ? 'Bulk Data Importer' : undefined,
            approvedAt: finalStatus === 'Approved' ? new Date().toISOString().split('T')[0] : undefined
          };

          currentLeavesClone.push(leaveRecord);
          success++;

          // Sync to GSheet in production
          if (!settings.isMockMode) {
            const { syncLeaveToGSheet } = await import('../lib/storage');
            await syncLeaveToGSheet(leaveRecord);
          }
        }

        setSuccessCount(success);

      } catch (err: any) {
        errors.push({
          row: rowNum,
          data: rawRowStr,
          reason: err.message || 'Unknown processing error.'
        });
        setCurrentErrors([...errors]);
      }

      setProcessedRowsCount(index + 1);
      setProgress(Math.round(((index + 1) / totalRows) * 100));
    }

    // Save final arrays back to central states
    if (importType === 'employees') setEmployees(currentEmployeesClone);
    else if (importType === 'attendance') setAttendance(currentAttendanceClone);
    else if (importType === 'payroll') setPayrolls(currentPayrollClone);
    else if (importType === 'leaves') setLeaves(currentLeavesClone);

    setIsImporting(false);
    setStep(4);
  };

  // Download Failed CSV Report
  const handleDownloadErrors = () => {
    if (currentErrors.length === 0) return;
    
    const csvRows = [
      ['Row Number', 'Raw Line Data', 'Reason for Failure'].join(',')
    ];

    currentErrors.forEach(err => {
      const rawRowEscaped = err.data.replace(/"/g, '""');
      const reasonEscaped = err.reason.replace(/"/g, '""');
      csvRows.push(`${err.row},"${rawRowEscaped}","${reasonEscaped}"`);
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Bulk_Import_Errors_${importType}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetImporter = () => {
    setFileName('');
    setRawCsvData([]);
    setHeaders([]);
    setMappings({});
    setCurrentErrors([]);
    setProgress(0);
    setStep(1);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm space-y-6" id="bulk-import-section">
      <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 font-sans flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-indigo-600" />
            Bulk Data Import Engine
          </h3>
          <p className="text-xs text-slate-400 mt-1 font-sans leading-relaxed">
            Bulk-upload and synchronize company employees, legacy attendance logs, payroll summaries, or leave history directly into Google Sheets (production mode) or local database.
          </p>
        </div>
        {step > 1 && (
          <button 
            onClick={resetImporter}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 border border-slate-200 hover:border-slate-300 px-3 py-1.5 rounded-xl transition-all"
          >
            Cancel & Reset
          </button>
        )}
      </div>

      {/* STEP 1: Select Type & Drag-and-Drop */}
      {step === 1 && (
        <div className="space-y-6 animate-fade-in">
          {/* Target Type Selector */}
          <div className="space-y-2">
            <label className="text-xs font-extrabold uppercase tracking-widest text-slate-400 font-mono">
              1. Select Data Import Category
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {(['employees', 'attendance', 'payroll', 'leaves'] as ImportType[]).map((type) => {
                const isSelected = importType === type;
                const labels: Record<ImportType, string> = {
                  employees: 'Employee Roster',
                  attendance: 'Attendance Logs',
                  payroll: 'Payroll History',
                  leaves: 'Leaves Summary'
                };
                const descriptions: Record<ImportType, string> = {
                  employees: 'Name, email, base pay, hire dates...',
                  attendance: 'Dates, check-in, check-out...',
                  payroll: 'Monthly salaries, bonus, net pay...',
                  leaves: 'Leave types, durations, approvals...'
                };

                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setImportType(type)}
                    className={`p-4 rounded-xl text-left border transition-all flex flex-col justify-between h-28 cursor-pointer ${
                      isSelected 
                        ? 'bg-indigo-50/50 border-indigo-500 shadow-sm shadow-indigo-100/55 text-indigo-950' 
                        : 'bg-white border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/30'
                    }`}
                  >
                    <span className={`text-[10px] font-black uppercase tracking-wider ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`}>
                      {type}
                    </span>
                    <div>
                      <p className="text-xs font-bold font-sans truncate">{labels[type]}</p>
                      <p className="text-[9px] text-slate-450 leading-normal mt-0.5">{descriptions[type]}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Upload Dropzone */}
          <div className="space-y-2">
            <label className="text-xs font-extrabold uppercase tracking-widest text-slate-400 font-mono">
              2. Upload CSV File
            </label>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                isDragging 
                  ? 'border-indigo-500 bg-indigo-50/30' 
                  : 'border-slate-200 hover:border-indigo-400 hover:bg-slate-50/20'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".csv"
                className="hidden"
              />
              <div className="w-12 h-12 rounded-full bg-slate-100/80 flex items-center justify-center text-slate-500 mb-4 shadow-sm">
                <UploadCloud className="w-6 h-6 text-slate-500" />
              </div>
              <p className="text-xs font-bold text-slate-700 font-sans">
                Drag and drop your spreadsheet file here, or <span className="text-indigo-600 hover:underline">browse files</span>
              </p>
              <p className="text-[10px] text-slate-400 mt-1 leading-normal font-sans">
                Only standard CSV format files are supported. CSV exports from MS Excel, Google Sheets, or ERP tools are ideal.
              </p>
            </div>
          </div>

          {/* Demo/Instructions card */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-3">
            <Info className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-700">Quick Excel-to-CSV instructions</p>
              <p className="text-[10px] text-slate-500 leading-relaxed font-sans">
                1. Open your Excel data worksheet.<br />
                2. Click <strong>File → Save As</strong> and select <strong>CSV (Comma Delimited) (*.csv)</strong> from the file type options.<br />
                3. Drag and drop that saved .csv file above to preview columns and start mapping.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: Mapping & Preview */}
      {step === 2 && (
        <div className="space-y-6 animate-fade-in">
          {/* File summary */}
          <div className="p-4 bg-indigo-50/30 rounded-2xl border border-indigo-100/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5 font-sans">
                <FileText className="w-4 h-4 text-indigo-600" />
                {fileName}
              </p>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                {rawCsvData.length} records parsed • Category: <strong className="uppercase font-mono text-indigo-600">{importType}</strong>
              </p>
            </div>
            <button 
              onClick={resetImporter}
              className="text-[10px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 px-3 py-1 rounded"
            >
              Choose different file
            </button>
          </div>

          {/* First 5 rows preview table */}
          <div className="space-y-2">
            <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 font-mono">
              CSV Rows Preview (First 5 Rows)
            </h4>
            <div className="overflow-x-auto rounded-xl border border-slate-200/80">
              <table className="w-full text-left text-[10px] border-collapse bg-white">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                    <th className="p-2.5 font-bold border-r border-slate-100 w-12 text-center">Row</th>
                    {headers.map((h, i) => (
                      <th key={i} className="p-2.5 font-bold border-r border-slate-100 font-mono">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {rawCsvData.slice(0, 5).map((row, rowIndex) => (
                    <tr key={rowIndex} className="hover:bg-slate-50/30 text-slate-700">
                      <td className="p-2.5 font-bold text-slate-400 bg-slate-50/50 border-r border-slate-100 text-center">{rowIndex + 2}</td>
                      {headers.map((_, colIndex) => (
                        <td key={colIndex} className="p-2.5 border-r border-slate-100 font-mono truncate max-w-[150px]">
                          {row[colIndex] !== undefined ? row[colIndex] : <span className="text-slate-350 italic">empty</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Column Mapping Fields */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 font-mono">
                Column Mapping Map System Fields
              </h4>
              <span className="text-[9px] text-slate-450 font-medium">Auto-detected mapped columns based on keyword headers.</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {systemFields[importType].map((field) => {
                const currentMapped = mappings[field.key] || '';
                return (
                  <div key={field.key} className="p-3 bg-slate-50/50 hover:bg-slate-50 rounded-xl border border-slate-200/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-800">{field.label}</span>
                        {field.required ? (
                          <span className="text-[8px] bg-rose-100 text-rose-600 px-1.5 py-0.2 rounded font-black uppercase tracking-wider">Required</span>
                        ) : (
                          <span className="text-[8px] bg-slate-150 text-slate-500 px-1.5 py-0.2 rounded font-semibold uppercase tracking-wider">Optional</span>
                        )}
                      </div>
                      <p className="text-[9px] text-slate-400 leading-normal mt-0.5">Key: <strong className="font-mono text-[8px]">{field.key}</strong></p>
                    </div>

                    <select
                      value={currentMapped}
                      onChange={(e) => handleMappingChange(field.key, e.target.value)}
                      className="h-8 text-[11px] font-bold border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 px-2 cursor-pointer text-slate-700 sm:w-48"
                    >
                      <option value="">-- Do Not Import --</option>
                      {headers.map((h, i) => (
                        <option key={i} value={h}>CSV Column: {h}</option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Duplicate email settings (Only for Employees) */}
          {importType === 'employees' && (
            <div className="p-4 rounded-xl bg-amber-50/30 border border-amber-200/50 space-y-3">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h5 className="text-xs font-bold text-amber-900">Duplicate Handling Policy</h5>
                  <p className="text-[10px] text-amber-700 leading-normal mt-0.5">
                    How should the importer handle rows where the Email address already exists in your employee database?
                  </p>
                </div>
              </div>
              <div className="flex gap-4 pl-6.5">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="duplicates"
                    checked={duplicateHandling === 'skip'}
                    onChange={() => setDuplicateHandling('skip')}
                    className="accent-indigo-600 h-3.5 w-3.5"
                  />
                  Skip existing records (Protect database)
                </label>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="duplicates"
                    checked={duplicateHandling === 'overwrite'}
                    onChange={() => setDuplicateHandling('overwrite')}
                    className="accent-indigo-600 h-3.5 w-3.5"
                  />
                  Overwrite existing records (Sync latest)
                </label>
              </div>
            </div>
          )}

          {/* Action button */}
          <div className="flex justify-end border-t border-slate-150 pt-4">
            <button
              onClick={startImporting}
              className="flex items-center gap-1.5 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/10"
            >
              <Play className="w-4 h-4" />
              Begin Data Validation & Import
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Progress & Real-time Errors */}
      {step === 3 && (
        <div className="space-y-6 animate-fade-in py-4">
          <div className="text-center max-w-md mx-auto space-y-4">
            <div className="relative w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 mx-auto">
              <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 font-sans">
                Processing Bulk Import Data...
              </h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Evaluating format validations, resolving relations, and building database rows in <strong className="text-indigo-600">{settings.isMockMode ? 'Sandbox' : 'Production (Sheets)'}</strong> mode.
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-2 max-w-xl mx-auto">
            <div className="flex justify-between text-xs font-bold text-slate-500">
              <span>{processedRowsCount} of {rawCsvData.length} rows processed</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200/50">
              <div 
                className="bg-gradient-to-r from-indigo-500 to-violet-600 h-3 transition-all duration-300 rounded-full" 
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-center gap-4 text-[10px] font-bold text-slate-400 pt-1">
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> {successCount} Created/Updated</span>
              {importType === 'employees' && (
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> {skippedCount} Duplicates Skipped</span>
              )}
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> {currentErrors.length} Failed Rows</span>
            </div>
          </div>

          {/* Real-time scrollable errors */}
          {currentErrors.length > 0 && (
            <div className="space-y-2 border border-rose-100 rounded-2xl bg-rose-50/20 p-4 max-w-xl mx-auto">
              <h5 className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                Live Validation Failures
              </h5>
              <div className="max-h-40 overflow-y-auto pr-1 space-y-1 text-[10px]">
                {currentErrors.map((err, i) => (
                  <div key={i} className="p-2 rounded bg-white border border-rose-100 flex items-start gap-2 text-rose-800">
                    <span className="font-bold text-rose-600 shrink-0">Line {err.row}:</span>
                    <p className="flex-1 font-medium">{err.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* STEP 4: Results & Error Download */}
      {step === 4 && (
        <div className="space-y-6 animate-fade-in text-center max-w-2xl mx-auto py-2">
          {currentErrors.length === 0 ? (
            <div className="space-y-3">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">Bulk Data Import Complete!</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed mt-1">
                  All {successCount} rows were successfully mapped, validated, and appended into the <strong className="text-indigo-600 uppercase font-mono">{settings.isMockMode ? 'Sandbox' : 'Sheets'}</strong> table without errors.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <AlertCircle className="w-8 h-8 text-amber-600" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">Import Completed with Failures</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed mt-1">
                  Successfully imported {successCount} rows, skipped {skippedCount} duplicates, but {currentErrors.length} rows failed format or integrity validations.
                </p>
              </div>
            </div>
          )}

          {/* Statistics summary card */}
          <div className="grid grid-cols-3 divide-x divide-slate-100 rounded-2xl bg-slate-50 p-4 border border-slate-100 max-w-lg mx-auto">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Imported</span>
              <p className="text-lg font-extrabold text-emerald-600">{successCount}</p>
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Skipped</span>
              <p className="text-lg font-extrabold text-slate-500">{skippedCount}</p>
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Failed</span>
              <p className="text-lg font-extrabold text-rose-500">{currentErrors.length}</p>
            </div>
          </div>

          {/* If errors, offer download report */}
          {currentErrors.length > 0 && (
            <div className="p-4 bg-rose-50/20 border border-rose-100 rounded-2xl max-w-lg mx-auto text-left space-y-3">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <h5 className="text-xs font-bold text-rose-900">Failed Records Log</h5>
                  <p className="text-[10px] text-rose-700 leading-normal mt-0.5">
                    Click the button below to download the detailed error report CSV. It contains the exact line numbers, raw uploaded rows, and reasons for validation rejections.
                  </p>
                </div>
              </div>
              <button
                onClick={handleDownloadErrors}
                className="w-full flex items-center justify-center gap-1.5 py-2 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200/80 hover:border-rose-300 rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                <Download className="w-4 h-4" />
                Download Error Report (CSV)
              </button>
            </div>
          )}

          {/* Reset / Done Buttons */}
          <div className="flex items-center justify-center gap-3 pt-4 border-t border-slate-100 max-w-lg mx-auto">
            <button
              onClick={resetImporter}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
            >
              Import Another File
            </button>
            <button
              onClick={() => {
                // Return to settings standard view or reset
                resetImporter();
              }}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/10"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
