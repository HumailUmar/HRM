/// <reference types="vite/client" />
const isProd = process.env.NODE_ENV === 'production';

/**
 * Logging that never silently hides failures in production.
 * - error/warn always print in prod (they carry the failure signal the app
 *   otherwise depends on for data-loss detection).
 * - info prints in prod too (lifecycle/important events).
 * - debug is dev-only (verbose tracing).
 */
export const logger = {
  info: (...args: any[]) => {
    if (isProd) console.log('[info]', ...args);
    else console.log(...args);
  },
  warn: (...args: any[]) => {
    if (isProd) console.warn('[warn]', ...args);
    else console.warn(...args);
  },
  error: (...args: any[]) => {
    console.error('[error]', ...args);
  },
  debug: (...args: any[]) => {
    if (!isProd) console.debug(...args);
  }
};
