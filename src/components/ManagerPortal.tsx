import React, { useState, useMemo } from 'react';
import { User, Employee, AttendanceRecord, LeaveRecord, PerformanceReview, User as UserType, Department, Designation } from '../types';
import { getEmployees, getAttendance, getLeaves, getPerformanceReviews, getDepartments, getDesignations } from '../lib/storage';
import { getEmployeeDesignation, getEmployeeDepartment } from '../lib/employeeUtils';
import {
  Users, UserCheck, UserX, Clock, Calendar, CheckCircle, AlertCircle,
  FileText, Download, ChevronRight, Briefcase, Award, Star,
  Eye, ArrowRight, BarChart3, Bell, LogOut, Settings, Plus,
  TrendingUp, TrendingDown, Activity, Filter, Search
} from 'lucide-react';

interface ManagerPortalProps {
  user: UserType | null;
  departments: Department[];
  designations: Designation[];
  initialSection?: 'dashboard' | 'team' | 'attendance' | 'approvals' | 'performance' | 'onboarding';
}

export default function ManagerPortal({ user, departments, designations, initialSection = 'dashboard' }: ManagerPortalProps) {
  const [activeSection, setActiveSection] = useState<'dashboard' | 'team' | 'attendance' | 'approvals' | 'performance' | 'onboarding'>(initialSection || 'dashboard');
  const [employees] = useState<Employee[]>(getEmployees());
  const [attendance] = useState<AttendanceRecord[]>(getAttendance());
  const [leaves] = useState<LeaveRecord[]>(getLeaves());
  const [reviews] = useState<PerformanceReview[]>(getPerformanceReviews());

  if (!user || user.role !== 'Manager') {
    return <div className="p-8 text-center text-slate-500">Access denied. Manager access required.</div>;
  }

  // Get team members (employees reporting to this manager)
  const teamMembers = employees.filter(e => e.employment.reportingManagerId === user.employeeId && e.status !== 'Terminated');
  const teamIds = teamMembers.map(e => e.id);

  // Get team data
  const teamAttendance = attendance.filter(a => teamIds.includes(a.employeeId));
  const teamLeaves = leaves.filter(l => teamIds.includes(l.employeeId));
  const teamReviews = reviews.filter(r => teamIds.includes(r.employeeId));

  // Calculate stats
  const presentToday = teamAttendance.filter(a => a.date === new Date().toISOString().split('T')[0] && a.status === 'Full Day').length;
  const onLeave = teamLeaves.filter(l => l.status === 'Approved' && new Date(l.startDate) <= new Date() && new Date(l.endDate) >= new Date()).length;
  const pendingApprovals = teamLeaves.filter(l => l.status === 'Pending').length;

  const quickActions = [
    { label: 'View Team', icon: Users, color: 'bg-indigo-50 text-indigo-600', action: () => setActiveSection('team') },
    { label: 'Approve Leave', icon: Calendar, color: 'bg-emerald-50 text-emerald-600', action: () => setActiveSection('approvals') },
    { label: 'Team Attendance', icon: Clock, color: 'bg-amber-50 text-amber-600', action: () => setActiveSection('attendance') },
    { label: 'Team Performance', icon: Activity, color: 'bg-purple-50 text-purple-600', action: () => setActiveSection('performance') },
  ];

  const stats = [
    { label: 'Team Members', value: teamMembers.length, icon: Users, color: 'text-indigo-600' },
    { label: 'Present Today', value: presentToday, icon: UserCheck, color: 'text-emerald-600' },
    { label: 'On Leave', value: onLeave, icon: UserX, color: 'text-amber-600' },
    { label: 'Pending Approvals', value: pendingApprovals, icon: AlertCircle, color: 'text-rose-600' },
  ];

  const handleApproveLeave = (leaveId: string) => {
    // Update leave status to Approved
    alert('Leave approved successfully!');
  };

  const handleRejectLeave = (leaveId: string) => {
    // Update leave status to Rejected
    alert('Leave rejected.');
  };

  return (
    <div className="space-y-6">
      {/* Section selector */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveSection('dashboard')}
          className={`px-4 py-2 rounded-xl font-bold text-sm whitespace-nowrap ${
            activeSection === 'dashboard' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          Dashboard
        </button>
        <button
          onClick={() => setActiveSection('team')}
          className={`px-4 py-2 rounded-xl font-bold text-sm whitespace-nowrap ${
            activeSection === 'team' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          Team
        </button>
        <button
          onClick={() => setActiveSection('attendance')}
          className={`px-4 py-2 rounded-xl font-bold text-sm whitespace-nowrap ${
            activeSection === 'attendance' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          Attendance
        </button>
        <button
          onClick={() => setActiveSection('approvals')}
          className={`px-4 py-2 rounded-xl font-bold text-sm whitespace-nowrap ${
            activeSection === 'approvals' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          Approvals
        </button>
        <button
          onClick={() => setActiveSection('performance')}
          className={`px-4 py-2 rounded-xl font-bold text-sm whitespace-nowrap ${
            activeSection === 'performance' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          Performance
        </button>
        <button
          onClick={() => setActiveSection('onboarding')}
          className={`px-4 py-2 rounded-xl font-bold text-sm whitespace-nowrap ${
            activeSection === 'onboarding' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          Onboarding
        </button>
      </div>

      {/* Dashboard View */}
      {activeSection === 'dashboard' && (
        <div className="space-y-6">
          {/* Team Summary */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-800">Team Dashboard</h2>
            <p className="text-sm text-slate-500 mt-1">Manage your team members and approvals.</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat, idx) => (
              <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2">
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                  <p className="text-sm text-slate-500">{stat.label}</p>
                </div>
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-700 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {quickActions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={action.action}
                  className={`p-4 rounded-xl border border-slate-200 hover:shadow-md transition-all text-center`}
                >
                  <div className={`w-10 h-10 rounded-xl ${action.color} flex items-center justify-center mx-auto`}>
                    <action.icon className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-medium text-slate-700 mt-2">{action.label}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Pending Approvals Widget */}
          {pendingApprovals > 0 && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-slate-700">Pending Approvals</h3>
                <button onClick={() => setActiveSection('approvals')} className="text-sm text-indigo-600 hover:text-indigo-800">
                  View All <ArrowRight className="w-4 h-4 inline" />
                </button>
              </div>
              {teamLeaves.filter(l => l.status === 'Pending').slice(0, 3).map((leave, idx) => (
                <div key={idx} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <div>
                    <p className="font-medium">{leave.employeeName}</p>
                    <p className="text-sm text-slate-500">{leave.leaveType} • {leave.startDate} to {leave.endDate}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleRejectLeave(leave.id)} className="px-3 py-1 text-sm text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200">
                      Reject
                    </button>
                    <button onClick={() => handleApproveLeave(leave.id)} className="px-3 py-1 text-sm text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg">
                      Approve
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Team Section */}
      {activeSection === 'team' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-slate-800">My Team ({teamMembers.length})</h3>
            <button className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-indigo-700">
              <Plus className="w-4 h-4" /> Add Member
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-left">Role</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Attendance</th>
                  <th className="px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {teamMembers.map((emp) => {
                  const todayAtt = attendance.find(a => a.employeeId === emp.id && a.date === new Date().toISOString().split('T')[0]);
                  return (
                    <tr key={emp.id}>
                      <td className="px-4 py-2 font-medium">{emp.name}</td>
                      <td className="px-4 py-2">{getEmployeeDesignation(emp, designations)}</td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          emp.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {emp.status}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        {todayAtt ? (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            todayAtt.status === 'Full Day' ? 'bg-emerald-100 text-emerald-700' :
                            todayAtt.status === 'Half Day' ? 'bg-amber-100 text-amber-700' :
                            'bg-rose-100 text-rose-700'
                          }`}>
                            {todayAtt.status}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">No record</span>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        <button className="text-indigo-600 hover:text-indigo-800">
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Attendance Section */}
      {activeSection === 'attendance' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <h3 className="text-xl font-bold text-slate-800">Team Attendance</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
              <p className="text-xs text-slate-500">Present Today</p>
              <p className="text-2xl font-bold text-emerald-600">{presentToday}</p>
            </div>
            <div className="p-4 bg-rose-50 rounded-xl border border-rose-100">
              <p className="text-xs text-slate-500">Absent</p>
              <p className="text-2xl font-bold text-rose-600">{teamAttendance.filter(a => a.status === 'Absent').length}</p>
            </div>
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
              <p className="text-xs text-slate-500">Late</p>
              <p className="text-2xl font-bold text-amber-600">{teamAttendance.filter(a => a.lateMinutes > 0).length}</p>
            </div>
            <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
              <p className="text-xs text-slate-500">On Leave</p>
              <p className="text-2xl font-bold text-indigo-600">{onLeave}</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-2 text-left">Employee</th>
                  <th className="px-4 py-2 text-left">Date</th>
                  <th className="px-4 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {teamAttendance.slice(0, 10).map((record, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-2">{record.employeeName}</td>
                    <td className="px-4 py-2">{record.date}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        record.status === 'Full Day' ? 'bg-emerald-100 text-emerald-700' :
                        record.status === 'Half Day' ? 'bg-amber-100 text-amber-700' :
                        'bg-rose-100 text-rose-700'
                      }`}>
                        {record.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Approvals Section */}
      {activeSection === 'approvals' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <h3 className="text-xl font-bold text-slate-800">Leave Approvals</h3>
          <div className="space-y-3">
            {teamLeaves.filter(l => l.status === 'Pending').length === 0 ? (
              <div className="p-8 text-center text-slate-400">No pending leave requests.</div>
            ) : (
              teamLeaves.filter(l => l.status === 'Pending').map((leave) => (
                <div key={leave.id} className="p-4 border border-slate-200 rounded-xl">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold">{leave.employeeName}</p>
                      <p className="text-sm text-slate-500">{leave.leaveType}</p>
                      <p className="text-sm text-slate-500">{leave.startDate} to {leave.endDate}</p>
                      <p className="text-sm text-slate-500">Reason: {leave.reason}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleRejectLeave(leave.id)} className="px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-200 font-medium">
                        Reject
                      </button>
                      <button onClick={() => handleApproveLeave(leave.id)} className="px-4 py-2 text-sm text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl font-medium">
                        Approve
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Performance Section */}
      {activeSection === 'performance' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <h3 className="text-xl font-bold text-slate-800">Team Performance</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
              <p className="text-xs text-slate-500">Avg Score</p>
              <p className="text-2xl font-bold text-indigo-600">
                {teamReviews.length > 0 ? Math.round(teamReviews.filter(r => r.status === 'Completed').reduce((sum, r) => sum + (r.overallScore || 0), 0) / teamReviews.filter(r => r.status === 'Completed').length) : '—'}%
              </p>
            </div>
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
              <p className="text-xs text-slate-500">Reviews Done</p>
              <p className="text-2xl font-bold text-emerald-600">{teamReviews.filter(r => r.status === 'Completed').length}</p>
            </div>
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
              <p className="text-xs text-slate-500">Pending Reviews</p>
              <p className="text-2xl font-bold text-amber-600">{teamReviews.filter(r => r.status === 'In Progress').length}</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-2 text-left">Employee</th>
                  <th className="px-4 py-2 text-left">Score</th>
                  <th className="px-4 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {teamReviews.slice(0, 10).map((review, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-2">{review.employeeName}</td>
                    <td className="px-4 py-2 font-bold">{review.overallScore || '—'}%</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        review.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {review.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Onboarding Section */}
      {activeSection === 'onboarding' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <h3 className="text-xl font-bold text-slate-800">Team Onboarding</h3>
          {teamMembers.filter(e => e.status === 'Onboarding').length === 0 ? (
            <div className="p-8 text-center text-slate-400">No team members currently onboarding.</div>
          ) : (
            <div className="space-y-3">
              {teamMembers.filter(e => e.status === 'Onboarding').map((emp) => {
                const tasks = Object.values(emp.onboardingTasksStatus || {});
                const completed = tasks.filter(v => v === 'completed').length;
                const total = tasks.length;
                const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
                return (
                  <div key={emp.id} className="p-4 border border-slate-200 rounded-xl">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold">{emp.name}</p>
                        <p className="text-sm text-slate-500">{getEmployeeDesignation(emp, designations)}</p>
                      </div>
                      <span className="text-sm font-medium text-indigo-600">{progress}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2">
                      <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
