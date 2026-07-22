import React, { useState, useEffect } from 'react';
import { AttendanceRecord, Employee, AppSettings, Department, Designation, BiometricDeviceConfig } from '../types';
import { useData } from '../contexts/DataContext';
import { getAuthHeaders } from '../lib/auth';
import { getEmployeeDesignation, getEmployeeDepartment } from '../lib/employeeUtils';
import { safeLower } from '../utils/safeText';
import { 
  Clock, Calendar, CheckCircle, AlertCircle, User, 
  RefreshCw, Filter, Search, Download, Upload,
  Zap, Wifi, WifiOff, Loader2, Shield, ShieldAlert,
  AlertTriangle, Check, X, Plus, XCircle
} from 'lucide-react';

interface AttendanceProps {
  attendance?: AttendanceRecord[];
  setAttendance?: (attendance: AttendanceRecord[]) => void;
  employees?: Employee[];
  settings: AppSettings;
  user?: any;
  departments: Department[];
  designations: Designation[];
}

export default function Attendance({ 
  attendance: propsAttendance, setAttendance: propsSetAttendance, employees: propsEmployees, settings, user, departments, designations 
}: AttendanceProps) {
  const dataService = useData();
  const [loading, setLoading] = useState(false);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(propsAttendance || []);
  const [employees, setEmployees] = useState<Employee[]>(propsEmployees || []);
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ message: string; type: 'info' | 'success' | 'error' | 'warning' } | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().slice(0, 7));
  const [searchTerm, setSearchTerm] = useState('');

  // Get active biometric device
  const [activeDevice, setActiveDevice] = useState<BiometricDeviceConfig | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
        const fetchedAttendance = propsAttendance || await dataService.getAttendance();
        const fetchedEmployees = propsEmployees || await dataService.getEmployees();
        setAttendance(fetchedAttendance);
        setEmployees(fetchedEmployees);
    };
    fetchData();
  }, [propsAttendance, propsEmployees, dataService]);

  useEffect(() => {
    const devices = dataService.getBiometricDevices();
    const active = devices.find(d => d.isActive) || null;
    setActiveDevice(active);
    
    // If no device is configured, check if we're in demo mode
    const isDemo = settings.isMockMode || false;
    setIsDemoMode(isDemo);
  }, [settings.isMockMode, dataService]);

  // Filter attendance records
  const filteredAttendance = attendance.filter(record => {
    const matchesEmployee = !selectedEmployee || record.employeeId === selectedEmployee;
    const matchesDate = !dateFilter || record.date.startsWith(dateFilter);
    const matchesSearch = !searchTerm || 
      safeLower(record.employeeName).includes(safeLower(searchTerm));
    return matchesEmployee && matchesDate && matchesSearch;
  });

  // ============================================================
  //  REAL BIOMETRIC SYNC – Calls the actual device API
  //  NO RANDOM DATA GENERATION
  // ============================================================
  const handleBiometricSync = async () => {
    // Clear previous status
    setSyncStatus(null);

    // Check if we have an active device
    if (!activeDevice) {
      setSyncStatus({
        message: 'No active biometric device configured. Please go to Settings → Biometric to set one up, or enable Demo Mode for testing.',
        type: 'error'
      });
      return;
    }

    // If in demo mode, show a warning but allow sync
    if (isDemoMode) {
      setSyncStatus({
        message: `⚠️ Demo Mode is enabled. The system will simulate device responses. To use real device data, disable Demo Mode in Settings.`,
        type: 'warning'
      });
    }

    setSyncing(true);
    setSyncStatus({ message: `Connecting to ${activeDevice.name} (${activeDevice.host}:${activeDevice.port})...`, type: 'info' });

    try {
      // Determine the correct backend endpoint based on device type
      let endpoint = '';
      const baseConfig = {
        host: activeDevice.host,
        port: activeDevice.port,
        username: activeDevice.username || '',
        password: activeDevice.password || '',
        apiKey: activeDevice.apiKey || '',
      };

      // Date range: last 7 days (or custom range if you add date pickers)
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      const params = {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      };

      switch (activeDevice.type) {
        case 'zkteco':
          endpoint = '/api/zkteco/punches';
          break;
        case 'biostar':
          endpoint = '/api/biostar/punches';
          break;
        case 'hikvision':
          endpoint = '/api/hikvision/punches';
          break;
        case 'generic':
          endpoint = '/api/generic/punches';
          break;
        case 'mock':
          endpoint = '/api/biometric/sync';
          break;
        default:
          throw new Error(`Unsupported device type: ${activeDevice.type}`);
      }

      setSyncStatus({ message: `Fetching punches from ${activeDevice.name}...`, type: 'info' });

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: getAuthHeaders('json'),
        body: JSON.stringify({ ...baseConfig, ...params, deviceType: activeDevice.type, config: activeDevice, isMockMode: isDemoMode }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Device returned HTTP ${response.status}`);
      }

      const data = await response.json();
      const punches = data.records || [];

      if (punches.length === 0) {
        setSyncStatus({
          message: `No new punch records found in the last 7 days from ${activeDevice.name}.`,
          type: 'info'
        });
        setSyncing(false);
        return;
      }

      setSyncStatus({ message: `Processing ${punches.length} punch records...`, type: 'info' });

      // ============================================================
      //  GROUP PUNCHES BY EMPLOYEE + DATE
      //  This creates a single attendance record per employee per day
      // ============================================================
      const grouped: Record<string, { 
        checkIn?: string; 
        checkOut?: string; 
        employeeId: string; 
        employeeName: string;
        punches: any[];
      }> = {};

      for (const punch of punches) {
        // Find employee by punchCode, employeeId, or name
        const employee = employees.find(e => 
          e.punchCode === punch.employeeId || 
          e.id === punch.employeeId ||
          e.name === punch.employeeName ||
          e.email === punch.employeeEmail
        );

        if (!employee) {
          console.warn(`Employee not found for punch: ${punch.employeeId} (${punch.employeeName})`);
          continue;
        }

        const date = new Date(punch.punchTime).toISOString().split('T')[0];
        const key = `${employee.id}_${date}`;
        
        if (!grouped[key]) {
          grouped[key] = {
            employeeId: employee.id,
            employeeName: employee.name,
            punches: [],
          };
        }
        grouped[key].punches.push(punch);
      }

      // Now determine check-in and check-out times
      const newRecords: AttendanceRecord[] = [];

      for (const [key, group] of Object.entries(grouped)) {
        const [employeeId, date] = key.split('_');
        
        // Sort punches by time
        const sortedPunches = group.punches.sort((a, b) => 
          new Date(a.punchTime).getTime() - new Date(b.punchTime).getTime()
        );

        // Find check-in (first punch of the day)
        const checkInPunch = sortedPunches.find(p => 
          p.punchType === 'check-in' || p.punchType === 'in' || p.punchType === '1'
        );
        // Find check-out (last punch of the day that is check-out type)
        const checkOutPunch = [...sortedPunches].reverse().find(p => 
          p.punchType === 'check-out' || p.punchType === 'out' || p.punchType === '0'
        ) || sortedPunches[sortedPunches.length - 1];

        // If we only have one punch, use it for both if it's check-in, or just check-in if check-out
        let checkIn = checkInPunch ? new Date(checkInPunch.punchTime).toTimeString().slice(0, 5) : '';
        let checkOut = '';
        
        if (checkOutPunch && checkOutPunch !== checkInPunch) {
          checkOut = new Date(checkOutPunch.punchTime).toTimeString().slice(0, 5);
        } else if (checkOutPunch && checkOutPunch === checkInPunch && checkOutPunch.punchType === 'check-out') {
          // If only a check-out exists, use it as check-in (but this is rare)
          checkIn = new Date(checkOutPunch.punchTime).toTimeString().slice(0, 5);
          checkOut = '';
        }

        // Calculate late minutes (if checkIn is after 9:00 AM)
        let lateMinutes = 0;
        if (checkIn) {
          const [hours, minutes] = checkIn.split(':').map(Number);
          const totalMinutes = hours * 60 + minutes;
          const lateThreshold = settings.attendanceRules?.lateThreshold || '09:05';
          const [lateHours, lateMins] = lateThreshold.split(':').map(Number);
          const threshold = lateHours * 60 + lateMins;
          if (totalMinutes > threshold) {
            lateMinutes = totalMinutes - threshold;
          }
        }

        // Calculate early departure (if checkOut is before 5:30 PM)
        let earlyDepartureMinutes = 0;
        if (checkOut) {
          const [hours, minutes] = checkOut.split(':').map(Number);
          const totalMinutes = hours * 60 + minutes;
          const departureThreshold = settings.attendanceRules?.earlyDepartureThreshold || '17:30';
          const [depHours, depMins] = departureThreshold.split(':').map(Number);
          const threshold = depHours * 60 + depMins;
          if (totalMinutes < threshold) {
            earlyDepartureMinutes = threshold - totalMinutes;
          }
        }

        // Determine status
        let status: 'Full Day' | 'Half Day' | 'Absent' = 'Absent';
        if (checkIn && checkOut) {
          const [inH, inM] = checkIn.split(':').map(Number);
          const [outH, outM] = checkOut.split(':').map(Number);
          const diffMinutes = (outH * 60 + outM) - (inH * 60 + inM);
          if (diffMinutes >= 4 * 60) {
            status = 'Full Day';
          } else if (diffMinutes >= 2 * 60) {
            status = 'Half Day';
          } else {
            status = 'Half Day';
          }
        } else if (checkIn) {
          status = 'Half Day';
        }

        // Check if this record already exists (by date + employee)
        const existing = attendance.find(r => r.employeeId === employeeId && r.date === date);
        
        if (existing) {
          // Update existing record with any missing info
          const updated = { ...existing };
          if (checkIn && !updated.checkIn) updated.checkIn = checkIn;
          if (checkOut && !updated.checkOut) updated.checkOut = checkOut;
          if (lateMinutes > updated.lateMinutes) updated.lateMinutes = lateMinutes;
          if (earlyDepartureMinutes > updated.earlyDepartureMinutes) updated.earlyDepartureMinutes = earlyDepartureMinutes;
          if (status !== updated.status) updated.status = status;
          updated.updatedAt = new Date().toISOString();
          
          // Replace in array
          const index = attendance.findIndex(r => r.id === existing.id);
          if (index !== -1) {
            attendance[index] = updated;
          }
          continue;
        }

        // Create new record
        const newRecord: AttendanceRecord = {
          id: `ATT-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          employeeId: group.employeeId,
          employeeName: group.employeeName,
          date: date,
          checkIn: checkIn,
          checkOut: checkOut,
          lateMinutes: lateMinutes,
          earlyDepartureMinutes: earlyDepartureMinutes,
          status: status,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        newRecords.push(newRecord);
      }

      // Add new records to attendance
      const previousAttendance = attendance;
      const updatedAttendance = [...attendance, ...newRecords];
      setAttendance(updatedAttendance);
      try {
        await dataService.saveAttendance(updatedAttendance);
        if (propsSetAttendance) propsSetAttendance(updatedAttendance);
      } catch (saveError) {
        setAttendance(previousAttendance);
        if (propsSetAttendance) propsSetAttendance(previousAttendance);
        throw saveError;
      }

      setSyncStatus({
        message: `✅ Successfully synced ${newRecords.length} new attendance records from ${activeDevice.name}. ${punches.length} total punches processed.`,
        type: 'success'
      });

    } catch (error: any) {
      console.error('Biometric sync error:', error);
      setSyncStatus({
        message: `❌ Sync failed: ${error.message}. Please check the device configuration and network connectivity.`,
        type: 'error'
      });
    } finally {
      setSyncing(false);
    }
  };

  // ============================================================
  //  MANUAL ATTENDANCE ADD (Backup)
  // ============================================================
  const handleManualAdd = () => {
    // Open a modal or prompt for manual attendance entry
    // This is a fallback when biometric sync is not available
    alert('Manual attendance entry is available. Please use the "Add Attendance" button in the Employee Portal.');
  };

  // ============================================================
  //  EXPORT ATTENDANCE (CSV)
  // ============================================================
  const handleExportCSV = () => {
    const headers = ['Employee', 'Date', 'Check In', 'Check Out', 'Late (min)', 'Early Departure (min)', 'Status'];
    const rows = filteredAttendance.map(r => [
      r.employeeName,
      r.date,
      r.checkIn || '',
      r.checkOut || '',
      r.lateMinutes || 0,
      r.earlyDepartureMinutes || 0,
      r.status
    ]);
    
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_${new Date().toISOString().slice(0, 7)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-800">Attendance Management</h2>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Biometric Sync Button */}
          <button
            onClick={handleBiometricSync}
            disabled={syncing}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-white transition-colors ${
              syncing ? 'bg-slate-400 cursor-not-allowed' : 
              !activeDevice && !isDemoMode ? 'bg-slate-400 cursor-not-allowed' : 
              'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            {syncing ? 'Syncing...' : 'Sync Biometric'}
          </button>

          {/* Export Button */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-xl font-medium text-slate-700 hover:bg-slate-50"
          >
            <Download className="w-4 h-4" /> Export
          </button>

          {/* Manual Add Button */}
          <button
            onClick={handleManualAdd}
            className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-emerald-700"
          >
            <Plus className="w-4 h-4" /> Add Manual
          </button>
        </div>
      </div>

      {/* Device Status */}
      <div className={`flex items-center gap-3 p-3 rounded-xl border ${
        activeDevice ? 'bg-emerald-50 border-emerald-200' : 
        isDemoMode ? 'bg-amber-50 border-amber-200' : 
        'bg-rose-50 border-rose-200'
      }`}>
        {activeDevice ? (
          <>
            <Wifi className="w-5 h-5 text-emerald-600" />
            <span className="text-sm text-emerald-700">
              Connected to <strong>{activeDevice.name}</strong> ({activeDevice.host}:{activeDevice.port})
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              activeDevice.isActive ? 'bg-emerald-200 text-emerald-700' : 'bg-amber-200 text-amber-700'
            }`}>
              {activeDevice.isActive ? 'Active' : 'Inactive'}
            </span>
          </>
        ) : isDemoMode ? (
          <>
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <span className="text-sm text-amber-700">
              <strong>Demo Mode:</strong> Biometric sync uses simulated data. Configure a device in Settings for production.
            </span>
          </>
        ) : (
          <>
            <ShieldAlert className="w-5 h-5 text-rose-600" />
            <span className="text-sm text-rose-700">
              <strong>No biometric device configured.</strong> Go to Settings → Biometric to set up a device.
            </span>
          </>
        )}
      </div>

      {/* Sync Status */}
      {syncStatus && (
        <div className={`p-3 rounded-xl text-sm flex items-start gap-2 border ${
          syncStatus.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
          syncStatus.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-700' :
          syncStatus.type === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-700' :
          'bg-slate-50 border-slate-200 text-slate-700'
        }`}>
          {syncStatus.type === 'success' && <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />}
          {syncStatus.type === 'error' && <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />}
          {syncStatus.type === 'warning' && <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />}
          {syncStatus.type === 'info' && <Clock className="w-5 h-5 flex-shrink-0 mt-0.5" />}
          <span>{syncStatus.message}</span>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[150px]">
          <label className="block text-xs text-slate-500 font-medium">Employee</label>
          <select
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
            className="w-full border rounded-lg p-2 text-sm mt-1"
          >
            <option value="">All Employees</option>
            {employees.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.name}</option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-[150px]">
          <label className="block text-xs text-slate-500 font-medium">Month</label>
          <input
            type="month"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full border rounded-lg p-2 text-sm mt-1"
          />
        </div>
        <div className="flex-1 min-w-[150px]">
          <label className="block text-xs text-slate-500 font-medium">Search</label>
          <input
            type="text"
            placeholder="Search by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border rounded-lg p-2 text-sm mt-1"
          />
        </div>
        <div className="flex items-end">
          <button
            onClick={() => {
              setSelectedEmployee('');
              setDateFilter(new Date().toISOString().slice(0, 7));
              setSearchTerm('');
            }}
            className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 text-sm"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Employee</th>
                <th className="px-4 py-3 text-left font-semibold">Date</th>
                <th className="px-4 py-3 text-left font-semibold">Check In</th>
                <th className="px-4 py-3 text-left font-semibold">Check Out</th>
                <th className="px-4 py-3 text-left font-semibold">Late (min)</th>
                <th className="px-4 py-3 text-left font-semibold">Early Departure (min)</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAttendance.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    <Clock className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    No attendance records found.
                    {!activeDevice && !isDemoMode && (
                      <p className="text-xs mt-2 text-slate-400">
                        Configure a biometric device in Settings to sync attendance data.
                      </p>
                    )}
                  </td>
                </tr>
              ) : (
                filteredAttendance.map(record => (
                  <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-800">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">
                          {record.employeeName.charAt(0)}
                        </div>
                        {record.employeeName}
                      </div>
                    </td>
                    <td className="px-4 py-3">{record.date}</td>
                    <td className="px-4 py-3 font-mono">{record.checkIn || '—'}</td>
                    <td className="px-4 py-3 font-mono">{record.checkOut || '—'}</td>
                    <td className="px-4 py-3">
                      {record.lateMinutes > 0 ? (
                        <span className="text-amber-600 font-medium">{record.lateMinutes}m</span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {record.earlyDepartureMinutes > 0 ? (
                        <span className="text-amber-600 font-medium">{record.earlyDepartureMinutes}m</span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        record.status === 'Full Day' ? 'bg-emerald-100 text-emerald-700' :
                        record.status === 'Half Day' ? 'bg-amber-100 text-amber-700' :
                        'bg-rose-100 text-rose-700'
                      }`}>
                        {record.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-sm text-slate-500">Total Records</p>
          <p className="text-2xl font-bold text-slate-800">{filteredAttendance.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-sm text-slate-500">Full Day</p>
          <p className="text-2xl font-bold text-emerald-600">
            {filteredAttendance.filter(r => r.status === 'Full Day').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-sm text-slate-500">Half Day</p>
          <p className="text-2xl font-bold text-amber-600">
            {filteredAttendance.filter(r => r.status === 'Half Day').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-sm text-slate-500">Absent</p>
          <p className="text-2xl font-bold text-rose-600">
            {filteredAttendance.filter(r => r.status === 'Absent').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-sm text-slate-500">Late Arrivals</p>
          <p className="text-2xl font-bold text-indigo-600">
            {filteredAttendance.filter(r => r.lateMinutes > 0).length}
          </p>
        </div>
      </div>
    </div>
  );
}
