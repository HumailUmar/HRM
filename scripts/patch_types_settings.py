import re

with open("src/types.ts", "r") as f:
    content = f.read()

rules = """
export interface StatusManagementRules {
  enableStatusManagement: boolean;
  autoExpireOnLeave: boolean;
  autoExpireProbation: boolean;
  autoResignToTerminated: boolean;
  enableBulkStatusUpdate: boolean;
  allowRehireTerminated: boolean;
}
"""

content = content.replace("export interface CompanySettings {", rules + "\nexport interface CompanySettings {")

app_settings_old = """export interface AppSettings {
  attendanceSheetName: string;
  payrollSheetName: string;
  leaveSheetName: string;
  attendanceRules?: AttendanceRules;
  payrollRules?: PayrollRules;
  recruitmentRules?: RecruitmentRules;
  companySettings?: CompanySettings;
}"""

app_settings_new = """export interface AppSettings {
  attendanceSheetName: string;
  payrollSheetName: string;
  leaveSheetName: string;
  attendanceRules?: AttendanceRules;
  payrollRules?: PayrollRules;
  recruitmentRules?: RecruitmentRules;
  companySettings?: CompanySettings;
  statusRules?: StatusManagementRules;
}"""

content = content.replace(app_settings_old, app_settings_new)

with open("src/types.ts", "w") as f:
    f.write(content)
