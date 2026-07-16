import React, { useState, useEffect } from 'react';
import { Target, Plus, Edit2, Trash2, CheckCircle2, Calendar, Award, TrendingUp, Sparkles, User, Tag, ShieldAlert } from 'lucide-react';
import { PerformanceGoal, User as UserType } from '../types';
import { getPerformanceGoals, savePerformanceGoals } from '../lib/storage';

export default function PerformanceGoals({ user }: { user: UserType | null }) {
  const [goals, setGoals] = useState<PerformanceGoal[]>([]);
  const [editingGoal, setEditingGoal] = useState<PerformanceGoal | null>(null);
  const [quickUpdateId, setQuickUpdateId] = useState<string | null>(null);
  const [quickActualValue, setQuickActualValue] = useState<number>(0);

  useEffect(() => {
    // Load and normalize goals for this employee
    const loadedGoals = getPerformanceGoals()
      .filter(g => g.employeeId === user?.employeeId)
      .map(g => ({
        ...g,
        targetValue: g.targetValue ?? 100,
        actualValue: g.actualValue ?? g.progress ?? 0,
      }));
    setGoals(loadedGoals);
  }, [user]);

  const handleSave = (goal: PerformanceGoal) => {
    // Enforce safety constraints
    const target = Math.max(1, Number(goal.targetValue) || 100);
    const actual = Math.max(0, Number(goal.actualValue) || 0);
    const computedProgress = Math.round((actual / target) * 100);

    // Auto-update status if completed or started
    let finalStatus = goal.status;
    if (actual >= target && goal.status !== 'Completed') {
      finalStatus = 'Completed';
    } else if (actual > 0 && actual < target && goal.status === 'Not Started') {
      finalStatus = 'In Progress';
    } else if (actual === 0 && goal.status === 'In Progress') {
      finalStatus = 'Not Started';
    }

    const updatedGoal: PerformanceGoal = {
      ...goal,
      targetValue: target,
      actualValue: actual,
      progress: computedProgress,
      status: finalStatus,
      updatedAt: new Date().toISOString(),
    };

    const allGoals = getPerformanceGoals();
    const isNew = !allGoals.some(g => g.id === goal.id);
    const updatedAll = isNew 
      ? [...allGoals, updatedGoal] 
      : allGoals.map(g => g.id === goal.id ? updatedGoal : g);

    setGoals(updatedAll.filter(g => g.employeeId === user?.employeeId).map(g => ({
      ...g,
      targetValue: g.targetValue ?? 100,
      actualValue: g.actualValue ?? g.progress ?? 0,
    })));
    
    savePerformanceGoals(updatedAll);
    setEditingGoal(null);
  };

  const handleQuickSave = (goal: PerformanceGoal, newActual: number) => {
    const target = Math.max(1, goal.targetValue ?? 100);
    const actual = Math.max(0, newActual);
    const computedProgress = Math.round((actual / target) * 100);

    let finalStatus = goal.status;
    if (actual >= target) {
      finalStatus = 'Completed';
    } else if (actual > 0 && actual < target && goal.status === 'Not Started') {
      finalStatus = 'In Progress';
    } else if (actual === 0 && goal.status === 'In Progress') {
      finalStatus = 'Not Started';
    }

    const updatedGoal: PerformanceGoal = {
      ...goal,
      actualValue: actual,
      progress: computedProgress,
      status: finalStatus,
      updatedAt: new Date().toISOString(),
    };

    const allGoals = getPerformanceGoals();
    const updatedAll = allGoals.map(g => g.id === goal.id ? updatedGoal : g);

    setGoals(updatedAll.filter(g => g.employeeId === user?.employeeId).map(g => ({
      ...g,
      targetValue: g.targetValue ?? 100,
      actualValue: g.actualValue ?? g.progress ?? 0,
    })));

    savePerformanceGoals(updatedAll);
    setQuickUpdateId(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this performance goal?')) {
      const allGoals = getPerformanceGoals();
      const updatedAll = allGoals.filter(g => g.id !== id);
      setGoals(updatedAll.filter(g => g.employeeId === user?.employeeId).map(g => ({
        ...g,
        targetValue: g.targetValue ?? 100,
        actualValue: g.actualValue ?? g.progress ?? 0,
      })));
      savePerformanceGoals(updatedAll);
    }
  };

  const handleAdd = () => {
    setEditingGoal({
      id: `goal-${Date.now()}`,
      employeeId: user?.employeeId || '',
      employeeName: user?.email || '',
      title: '',
      description: '',
      category: 'Performance',
      priority: 'Medium',
      targetDate: new Date().toISOString().split('T')[0],
      progress: 0,
      status: 'Not Started',
      targetValue: 100,
      actualValue: 0,
      createdBy: user?.id || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  };

  // Badge helpers
  const getCategoryStyles = (category: string) => {
    switch (category) {
      case 'Performance':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200/50';
      case 'Development':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200/50';
      case 'Career':
        return 'bg-violet-50 text-violet-700 border-violet-200/50';
      case 'Team':
        return 'bg-amber-50 text-amber-700 border-amber-200/50';
      default:
        return 'bg-rose-50 text-rose-700 border-rose-200/50';
    }
  };

  const getPriorityStyles = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'bg-rose-100 text-rose-800 font-semibold';
      case 'Medium':
        return 'bg-amber-100 text-amber-800 font-semibold';
      default:
        return 'bg-sky-100 text-sky-800 font-semibold';
    }
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20';
      case 'In Progress':
        return 'bg-indigo-500/10 text-indigo-700 border-indigo-500/20';
      case 'Delayed':
        return 'bg-amber-500/10 text-amber-700 border-amber-500/20';
      case 'Cancelled':
        return 'bg-slate-500/10 text-slate-700 border-slate-500/20';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const getProgressBarColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-emerald-500';
      case 'In Progress':
        return 'bg-indigo-600';
      case 'Delayed':
        return 'bg-amber-500';
      case 'Cancelled':
        return 'bg-slate-400';
      default:
        return 'bg-slate-300';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden p-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Target className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-lg">My Performance Goals</h3>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Track actual progress values against targets and visualize completion metrics.
          </p>
        </div>
        <button 
          onClick={handleAdd} 
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-sm shadow-indigo-100 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Set Goal
        </button>
      </div>

      {goals.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl">
          <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
            <Target className="w-6 h-6" />
          </div>
          <p className="text-slate-500 font-medium">No performance goals set yet.</p>
          <p className="text-xs text-slate-400 mt-1">Get started by defining your first goal target!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {goals.map(goal => {
            const target = goal.targetValue ?? 100;
            const actual = goal.actualValue ?? 0;
            const percent = Math.round((actual / target) * 100);

            return (
              <div 
                key={goal.id} 
                className="bg-slate-50/50 border border-slate-100 rounded-2xl p-5 hover:shadow-md hover:border-slate-200/80 transition-all duration-300 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Top Badges & Actions */}
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex flex-wrap gap-1.5 items-center">
                      <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${getCategoryStyles(goal.category)}`}>
                        {goal.category}
                      </span>
                      <span className={`px-2 py-0.5 text-[10px] uppercase tracking-wide rounded-full ${getPriorityStyles(goal.priority)}`}>
                        {goal.priority} Priority
                      </span>
                      <span className={`px-2 py-0.5 text-xs rounded-full border ${getStatusStyles(goal.status)}`}>
                        {goal.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button 
                        onClick={() => setEditingGoal(goal)} 
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-all"
                        title="Edit Goal"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(goal.id)} 
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition-all"
                        title="Delete Goal"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Title and Description */}
                  <div>
                    <h4 className="font-bold text-slate-900 text-base group-hover:text-indigo-600 transition-colors">
                      {goal.title}
                    </h4>
                    <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                      {goal.description || 'No description provided.'}
                    </p>
                  </div>

                  {/* Target Date */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Target Date: {goal.targetDate}</span>
                  </div>
                </div>

                {/* Progress Visualizer Section */}
                <div className="mt-5 pt-4 border-t border-slate-100 space-y-3">
                  <div className="flex justify-between items-end">
                    <div>
                      <span className="text-xs text-slate-400 block uppercase tracking-wider font-semibold">Goal Progress</span>
                      <span className="text-sm font-bold text-slate-800">
                        {actual} <span className="text-slate-400 font-normal">/ {target}</span>
                      </span>
                    </div>
                    <div className="text-right">
                      <span className={`text-sm font-extrabold ${percent >= 100 ? 'text-emerald-600' : 'text-indigo-600'}`}>
                        {percent}%
                      </span>
                    </div>
                  </div>

                  {/* Custom Progress Bar */}
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden relative">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ease-out ${getProgressBarColor(goal.status)}`}
                      style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
                    />
                  </div>

                  {/* Quick Actual Progress Editor */}
                  <div className="pt-2">
                    {quickUpdateId === goal.id ? (
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between gap-2 animate-fade-in">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-bold text-slate-500">Actual:</span>
                          <input 
                            type="number" 
                            min="0"
                            className="w-20 px-2 py-1 text-xs font-bold border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-800"
                            value={quickActualValue}
                            onChange={e => setQuickActualValue(Number(e.target.value))}
                          />
                        </div>
                        <div className="flex gap-1">
                          <button 
                            onClick={() => handleQuickSave(goal, quickActualValue)}
                            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold rounded-lg transition-all"
                          >
                            Save
                          </button>
                          <button 
                            onClick={() => setQuickUpdateId(null)}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] font-semibold rounded-lg transition-all"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button 
                        onClick={() => {
                          setQuickUpdateId(goal.id);
                          setQuickActualValue(goal.actualValue ?? goal.progress);
                        }}
                        className="text-xs text-indigo-600 hover:text-indigo-700 font-bold flex items-center gap-1.5 transition-colors"
                      >
                        <TrendingUp className="w-3.5 h-3.5" />
                        Quick Log Progress
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {/* Set/Edit Goal Modal */}
      {editingGoal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-slate-100">
              <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                <Target className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg">
                {editingGoal.id.startsWith('goal-') && editingGoal.title === '' ? 'Set Performance Goal' : 'Edit Performance Goal'}
              </h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">Goal Title *</label>
                <input 
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-slate-800 text-sm font-medium" 
                  placeholder="e.g. Increase Customer Satisfaction Score" 
                  value={editingGoal.title} 
                  onChange={e => setEditingGoal({...editingGoal, title: e.target.value})} 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">Description</label>
                <textarea 
                  rows={3}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-slate-800 text-sm font-medium resize-none" 
                  placeholder="Detail the actionable steps or key deliverables..." 
                  value={editingGoal.description} 
                  onChange={e => setEditingGoal({...editingGoal, description: e.target.value})} 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">Category</label>
                  <select 
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-slate-800 text-sm font-medium bg-white"
                    value={editingGoal.category}
                    onChange={e => setEditingGoal({...editingGoal, category: e.target.value as any})}
                  >
                    <option value="Performance">Performance</option>
                    <option value="Development">Development</option>
                    <option value="Career">Career</option>
                    <option value="Team">Team</option>
                    <option value="Personal">Personal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">Priority</label>
                  <select 
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-slate-800 text-sm font-medium bg-white"
                    value={editingGoal.priority}
                    onChange={e => setEditingGoal({...editingGoal, priority: e.target.value as any})}
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">Status</label>
                  <select 
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-slate-800 text-sm font-medium bg-white"
                    value={editingGoal.status}
                    onChange={e => setEditingGoal({...editingGoal, status: e.target.value as any})}
                  >
                    <option value="Not Started">Not Started</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Delayed">Delayed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">Target Date</label>
                  <input 
                    type="date"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-slate-800 text-sm font-medium"
                    value={editingGoal.targetDate}
                    onChange={e => setEditingGoal({...editingGoal, targetDate: e.target.value})}
                  />
                </div>
              </div>

              {/* Dynamic Target-Actual Numerical Fields */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">Target Value *</label>
                  <input 
                    type="number"
                    min="1"
                    className="w-full px-3.5 py-1.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-slate-800 text-sm font-bold bg-white"
                    placeholder="e.g. 100"
                    value={editingGoal.targetValue ?? 100}
                    onChange={e => {
                      const val = Math.max(1, Number(e.target.value) || 0);
                      setEditingGoal({...editingGoal, targetValue: val});
                    }}
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Goal numerical target</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">Actual Value</label>
                  <input 
                    type="number"
                    min="0"
                    className="w-full px-3.5 py-1.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-slate-800 text-sm font-bold bg-white"
                    placeholder="e.g. 0"
                    value={editingGoal.actualValue ?? 0}
                    onChange={e => {
                      const val = Math.max(0, Number(e.target.value) || 0);
                      setEditingGoal({...editingGoal, actualValue: val});
                    }}
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Value reached so far</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 mt-6 pt-3 border-t border-slate-100">
              <button 
                onClick={() => setEditingGoal(null)} 
                className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-sm font-bold transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  if (!editingGoal.title.trim()) {
                    alert('Goal Title is required.');
                    return;
                  }
                  handleSave(editingGoal);
                }} 
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-all shadow-sm shadow-indigo-100"
              >
                Save Goal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
