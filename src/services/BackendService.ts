import { IDataAdapter } from './interfaces/IDataAdapter';
import { LocalStorageAdapter } from './LocalStorageAdapter';

// Singleton instance of the backend abstraction layer.
// This allows easy extension to other adapters (e.g., GoogleSheetsAdapter, SQLAdapter, RESTAdapter) in the future.
class BackendServiceManager {
  private activeAdapter: IDataAdapter;

  constructor() {
    // Default to the LocalStorageAdapter, which leverages our existing local + GSheets sync flow.
    this.activeAdapter = new LocalStorageAdapter();
  }

  /**
   * Set a custom active adapter at runtime (useful for settings toggle or test suites).
   */
  public setAdapter(adapter: IDataAdapter) {
    this.activeAdapter = adapter;
  }

  /**
   * Retrieve the active backend adapter.
   */
  public getAdapter(): IDataAdapter {
    return this.activeAdapter;
  }
}

export const BackendService = new BackendServiceManager();
export default BackendService;
