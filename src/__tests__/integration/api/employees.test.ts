import request from 'supertest';
import { app } from '../../../../server';
import { getEmployeesFromDB, saveEmployeesToDB } from '../../../services/serverDatabase';

jest.mock('../../../services/serverDatabase');

// Mock JWT verification
jest.mock('jsonwebtoken', () => ({
  verify: jest.fn().mockImplementation((token, secret, callback) => {
    callback(null, { employeeId: 'EMP-001', role: 'Admin' });
  }),
}));

describe('Employees API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('GET /api/v1/employees returns employees', async () => {
    const mockEmployees = [{ id: 'EMP-001', name: 'John Doe' }];
    (getEmployeesFromDB as jest.Mock).mockResolvedValue(mockEmployees);

    const response = await request(app)
      .get('/api/v1/employees')
      .set('Authorization', 'Bearer valid-token');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual(mockEmployees);
  });

  test('POST /api/v1/employees creates employee', async () => {
    const newEmployee = { name: 'Jane Smith', email: 'jane@test.com', role: 'Developer' };
    (getEmployeesFromDB as jest.Mock).mockResolvedValue([]);
    (saveEmployeesToDB as jest.Mock).mockResolvedValue(undefined);

    const response = await request(app)
      .post('/api/v1/employees')
      .set('Authorization', 'Bearer valid-token')
      .send(newEmployee);

    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject(newEmployee);
    expect(response.body.data.id).toBeDefined();
  });
});
