// src/lib/distributedLock.ts

export interface LockOptions {
  ttlMs?: number;
  retryMs?: number;
  maxWaitMs?: number;
}

interface LockEntry {
  owner: string;
  expiresAt: number;
}

const locks = new Map<string, LockEntry>();
const LOCK_TTL_MS = 30_000;
const LOCK_RETRY_MS = 200;
const LOCK_MAX_WAIT_MS = 10_000;

function cleanupExpired(): void {
  const now = Date.now();
  for (const [key, entry] of locks.entries()) {
    if (entry.expiresAt <= now) {
      locks.delete(key);
    }
  }
}

export async function acquireLock(resource: string, options: LockOptions = {}): Promise<boolean> {
  const ttl = options.ttlMs ?? LOCK_TTL_MS;
  const retryMs = options.retryMs ?? LOCK_RETRY_MS;
  const maxWait = options.maxWaitMs ?? LOCK_MAX_WAIT_MS;
  const owner = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const deadline = Date.now() + maxWait;

  while (Date.now() < deadline) {
    cleanupExpired();
    if (!locks.has(resource)) {
      locks.set(resource, { owner, expiresAt: Date.now() + ttl });
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, retryMs));
  }
  return false;
}

export function releaseLock(resource: string, owner: string): void {
  const entry = locks.get(resource);
  if (entry && entry.owner === owner) {
    locks.delete(resource);
  }
}

export function withLock<T>(resource: string, fn: () => Promise<T>, options: LockOptions = {}): Promise<T> {
  return new Promise((resolve, reject) => {
    acquireLock(resource, options).then(acquired => {
      if (!acquired) {
        return reject(new Error(`Failed to acquire lock for ${resource} within timeout`));
      }
      const owner = locks.get(resource)!.owner;
      Promise.resolve(fn()).finally(() => releaseLock(resource, owner)).then(resolve, reject);
    }).catch(reject);
  });
}
