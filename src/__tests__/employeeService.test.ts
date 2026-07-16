import { EmployeeService } from '../services/EmployeeService';
import { IDataAdapter } from '../services/interfaces/IDataAdapter';
import { Employee } from '../types';

describe('EmployeeService', () => {
  let mockAdapter: jest.Mocked<IDataAdapter>;
  let service: EmployeeService;

  beforeEach(() => {
    mockAdapter = {
      getEmployees: jest.fn(),
      getEmployee: jest.fn(),
      saveEmployee: jest.fn(),
      saveEmployees: jest.fn(),
      deleteEmployee: jest.fn(),
    } as unknown as jest.Mocked<IDataAdapter>;

    service = new EmployeeService(mockAdapter);
  });

  describe('create', () => {
    it('should successfully create an employee with valid inputs', async () => {
      const data: Partial<Employee> = {
        name: 'Jane Doe',
        email: 'jane@example.com',
        role: 'Developer',
        personal: {
          phone: '123456',
        } as any,
      };

      mockAdapter.getEmployees.mockResolvedValue([]);
      mockAdapter.saveEmployee.mockImplementation(async (emp: Employee) => emp);

      const result = await service.create(data);

      expect(result.id).toBeDefined();
      expect(result.id.startsWith('EMP-')).toBe(true);
      expect(result.name).toBe('Jane Doe');
      expect(result.email).toBe('jane@example.com');
      expect(result.personal.phone).toBe('123456');
      expect(mockAdapter.saveEmployee).toHaveBeenCalled();
    });

    it('should throw an error if name is empty', async () => {
      await expect(service.create({ name: '', email: 'a@b.com' })).rejects.toThrow(
        'Employee name is required'
      );
    });

    it('should throw an error if email is invalid', async () => {
      await expect(service.create({ name: 'Jane', email: 'invalid-email' })).rejects.toThrow(
        'Invalid email format'
      );
    });

    it('should throw an error if email already exists', async () => {
      const existing: Employee = {
        id: 'EMP-001',
        name: 'Jane Existing',
        email: 'jane@example.com',
      } as any;

      mockAdapter.getEmployees.mockResolvedValue([existing]);

      await expect(service.create({ name: 'Jane', email: 'jane@example.com' })).rejects.toThrow(
        'Employee with email "jane@example.com" already exists'
      );
    });
  });

  describe('update', () => {
    it('should successfully deep merge nested objects during update', async () => {
      const existing: Employee = {
        id: 'EMP-001',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'Developer',
        personal: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '111-111',
          currentAddress: '123 Main St',
        },
        employment: {
          joiningDate: '2026-01-01',
          status: 'Active',
          seatNumber: 12,
        },
      } as any;

      mockAdapter.getEmployee.mockResolvedValue(existing);
      mockAdapter.getEmployees.mockResolvedValue([existing]);
      mockAdapter.saveEmployee.mockImplementation(async (emp: Employee) => emp);

      const updateData: Partial<Employee> = {
        personal: {
          phone: '222-222', // only update phone, keep address
        } as any,
        employment: {
          seatNumber: 42, // only update seat, keep joiningDate
        } as any,
      };

      const result = await service.update('EMP-001', updateData);

      expect(result.name).toBe('John Doe');
      expect(result.personal.phone).toBe('222-222');
      expect(result.personal.currentAddress).toBe('123 Main St');
      expect(result.employment.seatNumber).toBe(42);
      expect(result.employment.joiningDate).toBe('2026-01-01');
    });

    it('should fail update if employee does not exist', async () => {
      mockAdapter.getEmployee.mockResolvedValue(null);

      await expect(service.update('EMP-NOT-FOUND', { name: 'New Name' })).rejects.toThrow(
        'Employee with ID "EMP-NOT-FOUND" not found'
      );
    });

    it('should validate name is not empty on update if provided', async () => {
      const existing: Employee = { id: 'EMP-001', name: 'John Doe', email: 'john@example.com' } as any;
      mockAdapter.getEmployee.mockResolvedValue(existing);

      await expect(service.update('EMP-001', { name: '' })).rejects.toThrow(
        'Name cannot be empty'
      );
    });

    it('should validate email format and check for duplicates if email changes', async () => {
      const existing: Employee = { id: 'EMP-001', name: 'John Doe', email: 'john@example.com' } as any;
      const other: Employee = { id: 'EMP-002', name: 'Jane Doe', email: 'jane@example.com' } as any;

      mockAdapter.getEmployee.mockResolvedValue(existing);
      mockAdapter.getEmployees.mockResolvedValue([existing, other]);

      await expect(service.update('EMP-001', { email: 'jane@example.com' })).rejects.toThrow(
        'Employee with email "jane@example.com" already exists'
      );
    });
  });
});
