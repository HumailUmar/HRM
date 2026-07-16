import React, { useState, useEffect } from 'react';
import { 
  Fingerprint, Plus, Edit2, Trash2, RefreshCw, 
  CheckCircle, AlertCircle, Clock, Server, 
  Power, PowerOff, Play, X, Loader2,
  ChevronDown, ChevronRight, Save
} from 'lucide-react';
import { 
  BiometricDeviceConfig, 
  BiometricDeviceType, 
  BiometricPunchRecord,
  BiometricSyncLog 
} from '../../types';
import {
  getBiometricDevices,
  saveBiometricDevices,
  getBiometricPunchRecords,
  saveBiometricPunchRecords,
  getBiometricSyncLogs,
  saveBiometricSyncLogs,
  getEmployees,
  getSettings
} from '../../lib/storage';
import { getBiometricAdapter, BiometricDeviceTypeNames } from '../../services/biometric/BiometricAdapterFactory';
import { biometricSyncService } from '../../services/biometric/BiometricSyncService';

interface BiometricDeviceSettingsProps {
  user: any;
}

export default function BiometricDeviceSettings({ user }: BiometricDeviceSettingsProps) {
  const [devices, setDevices] = useState<BiometricDeviceConfig[]>(getBiometricDevices());
  const [punchRecords, setPunchRecords] = useState<BiometricPunchRecord[]>(getBiometricPunchRecords());
  const [syncLogs, setSyncLogs] = useState<BiometricSyncLog[]>(getBiometricSyncLogs());
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<BiometricDeviceConfig | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isPushingEmployees, setIsPushingEmployees] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; deviceId: string } | null>(null);

  useEffect(() => {
    // Automatically purge legacy/simulated mock biometric punch records from real storage
    const allRecords = getBiometricPunchRecords();
    const hasMockRecords = allRecords.some(r => r.mock || r.id.startsWith('PUNCH-') || r.id.startsWith('MOCK-'));
    if (hasMockRecords) {
      const cleanedRecords = allRecords.filter(r => !r.mock && !r.id.startsWith('PUNCH-') && !r.id.startsWith('MOCK-'));
      saveBiometricPunchRecords(cleanedRecords);
      setPunchRecords(cleanedRecords);
      console.log('🧹 Cleaned up legacy/fabricated mock punch records from storage.');
    }
  }, []);

  const handlePushEmployeesToDevice = async () => {
    const activeDevice = devices.find(d => d.isActive);
    if (!activeDevice) {
      alert('No active biometric device configured. Please activate a device first.');
      return;
    }

    const employeesList = getEmployees();
    if (employeesList.length === 0) {
      alert('No employees found to sync.');
      return;
    }

    if (!confirm(`Are you sure you want to push/sync all ${employeesList.length} employees to the active biometric device "${activeDevice.name}"?`)) {
      return;
    }

    setIsPushingEmployees(true);
    try {
      const result = await biometricSyncService.syncEmployeesToDevice(employeesList);
      if (result) {
        alert(`✅ Successfully synced employees to device: ${activeDevice.name}`);
      } else {
        alert(`❌ Sync failed or not supported by this device type.`);
      }
    } catch (error: any) {
      alert(`❌ Sync failed: ${error.message || 'Unknown error'}`);
    } finally {
      setIsPushingEmployees(false);
    }
  };

  const isAuthorized = user?.role === 'Admin' || user?.role === 'HR';

  // Form state
  const [formType, setFormType] = useState<BiometricDeviceType>('mock');
  const [formName, setFormName] = useState('');
  const [formHost, setFormHost] = useState('');
  const [formPort, setFormPort] = useState(80);
  const [formApiKey, setFormApiKey] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formSSL, setFormSSL] = useState(false);
  const [formSyncInterval, setFormSyncInterval] = useState(15);
  const [editingId, setEditingId] = useState<string | null>(null);

  const getDeviceTypeLabel = (type: string) => {
    return BiometricDeviceTypeNames[type] || type;
  };

  const handleSaveDevice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      alert('Device name is required');
      return;
    }

    const newDevice: BiometricDeviceConfig = {
      id: editingId || `DEV-${Date.now()}`,
      type: formType,
      name: formName.trim(),
      host: formHost || 'localhost',
      port: formPort || 80,
      apiKey: formApiKey || undefined,
      username: formUsername || undefined,
      password: formPassword || undefined,
      ssl: formSSL || false,
      timeout: 10000,
      isActive: devices.length === 0, // First device becomes active
      syncInterval: formSyncInterval || 15,
      createdAt: editingId ? (devices.find(d => d.id === editingId)?.createdAt || new Date().toISOString()) : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    let updatedDevices: BiometricDeviceConfig[];
    if (editingId) {
      updatedDevices = devices.map(d => d.id === editingId ? newDevice : d);
    } else {
      updatedDevices = [...devices, newDevice];
    }

    setDevices(updatedDevices);
    saveBiometricDevices(updatedDevices);
    resetForm();
    setShowAddForm(false);
    alert(editingId ? 'Device updated successfully!' : 'Device added successfully!');
  };

  const handleDeleteDevice = (id: string) => {
    if (!confirm('Are you sure you want to delete this device?')) return;
    const updatedDevices = devices.filter(d => d.id !== id);
    setDevices(updatedDevices);
    saveBiometricDevices(updatedDevices);
  };

  const handleSetActive = (id: string) => {
    const updatedDevices = devices.map(d => ({
      ...d,
      isActive: d.id === id
    }));
    setDevices(updatedDevices);
    saveBiometricDevices(updatedDevices);
  };

  const handleTestConnection = async (device: BiometricDeviceConfig) => {
    setIsTesting(true);
    setSelectedDevice(device);
    setTestResult(null);
    try {
      const adapter = getBiometricAdapter(device.type);
      const result = await adapter.testConnection(device);
      setTestResult({
        success: result.success,
        message: result.message + (result.deviceInfo ? ` (${result.deviceInfo.model})` : ''),
        deviceId: device.id
      });
    } catch (error: any) {
      setTestResult({
        success: false,
        message: `Connection failed: ${error.message || 'Unknown error'}`,
        deviceId: device.id
      });
    } finally {
      setIsTesting(false);
      setSelectedDevice(null);
    }
  };

  const handleSyncDevice = async (device: BiometricDeviceConfig) => {
    setIsSyncing(true);
    const log: BiometricSyncLog = {
      id: `SYNC-${Date.now()}`,
      deviceId: device.id,
      status: 'success',
      recordsSynced: 0,
      errors: [],
      startTime: new Date().toISOString()
    };

    try {
      const settings = getSettings();
      if (device.type === 'mock' && !settings.isMockMode) {
        throw new Error('Mock Mode must be enabled in Settings to use a Mock biometric device.');
      }

      const adapter = getBiometricAdapter(device.type);
      await adapter.connect(device);
      const result = await adapter.syncAttendance();
      
      // Save punch records to storage
      const existingRecords = getBiometricPunchRecords();
      
      // Filter out mock records from saving to the persistent store
      const realRecords = result.records.filter(r => !r.mock);
      const existingRealRecords = existingRecords.filter(r => !r.mock);

      const newRecords = realRecords.filter(r => 
        !existingRealRecords.some(e => e.id === r.id)
      );
      
      const updatedRecords = [...existingRealRecords, ...newRecords];
      setPunchRecords(updatedRecords);
      saveBiometricPunchRecords(updatedRecords);
      
      log.recordsSynced = newRecords.length;
      log.status = 'success';
      log.endTime = new Date().toISOString();
      log.durationMs = new Date().getTime() - new Date(log.startTime).getTime();
      
      const updatedLogs = [log, ...syncLogs];
      setSyncLogs(updatedLogs);
      saveBiometricSyncLogs(updatedLogs);
      
      // Update device last sync
      const updatedDevices = devices.map(d => 
        d.id === device.id ? { ...d, lastSync: new Date().toISOString() } : d
      );
      setDevices(updatedDevices);
      saveBiometricDevices(updatedDevices);
      
      if (result.isMock) {
        alert('Sync completed! Mock records are simulated but not saved to persistent storage to prevent data pollution.');
      } else {
        alert(`Sync completed! ${newRecords.length} new punch records synced.`);
      }
    } catch (error: any) {
      log.status = 'failed';
      log.errors = [error.message || 'Unknown error'];
      log.endTime = new Date().toISOString();
      
      const updatedLogs = [log, ...syncLogs];
      setSyncLogs(updatedLogs);
      saveBiometricSyncLogs(updatedLogs);
      
      alert(`Sync failed: ${error.message || 'Unknown error'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const resetForm = () => {
    setFormType('mock');
    setFormName('');
    setFormHost('');
    setFormPort(80);
    setFormApiKey('');
    setFormUsername('');
    setFormPassword('');
    setFormSSL(false);
    setFormSyncInterval(15);
    setEditingId(null);
  };

  const editDevice = (device: BiometricDeviceConfig) => {
    setFormType(device.type);
    setFormName(device.name);
    setFormHost(device.host);
    setFormPort(device.port);
    setFormApiKey(device.apiKey || '');
    setFormUsername(device.username || '');
    setFormPassword(device.password || '');
    setFormSSL(device.ssl || false);
    setFormSyncInterval(device.syncInterval || 15);
    setEditingId(device.id);
    setShowAddForm(true);
  };

  const getStatusIcon = (device: BiometricDeviceConfig) => {
    if (device.isActive) {
      return <Power className="w-4 h-4 text-emerald-600" />;
    }
    return <PowerOff className="w-4 h-4 text-slate-400" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 font-sans flex items-center gap-2">
              <Fingerprint className="w-4 h-4 text-indigo-600" />
              Biometric Device Integration
            </h3>
            <p className="text-[11px] text-slate-400 font-sans mt-0.5">
              Connect and configure punch machines (ZKTeco, BioStar, Hikvision) for automatic attendance tracking.
            </p>
          </div>
          {isAuthorized && (
            <div className="flex items-center gap-2">
              <button
                onClick={handlePushEmployeesToDevice}
                disabled={isPushingEmployees}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-100/50"
              >
                {isPushingEmployees ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                {isPushingEmployees ? 'Syncing...' : 'Sync Employees to Device'}
              </button>
              <button
                onClick={() => {
                  resetForm();
                  setShowAddForm(!showAddForm);
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-100/50"
              >
                <Plus className="w-4 h-4" />
                Add Device
              </button>
            </div>
          )}
        </div>
      </div>

      {!isAuthorized && (
        <div className="bg-amber-50 border border-amber-200/60 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-amber-800">Viewer Mode (Read-Only)</p>
            <p className="text-[11px] text-amber-600 mt-0.5 font-sans">
              Only Administrators and HR personnel can add, edit, test, delete, or synchronize biometric devices.
            </p>
          </div>
        </div>
      )}

      {/* Add/Edit Form */}
      {showAddForm && (
        <form onSubmit={handleSaveDevice} className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="text-sm font-bold text-slate-800">
              {editingId ? 'Edit Device' : 'Add New Device'}
            </h4>
            <button
              type="button"
              onClick={() => {
                resetForm();
                setShowAddForm(false);
              }}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Device Name *</label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g., Office Main Door"
                className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Device Type *</label>
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value as BiometricDeviceType)}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                required
              >
                <option value="mock">Mock (Demo Mode)</option>
                <option value="zkteco">ZKTeco</option>
                <option value="biostar">BioStar</option>
                <option value="hikvision">Hikvision</option>
                <option value="generic">Generic HTTP API</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Host / IP Address</label>
              <input
                type="text"
                value={formHost}
                onChange={(e) => setFormHost(e.target.value)}
                placeholder="192.168.1.100"
                className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Port</label>
              <input
                type="number"
                value={formPort}
                onChange={(e) => setFormPort(Number(e.target.value))}
                placeholder="80"
                className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">API Key / Token</label>
              <input
                type="password"
                value={formApiKey}
                onChange={(e) => setFormApiKey(e.target.value)}
                placeholder="Optional"
                className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Sync Interval (minutes)</label>
              <input
                type="number"
                value={formSyncInterval}
                onChange={(e) => setFormSyncInterval(Number(e.target.value))}
                placeholder="15"
                className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Username</label>
              <input
                type="text"
                value={formUsername}
                onChange={(e) => setFormUsername(e.target.value)}
                placeholder="Optional"
                className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Password</label>
              <input
                type="password"
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
                placeholder="Optional"
                className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div className="col-span-1 md:col-span-2">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-500 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formSSL}
                  onChange={(e) => setFormSSL(e.target.checked)}
                  className="rounded"
                />
                Enable SSL Connection
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                resetForm();
                setShowAddForm(false);
              }}
              className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-medium hover:bg-slate-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {editingId ? 'Update Device' : 'Add Device'}
            </button>
          </div>
        </form>
      )}

      {/* Devices List */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <h4 className="font-bold text-slate-800 text-sm">Configured Devices</h4>
          <span className="text-xs text-slate-400">{devices.length} device(s)</span>
        </div>

        {devices.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <Fingerprint className="w-12 h-12 mx-auto text-slate-200 mb-3" />
            <p className="text-sm font-medium">No biometric devices configured</p>
            <p className="text-xs mt-1">Click "Add Device" to get started</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {devices.map((device) => (
              <div key={device.id} className="p-4 hover:bg-slate-50/40 transition-colors">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`p-2 rounded-xl ${
                      device.isActive ? 'bg-emerald-100' : 'bg-slate-100'
                    }`}>
                      {getStatusIcon(device)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-slate-800 text-sm">{device.name}</p>
                        <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[9px] rounded font-bold">
                          {getDeviceTypeLabel(device.type)}
                        </span>
                        {device.isActive && (
                          <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-[9px] rounded font-bold">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 font-mono">{device.host}:{device.port}</p>
                      {device.lastSync && (
                        <p className="text-[10px] text-slate-400">Last sync: {new Date(device.lastSync).toLocaleString()}</p>
                      )}
                    </div>
                  </div>

                  {isAuthorized && (
                    <div className="flex flex-wrap items-center gap-2">
                      {!device.isActive && (
                        <button
                          onClick={() => handleSetActive(device.id)}
                          className="px-3 py-1.5 text-[10px] font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition-all border border-indigo-100/50"
                        >
                          Set Active
                        </button>
                      )}
                      <button
                        onClick={() => handleTestConnection(device)}
                        disabled={isTesting}
                        className="px-3 py-1.5 text-[10px] font-bold bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg transition-all border border-slate-200 flex items-center gap-1"
                      >
                        {isTesting ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Play className="w-3 h-3" />
                        )}
                        Test
                      </button>
                      <button
                        onClick={() => handleSyncDevice(device)}
                        disabled={isSyncing}
                        className="px-3 py-1.5 text-[10px] font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-all border border-emerald-100/50 flex items-center gap-1"
                      >
                        {isSyncing ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <RefreshCw className="w-3 h-3" />
                        )}
                        Sync
                      </button>
                      <button
                        onClick={() => editDevice(device)}
                        className="px-3 py-1.5 text-[10px] font-bold bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg transition-all border border-slate-200"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDeleteDevice(device.id)}
                        className="px-3 py-1.5 text-[10px] font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg transition-all border border-rose-100/50"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Test Result */}
                {testResult && device.id === testResult.deviceId && (
                  <div className={`mt-2 p-2 rounded-lg text-xs flex justify-between items-center ${
                    testResult.success ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                  }`}>
                    <span>{testResult.message}</span>
                    <button
                      type="button"
                      onClick={() => setTestResult(null)}
                      className="text-slate-400 hover:text-slate-600 transition-colors ml-2"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Punch Records Table */}
      {punchRecords.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
            <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600" />
              Recent Punch Records
            </h4>
            <span className="text-xs text-slate-400">{punchRecords.length} records</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-slate-400">
                <tr>
                  <th className="px-4 py-2 text-left">Employee</th>
                  <th className="px-4 py-2 text-left">Time</th>
                  <th className="px-4 py-2 text-left">Type</th>
                  <th className="px-4 py-2 text-left">Device</th>
                  <th className="px-4 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {punchRecords.slice(0, 10).map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2 font-medium text-slate-700">{record.employeeName || record.employeeId}</td>
                    <td className="px-4 py-2 text-slate-500">{new Date(record.punchTime).toLocaleString()}</td>
                    <td className="px-4 py-2">
                      <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                        record.punchType === 'check-in' ? 'bg-emerald-100 text-emerald-700' :
                        record.punchType === 'check-out' ? 'bg-amber-100 text-amber-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {record.punchType}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-slate-500">{record.deviceName || record.deviceId}</td>
                    <td className="px-4 py-2">
                      {record.verified ? (
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sync Logs */}
      {syncLogs.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-indigo-600" />
              Sync Logs
            </h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-slate-400">
                <tr>
                  <th className="px-4 py-2 text-left">Time</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Records</th>
                  <th className="px-4 py-2 text-left">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {syncLogs.slice(0, 10).map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2 text-slate-500">{new Date(log.startTime).toLocaleString()}</td>
                    <td className="px-4 py-2">
                      <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                        log.status === 'success' ? 'bg-emerald-100 text-emerald-700' :
                        log.status === 'partial' ? 'bg-amber-100 text-amber-700' :
                        'bg-rose-100 text-rose-700'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-slate-600">{log.recordsSynced}</td>
                    <td className="px-4 py-2 text-slate-500">{log.durationMs ? `${log.durationMs}ms` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
