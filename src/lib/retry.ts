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

export interface CircuitState {
  failures: number;
  lastFailureTime: number;
  successInHalfOpen: number;
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
}

export const circuitStates = new Map<string, CircuitState>();

export function getCircuitState(key: string): CircuitState {
  if (!circuitStates.has(key)) {
    circuitStates.set(key, {
      failures: 0,
      lastFailureTime: 0,
      successInHalfOpen: 0,
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
    if (elapsed > timeout) {
      // Allow a single probe by entering HALF_OPEN.
      state.state = 'HALF_OPEN';
      state.successInHalfOpen = 0;
      return false;
    }
    return true;
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
      state.state = 'CLOSED';
    }
    return;
  }

  state.failures = 0;
  state.state = 'CLOSED';
}

function recordFailure(key: string, config?: CircuitBreakerConfig): void {
  if (!config) return;
  const state = getCircuitState(key);
  // A failure during a probe immediately re-opens.
  if (state.state === 'HALF_OPEN') {
    state.state = 'OPEN';
    state.lastFailureTime = Date.now();
    state.successInHalfOpen = 0;
    return;
  }
  state.failures++;
  state.lastFailureTime = Date.now();

  if (state.failures >= config.failureThreshold) {
    state.state = 'OPEN';
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
  retryOptions: RetryOptions = {}
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

  const circuitKey = url;

  // Check circuit breaker
  if (circuitBreaker && isCircuitOpen(circuitKey, circuitBreaker)) {
    throw new Error(`Circuit breaker open for ${url} - too many failures`);
  }

  let lastError: Error | null = null;
  let attempt = 0;

  while (attempt <= maxRetries) {
    attempt++;
    
    try {
      // Use our fetchWithTimeout for timeout support
      const response = await fetchWithTimeout(url, options);
      
      // Check if response is retryable
      if (isRetryableStatus(response.status, retryableStatuses)) {
        if (attempt <= maxRetries) {
          const delay = calculateBackoff(attempt, baseDelay, maxDelay);
          if (onRetry) onRetry(attempt, new Error(`HTTP ${response.status}`));
          await sleep(delay);
          continue;
        }
        // If we're out of retries, return the response (it will be handled as an error)
        return response;
      }
      
      // Success
      if (circuitBreaker) recordSuccess(circuitKey, circuitBreaker);
      return response;
      
    } catch (error: any) {
      lastError = error;
      
      // Check if error is retryable
      if (!isRetryableError(error, retryableErrors)) {
        // Non-retryable error – throw immediately
        if (circuitBreaker) recordFailure(circuitKey, circuitBreaker);
        throw error;
      }
      
      if (attempt <= maxRetries) {
        const delay = calculateBackoff(attempt, baseDelay, maxDelay);
        if (onRetry) onRetry(attempt, error);
        await sleep(delay);
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
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
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
