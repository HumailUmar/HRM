import { useState, FormEvent, useEffect } from 'react';
import { LeaveRecord, Employee, Department, Designation } from '../types';
import { getEmployeeDepartment } from '../lib/employeeUtils';
import { Calendar, Check, X, FileText, Plus, Search, Filter, AlertCircle, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { useData } from '../contexts/DataContext';

export default function Leaves() {
  const data = useData();
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [isMockMode, setIsMockMode] = useState(true);

  useEffect(() => {
    async function loadData() {
      const [l, e, d, des, s] = await Promise.all([
        data.getLeaves(),
        data.getEmployees(),
        data.getDepartments(),
        data.getDesignations(),
        data.getSettings()
      ]);
      setLeaves(l);
      setEmployees(e);
      setDepartments(d);
      setDesignations(des);
      setIsMockMode(s.isMockMode);
    }
    loadData();
  }, [data]);

  const onAddLeave = async (newLeave: LeaveRecord) => {
    const previous = leaves;
    const updated = [newLeave, ...previous];
    setLeaves(updated);
    try {
      await data.saveLeave(newLeave);
      window.dispatchEvent(new CustomEvent('hrm:data-changed', { detail: { entity: 'leaves' } }));
    } catch (error) {
      setLeaves(previous);
      throw error;
    }
  };

  const onUpdateLeaveStatus = async (id: string, status: 'Approved' | 'Rejected', approver: string) => {
    const previous = leaves;
    const updated = previous.map(l => l.id === id
      ? { ...l, status, approvedBy: approver, approvedAt: new Date().toISOString() }
      : l);
    setLeaves(updated);
    try {
      const changed = updated.find(l => l.id === id);
      if (changed) {
        await data.saveLeave(changed);
        window.dispatchEvent(new CustomEvent('hrm:data-changed', { detail: { entity: 'leaves' } }));
      }
    } catch (error) {
      setLeaves(previous);
      throw error;
    }
  };

  const [filterStatus, setFilterStatus] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [leaveType, setLeaveType] = useState('Casual Leave');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Stats calculation
  const totalRequests = leaves.length;
  const pendingRequests = leaves.filter(l => l.status === 'Pending').length;
  const approvedRequests = leaves.filter(l => l.status === 'Approved').length;
  const rejectedRequests = leaves.filter(l => l.status === 'Rejected').length;

  const filteredLeaves = leaves.filter(leave => {
    const matchesStatus = filterStatus === 'All' || leave.status === filterStatus;
    const empName = leave.employeeName?.toLowerCase() || "";
    const matchesSearch = empName.includes(searchQuery.toLowerCase()) || leave.leaveType?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleCreateLeave = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!selectedEmployeeId) {
      setFormError('Please select an employee.');
      return;
    }
    if (!startDate || !endDate) {
      setFormError('Please select both start and end dates.');
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      setFormError('Start date cannot be after the end date.');
      return;
    }
    if (!reason.trim()) {
      setFormError('Please provide a reason for the leave.');
      return;
    }

    const employee = employees.find(e => e.id === selectedEmployeeId);
    if (!employee) {
      setFormError('Selected employee is invalid.');
      return;
    }

    const newLeave: LeaveRecord = {
      id: `LR-${Date.now().toString().slice(-4)}`,
      employeeId: employee.id,
      employeeName: employee.name,
      leaveType,
      startDate,
      endDate,
      reason,
      status: 'Pending'
    };

    setIsSubmitting(true);
    try {
      await onAddLeave(newLeave);
      setShowAddModal(false);
      // Reset form
      setSelectedEmployeeId('');
      setLeaveType('Casual Leave');
      setStartDate('');
      setEndDate('');
      setReason('');
    } catch (err: any) {
      setFormError(err.message || 'Failed to submit leave request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h2 className="text-2xl font-bold font-sans text-slate-900 tracking-tight">Leave Management</h2>
          <p className="text-sm text-slate-500 font-sans mt-0.5 font-medium">
            Monitor, approve, and record employee leaves with {isMockMode ? 'local sandbox storage' : 'synchronized Google Sheets data'}.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-all shadow-md shadow-indigo-600/15 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Request Leave
        </button>
      </div>

      {/* Dashboard Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/60 p-4 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-indigo-500" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Requests</p>
            <p className="text-lg font-bold text-slate-800">{totalRequests}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/60 p-4 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
            <Clock className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Pending Approval</p>
            <p className="text-lg font-bold text-slate-800">{pendingRequests}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/60 p-4 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Approved Leaves</p>
            <p className="text-lg font-bold text-slate-800">{approvedRequests}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/60 p-4 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
            <XCircle className="w-5 h-5 text-rose-500" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Rejected Requests</p>
            <p className="text-lg font-bold text-slate-800">{rejectedRequests}</p>
          </div>
        </div>
      </div>

      {/* Interactive Controls & Filters */}
      <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex gap-1.5 bg-slate-50 p-1 rounded-xl self-start">
            {(['All', 'Pending', 'Approved', 'Rejected'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                  filterStatus === status
                    ? 'bg-white text-slate-800 shadow-sm font-bold'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
            />
          </div>
        </div>

        {/* Leaves Table */}
        <div className="overflow-x-auto border border-slate-100 rounded-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-5 py-3 text-[10px] font-bold uppercase text-slate-400 font-sans tracking-wider">Employee</th>
                <th className="px-5 py-3 text-[10px] font-bold uppercase text-slate-400 font-sans tracking-wider">Leave Type</th>
                <th className="px-5 py-3 text-[10px] font-bold uppercase text-slate-400 font-sans tracking-wider">Duration</th>
                <th className="px-5 py-3 text-[10px] font-bold uppercase text-slate-400 font-sans tracking-wider">Reason</th>
                <th className="px-5 py-3 text-[10px] font-bold uppercase text-slate-400 font-sans tracking-wider text-center">Status</th>
                <th className="px-5 py-3 text-[10px] font-bold uppercase text-slate-400 font-sans tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLeaves.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-xs text-slate-400 font-sans">
                    No matching leave requests found.
                  </td>
                </tr>
              ) : (
                filteredLeaves.map((leave) => {
                  const emp = employees.find(e => e.id === leave.employeeId);
                  return (
                    <tr key={leave.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
                            {leave.employeeName?.charAt(0) || "E"}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800">{leave.employeeName}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{leave.employeeId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs font-semibold text-slate-700">{leave.leaveType}</span>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-xs font-medium text-slate-600">{leave.startDate} to {leave.endDate}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {Math.ceil((new Date(leave.endDate).getTime() - new Date(leave.startDate).getTime()) / (1000 * 3600 * 24)) + 1} day(s)
                        </p>
                      </td>
                      <td className="px-5 py-4 max-w-xs">
                        <p className="text-xs text-slate-500 truncate" title={leave.reason}>{leave.reason}</p>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className={`inline-flex px-2 py-0.5 text-[10px] font-bold rounded-full ${
                          leave.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' :
                          leave.status === 'Rejected' ? 'bg-rose-100 text-rose-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {leave.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        {leave.status === 'Pending' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => onUpdateLeaveStatus(leave.id, 'Approved', 'HR Administrator')}
                              className="p-1 text-emerald-600 hover:text-white hover:bg-emerald-600 rounded transition-all"
                              title="Approve Leave"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onUpdateLeaveStatus(leave.id, 'Rejected', 'HR Administrator')}
                              className="p-1 text-rose-600 hover:text-white hover:bg-rose-600 rounded transition-all"
                              title="Reject Leave"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] font-medium text-slate-400">
                            Closed by {leave.approvedBy || 'HR'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Request Leave Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 font-sans flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-600" />
                Submit New Leave Request
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateLeave} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 font-sans">Select Employee</label>
                <select
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-600"
                >
                  <option value="">Choose Employee...</option>
                  {employees.filter(e => e.status !== 'Terminated').map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.id}) - {getEmployeeDepartment(emp, departments)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 font-sans">Leave Type</label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-600"
                >
                  <option value="Casual Leave">Casual Leave</option>
                  <option value="Sick Leave">Sick Leave</option>
                  <option value="Annual Leave">Annual Leave</option>
                  <option value="Unpaid Leave">Unpaid Leave</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 font-sans">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 font-sans">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 font-sans">Reason / Justification</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  placeholder="Provide context or recovery requirements..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
