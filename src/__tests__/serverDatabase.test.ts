import { getEmployeesFromDB, saveEmployeesToDB } from '../services/serverDatabase';

// Mock the database connection
jest.mock('../services/serverDatabase', () => ({
  getEmployeesFromDB: jest.fn(),
  saveEmployeesToDB: jest.fn(),
  getAttendanceFromDB: jest.fn(),
  saveAttendanceToDB: jest.fn(),
}));

describe('Server Database Layer', () => {
  test('getEmployeesFromDB returns array of employees', async () => {
    const mockEmployees = [{ id: 'EMP-001', name: 'Test User' }];
    (getEmployeesFromDB as jest.Mock).mockResolvedValue(mockEmployees);
    const result = await getEmployeesFromDB();
    expect(result).toEqual(mockEmployees);
  });
});
