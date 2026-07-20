const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

// Employees
content = content.replace(/getEmployees\(\)/g, "await getEmployeesFromDB()");
content = content.replace(/saveEmployees\(/g, "await saveEmployeesToDB(");

// Attendance
content = content.replace(/getAttendance\(\)/g, "await getAttendanceFromDB()");
content = content.replace(/saveAttendance\(/g, "await saveAttendanceToDB(");

// Payroll
content = content.replace(/getPayroll\(\)/g, "await getPayrollFromDB()");
content = content.replace(/savePayroll\(/g, "await savePayrollToDB(");

// Leaves
content = content.replace(/getLeaves\(\)/g, "await getLeavesFromDB()");
content = content.replace(/saveLeaves\(/g, "await saveLeavesToDB(");

// Candidates
content = content.replace(/getCandidates\(\)/g, "await getCandidatesFromDB()");
content = content.replace(/saveCandidates\(/g, "await saveCandidatesToDB(");

// We need to fix the imports from storage
const importToReplace = `  getEmployees,
  saveEmployees,
  getAttendance,
  saveAttendance,
  getPayroll,
  savePayroll,
  getLeaves,
  saveLeaves,
  getCandidates,
  saveCandidates,`;

content = content.replace(/getEmployees,\n\s*saveEmployees,/g, "// getEmployees");
content = content.replace(/getAttendance,\n\s*saveAttendance,/g, "// getAttendance");
content = content.replace(/getPayroll,\n\s*savePayroll,/g, "// getPayroll");
content = content.replace(/getLeaves,\n\s*saveLeaves,/g, "// getLeaves");
content = content.replace(/getCandidates,\n\s*saveCandidates,/g, "// getCandidates");

fs.writeFileSync('server.ts', content);
console.log("Replaced all!");
