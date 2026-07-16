const fs = require('fs');
let content = fs.readFileSync('src/types.ts', 'utf8');

const oldInterface = `export interface LeavePolicy {
  id: string;
  name: string;
  description: string;
  isDefault: boolean;
  isActive: boolean;
  appliesToDepartments: string[];`;

const newInterface = `export interface LeavePolicy {
  id: string;
  name: string;
  description: string;
  isDefault: boolean;
  isActive?: boolean;
  type?: string;
  quota?: number;
  accrualRate?: number;
  carryForwardLimit?: number;
  minTenureDays?: number;
  requiresApproval?: boolean;
  appliesToDepartments?: string[];`;

content = content.replace(oldInterface, newInterface);
fs.writeFileSync('src/types.ts', content);
