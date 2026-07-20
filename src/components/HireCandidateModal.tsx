import React, { useState, useEffect } from 'react';
import { HireDetails, Candidate, OnboardingTemplate } from '../types';
import { X, CheckCircle, ChevronRight, UserPlus } from 'lucide-react';
import { useData } from '../contexts/DataContext';

interface Props {
  candidate: Candidate;
  onClose: () => void;
  onHire: () => void;
}

export const HireCandidateModal: React.FC<Props> = ({ candidate, onClose, onHire }) => {
  const data = useData();
  const [step, setStep] = useState(1);
  const [hireDetails, setHireDetails] = useState<Partial<HireDetails>>({
    candidateId: candidate.id,
    hireDate: new Date().toISOString().split('T')[0],
    employmentType: 'Permanent',
    salary: 0,
    currency: 'USD',
    probationPeriodMonths: 3,
  });

  const [onboardingTemplates, setOnboardingTemplates] = useState<OnboardingTemplate[]>([]);

  useEffect(() => {
    let cancelled = false;
    data.getOnboardingTemplates().then(t => { if (!cancelled) setOnboardingTemplates(t); });
    return () => { cancelled = true; };
  }, [data]);

  const handleHire = async () => {
    const newHire: HireDetails = {
      ...hireDetails as HireDetails,
      employeeId: `EMP-${Date.now()}`,
      status: 'Confirmed',
      createdAt: new Date().toISOString(),
      createdBy: 'HR-ADMIN',
    };
    
    const existingHires = await data.getHires();
    await data.saveHires([...existingHires, newHire]);
    onHire();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-violet-600" />
            Hire {candidate.name}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6">
          {step === 1 && (
            <div className="space-y-4">
              <label className="block text-sm font-bold text-slate-700">Joining Date</label>
              <input type="date" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" value={hireDetails.hireDate} onChange={e => setHireDetails({...hireDetails, hireDate: e.target.value})} />
              <label className="block text-sm font-bold text-slate-700">Employment Type</label>
              <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" value={hireDetails.employmentType} onChange={e => setHireDetails({...hireDetails, employmentType: e.target.value as any})}>
                <option value="Permanent">Permanent</option>
                <option value="Contract">Contract</option>
                <option value="Intern">Intern</option>
              </select>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <label className="block text-sm font-bold text-slate-700">Salary</label>
              <input type="number" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" value={hireDetails.salary} onChange={e => setHireDetails({...hireDetails, salary: Number(e.target.value)})} />
              <label className="block text-sm font-bold text-slate-700">Onboarding Template</label>
              <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" value={hireDetails.onboardingTemplateId} onChange={e => setHireDetails({...hireDetails, onboardingTemplateId: e.target.value})}>
                <option value="">Select Template</option>
                {onboardingTemplates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          )}
        </div>

        <div className="p-5 border-t border-slate-100 flex items-center justify-between bg-slate-50">
          <button onClick={onClose} className="text-sm font-bold text-slate-500 hover:text-slate-700">Cancel</button>
          <button 
            onClick={() => step < 2 ? setStep(step + 1) : handleHire()} 
            className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-bold hover:bg-violet-700 transition-colors"
          >
            {step < 2 ? 'Next' : 'Confirm Hire'}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
