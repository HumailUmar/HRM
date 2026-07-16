const fs = require('fs');

const methods = [
  'getEmployee(id: string): Promise<any>',
  'saveEmployee(employee: any): Promise<any>',
  'deleteEmployee(id: string): Promise<void>',
  'getAttendanceByEmployee(employeeId: string): Promise<any[]>',
  'saveAttendanceRecord(record: any): Promise<void>',
  'getLeavesByEmployee(employeeId: string): Promise<any[]>',
  'saveLeave(leave: any): Promise<void>',
  'getPayrollByEmployee(employeeId: string): Promise<any[]>',
  'saveCandidate(candidate: any): Promise<void>',
  'getPerformanceReviews(): Promise<any[]>',
  'savePerformanceReview(review: any): Promise<void>',
  'savePerformanceReviews(reviews: any[]): Promise<void>',
  'getPerformanceGoals(): Promise<any[]>',
  'savePerformanceGoal(goal: any): Promise<void>',
  'getTrainingModules(): Promise<any[]>',
  'saveTrainingModule(module: any): Promise<void>',
  'getTrainingAssignments(): Promise<any[]>',
  'saveTrainingAssignment(assignment: any): Promise<void>',
  'getDocuments(): Promise<any[]>',
  'saveDocument(document: any): Promise<void>',
  'getDepartments(): Promise<any[]>',
  'saveDepartment(department: any): Promise<void>',
  'getDesignations(): Promise<any[]>',
  'saveDesignation(designation: any): Promise<void>',
  'getSettings(): Promise<any>',
  'saveSettings(settings: any): Promise<void>',
  'syncAll(): Promise<void>',
  'syncModule(module: string): Promise<void>'
];

function patchFile(filename) {
  let content = fs.readFileSync(filename, 'utf8');
  
  // Fix Employee fields
  content = content.replace(/emp\.phone/g, 'emp.personal?.phone');
  content = content.replace(/emp\.joiningDate/g, 'emp.employment?.joiningDate');
  content = content.replace(/emp\.seatNumber/g, "''");
  
  let stubs = methods.map(m => {
    let returnType = m.match(/: Promise<([^>]+)>/)[1];
    let ret = returnType.endsWith('[]') ? '[]' : (returnType === 'void' ? '' : 'null as any');
    return `  async ${m} { return ${ret}; }`;
  }).join('\n');
  
  content = content.replace(/}\s*$/, stubs + '\n}\n');
  
  fs.writeFileSync(filename, content);
}

patchFile('src/services/adapters/MySQLAdapter.ts');
patchFile('src/services/adapters/PostgreSQLAdapter.ts');

