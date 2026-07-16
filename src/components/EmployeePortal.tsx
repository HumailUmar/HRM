import React, { useState, useMemo } from 'react';
import { User, Employee, AttendanceRecord, LeaveRecord, Payslip, PerformanceReview, EmployeeDocument, Department, Designation } from '../types';
import { getAttendance, getLeaves, getEmployeeDocuments, getPerformanceReviews } from '../lib/storage';
import { getEmployeeDesignation, getEmployeeDepartment } from '../lib/employeeUtils';
import {
  User as UserIcon, Users, Clock, Calendar, CheckCircle, AlertCircle,
  FileText, Download, ChevronRight, Briefcase, Award, Star,
  Eye, ArrowRight, BarChart3, Bell, LogOut, Settings
} from 'lucide-react';

interface EmployeePortalProps {
  user: User | null;
  employee: Employee | null;
  departments: Department[];
  designations: Designation[];
  initialSection?: 'dashboard' | 'profile' | 'attendance' | 'leave' | 'payslips' | 'onboarding' | 'performance';
}

export default function EmployeePortal({ user, employee, departments, designations, initialSection = 'dashboard' }: EmployeePortalProps) {
  const [activeSection, setActiveSection] = useState<'dashboard' | 'profile' | 'attendance' | 'leave' | 'payslips' | 'onboarding' | 'performance'>(initialSection || 'dashboard');
  const [attendance] = useState<AttendanceRecord[]>(getAttendance());
  const [leaves] = useState<LeaveRecord[]>(getLeaves());
  const [documents] = useState<EmployeeDocument[]>(getEmployeeDocuments());
  const [reviews] = useState<PerformanceReview[]>(getPerformanceReviews());

  if (!employee) {
    return <div className="p-8 text-center text-slate-500">Employee data not found.</div>;
  }

  // Get employee-specific data
  const empAttendance = attendance.filter(a => a.employeeId === employee.id);
  const empLeaves = leaves.filter(l => l.employeeId === employee.id);
  const empReviews = reviews.filter(r => r.employeeId === employee.id);
  const empDocs = documents.filter(d => d.employeeId === employee.id);

  // Calculate stats
  const presentDays = empAttendance.filter(a => a.status === 'Full Day').length;
  const absentDays = empAttendance.filter(a => a.status === 'Absent').length;
  const lateDays = empAttendance.filter(a => a.lateMinutes > 0).length;
  
  const pendingLeaves = empLeaves.filter(l => l.status === 'Pending').length;
  const approvedLeaves = empLeaves.filter(l => l.status === 'Approved').length;

  const nextReview = empReviews.filter(r => r.status === 'In Progress' || r.status === 'Draft').length > 0 
    ? 'In Progress' 
    : empReviews.filter(r => r.status === 'Completed').length > 0 
    ? 'Completed' 
    : 'Not Started';

  // Onboarding progress (if employee has onboarding template)
  const onboardingTasks = employee.onboarding.tasksStatus || {};
  const totalTasks = Object.keys(onboardingTasks).length;
  const completedTasks = Object.values(onboardingTasks).filter(v => v === 'completed').length;
  const onboardingProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const quickActions = [
    { label: 'Apply for Leave', icon: Calendar, color: 'bg-indigo-50 text-indigo-600', action: () => setActiveSection('leave') },
    { label: 'View Payslips', icon: FileText, color: 'bg-emerald-50 text-emerald-600', action: () => setActiveSection('payslips') },
    { label: 'View Attendance', icon: Clock, color: 'bg-amber-50 text-amber-600', action: () => setActiveSection('attendance') },
    { label: 'My Profile', icon: UserIcon, color: 'bg-purple-50 text-purple-600', action: () => setActiveSection('profile') },
  ];

  const stats = [
    { label: 'Present', value: presentDays, icon: CheckCircle, color: 'text-emerald-600' },
    { label: 'Absent', value: absentDays, icon: AlertCircle, color: 'text-rose-600' },
    { label: 'Late', value: lateDays, icon: Clock, color: 'text-amber-600' },
    { label: 'Leave Balance', value: `${empLeaves.filter(l => l.status === 'Approved' || l.status === 'Pending').length} used`, icon: Calendar, color: 'text-indigo-600' },
  ];

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
          onClick={() => setActiveSection('profile')}
          className={`px-4 py-2 rounded-xl font-bold text-sm whitespace-nowrap ${
            activeSection === 'profile' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          My Profile
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
          onClick={() => setActiveSection('leave')}
          className={`px-4 py-2 rounded-xl font-bold text-sm whitespace-nowrap ${
            activeSection === 'leave' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          Leave
        </button>
        <button
          onClick={() => setActiveSection('payslips')}
          className={`px-4 py-2 rounded-xl font-bold text-sm whitespace-nowrap ${
            activeSection === 'payslips' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          Payslips
        </button>
        <button
          onClick={() => setActiveSection('onboarding')}
          className={`px-4 py-2 rounded-xl font-bold text-sm whitespace-nowrap ${
            activeSection === 'onboarding' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          Onboarding
        </button>
        {/* NEW Performance button */}
        <button
          onClick={() => setActiveSection('performance')}
          className={`px-4 py-2 rounded-xl font-bold text-sm whitespace-nowrap ${
            activeSection === 'performance' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          Performance
        </button>
      </div>

      {/* Dashboard View */}
      {activeSection === 'dashboard' && (
        <div className="space-y-6">
          {/* Profile Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-violet-600 to-rose-500 text-white flex items-center justify-center font-bold text-2xl">
              {employee.name.charAt(0)}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-slate-800">{employee.name}</h2>
              <p className="text-slate-500">{getEmployeeDesignation(employee, designations)} • {getEmployeeDepartment(employee, departments)}</p>
              <p className="text-sm text-slate-400">Joined: {employee.employment.joiningDate}</p>
            </div>
            <div className="flex gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                employee.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
              }`}>
                {employee.status}
              </span>
            </div>
          </div>

          {/* Quick Stats */}
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

          {/* Recent Activity */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-700 mb-4">Recent Activity</h3>
            {empLeaves.slice(0, 3).map((leave, idx) => (
              <div key={idx} className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-0">
                <div className="w-2 h-2 rounded-full bg-indigo-400" />
                <span className="text-sm text-slate-600">Leave request for {leave.leaveType} - {leave.status}</span>
                <span className="text-xs text-slate-400 ml-auto">{new Date(leave.startDate).toLocaleDateString()}</span>
              </div>
            ))}
            {empLeaves.length === 0 && (
              <p className="text-sm text-slate-400">No recent activity.</p>
            )}
          </div>
        </div>
      )}

      {/* Profile Section */}
      {activeSection === 'profile' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <h3 className="text-xl font-bold text-slate-800">My Profile</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-500">Full Name</p>
              <p className="font-medium">{employee.name}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Email</p>
              <p className="font-medium">{employee.email}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Phone</p>
              <p className="font-medium">{employee.personal.phone}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Role</p>
              <p className="font-medium">{getEmployeeDesignation(employee, designations)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Department</p>
              <p className="font-medium">{getEmployeeDepartment(employee, departments)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Joining Date</p>
              <p className="font-medium">{employee.employment.joiningDate}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Status</p>
              <p className="font-medium">{employee.status}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Seat Number</p>
              <p className="font-medium">{employee.employment.seatNumber || 'Not assigned'}</p>
            </div>
          </div>

          {employee.education && employee.education.length > 0 && (
            <div>
              <h4 className="font-bold text-slate-700 mb-2">Education</h4>
              <div className="space-y-2">
                {employee.education.map((edu, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <p className="font-medium">{edu.degree}</p>
                    <p className="text-sm text-slate-500">{edu.institution} ({edu.yearOfGraduation})</p>
                    {edu.grade && <p className="text-sm text-slate-500">Grade: {edu.grade}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {employee.certifications && employee.certifications.length > 0 && (
            <div>
              <h4 className="font-bold text-slate-700 mb-2">Certifications</h4>
              <div className="space-y-2">
                {employee.certifications.map((cert, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <p className="font-medium">{cert.name}</p>
                    <p className="text-sm text-slate-500">{cert.issuingOrganization}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Attendance Section */}
      {activeSection === 'attendance' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <h3 className="text-xl font-bold text-slate-800">My Attendance</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
              <p className="text-xs text-slate-500">Present</p>
              <p className="text-2xl font-bold text-emerald-600">{presentDays}</p>
            </div>
            <div className="p-4 bg-rose-50 rounded-xl border border-rose-100">
              <p className="text-xs text-slate-500">Absent</p>
              <p className="text-2xl font-bold text-rose-600">{absentDays}</p>
            </div>
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
              <p className="text-xs text-slate-500">Late</p>
              <p className="text-2xl font-bold text-amber-600">{lateDays}</p>
            </div>
            <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
              <p className="text-xs text-slate-500">Total Days</p>
              <p className="text-2xl font-bold text-indigo-600">{empAttendance.length}</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-2 text-left">Date</th>
                  <th className="px-4 py-2 text-left">Check In</th>
                  <th className="px-4 py-2 text-left">Check Out</th>
                  <th className="px-4 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {empAttendance.slice(0, 10).map((record, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-2">{record.date}</td>
                    <td className="px-4 py-2">{record.checkIn || '—'}</td>
                    <td className="px-4 py-2">{record.checkOut || '—'}</td>
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

      {/* Leave Section */}
      {activeSection === 'leave' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <h3 className="text-xl font-bold text-slate-800">My Leave</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
              <p className="text-xs text-slate-500">Total Leaves</p>
              <p className="text-2xl font-bold text-indigo-600">{empLeaves.length}</p>
            </div>
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
              <p className="text-xs text-slate-500">Approved</p>
              <p className="text-2xl font-bold text-emerald-600">{approvedLeaves}</p>
            </div>
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
              <p className="text-xs text-slate-500">Pending</p>
              <p className="text-2xl font-bold text-amber-600">{pendingLeaves}</p>
            </div>
            <div className="p-4 bg-rose-50 rounded-xl border border-rose-100">
              <p className="text-xs text-slate-500">Rejected</p>
              <p className="text-2xl font-bold text-rose-600">{empLeaves.filter(l => l.status === 'Rejected').length}</p>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-slate-700 mb-2">Apply for Leave</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-500">Leave Type</label>
                <select className="w-full p-2 border rounded-lg text-sm">
                  <option>Annual Leave</option>
                  <option>Sick Leave</option>
                  <option>Casual Leave</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500">End Date</label>
                <input type="date" className="w-full p-2 border rounded-lg text-sm" />
              </div>
            </div>
            <button className="mt-3 bg-indigo-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-indigo-700">
              Submit Request
            </button>
          </div>

          <div>
            <h4 className="font-bold text-slate-700 mb-2">Leave History</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-4 py-2 text-left">Type</th>
                    <th className="px-4 py-2 text-left">Start</th>
                    <th className="px-4 py-2 text-left">End</th>
                    <th className="px-4 py-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {empLeaves.slice(0, 5).map((leave, idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-2">{leave.leaveType}</td>
                      <td className="px-4 py-2">{leave.startDate}</td>
                      <td className="px-4 py-2">{leave.endDate}</td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          leave.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' :
                          leave.status === 'Pending' ? 'bg-amber-100 text-amber-700' :
                          'bg-rose-100 text-rose-700'
                        }`}>
                          {leave.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Payslips Section */}
      {activeSection === 'payslips' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <h3 className="text-xl font-bold text-slate-800">My Payslips</h3>
          <div className="space-y-3">
            {[
              { month: 'July 2026', amount: '$4,500', status: 'Paid' },
              { month: 'June 2026', amount: '$4,500', status: 'Paid' },
              { month: 'May 2026', amount: '$4,500', status: 'Paid' },
            ].map((payslip, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 border border-slate-200 rounded-xl">
                <div>
                  <p className="font-medium">{payslip.month}</p>
                  <p className="text-sm text-slate-500">{payslip.amount}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                    {payslip.status}
                  </span>
                  <button className="text-indigo-600 hover:text-indigo-800">
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Onboarding Section */}
      {activeSection === 'onboarding' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <h3 className="text-xl font-bold text-slate-800">My Onboarding</h3>
          <div className="p-4 bg-slate-50 rounded-xl">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">Progress</span>
              <span className="text-sm font-bold text-indigo-600">{onboardingProgress}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${onboardingProgress}%` }} />
            </div>
          </div>
          <div className="space-y-3">
            {Object.entries(onboardingTasks).map(([taskId, status]) => (
              <div key={taskId} className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl">
                {status === 'completed' ? (
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                ) : (
                  <Clock className="w-5 h-5 text-amber-500" />
                )}
                <div className="flex-1">
                  <p className="font-medium">Task {taskId}</p>
                  <p className="text-sm text-slate-500">Status: {status}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== NEW Performance Section ===== */}
      {activeSection === 'performance' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <h3 className="text-xl font-bold text-slate-800">My Performance</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
              <p className="text-xs text-slate-500">Avg Score</p>
              <p className="text-2xl font-bold text-indigo-600">
                {empReviews.filter(r => r.status === 'Completed').length > 0 
                  ? Math.round(empReviews.filter(r => r.status === 'Completed').reduce((sum, r) => sum + (r.overallScore || 0), 0) / empReviews.filter(r => r.status === 'Completed').length)
                  : '—'}%
              </p>
            </div>
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
              <p className="text-xs text-slate-500">Reviews Done</p>
              <p className="text-2xl font-bold text-emerald-600">{empReviews.filter(r => r.status === 'Completed').length}</p>
            </div>
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
              <p className="text-xs text-slate-500">Pending Reviews</p>
              <p className="text-2xl font-bold text-amber-600">{empReviews.filter(r => r.status === 'In Progress').length}</p>
            </div>
            <div className="p-4 bg-rose-50 rounded-xl border border-rose-100">
              <p className="text-xs text-slate-500">Status</p>
              <p className="text-2xl font-bold text-rose-600">{nextReview}</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-2 text-left">Cycle</th>
                  <th className="px-4 py-2 text-left">Score</th>
                  <th className="px-4 py-2 text-left">Recommendation</th>
                  <th className="px-4 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {empReviews.slice(0, 5).map((review, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-2">{review.reviewCycleName}</td>
                    <td className="px-4 py-2 font-bold">{review.overallScore || '—'}%</td>
                    <td className="px-4 py-2">{review.recommendation}</td>
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
    </div>
  );
}
