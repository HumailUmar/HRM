import { Employee, Department, Designation } from '../types';

export function getEmployeeDesignation(emp: Employee, designations: Designation[]): string {
  if (emp.employment.designationId) {
    const dsg = designations.find(d => d.id === emp.employment.designationId);
    if (dsg) return dsg.name;
  }
  return 'Unknown Role';
}

export function getEmployeeDepartment(emp: Employee, departments: Department[]): string {
  if (emp.employment.departmentId) {
    const dept = departments.find(d => d.id === emp.employment.departmentId);
    if (dept) return dept.name;
  }
  return 'Unknown Department';
}

export function getEmployeeBaseSalary(emp: Employee): number {
  if (emp.compensation.salaryStructure) {
    // Find basic salary component
    const basic = emp.compensation.salaryStructure.components.find(c => c.name.toLowerCase().includes('basic'));
    if (basic) return basic.amount;
  }
  return 0;
}
