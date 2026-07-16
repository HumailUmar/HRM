import { IDataAdapter } from './interfaces/IDataAdapter';
import { getDataAdapter } from './DataAdapterFactory';
import { Employee } from '../types';
import { getNextId, generateUUID } from '../lib/idHelper';
import { validateEmail } from '../lib/validators';
import { deepMerge } from '../lib/deepMerge';

export class EmployeeService {
  private adapter?: IDataAdapter;

  constructor(adapter?: IDataAdapter) {
    this.adapter = adapter;
  }

  private getAdapter(): IDataAdapter {
    return this.adapter || getDataAdapter();
  }

  async getAll(): Promise<Employee[]> {
    return this.getAdapter().getEmployees();
  }

  async getById(id: string): Promise<Employee | null> {
    return this.getAdapter().getEmployee(id);
  }
  
  /**
   * Create a new employee.
   * @param data - Partial employee data (must include name and email).
   * @returns The created employee record.
   * @throws {Error} If validation fails or email already exists.
   */
  async create(data: Partial<Employee>): Promise<Employee> {
    // 1. Validate required fields
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('Employee name is required');
    }
    if (!data.email || data.email.trim().length === 0) {
      throw new Error('Employee email is required');
    }
    if (!validateEmail(data.email)) {
      throw new Error('Invalid email format');
    }

    // 2. Deduplicate by email
    try {
      const existing = await this.getAdapter().getEmployees();
      const emailExists = existing.some(e => e.email.toLowerCase() === data.email!.toLowerCase());
      if (emailExists) {
        throw new Error(`Employee with email "${data.email}" already exists`);
      }
    } catch (error: any) {
      // Re-throw with clear message if it's already our validation error
      if (error.message && error.message.includes('already exists')) {
        throw error;
      }
      throw new Error(`Failed to check for duplicate email: ${error.message}`);
    }

    // 3. Generate a unique ID
    let newId: string;
    try {
      if (typeof getNextId === 'function') {
        newId = await getNextId('employee', 'EMP-');
      } else {
        newId = generateUUID('EMP-');
      }
    } catch {
      newId = generateUUID('EMP-');
    }

    // 4. Build the full employee object with defaults
    const newEmployee: Employee = {
      id: newId,
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      role: data.role || 'Employee',
      department: data.department || '',
      baseSalary: data.baseSalary || 0,
      status: data.status || 'Active',
      personal: {
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        phone: data.personal?.phone || '',
        ...data.personal
      },
      employment: {
        joiningDate: data.employment?.joiningDate || new Date().toISOString().split('T')[0],
        status: data.status || 'Active',
        seatNumber: data.employment?.seatNumber || 0,
        role: (data.role as any) || 'Employee',
        ...data.employment
      },
      compensation: {
        currency: 'USD',
        salaryStructure: undefined,
        salaryHistory: [],
        ...data.compensation
      },
      onboarding: data.onboarding || {
        contractSigned: false,
        trainingAssigned: false,
        trainingCompleted: false,
        welcomeEmailSent: false,
        feedbackSubmitted: false,
      },
      exit: data.exit || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 5. Save via adapter with try/catch
    try {
      return await this.getAdapter().saveEmployee(newEmployee);
    } catch (error: any) {
      throw new Error(`Failed to create employee: ${error.message}`);
    }
  }

  /**
   * Update an existing employee.
   * @param id - The employee ID.
   * @param data - Partial employee data to update (fields are deeply merged).
   * @returns The updated employee record.
   * @throws {Error} If employee not found, validation fails, or email conflicts.
   */
  async update(id: string, data: Partial<Employee>): Promise<Employee> {
    if (!id) {
      throw new Error('Employee ID is required');
    }

    // 1. Fetch the existing employee
    let existing: Employee | null = null;
    try {
      existing = await this.getAdapter().getEmployee(id);
    } catch (error: any) {
      throw new Error(`Failed to fetch employee: ${error.message}`);
    }

    if (!existing) {
      throw new Error(`Employee with ID "${id}" not found`);
    }

    // 2. Validate fields (if present in data)
    if (data.name !== undefined && (!data.name || data.name.trim().length === 0)) {
      throw new Error('Name cannot be empty');
    }

    if (data.email !== undefined) {
      if (!data.email || data.email.trim().length === 0) {
        throw new Error('Email cannot be empty');
      }
      if (!validateEmail(data.email)) {
        throw new Error('Invalid email format');
      }
      // If email is changing, check for duplicates
      if (data.email.toLowerCase() !== existing.email.toLowerCase()) {
        try {
          const all = await this.getAdapter().getEmployees();
          const emailExists = all.some(e => 
            e.id !== id && e.email.toLowerCase() === data.email!.toLowerCase()
          );
          if (emailExists) {
            throw new Error(`Employee with email "${data.email}" already exists`);
          }
        } catch (error: any) {
          if (error.message && error.message.includes('already exists')) {
            throw error;
          }
          throw new Error(`Failed to check for duplicate email: ${error.message}`);
        }
      }
    }

    // 3. Deep merge the update data into the existing employee
    const updatedEmployee = deepMerge(existing, data);

    // 4. Update timestamps
    updatedEmployee.updatedAt = new Date().toISOString();

    // 5. Save via adapter with try/catch
    try {
      return await this.getAdapter().saveEmployee(updatedEmployee);
    } catch (error: any) {
      throw new Error(`Failed to update employee: ${error.message}`);
    }
  }

  async delete(id: string): Promise<void> {
    return this.getAdapter().deleteEmployee(id);
  }

  async bulkCreate(employees: Employee[]): Promise<void> {
    return this.getAdapter().saveEmployees(employees);
  }
  
  async search(query: string): Promise<Employee[]> {
    const employees = await this.getAdapter().getEmployees();
    const q = query.toLowerCase();
    return employees.filter(e => 
      e.name.toLowerCase().includes(q) ||
      e.email.toLowerCase().includes(q) ||
      (e.employment.departmentId && e.employment.departmentId.toLowerCase().includes(q))
    );
  }

  async getByDepartment(departmentId: string): Promise<Employee[]> {
    const employees = await this.getAdapter().getEmployees();
    return employees.filter(e => e.employment.departmentId === departmentId);
  }

  async getActive(): Promise<Employee[]> {
    const employees = await this.getAdapter().getEmployees();
    return employees.filter(e => e.status !== 'Terminated');
  }
}

export const employeeService = new EmployeeService();
export default employeeService;
