import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { OnboardingTemplate, OnboardingTask } from '../types';
import { Plus, Trash2, Edit, Copy, Archive, CheckCircle2, AlertCircle, X, FolderKanban, Sliders, ToggleLeft, ToggleRight, Settings, Users, Sparkles, ClipboardList, Clock } from 'lucide-react';

interface OnboardingTemplatesProps {
  templates: OnboardingTemplate[];
  setTemplates: (templates: OnboardingTemplate[]) => void;
  isMockMode: boolean;
}

const DEPARTMENTS = ["Engineering", "HR", "Marketing", "Sales", "Finance", "Product", "Operations", "General"];
const ROLES = ['HR', 'IT', 'Manager', 'Employee', 'Facilities', 'Finance'];
const TRIGGER_CONDITIONS = [
  { value: 'welcomeEmailSent', label: 'Welcome Email Sent' },
  { value: 'contractSigned', label: 'Contract Signed' },
  { value: 'trainingAssigned', label: 'Training Assigned' },
  { value: 'trainingCompleted', label: 'Training Completed' },
  { value: 'feedbackSubmitted', label: 'Training Feedback Submitted' }
];

export default function OnboardingTemplates({ templates, setTemplates, isMockMode }: OnboardingTemplatesProps) {
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<OnboardingTemplate | null>(null);

  // Form states for the template
  const [templateName, setTemplateName] = useState('');
  const [templateDesc, setTemplateDesc] = useState('');
  const [templateDept, setTemplateDept] = useState('General');
  const [templateRole, setTemplateRole] = useState('');
  const [templateActive, setTemplateActive] = useState(true);
  const [templateTasks, setTemplateTasks] = useState<OnboardingTask[]>([]);

  // Task form state (inside template modal)
  const [editingTaskIndex, setEditingTaskIndex] = useState<number | null>(null);
  const [taskName, setTaskName] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskAssignedTo, setTaskAssignedTo] = useState<'HR' | 'IT' | 'Manager' | 'Employee' | 'Facilities' | 'Finance'>('HR');
  const [taskDueDays, setTaskDueDays] = useState(1);
  const [taskRequired, setTaskRequired] = useState(true);
  const [taskAutoTrigger, setTaskAutoTrigger] = useState(false);
  const [taskTriggerCond, setTaskTriggerCond] = useState('welcomeEmailSent');

  // Open modal for a new template
  const handleCreateNew = () => {
    setEditingTemplate(null);
    setTemplateName('');
    setTemplateDesc('');
    setTemplateDept('General');
    setTemplateRole('');
    setTemplateActive(true);
    setTemplateTasks([]);
    setEditingTaskIndex(null);
    clearTaskForm();
    setShowModal(true);
  };

  // Open modal to edit existing template
  const handleEdit = (tmpl: OnboardingTemplate) => {
    setEditingTemplate(tmpl);
    setTemplateName(tmpl.name);
    setTemplateDesc(tmpl.description);
    setTemplateDept(tmpl.department || 'General');
    setTemplateRole(tmpl.role || '');
    setTemplateActive(tmpl.isActive);
    setTemplateTasks([...tmpl.tasks]);
    setEditingTaskIndex(null);
    clearTaskForm();
    setShowModal(true);
  };

  // Duplicate a template
  const handleDuplicate = (tmpl: OnboardingTemplate) => {
    const duplicated: OnboardingTemplate = {
      ...tmpl,
      id: `tmpl-${Date.now()}`,
      name: `${tmpl.name} (Copy)`,
      createdAt: new Date().toISOString(),
      isActive: true
    };
    setTemplates([duplicated, ...templates]);
  };

  // Toggle active status
  const handleToggleActive = (id: string) => {
    setTemplates(templates.map(t => t.id === id ? { ...t, isActive: !t.isActive } : t));
  };

  // Save template (Insert or Update)
  const handleSaveTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateName.trim()) return;

    if (editingTemplate) {
      // Update
      const updated = templates.map(t => {
        if (t.id === editingTemplate.id) {
          return {
            ...t,
            name: templateName,
            description: templateDesc,
            department: templateDept,
            role: templateRole || undefined,
            isActive: templateActive,
            tasks: templateTasks
          };
        }
        return t;
      });
      setTemplates(updated);
    } else {
      // Insert
      const newTmpl: OnboardingTemplate = {
        id: `tmpl-${Date.now()}`,
        name: templateName,
        description: templateDesc,
        department: templateDept,
        role: templateRole || undefined,
        tasks: templateTasks,
        isActive: templateActive,
        createdBy: 'HR Specialist',
        createdAt: new Date().toISOString()
      };
      setTemplates([newTmpl, ...templates]);
    }
    setShowModal(false);
  };

  // Task form management inside the modal
  const clearTaskForm = () => {
    setTaskName('');
    setTaskDesc('');
    setTaskAssignedTo('HR');
    setTaskDueDays(1);
    setTaskRequired(true);
    setTaskAutoTrigger(false);
    setTaskTriggerCond('welcomeEmailSent');
    setEditingTaskIndex(null);
  };

  const handleAddOrUpdateTask = () => {
    if (!taskName.trim()) return;

    const newTask: OnboardingTask = {
      id: editingTaskIndex !== null ? templateTasks[editingTaskIndex].id : `task-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      taskName,
      description: taskDesc,
      assignedTo: taskAssignedTo,
      dueDaysAfterJoining: Number(taskDueDays) || 0,
      isRequired: taskRequired,
      autoTrigger: taskAutoTrigger,
      triggerCondition: taskAutoTrigger ? taskTriggerCond : undefined
    };

    if (editingTaskIndex !== null) {
      const updatedTasks = [...templateTasks];
      updatedTasks[editingTaskIndex] = newTask;
      setTemplateTasks(updatedTasks);
    } else {
      setTemplateTasks([...templateTasks, newTask]);
    }
    clearTaskForm();
  };

  const handleRemoveTask = (index: number) => {
    setTemplateTasks(templateTasks.filter((_, i) => i !== index));
    if (editingTaskIndex === index) {
      clearTaskForm();
    }
  };

  const handleEditTaskClick = (index: number) => {
    const t = templateTasks[index];
    setEditingTaskIndex(index);
    setTaskName(t.taskName);
    setTaskDesc(t.description || '');
    setTaskAssignedTo(t.assignedTo);
    setTaskDueDays(t.dueDaysAfterJoining);
    setTaskRequired(t.isRequired);
    setTaskAutoTrigger(t.autoTrigger);
    setTaskTriggerCond(t.triggerCondition || 'welcomeEmailSent');
  };

  return (
    <div className="space-y-6" id="onboarding-templates-root">
      {/* Upper Header Widget */}
      <div className="bg-[#0f0f1e] text-white p-6 md:p-8 rounded-2xl border border-slate-800/40 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <FolderKanban className="w-64 h-64 text-violet-500" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <ClipboardList className="w-5 h-5 text-violet-400" />
              <span className="text-xs font-bold uppercase tracking-widest text-violet-400 font-mono">Onboarding Blueprint</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black font-display tracking-tight text-white">
              Onboarding Templates &amp; Automation
            </h2>
            <p className="text-slate-400 text-xs md:text-sm max-w-xl font-sans mt-1">
              Configure repeatable workflows with role-specific constraints, automatic triggers, and cross-departmental tasks for incoming hires.
            </p>
          </div>
          <button
            onClick={handleCreateNew}
            className="self-start md:self-auto bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-xl px-5 py-3 text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-violet-500/10 transition-all hover:shadow-violet-500/20 hover:translate-y-[-1px] active:translate-y-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create Template
          </button>
        </div>
      </div>

      {/* Main List Table */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Sliders className="w-4.5 h-4.5 text-slate-500" />
            <h3 className="text-sm font-bold text-slate-800 font-display">Active Onboarding Templates</h3>
          </div>
          <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-bold">
            {templates.length} Templates Configured
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[10px] uppercase font-black tracking-widest text-slate-400 border-b border-slate-100 font-mono">
                <th className="py-4 px-6">Template Name</th>
                <th className="py-4 px-4">Department</th>
                <th className="py-4 px-4">Target Role</th>
                <th className="py-4 px-4 text-center">Tasks</th>
                <th className="py-4 px-4 text-center">Status</th>
                <th className="py-4 px-4">Created At</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans text-xs">
              {templates.map((tmpl) => (
                <tr key={tmpl.id} className="hover:bg-slate-50/40 transition-colors">
                  <td className="py-4 px-6">
                    <div>
                      <p className="font-extrabold text-slate-900 text-sm hover:text-violet-600 transition-colors">{tmpl.name}</p>
                      <p className="text-slate-400 text-[11px] mt-0.5 line-clamp-1">{tmpl.description}</p>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-medium text-[11px]">
                      {tmpl.department || 'General'}
                    </span>
                  </td>
                  <td className="py-4 px-4 font-mono text-[11px] text-slate-600 font-bold">
                    {tmpl.role || 'Any Role'}
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className="font-mono bg-violet-50 text-violet-700 px-2.5 py-0.5 rounded-full font-bold">
                      {tmpl.tasks.length}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <button
                      onClick={() => handleToggleActive(tmpl.id)}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold tracking-wider text-[9px] uppercase cursor-pointer border ${
                        tmpl.isActive 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${tmpl.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                      {tmpl.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="py-4 px-4 text-slate-400 font-mono text-[11px]">
                    {new Date(tmpl.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => handleEdit(tmpl)}
                        className="p-1.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors cursor-pointer"
                        title="Edit Template"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDuplicate(tmpl)}
                        className="p-1.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors cursor-pointer"
                        title="Duplicate Template"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleActive(tmpl.id)}
                        className="p-1.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors cursor-pointer"
                        title={tmpl.isActive ? 'Archive Template' : 'Activate Template'}
                      >
                        <Archive className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Template Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-900 font-display tracking-tight">
                    {editingTemplate ? 'Modify Onboarding Template' : 'Construct New Onboarding Template'}
                  </h3>
                  <p className="text-slate-500 text-[11px] font-sans">
                    Structure the automated steps, assign roles, and allocate checklists.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body / Split layouts */}
              <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Form Column (Template info & Add Task form) */}
                <form onSubmit={handleSaveTemplate} className="lg:col-span-5 space-y-4 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Template Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Remote Developer Blueprint"
                        value={templateName}
                        onChange={(e) => setTemplateName(e.target.value)}
                        className="w-full h-10 px-3 bg-white border border-slate-200 focus:outline-none focus:ring-1 focus:ring-violet-500 rounded-xl text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Description *</label>
                      <textarea
                        required
                        placeholder="Detail the target audience and objectives of this blueprint..."
                        rows={2}
                        value={templateDesc}
                        onChange={(e) => setTemplateDesc(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 focus:outline-none focus:ring-1 focus:ring-violet-500 rounded-xl text-xs resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Department</label>
                        <select
                          value={templateDept}
                          onChange={(e) => setTemplateDept(e.target.value)}
                          className="w-full h-10 px-2 bg-white border border-slate-200 focus:outline-none focus:ring-1 focus:ring-violet-500 rounded-xl text-xs text-slate-700"
                        >
                          {DEPARTMENTS.map(dept => (
                            <option key={dept} value={dept}>{dept}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Target Role (Optional)</label>
                        <input
                          type="text"
                          placeholder="e.g. Senior Frontend"
                          value={templateRole}
                          onChange={(e) => setTemplateRole(e.target.value)}
                          className="w-full h-10 px-3 bg-white border border-slate-200 focus:outline-none focus:ring-1 focus:ring-violet-500 rounded-xl text-xs"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl">
                      <div>
                        <p className="text-xs font-bold text-slate-800">Activate Immediately</p>
                        <p className="text-[10px] text-slate-400">Makes template selectable for candidate hires</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setTemplateActive(!templateActive)}
                        className="text-violet-600 hover:text-violet-800 transition-colors cursor-pointer"
                      >
                        {templateActive ? (
                          <ToggleRight className="w-10 h-10" />
                        ) : (
                          <ToggleLeft className="w-10 h-10 text-slate-300" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Submit / Cancel Buttons */}
                  <div className="flex gap-2 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="flex-1 py-2.5 border border-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-slate-50 transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition-all cursor-pointer"
                    >
                      {editingTemplate ? 'Save Changes' : 'Create Blueprint'}
                    </button>
                  </div>
                </form>

                {/* Right Form Column (Task List & Task Composer) */}
                <div className="lg:col-span-7 flex flex-col gap-4 border-l border-slate-100 pl-0 lg:pl-6">
                  {/* Task Composer Drawer */}
                  <div className="p-4 bg-slate-50 border border-slate-200/50 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <p className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-1">
                        <Sparkles className="w-4 h-4 text-violet-500" />
                        {editingTaskIndex !== null ? 'Modify Task Details' : 'Compose Workflow Task'}
                      </p>
                      {editingTaskIndex !== null && (
                        <button
                          type="button"
                          onClick={clearTaskForm}
                          className="text-[10px] text-slate-400 hover:text-rose-600 uppercase font-black tracking-wider"
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div>
                        <input
                          type="text"
                          placeholder="Task Title (e.g. Generate AWS Access)"
                          value={taskName}
                          onChange={(e) => setTaskName(e.target.value)}
                          className="w-full h-9 px-3 bg-white border border-slate-200 focus:outline-none focus:ring-1 focus:ring-violet-500 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          placeholder="Detailed task guidelines/description..."
                          value={taskDesc}
                          onChange={(e) => setTaskDesc(e.target.value)}
                          className="w-full h-9 px-3 bg-white border border-slate-200 focus:outline-none focus:ring-1 focus:ring-violet-500 rounded-lg text-xs"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[9px] font-bold uppercase text-slate-400 mb-0.5">Assigned To</label>
                          <select
                            value={taskAssignedTo}
                            onChange={(e) => setTaskAssignedTo(e.target.value as any)}
                            className="w-full h-9 px-2 bg-white border border-slate-200 focus:outline-none focus:ring-1 focus:ring-violet-500 rounded-lg text-xs text-slate-700"
                          >
                            {ROLES.map(role => (
                              <option key={role} value={role}>{role}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold uppercase text-slate-400 mb-0.5">Due Days After Joining</label>
                          <input
                            type="number"
                            min={0}
                            value={taskDueDays}
                            onChange={(e) => setTaskDueDays(Number(e.target.value))}
                            className="w-full h-9 px-2 bg-white border border-slate-200 focus:outline-none focus:ring-1 focus:ring-violet-500 rounded-lg text-xs"
                          />
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 bg-white p-2.5 border border-slate-100 rounded-xl">
                        <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-700">
                          <input
                            type="checkbox"
                            checked={taskRequired}
                            onChange={(e) => setTaskRequired(e.target.checked)}
                            className="w-3.5 h-3.5 rounded text-violet-600 focus:ring-violet-500 border-slate-200"
                          />
                          Is Required Task
                        </label>

                        <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-700">
                          <input
                            type="checkbox"
                            checked={taskAutoTrigger}
                            onChange={(e) => setTaskAutoTrigger(e.target.checked)}
                            className="w-3.5 h-3.5 rounded text-violet-600 focus:ring-violet-500 border-slate-200"
                          />
                          Automated Checklist Sync
                        </label>
                      </div>

                      {taskAutoTrigger && (
                        <div className="bg-violet-50/50 p-2.5 border border-violet-100 rounded-xl">
                          <label className="block text-[9px] font-extrabold uppercase tracking-widest text-violet-600 mb-1 font-mono">Checklist Core Trigger State Mapping</label>
                          <select
                            value={taskTriggerCond}
                            onChange={(e) => setTaskTriggerCond(e.target.value)}
                            className="w-full h-9 px-2 bg-white border border-violet-200 focus:outline-none focus:ring-1 focus:ring-violet-500 rounded-lg text-xs text-slate-700"
                          >
                            {TRIGGER_CONDITIONS.map(cond => (
                              <option key={cond.value} value={cond.value}>{cond.label}</option>
                            ))}
                          </select>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={handleAddOrUpdateTask}
                        disabled={!taskName.trim()}
                        className="w-full py-2 bg-violet-600 hover:bg-violet-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      >
                        {editingTaskIndex !== null ? 'Update Blueprint Task' : 'Inject Task Into Blueprint'}
                      </button>
                    </div>
                  </div>

                  {/* Tasks List */}
                  <div className="flex-1 flex flex-col min-h-0 bg-slate-50/50 border border-slate-100 rounded-2xl p-4 overflow-hidden">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-mono mb-3">
                      Tasks Sequence List ({templateTasks.length} tasks)
                    </p>

                    <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                      {templateTasks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-center space-y-2">
                          <ClipboardList className="w-8 h-8 text-slate-300 stroke-[1.5]" />
                          <p className="text-slate-400 text-xs italic font-medium">No tasks defined. Compose tasks above to build the blueprint.</p>
                        </div>
                      ) : (
                        templateTasks.map((task, idx) => (
                          <div
                            key={task.id || idx}
                            onClick={() => handleEditTaskClick(idx)}
                            className={`p-3 bg-white border rounded-xl flex items-start justify-between cursor-pointer transition-all hover:shadow-sm ${
                              editingTaskIndex === idx ? 'border-violet-400 ring-1 ring-violet-400' : 'border-slate-100'
                            }`}
                          >
                            <div className="flex-1 min-w-0 pr-2">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-black">#{idx + 1}</span>
                                <p className="text-xs font-black text-slate-800 truncate">{task.taskName}</p>
                                {task.isRequired && (
                                  <span className="text-[8px] font-black text-rose-500 bg-rose-50 border border-rose-100 rounded px-1 uppercase tracking-widest">Required</span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-400 truncate mt-0.5">{task.description}</p>
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[9px] text-slate-500 font-mono">
                                <span className="flex items-center gap-0.5">
                                  <Users className="w-3 h-3 text-slate-400" />
                                  Role: {task.assignedTo}
                                </span>
                                <span className="flex items-center gap-0.5">
                                  <Clock className="w-3 h-3 text-slate-400" />
                                  Due: Day {task.dueDaysAfterJoining}
                                </span>
                                {task.autoTrigger && (
                                  <span className="bg-violet-50 text-violet-600 px-1.5 py-0.2 rounded font-semibold flex items-center gap-0.5">
                                    <Sparkles className="w-2.5 h-2.5 text-violet-500" />
                                    Autosync: {task.triggerCondition}
                                  </span>
                                )}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveTask(idx);
                              }}
                              className="p-1.5 text-slate-300 hover:text-rose-600 rounded-lg transition-colors hover:bg-rose-50"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
