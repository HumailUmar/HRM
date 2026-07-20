import { logger } from '../lib/logger';
import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';
import { Employee, SuccessionPlan, AppSettings, OrgChartNode, Department, Designation } from '../types';
import { getEmployeeDesignation } from '../lib/employeeUtils';
import { GitMerge, Users, Plus, Trash2, Search, Sliders, Shield, AlertCircle, TrendingUp, CheckCircle, Award, X } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { INITIAL_ORG_CHART } from '../lib/mockData';
import OrgChart from './OrgChart';

interface SuccessionProps {
  employees: Employee[];
  isMockMode: boolean;
  settings: AppSettings;
  departments: Department[];
  designations: Designation[];
}

export default function Succession({ employees, isMockMode, settings, departments, designations }: SuccessionProps) {
  const data = useData();
  const [viewMode, setViewMode] = useState<'chart' | 'grid'>('chart');
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDept, setSelectedDept] = useState("All");
  
  const [plans, setPlans] = useState<SuccessionPlan[]>([]);
  const [orgNodes, setOrgNodes] = useState<OrgChartNode[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        if (isMockMode) {
          const loadedPlans = await data.getSuccessionPlans();
          setPlans(loadedPlans.length > 0 ? loadedPlans : [
            {
              id: 'SUC-001',
              roleName: 'Lead Software Architect',
              department: 'Engineering',
              currentIncumbentId: 'EMP-001',
              currentIncumbentName: 'Arsalan Khan',
              successorId: 'EMP-002',
              successorName: 'Humail Eli',
              potentialRating: 'High',
              readiness: 'Ready Now',
              notes: 'Humail has mentored under Arsalan for 2 years and completed architectural compliance.'
            },
            {
              id: 'SUC-002',
              roleName: 'HR Manager',
              department: 'Human Resources',
              currentIncumbentId: 'EMP-003',
              currentIncumbentName: 'Sarah Jenkins',
              successorId: 'EMP-004',
              successorName: 'Zainab Ahmed',
              potentialRating: 'Medium',
              readiness: 'Ready in 1 Year',
              notes: 'Zainab needs further executive leadership training before taking full ownership.'
            }
          ]);
          
           const loadedNodes = await data.getOrgChartNodes();
           setOrgNodes(loadedNodes.length > 0 ? loadedNodes : INITIAL_ORG_CHART);
        }
      } catch (err) {
        logger.error("Failed to fetch succession/orgchart data:", err);
      } finally {
        setIsDataLoaded(true);
      }
    };
    loadData();
  }, [isMockMode]);

   // Persist Plans changes automatically
   useEffect(() => {
     if (!isDataLoaded) return;
     let cancelled = false;
     if (isMockMode) {
       data.saveSuccessionPlans(plans);
     } else {
       data.getSuccessionPlans().then(currentPlans => {
         if (!cancelled) data.saveSuccessionPlans(plans);
       });
     }
     return () => { cancelled = true; };
   }, [plans, isMockMode, isDataLoaded, data]);

   // Save Nodes handler
   const handleSaveNodes = async (newNodes: OrgChartNode[]) => {
     setOrgNodes(newNodes);
     if (isMockMode) {
       data.saveOrgChartNodes(newNodes);
     } else {
       try {
         await data.saveOrgChartNodes(newNodes);
       } catch (err) {
         logger.error("Failed to sync org chart nodes:", err);
       }
     }
   };

  // Modal State for Succession List
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newDept, setNewDept] = useState("Engineering");
  const [newIncumbentId, setNewIncumbentId] = useState("");
  const [newSuccessorId, setNewSuccessorId] = useState("");
  const [newPotential, setNewPotential] = useState<'Low' | 'Medium' | 'High'>('High');
  const [newReadiness, setNewReadiness] = useState<'Ready Now' | 'Ready in 1 Year' | 'Ready in 2+ Years'>('Ready Now');
  const [newNotes, setNewNotes] = useState("");

  const activeEmployees = useMemo(() => {
    return employees.filter(e => e.status !== 'Terminated');
  }, [employees]);

  // Department choices dynamically compiled
  const depts = useMemo(() => {
    const list = new Set(plans.map(p => p.department));
    // Add departments from orgNodes too to keep options accurate
    orgNodes.forEach(n => list.add(n.department));
    return ["All", ...Array.from(list).filter(Boolean)];
  }, [plans, orgNodes]);

  // Handle adding a new plan (from List Grid)
  const handleAddPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim() || !newIncumbentId || !newSuccessorId) return;

    const incumbent = activeEmployees.find(emp => emp.id === newIncumbentId);
    const successor = activeEmployees.find(emp => emp.id === newSuccessorId);

    if (!incumbent || !successor) return;

    const newPlan: SuccessionPlan = {
      id: `SUC-${Date.now().toString().slice(-4)}`,
      roleName: newRoleName,
      department: newDept,
      currentIncumbentId: newIncumbentId,
      currentIncumbentName: incumbent.name,
      successorId: newSuccessorId,
      successorName: successor.name,
      potentialRating: newPotential,
      readiness: newReadiness,
      notes: newNotes
    };

    const updatedPlans = [newPlan, ...plans];
    setPlans(updatedPlans);
    setIsAddOpen(false);

    // Sync back to corresponding OrgChartNode automatically if exists
    const matchingNode = orgNodes.find(n => n.positionName === newRoleName);
    if (matchingNode) {
      const updatedNodes = orgNodes.map(n => {
        if (n.id === matchingNode.id) {
          const isCrit = true;
          const successors = Array.from(new Set([...n.successors, newSuccessorId]));
          return { ...n, isCritical: isCrit, successors };
        }
        return n;
      });
      handleSaveNodes(updatedNodes);
    }

    data.addSheetLog("HumailEli_Succession", "INSERT", {
      id: newPlan.id,
      roleName: newPlan.roleName,
      successor: newPlan.successorName
    });

    // Reset fields
    setNewRoleName("");
    setNewNotes("");
  };

  // Handle deletion
  const handleDeletePlan = async (id: string) => {
    if (!window.confirm("Are you sure you want to remove this succession relationship?")) return;
    
    const target = plans.find(p => p.id === id);
    if (!target) return;

    setPlans(plans.filter(p => p.id !== id));

    // Also remove successor from OrgChartNode if present
    const matchingNode = orgNodes.find(n => n.positionName === target.roleName);
    if (matchingNode) {
      const updatedNodes = orgNodes.map(n => {
        if (n.id === matchingNode.id) {
          return { ...n, successors: n.successors.filter(sid => sid !== target.successorId) };
        }
        return n;
      });
      handleSaveNodes(updatedNodes);
    }

    data.addSheetLog("HumailEli_Succession", "DELETE", {
      id,
      roleName: target.roleName
    });
  };

  // Filtered succession plans list
  const filteredPlans = useMemo(() => {
    return plans.filter(p => {
      const matchDept = selectedDept === "All" || p.department === selectedDept;
      const matchSearch = p.roleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.currentIncumbentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.successorName.toLowerCase().includes(searchTerm.toLowerCase());
      return matchDept && matchSearch;
    });
  }, [plans, selectedDept, searchTerm]);

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-violet-600 animate-pulse" />
            <h2 className="text-xl font-bold text-slate-900 font-display">Succession Planning & Org Chart</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-sans">
            Map key organizational positions, design reporting channels, and assign next-generation leaders with readiness timelines.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-center">
          {/* View toggle */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/50">
            <button
              onClick={() => setViewMode('chart')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'chart' ? 'bg-white text-violet-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <GitMerge className="w-3.5 h-3.5" /> Org Chart Editor
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'grid' ? 'bg-white text-violet-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Users className="w-3.5 h-3.5" /> List Grid
            </button>
          </div>

          <button
            onClick={() => setIsAddOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-violet-600/15 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Plan
          </button>
        </div>
      </div>

      {/* Main interactive displays */}
      {!isDataLoaded ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600" />
        </div>
      ) : viewMode === 'chart' ? (
        /* INTERACTIVE ORG CHART EDITOR CONTAINER */
        <OrgChart
          employees={employees}
          plans={plans}
          setPlans={setPlans}
          isMockMode={isMockMode}
          settings={settings}
          nodes={orgNodes}
          onSaveNodes={handleSaveNodes}
          departments={departments}
          designations={designations}
        />
      ) : (
        /* LIST GRID VIEW MODE WITH DEPT AND SEARCH FILTERS */
        <div className="space-y-6">
          
          {/* Search & Dept Controls */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 flex flex-col sm:flex-row gap-4 items-center justify-between shadow-xs">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by role, incumbent or successor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200/60 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
            </div>

            <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              {depts.map(d => (
                <button
                  key={d}
                  onClick={() => setSelectedDept(d)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold shrink-0 transition-all ${
                    selectedDept === d ? 'bg-violet-600 text-white shadow-sm' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {filteredPlans.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center space-y-4">
              <AlertCircle className="w-12 h-12 text-slate-300 mx-auto" />
              <div>
                <h4 className="text-md font-bold text-slate-800">No Succession Plans Found</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                  Either define new key organizational relationships, or change the department filters to visualize potential paths.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Role Name</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Department</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Current Incumbent</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Identified Successor</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Potential</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Readiness</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredPlans.map(plan => (
                      <tr key={plan.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-800">{plan.roleName}</td>
                        <td className="px-6 py-4 text-slate-500">{plan.department}</td>
                        <td className="px-6 py-4 font-semibold text-slate-700">{plan.currentIncumbentName}</td>
                        <td className="px-6 py-4 font-semibold text-violet-700">{plan.successorName}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                            plan.potentialRating === 'High' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                            plan.potentialRating === 'Medium' ? 'bg-violet-50 text-violet-700 border border-violet-100' :
                            'bg-slate-50 text-slate-500'
                          }`}>
                            {plan.potentialRating}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                            plan.readiness === 'Ready Now' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                            'bg-amber-50 text-amber-700 border border-amber-100'
                          }`}>
                            {plan.readiness}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleDeletePlan(plan.id)}
                            className="text-slate-400 hover:text-rose-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4 inline" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Plan Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-6 shadow-2xl"
          >
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-md font-bold text-slate-800">Add Succession Plan</h3>
              <button
                onClick={() => setIsAddOpen(false)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddPlan} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">Key Position / Role</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Director of Finance"
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-violet-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">Department</label>
                  <select
                    value={newDept}
                    onChange={(e) => setNewDept(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-violet-500 focus:outline-none"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Human Resources">Human Resources</option>
                    <option value="Finance">Finance</option>
                    <option value="Sales">Sales</option>
                    <option value="Operations">Operations</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">Current Incumbent</label>
                  <select
                    required
                    value={newIncumbentId}
                    onChange={(e) => setNewIncumbentId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-violet-500 focus:outline-none"
                  >
                    <option value="">-- Select incumbent --</option>
                    {activeEmployees.map(e => (
                      <option key={e.id} value={e.id}>{e.name} ({getEmployeeDesignation(e, designations)})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">Identified Successor</label>
                  <select
                    required
                    value={newSuccessorId}
                    onChange={(e) => setNewSuccessorId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-violet-500 focus:outline-none"
                  >
                    <option value="">-- Select successor --</option>
                    {activeEmployees.map(e => (
                      <option key={e.id} value={e.id}>{e.name} ({getEmployeeDesignation(e, designations)})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">Potential Index</label>
                  <select
                    value={newPotential}
                    onChange={(e: any) => setNewPotential(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-violet-500 focus:outline-none"
                  >
                    <option value="High">High Potential</option>
                    <option value="Medium">Medium Potential</option>
                    <option value="Low">Low Potential</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">Readiness Timeline</label>
                  <select
                    value={newReadiness}
                    onChange={(e: any) => setNewReadiness(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-violet-500 focus:outline-none"
                  >
                    <option value="Ready Now">Ready Now</option>
                    <option value="Ready in 1 Year">Ready in 1 Year</option>
                    <option value="Ready in 2+ Years">Ready in 2+ Years</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Evaluation Notes</label>
                <textarea
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Summarize leadership potential and professional coaching requirements..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs h-20 focus:ring-1 focus:ring-violet-500 focus:outline-none"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold"
                >
                  Create Plan
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

    </div>
  );
}
