const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const importsToAdd = `
import {
  getEmployeesFromDB,
  saveEmployeesToDB,
  deleteEmployeeFromDB,
  getAttendanceFromDB,
  saveAttendanceToDB,
  getPayrollFromDB,
  savePayrollToDB,
  getLeavesFromDB,
  saveLeavesToDB,
  getCandidatesFromDB,
  saveCandidatesToDB,
} from './src/services/serverDatabase';
`;

if (!content.includes('serverDatabase')) {
  // Add imports right after express
  content = content.replace("import express from 'express';", "import express from 'express';" + importsToAdd);
}

// Emps
content = content.replace(/const employees = getEmployees\(\);/g, "const employees = await getEmployeesFromDB();");
content = content.replace(/saveEmployees\(employees\);/g, "await saveEmployeesToDB(employees);");

// Attendance
content = content.replace(/let records = getAttendance\(\);/g, "let records = await getAttendanceFromDB();");
content = content.replace(/const records = getAttendance\(\);/g, "const records = await getAttendanceFromDB();");
content = content.replace(/saveAttendance\(records\);/g, "await saveAttendanceToDB(records);");

// Payroll
content = content.replace(/let payroll = getPayroll\(\);/g, "let payroll = await getPayrollFromDB();");
content = content.replace(/savePayroll\(payrollRecords\);/g, "await savePayrollToDB(payrollRecords);");

// Leaves
content = content.replace(/let leaves = getLeaves\(\);/g, "let leaves = await getLeavesFromDB();");
content = content.replace(/const leaves = getLeaves\(\);/g, "const leaves = await getLeavesFromDB();");
content = content.replace(/saveLeaves\(leaves\);/g, "await saveLeavesToDB(leaves);");

// Candidates
content = content.replace(/const candidates = getCandidates\(\);/g, "const candidates = await getCandidatesFromDB();");
content = content.replace(/saveCandidates\(candidates\);/g, "await saveCandidatesToDB(candidates);");


fs.writeFileSync('server.ts', content);
