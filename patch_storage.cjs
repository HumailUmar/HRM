const fs = require('fs');
let content = fs.readFileSync('src/lib/storage.ts', 'utf8');

const leavesExport = "export const getLeaves = (): LeaveRecord[] => loadData<LeaveRecord[]>('leaves', INITIAL_LEAVES);\nexport const saveLeaves = (leaves: LeaveRecord[]) => saveData('leaves', leaves);";

const policiesExport = `
export const INITIAL_LEAVE_POLICIES: LeavePolicy[] = [
  {
    id: 'LP-1',
    name: 'Standard Annual Leave',
    type: 'Annual',
    quota: 20,
    accrualRate: 1.66,
    accrualFrequency: 'Monthly',
    carryForwardLimit: 5,
    minTenureDays: 90,
    requiresApproval: true,
    isDefault: true,
    description: 'Standard annual leave policy for full-time employees.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

export const getLeavePolicies = (): LeavePolicy[] => loadData<LeavePolicy[]>('leavePolicies', INITIAL_LEAVE_POLICIES);
export const saveLeavePolicies = (policies: LeavePolicy[]) => saveData('leavePolicies', policies);
`;

content = content.replace(leavesExport, leavesExport + '\n' + policiesExport);
fs.writeFileSync('src/lib/storage.ts', content);
