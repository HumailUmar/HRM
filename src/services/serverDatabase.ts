import * as mysql from 'mysql2/promise';
import { Pool } from 'pg';
import { getSettings } from '../lib/storage';
import { getNextId } from '../lib/idHelper.js';

let mysqlPool: any = null;
let postgresPool: any = null;
let currentConfigKey = '';
let dbType: 'mysql' | 'postgresql' | null = null;

function getDbConfig() {
  const settings = getSettings();
  const storageType = settings.storageType || 'local';
  
  if (storageType === 'mysql') {
    return {
      type: 'mysql' as const,
      config: {
        host: settings.mysqlHost || 'localhost',
        port: Number(settings.mysqlPort) || 3306,
        database: settings.mysqlDatabase || 'humail_eli_hrm',
        user: settings.mysqlUsername || 'admin',
        password: settings.mysqlPassword || '',
        ssl: settings.mysqlSSL || false,
        poolSize: Number(settings.mysqlPoolSize) || 10,
        timeout: Number(settings.mysqlTimeout) || 10000,
      }
    };
  } else if (storageType === 'postgresql') {
    return {
      type: 'postgresql' as const,
      config: {
        host: settings.postgresHost || 'localhost',
        port: Number(settings.postgresPort) || 5432,
        database: settings.postgresDatabase || 'humail_eli_hrm',
        user: settings.postgresUsername || 'postgres',
        password: settings.postgresPassword || '',
        ssl: settings.postgresSSL || false,
        poolSize: Number(settings.postgresPoolSize) || 10,
        timeout: Number(settings.postgresTimeout) || 10000,
      }
    };
  }
  return null;
}

export async function getConnection() {
  const dbInfo = getDbConfig();
  if (!dbInfo) {
    throw new Error('No database configured. Please set storageType to mysql or postgresql in Settings.');
  }

  const configKey = JSON.stringify(dbInfo.config);
  
  if (dbInfo.type === 'mysql') {
    if (!mysqlPool || configKey !== currentConfigKey) {
      if (mysqlPool) await mysqlPool.end().catch(() => {});
      mysqlPool = mysql.createPool({
        host: dbInfo.config.host,
        port: dbInfo.config.port,
        database: dbInfo.config.database,
        user: dbInfo.config.user,
        password: dbInfo.config.password,
        ssl: dbInfo.config.ssl ? {} : undefined,
        connectionLimit: dbInfo.config.poolSize,
        connectTimeout: dbInfo.config.timeout,
        ...(dbInfo.config.timeout ? { acquireTimeout: dbInfo.config.timeout, maxIdle: dbInfo.config.poolSize } : {}),
      });
      dbType = 'mysql';
      currentConfigKey = configKey;
    }
    return { type: 'mysql' as const, pool: mysqlPool };
  } else if (dbInfo.type === 'postgresql') {
    if (!postgresPool || configKey !== currentConfigKey) {
      if (postgresPool) await postgresPool.end().catch(() => {});
      postgresPool = new Pool({
        host: dbInfo.config.host,
        port: dbInfo.config.port,
        database: dbInfo.config.database,
        user: dbInfo.config.user,
        password: dbInfo.config.password,
        ssl: dbInfo.config.ssl ? { rejectUnauthorized: false } : undefined,
        max: dbInfo.config.poolSize,
        idleTimeoutMillis: dbInfo.config.timeout,
        ...(dbInfo.config.timeout ? { statement_timeout: dbInfo.config.timeout, query_timeout: dbInfo.config.timeout } : {}),
      });
      dbType = 'postgresql';
      currentConfigKey = configKey;
    }
    return { type: 'postgresql' as const, pool: postgresPool };
  }
  
  throw new Error('Unsupported database type');
}

// ============================================================
//  CRUD OPERATIONS - EMPLOYEES
// ============================================================

