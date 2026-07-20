import React, { useState, useEffect } from 'react';
import { Settings, Plus, Trash2, Edit } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { ExitChecklistTemplate, ExitInterviewTemplate, ExitProcessStage, SettlementConfig } from '../types';

export default function ExitManagementConfig() {
  const data = useData();
  const [checklistTemplates, setChecklistTemplates] = useState<ExitChecklistTemplate[]>([]);
  const [interviewTemplates, setInterviewTemplates] = useState<ExitInterviewTemplate[]>([]);
  const [stages, setStages] = useState<ExitProcessStage[]>([]);
  const [settlementConfig, setSettlementConfig] = useState<SettlementConfig | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      data.getExitChecklistTemplates(),
      data.getExitInterviewTemplates(),
      data.getExitProcessStages(),
      data.getSettlementConfig()
    ]).then(([checklists, interviews, procStages, settlement]) => {
      if (!cancelled) {
        setChecklistTemplates(checklists);
        setInterviewTemplates(interviews);
        setStages(procStages);
        setSettlementConfig(settlement);
      }
    });
    return () => { cancelled = true; };
  }, [data]);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Exit Management Configuration</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Checklist Management */}
        <div className="bg-white p-6 rounded-xl shadow space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2"><Settings size={20}/> Clearance Checklists</h2>
          {checklistTemplates.map(t => (
            <div key={t.id} className="flex justify-between items-center border-b p-2">
              <span>{t.name}</span>
              <div className="flex gap-2">
                <Edit size={16} />
                <Trash2 size={16} />
              </div>
            </div>
          ))}
          <button className="text-indigo-600 flex items-center gap-2"><Plus size={16} /> Add Checklist Template</button>
        </div>

        {/* Exit Interview Management */}
        <div className="bg-white p-6 rounded-xl shadow space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2"><Settings size={20}/> Exit Interview Templates</h2>
          {interviewTemplates.map(t => (
            <div key={t.id} className="flex justify-between items-center border-b p-2">
              <span>{t.name}</span>
              <div className="flex gap-2">
                <Edit size={16} />
                <Trash2 size={16} />
              </div>
            </div>
          ))}
          <button className="text-indigo-600 flex items-center gap-2"><Plus size={16} /> Add Interview Template</button>
        </div>

        {/* Process Stages */}
        <div className="bg-white p-6 rounded-xl shadow space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2"><Settings size={20}/> Process Stages</h2>
          {stages.sort((a,b) => a.order - b.order).map(s => (
            <div key={s.id} className="flex justify-between items-center border-b p-2">
              <span>{s.order}. {s.name}</span>
              <span>{s.responsibleRole}</span>
            </div>
          ))}
          <button className="text-indigo-600 flex items-center gap-2"><Plus size={16} /> Add Stage</button>
        </div>

        {/* Settlement Config */}
        <div className="bg-white p-6 rounded-xl shadow space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2"><Settings size={20}/> Settlement Configuration</h2>
          {settlementConfig && (
            <div className="space-y-2">
              <div>Leave Encashment: {settlementConfig.leaveEncashmentPercentage}%</div>
              <div>Gratuity: {settlementConfig.gratuityPercentage}%</div>
              <div>Bonus: {settlementConfig.bonusPercentage}%</div>
            </div>
          )}
          <button className="bg-indigo-600 text-white px-4 py-2 rounded-xl">Save Settings</button>
        </div>
      </div>
    </div>
  );
}
