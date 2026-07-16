import { useState } from 'react';
import { Briefcase, Plus, Search, MapPin, Building, Users, Calendar, MoreVertical, X, Check, ArrowRight, Trash2, Edit2, Copy, FileText, LayoutDashboard, Sliders } from 'lucide-react';
import { JobDescription, JobRequirement, EvaluationDimension, EvaluationQuestion, Employee, Department, Designation } from '../types';
import { getEmployeeDesignation } from '../lib/employeeUtils';

interface JobDescriptionsProps {
  jobDescriptions: JobDescription[];
  setJobDescriptions: (jds: JobDescription[]) => void;
  employees: Employee[];
  stageTemplates?: import('../types').StageTemplate[];
  departments: Department[];
  designations: Designation[];
}

export default function JobDescriptions({ 
  jobDescriptions, 
  setJobDescriptions, 
  employees, 
  stageTemplates = [],
  departments,
  designations
}: JobDescriptionsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'closed'>('all');
  
  const [showModal, setShowModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [editingJD, setEditingJD] = useState<JobDescription | null>(null);

  // Form State
  const [jdForm, setJdForm] = useState<Partial<JobDescription>>({
    title: '', department: '', location: '', employmentType: 'Full-time', experienceLevel: 'Mid Level',
    minSalary: 0, maxSalary: 0, currency: 'USD', closingDate: '',
    summary: '', responsibilities: [], requirements: [], benefits: [], evaluationDimensions: [],
    hiringManagerId: '', recruitingLeadId: '', interviewers: [],
    workflowStages: ['Applied', 'Under Review', 'Interview', 'Offer', 'Hired'], autoAdvance: false, requireApprovalForHire: true
  });

  const [tempResponsibility, setTempResponsibility] = useState('');
  const [tempBenefit, setTempBenefit] = useState('');
  
  const [tempReq, setTempReq] = useState<Partial<JobRequirement>>({ category: 'Skill', name: '', isRequired: true, weight: 10, priority: 'Nice to Have' });
  const [tempDim, setTempDim] = useState<Partial<EvaluationDimension>>({ name: '', description: '', weight: 20, questions: [] });
  const [tempStage, setTempStage] = useState('');

  const filteredJDs = jobDescriptions.filter(jd => {
    const matchesSearch = jd.title.toLowerCase().includes(searchTerm.toLowerCase()) || jd.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' ? true : statusFilter === 'active' ? jd.isActive : !jd.isActive;
    return matchesSearch && matchesStatus;
  });

  const handleOpenModal = (jd: JobDescription | null = null, duplicate = false) => {
    if (jd) {
      if (duplicate) {
        setJdForm({ ...jd, id: undefined, title: jd.title + ' (Copy)' });
      } else {
        setJdForm({ ...jd });
        setEditingJD(jd);
      }
    } else {
      setJdForm({
        title: '', department: '', location: '', employmentType: 'Full-time', experienceLevel: 'Mid Level',
        minSalary: 0, maxSalary: 0, currency: 'USD', closingDate: '', summary: '', responsibilities: [], requirements: [], benefits: [], evaluationDimensions: [],
        hiringManagerId: '', recruitingLeadId: '', interviewers: [], workflowStages: ['Applied', 'Under Review', 'Interview', 'Offer', 'Hired'], autoAdvance: false, requireApprovalForHire: true
      });
      setEditingJD(null);
    }
    setCurrentStep(1);
    setShowModal(true);
  };

  const handleSave = () => {
    const newJd: JobDescription = {
      ...(jdForm as JobDescription),
      id: editingJD ? editingJD.id : `JD-${Date.now()}`,
      isActive: editingJD ? editingJD.isActive : true,
      postingDate: editingJD ? editingJD.postingDate : new Date().toISOString().split('T')[0],
      totalApplications: editingJD ? editingJD.totalApplications : 0,
      candidatesInPipeline: editingJD ? editingJD.candidatesInPipeline : 0,
      averageTimeToHire: editingJD ? editingJD.averageTimeToHire : 0,
      createdAt: editingJD ? editingJD.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: editingJD ? editingJD.createdBy : 'Current User'
    };

    if (editingJD) {
      setJobDescriptions(jobDescriptions.map(jd => jd.id === newJd.id ? newJd : jd));
    } else {
      setJobDescriptions([...jobDescriptions, newJd]);
    }
    setShowModal(false);
  };

  const addReq = () => {
    if (!tempReq.name) return;
    setJdForm({ ...jdForm, requirements: [...(jdForm.requirements || []), { ...tempReq, id: `req-${Date.now()}` } as JobRequirement] });
    setTempReq({ category: 'Skill', name: '', isRequired: true, weight: 10, priority: 'Nice to Have' });
  };
  
  const addDim = () => {
    if (!tempDim.name) return;
    setJdForm({ ...jdForm, evaluationDimensions: [...(jdForm.evaluationDimensions || []), { ...tempDim, id: `dim-${Date.now()}`, questions: [] } as EvaluationDimension] });
    setTempDim({ name: '', description: '', weight: 20, questions: [] });
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in font-sans">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight font-display flex items-center gap-3">
            <Briefcase className="w-8 h-8 text-violet-600" />
            Job Descriptions
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Manage structured job requirements and evaluation criteria.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-rose-500 hover:from-violet-700 hover:to-rose-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" /> Create New JD
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by title or department..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 h-10 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 rounded-xl text-sm font-medium transition-all"
          />
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl">
          {(['all', 'active', 'closed'] as const).map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                statusFilter === status 
                  ? 'bg-white text-violet-600 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredJDs.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200/60">
            <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No job descriptions found.</p>
          </div>
        ) : (
          filteredJDs.map((jd) => (
            <div key={jd.id} className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row gap-5 items-start md:items-center">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-black text-slate-900 font-display">{jd.title}</h3>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${jd.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                    {jd.isActive ? 'Active' : 'Closed'}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500">
                  <span className="flex items-center gap-1.5"><Building className="w-3.5 h-3.5 text-slate-400" /> {jd.department}</span>
                  <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {jd.location}</span>
                  <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-slate-400" /> Posted: {jd.postingDate}</span>
                </div>
                <div className="flex flex-wrap items-center gap-6 mt-4 pt-4 border-t border-slate-100 text-xs">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Applications</p>
                    <p className="font-black text-slate-800 text-sm">{jd.totalApplications}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pipeline</p>
                    <p className="font-black text-slate-800 text-sm">{jd.candidatesInPipeline}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Requirements</p>
                    <p className="font-black text-slate-800 text-sm">{jd.requirements.length}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Dimensions</p>
                    <p className="font-black text-slate-800 text-sm">{jd.evaluationDimensions.length}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 md:w-auto w-full md:justify-end border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">
                <button onClick={() => handleOpenModal(jd)} className="p-2 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors" title="Edit">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => handleOpenModal(jd, true)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Duplicate">
                  <Copy className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => {
                    const newJds = jobDescriptions.map(j => j.id === jd.id ? { ...j, isActive: !j.isActive } : j);
                    setJobDescriptions(newJds);
                  }}
                  className={`p-2 rounded-lg transition-colors ${jd.isActive ? 'text-rose-500 hover:bg-rose-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
                  title={jd.isActive ? 'Close Job' : 'Reactivate Job'}
                >
                  <Briefcase className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl animate-scale-in">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-900 font-display">{editingJD ? 'Edit Job Description' : 'Create Job Description'}</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            
            {/* Steps Header */}
            <div className="flex overflow-x-auto bg-slate-50 border-b border-slate-100 p-4 gap-2">
              {['Basic Info', 'Responsibilities', 'Requirements', 'Evaluation', 'Team & Workflow', 'Stage Templates'].map((step, idx) => (
                <button 
                  key={idx}
                  onClick={() => setCurrentStep(idx + 1)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                    currentStep === idx + 1 
                      ? 'bg-violet-600 text-white shadow-md' 
                      : currentStep > idx + 1 ? 'bg-emerald-100 text-emerald-700' : 'bg-white text-slate-500 border border-slate-200'
                  }`}
                >
                  {idx + 1}. {step}
                </button>
              ))}
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500">Job Title</label>
                      <input type="text" value={jdForm.title} onChange={e => setJdForm({...jdForm, title: e.target.value})} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm" placeholder="e.g. Senior Frontend Engineer" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500">Department</label>
                      <input type="text" value={jdForm.department} onChange={e => setJdForm({...jdForm, department: e.target.value})} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm" placeholder="e.g. Engineering" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500">Location</label>
                      <input type="text" value={jdForm.location} onChange={e => setJdForm({...jdForm, location: e.target.value})} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500">Employment Type</label>
                      <select value={jdForm.employmentType} onChange={e => setJdForm({...jdForm, employmentType: e.target.value as any})} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm">
                        <option value="Full-time">Full-time</option><option value="Part-time">Part-time</option><option value="Contract">Contract</option><option value="Internship">Internship</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500">Experience Level</label>
                      <select value={jdForm.experienceLevel} onChange={e => setJdForm({...jdForm, experienceLevel: e.target.value as any})} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm">
                        <option value="Entry Level">Entry Level</option><option value="Mid Level">Mid Level</option><option value="Senior Level">Senior Level</option><option value="Executive">Executive</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500">Min Salary</label>
                        <input type="number" value={jdForm.minSalary} onChange={e => setJdForm({...jdForm, minSalary: Number(e.target.value)})} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500">Max Salary</label>
                        <input type="number" value={jdForm.maxSalary} onChange={e => setJdForm({...jdForm, maxSalary: Number(e.target.value)})} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1 mt-4">
                    <label className="text-xs font-bold text-slate-500">Job Summary</label>
                    <textarea value={jdForm.summary} onChange={e => setJdForm({...jdForm, summary: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl text-sm min-h-[100px]" placeholder="Brief description of the role..." />
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <label className="text-xs font-bold text-slate-500 mb-2 block">Responsibilities</label>
                    <div className="flex gap-2 mb-3">
                      <input type="text" value={tempResponsibility} onChange={e => setTempResponsibility(e.target.value)} onKeyDown={e => { if(e.key === 'Enter') { setJdForm({...jdForm, responsibilities: [...(jdForm.responsibilities||[]), tempResponsibility]}); setTempResponsibility(''); } }} className="flex-1 h-10 px-3 border border-slate-200 rounded-xl text-sm" placeholder="Add responsibility..." />
                      <button onClick={() => { if(tempResponsibility) { setJdForm({...jdForm, responsibilities: [...(jdForm.responsibilities||[]), tempResponsibility]}); setTempResponsibility(''); } }} className="px-4 h-10 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"><Plus className="w-4 h-4" /></button>
                    </div>
                    <ul className="space-y-2">
                      {jdForm.responsibilities?.map((r, i) => (
                        <li key={i} className="flex justify-between items-center p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm">
                          {r} <button onClick={() => setJdForm({...jdForm, responsibilities: jdForm.responsibilities?.filter((_, idx) => idx !== i)})} className="text-rose-500"><Trash2 className="w-4 h-4" /></button>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 mb-2 block">Benefits</label>
                    <div className="flex gap-2 mb-3">
                      <input type="text" value={tempBenefit} onChange={e => setTempBenefit(e.target.value)} onKeyDown={e => { if(e.key === 'Enter') { setJdForm({...jdForm, benefits: [...(jdForm.benefits||[]), tempBenefit]}); setTempBenefit(''); } }} className="flex-1 h-10 px-3 border border-slate-200 rounded-xl text-sm" placeholder="Add benefit..." />
                      <button onClick={() => { if(tempBenefit) { setJdForm({...jdForm, benefits: [...(jdForm.benefits||[]), tempBenefit]}); setTempBenefit(''); } }} className="px-4 h-10 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"><Plus className="w-4 h-4" /></button>
                    </div>
                    <ul className="space-y-2">
                      {jdForm.benefits?.map((b, i) => (
                        <li key={i} className="flex justify-between items-center p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm">
                          {b} <button onClick={() => setJdForm({...jdForm, benefits: jdForm.benefits?.filter((_, idx) => idx !== i)})} className="text-rose-500"><Trash2 className="w-4 h-4" /></button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="p-4 border border-violet-100 bg-violet-50/50 rounded-2xl space-y-4">
                    <h4 className="text-sm font-bold text-violet-900 font-display">Add Structured Requirement</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <select value={tempReq.category} onChange={e => setTempReq({...tempReq, category: e.target.value as any})} className="h-10 px-3 border border-violet-200 rounded-xl text-sm">
                        <option value="Skill">Skill</option><option value="Experience">Experience</option><option value="Education">Education</option><option value="Certification">Certification</option>
                      </select>
                      <input type="text" placeholder="Requirement Name (e.g. React)" value={tempReq.name} onChange={e => setTempReq({...tempReq, name: e.target.value})} className="h-10 px-3 border border-violet-200 rounded-xl text-sm md:col-span-2" />
                      
                      <div className="flex items-center gap-2">
                        <input type="checkbox" checked={tempReq.isRequired} onChange={e => setTempReq({...tempReq, isRequired: e.target.checked})} className="w-4 h-4 rounded text-violet-600" />
                        <span className="text-xs font-bold text-slate-600">Is Required?</span>
                      </div>
                      
                      <select value={tempReq.priority} onChange={e => setTempReq({...tempReq, priority: e.target.value as any})} className="h-10 px-3 border border-violet-200 rounded-xl text-sm">
                        <option value="Must Have">Must Have</option><option value="Preferred">Preferred</option><option value="Nice to Have">Nice to Have</option>
                      </select>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-600">Weight %:</span>
                        <input type="number" min="1" max="100" value={tempReq.weight} onChange={e => setTempReq({...tempReq, weight: Number(e.target.value)})} className="w-16 h-10 px-2 border border-violet-200 rounded-xl text-sm" />
                      </div>
                      
                      {tempReq.category === 'Experience' && (
                        <div className="flex items-center gap-2 md:col-span-3">
                          <span className="text-xs font-bold text-slate-600">Min Years:</span>
                          <input type="number" value={tempReq.minValue || ''} onChange={e => setTempReq({...tempReq, minValue: Number(e.target.value)})} className="w-16 h-10 px-2 border border-violet-200 rounded-xl text-sm" />
                        </div>
                      )}
                    </div>
                    <button onClick={addReq} className="px-4 py-2 bg-violet-600 text-white rounded-xl text-xs font-bold uppercase w-full">Add Requirement</button>
                  </div>

                  <div className="space-y-2">
                    {jdForm.requirements?.map((req) => (
                      <div key={req.id} className="flex flex-wrap md:flex-nowrap justify-between items-center p-3 border border-slate-200 rounded-xl">
                        <div className="flex items-center gap-3 w-full md:w-auto mb-2 md:mb-0">
                          <span className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] uppercase font-bold rounded">{req.category}</span>
                          <span className="font-bold text-sm text-slate-800">{req.name} {req.minValue ? `(${req.minValue}+ yrs)` : ''}</span>
                        </div>
                        <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                          <span className={req.isRequired ? 'text-rose-500' : 'text-slate-400'}>{req.isRequired ? 'Required' : 'Optional'}</span>
                          <span>Wt: {req.weight}%</span>
                          <span className="px-2 py-0.5 bg-violet-50 text-violet-600 rounded-full">{req.priority}</span>
                          <button onClick={() => setJdForm({...jdForm, requirements: jdForm.requirements?.filter(r => r.id !== req.id)})} className="text-rose-500 p-1"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                <div className="space-y-6">
                  <div className="p-4 border border-blue-100 bg-blue-50/50 rounded-2xl space-y-4">
                    <h4 className="text-sm font-bold text-blue-900 font-display">Add Evaluation Dimension</h4>
                    <div className="grid grid-cols-1 gap-3">
                      <input type="text" placeholder="Dimension Name (e.g. Cultural Fit)" value={tempDim.name} onChange={e => setTempDim({...tempDim, name: e.target.value})} className="h-10 px-3 border border-blue-200 rounded-xl text-sm" />
                      <textarea placeholder="Description" value={tempDim.description} onChange={e => setTempDim({...tempDim, description: e.target.value})} className="h-20 p-3 border border-blue-200 rounded-xl text-sm" />
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-600">Weight in Total Score %:</span>
                        <input type="number" min="1" max="100" value={tempDim.weight} onChange={e => setTempDim({...tempDim, weight: Number(e.target.value)})} className="w-20 h-10 px-3 border border-blue-200 rounded-xl text-sm" />
                      </div>
                    </div>
                    <button onClick={addDim} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold uppercase w-full">Add Dimension</button>
                  </div>

                  <div className="space-y-4">
                    {jdForm.evaluationDimensions?.map((dim) => (
                      <div key={dim.id} className="p-4 border border-slate-200 rounded-2xl">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h5 className="font-bold text-slate-800 flex items-center gap-2">{dim.name} <span className="text-xs px-2 py-0.5 bg-slate-100 rounded-full font-mono">{dim.weight}% Weight</span></h5>
                            <p className="text-xs text-slate-500 mt-1">{dim.description}</p>
                          </div>
                          <button onClick={() => setJdForm({...jdForm, evaluationDimensions: jdForm.evaluationDimensions?.filter(d => d.id !== dim.id)})} className="text-rose-500"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {currentStep === 5 && (
                <div className="space-y-6">
                  <h4 className="text-sm font-bold text-slate-800 font-display">Hiring Team</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500">Hiring Manager</label>
                      <select value={jdForm.hiringManagerId} onChange={e => setJdForm({...jdForm, hiringManagerId: e.target.value})} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm">
                        <option value="">Select Manager...</option>
                        {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name} ({getEmployeeDesignation(emp, designations)})</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500">Recruiting Lead</label>
                      <select value={jdForm.recruitingLeadId} onChange={e => setJdForm({...jdForm, recruitingLeadId: e.target.value})} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm">
                        <option value="">Select Recruiter...</option>
                        {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                      </select>
                    </div>
                  </div>

                  <h4 className="text-sm font-bold text-slate-800 font-display mt-6 pt-6 border-t border-slate-100">Workflow Settings</h4>
                  
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <input type="text" value={tempStage} onChange={e => setTempStage(e.target.value)} onKeyDown={e => { if(e.key === 'Enter' && tempStage) { setJdForm({...jdForm, workflowStages: [...(jdForm.workflowStages||[]), tempStage]}); setTempStage(''); } }} className="flex-1 h-10 px-3 border border-slate-200 rounded-xl text-sm" placeholder="Add custom pipeline stage..." />
                      <button onClick={() => { if(tempStage) { setJdForm({...jdForm, workflowStages: [...(jdForm.workflowStages||[]), tempStage]}); setTempStage(''); } }} className="px-4 h-10 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"><Plus className="w-4 h-4" /></button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {jdForm.workflowStages?.map((stage, idx) => (
                        <div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium">
                          {idx + 1}. {stage}
                          <button onClick={() => setJdForm({...jdForm, workflowStages: jdForm.workflowStages?.filter((_, i) => i !== idx)})} className="text-slate-400 hover:text-rose-500"><X className="w-3 h-3" /></button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3 mt-4">
                    <label className="flex items-center gap-3 p-3 border border-slate-100 rounded-xl hover:bg-slate-50 cursor-pointer">
                      <input type="checkbox" checked={jdForm.autoAdvance} onChange={e => setJdForm({...jdForm, autoAdvance: e.target.checked})} className="w-5 h-5 rounded text-violet-600" />
                      <div>
                        <span className="block text-sm font-bold text-slate-800">Auto-advance Candidates</span>
                        <span className="block text-[10px] text-slate-500">Automatically move candidates based on assessment scores.</span>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 p-3 border border-slate-100 rounded-xl hover:bg-slate-50 cursor-pointer">
                      <input type="checkbox" checked={jdForm.requireApprovalForHire} onChange={e => setJdForm({...jdForm, requireApprovalForHire: e.target.checked})} className="w-5 h-5 rounded text-violet-600" />
                      <div>
                        <span className="block text-sm font-bold text-slate-800">Require Offer Approval</span>
                        <span className="block text-[10px] text-slate-500">Require Hiring Manager sign-off before offer.</span>
                      </div>
                    </label>
                  </div>
                </div>
              )}
              {currentStep === 6 && (
                <div className="space-y-6">
                  <h4 className="text-sm font-bold text-slate-800 font-display">Map Stage Templates</h4>
                  <p className="text-xs text-slate-500 mb-4">Assign evaluation templates to your pipeline stages to enforce consistent scoring.</p>
                  <div className="space-y-4">
                    {jdForm.workflowStages?.map((stage, idx) => (
                      <div key={idx} className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <p className="text-xs font-bold text-slate-500 uppercase">Stage {idx + 1}</p>
                          <p className="font-semibold text-slate-800">{stage}</p>
                        </div>
                        <select
                          value={jdForm.stageTemplates?.[stage] || ''}
                          onChange={e => {
                            const newMap = { ...(jdForm.stageTemplates || {}) };
                            if (e.target.value) {
                              newMap[stage] = e.target.value;
                            } else {
                              delete newMap[stage];
                            }
                            setJdForm({...jdForm, stageTemplates: newMap});
                          }}
                          className="w-full md:w-64 h-10 px-3 border border-slate-200 rounded-xl text-sm"
                        >
                          <option value="">No Template (Freeform)</option>
                          {stageTemplates?.map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-between rounded-b-2xl">
              <button 
                onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase transition-all ${currentStep === 1 ? 'opacity-0 pointer-events-none' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'}`}
              >
                Back
              </button>
              
              {currentStep < 7 ? (
                <button 
                  onClick={() => setCurrentStep(prev => prev + 1)}
                  className="px-5 py-2.5 bg-slate-800 text-white hover:bg-slate-900 rounded-xl text-xs font-bold uppercase transition-all flex items-center gap-2"
                >
                  Next Step <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button 
                  onClick={handleSave}
                  className="px-6 py-2.5 bg-gradient-to-r from-violet-600 to-rose-500 text-white hover:from-violet-700 hover:to-rose-600 rounded-xl text-xs font-bold uppercase transition-all shadow-md flex items-center gap-2"
                >
                  <Check className="w-4 h-4" /> {editingJD ? 'Update Job Description' : 'Create Job Description'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
