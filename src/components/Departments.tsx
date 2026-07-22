import React, { useState, useMemo } from 'react';
import { Department, Employee, Designation } from '../types';
import { useData } from '../contexts/DataContext';
import { Search, Plus, Edit, Trash2, Building, Users, MapPin, DollarSign, ChevronRight, X, ArrowLeft, Building2, Coins, CheckCircle, AlertTriangle } from 'lucide-react';
import { getEmployeeDesignation, getEmployeeDepartment } from '../lib/employeeUtils';

interface DepartmentsProps {
  departments: Department[];
  setDepartments: (depts: Department[]) => void;
  employees: Employee[];
  setEmployees: (employees: Employee[]) => void;
  designations: Designation[];
}

export default function Departments({
  departments,
  setDepartments,
  employees,
  setEmployees,
  designations
}: DepartmentsProps) {
  const data = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null);

  // Modal State
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formHeadId, setFormHeadId] = useState('');
  const [formParentId, setFormParentId] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formBudget, setFormBudget] = useState('');
  const [formCostCenter, setFormCostCenter] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);

  // Inline Quick Actions State
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [selectedEmpToJoinId, setSelectedEmpToJoinId] = useState('');

  // Delete Warning state
  const [deptToDelete, setDeptToDelete] = useState<Department | null>(null);

  // Selected Department details
  const selectedDept = useMemo(() => {
    if (!selectedDeptId) return null;
    return departments.find(d => d.id === selectedDeptId) || null;
  }, [departments, selectedDeptId]);

  // Compute live employee counts & parent relations
  const computedDepartments = useMemo(() => {
    return departments.map(dept => {
      const deptEmployees = employees.filter(emp => emp.employment.departmentId === dept.id);
      return {
        ...dept,
        employeeCount: deptEmployees.length
      };
    });
  }, [departments, employees]);

  // Filtered departments list
  const filteredDepts = useMemo(() => {
    return computedDepartments.filter(dept => {
      const matchSearch = 
        dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dept.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (dept.location && dept.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (dept.costCenter && dept.costCenter.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchSearch;
    });
  }, [computedDepartments, searchTerm]);

  // Department heads candidates
  const headCandidates = useMemo(() => {
    return employees.filter(emp => emp.status === 'Active');
  }, [employees]);

  // Potential Parent Departments (excluding editing department self to avoid circular reference)
  const parentCandidates = useMemo(() => {
    return departments.filter(d => !editingDept || d.id !== editingDept.id);
  }, [departments, editingDept]);

  // Sub-departments of selected
  const subDepartments = useMemo(() => {
    if (!selectedDeptId) return [];
    return computedDepartments.filter(d => d.parentDepartmentId === selectedDeptId);
  }, [computedDepartments, selectedDeptId]);

  // Employees in selected
  const deptEmployeesList = useMemo(() => {
    if (!selectedDeptId) return [];
    return employees.filter(emp => emp.employment.departmentId === selectedDeptId);
  }, [employees, selectedDeptId]);

  // Open modal for adding
  const handleOpenAddModal = () => {
    setEditingDept(null);
    setFormName('');
    setFormCode('');
    setFormDescription('');
    setFormHeadId('');
    setFormParentId('');
    setFormLocation('');
    setFormBudget('');
    setFormCostCenter('');
    setFormIsActive(true);
    setShowAddEditModal(true);
  };

  // Open modal for editing
  const handleOpenEditModal = (dept: Department, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingDept(dept);
    setFormName(dept.name);
    setFormCode(dept.code);
    setFormDescription(dept.description);
    setFormHeadId(dept.headId || '');
    setFormParentId(dept.parentDepartmentId || '');
    setFormLocation(dept.location || '');
    setFormBudget(dept.budget ? String(dept.budget) : '');
    setFormCostCenter(dept.costCenter || '');
    setFormIsActive(dept.isActive);
    setShowAddEditModal(true);
  };

  // Save Department Form
  const handleSaveDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    const previousDepartments = departments;
    let departmentToPersist: Department | null = null;
    if (!formName.trim() || !formCode.trim()) return;

    const headEmp = employees.find(emp => emp.id === formHeadId);
    const headName = headEmp ? headEmp.name : undefined;

    if (editingDept) {
      // Edit mode
      const updatedDepts = departments.map(d => {
        if (d.id === editingDept.id) {
          return {
            ...d,
            name: formName,
            code: formCode.toUpperCase(),
            description: formDescription,
            headId: formHeadId || undefined,
            headName,
            parentDepartmentId: formParentId || undefined,
            location: formLocation || undefined,
            budget: formBudget ? Number(formBudget) : undefined,
            costCenter: formCostCenter || undefined,
            isActive: formIsActive,
            updatedAt: new Date().toISOString()
          };
        }
        return d;
      });
      setDepartments(updatedDepts);
      departmentToPersist = updatedDepts.find(department => department.id === editingDept.id) || null;

      // If the department head has been updated, update the Employee record as well (sync department field)
      if (formHeadId) {
        setEmployees(employees.map(emp => {
          if (emp.id === formHeadId) {
            return {
              ...emp,
              departmentId: editingDept.id,
              department: formName // For backward compatibility
            };
          }
          return emp;
        }));
      }
    } else {
      // Add mode
      const newId = `DEPT-${Date.now().toString().slice(-4)}`;
      const newDept: Department = {
        id: newId,
        name: formName,
        code: formCode.toUpperCase(),
        description: formDescription,
        headId: formHeadId || undefined,
        headName,
        parentDepartmentId: formParentId || undefined,
        location: formLocation || undefined,
        budget: formBudget ? Number(formBudget) : undefined,
        costCenter: formCostCenter || undefined,
        employeeCount: 0,
        isActive: formIsActive,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setDepartments([...departments, newDept]);
      departmentToPersist = newDept;

      // If head designated, update that employee's department
      if (formHeadId) {
        setEmployees(employees.map(emp => {
          if (emp.id === formHeadId) {
            return {
              ...emp,
              departmentId: newId,
              department: formName
            };
          }
          return emp;
        }));
      }
    }
    if (departmentToPersist) {
      try {
        await data.saveDepartment(departmentToPersist);
      } catch (error) {
        setDepartments(previousDepartments);
        return;
      }
      if (formHeadId) {
        const head = employees.find(employee => employee.id === formHeadId);
        if (head) {
          const updatedHead = { ...head, departmentId: departmentToPersist.id, department: departmentToPersist.name };
          try {
            await data.saveEmployee(updatedHead);
            setEmployees(employees.map(employee => employee.id === head.id ? updatedHead : employee));
          } catch (error) {
            setDepartments(previousDepartments);
            return;
          }
        }
      }
    }
    setShowAddEditModal(false);
  };

  // Initiate Delete with Modal Warning
  const handleInitiateDelete = (dept: Department, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeptToDelete(dept);
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deptToDelete) return;
    const previousDepartments = departments;
    const updatedDepartments = departments.filter(d => d.id !== deptToDelete.id);
    setDepartments(updatedDepartments);
    try {
      await data.saveDepartment({ ...deptToDelete, isActive: false, updatedAt: new Date().toISOString() });
    } catch (error) {
      setDepartments(previousDepartments);
      return;
    }

    // Delete department
    setDepartments(updatedDepartments);

    // Update employees belonging to this department
    setEmployees(employees.map(emp => {
      if (emp.employment.departmentId === deptToDelete.id) {
        return {
          ...emp,
          employment: {
            ...emp.employment,
            departmentId: undefined
          },
          department: "" // Keep existing as blank or backup
        };
      }
      return emp;
    }));

    // If deleting active selected detail
    if (selectedDeptId === deptToDelete.id) {
      setSelectedDeptId(null);
    }

    setDeptToDelete(null);
  };

  // Add Employee To Department Quick Action
  const handleAddEmployeeToDept = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeptId || !selectedEmpToJoinId) return;

    const targetDept = departments.find(d => d.id === selectedDeptId);
    if (!targetDept) return;

    setEmployees(employees.map(emp => {
      if (emp.id === selectedEmpToJoinId) {
        return {
          ...emp,
          employment: {
            ...emp.employment,
            departmentId: selectedDeptId
          },
          department: targetDept.name
        };
      }
      return emp;
    }));

    setSelectedEmpToJoinId('');
    setShowAddEmployeeModal(false);
  };

  // Remove Employee From Department (Resets their departmentId/department)
  const handleRemoveEmployeeFromDept = (empId: string) => {
    setEmployees(employees.map(emp => {
      if (emp.id === empId) {
        return {
          ...emp,
          employment: {
            ...emp.employment,
            departmentId: undefined
          },
          department: ""
        };
      }
      return emp;
    }));
  };

  return (
    <div className="space-y-6 animate-fade-in" id="departments-management-container">
      {/* Detail View Header OR Main View Header */}
      {selectedDept ? (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white/70 backdrop-blur-md p-6 rounded-3xl border border-slate-100 shadow-sm" id="dept-detail-header">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSelectedDeptId(null)}
              className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors text-slate-600"
              title="Back to List"
              id="back-to-depts-list-btn"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-violet-100 text-violet-700">
                  {selectedDept.code}
                </span>
                <span className={`w-2 h-2 rounded-full ${selectedDept.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                <span className="text-xs text-slate-500 font-medium">{selectedDept.isActive ? 'Active Department' : 'Inactive Department'}</span>
              </div>
              <h2 className="text-xl font-bold text-slate-800 tracking-tight">{selectedDept.name}</h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleOpenEditModal(selectedDept)}
              className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2"
              id="edit-dept-detail-btn"
            >
              <Edit className="w-4 h-4" />
              Edit Details
            </button>
            <button
              onClick={(e) => handleInitiateDelete(selectedDept, e)}
              className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border border-rose-100 text-rose-600 hover:bg-rose-50 transition-all shadow-sm flex items-center gap-2"
              id="delete-dept-detail-btn"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white/70 backdrop-blur-md p-6 rounded-3xl border border-slate-100 shadow-sm" id="depts-list-header">
          <div>
            <h2 className="text-xl font-extrabold text-slate-800 tracking-tight font-display">Department Directory</h2>
            <p className="text-xs text-slate-500 font-medium">Manage corporate hierarchy, assign leaders, track budgets, and view departmental distribution.</p>
          </div>
          <div>
            <button
              onClick={handleOpenAddModal}
              className="px-5 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider text-white bg-gradient-to-r from-violet-600 to-rose-500 hover:opacity-95 shadow-lg shadow-violet-500/20 transition-all duration-300 flex items-center gap-2"
              id="add-department-btn"
            >
              <Plus className="w-4 h-4" />
              Add Department
            </button>
          </div>
        </div>
      )}

      {/* Main Grid: Detail View vs List View */}
      {selectedDept ? (
        /* ================= SELECTED DEPARTMENT DETAIL VIEW ================= */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="dept-detail-body">
          {/* LEFT: Summary Card, Stats, Sub-departments */}
          <div className="lg:col-span-1 space-y-6">
            {/* Summary Card */}
            <div className="bg-white/80 backdrop-blur-md rounded-3xl border border-slate-100 p-6 shadow-sm space-y-5">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-500">Department Profile</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block font-mono">Description</label>
                  <p className="text-sm text-slate-600 mt-1">{selectedDept.description || 'No description provided.'}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block font-mono">Location</label>
                    <div className="flex items-center gap-1.5 mt-1 text-slate-700">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="text-xs font-semibold">{selectedDept.location || 'Not Specified'}</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block font-mono">Cost Center</label>
                    <div className="flex items-center gap-1.5 mt-1 text-slate-700">
                      <Coins className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="text-xs font-semibold font-mono">{selectedDept.costCenter || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <label className="text-[10px] uppercase font-bold text-slate-400 block font-mono">Annual Budget</label>
                  <div className="flex items-center gap-1 mt-1 text-slate-800">
                    <DollarSign className="w-4 h-4 text-violet-500" />
                    <span className="text-lg font-black tracking-tight">
                      {selectedDept.budget ? selectedDept.budget.toLocaleString() : '0.00'}
                    </span>
                    <span className="text-xs text-slate-400 font-bold ml-1">USD</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <label className="text-[10px] uppercase font-bold text-slate-400 block font-mono">Parent Department</label>
                  <p className="text-xs font-semibold text-slate-700 mt-1">
                    {selectedDept.parentDepartmentId 
                      ? departments.find(d => d.id === selectedDept.parentDepartmentId)?.name || 'Unknown Department'
                      : 'None (Root Level)'}
                  </p>
                </div>
              </div>
            </div>

            {/* Department Leader Card */}
            <div className="bg-white/80 backdrop-blur-md rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-500">Department Head</h3>
              {selectedDept.headId ? (
                (() => {
                  const leader = employees.find(e => e.id === selectedDept.headId);
                  return (
                    <div className="flex items-center gap-3.5 bg-slate-50/50 p-3.5 rounded-2xl border border-slate-100">
                      {leader?.personal.profileImage ? (
                        <img 
                          src={leader.personal.profileImage} 
                          alt={leader.name} 
                          className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center font-bold text-white uppercase text-sm">
                          {selectedDept.headName?.slice(0, 2) || 'DH'}
                        </div>
                      )}
                      <div>
                        <h4 className="text-sm font-extrabold text-slate-800">{selectedDept.headName || leader?.name}</h4>
                        <p className="text-xs text-slate-500 font-medium">{leader ? getEmployeeDesignation(leader, designations) : 'HOD'}</p>
                        <p className="text-[10px] text-violet-600 font-bold font-mono mt-0.5">{selectedDept.headId}</p>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="text-center py-6 px-4 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                  <p className="text-xs text-slate-400 font-medium">No Department Head has been assigned yet.</p>
                </div>
              )}
            </div>

            {/* Sub-departments List */}
            <div className="bg-white/80 backdrop-blur-md rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-500">Sub-departments ({subDepartments.length})</h3>
              {subDepartments.length > 0 ? (
                <div className="space-y-2">
                  {subDepartments.map(sub => (
                    <button
                      key={sub.id}
                      onClick={() => setSelectedDeptId(sub.id)}
                      className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-all text-left"
                    >
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">{sub.name}</h4>
                        <span className="text-[10px] font-mono text-slate-400">{sub.code}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{sub.employeeCount} emps</span>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 font-medium">No sub-departments belong to this level.</p>
              )}
            </div>
          </div>

          {/* RIGHT: Active Employees in Department */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white/80 backdrop-blur-md rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-md font-bold text-slate-800">Team Members</h3>
                  <p className="text-xs text-slate-400">List of all active personnel mapped to this business division.</p>
                </div>
                <button
                  onClick={() => setShowAddEmployeeModal(true)}
                  className="self-start sm:self-center px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider bg-violet-50 text-violet-600 hover:bg-violet-100 transition-colors flex items-center gap-1.5"
                  id="add-team-member-quick-btn"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Employee
                </button>
              </div>

              {deptEmployeesList.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="py-3 px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Employee</th>
                        <th className="py-3 px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Title / Designation</th>
                        <th className="py-3 px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Status</th>
                        <th className="py-3 px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {deptEmployeesList.map(emp => (
                        <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-3">
                              {emp.personal.profileImage ? (
                                <img 
                                  src={emp.personal.profileImage} 
                                  alt={emp.name} 
                                  className="w-9 h-9 rounded-lg object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-slate-700 text-xs">
                                  {emp.name.slice(0, 2)}
                                </div>
                              )}
                              <div>
                                <p className="text-xs font-bold text-slate-800">{emp.name}</p>
                                <p className="text-[10px] font-mono text-slate-400">{emp.id}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-2">
                            <span className="text-xs font-semibold text-slate-600">{getEmployeeDesignation(emp, designations)}</span>
                          </td>
                          <td className="py-3 px-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              emp.status === 'Active' ? 'bg-emerald-50 text-emerald-600' :
                              emp.status === 'Onboarding' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500'
                            }`}>
                              {emp.status}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-right">
                            <button
                              onClick={() => handleRemoveEmployeeFromDept(emp.id)}
                              className="text-xs text-rose-500 hover:text-rose-700 font-bold hover:underline"
                              title="Unlink from department"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 bg-slate-50/30 rounded-2xl border border-dashed border-slate-100">
                  <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-400 font-bold">No employees mapped to this department yet.</p>
                  <button
                    onClick={() => setShowAddEmployeeModal(true)}
                    className="mt-3 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
                  >
                    Assign Employee
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* ================= DEPARTMENTS LIST VIEW ================= */
        <div className="space-y-4" id="depts-list-panel">
          {/* Search bar & Statistics cards */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white/50 backdrop-blur-md p-4 rounded-2xl border border-slate-100/80 shadow-sm">
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search departments by name, code, location..."
                className="w-full pl-10 pr-4 py-2 rounded-xl text-xs border border-slate-200 bg-white/70 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
                id="dept-search-input"
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
              <span>Total Divisions: <span className="text-violet-600 font-extrabold">{computedDepartments.length}</span></span>
              <span>Active: <span className="text-emerald-500 font-extrabold">{computedDepartments.filter(d => d.isActive).length}</span></span>
            </div>
          </div>

          {/* Department Cards Grid */}
          {filteredDepts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="depts-cards-grid">
              {filteredDepts.map(dept => (
                <div
                  key={dept.id}
                  onClick={() => setSelectedDeptId(dept.id)}
                  className="bg-white/80 hover:bg-white backdrop-blur-md rounded-3xl border border-slate-100 hover:border-violet-100 p-6 shadow-sm hover:shadow-md cursor-pointer transition-all duration-300 relative group flex flex-col justify-between h-56"
                >
                  <div>
                    {/* Card Top */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-100 to-indigo-50/50 flex items-center justify-center border border-violet-100">
                          <Building className="w-5 h-5 text-violet-600" />
                        </div>
                        <div>
                          <span className="px-2 py-0.5 rounded text-[9px] font-mono font-black bg-slate-100 text-slate-600 border border-slate-200/50">
                            {dept.code}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${dept.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{dept.isActive ? 'Active' : 'Inactive'}</span>
                      </div>
                    </div>

                    {/* Title */}
                    <div className="mt-4">
                      <h3 className="text-sm font-extrabold text-slate-800 group-hover:text-violet-700 transition-colors truncate">{dept.name}</h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{dept.description || 'No description added yet.'}</p>
                    </div>
                  </div>

                  {/* Card Bottom / Stats */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1 text-slate-500" title="Employees count">
                        <Users className="w-4 h-4 text-slate-400" />
                        <span className="text-xs font-bold text-slate-700">{dept.employeeCount}</span>
                      </div>
                      {dept.location && (
                        <div className="flex items-center gap-1 text-slate-500" title="Location">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-xs font-semibold text-slate-600 truncate max-w-[100px]">{dept.location}</span>
                        </div>
                      )}
                    </div>

                    {/* Hover actions */}
                    <div className="flex items-center gap-1 opacity-80 md:opacity-0 group-hover:opacity-100 transition-all">
                      <button
                        onClick={(e) => handleOpenEditModal(dept, e)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-violet-600 hover:bg-violet-50 transition-all"
                        title="Edit Department"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => handleInitiateDelete(dept, e)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-all"
                        title="Delete Department"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white/60 backdrop-blur-md rounded-3xl border border-slate-100 shadow-sm" id="empty-depts-view">
              <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-md font-bold text-slate-800">No departments found</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">Create departments first to map employees, structures, and allocate budgets cleanly.</p>
              <button
                onClick={handleOpenAddModal}
                className="mt-4 px-4 py-2 bg-gradient-to-r from-violet-600 to-rose-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md"
              >
                Create Department
              </button>
            </div>
          )}
        </div>
      )}

      {/* ================= MODAL: ADD / EDIT DEPARTMENT ================= */}
      {showAddEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm" id="add-edit-dept-modal">
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-md font-bold text-slate-800">
                {editingDept ? `Edit Department: ${editingDept.name}` : 'Create New Department'}
              </h3>
              <button
                onClick={() => setShowAddEditModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDepartment} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1 font-mono">Department Name *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Engineering"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1 font-mono">Department Code *</label>
                  <input
                    type="text"
                    required
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    placeholder="e.g. ENG"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1 font-mono">Description</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Describe the responsibilities and scope of this business division..."
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1 font-mono">Department Head</label>
                  <select
                    value={formHeadId}
                    onChange={(e) => setFormHeadId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl text-xs focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none"
                  >
                    <option value="">-- No Head Designated --</option>
                    {headCandidates.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name} ({getEmployeeDesignation(emp, designations)})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1 font-mono">Parent Department</label>
                  <select
                    value={formParentId}
                    onChange={(e) => setFormParentId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl text-xs focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none"
                  >
                    <option value="">-- None (Root Level) --</option>
                    {parentCandidates.map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.name} ({dept.code})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1 font-mono">Location</label>
                  <input
                    type="text"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    placeholder="e.g. Block B"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none"
                  />
                </div>
                <div className="sm:col-span-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1 font-mono">Annual Budget (USD)</label>
                  <input
                    type="number"
                    value={formBudget}
                    onChange={(e) => setFormBudget(e.target.value)}
                    placeholder="e.g. 150000"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none"
                  />
                </div>
                <div className="sm:col-span-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1 font-mono">Cost Center</label>
                  <input
                    type="text"
                    value={formCostCenter}
                    onChange={(e) => setFormCostCenter(e.target.value)}
                    placeholder="e.g. CC-ENG"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Department Status</h4>
                  <p className="text-[10px] text-slate-400">Determines if the department is currently active and selectable.</p>
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
                  Save Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD TEAM MEMBER QUICK ACTION ================= */}
      {showAddEmployeeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm" id="add-team-member-modal">
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-xl w-full max-w-md space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-md font-bold text-slate-800">Add Team Member</h3>
              <button
                onClick={() => setShowAddEmployeeModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddEmployeeToDept} className="space-y-4">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1 font-mono">Select Employee to Add</label>
                <p className="text-[10px] text-slate-400 mb-2">Only employees not already assigned to this division are shown below.</p>
                <select
                  required
                  value={selectedEmpToJoinId}
                  onChange={(e) => setSelectedEmpToJoinId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl text-xs focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none"
                >
                  <option value="">-- Choose Employee --</option>
                  {employees
                    .filter(emp => emp.employment.departmentId !== selectedDeptId && emp.status === 'Active')
                    .map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({getEmployeeDesignation(emp, designations)} {getEmployeeDepartment(emp, departments) ? ` - current: ${getEmployeeDepartment(emp, departments)}` : ''})
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddEmployeeModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedEmpToJoinId}
                  className="px-5 py-2 bg-gradient-to-r from-violet-600 to-rose-500 text-white text-xs font-extrabold uppercase tracking-wider rounded-xl shadow-md hover:opacity-95 disabled:opacity-55"
                >
                  Assign to Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: DELETE CONFIRMATION ================= */}
      {deptToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm" id="confirm-delete-modal">
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-xl w-full max-w-md space-y-4 animate-scale-in">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center border border-rose-100">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <h3 className="text-md font-extrabold">Warning: Delete Department?</h3>
            </div>

            <div className="space-y-2 text-slate-600 text-xs">
              <p>Are you sure you want to delete the department <strong className="text-slate-800">"{deptToDelete.name}" ({deptToDelete.code})</strong>?</p>
              <div className="p-3 bg-rose-50/50 rounded-xl border border-rose-100/50 text-rose-700 space-y-1">
                <p className="font-bold">This is an irreversible action. By proceeding:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>The department record will be permanently deleted.</li>
                  <li>Any employees in this department will have their department assignment reset.</li>
                </ul>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
              <button
                onClick={() => setDeptToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all"
              >
                Cancel, Keep It
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold uppercase tracking-wider rounded-xl shadow-md transition-colors"
              >
                Yes, Delete Department
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
