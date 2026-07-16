import React from 'react';
import { Calendar, AlertTriangle, FileText, Download } from 'lucide-react';
import { LeaveBalance, LeaveRequest } from '../types';

// Define LeaveBalanceSummary locally to avoid issues
export interface LeaveBalanceSummary {
  totalLeave: number;
  usedLeave: number;
  remainingLeave: number;
  expiringLeave: number;
  leaveTypes: LeaveBalance[];
}

export default function MyLeave({ user }: { user: any }) {
  if (!user) return <div className="p-6 text-slate-500">Loading profile...</div>;

  // Real implementation would fetch leave balances, requests, and policies
  const balances: LeaveBalanceSummary = {
    totalLeave: 24,
    usedLeave: 8,
    remainingLeave: 16,
    expiringLeave: 5,
    leaveTypes: [
      { employeeId: user.id, leaveType: 'Annual', total: 20, used: 6, remaining: 14, accrued: 14, updatedAt: '2026-07-01' },
      { employeeId: user.id, leaveType: 'Sick', total: 4, used: 2, remaining: 2, accrued: 2, updatedAt: '2026-07-01' },
    ] as LeaveBalance[]
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">My Leave</h1>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Leave', value: balances.totalLeave, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Used Leave', value: balances.usedLeave, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Remaining Leave', value: balances.remainingLeave, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Expiring Leave', value: balances.expiringLeave, color: 'text-red-600', bg: 'bg-red-50' },
        ].map((item, index) => (
          <div key={index} className={`p-4 rounded-xl ${item.bg} border border-slate-100 shadow-sm`}>
            <p className="text-xs text-slate-500 font-medium uppercase">{item.label}</p>
            <p className={`text-2xl font-bold ${item.color}`}>{item.value} days</p>
          </div>
        ))}
      </div>

      {/* Leave Balance Table */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-900">Leave Balance by Type</h3>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-6 py-3 text-left">Leave Type</th>
              <th className="px-6 py-3 text-right">Total</th>
              <th className="px-6 py-3 text-right">Used</th>
              <th className="px-6 py-3 text-right">Remaining</th>
              <th className="px-6 py-3 text-right">Usage</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {balances.leaveTypes.map((lt) => (
              <tr key={lt.leaveType}>
                <td className="px-6 py-4 font-medium text-slate-900">{lt.leaveType}</td>
                <td className="px-6 py-4 text-right">{lt.total}</td>
                <td className="px-6 py-4 text-right">{lt.used}</td>
                <td className="px-6 py-4 text-right">{lt.remaining}</td>
                <td className="px-6 py-4">
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${(lt.used / lt.total) * 100}%` }}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <button className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold flex items-center gap-2">
          <Calendar className="w-4 h-4" /> Apply for Leave
        </button>
        <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold flex items-center gap-2">
          <FileText className="w-4 h-4" /> View History
        </button>
        <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold flex items-center gap-2">
          <Download className="w-4 h-4" /> Download Report
        </button>
      </div>
    </div>
  );
}
