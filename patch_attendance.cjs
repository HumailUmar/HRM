const fs = require('fs');

let content = fs.readFileSync('src/components/Attendance.tsx', 'utf8');

content = content.replace(
  "import { getAttendance, saveAttendance, getEmployees, getBiometricDevices, BiometricDeviceConfig } from '../lib/storage';",
  "import { getAttendance, saveAttendance, getEmployees, getBiometricDevices } from '../lib/storage';"
);

content = content.replace(
  "import { AttendanceRecord, Employee, AppSettings, Department, Designation } from '../types';",
  "import { AttendanceRecord, Employee, AppSettings, Department, Designation, BiometricDeviceConfig } from '../types';"
);

fs.writeFileSync('src/components/Attendance.tsx', content);

