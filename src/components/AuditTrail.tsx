import { useState, useMemo } from 'react';
import { EmployeeHistoryEntry } from '../types';
import { getEmployeeHistory } from '../lib/storage';
import { Search, Filter, Download, Activity, Clock, User, ArrowRight, FileText } from 'lucide-react';

export default function AuditTrail() {
  const [history] = useState<EmployeeHistoryEntry[]>(getEmployeeHistory());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  
  const filteredHistory = useMemo(() => {
    return history.filter(entry => {
      const matchesSearch = entry.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            entry.fieldName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            entry.changedByName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesEmployee = selectedEmployee ? entry.employeeId === selectedEmployee : true;
      return matchesSearch && matchesEmployee;
    }).sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime());
  }, [history, searchTerm, selectedEmployee]);

  const uniqueEmployees = Array.from(new Set(history.map(h => JSON.stringify({ id: h.employeeId, name: h.employeeName }))))
                              .map(s => JSON.parse(s as string));

  const exportCSV = () => {
    if (filteredHistory.length === 0) return;
    const headers = ['Date', 'Employee', 'Field Changed', 'Old Value', 'New Value', 'Changed By', 'Change Type', 'Source', 'Reason'];
    const rows = filteredHistory.map(h => [
      new Date(h.changedAt).toLocaleString(),
      `"${h.employeeName}"`,
      `"${h.fieldLabel}"`,
      `"${h.oldValue}"`,
      `"${h.newValue}"`,
      `"${h.changedByName}"`,
      h.changeType,
      h.source,
      `"${h.reason || ''}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `audit_trail_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const todayChanges = history.filter(h => new Date(h.changedAt).toDateString() === new Date().toDateString()).length;
  const thisMonthChanges = history.filter(h => new Date(h.changedAt).getMonth() === new Date().getMonth() && new Date(h.changedAt).getFullYear() === new Date().getFullYear()).length;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight font-display flex items-center gap-3">
            <Activity className="w-8 h-8 text-violet-600" />
            Audit Trail
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Track and monitor all changes to employee records.</p>
        </div>
        <button onClick={exportCSV} className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md flex items-center gap-2">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase text-slate-400 tracking-wider">Total Changes</p>
            <p className="text-2xl font-black text-slate-800">{history.length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase text-slate-400 tracking-wider">Changes Today</p>
            <p className="text-2xl font-black text-slate-800">{todayChanges}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase text-slate-400 tracking-wider">Changes This Month</p>
            <p className="text-2xl font-black text-slate-800">{thisMonthChanges}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xl shadow-slate-100/50 border border-slate-200/60 overflow-hidden flex flex-col h-[600px]">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search history..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 rounded-xl text-sm font-medium transition-all"
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <div className="relative w-full md:w-64">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select 
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 rounded-xl text-sm font-medium transition-all appearance-none"
              >
                <option value="">All Employees</option>
                {uniqueEmployees.map((emp: any) => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-white sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-6 py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 border-b border-slate-100">Date & Time</th>
                <th className="px-6 py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 border-b border-slate-100">Employee</th>
                <th className="px-6 py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 border-b border-slate-100">Field Changed</th>
                <th className="px-6 py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 border-b border-slate-100">Change Details</th>
                <th className="px-6 py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 border-b border-slate-100">Changed By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-sm font-medium">No audit logs found.</td>
                </tr>
              ) : (
                filteredHistory.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-xs font-bold text-slate-800">{new Date(entry.changedAt).toLocaleDateString()}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{new Date(entry.changedAt).toLocaleTimeString()}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-xs font-bold text-slate-800">{entry.employeeName}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{entry.employeeId}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                        {entry.fieldLabel}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 max-w-xs overflow-hidden">
                        <span className="text-xs text-slate-500 line-through truncate" title={entry.oldValue}>{entry.oldValue || '—'}</span>
                        <ArrowRight className="w-3 h-3 text-slate-300 shrink-0" />
                        <span className="text-xs font-bold text-violet-600 truncate" title={entry.newValue}>{entry.newValue}</span>
                      </div>
                      {entry.reason && <p className="text-[10px] text-slate-400 mt-1 truncate" title={entry.reason}>Reason: {entry.reason}</p>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-xs font-bold text-slate-800">{entry.changedByName}</p>
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${
                        entry.changeType === 'CREATE' ? 'bg-emerald-100 text-emerald-700' :
                        entry.changeType === 'DELETE' ? 'bg-rose-100 text-rose-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {entry.changeType}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
