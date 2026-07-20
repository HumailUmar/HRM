import React, { useState, useEffect } from 'react';
import { Clock, Plus, Trash2, Edit2, Calendar, Repeat, UserPlus } from 'lucide-react';
import { Shift, ShiftAssignment, ShiftSwapRequest, ShiftTemplate } from '../types';
import { useData } from '../contexts/DataContext';

export default function ShiftManagement() {
  const data = useData();
  const [activeTab, setActiveTab] = useState<'list' | 'assignment' | 'swaps'>('list');
  const [shifts, setShifts] = useState<Shift[]>([]);

  useEffect(() => {
    let cancelled = false;
    data.getShifts().then(s => { if (!cancelled) setShifts(s); });
    return () => { cancelled = true; };
  }, [data]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Shift Management</h1>
        <div className="flex gap-2">
          {['list', 'assignment', 'swaps'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-2 rounded-xl font-bold ${activeTab === tab ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600'}`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'list' && (
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-slate-900">Shifts</h3>
            <button className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold flex items-center gap-2">
              <Plus className="w-4 h-4" /> Create New Shift
            </button>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-6 py-3 text-left">Name</th>
                <th className="px-6 py-3 text-left">Code</th>
                <th className="px-6 py-3 text-left">Start Time</th>
                <th className="px-6 py-3 text-left">End Time</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {shifts.map(shift => (
                <tr key={shift.id}>
                  <td className="px-6 py-4 font-medium">{shift.name}</td>
                  <td className="px-6 py-4 font-mono">{shift.code}</td>
                  <td className="px-6 py-4">{shift.startTime}</td>
                  <td className="px-6 py-4">{shift.endTime}</td>
                  <td className="px-6 py-4">{shift.isActive ? 'Active' : 'Inactive'}</td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-slate-500 hover:text-indigo-600 mr-2"><Edit2 className="w-4 h-4" /></button>
                    <button className="text-slate-500 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {activeTab === 'assignment' && <div className="p-6 bg-white rounded-2xl">Assignment view (to be implemented)</div>}
      {activeTab === 'swaps' && <div className="p-6 bg-white rounded-2xl">Swap requests view (to be implemented)</div>}
    </div>
  );
}
