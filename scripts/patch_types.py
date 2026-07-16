import re

with open("src/types.ts", "r") as f:
    content = f.read()

new_employee_fields = """  status: 'Active' | 'Onboarding' | 'On Leave' | 'Suspended' | 'Probation' |
          'Resigned' | 'Retired' | 'Deceased' | 'Contract Expired' | 'Terminated';
  seatNumber: number;
  
  // Status tracking
  statusHistory?: EmployeeStatusHistory[];
  currentStatusSince?: string;
  leaveStartDate?: string;
  leaveEndDate?: string;
  leaveType?: 'Maternity' | 'Paternity' | 'Sabbatical' | 'Study' | 'Medical' | 'Personal' | 'Other';
  suspensionStartDate?: string;
  suspensionEndDate?: string;
  suspensionReason?: string;
  probationStartDate?: string;
  probationEndDate?: string;
  resignationDate?: string;
  lastWorkingDate?: string;
  retirementDate?: string;
  terminationDate?: string;
  terminationReason?: string;
"""

content = re.sub(r"  status: 'Active' \| 'Onboarding' \| 'Terminated';\n  seatNumber: number;", new_employee_fields, content)

status_history_interface = """
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
"""

content = content + status_history_interface

with open("src/types.ts", "w") as f:
    f.write(content)
