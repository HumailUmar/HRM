// src/lib/offlineQueue.ts
import { getToken } from './auth';

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
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveQueue(queue: QueuedRequest[]): void {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
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
}

export async function processQueue(): Promise<void> {
  const queue = getQueue();
  if (queue.length === 0) return;

  const token = getToken();
  if (!token) return; // wait for auth

  const remaining: QueuedRequest[] = [];

  for (const req of queue) {
    try {
      const response = await fetch(req.endpoint, {
        method: req.method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(req.body),
      });
      if (!response.ok) {
        // If it's a 4xx (client error), don't retry; drop it and log.
        if (response.status >= 400 && response.status < 500) {
          console.warn(`Offline request failed (${response.status}), dropping:`, req);
          continue;
        }
        throw new Error(`HTTP ${response.status}`);
      }
      // Success: don't add to remaining
    } catch (error) {
      // If retries < 3, keep it; else drop it.
      if (req.retries < 3) {
        remaining.push({ ...req, retries: req.retries + 1 });
      } else {
        console.error('Offline request failed permanently:', req, error);
      }
    }
  }

  saveQueue(remaining);
}

// Listen for online events
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('🔄 Online detected, processing offline queue...');
    processQueue();
  });
}
