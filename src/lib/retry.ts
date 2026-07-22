// src/lib/retry.ts

export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number; // milliseconds
  maxDelay?: number; // milliseconds
  retryableStatuses?: number[]; // HTTP status codes to retry
  retryableErrors?: string[]; // Error messages to retry
  onRetry?: (attempt: number, error: Error) => void;
  circuitBreaker?: CircuitBreakerConfig;
}

export interface CircuitBreakerConfig {
  failureThreshold: number; // Number of failures before opening
  successThreshold: number; // Number of successes before closing
  timeout: number; // milliseconds to wait before trying again
}

import { incrementCircuitBreakerOpen, incrementCircuitBreakerClosed } from './metrics';

export interface CircuitState {
  failures: number;
  lastFailureTime: number;
  successInHalfOpen: number;
  /** Only one request may probe a half-open dependency at a time. */
  halfOpenProbeInFlight: boolean;
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
}

export const circuitStates = new Map<string, CircuitState>();
const CIRCUIT_STATE_TTL = 30 * 60 * 1000;
const MAX_CIRCUIT_STATES = 500;

export function pruneCircuitStates(): void {
  const now = Date.now();
  for (const [key, state] of circuitStates.entries()) {
    if (state.state === 'CLOSED' && now - state.lastFailureTime > CIRCUIT_STATE_TTL) {
      circuitStates.delete(key);
    }
  }
  if (circuitStates.size > MAX_CIRCUIT_STATES) {
    const entries = [...circuitStates.entries()];
    entries.sort((a, b) => a[1].lastFailureTime - b[1].lastFailureTime);
    for (let i = 0; i < entries.length - MAX_CIRCUIT_STATES; i++) {
      circuitStates.delete(entries[i][0]);
    }
  }
}

const pruneInterval = setInterval(pruneCircuitStates, 5 * 60 * 1000);
// Background circuit-state maintenance must not keep test/CLI processes alive.
if (typeof (pruneInterval as any)?.unref === 'function') (pruneInterval as any).unref();

export function getCircuitState(key: string): CircuitState {
  if (!circuitStates.has(key)) {
    circuitStates.set(key, {
      failures: 0,
      lastFailureTime: 0,
      successInHalfOpen: 0,
      halfOpenProbeInFlight: false,
      state: 'CLOSED',
    });
  }
  return circuitStates.get(key)!;
}

function isCircuitOpen(key: string, config?: CircuitBreakerConfig): boolean {
  if (!config) return false;
  const state = getCircuitState(key);

  if (state.state === 'OPEN') {
    const timeout = Number.isFinite(config.timeout) && config.timeout > 0 ? config.timeout : 60000;
    const elapsed = Date.now() - state.lastFailureTime;
    if (elapsed <= timeout) return true;
    // Enter half-open and reserve the sole recovery probe.
    state.state = 'HALF_OPEN';
    state.successInHalfOpen = 0;
    state.halfOpenProbeInFlight = true;
    return false;
  }
  if (state.state === 'HALF_OPEN') {
    if (state.halfOpenProbeInFlight) return true;
    state.halfOpenProbeInFlight = true;
  }
  return false;
}

function recordSuccess(key: string, config?: CircuitBreakerConfig): void {
  if (!config) return;
  const state = getCircuitState(key);

  if (state.state === 'HALF_OPEN') {
    const threshold = Number.isFinite(config.successThreshold) && config.successThreshold > 0
      ? config.successThreshold
      : 1;
    state.successInHalfOpen += 1;
    if (state.successInHalfOpen >= threshold) {
      state.failures = 0;
      state.successInHalfOpen = 0;
      state.halfOpenProbeInFlight = false;
      state.state = 'CLOSED';
      incrementCircuitBreakerClosed();
    } else {
      state.halfOpenProbeInFlight = false;
    }
    return;
  }

  state.failures = 0;
  state.halfOpenProbeInFlight = false;
  state.state = 'CLOSED';
  incrementCircuitBreakerClosed();
}

function recordFailure(key: string, config?: CircuitBreakerConfig): void {
  if (!config) return;
  const state = getCircuitState(key);
  // A failure during a probe immediately re-opens.
  if (state.state === 'HALF_OPEN') {
    state.state = 'OPEN';
    state.lastFailureTime = Date.now();
    state.successInHalfOpen = 0;
    state.halfOpenProbeInFlight = false;
    incrementCircuitBreakerOpen();
    return;
  }
  state.failures++;
  state.lastFailureTime = Date.now();

  if (state.failures >= config.failureThreshold) {
    state.state = 'OPEN';
    state.halfOpenProbeInFlight = false;
    incrementCircuitBreakerOpen();
  }
}

function isRetryableStatus(status: number, retryableStatuses: number[] = [429, 500, 502, 503, 504]): boolean {
  return retryableStatuses.includes(status) || (status >= 500 && status <= 599);
}

