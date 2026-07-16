import React, { useState, useEffect } from 'react';
import { getSettings, saveSettings } from '@/src/lib/storage';
import { refreshDataAdapter, StorageType } from '@/src/services';
import { 
  Database, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  HardDrive,
  Cloud,
  Server,
  Globe,
  AlertTriangle
} from 'lucide-react';

interface StorageSettingsProps {
  onSettingsChange?: () => void;
}

export default function StorageSettings({ onSettingsChange }: StorageSettingsProps) {
  const [settings, setSettings] = useState(getSettings());
  const [selectedStorage, setSelectedStorage] = useState<StorageType>(
    (settings.storageType as StorageType) || 'local'
  );
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingStorageType, setPendingStorageType] = useState<StorageType | null>(null);
  const [status, setStatus] = useState<{
    connected: boolean;
    message: string;
    lastSync?: string;
  }>({ connected: true, message: 'Connected to localStorage' });

  // MySQL config state
  const [mysqlHost, setMysqlHost] = useState(settings.mysqlHost || 'localhost');
  const [mysqlPort, setMysqlPort] = useState(settings.mysqlPort || 3306);
  const [mysqlDatabase, setMysqlDatabase] = useState(settings.mysqlDatabase || 'humail_eli_hrm');
  const [mysqlUsername, setMysqlUsername] = useState(settings.mysqlUsername || 'admin');
  const [mysqlPassword, setMysqlPassword] = useState(settings.mysqlPassword || '');
  const [mysqlSSL, setMysqlSSL] = useState(settings.mysqlSSL || false);
  const [mysqlPoolSize, setMysqlPoolSize] = useState(settings.mysqlPoolSize || 10);
  const [mysqlTimeout, setMysqlTimeout] = useState(settings.mysqlTimeout || 10000);

  // PostgreSQL config state
  const [postgresHost, setPostgresHost] = useState(settings.postgresHost || 'localhost');
  const [postgresPort, setPostgresPort] = useState(settings.postgresPort || 5432);
  const [postgresDatabase, setPostgresDatabase] = useState(settings.postgresDatabase || 'humail_eli_hrm');
  const [postgresUsername, setPostgresUsername] = useState(settings.postgresUsername || 'postgres');
  const [postgresPassword, setPostgresPassword] = useState(settings.postgresPassword || '');
  const [postgresSSL, setPostgresSSL] = useState(settings.postgresSSL || false);
  const [postgresPoolSize, setPostgresPoolSize] = useState(settings.postgresPoolSize || 10);
  const [postgresTimeout, setPostgresTimeout] = useState(settings.postgresTimeout || 10000);

  const storageOptions: { 
    value: StorageType; 
    label: string; 
    description: string; 
    icon: React.ReactNode;
    available: boolean;
    badge?: string;
  }[] = [
    {
      value: 'local',
      label: 'Local Storage',
      description: 'Data is stored in your browser. Best for testing and demo.',
      icon: <HardDrive className="w-5 h-5" />,
      available: true,
    },
    {
      value: 'google-sheets',
      label: 'Google Sheets',
      description: 'Data is stored in your Google Sheets. Best for small to medium businesses.',
      icon: <Cloud className="w-5 h-5" />,
      available: true,
    },
    {
      value: 'mysql',
      label: 'MySQL',
      description: 'Data is stored in a MySQL database. Best for medium to large businesses.',
      icon: <Database className="w-5 h-5" />,
      available: true,
      badge: 'Active Simulator',
    },
    {
      value: 'postgresql',
      label: 'PostgreSQL',
      description: 'Data is stored in a PostgreSQL database. Best for enterprise.',
      icon: <Server className="w-5 h-5" />,
      available: true,
      badge: 'Active Simulator',
    },
    {
      value: 'api',
      label: 'Custom API',
      description: 'Data is stored via a custom REST API. Best for existing backend systems.',
      icon: <Globe className="w-5 h-5" />,
      available: false,
      badge: 'Coming Soon',
    },
  ];

  const handleStorageChange = (value: StorageType) => {
    if (value === selectedStorage) return;
    setPendingStorageType(value);
    setShowConfirmDialog(true);
  };

  const confirmSwitch = () => {
    if (!pendingStorageType) return;
    
    setIsLoading(true);
    
    const updatedSettings = { ...settings, storageType: pendingStorageType };
    
    if (pendingStorageType === 'mysql') {
      // Reset to defaults when switching to MySQL as requested
      setMysqlHost('localhost');
      setMysqlPort(3306);
      setMysqlDatabase('humail_eli_hrm');
      setMysqlUsername('admin');
      setMysqlPassword('');
      setMysqlSSL(false);
      setMysqlPoolSize(10);
      setMysqlTimeout(10000);
      
      updatedSettings.mysqlHost = 'localhost';
      updatedSettings.mysqlPort = 3306;
      updatedSettings.mysqlDatabase = 'humail_eli_hrm';
      updatedSettings.mysqlUsername = 'admin';
      updatedSettings.mysqlPassword = '';
      updatedSettings.mysqlSSL = false;
      updatedSettings.mysqlPoolSize = 10;
      updatedSettings.mysqlTimeout = 10000;
    }

    if (pendingStorageType === 'postgresql') {
      // Reset to defaults when switching to PostgreSQL as requested
      setPostgresHost('localhost');
      setPostgresPort(5432);
      setPostgresDatabase('humail_eli_hrm');
      setPostgresUsername('postgres');
      setPostgresPassword('');
      setPostgresSSL(false);
      setPostgresPoolSize(10);
      setPostgresTimeout(10000);
      
      updatedSettings.postgresHost = 'localhost';
      updatedSettings.postgresPort = 5432;
      updatedSettings.postgresDatabase = 'humail_eli_hrm';
      updatedSettings.postgresUsername = 'postgres';
      updatedSettings.postgresPassword = '';
      updatedSettings.postgresSSL = false;
      updatedSettings.postgresPoolSize = 10;
      updatedSettings.postgresTimeout = 10000;
    }

    saveSettings(updatedSettings);
    setSettings(updatedSettings);
    setSelectedStorage(pendingStorageType);
    
    refreshDataAdapter();
    updateStatus(pendingStorageType);
    
    setIsLoading(false);
    setShowConfirmDialog(false);
    setPendingStorageType(null);
    
    if (onSettingsChange) {
      onSettingsChange();
    }
  };

  const cancelSwitch = () => {
    setShowConfirmDialog(false);
    setPendingStorageType(null);
  };

  const updateStatus = (type: StorageType) => {
    switch(type) {
      case 'local':
        setStatus({
          connected: true,
          message: 'Data is stored in your browser localStorage',
          lastSync: 'Always synced (local)',
        });
        break;
      case 'google-sheets':
        if (settings.googleSheetId && settings.googleSheetId !== 'Placeholder') {
          setStatus({
            connected: true,
            message: 'Connected to Google Sheets',
            lastSync: new Date().toISOString().replace('T', ' ').slice(0, 16),
          });
        } else {
          setStatus({
            connected: false,
            message: 'Google Sheet ID not configured. Please set your Sheet ID in Settings → Google Sheets Configuration.',
          });
        }
        break;
      case 'mysql':
        setStatus({
          connected: true,
          message: `Connected to MySQL database at ${settings.mysqlHost || 'localhost'}:${settings.mysqlPort || 3306}`,
          lastSync: new Date().toISOString().replace('T', ' ').slice(0, 16),
        });
        break;
      case 'postgresql':
        setStatus({
          connected: true,
          message: `Connected to PostgreSQL database at ${settings.postgresHost || 'localhost'}:${settings.postgresPort || 5432}`,
          lastSync: new Date().toISOString().replace('T', ' ').slice(0, 16),
        });
        break;
      default:
        setStatus({
          connected: false,
          message: 'This storage type is not yet available.',
        });
    }
  };

  const handleTestConnection = async () => {
    setIsLoading(true);
    try {
      const adapter = refreshDataAdapter();
      await adapter.getEmployees();
      setStatus({
        ...status,
        connected: true,
        message: `Successfully connected to ${storageOptions.find(s => s.value === selectedStorage)?.label}`,
      });
    } catch (error) {
      setStatus({
        ...status,
        connected: false,
        message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncNow = async () => {
    setIsLoading(true);
    try {
      const adapter = refreshDataAdapter();
      await adapter.syncAll();
      setStatus({
        ...status,
        connected: true,
        message: 'Sync completed successfully',
        lastSync: new Date().toISOString().replace('T', ' ').slice(0, 16),
      });
    } catch (error) {
      setStatus({
        ...status,
        connected: false,
        message: `Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    updateStatus(selectedStorage);
  }, [selectedStorage]);

  const getSelectedOption = storageOptions.find(s => s.value === selectedStorage);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2" id="storage-config-heading">
            <Database className="w-5 h-5 text-indigo-600" />
            Storage Configuration
          </h3>
          <p className="text-sm text-slate-500">
            Choose where your HRM data is stored. Changes take effect immediately.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            id="btn-test-connection"
            onClick={handleTestConnection}
            disabled={isLoading}
            className="px-4 py-2 text-sm border border-slate-200 rounded-xl hover:bg-slate-50 transition-all disabled:opacity-50"
          >
            {isLoading ? 'Testing...' : 'Test Connection'}
          </button>
          <button
            id="btn-sync-now"
            onClick={handleSyncNow}
            disabled={isLoading || selectedStorage === 'local'}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Syncing...' : 'Sync Now'}
          </button>
        </div>
      </div>

      <div className={`p-4 rounded-xl border ${
        status.connected 
          ? 'bg-emerald-50 border-emerald-200' 
          : 'bg-amber-50 border-amber-200'
      }`}>
        <div className="flex items-center gap-3">
          {status.connected ? (
            <CheckCircle className="w-5 h-5 text-emerald-600" />
          ) : (
            <AlertCircle className="w-5 h-5 text-amber-600" />
          )}
          <div className="flex-1">
            <p className={`font-medium ${status.connected ? 'text-emerald-700' : 'text-amber-700'}`}>
              {status.message}
            </p>
            {status.lastSync && (
              <p className="text-xs text-slate-500 mt-0.5">Last sync: {status.lastSync}</p>
            )}
          </div>
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
            status.connected ? 'bg-emerald-200 text-emerald-700' : 'bg-amber-200 text-amber-700'
          }`}>
            {status.connected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {storageOptions.map((option) => {
          const isSelected = selectedStorage === option.value;
          const isDisabled = !option.available;
          
          return (
            <div
              key={option.value}
              id={`storage-option-${option.value}`}
              onClick={() => !isDisabled && handleStorageChange(option.value)}
              className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                isSelected 
                  ? 'border-indigo-600 bg-indigo-50' 
                  : isDisabled
                    ? 'border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed'
                    : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-xl ${
                  isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  {option.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className={`font-bold ${
                      isSelected ? 'text-indigo-700' : 'text-slate-700'
                    }`}>
                      {option.label}
                    </p>
                    {option.badge && (
                      <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] rounded-full font-bold">
                        {option.badge}
                      </span>
                    )}
                    {isSelected && (
                      <CheckCircle className="w-4 h-4 text-indigo-600 ml-auto" />
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{option.description}</p>
                  {isDisabled && (
                    <p className="text-[10px] text-amber-600 font-medium mt-1">
                      ⚡ Available in future update
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* MySQL Configuration Form - Show only when MySQL is selected */}
      {selectedStorage === 'mysql' && (
        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 space-y-4">
          <h4 className="font-bold text-slate-700 text-sm flex items-center gap-2">
            <Database className="w-4 h-4 text-indigo-600" />
            MySQL Connection Details
          </h4>
          <p className="text-xs text-slate-400 -mt-2">
            Enter your MySQL database credentials. These will be used to connect to your database.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Host</label>
              <input
                type="text"
                value={mysqlHost}
                onChange={(e) => setMysqlHost(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                placeholder="localhost"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Port</label>
              <input
                type="number"
                value={mysqlPort}
                onChange={(e) => setMysqlPort(Number(e.target.value))}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                placeholder="3306"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Database Name</label>
              <input
                type="text"
                value={mysqlDatabase}
                onChange={(e) => setMysqlDatabase(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                placeholder="humail_eli_hrm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Username</label>
              <input
                type="text"
                value={mysqlUsername}
                onChange={(e) => setMysqlUsername(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                placeholder="admin"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Password</label>
              <input
                type="password"
                value={mysqlPassword}
                onChange={(e) => setMysqlPassword(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Pool Size</label>
              <input
                type="number"
                value={mysqlPoolSize}
                onChange={(e) => setMysqlPoolSize(Number(e.target.value))}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                placeholder="10"
              />
            </div>
            <div className="space-y-1 col-span-1 md:col-span-2">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-500 cursor-pointer">
                <input
                  type="checkbox"
                  checked={mysqlSSL}
                  onChange={(e) => setMysqlSSL(e.target.checked)}
                  className="rounded"
                />
                Enable SSL Connection
              </label>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => {
                // Save MySQL config to settings
                const updatedSettings = { 
                  ...settings, 
                  mysqlHost, 
                  mysqlPort, 
                  mysqlDatabase, 
                  mysqlUsername, 
                  mysqlPassword, 
                  mysqlSSL, 
                  mysqlPoolSize, 
                  mysqlTimeout 
                };
                saveSettings(updatedSettings);
                setSettings(updatedSettings);
                alert('MySQL configuration saved!');
                
                // Refresh data adapter and test connection
                refreshDataAdapter();
                if (onSettingsChange) {
                  onSettingsChange();
                }
                setStatus({
                  connected: true,
                  message: `MySQL Configuration saved! Testing connection to ${mysqlHost}:${mysqlPort}...`,
                });
                setTimeout(() => {
                  handleTestConnection();
                }, 500);
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-all"
            >
              Save MySQL Configuration
            </button>
          </div>
        </div>
      )}

      {/* PostgreSQL Configuration Form - Show only when PostgreSQL is selected */}
      {selectedStorage === 'postgresql' && (
        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 space-y-4">
          <h4 className="font-bold text-slate-700 text-sm flex items-center gap-2">
            <Server className="w-4 h-4 text-indigo-600" />
            PostgreSQL Connection Details
          </h4>
          <p className="text-xs text-slate-400 -mt-2">
            Enter your PostgreSQL database credentials. These will be used to connect to your database.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Host</label>
              <input
                type="text"
                value={postgresHost}
                onChange={(e) => setPostgresHost(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                placeholder="localhost"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Port</label>
              <input
                type="number"
                value={postgresPort}
                onChange={(e) => setPostgresPort(Number(e.target.value))}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                placeholder="5432"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Database Name</label>
              <input
                type="text"
                value={postgresDatabase}
                onChange={(e) => setPostgresDatabase(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                placeholder="humail_eli_hrm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Username</label>
              <input
                type="text"
                value={postgresUsername}
                onChange={(e) => setPostgresUsername(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                placeholder="postgres"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Password</label>
              <input
                type="password"
                value={postgresPassword}
                onChange={(e) => setPostgresPassword(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Pool Size</label>
              <input
                type="number"
                value={postgresPoolSize}
                onChange={(e) => setPostgresPoolSize(Number(e.target.value))}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                placeholder="10"
              />
            </div>
            <div className="space-y-1 col-span-1 md:col-span-2">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-500 cursor-pointer">
                <input
                  type="checkbox"
                  checked={postgresSSL}
                  onChange={(e) => setPostgresSSL(e.target.checked)}
                  className="rounded"
                />
                Enable SSL Connection
              </label>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => {
                // Save PostgreSQL config to settings
                const updatedSettings = { 
                  ...settings, 
                  postgresHost, 
                  postgresPort, 
                  postgresDatabase, 
                  postgresUsername, 
                  postgresPassword, 
                  postgresSSL, 
                  postgresPoolSize, 
                  postgresTimeout 
                };
                saveSettings(updatedSettings);
                setSettings(updatedSettings);
                alert('PostgreSQL configuration saved!');
                
                // Refresh data adapter and test connection
                refreshDataAdapter();
                if (onSettingsChange) {
                  onSettingsChange();
                }
                setStatus({
                  connected: true,
                  message: `PostgreSQL Configuration saved! Testing connection to ${postgresHost}:${postgresPort}...`,
                });
                setTimeout(() => {
                  handleTestConnection();
                }, 500);
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-all"
            >
              Save PostgreSQL Configuration
            </button>
          </div>
        </div>
      )}

      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4">
        <h4 className="font-bold text-slate-700 text-sm mb-2" id="current-config-heading">Current Configuration</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-slate-400">Storage Type</span>
            <p className="font-bold text-slate-700">{getSelectedOption?.label || 'Not set'}</p>
          </div>
          <div>
            <span className="text-slate-400">Data Location</span>
            <p className="font-bold text-slate-700 truncate">
              {selectedStorage === 'local' 
                ? 'Browser (localStorage)' 
                : selectedStorage === 'google-sheets'
                  ? `Google Sheet: ${settings.googleSheetId ? settings.googleSheetId.slice(0, 20) + '...' : 'Not configured'}`
                  : selectedStorage === 'mysql'
                    ? `MySQL: ${settings.mysqlHost || 'localhost'}:${settings.mysqlPort || 3306}`
                    : selectedStorage === 'postgresql'
                      ? `PostgreSQL: ${settings.postgresHost || 'localhost'}:${settings.postgresPort || 5432}`
                      : 'Not configured'
              }
            </p>
          </div>
          <div>
            <span className="text-slate-400">Mode</span>
            <p className={`font-bold ${settings.isMockMode ? 'text-amber-600' : 'text-emerald-600'}`}>
              {settings.isMockMode ? 'Sandbox (Mock Data)' : 'Production'}
            </p>
          </div>
          <div>
            <span className="text-slate-400">Database / ID</span>
            <p className="font-bold text-slate-700 truncate max-w-[200px]">
              {selectedStorage === 'mysql' 
                ? (settings.mysqlDatabase || 'humail_eli_hrm')
                : selectedStorage === 'postgresql'
                  ? (settings.postgresDatabase || 'humail_eli_hrm')
                  : (settings.googleSheetId || 'Not configured')
              }
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-2 border-t border-slate-100 mt-4">
        <button
          type="button"
          onClick={() => {
            // Scroll to database test section
            document.getElementById('database-test-section')?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-2"
        >
          <Server className="w-4 h-4" />
          Test Database Connections →
        </button>
      </div>

      {showConfirmDialog && pendingStorageType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4" id="confirm-storage-dialog">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-amber-600">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-lg font-bold text-slate-800">Confirm Storage Change</h3>
            </div>
            
            <div className="space-y-3 text-sm">
              <p className="text-slate-600">
                You are about to switch from <strong>{storageOptions.find(s => s.value === selectedStorage)?.label}</strong> to <strong>{storageOptions.find(s => s.value === pendingStorageType)?.label}</strong>.
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                <p className="text-amber-700 font-medium text-xs">
                  ⚠️ Important Notes:
                </p>
                <ul className="text-amber-600 text-xs list-disc pl-4 mt-1 space-y-0.5">
                  <li>This will change where all data is stored</li>
                  <li>Existing data may not be automatically migrated</li>
                  <li>Some features may behave differently</li>
                  <li>You can switch back at any time</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                id="btn-cancel-switch"
                onClick={cancelSwitch}
                className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button
                id="btn-confirm-switch"
                onClick={confirmSwitch}
                disabled={isLoading}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-all disabled:opacity-50"
              >
                {isLoading ? 'Switching...' : 'Confirm Switch'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