export async function getEmployeesFromDB() {
  const conn = await getConnection();
  const query = 'SELECT * FROM employees';
  
  if (conn.type === 'mysql') {
    const [rows] = await conn.pool.query(query);
    return rows;
  } else {
    const result = await conn.pool.query(query);
    return result.rows;
  }
}

export async function saveEmployeesToDB(employees: any[]) {
  const conn = await getConnection();
  const table = 'employees';
  
  // Build upsert query
  const columns = ['id', 'name', 'email', 'phone', 'role', 'department', 'baseSalary', 'joiningDate', 'status', 'seatNumber', 'updatedAt'];
  const placeholders = conn.type === 'mysql' 
    ? columns.map(() => '?').join(', ')
    : columns.map((_, i) => `$${i + 1}`).join(', ');
  
  const updateClause = columns
    .filter(c => c !== 'id')
    .map(c => `${c} = VALUES(${c})`)
    .join(', ');
  
  if (employees.length === 0) return;

  await conn.pool.query('BEGIN');
  try {
    for (const emp of employees) {
      const isNew = !emp.id || emp.id.startsWith('EMP-TEMP') || emp.id.startsWith('TEMP-');
      if (isNew) {
        emp.id = await getNextId('employee', 'EMP-');
      }

      const values = columns.map(c => {
        if (c === 'id') return emp.id;
        if (c === 'updatedAt') return new Date().toISOString();
        if (c === 'baseSalary') return emp[c] || 0;
        return emp[c] || '';
      });
      
      let query;
      if (conn.type === 'mysql') {
        query = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders}) ON DUPLICATE KEY UPDATE ${updateClause}`;
      } else {
        const conflictUpdate = columns
          .filter(c => c !== 'id')
          .map(c => `${c} = EXCLUDED.${c}`)
          .join(', ');
        query = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders}) ON CONFLICT (id) DO UPDATE SET ${conflictUpdate}`;
      }
      
      await conn.pool.query(query, values);
    }
    await conn.pool.query('COMMIT');
  } catch (err) {
    await conn.pool.query('ROLLBACK').catch(() => {});
    throw err;
  }
}

export async function deleteEmployeeFromDB(id: string) {
  const conn = await getConnection();
  const query = 'DELETE FROM employees WHERE id = ?';
  
  if (conn.type === 'mysql') {
    await conn.pool.query(query, [id]);
  } else {
    await conn.pool.query(query.replace('?', '$1'), [id]);
  }
}

// ============================================================
//  ATTENDANCE
// ============================================================

export async function getAttendanceFromDB() {
  const conn = await getConnection();
  const query = 'SELECT * FROM attendance';
  
  if (conn.type === 'mysql') {
    const [rows] = await conn.pool.query(query);
    return rows;
  } else {
    const result = await conn.pool.query(query);
    return result.rows;
  }
}

export async function saveAttendanceToDB(records: any[]) {
  const conn = await getConnection();
  const table = 'attendance';
  const columns = ['id', 'employeeId', 'employeeName', 'date', 'checkIn', 'checkOut', 'lateMinutes', 'earlyDepartureMinutes', 'status', 'updatedAt'];
  const placeholders = conn.type === 'mysql' 
    ? columns.map(() => '?').join(', ')
    : columns.map((_, i) => `$${i + 1}`).join(', ');
  
  const updateClause = columns
    .filter(c => c !== 'id')
    .map(c => `${c} = VALUES(${c})`)
    .join(', ');
  
  if (records.length === 0) return;

  await conn.pool.query('BEGIN');
  try {
    for (const rec of records) {
      const values = columns.map(c => {
        if (c === 'updatedAt') return new Date().toISOString();
        if (c === 'lateMinutes' || c === 'earlyDepartureMinutes') return rec[c] || 0;
        return rec[c] || '';
      });
      
      let query;
      if (conn.type === 'mysql') {
        query = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders}) ON DUPLICATE KEY UPDATE ${updateClause}`;
      } else {
        const conflictUpdate = columns
          .filter(c => c !== 'id')
          .map(c => `${c} = EXCLUDED.${c}`)
          .join(', ');
        query = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders}) ON CONFLICT (id) DO UPDATE SET ${conflictUpdate}`;
      }
      
      await conn.pool.query(query, values);
    }
    await conn.pool.query('COMMIT');
  } catch (err) {
    await conn.pool.query('ROLLBACK').catch(() => {});
    throw err;
  }
}

