import React, { useState, useEffect } from 'react';
import { 
  Employee, ExitRecord, LeaveRecord, LeavePolicy, Department, Designation 
} from '../types';
import { 
  getEmployees, saveEmployees, getExitRecords, saveExitRecords, 
  getLeaves, getLeavePolicies 
} from '../lib/storage';
import { 
  User, Calendar, CheckCircle, XCircle, AlertCircle, 
  FileText, Download, Plus, Search, Filter, Trash2,
  Clock, Briefcase, LogOut, UserX
} from 'lucide-react';

interface ExitManagementProps {
  user?: any;
  employees: Employee[];
  setEmployees: (emps: Employee[]) => void;
}

export default function ExitManagement({ user, employees, setEmployees }: ExitManagementProps) {
  const [exitRecords, setExitRecords] = useState<ExitRecord[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'active' | 'initiated' | 'completed'>('active');
  const [loading, setLoading] = useState(false);

  // ============================================================
  //  REAL LEAVE BALANCE CALCULATION
  // ============================================================
  const calculateLeaveBalance = (employeeId: string): {
    total: number;
    used: number;
    remaining: number;
    pending: number;
  } => {
    // 1. Get all leave records for this employee
    const allLeaves = getLeaves();
    const employeeLeaves = allLeaves.filter(l => l.employeeId === employeeId);

    // 2. Get the leave policy (default to annual leave quota)
    const policies = getLeavePolicies();
    const defaultPolicy = policies.find(p => p.isDefault) || policies[0];
    const annualQuota = defaultPolicy?.quota || 20; // Default 20 days if no policy

    // 3. Count used leaves (Approved + status is not Rejected/Cancelled)
    const usedLeaves = employeeLeaves.filter(l => 
      l.status === 'Approved' && l.leaveType === 'Annual'  // Only count Annual leaves
    );
    const usedDays = usedLeaves.reduce((sum, l) => {
      const start = new Date(l.startDate);
      const end = new Date(l.endDate);
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      return sum + days;
    }, 0);

    // 4. Count pending leaves
    const pendingLeaves = employeeLeaves.filter(l => 
      l.status === 'Pending' && l.leaveType === 'Annual'
    );
    const pendingDays = pendingLeaves.reduce((sum, l) => {
      const start = new Date(l.startDate);
      const end = new Date(l.endDate);
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      return sum + days;
    }, 0);

    // 5. Calculate remaining
    const remaining = Math.max(0, annualQuota - usedDays - pendingDays);

    return {
      total: annualQuota,
      used: usedDays,
      remaining: remaining,
      pending: pendingDays,
    };
  };

  // Calculate leave balance for the selected employee
  const selectedEmployee = employees.find(e => e.id === selectedEmployeeId);
  const leaveBalance = selectedEmployeeId 
    ? calculateLeaveBalance(selectedEmployeeId) 
    : { total: 0, used: 0, remaining: 0, pending: 0 };

  // Load exit records
  useEffect(() => {
    setExitRecords(getExitRecords());
  }, []);

  // Get active employees (not terminated)
  const activeEmployees = employees.filter(e => 
    e.status !== 'Terminated' && e.status !== 'Resigned'
  );

  // Get employees with exit initiated
  const initiatedExits = exitRecords.filter(r => 
    r.status !== 'Completed' && r.status !== 'Cancelled'
  );

  // Get completed exits
  const completedExits = exitRecords.filter(r => 
    r.status === 'Completed'
  );

  // ============================================================
  //  INITIATE EXIT PROCESS
  // ============================================================
  const handleInitiateExit = (employeeId: string) => {
    const emp = employees.find(e => e.id === employeeId);
    if (!emp) return;

    const reason = prompt('Reason for exit (optional):') || '';
    const lastWorkingDate = prompt('Last working date (YYYY-MM-DD):');
    if (!lastWorkingDate) return;

    const newExitRecord: ExitRecord = {
      id: `EXIT-${Date.now()}`,
      employeeId: emp.id,
      employeeName: emp.name,
      initiatedBy: 'currentUser', // Replace with actual user from auth
      initiatedByName: 'Current User',
      initiatedAt: new Date().toISOString(),
      status: 'Initiated',
      checklistItems: [
        { itemId: 'IT-001', itemName: 'Asset Handover', status: 'Pending' },
        { itemId: 'IT-002', itemName: 'NDA Renewal', status: 'Pending' },
        { itemId: 'IT-003', itemName: 'Final Settlement', status: 'Pending' },
        { itemId: 'IT-004', itemName: 'Exit Interview', status: 'Pending' },
      ],
      interviewResponses: [],
      settlement: null,
      resignationDate: new Date().toISOString(),
      lastWorkingDate: lastWorkingDate,
      reason: reason,
      notes: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [...exitRecords, newExitRecord];
    setExitRecords(updated);
    saveExitRecords(updated);
    alert(`Exit process initiated for ${emp.name}`);
  };

  // ============================================================
  //  UPDATE EXIT STATUS
  // ============================================================
  const handleUpdateExit = (id: string, status: ExitRecord['status']) => {
    const updated = exitRecords.map(r => 
      r.id === id ? { ...r, status, updatedAt: new Date().toISOString() } : r
    );
    setExitRecords(updated);
    saveExitRecords(updated);

    // If completed, update employee status to 'Terminated'
    if (status === 'Completed') {
      const record = exitRecords.find(r => r.id === id);
      if (record) {
        const updatedEmployees = employees.map(e => 
          e.id === record.employeeId ? { ...e, status: 'Terminated' as any } : e
        );
        setEmployees(updatedEmployees);
        saveEmployees(updatedEmployees);
      }
    }
  };

  const handleUpdateChecklist = (recordId: string, itemId: string, status: 'Pending' | 'In Progress' | 'Completed') => {
    const updated = exitRecords.map(r => {
      if (r.id !== recordId) return r;
      return {
        ...r,
        checklistItems: r.checklistItems.map(item =>
          item.itemId === itemId ? { ...item, status } : item
        ),
        updatedAt: new Date().toISOString(),
      };
    });
    setExitRecords(updated);
    saveExitRecords(updated);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-800">Exit Management</h2>
        <div className="flex items-center gap-2">
          <select
            value={selectedEmployeeId}
            onChange={(e) => setSelectedEmployeeId(e.target.value)}
            className="border rounded-lg p-2 text-sm min-w-[200px]"
          >
            <option value="">Select employee...</option>
            {activeEmployees.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.name} ({emp.employment.designationId || emp.role})</option>
            ))}
          </select>
          <button
            onClick={() => {
              if (!selectedEmployeeId) {
                alert('Please select an employee first.');
                return;
              }
              const emp = employees.find(e => e.id === selectedEmployeeId);
              if (emp && window.confirm(`Initiate exit process for ${emp.name}?`)) {
                handleInitiateExit(selectedEmployeeId);
              }
            }}
            className="flex items-center gap-2 bg-rose-600 text-white px-4 py-2 rounded-xl hover:bg-rose-700"
          >
            <LogOut className="w-4 h-4" /> Initiate Exit
          </button>
        </div>
      </div>

      {/* Employee Info & Leave Balance */}
      {selectedEmployee && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-800">{selectedEmployee.name}</h3>
              <p className="text-sm text-slate-500">{selectedEmployee.employment.designationId || selectedEmployee.role}</p>
              <p className="text-sm text-slate-500">Status: {selectedEmployee.status}</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Leave Balance</p>
              <div className="grid grid-cols-4 gap-4 mt-1">
                <div>
                  <p className="text-xs text-slate-400">Total</p>
                  <p className="text-xl font-bold text-slate-800">{leaveBalance.total} days</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Used</p>
                  <p className="text-xl font-bold text-amber-600">{leaveBalance.used} days</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Pending</p>
                  <p className="text-xl font-bold text-indigo-600">{leaveBalance.pending} days</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Remaining</p>
                  <p className={`text-xl font-bold ${leaveBalance.remaining > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {leaveBalance.remaining} days
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('active')}
          className={`px-4 py-2 rounded-xl text-sm font-medium ${
            activeTab === 'active' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          Active Employees ({activeEmployees.length})
        </button>
        <button
          onClick={() => setActiveTab('initiated')}
          className={`px-4 py-2 rounded-xl text-sm font-medium ${
            activeTab === 'initiated' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          Initiated ({initiatedExits.length})
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`px-4 py-2 rounded-xl text-sm font-medium ${
            activeTab === 'completed' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          Completed ({completedExits.length})
        </button>
      </div>

      {/* Active Employees */}
      {activeTab === 'active' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Role</th>
                  <th className="px-4 py-3 text-left">Department</th>
                  <th className="px-4 py-3 text-left">Joined</th>
                  <th className="px-4 py-3 text-left">Leave Balance</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeEmployees.map(emp => {
                  const balance = calculateLeaveBalance(emp.id);
                  return (
                    <tr key={emp.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-800">{emp.name}</td>
                      <td className="px-4 py-3">{emp.employment.designationId || emp.role}</td>
                      <td className="px-4 py-3">{emp.employment.departmentId || emp.department}</td>
                      <td className="px-4 py-3">{emp.employment.joiningDate}</td>
                      <td className="px-4 py-3">
                        <span className={`font-medium ${balance.remaining > 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {balance.remaining} days left
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => {
                            if (window.confirm(`Initiate exit for ${emp.name}?`)) {
                              handleInitiateExit(emp.id);
                            }
                          }}
                          className="text-rose-600 hover:text-rose-800 text-sm font-medium"
                        >
                          Initiate Exit
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

      {/* Initiated Exits */}
      {activeTab === 'initiated' && (
        <div className="space-y-4">
          {initiatedExits.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center text-slate-500">
              <UserX className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p>No exit processes initiated.</p>
            </div>
          ) : (
            initiatedExits.map(record => {
              const emp = employees.find(e => e.id === record.employeeId);
              const allDone = record.checklistItems.every(item => item.status === 'Completed');
              return (
                <div key={record.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">{record.employeeName}</h3>
                      <p className="text-sm text-slate-500">{emp?.employment.designationId || emp?.role}</p>
                      <p className="text-sm text-slate-500">Last Working Date: {record.lastWorkingDate}</p>
                      <p className="text-sm text-slate-500">Status: <span className={`font-medium ${
                        record.status === 'Completed' ? 'text-emerald-600' : 'text-amber-600'
                      }`}>{record.status}</span></p>
                    </div>
                    <div className="flex items-center gap-2">
                      {allDone && record.status !== 'Completed' && (
                        <button
                          onClick={() => {
                            if (window.confirm('Mark this exit as completed?')) {
                              handleUpdateExit(record.id, 'Completed');
                            }
                          }}
                          className="bg-emerald-600 text-white px-4 py-2 rounded-xl hover:bg-emerald-700"
                        >
                          Complete Exit
                        </button>
                      )}
                      <button
                        onClick={() => {
                          if (window.confirm('Cancel this exit process?')) {
                            handleUpdateExit(record.id, 'Cancelled');
                          }
                        }}
                        className="bg-rose-600 text-white px-4 py-2 rounded-xl hover:bg-rose-700"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>

                  {/* Checklist */}
                  <div className="mt-4">
                    <h4 className="font-semibold text-slate-700 mb-2">Checklist</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {record.checklistItems.map(item => (
                        <div key={item.itemId} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                          {item.status === 'Completed' ? (
                            <CheckCircle className="w-4 h-4 text-emerald-500" />
                          ) : item.status === 'In Progress' ? (
                            <Clock className="w-4 h-4 text-amber-500" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-rose-500" />
                          )}
                          <span className="flex-1 text-sm">{item.itemName}</span>
                          <select
                            value={item.status}
                            onChange={(e) => handleUpdateChecklist(record.id, item.itemId, e.target.value as any)}
                            className="text-xs border rounded px-2 py-1"
                          >
                            <option value="Pending">Pending</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Settlement Info */}
                  {record.settlement && (
                    <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <h4 className="font-semibold text-slate-700 mb-2">Settlement Summary</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-slate-500">Total Amount</p>
                          <p className="font-bold text-slate-800">${record.settlement.totalAmount}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Leave Encashment</p>
                          <p className="font-bold text-slate-800">${record.settlement.leaveEncashment}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Gratuity</p>
                          <p className="font-bold text-slate-800">${record.settlement.gratuity}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Deductions</p>
                          <p className="font-bold text-slate-800">${record.settlement.deductions}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Completed Exits */}
      {activeTab === 'completed' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left">Employee</th>
                  <th className="px-4 py-3 text-left">Completed</th>
                  <th className="px-4 py-3 text-left">Last Working Day</th>
                  <th className="px-4 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {completedExits.map(record => (
                  <tr key={record.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">{record.employeeName}</td>
                    <td className="px-4 py-3">{new Date(record.completedAt || '').toLocaleDateString()}</td>
                    <td className="px-4 py-3">{record.lastWorkingDate}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                        Completed
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
