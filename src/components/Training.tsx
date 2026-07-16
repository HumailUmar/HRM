import React, { useState } from 'react';
import { getTrainingModules, saveTrainingModules, getEmployees, getTrainingAssignments, saveTrainingAssignments, getDepartments, getDesignations } from '../lib/storage';
import { Employee, TrainingModule, TrainingAssignment, User, TrainingContentType, Department, Designation } from '../types';
import { getEmployeeDesignation, getEmployeeDepartment } from '../lib/employeeUtils';
import { Plus, Video, Link as LinkIcon, FileText, CheckSquare, Upload, Award, FileCode, UserPlus, GraduationCap, ClipboardList, TrendingUp, Users, HelpCircle, CheckCircle2 } from 'lucide-react';
import TrainingRequests from './TrainingRequests';
import TrainingEmployee from './TrainingEmployee';
import TrainingMentor from './TrainingMentor';
import TrainingAnalytics from './TrainingAnalytics';

interface TrainingProps {
  user: User | null;
  defaultTab?: 'employee' | 'hr-modules' | 'requests' | 'mentor' | 'analytics';
  departments: Department[];
  designations: Designation[];
}

export default function Training({ user, defaultTab, departments, designations }: TrainingProps) {
  const [modules, setModules] = useState<TrainingModule[]>(getTrainingModules());
  const [employees] = useState<Employee[]>(getEmployees());
  const [activeTab, setActiveTab] = useState<'employee' | 'hr-modules' | 'requests' | 'mentor' | 'analytics'>(defaultTab || 'employee');
  const [showCreate, setShowCreate] = useState(false);

  React.useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [defaultTab]);
  
  // Create Module Form states
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [contentType, setContentType] = useState<TrainingContentType>('Link');
  const [contentUrl, setContentUrl] = useState('');
  const [textContent, setTextContent] = useState('');
  const [duration, setDuration] = useState(30);
  const [mentorRequired, setMentorRequired] = useState(false);
  const [autoComplete, setAutoComplete] = useState(true);

  // Assignment fields
  const [assignTargetEmp, setAssignTargetEmp] = useState<Record<string, string>>({}); // moduleId -> employeeId
  const [assignTargetMentor, setAssignTargetMentor] = useState<Record<string, string>>({}); // moduleId -> mentorId

  const isHR = user?.role === 'HR' || user?.role === 'Admin';
  const currentEmpName = employees.find(e => e.email === user?.email)?.name || user?.email || 'HR Specialist';

  const handleAddModule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;

    const module: TrainingModule = {
      id: `MOD-${Date.now()}`,
      title: newTitle,
      description: newDescription,
      contentType,
      contentUrl: ['Link', 'EmbedVideo', 'UploadFile', 'ExternalCertification'].includes(contentType) ? contentUrl : undefined,
      textContent: contentType === 'Text' ? textContent : undefined,
      expectedDurationMinutes: duration,
      isMentorVerificationRequired: mentorRequired || ['PracticalTask', 'ExternalCertification'].includes(contentType),
      isAutoCompleteAllowed: autoComplete,
      createdBy: currentEmpName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedModules = [...modules, module];
    setModules(updatedModules);
    saveTrainingModules(updatedModules);

    // Reset Form
    setNewTitle('');
    setNewDescription('');
    setContentType('Link');
    setContentUrl('');
    setTextContent('');
    setDuration(30);
    setMentorRequired(false);
    setAutoComplete(true);
    setShowCreate(false);
    alert('Training course created successfully!');
  };

  const handleAssignModule = (moduleId: string) => {
    const empId = assignTargetEmp[moduleId];
    const mentorId = assignTargetMentor[moduleId];

    if (!empId) {
      alert('Please select an employee to assign this course.');
      return;
    }

    const employeeObj = employees.find(e => e.id === empId);
    const mentorObj = employees.find(e => e.id === mentorId);
    const modObj = modules.find(m => m.id === moduleId);

    if (!employeeObj || !modObj) return;

    const existingAssignments = getTrainingAssignments();
    
    // Check if already assigned
    const alreadyAssigned = existingAssignments.some(a => a.courseId === moduleId && a.employeeId === empId);
    if (alreadyAssigned) {
      alert('This course is already assigned to this employee.');
      return;
    }

    const newAssignment: TrainingAssignment = {
      id: `ASSIGN-${Date.now()}`,
      courseId: moduleId,
      courseTitle: modObj.title,
      employeeId: empId,
      employeeName: employeeObj.name,
      mentorId: mentorObj?.id,
      mentorName: mentorObj?.name,
      status: 'Pending',
      progress: 0,
      assignedAt: new Date().toISOString(),
      notes: 'Assigned directly by HR',
    };

    saveTrainingAssignments([...existingAssignments, newAssignment]);
    alert(`Course assigned successfully to ${employeeObj.name}!`);

    // Reset selectors
    setAssignTargetEmp(prev => ({ ...prev, [moduleId]: '' }));
    setAssignTargetMentor(prev => ({ ...prev, [moduleId]: '' }));
  };

  return (
    <div className="p-6 space-y-6">
      
      {/* Top Title & Navigation */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white/40 backdrop-blur-md p-6 rounded-2xl border border-white/50 shadow-sm">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <GraduationCap className="w-7 h-7 text-indigo-600" /> Humail Eli Learning
          </h1>
          <p className="text-slate-500 text-xs">A comprehensive professional training, mentorship, and certification tracking environment.</p>
        </div>

        {/* Responsive tabs */}
        <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('employee')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'employee' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            My Trainings
          </button>
          
          {isHR && (
            <button
              onClick={() => setActiveTab('hr-modules')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'hr-modules' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Manage Courses
            </button>
          )}

          <button
            onClick={() => setActiveTab('requests')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'requests' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Requests
          </button>

          <button
            onClick={() => setActiveTab('mentor')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'mentor' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Mentor Space
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'analytics' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Analytics
          </button>
        </div>
      </div>

      {/* RENDER ACTIVE TAB */}
      <div className="space-y-6">
        
        {/* TAB 1: EMPLOYEE VIEW */}
        {activeTab === 'employee' && (
          <TrainingEmployee user={user} />
        )}

        {/* TAB 2: HR COURSE BUILDER */}
        {activeTab === 'hr-modules' && isHR && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-white/80 backdrop-blur-md p-5 rounded-2xl border border-slate-100 shadow-sm">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Course Administration</h2>
                <p className="text-xs text-slate-400">Design curriculum paths, define certification requirements, and manually assign paths to employees.</p>
              </div>
              <button
                onClick={() => setShowCreate(!showCreate)}
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all"
              >
                <Plus className="w-4 h-4" /> Create Course Module
              </button>
            </div>

            {/* Create course form slider/card */}
            {showCreate && (
              <form onSubmit={handleAddModule} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-lg space-y-4 max-w-2xl">
                <h3 className="font-bold text-slate-800 text-sm">Add New Curriculum Course</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500">Course Title</label>
                    <input
                      type="text"
                      required
                      value={newTitle}
                      onChange={e => setNewTitle(e.target.value)}
                      placeholder="e.g. AWS Certified Practitioner Setup"
                      className="w-full p-2.5 border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500">Content / Media Type</label>
                    <select
                      value={contentType}
                      onChange={e => setContentType(e.target.value as any)}
                      className="w-full p-2.5 border border-slate-200 rounded-xl text-xs"
                    >
                      <option value="Link">External Web Link</option>
                      <option value="UploadFile">Document File Attachment</option>
                      <option value="EmbedVideo">Vimeo / YouTube Video</option>
                      <option value="Text">Rich Text Content Module</option>
                      <option value="Quiz">Interactive Question Quiz</option>
                      <option value="ExternalCertification">External Professional Certification</option>
                      <option value="PracticalTask">Practical/Sandbox Task Review</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Curriculum Description</label>
                  <textarea
                    rows={2}
                    value={newDescription}
                    onChange={e => setNewDescription(e.target.value)}
                    placeholder="Provide details about lessons and expected takeaways..."
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                {['Link', 'EmbedVideo', 'UploadFile', 'ExternalCertification'].includes(contentType) && (
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500">Resource URL / Attachment Reference</label>
                    <input
                      type="url"
                      required
                      value={contentUrl}
                      onChange={e => setContentUrl(e.target.value)}
                      placeholder="https://example.com/materials"
                      className="w-full p-2.5 border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                )}

                {contentType === 'Text' && (
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500">Module Study Text Content</label>
                    <textarea
                      rows={4}
                      value={textContent}
                      onChange={e => setTextContent(e.target.value)}
                      placeholder="Paste tutorial markdown or textual course instructions..."
                      className="w-full p-2.5 border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500">Duration (Minutes)</label>
                    <input
                      type="number"
                      value={duration}
                      onChange={e => setDuration(Number(e.target.value))}
                      className="w-full p-2 border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 pt-5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={mentorRequired}
                      onChange={e => setMentorRequired(e.target.checked)}
                      className="rounded"
                    />
                    Requires Mentor Approval
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 pt-5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoComplete}
                      onChange={e => setAutoComplete(e.target.checked)}
                      className="rounded"
                    />
                    Allow Auto-Completion
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t">
                  <button
                    type="button"
                    onClick={() => setShowCreate(false)}
                    className="px-4 py-2 border rounded-xl text-xs font-semibold hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold"
                  >
                    Save Course
                  </button>
                </div>
              </form>
            )}

            {/* List of Courses & Assignments */}
            <div className="grid gap-4">
              {modules.map(mod => (
                <div key={mod.id} className="bg-white/80 backdrop-blur-md p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-bold uppercase">{mod.contentType}</span>
                      <p className="text-[11px] text-slate-400 font-bold">ID: {mod.id}</p>
                    </div>
                    <h3 className="font-bold text-slate-800 text-base">{mod.title}</h3>
                    <p className="text-xs text-slate-500 line-clamp-1">{mod.description}</p>
                    <p className="text-[10px] text-slate-400">Created By: {mod.createdBy} • Expect: {mod.expectedDurationMinutes} min</p>
                  </div>

                  {/* Manual Assignment Form */}
                  <div className="flex flex-wrap items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-slate-400">ASSIGN TO EMPLOYEE</label>
                      <select
                        value={assignTargetEmp[mod.id] || ''}
                        onChange={e => setAssignTargetEmp({ ...assignTargetEmp, [mod.id]: e.target.value })}
                        className="p-1.5 border border-slate-200 rounded text-xs bg-white focus:outline-none"
                      >
                        <option value="">Select Employee...</option>
                        {employees
                          .filter(e => e.status !== 'Terminated')
                          .map(emp => <option key={emp.id} value={emp.id}>{emp.name} ({emp.department})</option>)}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-slate-400">ASSIGN REVIEW MENTOR</label>
                      <select
                        value={assignTargetMentor[mod.id] || ''}
                        onChange={e => setAssignTargetMentor({ ...assignTargetMentor, [mod.id]: e.target.value })}
                        className="p-1.5 border border-slate-200 rounded text-xs bg-white focus:outline-none"
                      >
                        <option value="">Select Mentor...</option>
                        {employees
                          .filter(e => e.status !== 'Terminated')
                          .map(emp => <option key={emp.id} value={emp.id}>{emp.name} ({getEmployeeDesignation(emp, designations)})</option>)}
                      </select>
                    </div>

                    <button
                      onClick={() => handleAssignModule(mod.id)}
                      className="mt-4 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs"
                    >
                      Assign Course
                    </button>
                  </div>

                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: TRAINING REQUESTS (DEPARTMENT LEADS & HR APPROVALS) */}
        {activeTab === 'requests' && (
          <TrainingRequests user={user} departments={departments} designations={designations} />
        )}

        {/* TAB 4: MENTOR SPACE (SUBMISSIONS & PROGRESS AUDITS) */}
        {activeTab === 'mentor' && (
          <TrainingMentor user={user} departments={departments} designations={designations} />
        )}

        {/* TAB 5: ANALYTICS & TREND CHARTS */}
        {activeTab === 'analytics' && (
          <TrainingAnalytics user={user} departments={departments} designations={designations} />
        )}

      </div>
    </div>
  );
}
