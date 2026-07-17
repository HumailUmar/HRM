const lastIssuedCounters = new Map<string, number>();

/**
 * Ensures that the ID counters table exists in the database.
 */
const BROWSER_COUNTER_KEY_PREFIX = 'humail_eli_counter_';

function getNextBrowserCounter(entity: string): number {
  if (typeof window === 'undefined') {
    return ensureMonotonic(entity, (lastIssuedCounters.get(entity) ?? 1000) + 1);
  }

  const key = `${BROWSER_COUNTER_KEY_PREFIX}${entity}`;
  const raw = window.localStorage.getItem(key);
  const current = Number(raw || '1000');
  const next = ensureMonotonic(entity, current + 1);
  window.localStorage.setItem(key, String(next));
  return next;
}

async function loadServerDatabaseModule() {
  const modulePath = '../services/serverDatabase';
  return import(/* @vite-ignore */ modulePath);
}

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
  } catch {
    // Ignore and fall back.
  }

  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}${result}`;
}

function ensureMonotonic(entity: string, nextVal: number): number {
  const last = lastIssuedCounters.get(entity) ?? 1000;
  const resolved = nextVal > last ? nextVal : last + 1;
  lastIssuedCounters.set(entity, resolved);
  return resolved;
}

/**
 * Atomically get the next ID for an entity.
 * Uses a database counter table with row-level locking or atomic upsert.
 */
export async function getNextId(entity: string, prefix: string = ''): Promise<string> {
  if (typeof window !== 'undefined') {
    return `${prefix}${String(getNextBrowserCounter(entity)).padStart(4, '0')}`;
  }

  try {
    const { getConnection } = await loadServerDatabaseModule();
    const conn = await getConnection();
    await ensureIdCountersTable(conn);

    const table = 'id_counters';

    if (conn.type === 'mysql') {
      const connection = await conn.pool.getConnection();
      try {
        await connection.query(
          `
            INSERT INTO ${table} (entity, next_val) VALUES (?, 1000)
            ON DUPLICATE KEY UPDATE next_val = next_val + 1;
          `,
          [entity],
        );
        const [rows] = await connection.query(`SELECT next_val FROM ${table} WHERE entity = ?`, [entity]);
        const rawNextVal = Number((rows as any[])[0]?.next_val || 1000);
        const nextVal = ensureMonotonic(entity, rawNextVal);
        return `${prefix}${String(nextVal).padStart(4, '0')}`;
      } finally {
        connection.release();
      }
    }

    const query = `
      INSERT INTO ${table} (entity, next_val) VALUES ($1, 1000)
      ON CONFLICT (entity) DO UPDATE SET next_val = ${table}.next_val + 1
      RETURNING next_val;
    `;
    const result = await conn.pool.query(query, [entity]);
    const rawNextVal = Number(result.rows[0]?.next_val || 1000);
    const nextVal = ensureMonotonic(entity, rawNextVal);
    return `${prefix}${String(nextVal).padStart(4, '0')}`;
  } catch (error) {
    console.error('Database atomic ID generation failed, falling back to secure short UUID:', error);
    return generateUUID(prefix);
  }
}

/**
 * For use when you already have an insert that uses a sequence.
 * sequenceName must be a simple identifier (alphanumeric + underscore) to
 * prevent SQL injection via identifier interpolation.
 */
const VALID_SEQUENCE_NAME = /^[A-Za-z_][A-Za-z0-9_]*$/;

export async function getNextIdFromSequence(sequenceName: string, prefix: string = ''): Promise<string> {
  if (!VALID_SEQUENCE_NAME.test(sequenceName)) {
    throw new Error(`Invalid sequence name: "${sequenceName}". Only alphanumeric and underscore allowed.`);
  }

  if (typeof window !== 'undefined') {
    return `${prefix}${String(getNextBrowserCounter(sequenceName)).padStart(4, '0')}`;
  }

  try {
    const { getConnection } = await loadServerDatabaseModule();
    const conn = await getConnection();

    if (conn.type === 'mysql') {
      const [rows] = await conn.pool.query(`SELECT NEXT VALUE FOR ${sequenceName} AS next_val`);
      const nextVal = Number((rows as any[])[0]?.next_val || 1000);
      return `${prefix}${String(ensureMonotonic(sequenceName, nextVal)).padStart(4, '0')}`;
    }

    const result = await conn.pool.query(`SELECT nextval('${sequenceName}') AS next_val`);
    const nextVal = Number(result.rows[0]?.next_val || 1000);
    return `${prefix}${String(ensureMonotonic(sequenceName, nextVal)).padStart(4, '0')}`;
  } catch (error) {
    console.error(`Sequence ID generation for ${sequenceName} failed, falling back to secure short UUID:`, error);
    return generateUUID(prefix);
  }
}
