import request from 'supertest';
import app from '../../../server';
import jwt from 'jsonwebtoken';

// Mock DB
jest.mock('../../../src/services/serverDatabase', () => ({
  getEmployeesFromDB: jest.fn().mockResolvedValue([{ id: 'EMP-001', name: 'John', role: 'Developer' }]),
  saveEmployeesToDB: jest.fn().mockResolvedValue(true),
}));

describe('Employees API', () => {
  const token = jwt.sign({ role: 'Admin', apiKey: 'test' }, process.env.JWT_SECRET || 'humail_eli_secret_key_2026');

  test('GET /api/v1/employees returns employees', async () => {
    if (!app) return;
    const response = await request(app).get('/api/v1/employees').set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
  });
});
