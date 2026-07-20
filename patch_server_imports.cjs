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
} from './src/services/serverDatabase.js';
`;

if (!content.includes('serverDatabase')) {
  // Find import express from ...
  content = content.replace(/import express from ['"]express['"];/, "$&" + importsToAdd);
  fs.writeFileSync('server.ts', content);
  console.log("Added imports!");
} else {
  console.log("Already has it.");
}
