import re

with open("src/lib/mockData.ts", "r") as f:
    content = f.read()

default_settings_old = """export const DEFAULT_SETTINGS: AppSettings = {
  attendanceSheetName: 'HumailEli_Attendance',
  payrollSheetName: 'HumailEli_Payroll',
  leaveSheetName: 'HumailEli_Leaves',
"""

default_settings_new = """export const DEFAULT_SETTINGS: AppSettings = {
  attendanceSheetName: 'HumailEli_Attendance',
  payrollSheetName: 'HumailEli_Payroll',
  leaveSheetName: 'HumailEli_Leaves',
  statusRules: {
    enableStatusManagement: true,
    autoExpireOnLeave: false,
    autoExpireProbation: true,
    autoResignToTerminated: true,
    enableBulkStatusUpdate: true,
    allowRehireTerminated: false
  },
"""
content = content.replace(default_settings_old, default_settings_new)

with open("src/lib/mockData.ts", "w") as f:
    f.write(content)
