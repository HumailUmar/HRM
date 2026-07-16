import { Employee, Department, Designation } from '../types';

export function getEmployeeDesignation(emp: Employee | null | undefined, designations: Designation[] | null | undefined): string {
  if (!emp || !emp.employment) return 'Unknown Role';
  if (!Array.isArray(designations)) return 'Unknown Role';
  if (emp.employment.designationId) {
    const dsg = designations.find(d => d.id === emp.employment!.designationId);
    if (dsg) return dsg.name || 'Unknown Role';
  }
  return 'Unknown Role';
}

export function getEmployeeDepartment(emp: Employee | null | undefined, departments: Department[] | null | undefined): string {
  if (!emp || !emp.employment) return 'Unknown Department';
  if (!Array.isArray(departments)) return 'Unknown Department';
  if (emp.employment.departmentId) {
    const dept = departments.find(d => d.id === emp.employment!.departmentId);
    if (dept) return dept.name || 'Unknown Department';
  }
  return 'Unknown Department';
}

export function getEmployeeBaseSalary(emp: Employee | null | undefined): number {
  if (!emp || !emp.compensation || !emp.compensation.salaryStructure) return 0;
  const components = emp.compensation.salaryStructure.components;
  if (!Array.isArray(components)) return 0;
  const basic = components.find(c => typeof c?.name === 'string' && c.name.toLowerCase().includes('basic'));
  if (basic && typeof basic.amount === 'number' && Number.isFinite(basic.amount)) return basic.amount;
  return 0;
}
