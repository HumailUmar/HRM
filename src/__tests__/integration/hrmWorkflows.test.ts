import { LocalStorageAdapter } from '../../services/LocalStorageAdapter';

describe('HRM integration: performance, training, succession, and exit', () => {
  const store = new Map<string, string>();
  let adapter: LocalStorageAdapter;

  beforeEach(() => {
    store.clear();
    const localStorage = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, value),
      removeItem: (key: string) => store.delete(key),
      clear: () => store.clear(),
    };
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: localStorage });
    Object.defineProperty(globalThis, 'window', { configurable: true, value: { localStorage } });
    adapter = new LocalStorageAdapter();
  });

  test.each([
    ['performance review', 'savePerformanceReviews', 'getPerformanceReviews', [{ id: 'REV-1', employeeId: 'EMP-1', status: 'Draft' }]],
    ['performance goal', 'savePerformanceGoals', 'getPerformanceGoals', [{ id: 'GOAL-1', employeeId: 'EMP-1', status: 'Active' }]],
    ['training module', 'saveTrainingModules', 'getTrainingModules', [{ id: 'TRAIN-1', title: 'Safety', status: 'Active' }]],
    ['training assignment', 'saveTrainingAssignments', 'getTrainingAssignments', [{ id: 'ASSIGN-1', employeeId: 'EMP-1', moduleId: 'TRAIN-1', status: 'Assigned' }]],
    ['succession plan', 'saveSuccessionPlans', 'getSuccessionPlans', [{ id: 'SUCCESSION-1', employeeId: 'EMP-1', status: 'Active' }]],
    ['exit record', 'saveExitRecords', 'getExitRecords', [{ id: 'EXIT-1', employeeId: 'EMP-1', status: 'Initiated' }]],
  ])('%s survives local adapter write/read round trip', async (_label, saveMethod, getMethod, records) => {
    await (adapter as any)[saveMethod](records);
    const result = await (adapter as any)[getMethod]();
    expect(result).toEqual(records);
  });

  test('performance/training/exit data remain isolated by collection key', async () => {
    await adapter.savePerformanceReviews([{ id: 'REV-1' } as any]);
    await adapter.saveTrainingModules([{ id: 'TRAIN-1' } as any]);
    await adapter.saveExitRecords([{ id: 'EXIT-1' } as any]);
    expect((await adapter.getPerformanceReviews()).map(item => item.id)).toEqual(['REV-1']);
    expect((await adapter.getTrainingModules()).map(item => item.id)).toEqual(['TRAIN-1']);
    expect((await adapter.getExitRecords()).map(item => item.id)).toEqual(['EXIT-1']);
  });

  test('stale or malformed collection values do not silently become another collection', async () => {
    await adapter.saveSuccessionPlans([{ id: 'SUCCESSION-1', status: 'Active' } as any]);
    expect(await adapter.getTrainingModules()).toEqual([]);
    expect(await adapter.getPerformanceReviews()).toEqual([]);
  });
});
