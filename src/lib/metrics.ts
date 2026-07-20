export interface MetricsSnapshot {
  syncSuccess: number;
  syncFailure: number;
  syncSkipped: number;
  circuitBreakerOpen: number;
  circuitBreakerClosed: number;
  adapterSwitch: number;
  authSuccess: number;
  authFailure: number;
  offlineQueueEnqueued: number;
  offlineQueueProcessed: number;
  offlineQueueFailed: number;
  lastUpdated: string;
}

type CounterKey = keyof MetricsSnapshot;

const counters: Record<CounterKey, number> = {
  syncSuccess: 0,
  syncFailure: 0,
  syncSkipped: 0,
  circuitBreakerOpen: 0,
  circuitBreakerClosed: 0,
  adapterSwitch: 0,
  authSuccess: 0,
  authFailure: 0,
  offlineQueueEnqueued: 0,
  offlineQueueProcessed: 0,
  offlineQueueFailed: 0,
  lastUpdated: new Date().toISOString(),
};

function bump(key: CounterKey, delta = 1) {
  counters[key] += delta;
  counters.lastUpdated = new Date().toISOString();
}

export function incrementSyncSuccess() { bump('syncSuccess'); }
export function incrementSyncFailure() { bump('syncFailure'); }
export function incrementSyncSkipped() { bump('syncSkipped'); }
export function incrementCircuitBreakerOpen() { bump('circuitBreakerOpen'); }
export function incrementCircuitBreakerClosed() { bump('circuitBreakerClosed'); }
export function incrementAdapterSwitch() { bump('adapterSwitch'); }
export function incrementAuthSuccess() { bump('authSuccess'); }
export function incrementAuthFailure() { bump('authFailure'); }
export function incrementOfflineQueueEnqueued() { bump('offlineQueueEnqueued'); }
export function incrementOfflineQueueProcessed() { bump('offlineQueueProcessed'); }
export function incrementOfflineQueueFailed() { bump('offlineQueueFailed'); }

export function getMetrics(): MetricsSnapshot {
  return { ...counters };
}

export function resetMetrics() {
  for (const key of Object.keys(counters)) {
    if (key !== 'lastUpdated') {
      counters[key as CounterKey] = 0;
    }
  }
  counters.lastUpdated = new Date().toISOString();
}