// ============================================================
//  PAYROLL
// ============================================================

export async function getPayrollFromDB() {
  const conn = await getConnection();
  const query = 'SELECT * FROM payroll';
  
  if (conn.type === 'mysql') {
    const [rows] = await conn.pool.query(query);
    return rows;
  } else {
    const result = await conn.pool.query(query);
    return result.rows;
  }
}

export async function savePayrollToDB(records: any[]) {
  const conn = await getConnection();
  const table = 'payroll';
  const columns = ['id', 'employeeId', 'employeeName', 'month', 'baseSalary', 'bonus', 'penalty', 'leaveDeductions', 'netSalary', 'status', 'calculatedAt', 'updatedAt'];
  const placeholders = conn.type === 'mysql' 
    ? columns.map(() => '?').join(', ')
    : columns.map((_, i) => `$${i + 1}`).join(', ');
  
  const updateClause = columns
    .filter(c => c !== 'id')
    .map(c => `${c} = VALUES(${c})`)
    .join(', ');
  
  if (records.length === 0) return;

  await conn.pool.query('BEGIN');
  try {
    for (const rec of records) {
      const values = columns.map(c => {
        if (c === 'updatedAt') return new Date().toISOString();
        return rec[c] || 0;
      });
      
      let query;
      if (conn.type === 'mysql') {
        query = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders}) ON DUPLICATE KEY UPDATE ${updateClause}`;
      } else {
        const conflictUpdate = columns
          .filter(c => c !== 'id')
          .map(c => `${c} = EXCLUDED.${c}`)
          .join(', ');
        query = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders}) ON CONFLICT (id) DO UPDATE SET ${conflictUpdate}`;
      }
      
      await conn.pool.query(query, values);
    }
    await conn.pool.query('COMMIT');
  } catch (err) {
    await conn.pool.query('ROLLBACK').catch(() => {});
    throw err;
  }
}

// ============================================================
//  LEAVES
// ============================================================

export async function getLeavesFromDB() {
  const conn = await getConnection();
  const query = 'SELECT * FROM leaves';
  
  if (conn.type === 'mysql') {
    const [rows] = await conn.pool.query(query);
    return rows;
  } else {
    const result = await conn.pool.query(query);
    return result.rows;
  }
}

export async function saveLeavesToDB(records: any[]) {
  const conn = await getConnection();
  const table = 'leaves';
  const columns = ['id', 'employeeId', 'employeeName', 'leaveType', 'startDate', 'endDate', 'reason', 'status', 'approvedBy', 'approvedAt', 'updatedAt'];
  const placeholders = conn.type === 'mysql' 
    ? columns.map(() => '?').join(', ')
    : columns.map((_, i) => `$${i + 1}`).join(', ');
  
  const updateClause = columns
    .filter(c => c !== 'id')
    .map(c => `${c} = VALUES(${c})`)
    .join(', ');
  
  if (records.length === 0) return;

  await conn.pool.query('BEGIN');
  try {
    for (const rec of records) {
      const values = columns.map(c => {
        if (c === 'updatedAt') return new Date().toISOString();
        return rec[c] || '';
      });
      
      let query;
      if (conn.type === 'mysql') {
        query = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders}) ON DUPLICATE KEY UPDATE ${updateClause}`;
      } else {
        const conflictUpdate = columns
          .filter(c => c !== 'id')
          .map(c => `${c} = EXCLUDED.${c}`)
          .join(', ');
        query = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders}) ON CONFLICT (id) DO UPDATE SET ${conflictUpdate}`;
      }
      
      await conn.pool.query(query, values);
    }
    await conn.pool.query('COMMIT');
  } catch (err) {
    await conn.pool.query('ROLLBACK').catch(() => {});
    throw err;
  }
}

