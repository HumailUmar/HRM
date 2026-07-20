import re

with open("src/types.ts", "r") as f:
    content = f.read()

history_types = """
export interface EmployeeHistoryEntry {
  id: string;
  employeeId: string;
  employeeName: string;
  fieldName: string;
  fieldLabel: string;
  oldValue: string;
  newValue: string;
  changedBy: string;
  changedByName: string;
  changedAt: string;
  reason: string;
  notes: string;
  changeType: 'CREATE' | 'UPDATE' | 'DELETE' | 'BULK_UPDATE';
  source: 'MANUAL' | 'TRANSITION' | 'BULK_IMPORT' | 'SYSTEM_AUTO' | 'API';
  ipAddress?: string;
  userAgent?: string;
}

export interface EmployeeHistorySummary {
  employeeId: string;
  employeeName: string;
  totalChanges: number;
  lastChangeDate: string;
  mostChangedFields: string[];
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedBy: string;
  updatedByName: string;
  updatedAt: string;
}

export interface AuditTrailRules {
  enableAuditTrail: boolean;
  trackAllFields: boolean;
  trackedFields: string[];
  requireReason: boolean;
  requireReasonHighImpact: boolean;
  retentionPeriod: string;
}
"""

if "export interface EmployeeHistoryEntry" not in content:
    content = content + "\n" + history_types

content = re.sub(
    r"  statusRules\?: StatusManagementRules;",
    r"  statusRules?: StatusManagementRules;\n  auditTrailRules?: AuditTrailRules;",
    content
)

with open("src/types.ts", "w") as f:
    f.write(content)
