import re

with open("src/lib/storage.ts", "r") as f:
    content = f.read()

content = content.replace(
    "export const getJobDescriptions = (): JobDescription[] => loadData<JobDescription[]>('job_descriptions', INITIAL_JOB_DESCRIPTIONS);",
    "export const getJobDescriptions = (): JobDescription[] => {\n  const jds = loadData<JobDescription[]>('job_descriptions', INITIAL_JOB_DESCRIPTIONS);\n  return jds.length > 0 ? jds : INITIAL_JOB_DESCRIPTIONS;\n};"
)

content = content.replace(
    "export const getEmployeeHistory = (): EmployeeHistoryEntry[] => loadData<EmployeeHistoryEntry[]>('employee_history', []);",
    "export const getEmployeeHistory = (): EmployeeHistoryEntry[] => {\n  const hist = loadData<EmployeeHistoryEntry[]>('employee_history', []);\n  if (hist.length > 0) return hist;\n  // Generate some mock history if empty\n  return [\n    { id: 'HIST-001', employeeId: 'EMP-001', employeeName: 'Humail Eli', oldStatus: 'Active', newStatus: 'On Leave', changedBy: 'SYS', changedByName: 'System Admin', changedAt: new Date(Date.now() - 86400000).toISOString(), reason: 'Approved Leave', notes: 'Annual Vacation' },\n    { id: 'HIST-002', employeeId: 'EMP-003', employeeName: 'Talha Imran', oldStatus: 'Onboarding', newStatus: 'Active', changedBy: 'SYS', changedByName: 'System Admin', changedAt: new Date(Date.now() - 172800000).toISOString(), reason: 'Completed Onboarding', notes: 'All documents verified' }\n  ];\n};"
)

with open("src/lib/storage.ts", "w") as f:
    f.write(content)
