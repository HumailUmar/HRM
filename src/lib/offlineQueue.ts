// src/lib/offlineQueue.ts

import { logger } from './logger';
import { fetchWithRetry, CircuitBreakerConfig } from './retry';
import { incrementOfflineQueueEnqueued, incrementOfflineQueueProcessed, incrementOfflineQueueFailed } from './metrics';

const OFFLINE_QUEUE_CIRCUIT_BREAKER: CircuitBreakerConfig = {
  failureThreshold: 5,
  successThreshold: 2,
  timeout: 30000,
};

export interface QueuedRequest {
  id: string;
  endpoint: string;
  method: 'POST' | 'PUT' | 'DELETE';
  body: any;
  timestamp: string;
  retries: number;
}

const QUEUE_KEY = 'hrm_offline_queue';

function getQueue(): QueuedRequest[] {
  if (typeof window === 'undefined') return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveQueue(queue: QueuedRequest[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch (e) {
    if ((e as any).name === 'QuotaExceededError' || (e as any).code === 22 || ((e as any).message || '').toLowerCase().includes('quota')) {
      logger.error('Offline queue lost: localStorage quota exceeded');
      if (typeof window !== 'undefined' && window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('hrm:storage-quota-exceeded'));
      }
    } else {
      logger.error('Failed to save offline queue:', e);
    }
  }
}

export function enqueueRequest(request: Omit<QueuedRequest, 'id' | 'timestamp' | 'retries'>): void {
  const queue = getQueue();
  queue.push({
    id: `req-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    ...request,
    timestamp: new Date().toISOString(),
    retries: 0,
  });
  saveQueue(queue);
  incrementOfflineQueueEnqueued();
}

export async function processQueue(): Promise<void> {
  const queue = getQueue();
  if (queue.length === 0) return;

  const remaining: QueuedRequest[] = [];

  for (const req of queue) {
    try {
      const response = await fetchWithRetry(req.endpoint, {
        method: req.method,
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify(req.body),
      }, {
        maxRetries: 2,
        baseDelay: 1000,
        maxDelay: 10000,
        circuitBreaker: OFFLINE_QUEUE_CIRCUIT_BREAKER,
      });
      if (!response.ok) {
        if (response.status >= 400 && response.status < 500) {
          console.warn(`Offline request failed (${response.status}), dropping:`, req);
          incrementOfflineQueueFailed();
          continue;
        }
        throw new Error(`HTTP ${response.status}`);
      }
      incrementOfflineQueueProcessed();
      // Success: don't add to remaining
    } catch (error) {
      // If retries < 3, keep it; else drop it.
      if (req.retries < 3) {
        remaining.push({ ...req, retries: req.retries + 1 });
      } else {
        console.error('Offline request failed permanently:', req, error);
        incrementOfflineQueueFailed();
      }
    }
  }

  saveQueue(remaining);
}

let queueProcessing = false;

// Listen for online events – debounce to prevent thundering herd on reconnect.
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    if (queueProcessing) return;
    console.log('🔄 Online detected, processing offline queue...');
    queueProcessing = true;
    processQueue().finally(() => { queueProcessing = false; });
  });
}
