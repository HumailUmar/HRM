import React, { useState, useMemo } from 'react';
import { Designation, Department, Employee } from '../types';
import { useData } from '../contexts/DataContext';
import { getEmployeeDesignation } from '../lib/employeeUtils';
import { Search, Plus, Edit, Trash2, Award, Briefcase, HelpCircle, ChevronRight, X, Layers, Users, DollarSign, LayoutGrid, List, ChevronDown, CheckCircle, AlertTriangle } from 'lucide-react';

interface DesignationsProps {
  designations: Designation[];
  setDesignations: (dsgs: Designation[]) => void;
  departments: Department[];
  employees: Employee[];
}

export default function Designations({
  designations,
  setDesignations,
  departments,
  employees
}: DesignationsProps) {
  const data = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'hierarchy'>('list');

  // Modal State
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editingDesignation, setEditingDesignation] = useState<Designation | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDepartmentId, setFormDepartmentId] = useState('');
  const [formLevel, setFormLevel] = useState(3);
  const [formCategory, setFormCategory] = useState<Designation['category']>('Staff');
  const [formReportsToId, setFormReportsToId] = useState('');
  const [formMinSalary, setFormMinSalary] = useState('');
  const [formMaxSalary, setFormMaxSalary] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);

  // Delete Warning state
  const [dsgToDelete, setDsgToDelete] = useState<Designation | null>(null);

  // Filtered designations list
  const filteredDesignations = useMemo(() => {
    return designations.filter(dsg => {
      const matchSearch = 
        dsg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dsg.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dsg.category.toLowerCase().includes(searchTerm.toLowerCase());
      return matchSearch;
    });
  }, [designations, searchTerm]);

  // Reports to candidates (excluding self to avoid circular hierarchy)
  const reportsToCandidates = useMemo(() => {
    return designations.filter(d => !editingDesignation || d.id !== editingDesignation.id);
  }, [designations, editingDesignation]);

  // Open modal for adding
  const handleOpenAddModal = () => {
    setEditingDesignation(null);
    setFormName('');
    setFormCode('');
    setFormDescription('');
    setFormDepartmentId('');
    setFormLevel(3);
    setFormCategory('Staff');
    setFormReportsToId('');
    setFormMinSalary('');
    setFormMaxSalary('');
    setFormIsActive(true);
    setShowAddEditModal(true);
  };

  // Open modal for editing
  const handleOpenEditModal = (dsg: Designation, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingDesignation(dsg);
    setFormName(dsg.name);
    setFormCode(dsg.code);
    setFormDescription(dsg.description);
    setFormDepartmentId(dsg.departmentId || '');
    setFormLevel(dsg.level);
    setFormCategory(dsg.category);
    setFormReportsToId(dsg.reportingToDesignationId || '');
    setFormMinSalary(dsg.minSalary ? String(dsg.minSalary) : '');
    setFormMaxSalary(dsg.maxSalary ? String(dsg.maxSalary) : '');
    setFormIsActive(dsg.isActive);
    setShowAddEditModal(true);
  };

  // Save Designation Form
  const handleSaveDesignation = async (e: React.FormEvent) => {
    e.preventDefault();
    const previousDesignations = designations;
    let designationToPersist: Designation | null = null;
    if (!formName.trim() || !formCode.trim()) return;

    if (editingDesignation) {
      // Edit
      setDesignations(designations.map(d => {
        if (d.id === editingDesignation.id) {
          return {
            ...d,
            name: formName,
            code: formCode.toUpperCase(),
            description: formDescription,
            departmentId: formDepartmentId || undefined,
            level: formLevel,
            category: formCategory,
            reportingToDesignationId: formReportsToId || undefined,
            minSalary: formMinSalary ? Number(formMinSalary) : undefined,
            maxSalary: formMaxSalary ? Number(formMaxSalary) : undefined,
            isActive: formIsActive,
            updatedAt: new Date().toISOString()
          };
        }
        return d;
      }));
      designationToPersist = designations.find(designation => designation.id === editingDesignation.id)
        ? { ...designations.find(designation => designation.id === editingDesignation.id)!, name: formName, code: formCode.toUpperCase(), description: formDescription, departmentId: formDepartmentId || undefined, level: formLevel, category: formCategory, reportingToDesignationId: formReportsToId || undefined, minSalary: formMinSalary ? Number(formMinSalary) : undefined, maxSalary: formMaxSalary ? Number(formMaxSalary) : undefined, isActive: formIsActive, updatedAt: new Date().toISOString() }
        : null;
    } else {
      // Add
      const newDsg: Designation = {
        id: `DSGN-${Date.now().toString().slice(-4)}`,
        name: formName,
        code: formCode.toUpperCase(),
        description: formDescription,
        departmentId: formDepartmentId || undefined,
        level: formLevel,
        category: formCategory,
        reportingToDesignationId: formReportsToId || undefined,
        minSalary: formMinSalary ? Number(formMinSalary) : undefined,
        maxSalary: formMaxSalary ? Number(formMaxSalary) : undefined,
        isActive: formIsActive,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setDesignations([...designations, newDsg]);
      designationToPersist = newDsg;
    }
    if (designationToPersist) {
      try {
        await data.saveDesignation(designationToPersist);
      } catch (error) {
        setDesignations(previousDesignations);
        return;
      }
    }
    setShowAddEditModal(false);
  };

  // Initiate delete with modal warning
  const handleInitiateDelete = (dsg: Designation, e: React.MouseEvent) => {
    e.stopPropagation();
    setDsgToDelete(dsg);
  };

  // Confirm delete
  const handleConfirmDelete = async () => {
    if (!dsgToDelete) return;
    const previousDesignations = designations;

    // Delete designation
    const updatedDesignations = designations
      .filter(d => d.id !== dsgToDelete.id)
      .map(d => {
        if (d.reportingToDesignationId === dsgToDelete.id) {
          return { ...d, reportingToDesignationId: undefined };
        }
        return d;
      });
    setDesignations(updatedDesignations);
    try {
      await data.saveDesignation({ ...dsgToDelete, isActive: false, updatedAt: new Date().toISOString() });
    } catch (error) {
      setDesignations(previousDesignations);
      return;
    }

    setDsgToDelete(null);
  };

  // Find Department name helper
  const getDeptName = (deptId?: string) => {
    if (!deptId) return 'All Departments / Shared';
    return departments.find(d => d.id === deptId)?.name || 'Unknown Department';
  };

  // Find reports to name helper
  const getReportsToName = (reportingToId?: string) => {
    if (!reportingToId) return 'None (Top Level)';
    const reporter = designations.find(d => d.id === reportingToId);
    return reporter ? `${reporter.name} (${reporter.code})` : 'Unknown Role';
  };

  // count active employees matching this designation name
  const getDesignationEmpCount = (dsgName: string) => {
    return employees.filter(e => getEmployeeDesignation(e, designations).toLowerCase() === dsgName.toLowerCase() && e.status === 'Active').length;
  };

  // Hierarchy calculations: Nodes organized by grade level descending
  const sortedLevels = useMemo(() => {
    // Collect all present levels
    const levels = Array.from(new Set(designations.map(d => d.level))).sort((a, b) => b - a);
    return levels;
  }, [designations]);

  return (
    <div className="space-y-6 animate-fade-in" id="designations-management-container">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white/70 backdrop-blur-md p-6 rounded-3xl border border-slate-100 shadow-sm" id="designation-header">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight font-display">Designation & Role Architect</h2>
          <p className="text-xs text-slate-500 font-medium">Define job levels, establish reporting structures, govern salary brackets, and map operational functions.</p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Switcher */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'list' 
                  ? 'bg-white text-slate-800 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              id="view-list-mode-btn"
            >
              <List className="w-4 h-4" />
              List View
            </button>
            <button
              onClick={() => setViewMode('hierarchy')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'hierarchy' 
                  ? 'bg-white text-slate-800 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              id="view-hierarchy-mode-btn"
            >
              <Layers className="w-4 h-4" />
              Hierarchy Tree
            </button>
          </div>

          <button
            onClick={handleOpenAddModal}
            className="px-5 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider text-white bg-gradient-to-r from-violet-600 to-rose-500 hover:opacity-95 shadow-lg shadow-violet-500/20 transition-all duration-300 flex items-center gap-2"
            id="add-designation-btn"
          >
            <Plus className="w-4 h-4" />
            Add Designation
          </button>
        </div>
      </div>

      {/* Main View Panel */}
      {viewMode === 'list' ? (
        /* ================= LIST VIEW ================= */
        <div className="space-y-4" id="designations-list-panel">
          {/* Search bar & Stats */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white/50 backdrop-blur-md p-4 rounded-2xl border border-slate-100/80 shadow-sm">
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search designations by name, code, category..."
                className="w-full pl-10 pr-4 py-2 rounded-xl text-xs border border-slate-200 bg-white/70 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
                id="dsg-search-input"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
              <span>Roles Defined: <span className="text-violet-600 font-extrabold">{designations.length}</span></span>
              <span>Active Levels: <span className="text-emerald-500 font-extrabold">{sortedLevels.length}</span></span>
            </div>
          </div>

          {/* Designations Table */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden" id="dsg-table-container">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70">
                    <th className="py-4 px-6 text-[10px] font-bold uppercase tracking-wider text-slate-400">Designation</th>
                    <th className="py-4 px-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Grade Level</th>
                    <th className="py-4 px-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Category</th>
                    <th className="py-4 px-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Default Division</th>
                    <th className="py-4 px-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Salary Band (Monthly)</th>
                    <th className="py-4 px-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Reports To</th>
                    <th className="py-4 px-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Status</th>
                    <th className="py-4 px-6 text-[10px] font-bold uppercase tracking-wider text-slate-400 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredDesignations.length > 0 ? (
                    filteredDesignations.map(dsg => {
                      const empCount = getDesignationEmpCount(dsg.name);
                      return (
                        <tr key={dsg.id} className="hover:bg-slate-50/40 transition-colors">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center font-bold">
                                <Award className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-slate-800">{dsg.name}</span>
                                  <span className="px-1.5 py-0.5 rounded text-[8px] font-mono font-bold bg-slate-100 text-slate-500">
                                    {dsg.code}
                                  </span>
                                </div>
                                <span className="text-[10px] text-slate-400 font-bold block">{empCount} active employee{empCount !== 1 ? 's' : ''}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className="px-2.5 py-1 bg-violet-50 text-violet-700 rounded-lg text-xs font-black font-mono">
                              Level {dsg.level}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                              dsg.category === 'Executive' ? 'bg-purple-100 text-purple-700' :
                              dsg.category === 'Management' ? 'bg-blue-100 text-blue-700' :
                              dsg.category === 'Senior Staff' ? 'bg-indigo-100 text-indigo-700' :
                              dsg.category === 'Staff' ? 'bg-emerald-100 text-emerald-700' :
                              dsg.category === 'Entry Level' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {dsg.category}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-xs text-slate-600 font-semibold">{getDeptName(dsg.departmentId)}</span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-1 text-xs font-bold text-slate-700 font-mono">
                              <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                              <span>{dsg.minSalary?.toLocaleString() || 'N/A'} - {dsg.maxSalary?.toLocaleString() || 'N/A'}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-xs font-semibold text-slate-500">{getReportsToName(dsg.reportingToDesignationId)}</span>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              dsg.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
                            }`}>
                              {dsg.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleOpenEditModal(dsg)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-violet-600 hover:bg-violet-50 transition-all"
                                title="Edit Designation"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => handleInitiateDelete(dsg, e)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-all"
                                title="Delete Designation"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} className="text-center py-16 text-slate-400">
                        <Briefcase className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                        <p className="text-xs font-bold">No designations match your search.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* ================= HIERARCHY TREE VIEW ================= */
        <div className="bg-white/80 backdrop-blur-md rounded-3xl border border-slate-100 p-6 shadow-sm space-y-6" id="designations-hierarchy-panel">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-md font-bold text-slate-800">Organizational Grade Hierarchy</h3>
            <p className="text-xs text-slate-500">Designations ordered by reporting levels (10 down to 1). Connecting indicators map escalation pathways.</p>
          </div>

          <div className="space-y-6" id="hierarchy-levels-cascade">
            {sortedLevels.map(lvl => {
              const lvlDesignations = designations.filter(d => d.level === lvl);
              if (lvlDesignations.length === 0) return null;

              return (
                <div key={lvl} className="relative flex flex-col md:flex-row md:items-start gap-4 p-4 rounded-2xl bg-slate-50/50 border border-slate-100">
                  {/* Left Side: Level Identifier */}
                  <div className="md:w-32 shrink-0">
                    <span className="px-3 py-1 bg-violet-600 text-white rounded-lg text-xs font-black font-mono block text-center shadow-sm">
                      Grade Lvl {lvl}
                    </span>
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase font-mono mt-1 block text-center">
                      {lvl >= 9 ? 'Executive Suite' : lvl >= 7 ? 'Management' : lvl >= 4 ? 'Senior Staff' : lvl >= 2 ? 'Operations' : 'Entry & Intern'}
                    </span>
                  </div>

                  {/* Right Side: Cards representing roles at this Level */}
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {lvlDesignations.map(dsg => {
                      const activeStaff = getDesignationEmpCount(dsg.name);
                      return (
                        <div
                          key={dsg.id}
                          className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm hover:shadow transition-all relative group flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-1">
                              <span className="px-1.5 py-0.5 rounded text-[8px] font-mono font-bold bg-slate-100 text-slate-600">
                                {dsg.code}
                              </span>
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                                dsg.category === 'Executive' ? 'bg-purple-50 text-purple-600' :
                                dsg.category === 'Management' ? 'bg-blue-50 text-blue-600' :
                                dsg.category === 'Senior Staff' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'
                              }`}>
                                {dsg.category}
                              </span>
                            </div>

                            <h4 className="text-xs font-black text-slate-800 mt-2.5">{dsg.name}</h4>
                            <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">{dsg.description || 'No description provided.'}</p>
                          </div>

                          <div className="mt-3.5 pt-2 border-t border-slate-50 flex items-center justify-between text-[10px]">
                            <div className="text-slate-400 font-bold">
                              Reports: <span className="text-slate-700 font-extrabold">{dsg.reportingToDesignationId ? designations.find(d => d.id === dsg.reportingToDesignationId)?.code || 'Supervisor' : 'None'}</span>
                            </div>
                            <div className="text-violet-600 font-bold bg-violet-50 px-2 py-0.5 rounded">
                              {activeStaff} active emps
                            </div>
                          </div>

                          {/* Quick Actions hover overlay */}
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 bg-white pl-2">
                            <button
                              onClick={() => handleOpenEditModal(dsg)}
                              className="p-1 text-slate-400 hover:text-violet-600 transition-colors"
                              title="Edit role"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => handleInitiateDelete(dsg, e)}
                              className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                              title="Delete role"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD / EDIT DESIGNATION ================= */}
      {showAddEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm" id="add-edit-dsg-modal">
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-md font-bold text-slate-800">
                {editingDesignation ? `Edit Designation: ${editingDesignation.name}` : 'Create New Designation'}
              </h3>
              <button
                onClick={() => setShowAddEditModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDesignation} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1 font-mono">Designation Name *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Software Engineer"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1 font-mono">Role Code *</label>
                  <input
                    type="text"
                    required
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    placeholder="e.g. SE-3"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1 font-mono">Description</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Summarize key responsibilities, criteria, or deliverables for this role..."
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1 font-mono">Linked Division</label>
                  <select
                    value={formDepartmentId}
                    onChange={(e) => setFormDepartmentId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl text-xs focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none"
                  >
                    <option value="">-- Shared / Common --</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1 font-mono">Grade Level (1-10) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={10}
                    value={formLevel}
                    onChange={(e) => setFormLevel(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1 font-mono">Category *</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as Designation['category'])}
                    className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl text-xs focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none font-sans"
                  >
                    <option value="Executive">Executive</option>
                    <option value="Management">Management</option>
                    <option value="Senior Staff">Senior Staff</option>
                    <option value="Staff">Staff</option>
                    <option value="Entry Level">Entry Level</option>
                    <option value="Intern">Intern</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1 font-mono">Reports To (Supervisory Role)</label>
                  <select
                    value={formReportsToId}
                    onChange={(e) => setFormReportsToId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl text-xs focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none"
                  >
                    <option value="">-- None (Top Level) --</option>
                    {reportsToCandidates.map(dsg => (
                      <option key={dsg.id} value={dsg.id}>{dsg.name} ({dsg.code})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1 font-mono">Min Salary (Monthly)</label>
                  <input
                    type="number"
                    value={formMinSalary}
                    onChange={(e) => setFormMinSalary(e.target.value)}
                    placeholder="e.g. 2000"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1 font-mono">Max Salary (Monthly)</label>
                  <input
                    type="number"
                    value={formMaxSalary}
                    onChange={(e) => setFormMaxSalary(e.target.value)}
                    placeholder="e.g. 5000"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Designation Status</h4>
                  <p className="text-[10px] text-slate-400">If inactive, this role cannot be mapped to any incoming hire.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormIsActive(!formIsActive)}
                  className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none ${
                    formIsActive ? 'bg-violet-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      formIsActive ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddEditModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-violet-600 to-rose-500 text-white text-xs font-extrabold uppercase tracking-wider rounded-xl shadow-md hover:opacity-95"
                >
                  Save Designation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: DELETE CONFIRMATION ================= */}
      {dsgToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm" id="confirm-delete-dsg-modal">
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-xl w-full max-w-md space-y-4 animate-scale-in">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center border border-rose-100">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <h3 className="text-md font-extrabold">Warning: Delete Designation?</h3>
            </div>

            <div className="space-y-2 text-slate-600 text-xs">
              <p>Are you sure you want to delete the role <strong className="text-slate-800">"{dsgToDelete.name}" ({dsgToDelete.code})</strong>?</p>
              <div className="p-3 bg-rose-50/50 rounded-xl border border-rose-100/50 text-rose-700 space-y-1">
                <p className="font-bold">By proceeding:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>This designation is permanently removed.</li>
                  <li>Any other designations configured as reporting to this role will have their reporting path cleared.</li>
                </ul>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
              <button
                onClick={() => setDsgToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold uppercase tracking-wider rounded-xl shadow-md transition-colors"
              >
                Yes, Delete Role
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