function isRetryableError(error: Error, retryableErrors: string[] = ['timeout', 'ETIMEDOUT', 'ECONNRESET', 'abort']): boolean {
  const message = error.message ? error.message.toLowerCase() : '';
  const name = error.name ? error.name.toLowerCase() : '';
  return (
    retryableErrors.some(e => message.includes(e.toLowerCase()) || name.includes(e.toLowerCase())) ||
    (error as any).code === 'ECONNREFUSED' ||
    (error as any).code === 'ENOTFOUND'
  );
}

/**
 * Fetch with retry logic and circuit breaker.
 */
export async function fetchWithRetry(
  url: string,
  options: any = {},
  retryOptions: RetryOptions = {},
  signal?: AbortSignal
): Promise<Response> {
  if (!url || typeof url !== 'string') {
    throw new Error('fetchWithRetry: a valid URL is required');
  }
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 30000,
    retryableStatuses,
    retryableErrors,
    onRetry,
    circuitBreaker,
  } = retryOptions;

  // Use a normalized service key derived from origin + path, not the full URL with query params.
  const circuitKey = (() => {
    try {
      const u = new URL(url);
      return `${u.protocol}//${u.host}${u.pathname}`;
    } catch { return url; }
  })();

  // Check circuit breaker
  if (circuitBreaker && isCircuitOpen(circuitKey, circuitBreaker)) {
    throw new Error(`Circuit breaker open for ${url} - too many failures`);
  }

  let lastError: Error | null = null;
  let attempt = 0;

  while (attempt <= maxRetries) {
    if (signal?.aborted) {
      throw new Error('Aborted');
    }
    
    attempt++;
    
    try {
      // Use our fetchWithTimeout for timeout support
      const response = await fetchWithTimeout(url, options);
      
      // Check if response is retryable
      if (isRetryableStatus(response.status, retryableStatuses)) {
        if (attempt <= maxRetries) {
          const delay = calculateBackoff(attempt, baseDelay, maxDelay);
          if (onRetry) onRetry(attempt, new Error(`HTTP ${response.status}`));
          await sleep(delay, signal);
          continue;
        }
        // Exhausted retries — treat as failure, not success.
        if (circuitBreaker) recordFailure(circuitKey, circuitBreaker);
        throw new Error(`fetchWithRetry: exhausted ${maxRetries} retries for ${url} (last status: ${response.status})`);
      }
      
      // Success
      if (circuitBreaker) recordSuccess(circuitKey, circuitBreaker);
      return response;
      
    } catch (error: any) {
      lastError = error;
      
      if (signal?.aborted) {
        throw new Error('Aborted');
      }
      
      // Check if error is retryable
      if (!isRetryableError(error, retryableErrors)) {
        // Non-retryable error – throw immediately
        if (circuitBreaker) recordFailure(circuitKey, circuitBreaker);
        throw error;
      }
      
      if (attempt <= maxRetries) {
        const delay = calculateBackoff(attempt, baseDelay, maxDelay);
        if (onRetry) onRetry(attempt, error);
        await sleep(delay, signal);
      } else {
        // Out of retries – record failure for circuit breaker
        if (circuitBreaker) recordFailure(circuitKey, circuitBreaker);
        throw error;
      }
    }
  }

  // Should not reach here, but just in case
  throw lastError || new Error(`Failed after ${maxRetries} retries`);
}

/**
 * Calculate exponential backoff with jitter.
 */
function calculateBackoff(attempt: number, baseDelay: number, maxDelay: number): number {
  const safeBase = Number.isFinite(baseDelay) && baseDelay > 0 ? baseDelay : 1000;
  const safeMax = Number.isFinite(maxDelay) && maxDelay > 0 ? maxDelay : 30000;
  const safeAttempt = Number.isFinite(attempt) && attempt > 0 ? attempt : 1;
  const exponential = safeBase * Math.pow(2, safeAttempt - 1);
  const jitter = Math.random() * 0.3 * exponential; // 0-30% jitter
  return Math.min(exponential + jitter, safeMax);
}

/**
 * Sleep helper.
 */
function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error('Aborted'));
      return;
    }
    const timeout = setTimeout(resolve, ms);
    const onAbort = () => {
      clearTimeout(timeout);
      reject(new Error('Aborted'));
    };
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

/**
 * fetchWithTimeout helper.
 */
export async function fetchWithTimeout(
  resource: string,
  options: any = {}
): Promise<Response> {
  const rawTimeout = Number(options.timeout);
  const timeout = Number.isFinite(rawTimeout) && rawTimeout > 0 ? rawTimeout : 30000;
  const { timeout: _ignored, ...fetchOptions } = options;

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(resource, {
      ...fetchOptions,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(id);
  }
}
