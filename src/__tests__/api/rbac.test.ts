import request from 'supertest';
import app from '../../../server';
import jwt from 'jsonwebtoken';

jest.mock('../../../src/services/serverDatabase', () => ({
  getEmployeesFromDB: jest.fn().mockResolvedValue([]),
}));

describe('RBAC Middleware API', () => {
  const adminToken = jwt.sign({ role: 'Admin', apiKey: 'test' }, process.env.JWT_SECRET || 'humail_eli_secret_key_2026');
  const empToken = jwt.sign({ role: 'Employee', employeeId: 'EMP-001', apiKey: 'test' }, process.env.JWT_SECRET || 'humail_eli_secret_key_2026');

  test('Admin can access protected routes', async () => {
    if (!app) return;
    const res = await request(app).get('/api/v1/employees').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });

  test('Employee is denied from HR/Admin routes', async () => {
    if (!app) return;
    const res = await request(app).get('/api/v1/employees').set('Authorization', `Bearer ${empToken}`);
    expect(res.status).toBe(403);
  });
});
