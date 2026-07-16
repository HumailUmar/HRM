import { useState } from 'react';
import { InterviewPanel, Candidate } from '../types';
import { Calendar, Clock, Video, UserPlus, CheckCircle2, XCircle } from 'lucide-react';

interface Props {
  panels: InterviewPanel[];
  setPanels: (panels: InterviewPanel[]) => void;
  candidates: Candidate[];
}

export default function InterviewPanels({ panels, setPanels, candidates }: Props) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-slate-900 font-display">Interview Panels</h3>
          <p className="text-sm text-slate-500 mt-1">Schedule and manage upcoming candidate interviews.</p>
        </div>
        <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Schedule Interview
        </button>
      </div>
      
      <div className="bg-white border border-slate-200/60 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200/60">
              <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Candidate</th>
              <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Stage</th>
              <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date & Time</th>
              <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Interviewers</th>
              <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/60">
            {panels.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-sm text-slate-500">No interviews scheduled.</td>
              </tr>
            )}
            {panels.map(p => {
              const candidate = candidates.find(c => c.id === p.candidateId);
              return (
                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-800">{candidate?.name || 'Unknown Candidate'}</div>
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-600">{p.stageId}</td>
                  <td className="py-3 px-4 text-sm text-slate-600 font-mono">
                    <div className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5"/> {p.scheduledDate}</div>
                    <div className="flex items-center gap-1 mt-0.5"><Clock className="w-3.5 h-3.5"/> {p.scheduledTime}</div>
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-600">{p.interviewers.length} Assigned</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      p.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                      p.status === 'Scheduled' ? 'bg-indigo-100 text-indigo-800' :
                      p.status === 'In Progress' ? 'bg-amber-100 text-amber-800' :
                      'bg-rose-100 text-rose-800'
                    }`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right space-x-2">
                    <button className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">Edit</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
