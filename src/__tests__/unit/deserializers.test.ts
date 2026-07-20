import { deserializeEmployee, deserializeAttendance } from '../../lib/storage';

describe('Deserializers', () => {
  test('deserializeEmployee handles missing fields gracefully', () => {
    const row = ['EMP-001', 'John Doe'];
    const emp = deserializeEmployee(row);
    expect(emp.id).toBe('EMP-001');
    expect(emp.name).toBe('John Doe');
    expect(emp.email).toBe('');
    expect(emp.role).toBe('');
  });

  test('deserializeEmployee handles extra fields gracefully', () => {
    const row = ['EMP-001', 'John Doe', 'john@test.com', '555-1234', 'Developer'];
    const emp = deserializeEmployee(row);
    expect(emp.id).toBe('EMP-001');
    expect(emp.name).toBe('John Doe');
    expect(emp.email).toBe('john@test.com');
    expect(emp.phone).toBe('555-1234');
    expect(emp.role).toBe('Developer');
  });

  test('deserializeAttendance handles partial row', () => {
    const row = ['ATT-001', 'EMP-001', 'John Doe', '2026-07-15'];
    const rec = deserializeAttendance(row);
    expect(rec.id).toBe('ATT-001');
    expect(rec.employeeId).toBe('EMP-001');
    expect(rec.employeeName).toBe('John Doe');
    expect(rec.date).toBe('2026-07-15');
    expect(rec.checkIn).toBe('');
    expect(rec.checkOut).toBe('');
    expect(rec.status).toBe('Full Day');
  });
});
