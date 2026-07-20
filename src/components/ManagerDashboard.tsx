import React from 'react';
import { Employee, LeaveRecord, AttendanceRecord } from '../types';
import { Users, UserCheck, UserX, Clock, FileText } from 'lucide-react';

interface ManagerDashboardProps {
  employees: Employee[];
  leaves: LeaveRecord[];
  attendance: AttendanceRecord[];
  user: any;
}

export default function ManagerDashboard({ employees, leaves, attendance, user }: ManagerDashboardProps) {
  // Filter employees for the manager (simple check for reportingManagerId)
  const teamMembers = employees.filter(e => e.employment.reportingManagerId === (user?.employeeId || user?.id));
  const teamIds = teamMembers.map(e => e.id);

  const teamLeaves = leaves.filter(l => teamIds.includes(l.employeeId));
  const teamAttendance = attendance.filter(a => teamIds.includes(a.employeeId));

  const presentToday = teamAttendance.filter(a => a.date === new Date().toISOString().split('T')[0] && a.status === 'Full Day').length;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-slate-900 font-sans">Manager Dashboard</h2>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm">
          <p className="text-xs font-bold text-slate-500">Team Members</p>
          <p className="text-2xl font-bold text-slate-900">{teamMembers.length}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm">
          <p className="text-xs font-bold text-slate-500">Present Today</p>
          <p className="text-2xl font-bold text-emerald-600">{presentToday}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm">
          <p className="text-xs font-bold text-slate-500">On Leave</p>
          <p className="text-2xl font-bold text-blue-600">{teamLeaves.filter(l => l.status === 'Approved').length}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm">
          <p className="text-xs font-bold text-slate-500">Pending Approvals</p>
          <p className="text-2xl font-bold text-amber-600">{teamLeaves.filter(l => l.status === 'Pending').length}</p>
        </div>
      </div>
    </div>
  );
}
