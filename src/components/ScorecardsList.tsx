import { useState } from 'react';
import { EvaluationScorecard, Candidate } from '../types';
import { CheckCircle2, ShieldAlert, Star, Activity } from 'lucide-react';

interface Props {
  scorecards: EvaluationScorecard[];
  candidates: Candidate[];
}

export default function ScorecardsList({ scorecards, candidates }: Props) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-slate-900 font-display">Evaluation Scorecards</h3>
          <p className="text-sm text-slate-500 mt-1">Review interview feedback and final evaluation scores.</p>
        </div>
      </div>
      
      <div className="bg-white border border-slate-200/60 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200/60">
              <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Candidate</th>
              <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Stage</th>
              <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Interviewer</th>
              <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Overall Score</th>
              <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Recommendation</th>
              <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/60">
            {scorecards.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-sm text-slate-500">No scorecards submitted yet.</td>
              </tr>
            )}
            {scorecards.map(s => {
              const candidate = candidates.find(c => c.id === s.candidateId);
              return (
                <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-800">{candidate?.name || 'Unknown Candidate'}</div>
                    <div className="text-xs text-slate-500">{new Date(s.submittedAt).toLocaleDateString()}</div>
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-600">{s.stageId}</td>
                  <td className="py-3 px-4 text-sm text-slate-600">{s.interviewerName}</td>
                  <td className="py-3 px-4">
                    <span className="font-mono font-bold text-slate-800">{s.overallScore}/100</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      s.recommendation === 'Advance' ? 'bg-emerald-100 text-emerald-800' :
                      s.recommendation === 'Consider' ? 'bg-amber-100 text-amber-800' :
                      'bg-rose-100 text-rose-800'
                    }`}>
                      {s.recommendation}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right space-x-2">
                    <button className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">View Full</button>
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
