import { logger } from './lib/logger';
import { useState, useEffect, useRef, lazy, Suspense, useCallback, useMemo } from 'react';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import AccessDenied from './components/AccessDenied';
import { DataProvider, useData } from './contexts/DataContext';
import { AlertCircle } from 'lucide-react';

import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastContainer } from './components/Toast';

// Lazy load feature modules for code splitting
const Dashboard = lazy(() => import('./components/Dashboard'));
const ManagerDashboard = lazy(() => import('./components/ManagerDashboard'));
const Employees = lazy(() => import('./components/Employees'));
const Attendance = lazy(() => import('./components/Attendance'));
const Payroll = lazy(() => import('./components/Payroll'));
const Recruitment = lazy(() => import('./components/Recruitment'));
const JDMatching = lazy(() => import('./components/JDMatching'));
const CompanyPolicies = lazy(() => import('./components/CompanyPolicies'));
const Settings = lazy(() => import('./components/Settings'));
const Leaves = lazy(() => import('./pages/Leaves'));
const Succession = lazy(() => import('./components/Succession'));
const OnboardingTemplates = lazy(() => import('./components/OnboardingTemplates'));
const Departments = lazy(() => import('./components/Departments'));
const AuditTrail = lazy(() => import('./components/AuditTrail'));
const JobDescriptions = lazy(() => import('./components/JobDescriptions'));
const Designations = lazy(() => import('./components/Designations'));
const MyLeave = lazy(() => import('./components/MyLeave'));
const ShiftManagement = lazy(() => import('./components/ShiftManagement'));
const Training = lazy(() => import('./components/Training'));
const ExitManagementConfig = lazy(() => import('./components/ExitManagementConfig'));
const DataImporter = lazy(() => import('./pages/DataImporter'));
const Performance = lazy(() => import('./components/Performance'));
const Documents = lazy(() => import('./components/Documents'));
const SystemTest = lazy(() => import('./components/SystemTest'));
const EmployeePortal = lazy(() => import('./components/EmployeePortal'));
const ManagerPortal = lazy(() => import('./components/ManagerPortal'));


import { getToken, getUser, setAuthData, clearAuthData, verifySession, hasToken, googleSignIn, logout } from './lib/auth';
import { Employee, AttendanceRecord, Candidate, PayrollRecord, AppSettings, LeaveRecord, LegacyOnboardingTask, OnboardingTemplate, Department, Designation, EmployeeDocument, JobDescription } from './types';
import { getSettings as loadStoredSettings, saveSettings as persistSettings } from './lib/storage';

// ===== NEW MAPPING: connects sidebar tab IDs to portal sections =====
const portalSectionMap: Record<string, { portal: 'employee' | 'manager', section: string }> = {
  // Employee portal sections
  'my-profile': { portal: 'employee', section: 'profile' },
  'my-attendance': { portal: 'employee', section: 'attendance' },
  'my-payslips': { portal: 'employee', section: 'payslips' },
  'my-onboarding': { portal: 'employee', section: 'onboarding' },
  'my-performance': { portal: 'employee', section: 'performance' },

  // Manager portal sections
  'team-members': { portal: 'manager', section: 'team' },
  'team-onboarding': { portal: 'manager', section: 'onboarding' },
  'team-attendance': { portal: 'manager', section: 'attendance' },
  'leave-approvals': { portal: 'manager', section: 'approvals' },
  'team-performance': { portal: 'manager', section: 'performance' },
};


