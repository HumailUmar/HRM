import { getNextId } from '../../lib/idHelper';

// Mock the database connection for testing
jest.mock('../../services/serverDatabase', () => ({
  getConnection: jest.fn().mockResolvedValue({
    type: 'postgresql',
    pool: {
      query: jest.fn().mockImplementation((query, params) => {
        if (query.includes('RETURNING next_val')) {
          return Promise.resolve({ rows: [{ next_val: 1001 }] });
        }
        return Promise.resolve({ rows: [] });
      }),
    },
  }),
}));

describe('ID Helper', () => {
  test('generates next employee ID with prefix', async () => {
    const id = await getNextId('employee', 'EMP-');
    expect(id).toMatch(/^EMP-\d{4}$/);
    expect(parseInt(id.split('-')[1])).toBeGreaterThan(0);
  });

  test('increments the ID counter', async () => {
    const id1 = await getNextId('employee', 'EMP-');
    const id2 = await getNextId('employee', 'EMP-');
    const num1 = parseInt(id1.split('-')[1]);
    const num2 = parseInt(id2.split('-')[1]);
    expect(num2).toBeGreaterThan(num1);
  });
});
