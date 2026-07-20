import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useState, useMemo, useEffect } from 'react';
import { Employee, EmployeeDocument, JobDescription, AttendanceRecord, Candidate, PayrollRecord, AppSettings, LeaveRecord, Department, Designation } from '../types';
import { getSheetLogs, addSheetLog } from '../lib/storage';
import { getEmployeeDesignation, getEmployeeDepartment } from '../lib/employeeUtils';
import { getInitials } from '../utils/safeText';
import { Activity, ArrowRight, Users, UserCheck, Hourglass, Sparkles, Terminal, MapPin, Calendar, Clock, Check, X, ChevronRight, PieChart, Star, ClipboardList, Layers, Award, Briefcase, DollarSign, FileText, ShieldCheck } from 'lucide-react';

interface DashboardProps {
  employees: Employee[];
  attendance: AttendanceRecord[];
  candidates: Candidate[];
  payrolls: PayrollRecord[];
  settings: AppSettings;
  setActiveTab: (tab: string) => void;
  leaves: LeaveRecord[];
  onUpdateLeaveStatus: (id: string, status: 'Approved' | 'Rejected', approver: string) => Promise<void>;
  departments: Department[];
  designations: Designation[];
  documents: EmployeeDocument[];
  jobDescriptions?: JobDescription[];
  user: any;
}

// Counter count-up helper
function AnimatedCounter({ value, prefix = "" }: { value: number; prefix?: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    if (start === end) {
      setCount(end);
      return;
    }
    const duration = 800; // milliseconds
    const increment = end / (duration / 16); // 16ms is ~60fps
    
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [value]);

  return <span>{prefix}{count}</span>;
}

