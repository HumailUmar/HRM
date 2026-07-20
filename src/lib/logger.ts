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

function formatArgs(args: any[]): any[] {
  return args.map(arg => {
    if (arg instanceof Error) {
      return { name: arg.name, message: arg.message, stack: arg.stack };
    }
    return arg;
  });
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
    console[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'](`${prefix} ${message}`, ...args);
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
