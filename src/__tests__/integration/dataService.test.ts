import { DataService } from '../../services/DataService';
import { LocalStorageAdapter } from '../../services/adapters/LocalStorageAdapter';

jest.mock('../../services/adapters/LocalStorageAdapter');

describe('DataService', () => {
  let dataService: DataService;
  const mockEmployees = [{ id: 'EMP-001', name: 'John' }];

  beforeEach(() => {
    (LocalStorageAdapter as jest.Mock).mockImplementation(() => ({
      getEmployees: jest.fn().mockResolvedValue(mockEmployees),
      saveEmployees: jest.fn().mockResolvedValue(undefined),
    }));
    dataService = new DataService();
  });

  test('getEmployees returns data from adapter', async () => {
    const result = await dataService.getEmployees();
    expect(result).toEqual(mockEmployees);
  });

  test('saveEmployees calls adapter saveEmployees', async () => {
    const spy = jest.spyOn(dataService['adapter'], 'saveEmployees');
    await dataService.saveEmployees(mockEmployees);
    expect(spy).toHaveBeenCalledWith(mockEmployees);
  });
});