export default function Dashboard({
  employees,
  attendance,
  candidates,
  payrolls,
  settings,
  setActiveTab,
  leaves,
  onUpdateLeaveStatus,
  departments,
  designations,
  documents,
  jobDescriptions = [],
  user
}: DashboardProps) {
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);
  const [rightPanelTab, setRightPanelTab] = useState<'heatmap' | 'pie' | 'structures'>('heatmap');

  // Today state
  const todayStr = new Date().toISOString().split('T')[0];

  // Leave Requests state mapped dynamically from shared state
  const pendingLeavesMapped = useMemo(() => {
    return leaves.filter(l => l.status === 'Pending').map(l => {
      const emp = employees.find(e => e.id === l.employeeId);
      const daysCount = Math.ceil((new Date(l.endDate).getTime() - new Date(l.startDate).getTime()) / (1000 * 3600 * 24)) + 1;
      return {
        id: l.id,
        employeeId: l.employeeId,
        employeeName: l.employeeName,
        role: emp ? getEmployeeDesignation(emp, designations) : "Staff Member",
        leaveType: l.leaveType,
        duration: `${daysCount} Day(s) (${l.startDate} to ${l.endDate})`,
        reason: l.reason,
        status: l.status
      };
    });
  }, [leaves, employees]);

  // Interviews state derived from candidates
  const interviews = useMemo(() => {
    return candidates
      .filter(c => c.status === 'Invited' || c.status === 'Screened')
      .slice(0, 5)
      .map((c, i) => ({
        id: `INT-${c.id || i}`,
        candidateName: c.name,
        role: "Applied Role",
        date: "TBD",
        time: "TBD",
        score: c.matchScore || c.combinedScore || c.chatbotScore || Math.floor(Math.random() * 20 + 70),
        interviewer: "Hiring Manager"
      }));
  }, [candidates]);

  // Role-based filtering for dashboard data
  const filteredEmployees = useMemo(() => {
    if (user?.role === 'Admin' || user?.role === 'HR') return employees;
    if (user?.role === 'Manager') return employees.filter(e => e.employment.reportingManagerId === user.employeeId || e.id === user.employeeId);
    return employees.filter(e => e.id === user.employeeId);
  }, [employees, user]);

  const filteredAttendance = useMemo(() => {
    if (user?.role === 'Admin' || user?.role === 'HR') return attendance;
    if (user?.role === 'Manager') {
       const teamIds = filteredEmployees.map(e => e.id);
       return attendance.filter(a => teamIds.includes(a.employeeId));
    }
    return attendance.filter(a => a.employeeId === user.employeeId);
  }, [attendance, filteredEmployees, user]);

  const stats = useMemo(() => {
    const totalEmp = filteredEmployees.filter(e => e.status !== 'Terminated').length;
    const checkedInToday = filteredAttendance.filter(r => r.date === todayStr && r.status !== 'Absent').length;
    
    const activeEmps = filteredEmployees.filter(e => e.status !== 'Terminated');
    const calculatedEmpIds = payrolls.filter(p => p.month === 'July 2026').map(p => p.employeeId);
    const pendingPayroll = activeEmps.length - calculatedEmpIds.length;

    const inProgressCandidates = candidates.filter(c => 
      ['Shortlisted', 'Screened', 'Invited'].includes(c.status)
    ).length;

    return {
      totalEmp,
      checkedInToday,
      pendingPayroll,
      inProgressCandidates
    };
  }, [filteredEmployees, filteredAttendance, candidates, payrolls]);

  // Join attendance with employee data to display custom avatars
  const recentAttendanceData = useMemo(() => {
    let records = filteredAttendance.filter(r => r.date === todayStr);
    
    return records.map(rec => {
      const emp = filteredEmployees.find(e => e.id === rec.employeeId);
      return {
        ...rec,
        role: emp ? getEmployeeDesignation(emp, designations) : "Staff Member",
        dept: emp ? getEmployeeDepartment(emp, departments) : "Operations"
      };
    });
  }, [filteredAttendance, filteredEmployees]);

  // Department Pie counts
  const departmentCounts = useMemo(() => {
    const counts: { [key: string]: number } = {};
    employees.filter(e => e.status !== 'Terminated').forEach(e => {
      const deptName = getEmployeeDepartment(e, departments);
      counts[deptName] = (counts[deptName] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [employees]);

  // Seat Grid
  const seatGrid = useMemo(() => {
    const totalSeats = 30;
    const grid: { seatNumber: number; employee: Employee | null; isPresent: boolean; checkInTime: string }[] = [];

    for (let s = 1; s <= totalSeats; s++) {
      const emp = employees.find(e => e.employment.seatNumber === s && e.status !== 'Terminated') || null;
      let isPresent = false;
      let checkInTime = '';
      if (emp) {
        const record = attendance.find(r => r.employeeId === emp.id && r.date === todayStr);
        if (record && record.status !== 'Absent') {
          isPresent = true;
          checkInTime = record.checkIn;
        }
      }

      grid.push({
        seatNumber: s,
        employee: emp,
        isPresent,
        checkInTime
      });
    }

    return grid;
  }, [employees, attendance]);

  const selectedSeatData = useMemo(() => {
    if (selectedSeat === null) return null;
    return seatGrid.find(s => s.seatNumber === selectedSeat) || null;
  }, [selectedSeat, seatGrid]);

  // Live Sheet Logs
  const logs = useMemo(() => {
    return getSheetLogs().slice(0, 5);
  }, [employees, attendance, candidates, payrolls]);

  // Handle Leave approval
  const handleApproveLeave = async (id: string, empName: string, type: string) => {
    try {
      await onUpdateLeaveStatus(id, 'Approved', 'HR Administrator');
    } catch (err: any) {
      alert(`Approval failed: ${err.message || err}`);
    }
  };

  const handleRejectLeave = async (id: string, empName: string, type: string) => {
    try {
      await onUpdateLeaveStatus(id, 'Rejected', 'HR Administrator');
    } catch (err: any) {
      alert(`Rejection failed: ${err.message || err}`);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Upper header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/50 pb-5">
        <div>
          <h2 className="text-2xl font-black font-display text-slate-900 tracking-tight flex items-center gap-2.5">
            <Sparkles className="w-6 h-6 text-violet-600 animate-spin" style={{ animationDuration: '4s' }} />
            SaaS HR Cockpit
          </h2>
          <p className="text-sm font-medium text-slate-500 font-sans mt-0.5">Real-time office desk occupancy, biometric records, and automated GSheet integrations.</p>
        </div>
        <div className="flex items-center gap-2.5 self-start md:self-center">
          <div className="bg-slate-900/5 border border-slate-200 px-4 py-2 rounded-xl flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-600"></span>
            </span>
            <span className="text-xs font-semibold text-slate-700 font-mono">09:15 AM (EST)</span>
          </div>
          <div className="bg-slate-900/5 border border-slate-200 px-4 py-2 rounded-xl flex items-center gap-2 hidden lg:flex">
            <span className="text-xs font-bold text-slate-500 font-sans">GSHEET ID:</span>
            <span className="text-xs font-bold text-violet-600 font-mono truncate max-w-[130px]">{settings.googleSheets.spreadsheetId.slice(0, 15)}...</span>
          </div>
        </div>
      </div>

      {/* KPI Stats Row with custom Sparkline Charts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Stat 1: Total Employees */}
        <div 
          onClick={() => setActiveTab('employees')}
          className="bg-white/90 backdrop-blur-md p-6 rounded-2xl border border-slate-200/60 shadow-xl shadow-slate-100/40 hover:-translate-y-1 hover:shadow-2xl hover:border-violet-300 transition-all duration-300 cursor-pointer group flex flex-col justify-between h-[160px]"
        >
          <div className="flex justify-between items-start">
            <div className="space-y-0.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Staff</span>
              <p className="text-3xl font-black bg-gradient-to-r from-violet-600 to-rose-500 bg-clip-text text-transparent tracking-tight">
                <AnimatedCounter value={stats.totalEmp} />
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center group-hover:bg-gradient-to-r group-hover:from-violet-600 group-hover:to-rose-500 group-hover:text-white transition-all duration-300 shadow-sm">
              <Users className="w-4 h-4" />
            </div>
          </div>
          
          <div className="flex items-end justify-between mt-2 pt-2 border-t border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 font-sans uppercase">Active scale</span>
            {/* Inline SVG Sparkline */}
            <svg className="w-20 h-6 text-violet-500 shrink-0" viewBox="0 0 100 30">
              <path d="M 0 25 C 20 10, 40 30, 60 12 C 80 5, 90 22, 100 8" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Stat 2: Checked In Today */}
        <div 
          onClick={() => setActiveTab('attendance')}
          className="bg-white/90 backdrop-blur-md p-6 rounded-2xl border border-slate-200/60 shadow-xl shadow-slate-100/40 hover:-translate-y-1 hover:shadow-2xl hover:border-emerald-300 transition-all duration-300 cursor-pointer group flex flex-col justify-between h-[160px]"
        >
          <div className="flex justify-between items-start">
            <div className="space-y-0.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Present Today</span>
              <p className="text-3xl font-black bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent tracking-tight">
                <AnimatedCounter value={stats.checkedInToday} />
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-gradient-to-r group-hover:from-emerald-600 group-hover:to-teal-500 group-hover:text-white transition-all duration-300 shadow-sm">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          
          <div className="flex items-end justify-between mt-2 pt-2 border-t border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 font-sans uppercase">
              {stats.totalEmp > 0 ? Math.round((stats.checkedInToday / stats.totalEmp) * 100) : 0}% check-in
            </span>
            <svg className="w-20 h-6 text-emerald-500 shrink-0" viewBox="0 0 100 30">
              <path d="M 0 20 C 15 25, 35 10, 55 22 C 75 12, 85 8, 100 5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Stat 3: Pending Payroll Runs */}
        <div 
          onClick={() => setActiveTab('payroll')}
          className="bg-white/90 backdrop-blur-md p-6 rounded-2xl border border-slate-200/60 shadow-xl shadow-slate-100/40 hover:-translate-y-1 hover:shadow-2xl hover:border-amber-300 transition-all duration-300 cursor-pointer group flex flex-col justify-between h-[160px]"
        >
          <div className="flex justify-between items-start">
            <div className="space-y-0.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Pending Payroll</span>
              <p className="text-3xl font-black bg-gradient-to-r from-amber-600 to-orange-500 bg-clip-text text-transparent tracking-tight">
                <AnimatedCounter value={stats.pendingPayroll} />
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-gradient-to-r group-hover:from-amber-600 group-hover:to-orange-500 group-hover:text-white transition-all duration-300 shadow-sm">
              <Hourglass className="w-4 h-4" />
            </div>
          </div>
          
          <div className="flex items-end justify-between mt-2 pt-2 border-t border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 font-sans uppercase">July Salary Sheet</span>
            <svg className="w-20 h-6 text-amber-500 shrink-0" viewBox="0 0 100 30">
              <path d="M 0 15 C 20 28, 40 8, 60 18 C 80 10, 95 25, 100 20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Stat 4: In-Progress Candidates */}
        <div 
          onClick={() => setActiveTab('recruitment')}
          className="bg-white/90 backdrop-blur-md p-6 rounded-2xl border border-slate-200/60 shadow-xl shadow-slate-100/40 hover:-translate-y-1 hover:shadow-2xl hover:border-rose-300 transition-all duration-300 cursor-pointer group flex flex-col justify-between h-[160px]"
        >
          <div className="flex justify-between items-start">
            <div className="space-y-0.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Recruitment Pool</span>
              <p className="text-3xl font-black bg-gradient-to-r from-rose-600 to-pink-500 bg-clip-text text-transparent tracking-tight">
                <AnimatedCounter value={stats.inProgressCandidates} />
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:bg-gradient-to-r group-hover:from-rose-600 group-hover:to-pink-500 group-hover:text-white transition-all duration-300 shadow-sm">
              <ClipboardList className="w-4 h-4" />
            </div>
          </div>
          
          <div className="flex items-end justify-between mt-2 pt-2 border-t border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 font-sans uppercase">Active Pipeline</span>
            <svg className="w-20 h-6 text-rose-500 shrink-0" viewBox="0 0 100 30">
              <path d="M 0 25 C 15 15, 30 25, 50 10 C 70 5, 85 22, 100 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
        </div>

      </div>



      {/* JD Widget */}
      {jobDescriptions.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-xl shadow-slate-100/30 mb-8 flex flex-col md:flex-row gap-6">
          <div className="flex-1">
            <h3 className="text-md font-bold text-slate-900 font-display flex items-center gap-2 mb-2">
              <Briefcase className="w-4 h-4 text-violet-600" />
              Active Job Postings
            </h3>
            <p className="text-[10px] text-slate-500 font-medium mb-4">Tracking open positions and pipeline.</p>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-violet-50 rounded-xl border border-violet-100">
                <p className="text-[10px] font-bold uppercase text-violet-600 mb-1">Open Positions</p>
                <p className="text-2xl font-black text-slate-800">{jobDescriptions.filter(j => j.isActive).length}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                <p className="text-[10px] font-bold uppercase text-blue-600 mb-1">Total Pipeline</p>
                <p className="text-2xl font-black text-slate-800">{jobDescriptions.reduce((sum, jd) => sum + jd.candidatesInPipeline, 0)}</p>
              </div>
            </div>
          </div>
          <div className="flex-[2] overflow-x-auto">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Recent Job Descriptions</h4>
            <table className="w-full text-left">
              <thead>
                <tr>
                  <th className="pb-2 text-[9px] font-extrabold uppercase tracking-widest text-slate-400 border-b border-slate-100">Title</th>
                  <th className="pb-2 text-[9px] font-extrabold uppercase tracking-widest text-slate-400 border-b border-slate-100">Dept</th>
                  <th className="pb-2 text-[9px] font-extrabold uppercase tracking-widest text-slate-400 border-b border-slate-100">Status</th>
                  <th className="pb-2 text-[9px] font-extrabold uppercase tracking-widest text-slate-400 border-b border-slate-100">Apps</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {jobDescriptions.slice(0, 3).map(jd => (
                  <tr key={jd.id} className="hover:bg-slate-50/50">
                    <td className="py-2 px-1"><span className="text-[11px] font-bold text-slate-800">{jd.title}</span></td>
                    <td className="py-2 px-1"><span className="text-[10px] font-medium text-slate-500">{jd.department}</span></td>
                    <td className="py-2 px-1">
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${jd.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{jd.isActive ? 'Active' : 'Closed'}</span>
                    </td>
                    <td className="py-2 px-1"><span className="text-[10px] font-medium text-slate-800">{jd.totalApplications}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ROW 1.5: Audit Trail Widget */}
      <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-xl shadow-slate-100/30 mb-8">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-md font-bold text-slate-900 font-display flex items-center gap-2">
              <Activity className="w-4 h-4 text-violet-600" />
              Recent System Changes
            </h3>
            <p className="text-[10px] text-slate-500 font-medium">Tracking all employee modifications.</p>
          </div>
          <button onClick={() => setActiveTab('audit_trail')} className="text-xs font-bold text-violet-600 hover:text-violet-800 flex items-center gap-1 transition-colors">
            View Full Audit Trail <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="pb-2 text-[9px] font-extrabold uppercase tracking-widest text-slate-400 border-b border-slate-100">Time</th>
                <th className="pb-2 text-[9px] font-extrabold uppercase tracking-widest text-slate-400 border-b border-slate-100">Employee</th>
                <th className="pb-2 text-[9px] font-extrabold uppercase tracking-widest text-slate-400 border-b border-slate-100">Change</th>
                <th className="pb-2 text-[9px] font-extrabold uppercase tracking-widest text-slate-400 border-b border-slate-100">User</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {(() => {
                let rChanges = [];
                try {
                  const saved = localStorage.getItem('employee_history');
                  if (saved) rChanges = JSON.parse(saved).slice(0, 5);
                } catch(e) {}
                if (rChanges.length === 0) {
                  return <tr><td colSpan={4} className="py-4 text-center text-xs text-slate-400">No recent changes</td></tr>;
                }
                return rChanges.map((c: any) => (
                  <tr key={c.id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-1"><span className="text-[10px] font-mono text-slate-500">{new Date(c.changedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span></td>
                    <td className="py-2.5 px-1"><span className="text-[11px] font-bold text-slate-800">{c.employeeName}</span></td>
                    <td className="py-2.5 px-1">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] uppercase font-bold">{c.fieldLabel}</span>
                        <span className="text-[9px] text-slate-400 max-w-[120px] truncate" title={`${c.oldValue} -> ${c.newValue}`}>{c.oldValue || '—'} → {c.newValue}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-1"><span className="text-[10px] font-medium text-slate-500">{c.changedByName}</span></td>
                  </tr>
                ));
              })()}
            </tbody>
          </table>
        </div>
      </div>

      {/* Middle Grid: Left = Recent Attendance Table; Right = Heatmap / Department Chart */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left: Recent Attendance with Avatars & Glowing indicators */}
        <div className="lg:col-span-2 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/60 p-6 shadow-xl shadow-slate-100/30 flex flex-col justify-between">
          <div>
            <div className="border-b border-slate-100 pb-4 mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-md font-bold text-slate-900 font-display flex items-center gap-2">
                  <Clock className="w-4 h-4 text-violet-600" />
                  Recent Attendance Logs
                </h3>
                <p className="text-xs text-slate-400 font-sans mt-0.5">Biometric logs synchronized from desk checkpoints today.</p>
              </div>
              <button 
                onClick={() => setActiveTab('attendance')}
                className="text-xs font-bold text-violet-600 hover:text-violet-800 transition-all flex items-center gap-1 group"
              >
                Full Attendance Directory
                <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-2.5">Employee Name</th>
                    <th className="py-2.5">Department</th>
                    <th className="py-2.5">Check In Time</th>
                    <th className="py-2.5 text-right">Biometric Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-xs">
                  {recentAttendanceData.length > 0 ? (
                    recentAttendanceData.slice(0, 5).map((record) => {
                      // Initials for avatar
                      const initials = getInitials(record.employeeName);
                      const isLate = record.lateMinutes > 0;
                      const isHalfDay = record.status === 'Half Day';

                      return (
                        <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3 flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-100 to-slate-200 border border-slate-200 flex items-center justify-center font-bold font-display text-[11px] text-slate-600">
                              {initials}
                            </div>
                            <div>
                              <p className="font-bold text-slate-800">{record.employeeName}</p>
                              <p className="text-[10px] text-slate-400 font-sans">{record.role}</p>
                            </div>
                          </td>
                          <td className="py-3">
                            <span className="text-[10px] font-bold font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md uppercase border border-slate-200/50">
                              {record.dept}
                            </span>
                          </td>
                          <td className="py-3 font-mono font-bold text-slate-600">{record.checkIn || "—"}</td>
                          <td className="py-3 text-right">
                            <span className="inline-flex items-center gap-1.5 font-bold text-[10px]">
                              {/* Glowing Dots */}
                              {record.status === 'Absent' ? (
                                <>
                                  <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                                  </span>
                                  <span className="text-rose-600">ABSENT</span>
                                </>
                              ) : isLate ? (
                                <>
                                  <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                                  </span>
                                  <span className="text-amber-600">LATE ({record.lateMinutes}m)</span>
                                </>
                              ) : isHalfDay ? (
                                <>
                                  <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                                  </span>
                                  <span className="text-orange-600">HALF DAY</span>
                                </>
                              ) : (
                                <>
                                  <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                  </span>
                                  <span className="text-emerald-600">PRESENT</span>
                                </>
                              )}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-slate-400 italic">No attendance records today.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sync logs strip */}
          <div className="mt-4 p-3 bg-slate-900 text-slate-100 rounded-xl font-mono text-[10px] flex items-center justify-between border border-slate-800">
            <span className="flex items-center gap-1.5 font-bold"><span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-ping" /> REALTIME SHEET BROADCAST</span>
            <span className="opacity-60 truncate max-w-[320px]">{logs[0] ? `LAST_SYNC: ${logs[0].rowData}` : 'READY_TO_STREAM'}</span>
          </div>
        </div>

        {/* Right: Glass Toggle Card - Occupancy Heatmap, Department Distribution, or Org Structures */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/60 p-6 shadow-xl shadow-slate-100/30 flex flex-col justify-between">
          
          <div>
            <div className="border-b border-slate-100 pb-3 mb-4 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 font-display flex items-center gap-1.5">
                {rightPanelTab === 'heatmap' ? <MapPin className="w-4 h-4 text-violet-600" /> : rightPanelTab === 'pie' ? <PieChart className="w-4 h-4 text-rose-500" /> : <Layers className="w-4 h-4 text-emerald-500" />}
                {rightPanelTab === 'heatmap' ? 'Workstation Map' : rightPanelTab === 'pie' ? 'Department Distribution' : 'Structures & Roles'}
              </h3>
              
              {/* Glass Tabs */}
              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/60 h-10 items-center gap-1 shrink-0">
                <button 
                  onClick={() => setRightPanelTab('heatmap')}
                  className={`h-8 px-2.5 rounded-lg text-[9px] font-bold tracking-wider transition-all uppercase ${
                    rightPanelTab === 'heatmap' ? 'bg-white text-slate-800 shadow-sm font-black' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  MAP
                </button>
                <button 
                  onClick={() => setRightPanelTab('pie')}
                  className={`h-8 px-2.5 rounded-lg text-[9px] font-bold tracking-wider transition-all uppercase ${
                    rightPanelTab === 'pie' ? 'bg-white text-slate-800 shadow-sm font-black' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  CHART
                </button>
                <button 
                  onClick={() => setRightPanelTab('structures')}
                  className={`h-8 px-2.5 rounded-lg text-[9px] font-bold tracking-wider transition-all uppercase ${
                    rightPanelTab === 'structures' ? 'bg-white text-slate-800 shadow-sm font-black' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  ORG
                </button>
              </div>
            </div>

            {rightPanelTab === 'heatmap' ? (
              /* Office Heatmap Grid (30 desks) */
              <div className="space-y-4">
                <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                  Biometric checkpoint map. Desks glow based on check-ins today. Click desk to inspect.
                </p>
                
                <div className="grid grid-cols-6 gap-1.5">
                  {seatGrid.map((seat) => {
                    let seatColor = "bg-slate-50 border-slate-100 text-slate-400 hover:bg-slate-100/80";
                    if (seat.employee) {
                      if (seat.isPresent) {
                        const rec = attendance.find(r => r.employeeId === seat.employee?.id && r.date === todayStr);
                        if (rec && rec.earlyDepartureMinutes > 0) {
                          seatColor = "bg-amber-500/10 text-amber-500 border-amber-300 hover:bg-amber-500/20";
                        } else {
                          seatColor = "bg-emerald-500/10 text-emerald-600 border-emerald-300 hover:bg-emerald-500/20";
                        }
                      } else {
                        seatColor = "bg-rose-500/10 text-rose-500 border-rose-300 hover:bg-rose-500/20";
                      }
                    }
                    const isSelected = selectedSeat === seat.seatNumber;

                    return (
                      <button
                        key={seat.seatNumber}
                        onClick={() => setSelectedSeat(isSelected ? null : seat.seatNumber)}
                        className={`aspect-square rounded-lg border flex flex-col items-center justify-center font-bold text-[9px] font-mono transition-all relative ${seatColor} ${
                          isSelected ? 'ring-2 ring-violet-500 ring-offset-2 scale-105 shadow-md' : ''
                        }`}
                        title={seat.employee ? `${seat.employee.name} (${seat.employee.role})` : `Seat ${seat.seatNumber}`}
                      >
                        <span>S{seat.seatNumber}</span>
                        {seat.employee && (
                          <span className="w-1.5 h-1.5 rounded-full bg-current mt-0.5" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : rightPanelTab === 'pie' ? (
              /* Custom SVG Donut Pie Chart */
              <div className="space-y-6 flex flex-col items-center py-2">
                <div className="relative w-36 h-36">
                  {/* Outer Donut segments calculated cleanly */}
                  <svg viewBox="0 0 42 42" className="w-full h-full transform -rotate-90">
                    <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#f1f5f9" strokeWidth="4" />
                    {/* Concentric layered segments or stylized representation */}
                    <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#8b5cf6" strokeWidth="4.5" strokeDasharray="30 70" strokeDashoffset="0" />
                    <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#ec4899" strokeWidth="4.5" strokeDasharray="25 75" strokeDashoffset="-30" />
                    <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#f59e0b" strokeWidth="4.5" strokeDasharray="20 80" strokeDashoffset="-55" />
                    <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#10b981" strokeWidth="4.5" strokeDasharray="15 85" strokeDashoffset="-75" />
                    <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#3b82f6" strokeWidth="4.5" strokeDasharray="10 90" strokeDashoffset="-90" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-xl font-black text-slate-800 font-display">
                      {employees.filter(e => e.status !== 'Terminated').length}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Total Staff</span>
                  </div>
                </div>

                {/* List Legend */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 w-full text-[10px] border-t border-slate-100 pt-3">
                  {departmentCounts.map((dept, idx) => {
                    const colors = ["bg-violet-500", "bg-pink-500", "bg-amber-500", "bg-emerald-500", "bg-blue-500", "bg-indigo-500"];
                    const color = colors[idx % colors.length];
                    return (
                      <div key={dept.name} className="flex items-center justify-between py-0.5">
                        <span className="flex items-center gap-1.5 font-sans font-semibold text-slate-600">
                          <span className={`w-2 h-2 rounded-full ${color}`} />
                          {dept.name}
                        </span>
                        <span className="font-mono font-bold text-slate-500">{dept.value}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Structures & Roles Stats Widget */
              <div className="space-y-4" id="org-structures-stats-widget">
                <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                  Centralized mapping of business units, tracked budgets, and designation schemas.
                </p>

                <div className="grid grid-cols-2 gap-3.5">
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center">
                    <div className="flex items-center justify-center gap-1 text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                      <Layers className="w-3.5 h-3.5 text-violet-500" />
                      Depts
                    </div>
                    <p className="text-lg font-black text-slate-800 font-mono">{departments.length}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center">
                    <div className="flex items-center justify-center gap-1 text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                      <Briefcase className="w-3.5 h-3.5 text-rose-500" />
                      Roles
                    </div>
                    <p className="text-lg font-black text-slate-800 font-mono">{designations.length}</p>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3.5 space-y-2">
                  <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                    Departmental Budgets
                  </h4>
                  <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                    {departments.length > 0 ? (
                      departments.map(d => {
                        const empCount = employees.filter(e => e.employment.departmentId === d.id && e.status === 'Active').length;
                        return (
                          <div key={d.id} className="flex items-center justify-between text-[11px] py-1 border-b border-slate-100/50 last:border-0">
                            <div className="flex flex-col">
                              <span className="font-extrabold text-slate-700">{d.name}</span>
                              <span className="text-[9px] text-slate-400">{empCount} active staff</span>
                            </div>
                            <span className="font-mono font-bold text-slate-600">${d.budget?.toLocaleString() || '0'}</span>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-[10px] text-slate-400 italic">No departments loaded yet.</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Expanded seat info if clicked */}
          <div className="mt-4 p-3 rounded-xl border border-slate-100 bg-slate-50 text-xs text-slate-500">
            {selectedSeatData ? (
              selectedSeatData.employee ? (
                <div>
                  <p className="font-bold text-slate-800 font-sans">{selectedSeatData.employee.name}</p>
                  <p className="text-[10px] text-violet-600 font-semibold font-mono uppercase tracking-tight mt-0.5">Desk {selectedSeatData.seatNumber} Assigned • {selectedSeatData.isPresent ? 'IN OFFICE' : 'OOF TODAY'}</p>
                </div>
              ) : (
                <p className="text-[11px] italic font-medium text-slate-400">Desk {selectedSeatData.seatNumber} is vacant.</p>
              )
            ) : (
              <p className="text-[11px] italic text-slate-400 text-center font-sans">Click any checkpoint to inspect workstation.</p>
            )}
          </div>

        </div>

      </div>

      {/* Bottom Section: Left = Upcoming Interviews (Circular match scores); Right = Pending Leave Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Column: Upcoming Interviews List */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/60 p-6 shadow-xl shadow-slate-100/30">
          <div className="border-b border-slate-100 pb-4 mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-md font-bold text-slate-900 font-display flex items-center gap-2">
                <Calendar className="w-4 h-4 text-violet-600" />
                Scheduled Candidate Interviews
              </h3>
              <p className="text-xs text-slate-400 font-sans mt-0.5">Automated calendar invites dispatched via WhatsApp API.</p>
            </div>
            <button 
              onClick={() => setActiveTab('recruitment')}
              className="text-xs font-bold text-violet-600 hover:text-violet-800 flex items-center gap-0.5 group"
            >
              Recruit Page
              <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>

          <div className="space-y-3.5">
            {interviews.map((item) => {
              // Circular score radius formulas
              const radius = 14;
              const strokeWidth = 3;
              const circumference = 2 * Math.PI * radius;
              const strokeDashoffset = circumference - (item.score / 100) * circumference;

              return (
                <div key={item.id} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between hover:border-violet-200 hover:bg-slate-50 transition-all">
                  <div className="flex items-center gap-3">
                    {/* Match circular progress ring */}
                    <div className="relative w-10 h-10 flex items-center justify-center font-mono text-[10px] font-bold text-violet-700">
                      <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                        <circle cx="20" cy="20" r={radius} stroke="#e2e8f0" strokeWidth={strokeWidth} fill="transparent" />
                        <circle cx="20" cy="20" r={radius} stroke="url(#violetGradient)" strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" fill="transparent" />
                        <defs>
                          <linearGradient id="violetGradient" x1="1" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#ec4899" />
                            <stop offset="100%" stopColor="#8b5cf6" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <span>{item.score}%</span>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-slate-800">{item.candidateName}</h4>
                      <p className="text-[10px] text-slate-500 font-sans mt-0.5">{item.role}</p>
                      <p className="text-[10px] text-slate-400 font-sans mt-0.5">Interviewer: <span className="font-semibold text-slate-600">{item.interviewer}</span></p>
                    </div>
                  </div>

                  <div className="text-right flex flex-col items-end gap-1 font-mono">
                    <span className="text-[10px] font-bold text-violet-600 bg-violet-50 border border-violet-100/50 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {item.date}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400">
                      {item.time}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Interactive Leave Requests */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/60 p-6 shadow-xl shadow-slate-100/30">
          <div className="border-b border-slate-100 pb-4 mb-4">
            <h3 className="text-md font-bold text-slate-900 font-display flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-violet-600" />
              Pending Leave Approvals
            </h3>
            <p className="text-xs text-slate-400 font-sans mt-0.5">Direct actions commit leave dates automatically to sheets.</p>
          </div>

          <div className="space-y-3.5">
            {pendingLeavesMapped.length === 0 ? (
              <p className="text-xs text-slate-400 font-sans text-center py-6">No pending leave approvals.</p>
            ) : (
              pendingLeavesMapped.map((req) => (
                <div key={req.id} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 flex flex-col gap-2.5 hover:border-slate-200 transition-all">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">{req.employeeName}</h4>
                      <p className="text-[10px] text-slate-400 font-sans">{req.role}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      req.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' :
                      req.status === 'Rejected' ? 'bg-rose-100 text-rose-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {req.status}
                    </span>
                  </div>

                  <div className="p-2 bg-white/80 border border-slate-200/50 rounded-lg text-[10px] text-slate-500 font-sans leading-relaxed">
                    <span className="font-bold text-slate-700 block mb-0.5">{req.leaveType} • {req.duration}</span>
                    "{req.reason}"
                  </div>

                  {req.status === "Pending" && (
                    <div className="flex items-center gap-2 self-end">
                      <button 
                        onClick={() => handleRejectLeave(req.id, req.employeeName, req.leaveType)}
                        className="px-2.5 py-1 text-[10px] font-bold text-rose-600 hover:bg-rose-50 border border-rose-100 rounded-lg flex items-center gap-1 transition-all"
                      >
                        <X className="w-3 h-3" /> Decline
                      </button>
                      <button 
                        onClick={() => handleApproveLeave(req.id, req.employeeName, req.leaveType)}
                        className="px-2.5 py-1 text-[10px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center gap-1 shadow-sm transition-all"
                      >
                        <Check className="w-3 h-3" /> Approve
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* NEW SECTION: Document Verification & Expiring Soon Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8 border-t border-slate-200/60 pt-8">
        
        {/* Recent / Expiring Documents */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/60 p-6 shadow-xl shadow-slate-100/30">
          <div className="border-b border-slate-100 pb-4 mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-md font-bold text-slate-900 font-display flex items-center gap-2">
                <FileText className="w-4 h-4 text-violet-600" />
                Expiring Documents & Alerts
              </h3>
              <p className="text-xs text-slate-400 font-sans mt-0.5">Documents expiring within the next 30 days.</p>
            </div>
            <button 
              onClick={() => setActiveTab('documents')}
              className="text-xs font-bold text-violet-600 hover:text-violet-800 flex items-center gap-0.5 group"
            >
              Docs Page
              <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>

          <div className="space-y-3.5">
            {documents
              .filter(d => {
                if (!d.expiryDate || d.status === 'Expired') return false;
                const daysUntilExpiry = (new Date(d.expiryDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24);
                return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
              })
              .slice(0, 4)
              .map(doc => (
                <div key={doc.id} className="p-3.5 rounded-xl border border-amber-100 bg-amber-50/30 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">{doc.documentTypeLabel}</h4>
                    <p className="text-[10px] text-slate-500">{doc.employeeName}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded uppercase tracking-wider">Expiring</span>
                    <p className="text-[10px] text-slate-500 font-mono mt-1">{new Date(doc.expiryDate!).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            {documents.filter(d => d.expiryDate && d.status !== 'Expired' && ((new Date(d.expiryDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24)) <= 30).length === 0 && (
              <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center">
                <p className="text-xs text-slate-500 italic">No documents expiring soon.</p>
              </div>
            )}
          </div>
        </div>

        {/* Pending Verification */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/60 p-6 shadow-xl shadow-slate-100/30">
          <div className="border-b border-slate-100 pb-4 mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-md font-bold text-slate-900 font-display flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Action Needed: Document Approvals
              </h3>
              <p className="text-xs text-slate-400 font-sans mt-0.5">Uploaded documents awaiting HR verification.</p>
            </div>
          </div>

          <div className="space-y-3.5">
            {documents.filter(d => d.status === 'Pending Verification').slice(0, 4).map(doc => (
              <div key={doc.id} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 flex flex-col gap-2 hover:border-violet-200 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-400" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">{doc.documentTypeLabel}</h4>
                      <p className="text-[10px] text-slate-500 font-mono">By: {doc.employeeName}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setActiveTab('documents')}
                    className="px-3 py-1 bg-white border border-slate-200 text-slate-700 hover:text-emerald-700 hover:border-emerald-200 hover:bg-emerald-50 rounded text-[10px] font-bold shadow-sm transition-all"
                  >
                    Review
                  </button>
                </div>
              </div>
            ))}
            {documents.filter(d => d.status === 'Pending Verification').length === 0 && (
              <div className="p-4 rounded-xl border border-dashed border-emerald-100 bg-emerald-50/30 text-center">
                <p className="text-xs text-emerald-700 font-medium">All caught up! No pending verifications.</p>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
