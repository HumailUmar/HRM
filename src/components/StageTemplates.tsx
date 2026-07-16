import { useState } from 'react';
import { StageTemplate, StageQuestion } from '../types';
import { Plus, Edit, Trash2, Copy, Shield, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface Props {
  templates: StageTemplate[];
  setTemplates: (templates: StageTemplate[]) => void;
}

export default function StageTemplates({ templates, setTemplates }: Props) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-slate-900 font-display">Stage Templates</h3>
          <p className="text-sm text-slate-500 mt-1">Manage customizable screening questions and evaluation scorecards for different hiring stages.</p>
        </div>
        <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create Template
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/60 rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Total Templates</p>
            <p className="text-2xl font-black text-slate-800">{templates.length}</p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200/60 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200/60">
              <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Template Name</th>
              <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Order</th>
              <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Questions</th>
              <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Passing Score</th>
              <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/60">
            {templates.map(t => (
              <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="py-3 px-4">
                  <div className="font-semibold text-slate-800">{t.name}</div>
                  <div className="text-xs text-slate-500">{t.description}</div>
                </td>
                <td className="py-3 px-4 text-sm text-slate-600 font-mono">{t.order}</td>
                <td className="py-3 px-4 text-sm text-slate-600">{t.questions.length}</td>
                <td className="py-3 px-4">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {t.passingScore}
                  </span>
                </td>
                <td className="py-3 px-4">
                  {t.isActive ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">Active</span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">Inactive</span>
                  )}
                  {t.isDefault && <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">Default</span>}
                </td>
                <td className="py-3 px-4 text-right space-x-2">
                  <button className="p-1 text-slate-400 hover:text-indigo-600 transition-colors" title="Edit"><Edit className="w-4 h-4" /></button>
                  <button className="p-1 text-slate-400 hover:text-indigo-600 transition-colors" title="Duplicate"><Copy className="w-4 h-4" /></button>
                  <button className="p-1 text-slate-400 hover:text-rose-600 transition-colors" title="Archive"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
