const fs = require('fs');
let content = fs.readFileSync('src/components/ExitManagement.tsx', 'utf8');

const oldProps = `interface ExitManagementProps {
  employees: Employee[];
  setEmployees: (emps: Employee[]) => void;
  departments: Department[];
  designations: Designation[];
}

export default function ExitManagement({ employees, setEmployees, departments, designations }: ExitManagementProps) {`;

const newProps = `interface ExitManagementProps {
  user?: any;
  employees: Employee[];
  setEmployees: (emps: Employee[]) => void;
}

export default function ExitManagement({ user, employees, setEmployees }: ExitManagementProps) {`;

content = content.replace(oldProps, newProps);
fs.writeFileSync('src/components/ExitManagement.tsx', content);

let settings = fs.readFileSync('src/components/Settings.tsx', 'utf8');
settings = settings.replace('<ExitManagement user={user} />', '<ExitManagement user={user} employees={employees} setEmployees={setEmployees} />');
fs.writeFileSync('src/components/Settings.tsx', settings);

