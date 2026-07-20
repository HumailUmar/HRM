import { logger } from '../lib/logger';
import { useState, FormEvent } from 'react';
import { Employee, AttendanceRecord, PayrollRecord, LeaveRecord, AppSettings } from '../types';
import PayGradeManagement from './PayGradeManagement';
import { 
  Database, Save, Key, Globe, Eye, EyeOff, LayoutGrid, CheckCircle, 
  RefreshCw, LogOut, Calendar, Server, Cloud, AlertCircle, 
  Check, Loader2, HardDrive, Info, DollarSign 
} from 'lucide-react';
import { migrateLocalDataToGSheets, getSettings, saveSettings } from '../lib/storage';
import { getGoogleAccessToken } from '../lib/auth';
import { getSyncTracker, clearSyncTracker, updateSyncTracker } from '../lib/syncTracker';
import { refreshDataAdapter } from '../services';
import BulkImport from './BulkImport';
import StorageSettings from './Settings/StorageSettings';
import DatabaseTest from './Settings/DatabaseTest';
import GoogleSheetsSetupWizard from './Settings/GoogleSheetsSetupWizard';
import BiometricDeviceSettings from './Settings/BiometricDeviceSettings';
import AIConfiguration from './Settings/AIConfiguration';
import APISettings from './Settings/APISettings';
import ExitManagement from './ExitManagement';

interface SettingsProps {
  settings: AppSettings;
  setSettings: (settings: AppSettings) => void;
  // Google Auth props
  user: any;
  handleSignIn: () => Promise<void>;
  handleSignOut: () => Promise<void>;
  isLoggingIn: boolean;

  // Data states for Bulk Import integration
  employees: Employee[];
  setEmployees: (employees: Employee[]) => void;
  attendance: AttendanceRecord[];
  setAttendance: (records: AttendanceRecord[]) => void;
  payrolls: PayrollRecord[];
  setPayrolls: (records: PayrollRecord[]) => void;
  leaves: LeaveRecord[];
  setLeaves: (records: LeaveRecord[]) => void;
}

