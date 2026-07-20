export interface SyncTracker {
  module: string;
  lastSync: string; // ISO timestamp
  lastRecordCount: number;
}

const STORAGE_KEY = 'humail_eli_sync_tracker';

export function getSyncTracker(): SyncTracker[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveSyncTracker(trackers: SyncTracker[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.isArray(trackers) ? trackers : []));
}

export function getLastSync(module: string): string | null {
  const trackers = getSyncTracker();
  const found = trackers.find(t => t.module === module);
  return found?.lastSync || null;
}

export function updateSyncTracker(module: string, recordCount: number): void {
  const trackers = getSyncTracker();
  const index = trackers.findIndex(t => t.module === module);
  const entry: SyncTracker = {
    module,
    lastSync: new Date().toISOString(),
    lastRecordCount: recordCount,
  };
  if (index >= 0) {
    trackers[index] = entry;
  } else {
    trackers.push(entry);
  }
  saveSyncTracker(trackers);
}

export function clearSyncTracker(module: string): void {
  const trackers = getSyncTracker();
  saveSyncTracker(trackers.filter(t => t.module !== module));
}
