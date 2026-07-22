import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Shift, ShiftAssignment, Employee } from '../types';
import { useData } from '../contexts/DataContext';
import { generateUUID } from '../lib/idHelper';

const emptyForm = { name: '', code: '', startTime: '09:00', endTime: '17:00' };

export default function ShiftManagement() {
  const data = useData();
  const [activeTab, setActiveTab] = useState<'list' | 'assignment' | 'swaps'>('list');
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [assignments, setAssignments] = useState<ShiftAssignment[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [assignmentForm, setAssignmentForm] = useState({ employeeId: '', shiftId: '', date: new Date().toISOString().split('T')[0] });
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const loadShifts = async () => setShifts(await data.getShifts());
  const loadAssignments = async () => setAssignments(await data.getShiftAssignments());

  useEffect(() => {
    let cancelled = false;
    Promise.all([data.getShifts(), data.getEmployees(), data.getShiftAssignments()]).then(([loadedShifts, loadedEmployees, loadedAssignments]) => {
      if (!cancelled) { setShifts(loadedShifts); setEmployees(loadedEmployees); setAssignments(loadedAssignments); }
    }).catch(() => { if (!cancelled) setMessage('Unable to load shift data.'); });
    return () => { cancelled = true; };
  }, [data]);

  const createShift = async () => {
    const name = form.name.trim();
    const code = form.code.trim();
    if (!name || !code || !/^\d{2}:\d{2}$/.test(form.startTime) || !/^\d{2}:\d{2}$/.test(form.endTime)) { setMessage('Name, code, and valid start/end times are required.'); return; }
    if (form.endTime <= form.startTime) { setMessage('End time must be after start time.'); return; }
    const now = new Date().toISOString();
    const shift: Shift = { id: generateUUID('SHIFT-'), name, code, description: '', startTime: form.startTime, endTime: form.endTime, breakDurationMinutes: 0, totalWorkHours: (Date.parse(`1970-01-01T${form.endTime}:00Z`) - Date.parse(`1970-01-01T${form.startTime}:00Z`)) / 3600000, workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], isRotating: false, shiftDifferential: 0, nightShiftAllowance: 0, applicableDepartments: [], isActive: true, createdAt: now, updatedAt: now };
    try { await data.saveShifts([...shifts, shift]); setForm(emptyForm); setShowForm(false); setMessage('Shift created successfully.'); await loadShifts(); } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to save shift.'); }
  };

  const createAssignment = async () => {
    const employee = employees.find(item => item.id === assignmentForm.employeeId);
    const shift = shifts.find(item => item.id === assignmentForm.shiftId);
    if (!employee || !shift || !/^\d{4}-\d{2}-\d{2}$/.test(assignmentForm.date)) { setMessage('Employee, shift, and a valid date are required.'); return; }
    if (assignments.some(item => item.employeeId === employee.id && item.date === assignmentForm.date)) { setMessage('Employee already has an assignment for this date.'); return; }
    const assignment: ShiftAssignment = { id: generateUUID('ASSIGN-'), employeeId: employee.id, employeeName: employee.name, shiftId: shift.id, shiftName: shift.name, date: assignmentForm.date, startTime: shift.startTime, endTime: shift.endTime, status: 'Scheduled' };
    try { await data.saveShiftAssignments([...assignments, assignment]); setMessage('Shift assignment saved successfully.'); await loadAssignments(); } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to save assignment.'); }
  };

  return <div className="p-6 space-y-6">
    <div className="flex justify-between items-center"><h1 className="text-2xl font-bold text-slate-900">Shift Management</h1><div className="flex gap-2">{(['list', 'assignment', 'swaps'] as const).map(tab => <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-xl font-bold ${activeTab === tab ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600'}`}>{tab.charAt(0).toUpperCase() + tab.slice(1)}</button>)}</div></div>
    {message && <p role="status" className="text-sm text-slate-700">{message}</p>}
    {activeTab === 'list' && <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden"><div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center"><h3 className="font-bold text-slate-900">Shifts</h3><button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold flex items-center gap-2"><Plus className="w-4 h-4" /> Create New Shift</button></div>{showForm && <div className="p-6 grid grid-cols-4 gap-3 border-b"><input className="border rounded p-2" placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /><input className="border rounded p-2" placeholder="Code" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} /><input className="border rounded p-2" type="time" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} /><input className="border rounded p-2" type="time" value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })} /><button onClick={createShift} className="bg-emerald-600 text-white rounded p-2">Save Shift</button></div>}<table className="w-full text-sm"><thead className="bg-slate-50 text-slate-500"><tr><th className="px-6 py-3 text-left">Name</th><th className="px-6 py-3 text-left">Code</th><th className="px-6 py-3 text-left">Start Time</th><th className="px-6 py-3 text-left">End Time</th><th className="px-6 py-3 text-left">Status</th></tr></thead><tbody className="divide-y divide-slate-100">{shifts.map(shift => <tr key={shift.id}><td className="px-6 py-4 font-medium">{shift.name}</td><td className="px-6 py-4 font-mono">{shift.code}</td><td className="px-6 py-4">{shift.startTime}</td><td className="px-6 py-4">{shift.endTime}</td><td className="px-6 py-4">{shift.isActive ? 'Active' : 'Inactive'}</td></tr>)}</tbody></table></div>}
    {activeTab === 'assignment' && <div className="p-6 bg-white rounded-2xl space-y-4"><h2 className="font-bold">Assign Employee Shift</h2><div className="grid grid-cols-3 gap-3"><select className="border rounded p-2" value={assignmentForm.employeeId} onChange={e => setAssignmentForm({ ...assignmentForm, employeeId: e.target.value })}><option value="">Select employee</option>{employees.map(employee => <option key={employee.id} value={employee.id}>{employee.name}</option>)}</select><select className="border rounded p-2" value={assignmentForm.shiftId} onChange={e => setAssignmentForm({ ...assignmentForm, shiftId: e.target.value })}><option value="">Select shift</option>{shifts.filter(shift => shift.isActive).map(shift => <option key={shift.id} value={shift.id}>{shift.name}</option>)}</select><input className="border rounded p-2" type="date" value={assignmentForm.date} onChange={e => setAssignmentForm({ ...assignmentForm, date: e.target.value })} /></div><button onClick={createAssignment} className="bg-indigo-600 text-white rounded px-4 py-2">Save Assignment</button><ul className="divide-y">{assignments.map(item => <li key={item.id} className="py-2">{item.date} — {item.employeeName} — {item.shiftName}</li>)}</ul></div>}
    {activeTab === 'swaps' && <div className="p-6 bg-white rounded-2xl">Swap requests view (to be implemented)</div>}
  </div>;
}