// ============================================================
//  CANDIDATES (Recruitment)
// ============================================================

export async function getCandidatesFromDB() {
  const conn = await getConnection();
  const query = 'SELECT * FROM candidates';
  
  if (conn.type === 'mysql') {
    const [rows] = await conn.pool.query(query);
    return rows;
  } else {
    const result = await conn.pool.query(query);
    return result.rows;
  }
}

export async function saveCandidatesToDB(candidates: any[]) {
  const conn = await getConnection();
  const table = 'candidates';
  const columns = ['id', 'name', 'email', 'phone', 'skills', 'experienceYears', 'resumeFileName', 'status', 'updatedAt'];
  const placeholders = conn.type === 'mysql' 
    ? columns.map(() => '?').join(', ')
    : columns.map((_, i) => `$${i + 1}`).join(', ');
  
  const updateClause = columns
    .filter(c => c !== 'id')
    .map(c => `${c} = VALUES(${c})`)
    .join(', ');
  
  if (candidates.length === 0) return;

  await conn.pool.query('BEGIN');
  try {
    for (const c of candidates) {
      const values = columns.map(col => {
        if (col === 'updatedAt') return new Date().toISOString();
        if (col === 'skills' && Array.isArray(c[col])) return c[col].join(',');
        return c[col] || '';
      });
      
      let query;
      if (conn.type === 'mysql') {
        query = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders}) ON DUPLICATE KEY UPDATE ${updateClause}`;
      } else {
        const conflictUpdate = columns
          .filter(c => c !== 'id')
          .map(c => `${c} = EXCLUDED.${c}`)
          .join(', ');
        query = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders}) ON CONFLICT (id) DO UPDATE SET ${conflictUpdate}`;
      }
      
      await conn.pool.query(query, values);
    }
    await conn.pool.query('COMMIT');
  } catch (err) {
    await conn.pool.query('ROLLBACK').catch(() => {});
    throw err;
  }
}

export async function getEmployeeByIdFromDB(id: string) {
  const conn = await getConnection();
  const query = 'SELECT * FROM employees WHERE id = ?';
  
  if (conn.type === 'mysql') {
    const [rows] = await conn.pool.query(query, [id]);
    return (rows as any[])[0] || null;
  } else {
    const result = await conn.pool.query(query.replace('?', '$1'), [id]);
    return result.rows[0] || null;
  }
}

// ============================================================
//  SALARY STRUCTURE – For Payroll
// ============================================================

export async function getSalaryStructureFromDB(employeeId: string) {
  const conn = await getConnection();
  const query = 'SELECT * FROM salary_structures WHERE employeeId = ? AND isActive = 1';
  
  if (conn.type === 'mysql') {
    const [rows] = await conn.pool.query(query, [employeeId]);
    return (rows as any[])[0] || null;
  } else {
    const result = await conn.pool.query(query.replace('?', '$1'), [employeeId]);
    return result.rows[0] || null;
  }
}

// ============================================================
//  DEPARTMENT & DESIGNATION (for employee enrichment)
// ============================================================

export async function getDepartmentsFromDB() {
  const conn = await getConnection();
  const query = 'SELECT * FROM departments';
  
  if (conn.type === 'mysql') {
    const [rows] = await conn.pool.query(query);
    return rows;
  } else {
    const result = await conn.pool.query(query);
    return result.rows;
  }
}

export async function getDesignationsFromDB() {
  const conn = await getConnection();
  const query = 'SELECT * FROM designations';
  
  if (conn.type === 'mysql') {
    const [rows] = await conn.pool.query(query);
    return rows;
  } else {
    const result = await conn.pool.query(query);
    return result.rows;
  }
}

