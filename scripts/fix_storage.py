import re

with open("src/lib/storage.ts", "r") as f:
    content = f.read()

content = content.replace("import {\n  Employee,", "import {\n  Employee,\n  EmployeeHistoryEntry,")

diff_func = """
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
"""

content = content + "\n" + diff_func

with open("src/lib/storage.ts", "w") as f:
    f.write(content)
