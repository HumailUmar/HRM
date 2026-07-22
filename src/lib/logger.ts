/// <reference types="vite/client" />
const isProd = process.env.NODE_ENV === 'production';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  module?: string;
  data?: any;
}

const SENSITIVE_KEYS = new Set([
  'password', 'token', 'accesstoken', 'idtoken', 'authorization', 'cookie',
  'apikey', 'secret', 'clientsecret', 'encryptionkey', 'jwt', 'rawbody',
]);

function sanitize(value: any, seen = new WeakSet<object>()): any {
  if (value instanceof Error) {
    return { name: value.name, message: value.message, stack: value.stack };
  }
  if (!value || typeof value !== 'object') return value;
  if (seen.has(value)) return '[Circular]';
  seen.add(value);
  if (Array.isArray(value)) return value.map(item => sanitize(item, seen));
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [
    key,
    SENSITIVE_KEYS.has(key.toLowerCase()) ? '[REDACTED]' : sanitize(item, seen),
  ]));
}

function formatArgs(args: any[]): any[] {
  return args.map(arg => sanitize(arg));
}

function emit(level: LogLevel, message: string, module?: string, ...args: any[]) {
  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    module,
    data: args.length > 0 ? formatArgs(args) : undefined,
  };

  if (isProd) {
    console.log(JSON.stringify(entry));
  } else {
    const prefix = module ? `[${module}]` : '';
    console[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'](`${prefix} ${message}`, ...formatArgs(args));
  }
}

/**
 * Logging that never silently hides failures in production.
 * - error/warn always print in prod (they carry the failure signal the app
 *   otherwise depends on for data-loss detection).
 * - info prints in prod too (lifecycle/important events).
 * - debug is dev-only (verbose tracing).
 */
export const logger = {
  info: (message: string, module?: string, ...args: any[]) => emit('info', message, module, ...args),
  warn: (message: string, module?: string, ...args: any[]) => emit('warn', message, module, ...args),
  error: (message: string, module?: string, ...args: any[]) => emit('error', message, module, ...args),
  debug: (message: string, module?: string, ...args: any[]) => {
    if (!isProd) emit('debug', message, module, ...args);
  }
};
