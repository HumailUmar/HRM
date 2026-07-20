import re

with open("src/types.ts", "r") as f:
    types = f.read()
    
# Fix screeningScores keys to string
types = types.replace("screeningScores?: { [key: number]: number };", "screeningScores?: { [key: string]: number };")
if "matchScore?: number;" not in types:
    types = types.replace("export interface Candidate {", "export interface Candidate {\n  matchScore?: number;")

with open("src/types.ts", "w") as f:
    f.write(types)

with open("src/components/Recruitment.tsx", "r") as f:
    recruit = f.read()

# Fix types in Recruitment.tsx
recruit = recruit.replace("const scores: { [key: number]: number | string } = {};", "const scores: { [key: string]: number } = {};")
with open("src/components/Recruitment.tsx", "w") as f:
    f.write(recruit)


with open("src/lib/storage.ts", "r") as f:
    storage = f.read()

# Fix imports in storage.ts
storage = storage.replace("Designation } from '../types';", "Designation, JobDescription } from '../types';")

# Fix appendToSheet call
append_old = """      entries.forEach(entry => {
        m.appendToSheet('HumailEli_Employee_History', [
          entry.id,
          entry.employeeId,
          entry.employeeName,
          entry.fieldName,
          entry.fieldLabel,
          entry.oldValue,
          entry.newValue,
          entry.changedBy,
          entry.changedByName,
          entry.changedAt,
          entry.reason,
          entry.notes,
          entry.changeType,
          entry.source,
          entry.ipAddress || '',
          entry.userAgent || ''
        ]);
      });"""

append_new = """      entries.forEach(entry => {
        m.appendToSheet('HumailEli_Employee_History', [[
          entry.id,
          entry.employeeId,
          entry.employeeName,
          entry.fieldName,
          entry.fieldLabel,
          entry.oldValue,
          entry.newValue,
          entry.changedBy,
          entry.changedByName,
          entry.changedAt,
          entry.reason,
          entry.notes,
          entry.changeType,
          entry.source,
          entry.ipAddress || '',
          entry.userAgent || ''
        ]]);
      });"""
storage = storage.replace(append_old, append_new)

with open("src/lib/storage.ts", "w") as f:
    f.write(storage)

