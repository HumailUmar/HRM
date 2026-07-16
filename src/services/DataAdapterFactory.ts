import { logger } from '../lib/logger';
import { IDataAdapter } from './interfaces/IDataAdapter';
import { LocalStorageAdapter } from './LocalStorageAdapter';
import { GoogleSheetsAdapter } from './GoogleSheetsAdapter';
import { MySQLAdapter } from './adapters/MySQLAdapter';
import { PostgreSQLAdapter } from './adapters/PostgreSQLAdapter';
import { getSettings } from '../lib/storage';

export type StorageType = 'local' | 'google-sheets' | 'mysql' | 'postgresql' | 'api';

let cachedAdapter: IDataAdapter | null = null;
let currentStorageType: StorageType | null = null;

export function getDataAdapter(): IDataAdapter {
  const settings = getSettings();
  const storageType = (settings.storageType as StorageType) || 'local';
  
  let resolvedStorageType = storageType;
  if (storageType === 'google-sheets' && (!settings.googleSheets || !settings.googleSheets.spreadsheetId)) {
    console.warn('Google Sheets not configured (spreadsheetId is empty), falling back to localStorage');
    resolvedStorageType = 'local';
  }

  if (cachedAdapter && currentStorageType === resolvedStorageType) {
    return cachedAdapter;
  }

  switch (resolvedStorageType) {
    case 'google-sheets':
      cachedAdapter = new GoogleSheetsAdapter(settings);
      break;
    case 'mysql':
      // Read MySQL config from settings or environment
      const mysqlConfig = {
        host: settings.database.mysql.host || 'localhost',
        port: Number(settings.database.mysql.port) || 3306,
        database: settings.database.mysql.database || 'humail_eli_hrm',
        username: settings.database.mysql.username || 'admin',
        password: settings.database.mysql.password || '',
        ssl: settings.database.mysql.ssl || false,
        poolSize: Number(settings.database.mysql.poolSize) || 10,
        timeout: Number(settings.database.mysql.timeout) || 10000,
      };
      cachedAdapter = new MySQLAdapter(mysqlConfig);
      break;
    case 'postgresql':
      const postgresConfig = {
        host: settings.database.postgres.host || 'localhost',
        port: Number(settings.database.postgres.port) || 5432,
        database: settings.database.postgres.database || 'humail_eli_hrm',
        username: settings.database.postgres.username || 'postgres',
        password: settings.database.postgres.password || '',
        ssl: settings.database.postgres.ssl || false,
        poolSize: Number(settings.database.postgres.poolSize) || 10,
        timeout: Number(settings.database.postgres.timeout) || 10000,
      };
      cachedAdapter = new PostgreSQLAdapter(postgresConfig);
      break;
    case 'local':
    default:
      cachedAdapter = new LocalStorageAdapter();
      break;
  }

  currentStorageType = resolvedStorageType;
  logger.info(`✅ Data adapter initialized: ${resolvedStorageType}`);
  return cachedAdapter;
}

export function refreshDataAdapter(): IDataAdapter {
  cachedAdapter = null;
  currentStorageType = null;
  return getDataAdapter();
}