export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const restoreSession = async () => {
      const token = getToken();
      if (!token) {
        if (mounted) setIsAuthLoading(false);
        return;
      }

      const restoredUser = await verifySession();
      if (mounted) {
        if (restoredUser) {
          setUser(restoredUser);
          setToken(token);
        } else {
          setUser(null);
          setToken(null);
        }
        setIsAuthLoading(false);
      }
    };

    void restoreSession();
    return () => {
      mounted = false;
    };
  }, []);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const employee = useMemo<Employee | null>(
    () => employees.find(e => e.id === user?.employeeId) ?? null,
    [employees, user]
  );
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [payrolls, setPayrolls] = useState<PayrollRecord[]>([]);
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [settings, setSettings] = useState<AppSettings>(() => loadStoredSettings());
  const [documents, setDocuments] = useState<EmployeeDocument[]>([]);
  const [onboardingTasks, setOnboardingTasks] = useState<LegacyOnboardingTask[]>([]);
  const [onboardingTemplates, setOnboardingTemplates] = useState<OnboardingTemplate[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [jobDescriptions, setJobDescriptions] = useState<JobDescription[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isLoadingGSheet, setIsLoadingGSheet] = useState(false);
  const [gsSyncError, setGsSyncError] = useState<string | null>(null);
  const data = useData();

  // ===== NEW LOGIC =====
  const mappedPortal = portalSectionMap[activeTab];

  useEffect(() => {
    const loadAll = async () => {
      try {
        const [emps, att, pay, levs, depts, desigs, docs, tasks, tmpls, jobs, cands] = await Promise.all([
          data.getEmployees(),
          data.getAttendance(),
          data.getPayroll(),
          data.getLeaves(),
          data.getDepartments(),
          data.getDesignations(),
          data.getEmployeeDocuments(),
          data.getOnboardingTasks(),
          data.getOnboardingTemplates(),
          data.getJobDescriptions(),
          data.getCandidates(),
        ]);
        setEmployees(emps);
        setAttendance(att);
        setPayrolls(pay);
        setLeaves(levs);
        setDepartments(depts);
        setDesignations(desigs);
        setDocuments(docs);
        setOnboardingTasks(tasks);
        setOnboardingTemplates(tmpls);
        setJobDescriptions(jobs);
        setCandidates(cands);
      } catch (error) {
        logger.error("Failed to load initial data:", error);
      }
    };
    loadAll();
  }, [data]);

  const handleSyncAll = async () => {
    setIsLoadingGSheet(true);
    try {
      await data.syncAll();
      // Re-load all data after sync to ensure consistency
      const [emps, att, pay, levs, depts, desigs, docs, tasks, tmpls, jobs, cands] = await Promise.all([
        data.getEmployees(),
        data.getAttendance(),
        data.getPayroll(),
        data.getLeaves(),
        data.getDepartments(),
        data.getDesignations(),
        data.getEmployeeDocuments(),
        data.getOnboardingTasks(),
        data.getOnboardingTemplates(),
        data.getJobDescriptions(),
        data.getCandidates(),
      ]);
      setEmployees(emps);
      setAttendance(att);
      setPayrolls(pay);
      setLeaves(levs);
      setDepartments(depts);
      setDesignations(desigs);
      setDocuments(docs);
      setOnboardingTasks(tasks);
      setOnboardingTemplates(tmpls);
      setJobDescriptions(jobs);
      setCandidates(cands);
    } catch (error) {
      logger.error("Manual sync failed:", error);
    } finally {
      setIsLoadingGSheet(false);
    }
  };

  const handleSignIn = async () => {
    setIsLoggingIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setAuthData(result.token, result.user);
        setUser(result.user);
        setSettings(prev => {
          const next = { ...prev, isMockMode: false };
          persistSettings(next);
          return next;
        });
      }
    } catch (e) {
      logger.error("Sign in failed:", e);
    } finally {
      setIsLoggingIn(false);
    }
  };
  const handleUpdateLeaveStatus = async (id: string, status: 'Approved' | 'Rejected', approver: string) => {
    const updatedLeaves = leaves.map(l => {
      if (l.id === id) {
        return { ...l, status, approvedBy: approver, approvedAt: new Date().toISOString() };
      }
      return l;
    });
    setLeaves(updatedLeaves);
    await data.saveLeaves(updatedLeaves);
  };
  const handleSignOut = async () => {
    await logout();
    setUser(null);
    setSettings(prev => {
      const next = { ...prev, isMockMode: true };
      persistSettings(next);
      return next;
    });
  };
  const canAccess = (tab: string, role: string | undefined) => {
    // Default to 'Employee' if role is missing or undefined
    const userRole = role || 'Employee';
    
    const permissions: Record<string, string[]> = {
      'dashboard': ['Employee', 'Manager', 'HR', 'Admin'],
      'manager-dashboard': ['Manager', 'HR', 'Admin'],
      'employees': ['HR', 'Admin'],
      'departments': ['HR', 'Admin'],
      'designations': ['HR', 'Admin'],
      'succession': ['HR', 'Admin'],
      'my-leave': ['Employee', 'Manager', 'HR', 'Admin'],
      'shift-management': ['Manager', 'HR', 'Admin'],
      'training': ['Employee', 'Manager', 'HR', 'Admin'],
      'exit-management': ['HR', 'Admin'],
      'importer': ['Admin'],
      'performance': ['Employee', 'Manager', 'HR', 'Admin'],
      'documents': ['HR', 'Admin'],
      'attendance': ['Employee', 'Manager', 'HR', 'Admin'],
      'leaves': ['Employee', 'Manager', 'HR', 'Admin'],
      'payroll': ['HR', 'Admin'],
      'audit_trail': ['Admin'],
      'recruitment': ['HR', 'Admin', 'Manager'],
      'onboarding-templates': ['HR', 'Admin'],
      'policies': ['Employee', 'Manager', 'HR', 'Admin'],
      'settings': ['Admin']
    };
    
    const allowed = permissions[tab]?.includes(userRole) ?? false;
    
    // Log a warning if role is missing, but allow fallback
    if (!role) {
      logger.warn(`canAccess: role is undefined for tab "${tab}", defaulting to "Employee". User:`, user);
    }
    
    return allowed;
  };

  // ... (rest of the component)
  if (isAuthLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!hasToken()) {
    return <Login onSignIn={handleSignIn} isLoggingIn={isLoggingIn} />;
  }

  return (
    <ErrorBoundary>
      <div className="flex bg-slate-50 min-h-screen text-slate-800 antialiased font-sans" id="app-root">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        settings={settings}
        user={user}
      />

      <main className="flex-1 h-screen overflow-y-auto bg-slate-50/40" id="workspace-container">
        <div className="max-w-7xl mx-auto p-6 md:p-8 space-y-6">
          {user && !user.role && (
            <div className="bg-amber-50 border border-amber-200 text-amber-700 p-4 rounded-lg text-sm mb-4">
              ⚠️ Your account has no role assigned. Please contact an administrator.
            </div>
          )}
          <Header 
            user={user}
            onSignOut={handleSignOut}
            onSignIn={handleSignIn}
            isMockMode={settings.isMockMode}
            onSync={handleSyncAll}
          />
          
          <Suspense fallback={<div className="flex items-center justify-center p-12">Loading component...</div>}>
            {activeTab === 'dashboard' && (
              canAccess('dashboard', user?.role) ? (
                <Dashboard
                  employees={employees}
                  attendance={attendance}
                  candidates={candidates}
                  payrolls={payrolls}
                  settings={settings}
                  setActiveTab={setActiveTab}
                  leaves={leaves}
                  onUpdateLeaveStatus={handleUpdateLeaveStatus}
                  departments={departments}
                  designations={designations}
                  documents={documents}
                  user={user}
                />
              ) : <AccessDenied />
            )}

            {activeTab === 'employees' && (
              canAccess('employees', user?.role) ? (
                <Employees
                  employees={employees}
                  setEmployees={setEmployees}
                  onboardingTasks={onboardingTasks}
                  setOnboardingTasks={setOnboardingTasks}
                  isMockMode={settings.isMockMode}
                  onboardingTemplates={onboardingTemplates}
                  departments={departments}
                  designations={designations}
                  documents={documents}
                  setDocuments={setDocuments}
                  user={user}
                />
              ) : <AccessDenied />
            )}

            {activeTab === 'departments' && (
              canAccess('departments', user?.role) ? (
                <Departments
                  departments={departments}
                  setDepartments={setDepartments}
                  employees={employees}
                  setEmployees={setEmployees}
                  designations={designations}
                />
              ) : <AccessDenied />
            )}

            {activeTab === 'designations' && (
              canAccess('designations', user?.role) ? (
                <Designations
                  designations={designations}
                  setDesignations={setDesignations}
                  departments={departments}
                  employees={employees}
                />
              ) : <AccessDenied />
            )}

            {activeTab === 'succession' && (
              canAccess('succession', user?.role) ? (
                <Succession
                  employees={employees}
                  isMockMode={settings.isMockMode}
                  settings={settings}
                  departments={departments}
                  designations={designations}
                />
              ) : <AccessDenied />
            )}

            {activeTab === 'my-leave' && (
              canAccess('my-leave', user?.role) ? (
                <MyLeave user={user} />
              ) : <AccessDenied />
            )}

            {activeTab === 'shift-management' && (
              canAccess('shift-management', user?.role) ? (
                <ShiftManagement />
              ) : <AccessDenied />
            )}
            
            {(activeTab === 'training' || activeTab === 'training-requests' || activeTab === 'training-mentor' || activeTab === 'training-analytics') && (
              canAccess('training', user?.role) ? (
                <Training
                  user={user}
                  departments={departments}
                  designations={designations}
                  defaultTab={
                    activeTab === 'training-requests' ? 'requests' :
                    activeTab === 'training-mentor' ? 'mentor' :
                    activeTab === 'training-analytics' ? 'analytics' :
                    'employee'
                  }
                />
              ) : <AccessDenied />
            )}

            {activeTab === 'exit-management' && (
              canAccess('exit-management', user?.role) ? (
                <ExitManagementConfig />
              ) : <AccessDenied />
            )}
    
            {activeTab === 'importer' && (
              canAccess('importer', user?.role) ? (
                <DataImporter />
              ) : <AccessDenied />
            )}

            {activeTab === 'performance' && (
              canAccess('performance', user?.role) ? (
                <Performance user={user} departments={departments} designations={designations} />
              ) : <AccessDenied />
            )}

            {/* ===== NEW: Employee Portal (handles both 'employee-portal' and mapped tabs) ===== */}
            {(activeTab === 'employee-portal' || mappedPortal?.portal === 'employee') && (
              <EmployeePortal
                user={user}
                employee={employee || null}
                departments={departments}
                designations={designations}
                initialSection={mappedPortal?.section as any || 'dashboard'}
              />
            )}

            {/* ===== NEW: Manager Portal (handles both 'manager-portal' and mapped tabs) ===== */}
            {(activeTab === 'manager-portal' || mappedPortal?.portal === 'manager') && (
              <ManagerPortal
                user={user}
                departments={departments}
                designations={designations}
                initialSection={mappedPortal?.section as any || 'dashboard'}
              />
            )}

            {activeTab === 'documents' && (
              canAccess('documents', user?.role) ? (
                <Documents
                  documents={documents}
                  setDocuments={setDocuments}
                  employees={employees}
                  designations={designations}
                />
              ) : <AccessDenied />
            )}

            {activeTab === 'attendance' && (
              canAccess('attendance', user?.role) ? (
                <Attendance
                  attendance={attendance}
                  setAttendance={setAttendance}
                  employees={employees}
                  settings={settings}
                  user={user}
                  departments={departments}
                  designations={designations}
                />
              ) : <AccessDenied />
            )}

            {activeTab === 'leaves' && (
              <Leaves />
            )}

            {activeTab === 'payroll' && (
              canAccess('payroll', user?.role) ? (
                <Payroll
                  employees={employees}
                  attendance={attendance}
                  payrolls={payrolls}
                  setPayrolls={setPayrolls}
                  settings={settings}
                  setSettings={setSettings}
                  departments={departments}
                  designations={designations}
                />
              ) : <AccessDenied />
            )}

            {activeTab === 'audit_trail' && (
              canAccess('audit_trail', user?.role) ? <AuditTrail /> : <AccessDenied />
            )}

            {activeTab === 'system-test' && (user?.role === 'Admin' ? <SystemTest departments={departments} designations={designations} /> : <AccessDenied />)}

            {activeTab === 'recruitment' && (
              canAccess('recruitment', user?.role) ? (
                <Recruitment
                  candidates={candidates}
                  setCandidates={setCandidates}
                  settings={settings}
                  employees={employees}
                  setEmployees={setEmployees}
                  onboardingTemplates={onboardingTemplates}
                  jobDescriptions={jobDescriptions}
                  setJobDescriptions={setJobDescriptions}
                  user={user}
                  departments={departments}
                  designations={designations}
                />
              ) : <AccessDenied />
            )}

            {activeTab === 'onboarding-templates' && (
              canAccess('onboarding-templates', user?.role) ? (
                <OnboardingTemplates
                  templates={onboardingTemplates}
                  setTemplates={setOnboardingTemplates}
                  isMockMode={settings.isMockMode}
                />
              ) : <AccessDenied />
            )}

            {activeTab === 'policies' && (
              canAccess('policies', user?.role) ? (
                <CompanyPolicies
                  settings={settings}
                  setSettings={setSettings}
                />
              ) : <AccessDenied />
            )}

            {activeTab === 'my-dashboard' && (
              canAccess('dashboard', user?.role) ? (
                <Dashboard
                  employees={employees}
                  attendance={attendance}
                  candidates={candidates}
                  payrolls={payrolls}
                  settings={settings}
                  setActiveTab={setActiveTab}
                  leaves={leaves}
                  onUpdateLeaveStatus={handleUpdateLeaveStatus}
                  departments={departments}
                  designations={designations}
                  documents={documents}
                  user={user}
                />
              ) : <AccessDenied />
            )}

            {activeTab === 'settings' && (
              canAccess('settings', user?.role) ? (
                <Settings
                  settings={settings}
                  setSettings={setSettings}
                  user={user}
                  handleSignIn={handleSignIn}
                  handleSignOut={handleSignOut}
                  isLoggingIn={isLoggingIn}
                  employees={employees}
                  setEmployees={setEmployees}
                  attendance={attendance}
                  setAttendance={setAttendance}
                  payrolls={payrolls}
                  setPayrolls={setPayrolls}
                  leaves={leaves}
                  setLeaves={setLeaves}
                />
              ) : <AccessDenied />
            )}
          </Suspense>
        </div>
      </main>
      <ToastContainer />
    </div>
    </ErrorBoundary>
  );
}
