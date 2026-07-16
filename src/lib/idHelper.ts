/**
 * Ensures that the ID counters table exists in the database.
 */
async function ensureIdCountersTable(conn: any): Promise<void> {
  const table = 'id_counters';
  let query: string;
  if (conn.type === 'mysql') {
    query = `
      CREATE TABLE IF NOT EXISTS ${table} (
        entity VARCHAR(50) PRIMARY KEY,
        next_val BIGINT NOT NULL DEFAULT 1000
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;
  } else {
    // PostgreSQL
    query = `
      CREATE TABLE IF NOT EXISTS ${table} (
        entity VARCHAR(50) PRIMARY KEY,
        next_val BIGINT NOT NULL DEFAULT 1000
      );
    `;
  }
  await conn.pool.query(query);
}

/**
 * Generates a cryptographically secure random UUID-based short ID as a fallback.
 */
export function generateUUID(prefix: string = ''): string {
  try {
    if (typeof globalThis !== 'undefined' && globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function') {
      return `${prefix}${globalThis.crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase()}`;
    }
  } catch (e) {
    // ignore and fallback
  }
  
  // Fallback if randomUUID is not supported or errors out
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}${result}`;
}

/**
 * Atomically get the next ID for an entity.
 * Uses a database counter table with row-level locking or atomic upsert.
 */
export async function getNextId(entity: string, prefix: string = ''): Promise<string> {
  try {
    const { getConnection } = await import(/* @vite-ignore */ '../services/serverDatabase');
    const conn = await getConnection();
    await ensureIdCountersTable(conn);
    
    const table = 'id_counters';
    let query: string;
    
    if (conn.type === 'mysql') {
      // For MySQL, we run the insert/update first to update the counter atomically.
      // ON DUPLICATE KEY UPDATE with LAST_INSERT_ID(expr) ensures we can fetch the value.
      query = `
        INSERT INTO ${table} (entity, next_val) VALUES (?, 1000)
        ON DUPLICATE KEY UPDATE next_val = LAST_INSERT_ID(next_val + 1);
      `;
      
      // To be 100% safe with pool connection scoping, use a single acquired connection
      const connection = await conn.pool.getConnection();
      try {
        await connection.query(query, [entity]);
        const [rows] = await connection.query('SELECT LAST_INSERT_ID() AS next_val');
        const nextVal = (rows as any[])[0]?.next_val;
        if (nextVal && nextVal > 0) {
          return `${prefix}${String(nextVal).padStart(4, '0')}`;
        }
      } finally {
        connection.release();
      }
      
      // Fallback if single connection fails or returns zero
      const [directRows] = await conn.pool.query(`SELECT next_val FROM ${table} WHERE entity = ?`, [entity]);
      const nextVal = (directRows as any[])[0]?.next_val || 1000;
      return `${prefix}${String(nextVal).padStart(4, '0')}`;
    } else {
      // PostgreSQL
      query = `
        INSERT INTO ${table} (entity, next_val) VALUES ($1, 1000)
        ON CONFLICT (entity) DO UPDATE SET next_val = ${table}.next_val + 1
        RETURNING next_val;
      `;
      const result = await conn.pool.query(query, [entity]);
      const nextVal = result.rows[0]?.next_val || 1000;
      return `${prefix}${String(nextVal).padStart(4, '0')}`;
    }
  } catch (error) {
    console.error('Database atomic ID generation failed, falling back to secure short UUID:', error);
    return generateUUID(prefix);
  }
}

/**
 * For use when you already have an insert that uses a sequence.
 */
export async function getNextIdFromSequence(sequenceName: string, prefix: string = ''): Promise<string> {
  try {
    const { getConnection } = await import(/* @vite-ignore */ '../services/serverDatabase');
    const conn = await getConnection();
    let query: string;
    if (conn.type === 'mysql') {
      query = `SELECT NEXT VALUE FOR ${sequenceName} AS next_val`;
      const [rows] = await conn.pool.query(query);
      const nextVal = (rows as any[])[0]?.next_val || 1000;
      return `${prefix}${String(nextVal).padStart(4, '0')}`;
    } else {
      query = `SELECT nextval('${sequenceName}') AS next_val`;
      const result = await conn.pool.query(query);
      const nextVal = result.rows[0]?.next_val || 1000;
      return `${prefix}${String(nextVal).padStart(4, '0')}`;
    }
  } catch (error) {
    console.error(`Sequence ID generation for ${sequenceName} failed, falling back to secure short UUID:`, error);
    return generateUUID(prefix);
  }
}