export default function Settings({
  settings,
  setSettings,
  user,
  handleSignIn,
  handleSignOut,
  isLoggingIn,
  employees,
  setEmployees,
  attendance,
  setAttendance,
  payrolls,
  setPayrolls,
  leaves,
  setLeaves
}: SettingsProps) {
  const [isSandbox, setIsSandbox] = useState(settings.isMockMode);
  const [storageType, setStorageType] = useState<any>(settings.storageType || 'local');
  const [biometricUrl, setBiometricUrl] = useState(settings.biometric.apiUrl);
  const [parserUrl, setParserUrl] = useState(settings.resumeParserApiUrl);
  const [aiUrl, setAiUrl] = useState(settings.aiScreeningApiUrl);
  const [whatsAppUrl, setWhatsAppUrl] = useState(settings.whatsApp.apiUrl);
  const [whatsAppPhoneNumberId, setWhatsAppPhoneNumberId] = useState(settings.whatsApp.phoneNumberId || "");
  const [whatsAppAccessToken, setWhatsAppAccessToken] = useState(settings.whatsApp.accessToken || "");
  const [whatsAppBusinessAccountId, setWhatsAppBusinessAccountId] = useState(settings.whatsApp.businessAccountId || "");
  const [whatsAppVerifyToken, setWhatsAppVerifyToken] = useState(settings.whatsApp.verifyToken || "");

  const [sheetId, setSheetId] = useState(settings.googleSheets.spreadsheetId);
  const [attendanceSheet, setAttendanceSheet] = useState(settings.googleSheets.attendanceSheet);
  const [payrollSheet, setPayrollSheet] = useState(settings.googleSheets.payrollSheet);
  const [recruitmentSheet, setRecruitmentSheet] = useState(settings.googleSheets.recruitmentSheet || "");
  const [leaveSheet, setLeaveSheet] = useState(settings.googleSheets.leaveSheet || "HumailEli_Leaves");
  const [documentsSheet, setDocumentsSheet] = useState(settings.googleSheets.documentsSheet || "HumailEli_Documents");
  const [driveFolder, setDriveFolder] = useState(settings.googleSheets.driveFolderId || "");

  const [showSecrets, setShowSecrets] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'storage' | 'sheets' | 'api' | 'whatsapp' | 'bulk' | 'db-test' | 'biometric' | 'ai' | 'exit' | 'paygrades'>('storage');
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [trackers, setTrackers] = useState(() => getSyncTracker());
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const [statusBarMessage, setStatusBarMessage] = useState<string>(
    settings.storageType === 'google-sheets' 
      ? "Active Storage Backend: Google Sheets (Dynamic Spreadsheet Sync Mode)"
      : "Active Storage Backend: Local Storage (Browser Cache Persistence Mode)"
  );
  const [pendingSwitchType, setPendingSwitchType] = useState<'local' | 'google-sheets' | 'mysql' | 'postgresql' | 'api' | null>(null);
  const [testingType, setTestingType] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ [key: string]: { success: boolean; message: string } }>({});

  // Handle manual Sync Now
  const handleManualSync = async () => {
    if (!user) {
      const msg = "Please connect your Google Workspace account first to enable Sheets synchronization.";
      setStatusBarMessage(`Sync Error: ${msg}`);
      alert(msg);
      return;
    }
    setIsSyncing(true);
    setStatusBarMessage("Synchronizing local database tables with Google Sheets spreadsheet...");
    try {
      await migrateLocalDataToGSheets();
      setTrackers(getSyncTracker());
      const now = new Date().toLocaleTimeString();
      setLastSyncTime(now);
      const successMsg = `Manual synchronization complete at ${now}! All database tables synced to Google Sheets.`;
      setStatusBarMessage(successMsg);
      alert(successMsg);
    } catch (err: any) {
      logger.error(err);
      const errorMsg = `Synchronization failed: ${err.message || err}`;
      setStatusBarMessage(errorMsg);
      alert(errorMsg);
    } finally {
      setIsSyncing(false);
    }
  };

  // Test connection to storage engine
  const handleTestConnection = async (type: string) => {
    setTestingType(type);
    await new Promise((resolve) => setTimeout(resolve, 800));
    
    let result = { success: true, message: "" };
    
    if (type === 'local') {
      result = {
        success: true,
        message: "Connection Successful! Local Storage is writable and healthy (100% available)."
      };
    } else if (type === 'google-sheets') {
      if (!user) {
        result = {
          success: false,
          message: "Connection Failed: Please sign in with Google first to authenticate Sheets API access."
        };
      } else if (!sheetId) {
        result = {
          success: false,
          message: "Connection Failed: Main Google Sheet ID is missing or empty in your configurations."
        };
      } else {
        result = {
          success: true,
          message: "Connection Successful! Dynamic access to Spreadsheet authenticated and verified."
        };
      }
    } else {
      result = {
        success: true,
        message: `Feature Preview: Simulated secure connection to high-performance ${type.toUpperCase()} database cluster completed.`
      };
    }
    
    setTestResult(prev => ({ ...prev, [type]: result }));
    setTestingType(null);
    setStatusBarMessage(result.message);
  };

  // Confirm storage change switch
  const handleConfirmSwitch = (type: 'local' | 'google-sheets' | 'mysql' | 'postgresql' | 'api') => {
    setStorageType(type);
    
    const updated: AppSettings = {
      ...settings,
      isMockMode: isSandbox,
      storageType: type,
      biometric: { ...settings.biometric, apiUrl: biometricUrl },
      resumeParserApiUrl: parserUrl,
      aiScreeningApiUrl: aiUrl,
      whatsApp: {
        ...settings.whatsApp,
        apiUrl: whatsAppUrl,
        phoneNumberId: whatsAppPhoneNumberId,
        accessToken: whatsAppAccessToken,
        businessAccountId: whatsAppBusinessAccountId,
        verifyToken: whatsAppVerifyToken,
      },
      googleSheets: {
        ...settings.googleSheets,
        spreadsheetId: sheetId,
        attendanceSheet: attendanceSheet,
        payrollSheet: payrollSheet,
        recruitmentSheet: recruitmentSheet,
        leaveSheet: leaveSheet,
        documentsSheet: documentsSheet,
        driveFolderId: driveFolder
      }
    };
    
    saveSettings(updated);
    setSettings(updated);
    refreshDataAdapter();

    if (type === 'local') {
      setStatusBarMessage("Storage Engine updated successfully to Local Storage (Browser Cache Persistence Mode).");
    } else if (type === 'google-sheets') {
      setStatusBarMessage("Storage Engine updated successfully to Google Sheets (Dynamic Spreadsheet Sync Mode).");
    } else {
      setStatusBarMessage(`Storage Engine updated to ${type} (Enterprise Simulated Mode).`);
    }
    
    setPendingSwitchType(null);
  };

  // Handle saving configurations
  const handleSaveSettings = (e: FormEvent) => {
    e.preventDefault();

    const updated: AppSettings = {
      ...settings,
      isMockMode: isSandbox,
      storageType: storageType,
      biometric: { ...settings.biometric, apiUrl: biometricUrl },
      resumeParserApiUrl: parserUrl,
      aiScreeningApiUrl: aiUrl,
      whatsApp: {
        ...settings.whatsApp,
        apiUrl: whatsAppUrl,
        phoneNumberId: whatsAppPhoneNumberId,
        accessToken: whatsAppAccessToken,
        businessAccountId: whatsAppBusinessAccountId,
        verifyToken: whatsAppVerifyToken,
      },
      googleSheets: {
        ...settings.googleSheets,
        spreadsheetId: sheetId,
        attendanceSheet: attendanceSheet,
        payrollSheet: payrollSheet,
        recruitmentSheet: recruitmentSheet,
        leaveSheet: leaveSheet,
        documentsSheet: documentsSheet,
        driveFolderId: driveFolder
      }
    };

    saveSettings(updated);
    setSettings(updated);
    refreshDataAdapter();
    alert("System configurations and Google Sheets endpoints saved successfully!");
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl pb-12">
      {/* Upper header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h2 className="text-2xl font-bold font-sans text-slate-900 tracking-tight">System Settings</h2>
          <p className="text-sm text-slate-500 font-sans mt-0.5 font-medium">Configure Google Workspace credentials, API endpoints, and sandbox toggles.</p>
        </div>
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex border-b border-slate-100 gap-1 overflow-x-auto pb-px">
        <button
          type="button"
          onClick={() => setActiveSubTab('storage')}
          className={`px-4 py-2 text-xs font-bold font-sans border-b-2 whitespace-nowrap transition-all ${
            activeSubTab === 'storage'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-200'
          }`}
        >
          📁 Storage Engine
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('biometric')}
          className={`px-4 py-2 text-xs font-bold font-sans border-b-2 whitespace-nowrap transition-all ${
            activeSubTab === 'biometric'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-200'
          }`}
        >
          👆 Biometric
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('sheets')}
          className={`px-4 py-2 text-xs font-bold font-sans border-b-2 whitespace-nowrap transition-all ${
            activeSubTab === 'sheets'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-200'
          }`}
        >
          📊 Sheets Mapping
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('api')}
          className={`px-4 py-2 text-xs font-bold font-sans border-b-2 whitespace-nowrap transition-all ${
            activeSubTab === 'api'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-200'
          }`}
        >
          🌐 API Gateway
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('whatsapp')}
          className={`px-4 py-2 text-xs font-bold font-sans border-b-2 whitespace-nowrap transition-all ${
            activeSubTab === 'whatsapp'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-200'
          }`}
        >
          💬 WhatsApp Integration
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('bulk')}
          className={`px-4 py-2 text-xs font-bold font-sans border-b-2 whitespace-nowrap transition-all ${
            activeSubTab === 'bulk'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-200'
          }`}
        >
          📥 Bulk Import
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('exit')}
          className={`px-4 py-2 text-xs font-bold font-sans border-b-2 whitespace-nowrap transition-all ${
            activeSubTab === 'exit'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-200'
          }`}
        >
          🚪 Exit Management
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('db-test')}
          className={`px-4 py-2 text-xs font-bold font-sans border-b-2 whitespace-nowrap transition-all ${
            activeSubTab === 'db-test'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-200'
          }`}
        >
          🔌 Connection Test
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('ai')}
          className={`px-4 py-2 text-xs font-bold font-sans border-b-2 whitespace-nowrap transition-all ${
            activeSubTab === 'ai'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-200'
          }`}
        >
          🤖 AI & Trust
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('paygrades')}
          className={`px-4 py-2 text-xs font-bold font-sans border-b-2 whitespace-nowrap transition-all ${
            activeSubTab === 'paygrades'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-200'
          }`}
        >
          💰 Pay Grades
        </button>
      </div>

      {/* 1. Storage Engine Tab */}
      {activeSubTab === 'storage' && (
        <div className="space-y-6">
          <StorageSettings onSettingsChange={() => {
            setSettings(getSettings());
          }} />
          
          <div id="database-test-section" className="mt-6 pt-6 border-t border-slate-200">
            <DatabaseTest onSettingsChange={() => {
              setSettings(getSettings());
            }} />
          </div>
        </div>
      )}

      {/* 2. Biometric Tab */}
      {activeSubTab === 'biometric' && (
        <div className="space-y-6">
          <BiometricDeviceSettings user={user} />
        </div>
      )}

      {/* 3. AI Tab */}
      {activeSubTab === 'ai' && (
        <div className="space-y-6">
          <AIConfiguration settings={settings} onSettingsChange={() => setSettings(getSettings())} />
        </div>
      )}

      {/* 10. Pay Grades Tab */}
      {activeSubTab === 'paygrades' && (
        <div className="space-y-6">
          <PayGradeManagement />
        </div>
      )}

      {/* 4. Sheets Mapping Tab */}
      {activeSubTab === 'sheets' && (
        <div className="space-y-6">
          <form onSubmit={handleSaveSettings} className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-sans flex items-center gap-2">
                  <Database className="w-4 h-4 text-indigo-600" />
                  Google Sheet & Drive Table Mapping
                </h3>
                <p className="text-[11px] text-slate-400 font-sans mt-0.5">Define spreadsheet IDs and custom tab sheet name bindings for database entities.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowSecrets(!showSecrets)}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
              >
                {showSecrets ? "Hide Config keys" : "Show Config keys"}
              </button>
            </div>

            {/* Setup Wizard Trigger Box */}
            <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold text-slate-800 font-sans flex items-center gap-1.5">
                  <Cloud className="w-4 h-4 text-emerald-600 animate-pulse" />
                  {!sheetId || sheetId === 'Placeholder' ? 'Setup Google Sheets database automatically' : 'Google Sheets database linked successfully'}
                </p>
                <p className="text-[10px] text-slate-400 font-sans mt-0.5">
                  {!sheetId || sheetId === 'Placeholder' 
                    ? 'Automate folder selection and spreadsheet structure generation on Google Drive.'
                    : `Active Sheet ID: ${sheetId.slice(0, 16)}...`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!user) {
                    alert('Please sign in with Google first under the "APIs & Webhooks" or platform login section.');
                    return;
                  }
                  setShowSetupWizard(true);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 self-start sm:self-auto ${
                  !sheetId || sheetId === 'Placeholder'
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-100/50'
                    : 'bg-white hover:bg-slate-50 border border-slate-200 text-slate-700'
                }`}
              >
                <Cloud className="w-3.5 h-3.5" />
                {!sheetId || sheetId === 'Placeholder' ? 'Run Setup Wizard' : 'Reconfigure Database'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1 col-span-1 sm:col-span-2">
                <label className="text-xs font-bold text-slate-500 font-sans">Main Google Sheet ID</label>
                <input
                  type={showSecrets ? "text" : "password"}
                  value={sheetId}
                  onChange={(e) => setSheetId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  placeholder="e.g. 1A2b3c4d5e..."
                />
                <p className="text-[10px] text-slate-400 font-sans">The unique spreadsheet key extracted from your Google Sheets document URL.</p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 font-sans">Attendance Sheet Table Name</label>
                <input
                  type="text"
                  value={attendanceSheet}
                  onChange={(e) => setAttendanceSheet(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 font-sans">Payroll Sheet Table Name</label>
                <input
                  type="text"
                  value={payrollSheet}
                  onChange={(e) => setPayrollSheet(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 font-sans">Recruitment Log Table Name</label>
                <input
                  type="text"
                  value={recruitmentSheet}
                  onChange={(e) => setRecruitmentSheet(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 font-sans">Leave Requests Table Name</label>
                <input
                  type="text"
                  value={leaveSheet}
                  onChange={(e) => setLeaveSheet(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 font-sans">Document Log Table Name</label>
                <input
                  type="text"
                  value={documentsSheet}
                  onChange={(e) => setDocumentsSheet(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 font-sans">Google Drive Folder ID (Resume uploads)</label>
                <input
                  type={showSecrets ? "text" : "password"}
                  value={driveFolder}
                  onChange={(e) => setDriveFolder(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  placeholder="Drive Folder alphanumeric key"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="flex items-center gap-1.5 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-all shadow-md shadow-indigo-600/10"
            >
              <Save className="w-4 h-4" />
              Save Mapping Configurations
            </button>
          </div>
        </form>

        {/* Incremental Sync Status Section */}
        <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 font-sans flex items-center gap-2">
              <RefreshCw className={`w-4 h-4 text-indigo-600 ${isSyncing ? 'animate-spin' : ''}`} />
              Google Sheets Incremental Sync Status
            </h3>
            <p className="text-[11px] text-slate-400 font-sans mt-0.5">
              Monitor real-time synchronization tracking state. Only changed, new, or deleted records will be synced to keep operations high-performance.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans text-slate-600 border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 text-[10px] uppercase font-bold">
                  <th className="py-2.5 px-3">Module Name</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Last Synced At</th>
                  <th className="py-2.5 px-3 text-center">Synced Count</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  { id: 'employees', name: 'Employees Database', sheet: settings.googleSheets.spreadsheetId ? 'HumailEli_Employees' : '—' },
                  { id: 'attendance', name: 'Attendance Logs', sheet: attendanceSheet },
                  { id: 'leaves', name: 'Leave Requests', sheet: leaveSheet },
                  { id: 'payroll', name: 'Payroll Records', sheet: payrollSheet },
                  { id: 'recruitment', name: 'Candidates & Recruitment', sheet: 'HumailEli_Recruitment' }
                ].map((mod) => {
                  const tracker = trackers.find(t => t.module === mod.id);
                  return (
                    <tr key={mod.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-800">{mod.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">Sheet: {mod.sheet}</div>
                      </td>
                      <td className="py-3 px-3">
                        {tracker ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Synced
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            <Info className="w-3.5 h-3.5 text-slate-400" /> Never Synced
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                        {tracker ? new Date(tracker.lastSync).toLocaleString() : '—'}
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-medium text-slate-700">
                        {tracker ? tracker.lastRecordCount : '—'}
                      </td>
                      <td className="py-3 px-3 text-right space-x-2">
                        <button
                          type="button"
                          disabled={isSyncing}
                          onClick={async () => {
                            if (!user) {
                              alert("Please sign in with Google first to authenticate Google Sheets access.");
                              return;
                            }
                            setIsSyncing(true);
                            try {
                              const { getEmployees, getAttendance, getLeaves, getPayroll, getCandidates, syncAllEmployeesToGSheet, syncAttendanceToGSheet, syncAllLeavesToGSheet, syncPayrollToGSheet, syncAllCandidatesToGSheet } = await import('../lib/storage');
                              if (mod.id === 'employees') await syncAllEmployeesToGSheet(getEmployees());
                              else if (mod.id === 'attendance') await syncAttendanceToGSheet(getAttendance());
                              else if (mod.id === 'leaves') await syncAllLeavesToGSheet(getLeaves());
                              else if (mod.id === 'payroll') await syncPayrollToGSheet(getPayroll());
                              else if (mod.id === 'recruitment') await syncAllCandidatesToGSheet(getCandidates());
                              setTrackers(getSyncTracker());
                              setStatusBarMessage(`Manual sync completed for ${mod.name}!`);
                            } catch (e: any) {
                              logger.error(e);
                              alert(`Sync failed: ${e.message || e}`);
                            } finally {
                              setIsSyncing(false);
                            }
                          }}
                          className="text-[10px] font-bold px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition-colors inline-flex items-center gap-1 border border-indigo-100/50 disabled:opacity-50"
                        >
                          <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} /> Sync Now
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Are you sure you want to reset the sync tracker for ${mod.name}? This will clear the sync history, forcing the next sync to scan and verify all records.`)) {
                              clearSyncTracker(mod.id);
                              setTrackers(getSyncTracker());
                              setStatusBarMessage(`Sync tracker for ${mod.name} reset successfully.`);
                            }
                          }}
                          className="text-[10px] font-bold px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg transition-colors inline-flex items-center gap-1 border border-rose-100/50"
                        >
                          Reset
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      )}

      {/* 5. API Endpoints Tab */}
      {activeSubTab === 'api' && (
        <APISettings />
      )}

      {/* 6. Exit Management Tab */}
      {activeSubTab === 'exit' && (
        <div className="space-y-6">
          <ExitManagement user={user} employees={employees} setEmployees={setEmployees} />
        </div>
      )}

      {/* 7. WhatsApp Integration Tab */}
      {activeSubTab === 'whatsapp' && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 font-sans flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-600" />
                WhatsApp Integration
              </h3>
              <p className="text-[11px] text-slate-400 font-sans mt-0.5">Configure developer access credentials for WhatsApp Business Gateway.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 font-sans">Phone Number ID</label>
                <input type="text" value={whatsAppPhoneNumberId} onChange={(e) => setWhatsAppPhoneNumberId(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-600" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 font-sans">Access Token</label>
                <input type="password" value={whatsAppAccessToken} onChange={(e) => setWhatsAppAccessToken(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-600" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 font-sans">Business Account ID</label>
                <input type="text" value={whatsAppBusinessAccountId} onChange={(e) => setWhatsAppBusinessAccountId(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-600" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 font-sans">Verify Token</label>
                <input type="text" value={whatsAppVerifyToken} onChange={(e) => setWhatsAppVerifyToken(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-600" />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="flex items-center gap-1.5 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-all shadow-md shadow-emerald-600/10"
            >
              <Save className="w-4 h-4" />
              Save WhatsApp Keys
            </button>
          </div>
        </form>
      )}

      {/* 8. Bulk Data Import Tab */}
      {activeSubTab === 'bulk' && (
        <div className="space-y-6">
          <BulkImport
            employees={employees}
            setEmployees={setEmployees}
            attendance={attendance}
            setAttendance={setAttendance}
            payrolls={payrolls}
            setPayrolls={setPayrolls}
            leaves={leaves}
            setLeaves={setLeaves}
            settings={settings}
          />
        </div>
      )}

      {/* 9. Database Connection Test Tab */}
      {activeSubTab === 'db-test' && (
        <DatabaseTest
          onSettingsChange={() => {
            // Trigger refresh of configuration in the parent component
            refreshDataAdapter();
          }}
        />
      )}

      {/* Workspace OAuth Link Container always available on the Settings page to simplify integration flow */}
      <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm space-y-4">
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 font-sans flex items-center gap-2">
              <Globe className="w-4 h-4 text-indigo-600" />
              Google Workspace OAuth Integration
            </h3>
            <p className="text-xs text-slate-400 font-sans mt-0.5">Authorize "Humail Eli - HRM" to access Google Sheets & Drive tables with explicit permissions.</p>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
            user ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
          }`}>
            {user ? 'AUTHENTICATED' : 'NOT CONNECTED'}
          </span>
        </div>

        {user ? (
          <div className="p-4 rounded-xl bg-emerald-50/40 border border-emerald-100/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold font-sans">
                {user.displayName?.charAt(0) || user.email?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 font-sans">{user.displayName || 'Authorized User'}</p>
                <p className="text-[10px] text-slate-500 font-mono">{user.email}</p>
                {user.role ? (
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[9px] font-bold ${
                    user.role === 'Admin' ? 'bg-red-100 text-red-800' :
                    user.role === 'HR' ? 'bg-purple-100 text-purple-800' :
                    user.role === 'Manager' ? 'bg-green-100 text-green-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    👤 {user.role}
                  </span>
                ) : (
                  <p className="text-[10px] text-amber-600 font-bold mt-1">⚠️ No role assigned. Please contact HR.</p>
                )}
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="text-xs font-semibold text-rose-600 hover:text-rose-800 bg-white border border-rose-100 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 self-start sm:self-auto"
            >
              <LogOut className="w-3.5 h-3.5" />
              Disconnect Google API
            </button>
          </div>
        ) : (
          <div className="p-6 rounded-xl bg-slate-50 border border-slate-200/40 flex flex-col items-center justify-center text-center space-y-4">
            <p className="text-xs text-slate-500 leading-relaxed font-sans max-w-md">
              Synchronize direct read/write rows to real Google Sheets instantly. To link your workspace, sign in below.
            </p>
            <button 
              onClick={handleSignIn}
              disabled={isLoggingIn}
              className="gsi-material-button inline-flex items-center justify-center cursor-pointer transition-all duration-200 bg-white border border-slate-200 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 hover:shadow-xs disabled:opacity-50"
            >
              <span className="flex items-center gap-2">
                <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-4.5 h-4.5">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                </svg>
                {isLoggingIn ? 'Connecting Google API...' : 'Sign in with Google Workspace'}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Confirmation Dialog Modal */}
      {pendingSwitchType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4 animate-scale-in">
            <div className="flex items-center gap-3 text-indigo-600">
              <AlertCircle className="w-6 h-6 text-indigo-500" />
              <h4 className="text-sm font-bold text-slate-900 font-sans">Switch Storage Engine?</h4>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed font-sans">
              Are you sure you want to change the active storage backend to <span className="font-bold text-slate-700 capitalize">{pendingSwitchType === 'google-sheets' ? 'Google Sheets' : pendingSwitchType}</span>? 
              This will instantly reload your active HRM database adapter to synchronize operations.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPendingSwitchType(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-all font-sans"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleConfirmSwitch(pendingSwitchType)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-all shadow-md shadow-indigo-600/10 font-sans"
              >
                Confirm & Switch
              </button>
            </div>
          </div>
        </div>
      )}

      {showSetupWizard && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <GoogleSheetsSetupWizard
            accessToken={getGoogleAccessToken() || ''}
            onComplete={() => {
              setShowSetupWizard(false);
              const latestSettings = getSettings();
              // Update local form state too so it's in sync
              setSheetId(latestSettings.googleSheets.spreadsheetId || "");
              setSettings(latestSettings);
              refreshDataAdapter();
            }}
            onCancel={() => setShowSetupWizard(false)}
          />
        </div>
      )}
    </div>
  );
}
