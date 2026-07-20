import React, { useState, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import { refreshDataAdapter } from '../../services';
import { Database, CheckCircle, AlertCircle, RefreshCw, Server } from 'lucide-react';
import { AppSettings } from '../../types';

interface DatabaseTestProps {
  onSettingsChange?: () => void;
}

type TestStatus = 'idle' | 'testing' | 'success' | 'error';

interface DatabaseTestResult {
  status: TestStatus;
  message: string;
  dataCounts?: {
    employees: number;
    attendance: number;
    leaves: number;
    payroll: number;
    candidates: number;
  };
  duration?: number;
}

export default function DatabaseTest({ onSettingsChange }: DatabaseTestProps) {
  const data = useData();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [mysqlResult, setMysqlResult] = useState<DatabaseTestResult>({
    status: 'idle',
    message: 'Click "Test MySQL" to check connection',
  });
  const [postgresResult, setPostgresResult] = useState<DatabaseTestResult>({
    status: 'idle',
    message: 'Click "Test PostgreSQL" to check connection',
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    data.getSettings().then(s => {
      if (!cancelled) setSettings(s);
    });
    return () => { cancelled = true; };
  }, [data]);

  const testMySQLConnection = async () => {
    setMysqlResult({ status: 'testing', message: 'Testing MySQL connection...' });
    setIsLoading(true);
    const startTime = performance.now();

    try {
      // Switch to MySQL and test
      const updatedSettings = { ...settings, storageType: 'mysql' as const };
      await data.saveSettings(updatedSettings);
      
      const adapter = refreshDataAdapter();
      
      // Try to fetch employees
      const employees = await adapter.getEmployees();
      const attendance = await adapter.getAttendance();
      const leaves = await adapter.getLeaves();
      const payroll = await adapter.getPayroll();
      const candidates = await adapter.getCandidates();

      const duration = Math.round(performance.now() - startTime);

      setMysqlResult({
        status: 'success',
        message: `✅ MySQL connection successful! All data loaded in ${duration}ms`,
        dataCounts: {
          employees: employees.length,
          attendance: attendance.length,
          leaves: leaves.length,
          payroll: payroll.length,
          candidates: candidates.length,
        },
        duration,
      });
    } catch (error: any) {
      setMysqlResult({
        status: 'error',
        message: `❌ MySQL connection failed: ${error.message || 'Unknown error'}`,
      });
    } finally {
      // Restore original storage type
      if (settings) await data.saveSettings(settings);
      refreshDataAdapter();
      setIsLoading(false);
    }
  };

  const testPostgreSQLConnection = async () => {
    setPostgresResult({ status: 'testing', message: 'Testing PostgreSQL connection...' });
    setIsLoading(true);
    const startTime = performance.now();

    try {
      // Switch to PostgreSQL and test
      const updatedSettings = { ...settings, storageType: 'postgresql' as const };
      await data.saveSettings(updatedSettings);
      
      const adapter = refreshDataAdapter();
      
      const employees = await adapter.getEmployees();
      const attendance = await adapter.getAttendance();
      const leaves = await adapter.getLeaves();
      const payroll = await adapter.getPayroll();
      const candidates = await adapter.getCandidates();

      const duration = Math.round(performance.now() - startTime);

      setPostgresResult({
        status: 'success',
        message: `✅ PostgreSQL connection successful! All data loaded in ${duration}ms`,
        dataCounts: {
          employees: employees.length,
          attendance: attendance.length,
          leaves: leaves.length,
          payroll: payroll.length,
          candidates: candidates.length,
        },
        duration,
      });
    } catch (error: any) {
      setPostgresResult({
        status: 'error',
        message: `❌ PostgreSQL connection failed: ${error.message || 'Unknown error'}`,
      });
    } finally {
      // Restore original storage type
      if (settings) await data.saveSettings(settings);
      refreshDataAdapter();
      setIsLoading(false);
    }
  };

  const testAll = async () => {
    await testMySQLConnection();
    // Small delay before testing PostgreSQL
    setTimeout(() => {
      testPostgreSQLConnection();
    }, 500);
  };

  const getStatusBadge = (status: TestStatus) => {
    switch (status) {
      case 'success':
        return <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">✅ Success</span>;
      case 'error':
        return <span className="px-2 py-0.5 bg-rose-100 text-rose-700 rounded-full text-xs font-bold">❌ Error</span>;
      case 'testing':
        return <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-bold animate-pulse">⏳ Testing...</span>;
      default:
        return <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full text-xs font-bold">⏸ Idle</span>;
    }
  };

  const getStatusIcon = (status: TestStatus) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-emerald-600" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-rose-600" />;
      case 'testing':
        return <RefreshCw className="w-5 h-5 text-amber-600 animate-spin" />;
      default:
        return <Database className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
              <Server className="w-5 h-5 text-indigo-600" />
              Database Connection Test
            </h3>
            <p className="text-sm text-slate-500">Verify your MySQL and PostgreSQL database connections.</p>
          </div>
          <button
            onClick={testAll}
            disabled={isLoading}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium text-sm disabled:opacity-50 transition-all flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Testing...' : 'Test All'}
          </button>
        </div>

        {/* MySQL Test Result */}
        <div className={`p-4 rounded-xl border mb-4 ${
          mysqlResult.status === 'success' ? 'bg-emerald-50 border-emerald-200' :
          mysqlResult.status === 'error' ? 'bg-rose-50 border-rose-200' :
          mysqlResult.status === 'testing' ? 'bg-amber-50 border-amber-200' :
          'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-start gap-3">
            <div className="mt-1">
              {getStatusIcon(mysqlResult.status)}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-700 text-sm">MySQL</span>
                  {getStatusBadge(mysqlResult.status)}
                </div>
                {mysqlResult.duration && (
                  <span className="text-xs text-slate-400">{mysqlResult.duration}ms</span>
                )}
              </div>
              <p className="text-sm text-slate-600 mt-1">{mysqlResult.message}</p>
              
              <div className="flex gap-2 mt-3">
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={testMySQLConnection}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-all"
                >
                  Test MySQL
                </button>
              </div>

              {mysqlResult.dataCounts && (
                <div className="grid grid-cols-3 md:grid-cols-5 gap-2 mt-3">
                  <div className="bg-white p-2 rounded-lg border border-slate-100 text-center">
                    <p className="text-[10px] text-slate-400">Employees</p>
                    <p className="font-bold text-slate-700">{mysqlResult.dataCounts.employees}</p>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-100 text-center">
                    <p className="text-[10px] text-slate-400">Attendance</p>
                    <p className="font-bold text-slate-700">{mysqlResult.dataCounts.attendance}</p>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-100 text-center">
                    <p className="text-[10px] text-slate-400">Leaves</p>
                    <p className="font-bold text-slate-700">{mysqlResult.dataCounts.leaves}</p>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-100 text-center">
                    <p className="text-[10px] text-slate-400">Payroll</p>
                    <p className="font-bold text-slate-700">{mysqlResult.dataCounts.payroll}</p>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-100 text-center">
                    <p className="text-[10px] text-slate-400">Candidates</p>
                    <p className="font-bold text-slate-700">{mysqlResult.dataCounts.candidates}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* PostgreSQL Test Result */}
        <div className={`p-4 rounded-xl border ${
          postgresResult.status === 'success' ? 'bg-emerald-50 border-emerald-200' :
          postgresResult.status === 'error' ? 'bg-rose-50 border-rose-200' :
          postgresResult.status === 'testing' ? 'bg-amber-50 border-amber-200' :
          'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-start gap-3">
            <div className="mt-1">
              {getStatusIcon(postgresResult.status)}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-700 text-sm">PostgreSQL</span>
                  {getStatusBadge(postgresResult.status)}
                </div>
                {postgresResult.duration && (
                  <span className="text-xs text-slate-400">{postgresResult.duration}ms</span>
                )}
              </div>
              <p className="text-sm text-slate-600 mt-1">{postgresResult.message}</p>
              
              <div className="flex gap-2 mt-3">
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={testPostgreSQLConnection}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-all"
                >
                  Test PostgreSQL
                </button>
              </div>

              {postgresResult.dataCounts && (
                <div className="grid grid-cols-3 md:grid-cols-5 gap-2 mt-3">
                  <div className="bg-white p-2 rounded-lg border border-slate-100 text-center">
                    <p className="text-[10px] text-slate-400">Employees</p>
                    <p className="font-bold text-slate-700">{postgresResult.dataCounts.employees}</p>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-100 text-center">
                    <p className="text-[10px] text-slate-400">Attendance</p>
                    <p className="font-bold text-slate-700">{postgresResult.dataCounts.attendance}</p>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-100 text-center">
                    <p className="text-[10px] text-slate-400">Leaves</p>
                    <p className="font-bold text-slate-700">{postgresResult.dataCounts.leaves}</p>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-100 text-center">
                    <p className="text-[10px] text-slate-400">Payroll</p>
                    <p className="font-bold text-slate-700">{postgresResult.dataCounts.payroll}</p>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-100 text-center">
                    <p className="text-[10px] text-slate-400">Candidates</p>
                    <p className="font-bold text-slate-700">{postgresResult.dataCounts.candidates}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Summary */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h4 className="font-bold text-slate-700 text-sm mb-3">Quick Summary</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3 bg-slate-50 rounded-xl">
            <p className="text-xs text-slate-400">MySQL Status</p>
            <p className={`font-bold ${mysqlResult.status === 'success' ? 'text-emerald-600' : mysqlResult.status === 'error' ? 'text-rose-600' : 'text-slate-500'}`}>
              {mysqlResult.status === 'success' ? '✅ Connected' :
               mysqlResult.status === 'error' ? '❌ Failed' :
               mysqlResult.status === 'testing' ? '⏳ Testing...' : 'Not tested'}
            </p>
            {mysqlResult.dataCounts && (
              <p className="text-xs text-slate-400">
                Total Records: {mysqlResult.dataCounts.employees + mysqlResult.dataCounts.attendance + mysqlResult.dataCounts.leaves + mysqlResult.dataCounts.payroll + mysqlResult.dataCounts.candidates}
              </p>
            )}
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <p className="text-xs text-slate-400">PostgreSQL Status</p>
            <p className={`font-bold ${postgresResult.status === 'success' ? 'text-emerald-600' : postgresResult.status === 'error' ? 'text-rose-600' : 'text-slate-500'}`}>
              {postgresResult.status === 'success' ? '✅ Connected' :
               postgresResult.status === 'error' ? '❌ Failed' :
               postgresResult.status === 'testing' ? '⏳ Testing...' : 'Not tested'}
            </p>
            {postgresResult.dataCounts && (
              <p className="text-xs text-slate-400">
                Total Records: {postgresResult.dataCounts.employees + postgresResult.dataCounts.attendance + postgresResult.dataCounts.leaves + postgresResult.dataCounts.payroll + postgresResult.dataCounts.candidates}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
