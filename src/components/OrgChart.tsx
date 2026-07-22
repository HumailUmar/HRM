import { logger } from '../lib/logger';
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Employee, SuccessionPlan, OrgChartNode, AppSettings, Department, Designation } from '../types';
import { getEmployeeDesignation } from '../lib/employeeUtils';
import { useData } from '../contexts/DataContext';
import { 
  Plus, Trash2, Edit, Star, UserPlus, UserCheck, ChevronDown, 
  ChevronRight, Move, Check, X, AlertTriangle, ShieldAlert, GitMerge
} from 'lucide-react';

interface OrgChartProps {
  employees: Employee[];
  plans: SuccessionPlan[];
  setPlans: React.Dispatch<React.SetStateAction<SuccessionPlan[]>>;
  isMockMode: boolean;
  settings: AppSettings;
  nodes: OrgChartNode[];
  onSaveNodes: (newNodes: OrgChartNode[]) => void;
  departments: Department[];
  designations: Designation[];
}

export default function OrgChart({
  employees,
  plans,
  setPlans,
  isMockMode,
  settings,
  nodes,
  onSaveNodes,
  departments,
  designations
}: OrgChartProps) {
  const data = useData();
  const [isEditMode, setIsEditMode] = useState(false);
  const [layoutMode, setLayoutMode] = useState<'tree' | 'compact'>('tree');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  
  // Modals / Dropdowns
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isAddNodeOpen, setIsAddNodeOpen] = useState(false);
  const [dragOverNodeId, setDragOverNodeId] = useState<string | null>(null);
  
  // New Node Form State
  const [newNodeName, setNewNodeName] = useState('');
  const [newNodeDept, setNewNodeDept] = useState('Engineering');
  const [newNodeParentId, setNewNodeParentId] = useState<string>('');
  const [newNodeEmpId, setNewNodeEmpId] = useState('');
  const [newNodeIsCritical, setNewNodeIsCritical] = useState(false);

  // Successor Assignment State (Inside details modal)
  const [isAssigningSuccessor, setIsAssigningSuccessor] = useState(false);
  const [selectedSuccessorId, setSelectedSuccessorId] = useState('');
  const [successorReadiness, setSuccessorReadiness] = useState<'Ready Now' | 'Ready in 1 Year' | 'Ready in 2+ Years'>('Ready Now');
  const [successorNotes, setSuccessorNotes] = useState('');

  // Employee Assignment State (Inside details modal)
  const [isAssigningEmployee, setIsAssigningEmployee] = useState(false);
  const [selectedAssigneeId, setSelectedAssigneeId] = useState('');

  // Active employees list for dropdowns
  const activeEmployees = useMemo(() => {
    return employees.filter(e => e.status !== 'Terminated');
  }, [employees]);

  // Find a node by ID helper
  const selectedNode = useMemo(() => {
    return nodes.find(n => n.id === selectedNodeId) || null;
  }, [nodes, selectedNodeId]);

  // Root node(s) - nodes with no parentId or parentId not in nodes list
  const rootNodes = useMemo(() => {
    const nodeIds = new Set(nodes.map(n => n.id));
    return nodes.filter(n => !n.parentId || !nodeIds.has(n.parentId));
  }, [nodes]);

  // Drag and Drop reporting structure change
  const handleMoveNode = (draggedId: string, targetParentId: string) => {
    if (draggedId === targetParentId) return;
    
    // Check for circular reference: targetParentId cannot be a descendant of draggedId
    const isDescendant = (parent: string, child: string): boolean => {
      const childNode = nodes.find(n => n.id === child);
      if (!childNode || !childNode.parentId) return false;
      if (childNode.parentId === parent) return true;
      return isDescendant(parent, childNode.parentId);
    };

    if (isDescendant(draggedId, targetParentId)) {
      alert("Error: Cannot move a parent position under one of its own descendants!");
      return;
    }

    const updated = nodes.map(node => {
      if (node.id === draggedId) {
        return { ...node, parentId: targetParentId };
      }
      return node;
    });

    onSaveNodes(updated);
    data.addSheetLog("HumailEli_Org_Chart", "UPDATE", { id: draggedId, parentId: targetParentId, action: "MOVE" });
  };

  // Add Position
  const handleAddNodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNodeName.trim()) return;

    const newId = `node-${Date.now()}`;
    const newNode: OrgChartNode = {
      id: newId,
      positionName: newNodeName,
      department: newNodeDept,
      employeeId: newNodeEmpId || undefined,
      parentId: newNodeParentId || undefined,
      isCritical: newNodeIsCritical,
      riskLevel: newNodeIsCritical ? 'Medium' : 'Low',
      successors: [],
      children: []
    };

    const updated = [...nodes, newNode];
    onSaveNodes(updated);
    setIsAddNodeOpen(false);

    // Reset Form
    setNewNodeName('');
    setNewNodeEmpId('');
    setNewNodeIsCritical(false);

    data.addSheetLog("HumailEli_Org_Chart", "INSERT", { id: newId, positionName: newNodeName });
  };

  // Delete Position
  const handleDeleteNode = (id: string) => {
    const nodeToDelete = nodes.find(n => n.id === id);
    if (!nodeToDelete) return;

    if (!window.confirm(`Are you sure you want to delete the "${nodeToDelete.positionName}" position? Child nodes will be re-assigned to its parent.`)) {
      return;
    }

    const parentId = nodeToDelete.parentId;
    const updated = nodes
      .filter(n => n.id !== id)
      .map(n => {
        if (n.parentId === id) {
          return { ...n, parentId: parentId }; // Move children to grandparent
        }
        return n;
      });

    onSaveNodes(updated);
    if (selectedNodeId === id) {
      setSelectedNodeId(null);
      setIsDetailsOpen(false);
    }

    data.addSheetLog("HumailEli_Org_Chart", "DELETE", { id, positionName: nodeToDelete.positionName });
  };

  // Assign Employee to Node
  const handleAssignEmployee = (nodeId: string, employeeId: string | undefined) => {
    const updated = nodes.map(n => {
      if (n.id === nodeId) {
        return { ...n, employeeId: employeeId || undefined };
      }
      return n;
    });
    onSaveNodes(updated);
    setIsAssigningEmployee(false);
    data.addSheetLog("HumailEli_Org_Chart", "UPDATE", { id: nodeId, employeeId, action: "ASSIGN_EMPLOYEE" });
  };

  // Toggle Critical Flag
  const handleToggleCritical = (nodeId: string) => {
    const updated = nodes.map(n => {
      if (n.id === nodeId) {
        const isCrit = !n.isCritical;
        return { 
          ...n, 
          isCritical: isCrit,
          riskLevel: isCrit ? 'Medium' : 'Low' as any
        };
      }
      return n;
    });
    onSaveNodes(updated);
    data.addSheetLog("HumailEli_Org_Chart", "UPDATE", { id: nodeId, action: "TOGGLE_CRITICAL" });
  };

  // Update Risk Level
  const handleUpdateRiskLevel = (nodeId: string, risk: 'Low' | 'Medium' | 'High') => {
    const updated = nodes.map(n => {
      if (n.id === nodeId) {
        return { ...n, riskLevel: risk };
      }
      return n;
    });
    onSaveNodes(updated);
    data.addSheetLog("HumailEli_Org_Chart", "UPDATE", { id: nodeId, riskLevel: risk, action: "UPDATE_RISK" });
  };

  // Add Successor
  const handleAddSuccessorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNodeId || !selectedSuccessorId) return;

    const node = nodes.find(n => n.id === selectedNodeId);
    if (!node) return;

    if (node.successors.includes(selectedSuccessorId)) {
      alert("This employee is already designated as a successor for this role.");
      return;
    }

    // Update Node successors
    const updatedSuccessors = [...node.successors, selectedSuccessorId];
    const updatedNodes = nodes.map(n => {
      if (n.id === selectedNodeId) {
        return { ...n, successors: updatedSuccessors };
      }
      return n;
    });

    onSaveNodes(updatedNodes);

    // Bidir Sync: Create SuccessionPlan
    const successorEmp = activeEmployees.find(e => e.id === selectedSuccessorId);
    const incumbentEmp = activeEmployees.find(e => e.id === node.employeeId);
    
    const newPlan: SuccessionPlan = {
      id: `SUC-${Date.now().toString().slice(-4)}`,
      roleName: node.positionName,
      department: node.department,
      currentIncumbentId: incumbentEmp?.id || 'VACANT',
      currentIncumbentName: incumbentEmp?.name || 'Vacant Position',
      successorId: selectedSuccessorId,
      successorName: successorEmp?.name || 'Unknown',
      potentialRating: 'High',
      readiness: successorReadiness,
      notes: successorNotes || `Added via Org Chart successor mapping tool.`
    };

    setPlans([newPlan, ...plans]);
    setIsAssigningSuccessor(false);
    setSelectedSuccessorId('');
    setSuccessorNotes('');

    // Trigger local GSheets sync if not mock mode
    if (!isMockMode) {
      import('../lib/storage').then(({ syncSuccessionPlanToGSheet }) => {
        syncSuccessionPlanToGSheet(newPlan).catch(logger.error);
      });
    }

    data.addSheetLog("HumailEli_Succession", "INSERT", {
      id: newPlan.id,
      roleName: newPlan.roleName,
      successor: newPlan.successorName
    });
  };

  // Delete Successor relationship
  const handleDeleteSuccessor = (successorId: string) => {
    if (!selectedNodeId) return;
    const node = nodes.find(n => n.id === selectedNodeId);
    if (!node) return;

    // Remove from Node successors list
    const updatedSuccessors = node.successors.filter(id => id !== successorId);
    const updatedNodes = nodes.map(n => {
      if (n.id === selectedNodeId) {
        return { ...n, successors: updatedSuccessors };
      }
      return n;
    });
    onSaveNodes(updatedNodes);

    // Bidir Sync: Remove SuccessionPlan from plans
    const updatedPlans = plans.filter(p => !(p.roleName === node.positionName && p.successorId === successorId));
    setPlans(updatedPlans);

    data.addSheetLog("HumailEli_Succession", "DELETE", {
      roleName: node.positionName,
      successorId
    });
  };

  // Get successors with readiness from current plans state
  const getNodeSuccessorsData = (node: OrgChartNode) => {
    return node.successors.map(sucId => {
      const emp = employees.find(e => e.id === sucId);
      const plan = plans.find(p => p.roleName === node.positionName && p.successorId === sucId);
      return {
        id: sucId,
        name: emp?.name || 'Unknown Candidate',
        email: emp?.email || '',
        readiness: plan?.readiness || 'Ready in 2+ Years',
        potential: plan?.potentialRating || 'Medium'
      };
    });
  };

  // Colors for readiness level
  const getReadinessBadgeColor = (readiness: string) => {
    switch (readiness) {
      case 'Ready Now':
        return 'bg-emerald-500 text-white';
      case 'Ready in 1 Year':
        return 'bg-blue-500 text-white';
      case 'Ready in 2+ Years':
        return 'bg-amber-500 text-white';
      default:
        return 'bg-slate-400 text-white';
    }
  };

  const getReadinessColorCode = (readiness: string) => {
    switch (readiness) {
      case 'Ready Now': return '🟢';
      case 'Ready in 1 Year': return '🔵';
      case 'Ready in 2+ Years': return '🟡';
      default: return '⚪';
    }
  };

  // Render Node Card
  const OrgChartNodeCard = ({ node }: { node: OrgChartNode }) => {
    const incumbent = employees.find(e => e.id === node.employeeId);
    const successorsData = getNodeSuccessorsData(node);

    // Draggable attributes
    const handleDragStart = (e: React.DragEvent) => {
      if (!isEditMode) return;
      e.dataTransfer.setData('text/plain', node.id);
      e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent) => {
      if (!isEditMode) return;
      e.preventDefault();
      setDragOverNodeId(node.id);
    };

    const handleDragLeave = () => {
      setDragOverNodeId(null);
    };

    const handleDrop = (e: React.DragEvent) => {
      if (!isEditMode) return;
      e.preventDefault();
      setDragOverNodeId(null);
      const draggedId = e.dataTransfer.getData('text/plain');
      handleMoveNode(draggedId, node.id);
    };

    return (
      <div
        id={`org-card-${node.id}`}
        draggable={isEditMode}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative p-4 rounded-2xl border transition-all duration-300 w-72 text-left bg-white shadow-sm flex flex-col gap-3 group select-none cursor-pointer ${
          isEditMode ? 'hover:scale-102 border-slate-300 active:opacity-80' : 'hover:shadow-md'
        } ${
          dragOverNodeId === node.id ? 'ring-2 ring-violet-500 bg-violet-50/50 scale-105' : ''
        } ${
          node.isCritical 
            ? 'border-rose-400 ring-1 ring-rose-300 bg-gradient-to-br from-white to-rose-50/30 shadow-rose-100/30 shadow-md' 
            : 'border-slate-100'
        }`}
        onClick={() => {
          setSelectedNodeId(node.id);
          setIsDetailsOpen(true);
        }}
      >
        {/* Critical Role Ribbons / Star */}
        {node.isCritical && (
          <div className="absolute -top-2.5 -right-2.5 bg-rose-500 text-white rounded-full p-1.5 shadow-md shadow-rose-500/20 z-10">
            <Star className="w-3.5 h-3.5 fill-white" />
          </div>
        )}

        {/* Drag Indicator handle in Edit Mode */}
        {isEditMode && (
          <div className="absolute top-2 right-2 text-slate-300 group-hover:text-slate-400">
            <Move className="w-3.5 h-3.5" />
          </div>
        )}

        {/* Position Name & Dept */}
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
            {node.department}
          </span>
          <h4 className="text-xs font-extrabold text-slate-800 leading-tight mt-0.5 font-display flex items-center gap-1.5">
            {node.positionName}
          </h4>
        </div>

        {/* Incumbent */}
        <div className="flex items-center gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100/60">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${
            incumbent ? 'bg-violet-600 text-white' : 'bg-slate-200 text-slate-500'
          }`}>
            {incumbent ? incumbent.name.slice(0, 2) : 'V'}
          </div>
          <div className="overflow-hidden">
            <p className="text-[11px] font-bold text-slate-800 truncate">
              {incumbent ? incumbent.name : 'Vacant Position'}
            </p>
            <p className="text-[9px] text-slate-400 truncate">
              {incumbent ? getEmployeeDesignation(incumbent, designations) : 'No active incumbent'}
            </p>
          </div>
        </div>

        {/* Successors & Risk Badges */}
        {node.isCritical && (
          <div className="mt-1 pt-2.5 border-t border-rose-100/50 space-y-2">
            <div className="flex items-center justify-between text-[10px]">
              <span className="font-bold text-rose-600 flex items-center gap-1">
                <ShieldAlert className="w-3 h-3 text-rose-500" /> Succession Risk:
              </span>
              <span className={`px-1.5 py-0.5 rounded-md font-bold text-[9px] ${
                node.riskLevel === 'High' ? 'bg-rose-100 text-rose-700' :
                node.riskLevel === 'Medium' ? 'bg-amber-100 text-amber-700' :
                'bg-emerald-100 text-emerald-700'
              }`}>
                {node.riskLevel} Risk
              </span>
            </div>

            {successorsData.length > 0 ? (
              <div className="space-y-1.5">
                <span className="text-[9px] font-bold text-slate-400 block uppercase">Mapped Successors</span>
                <div className="grid grid-cols-1 gap-1">
                  {successorsData.map(suc => (
                    <div 
                      key={suc.id} 
                      className="flex items-center justify-between text-[10px] bg-white border border-slate-100 p-1.5 rounded-lg shadow-2xs"
                    >
                      <span className="font-medium text-slate-700 truncate max-w-[150px]">
                        {suc.name}
                      </span>
                      <span className="text-[9px] font-bold text-slate-500 flex items-center gap-1 shrink-0">
                        {getReadinessColorCode(suc.readiness)} {suc.readiness}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-[10px] text-amber-600 bg-amber-50/50 border border-amber-100 p-2 rounded-xl italic flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                No successors assigned!
              </div>
            )}
          </div>
        )}

        {/* Quick Edit Actions when in edit mode */}
        {isEditMode && (
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-end gap-1.5 onClickStop" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => handleToggleCritical(node.id)}
              title={node.isCritical ? "Remove Critical Designation" : "Mark as Critical Role"}
              className={`p-1.5 rounded-lg border transition-all ${
                node.isCritical 
                  ? 'bg-rose-50 text-rose-600 border-rose-200' 
                  : 'bg-slate-50 text-slate-400 border-slate-200 hover:text-rose-500 hover:border-rose-300'
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${node.isCritical ? 'fill-rose-500' : ''}`} />
            </button>
            
            <button
              onClick={() => handleDeleteNode(node.id)}
              title="Delete Position"
              className="p-1.5 rounded-lg bg-slate-50 text-slate-400 border border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    );
  };

  // Recursive Tree Renderer for Traditional Tree Mode
  const TreeNode = ({ nodeId }: { nodeId: string; key?: React.Key }) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return null;

    // Direct children
    const directChildren = nodes.filter(n => n.parentId === nodeId);

    return (
      <div className="flex flex-col items-center">
        {/* Connection line above if has parent */}
        {node.parentId && (
          <div className="h-6 w-0.5 bg-slate-200 relative mb-1">
            <div className="absolute -top-1 -left-[3px] w-2.5 h-2.5 rounded-full bg-slate-300" />
          </div>
        )}

        <OrgChartNodeCard node={node} />

        {/* Connection line below if has children */}
        {directChildren.length > 0 && (
          <div className="flex flex-col items-center w-full">
            <div className="h-6 w-0.5 bg-slate-200" />
            <div className="relative w-full flex justify-center">
              {/* Horizontal connecting line */}
              {directChildren.length > 1 && (
                <div className="absolute top-0 left-[12%] right-[12%] h-0.5 bg-slate-200" />
              )}
              <div className="flex gap-8 pt-4">
                {directChildren.map(child => (
                  <TreeNode key={child.id} nodeId={child.id} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Compact List Item Renderer for Indented View
  const CompactNodeItem = ({ nodeId, depth = 0 }: { nodeId: string; depth: number; key?: React.Key }) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return null;

    const directChildren = nodes.filter(n => n.parentId === nodeId);
    const incumbent = employees.find(e => e.id === node.employeeId);

    return (
      <div className="space-y-2">
        <div 
          onClick={() => {
            setSelectedNodeId(node.id);
            setIsDetailsOpen(true);
          }}
          className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border bg-white/70 backdrop-blur-xs shadow-2xs hover:shadow-sm hover:bg-white transition-all cursor-pointer gap-2 ${
            node.isCritical ? 'border-rose-200 ring-1 ring-rose-100' : 'border-slate-100/80'
          }`}
          style={{ marginLeft: `${depth * 28}px` }}
        >
          <div className="flex items-center gap-3">
            <div className="text-slate-400 shrink-0">
              {directChildren.length > 0 ? (
                <GitMerge className="w-4 h-4 text-violet-500" />
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 block ml-1.5" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-extrabold text-slate-800 font-display">
                  {node.positionName}
                </h4>
                {node.isCritical && (
                  <span className="px-1.5 py-0.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-md text-[8px] font-bold tracking-wider uppercase flex items-center gap-0.5">
                    <Star className="w-2 h-2 fill-rose-500" /> Critical
                  </span>
                )}
                <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md font-bold">
                  {node.department}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Incumbent: <span className="font-semibold">{incumbent ? incumbent.name : 'Vacant'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            {node.isCritical && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 font-mono">
                  Successors: {node.successors.length}
                </span>
                <span className={`text-[9px] px-1.5 py-0.5 font-bold rounded-md ${
                  node.riskLevel === 'High' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                  node.riskLevel === 'Medium' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                  'bg-emerald-50 text-emerald-700 border border-emerald-100'
                }`}>
                  {node.riskLevel} Risk
                </span>
              </div>
            )}

            {isEditMode && (
              <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                <button
                  onClick={() => handleToggleCritical(node.id)}
                  className="p-1 rounded bg-slate-50 border border-slate-200 text-slate-400 hover:text-rose-500 hover:border-rose-200"
                >
                  <Star className={`w-3.5 h-3.5 ${node.isCritical ? 'fill-rose-500 text-rose-500' : ''}`} />
                </button>
                <button
                  onClick={() => handleDeleteNode(node.id)}
                  className="p-1 rounded bg-slate-50 border border-slate-200 text-slate-400 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {directChildren.map(child => (
          <CompactNodeItem key={child.id} nodeId={child.id} depth={depth + 1} />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Chart Control Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/50 shrink-0">
            <button
              onClick={() => setLayoutMode('tree')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                layoutMode === 'tree' ? 'bg-white text-violet-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Tree View
            </button>
            <button
              onClick={() => setLayoutMode('compact')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                layoutMode === 'compact' ? 'bg-white text-violet-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Compact List
            </button>
          </div>

          <span className="text-[10px] bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg font-mono text-slate-500 font-bold">
            Nodes: {nodes.length}
          </span>
        </div>

        {/* View / Edit Mode Toggle & Add Button */}
        <div className="flex items-center gap-3 self-end sm:self-auto">
          {isEditMode && (
            <button
              onClick={() => setIsAddNodeOpen(true)}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/10 transition-all flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Add Position
            </button>
          )}

          <button
            onClick={() => setIsEditMode(!isEditMode)}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border shadow-sm ${
              isEditMode 
                ? 'bg-violet-600 text-white border-violet-500 hover:bg-violet-700 shadow-violet-600/15' 
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {isEditMode ? '💾 View Mode (Lock)' : '✏️ Edit Org Chart'}
          </button>
        </div>
      </div>

      {/* Editor Guide Banner */}
      {isEditMode && (
        <div className="bg-violet-50 border border-violet-100 p-4 rounded-2xl flex items-start gap-3 text-violet-700">
          <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5 text-violet-600" />
          <div>
            <h4 className="text-xs font-bold">You are in Org Chart Edit Mode</h4>
            <p className="text-[11px] text-violet-600 mt-1 leading-relaxed">
              • **Reparenting**: Drag any node and drop it onto another node to change whom it reports to.
              <br />• **Critical Roles**: Mark positions as critical to establish successor pathways and review potential plans.
              <br />• **Right Click & Modals**: Click any node to assign employees, add succession candidates, or edit properties instantly.
            </p>
          </div>
        </div>
      )}

      {/* Main Chart Canvas Area */}
      <div className="bg-slate-50/60 rounded-3xl border border-slate-100 p-8 min-h-[450px] overflow-auto flex justify-center items-start">
        {nodes.length === 0 ? (
          <div className="text-center py-12 space-y-4 max-w-sm m-auto">
            <AlertTriangle className="w-12 h-12 text-slate-300 mx-auto" />
            <div>
              <h4 className="text-md font-bold text-slate-800">No Positions Defined</h4>
              <p className="text-xs text-slate-400 mt-1">
                Enter Org Chart Edit Mode and click "Add Position" to establish the first organizational node.
              </p>
            </div>
          </div>
        ) : layoutMode === 'tree' ? (
          /* TRADITIONAL TREE VIEW COMPONENT */
          <div className="flex flex-col gap-8 items-center min-w-[max-content] py-4">
            {rootNodes.map(root => (
              <TreeNode key={root.id} nodeId={root.id} />
            ))}
          </div>
        ) : (
          /* COMPACT NESTED LIST COMPONENT */
          <div className="w-full max-w-4xl space-y-3">
            {rootNodes.map(root => (
              <CompactNodeItem key={root.id} nodeId={root.id} depth={0} />
            ))}
          </div>
        )}
      </div>

      {/* Details & Succession Modal */}
      {isDetailsOpen && selectedNode && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-6 shadow-2xl overflow-y-auto max-h-[90vh]"
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-violet-600 bg-violet-50 px-2.5 py-1 rounded-lg">
                  {selectedNode.department}
                </span>
                <h3 className="text-md font-extrabold text-slate-800 mt-1.5 font-display">
                  {selectedNode.positionName}
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsDetailsOpen(false);
                  setIsAssigningSuccessor(false);
                  setIsAssigningEmployee(false);
                }}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Main Content Info */}
            <div className="space-y-5">
              
              {/* Current Incumbent Card */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Current Incumbent</span>
                
                {isAssigningEmployee ? (
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                    <label className="text-xs font-bold text-slate-600 block">Select Employee to Assign</label>
                    <div className="flex gap-2">
                      <select
                        value={selectedAssigneeId}
                        onChange={(e) => setSelectedAssigneeId(e.target.value)}
                        className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-violet-500 focus:outline-none"
                      >
                        <option value="">-- Vacant / Unassigned --</option>
                        {activeEmployees.map(e => (
                          <option key={e.id} value={e.id}>{e.name} ({e.role})</option>
                        ))}
                      </select>
                      
                      <button
                        onClick={() => handleAssignEmployee(selectedNode.id, selectedAssigneeId || undefined)}
                        className="px-3 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setIsAssigningEmployee(false)}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-violet-600 flex items-center justify-center text-xs font-bold text-white shadow">
                        {selectedNode.employeeId 
                          ? employees.find(e => e.id === selectedNode.employeeId)?.name.slice(0, 2) 
                          : 'V'}
                      </div>
                      <div>
                        <h4 className="text-xs font-extrabold text-slate-800">
                          {selectedNode.employeeId 
                            ? employees.find(e => e.id === selectedNode.employeeId)?.name 
                            : 'Vacant Position'}
                        </h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {selectedNode.employeeId 
                            ? employees.find(e => e.id === selectedNode.employeeId)?.email 
                            : 'No active employee assigned to this slot'}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedAssigneeId(selectedNode.employeeId || '');
                        setIsAssigningEmployee(true);
                      }}
                      className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold text-slate-600 transition-colors flex items-center gap-1"
                    >
                      <Edit className="w-3 h-3" /> Assign
                    </button>
                  </div>
                )}
              </div>

              {/* Critical Settings Dashboard */}
              <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">Designate as Critical Role</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">Critical roles require designated successors for contingency mapping.</p>
                  </div>
                  <button
                    onClick={() => handleToggleCritical(selectedNode.id)}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 border shadow-xs ${
                      selectedNode.isCritical 
                        ? 'bg-rose-500 text-white border-rose-400 hover:bg-rose-600 shadow-rose-500/10' 
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Star className={`w-3 h-3 ${selectedNode.isCritical ? 'fill-white' : ''}`} />
                    {selectedNode.isCritical ? 'Critical' : 'Standard'}
                  </button>
                </div>

                {selectedNode.isCritical && (
                  <div className="pt-3 border-t border-slate-200/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <span className="text-[10px] font-bold text-slate-500">Risk Profile Level:</span>
                    <div className="flex gap-1.5">
                      {(['Low', 'Medium', 'High'] as const).map(risk => (
                        <button
                          key={risk}
                          onClick={() => handleUpdateRiskLevel(selectedNode.id, risk)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                            selectedNode.riskLevel === risk 
                              ? risk === 'High' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                risk === 'Medium' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-white text-slate-400 border-slate-100 hover:bg-slate-50'
                          }`}
                        >
                          {risk === 'High' ? '🔴 High' : risk === 'Medium' ? '🟡 Medium' : '🟢 Low'}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Successor Management Dashboard */}
              {selectedNode.isCritical && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Successors & Readiness</span>
                    {!isAssigningSuccessor && (
                      <button
                        onClick={() => setIsAssigningSuccessor(true)}
                        className="px-2.5 py-1 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-xl text-[10px] font-bold shadow-sm flex items-center gap-1"
                      >
                        <UserPlus className="w-3 h-3" /> Add Successor
                      </button>
                    )}
                  </div>

                  {/* Assign successor sub-form */}
                  {isAssigningSuccessor && (
                    <form onSubmit={handleAddSuccessorSubmit} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500">Successor Candidate</label>
                          <select
                            required
                            value={selectedSuccessorId}
                            onChange={(e) => setSelectedSuccessorId(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:ring-1 focus:ring-violet-500 focus:outline-none"
                          >
                            <option value="">-- Select employee --</option>
                            {activeEmployees
                              .filter(e => e.id !== selectedNode.employeeId)
                              .map(e => (
                                <option key={e.id} value={e.id}>{e.name} ({e.role})</option>
                              ))}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500">Readiness Timeline</label>
                          <select
                            value={successorReadiness}
                            onChange={(e: any) => setSuccessorReadiness(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:ring-1 focus:ring-violet-500 focus:outline-none"
                          >
                            <option value="Ready Now">Ready Now</option>
                            <option value="Ready in 1 Year">Ready in 1 Year</option>
                            <option value="Ready in 2+ Years">Ready in 2+ Years</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500">Assessment / Transition Notes</label>
                        <textarea
                          placeholder="Why is this candidate the correct strategic successor?"
                          value={successorNotes}
                          onChange={(e) => setSuccessorNotes(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs h-14 focus:ring-1 focus:ring-violet-500 focus:outline-none"
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setIsAssigningSuccessor(false)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-bold shadow-sm"
                        >
                          Designate Candidate
                        </button>
                      </div>
                    </form>
                  )}

                  {/* List of current successors */}
                  <div className="space-y-2">
                    {getNodeSuccessorsData(selectedNode).length > 0 ? (
                      getNodeSuccessorsData(selectedNode).map(suc => (
                        <div 
                          key={suc.id} 
                          className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-white shadow-3xs"
                        >
                          <div>
                            <h5 className="text-xs font-bold text-slate-800">{suc.name}</h5>
                            <p className="text-[10px] text-slate-400 mt-0.5">{suc.email}</p>
                          </div>

                          <div className="flex items-center gap-2.5">
                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold ${getReadinessBadgeColor(suc.readiness)}`}>
                              {suc.readiness}
                            </span>
                            
                            <button
                              onClick={() => handleDeleteSuccessor(suc.id)}
                              title="Remove Successor"
                              className="text-slate-400 hover:text-rose-600 p-1 rounded-md hover:bg-slate-50 transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center p-6 bg-slate-50 border border-dashed border-slate-200 rounded-2xl italic text-xs text-slate-400">
                        No successors currently designated. Click "Add Successor" to initiate mapping.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer buttons */}
            <div className="pt-4 flex justify-end border-t border-slate-100">
              <button
                onClick={() => {
                  setIsDetailsOpen(false);
                  setIsAssigningSuccessor(false);
                  setIsAssigningEmployee(false);
                }}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold shadow-sm"
              >
                Close View
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Add Position Modal */}
      {isAddNodeOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl"
          >
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-md font-bold text-slate-800">Add New Org Chart Position</h3>
              <button
                onClick={() => setIsAddNodeOpen(false)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddNodeSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">Position Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Lead HR Specialist"
                    value={newNodeName}
                    onChange={(e) => setNewNodeName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-violet-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">Department</label>
                  <select
                    value={newNodeDept}
                    onChange={(e) => setNewNodeDept(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-violet-500 focus:outline-none"
                  >
                    <option value="Executive">Executive</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Human Resources">Human Resources</option>
                    <option value="Finance">Finance</option>
                    <option value="Sales">Sales</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Operations">Operations</option>
                    <option value="Design">Design</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">Reports To (Parent)</label>
                  <select
                    value={newNodeParentId}
                    onChange={(e) => setNewNodeParentId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-violet-500 focus:outline-none"
                  >
                    <option value="">-- None (Root Node) --</option>
                    {nodes.map(n => (
                      <option key={n.id} value={n.id}>{n.positionName} ({n.department})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">Current Incumbent (Optional)</label>
                  <select
                    value={newNodeEmpId}
                    onChange={(e) => setNewNodeEmpId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-violet-500 focus:outline-none"
                  >
                    <option value="">-- Vacant / Unassigned --</option>
                    {activeEmployees.map(e => (
                      <option key={e.id} value={e.id}>{e.name} ({e.role})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <input
                  type="checkbox"
                  id="newNodeIsCritical"
                  checked={newNodeIsCritical}
                  onChange={(e) => setNewNodeIsCritical(e.target.checked)}
                  className="w-4 h-4 text-violet-600 focus:ring-violet-500 rounded"
                />
                <label htmlFor="newNodeIsCritical" className="text-xs font-bold text-slate-700 cursor-pointer select-none">
                  Check if this is a **Critical Position** requiring successors
                </label>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddNodeOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold shadow-md shadow-violet-600/10"
                >
                  Create Position
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

    </div>
  );
}
