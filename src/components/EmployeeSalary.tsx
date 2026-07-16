import React, { useState, useEffect } from 'react';
import { 
  DollarSign, Calculator, TrendingUp, Award, 
  CheckCircle, AlertCircle, Save, X, Edit2, 
  Plus, Trash2, Clock, Shield
} from 'lucide-react';
import { 
  SalaryComponent, SalaryStructure, PayGrade, SalaryRevision,
  Employee 
} from '../types';
import {
  getPayGrades,
  saveSalaryStructure,
  getSalaryStructureByEmployee,
  getSalaryRevisionsByEmployee,
  addSalaryRevision,
  getSalaryStructures,
  saveSalaryStructures
} from '../lib/storage';

interface EmployeeSalaryProps {
  employee: Employee;
  onSave: () => void;
  isReadOnly?: boolean;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  PKR: 'Rs.',
  USD: '$',
  EUR: '€',
  GBP: '£',
  AED: 'د.إ',
  SAR: 'ر.س',
  INR: '₹',
  CAD: 'C$',
  AUD: 'A$',
  JPY: '¥'
};

const CURRENCIES = ['PKR', 'USD', 'EUR', 'GBP', 'AED', 'SAR', 'INR', 'CAD', 'AUD', 'JPY'];

const DEFAULT_COMPONENTS: Omit<SalaryComponent, 'id'>[] = [
  { name: 'Basic', type: 'fixed', taxable: true, amount: 0, percentageOfBasic: 100 },
  { name: 'Housing Allowance (HRA)', type: 'fixed', taxable: true, amount: 0, percentageOfBasic: 40 },
  { name: 'Transport Allowance', type: 'fixed', taxable: true, amount: 0, percentageOfBasic: 15 },
  { name: 'Medical Allowance', type: 'fixed', taxable: true, amount: 0, percentageOfBasic: 10 },
  { name: 'Special Allowance', type: 'fixed', taxable: true, amount: 0, percentageOfBasic: 20 },
  { name: 'Leave Travel Allowance (LTA)', type: 'fixed', taxable: false, amount: 0, percentageOfBasic: 10 },
];

const REVISION_REASONS = [
  'Annual Increment',
  'Promotion',
  'Market Adjustment',
  'Performance',
  'Contract Renewal',
  'Other'
];

export default function EmployeeSalary({ employee, onSave, isReadOnly = false }: EmployeeSalaryProps) {
  const [payGrades, setPayGrades] = useState<PayGrade[]>(getPayGrades());
  const [selectedCurrency, setSelectedCurrency] = useState<string>(employee.compensation.currency || 'USD');
  const [selectedPayGrade, setSelectedPayGrade] = useState<string>(employee.compensation.payGradeId || '');
  const [salaryComponents, setSalaryComponents] = useState<SalaryComponent[]>([]);
  const [salaryHistory, setSalaryHistory] = useState<SalaryRevision[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showGradeModal, setShowGradeModal] = useState(false);

  // New component form
  const [newComponentName, setNewComponentName] = useState('');
  const [newComponentType, setNewComponentType] = useState<'fixed' | 'variable'>('fixed');
  const [newComponentTaxable, setNewComponentTaxable] = useState(true);
  const [newComponentAmount, setNewComponentAmount] = useState(0);
  const [newComponentPctOfBasic, setNewComponentPctOfBasic] = useState(0);

  // Salary revision
  const [revisionReason, setRevisionReason] = useState('Annual Increment');
  const [revisionNotes, setRevisionNotes] = useState('');

  // Load existing salary structure
  useEffect(() => {
    const structure = getSalaryStructureByEmployee(employee.id);
    if (structure) {
      setSalaryComponents(structure.components);
      setSelectedCurrency(structure.currency || employee.compensation.currency || 'USD');
      setSelectedPayGrade(structure.payGradeId || employee.compensation.payGradeId || '');
    } else {
      // Initialize with default components
      const defaultComponents = DEFAULT_COMPONENTS.map((comp, index) => ({
        id: `COMP-${Date.now()}-${index}`,
        ...comp
      }));
      setSalaryComponents(defaultComponents);
    }

    const history = getSalaryRevisionsByEmployee(employee.id);
    setSalaryHistory(history);
  }, [employee.id]);

  // Calculate totals
  const calculateTotals = () => {
    const totalMonthly = salaryComponents.reduce((sum, comp) => sum + comp.amount, 0);
    const totalAnnual = totalMonthly * 12;
    
    // Find Basic component
    const basic = salaryComponents.find(c => c.name === 'Basic');
    const basicAmount = basic?.amount || 0;
    
    // Employer contributions
    const pf = basicAmount * 0.12; // 12% PF
    const esi = basicAmount * 0.04; // 4% ESI
    const gratuity = basicAmount * 0.0481; // 4.81% Gratuity
    const employerTotal = pf + esi + gratuity;
    
    const ctc = totalAnnual + employerTotal;
    
    return { totalMonthly, totalAnnual, ctc, pf, esi, gratuity, employerTotal };
  };

  const totals = calculateTotals();

  const getCurrencySymbol = (currency: string) => {
    return CURRENCY_SYMBOLS[currency] || '$';
  };

  const formatCurrency = (amount: number) => {
    return `${getCurrencySymbol(selectedCurrency)}${amount.toFixed(2)}`;
  };

  const handleComponentChange = (index: number, field: keyof SalaryComponent, value: any) => {
    const updated = [...salaryComponents];
    updated[index] = { ...updated[index], [field]: value };
    
    // If changing Basic, update percentages
    if (field === 'amount' && updated[index].name === 'Basic') {
      const newBasic = value;
      updated.forEach((comp, idx) => {
        if (comp.name !== 'Basic' && comp.percentageOfBasic) {
          updated[idx] = {
            ...updated[idx],
            amount: (newBasic * comp.percentageOfBasic) / 100
          };
        }
      });
    }
    
    setSalaryComponents(updated);
  };

  const handleAddComponent = () => {
    if (!newComponentName.trim()) {
      alert('Component name is required');
      return;
    }
    
    const newComp: SalaryComponent = {
      id: `COMP-${Date.now()}`,
      name: newComponentName.trim(),
      type: newComponentType,
      taxable: newComponentTaxable,
      amount: newComponentAmount,
      percentageOfBasic: newComponentPctOfBasic || undefined
    };
    
    setSalaryComponents([...salaryComponents, newComp]);
    setNewComponentName('');
    setNewComponentType('fixed');
    setNewComponentTaxable(true);
    setNewComponentAmount(0);
    setNewComponentPctOfBasic(0);
  };

  const handleRemoveComponent = (index: number) => {
    const updated = salaryComponents.filter((_, i) => i !== index);
    setSalaryComponents(updated);
  };

  const handleSaveSalary = () => {
    // Validate
    const basic = salaryComponents.find(c => c.name === 'Basic');
    if (!basic || basic.amount <= 0) {
      alert('Basic salary must be greater than 0');
      return;
    }

    // Check if salary is within pay grade range
    if (selectedPayGrade) {
      const grade = payGrades.find(g => g.id === selectedPayGrade);
      if (grade) {
        const totalMonthly = salaryComponents.reduce((sum, c) => sum + c.amount, 0);
        if (totalMonthly < grade.minSalary || totalMonthly > grade.maxSalary) {
          alert(`Salary is outside the pay grade range (${formatCurrency(grade.minSalary)} - ${formatCurrency(grade.maxSalary)})`);
          return;
        }
      }
    }

    const existingStructure = getSalaryStructureByEmployee(employee.id);
    
    const newStructure: SalaryStructure = {
      id: existingStructure?.id || `SAL-${Date.now()}`,
      employeeId: employee.id,
      components: salaryComponents,
      totalMonthly: totals.totalMonthly,
      totalAnnual: totals.totalAnnual,
      ctc: totals.ctc,
      employerContributions: {
        pf: totals.pf,
        esi: totals.esi,
        gratuity: totals.gratuity
      },
      payGradeId: selectedPayGrade || undefined,
      currency: selectedCurrency,
      effectiveFrom: new Date().toISOString().split('T')[0],
      isActive: true,
      createdAt: existingStructure?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Create revision if structure changed
    if (existingStructure) {
      const revision: SalaryRevision = {
        id: `REV-${Date.now()}`,
        employeeId: employee.id,
        oldStructure: existingStructure,
        newStructure: newStructure,
        revisionDate: new Date().toISOString(),
        reason: revisionReason as any,
        approvedBy: 'HR-ADMIN',
        approvedByName: 'HR Admin',
        notes: revisionNotes,
        createdAt: new Date().toISOString()
      };
      addSalaryRevision(revision);
      setSalaryHistory([revision, ...salaryHistory]);
    }

    // Save structure
    saveSalaryStructure(newStructure);
    
    setIsEditing(false);
    alert('✅ Salary structure saved successfully!');
    onSave();
  };

  const getPayGradeName = (id: string) => {
    const grade = payGrades.find(g => g.id === id);
    return grade ? `${grade.name} (${grade.code})` : 'Not assigned';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-indigo-600" />
            Salary & Compensation
          </h4>
          <p className="text-xs text-slate-400">Configure salary components, CTC, and employer contributions.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all"
          >
            <Clock className="w-3.5 h-3.5 inline mr-1" />
            History ({salaryHistory.length})
          </button>
          {!isReadOnly && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1"
            >
              <Edit2 className="w-3.5 h-3.5" />
              Edit Salary
            </button>
          )}
        </div>
      </div>

      {/* Currency & Pay Grade */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-500">Currency</label>
          <select
            value={selectedCurrency}
            onChange={(e) => setSelectedCurrency(e.target.value)}
            disabled={!isEditing || isReadOnly}
            className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:bg-slate-50 disabled:text-slate-400"
          >
            {CURRENCIES.map(curr => (
              <option key={curr} value={curr}>
                {curr} ({CURRENCY_SYMBOLS[curr]})
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-500 flex items-center gap-1">
            Pay Grade
            <button
              type="button"
              onClick={() => setShowGradeModal(!showGradeModal)}
              className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold underline"
            >
              View Grades
            </button>
          </label>
          <select
            value={selectedPayGrade}
            onChange={(e) => setSelectedPayGrade(e.target.value)}
            disabled={!isEditing || isReadOnly}
            className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:bg-slate-50 disabled:text-slate-400"
          >
            <option value="">-- No Pay Grade --</option>
            {payGrades.filter(g => g.isActive).map(grade => (
              <option key={grade.id} value={grade.id}>
                {grade.name} ({grade.code}) - {grade.currency}{grade.minSalary} - {grade.currency}{grade.maxSalary}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Pay Grade Info */}
      {selectedPayGrade && (
        <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs">
          <p className="font-bold text-slate-700">
            {getPayGradeName(selectedPayGrade)}
          </p>
          {(() => {
            const grade = payGrades.find(g => g.id === selectedPayGrade);
            if (grade) {
              const totalMonthly = salaryComponents.reduce((sum, c) => sum + c.amount, 0);
              const isWithinRange = totalMonthly >= grade.minSalary && totalMonthly <= grade.maxSalary;
              return (
                <p className={`mt-1 ${isWithinRange ? 'text-emerald-600' : 'text-amber-600'}`}>
                  Salary Range: {formatCurrency(grade.minSalary)} - {formatCurrency(grade.maxSalary)}
                  {!isWithinRange && ' ⚠️ Current salary is outside this range'}
                </p>
              );
            }
            return null;
          })()}
        </div>
      )}

      {/* Salary Components */}
      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <div className="bg-slate-50 px-4 py-2 border-b border-slate-200">
          <p className="text-xs font-bold text-slate-600">Salary Components</p>
        </div>
        <div className="p-4 space-y-2">
          {salaryComponents.map((comp, index) => (
            <div key={comp.id} className="flex items-center gap-3 p-2 bg-white border border-slate-100 rounded-xl hover:border-slate-300 transition-all">
              <div className="flex-1 grid grid-cols-3 gap-2 text-xs">
                <div className="space-y-0.5">
                  <p className="font-bold text-slate-700">{comp.name}</p>
                  <p className="text-[10px] text-slate-400">
                    {comp.type} • {comp.taxable ? 'Taxable' : 'Non-taxable'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">{comp.percentageOfBasic ? `${comp.percentageOfBasic}%` : 'Fixed'}</span>
                  {isEditing && !isReadOnly && (
                    <input
                      type="number"
                      value={comp.amount}
                      onChange={(e) => handleComponentChange(index, 'amount', Number(e.target.value))}
                      className="w-24 px-2 py-1 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  )}
                </div>
                <div className="text-right font-bold text-slate-700">
                  {isEditing && !isReadOnly ? (
                    <button
                      onClick={() => handleRemoveComponent(index)}
                      className="text-rose-500 hover:text-rose-700 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <span>{formatCurrency(comp.amount)}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Add component form */}
        {isEditing && !isReadOnly && (
          <div className="p-4 border-t border-slate-100 bg-slate-50/50">
            <div className="flex flex-wrap gap-2 items-center">
              <input
                type="text"
                value={newComponentName}
                onChange={(e) => setNewComponentName(e.target.value)}
                placeholder="Component name"
                className="flex-1 min-w-[120px] p-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <select
                value={newComponentType}
                onChange={(e) => setNewComponentType(e.target.value as any)}
                className="p-2 border border-slate-200 rounded-lg text-xs"
              >
                <option value="fixed">Fixed</option>
                <option value="variable">Variable</option>
              </select>
              <label className="flex items-center gap-1 text-xs text-slate-600">
                <input
                  type="checkbox"
                  checked={newComponentTaxable}
                  onChange={(e) => setNewComponentTaxable(e.target.checked)}
                  className="rounded"
                />
                Taxable
              </label>
              <input
                type="number"
                value={newComponentAmount}
                onChange={(e) => setNewComponentAmount(Number(e.target.value))}
                placeholder="Amount"
                className="w-20 p-2 border border-slate-200 rounded-lg text-xs"
              />
              <input
                type="number"
                value={newComponentPctOfBasic}
                onChange={(e) => setNewComponentPctOfBasic(Number(e.target.value))}
                placeholder="% of Basic"
                className="w-20 p-2 border border-slate-200 rounded-lg text-xs"
              />
              <button
                onClick={handleAddComponent}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-400">Total Monthly Salary</p>
          <p className="text-xl font-bold text-slate-800">{formatCurrency(totals.totalMonthly)}</p>
          <p className="text-xs text-slate-400">Annual: {formatCurrency(totals.totalAnnual)}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-400">CTC (Cost to Company)</p>
          <p className="text-xl font-bold text-indigo-600">{formatCurrency(totals.ctc)}</p>
          <p className="text-xs text-slate-400">Includes employer contributions</p>
        </div>
      </div>

      {/* Employer Contributions */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
        <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-indigo-600" />
          Employer Contributions
        </h5>
        <div className="grid grid-cols-3 gap-4 text-xs">
          <div>
            <p className="text-slate-400">PF (12%)</p>
            <p className="font-bold text-slate-700">{formatCurrency(totals.pf)}</p>
          </div>
          <div>
            <p className="text-slate-400">ESI (4%)</p>
            <p className="font-bold text-slate-700">{formatCurrency(totals.esi)}</p>
          </div>
          <div>
            <p className="text-slate-400">Gratuity (4.81%)</p>
            <p className="font-bold text-slate-700">{formatCurrency(totals.gratuity)}</p>
          </div>
        </div>
        <div className="mt-2 pt-2 border-t border-slate-200 flex justify-between text-xs">
          <span className="text-slate-400">Total Employer Cost</span>
          <span className="font-bold text-slate-700">{formatCurrency(totals.employerTotal)}</span>
        </div>
      </div>

      {/* Revision Reason (only when editing) */}
      {isEditing && !isReadOnly && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500">Revision Reason</label>
            <select
              value={revisionReason}
              onChange={(e) => setRevisionReason(e.target.value)}
              className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              {REVISION_REASONS.map(reason => (
                <option key={reason} value={reason}>{reason}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500">Notes (Optional)</label>
            <input
              type="text"
              value={revisionNotes}
              onChange={(e) => setRevisionNotes(e.target.value)}
              placeholder="e.g., Annual increment based on performance review"
              className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {isEditing && !isReadOnly && (
        <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
          <button
            onClick={() => {
              setIsEditing(false);
              // Reload original data
              const structure = getSalaryStructureByEmployee(employee.id);
              if (structure) {
                setSalaryComponents(structure.components);
                setSelectedCurrency(structure.currency);
                setSelectedPayGrade(structure.payGradeId || '');
              }
            }}
            className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium hover:bg-slate-50 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveSalary}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-all flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save Salary Structure
          </button>
        </div>
      )}

      {/* Salary History Modal */}
      {showHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-3xl p-6 shadow-2xl space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-600" />
                Salary History
              </h3>
              <button onClick={() => setShowHistory(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {salaryHistory.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">No salary revisions recorded.</p>
            ) : (
              <div className="space-y-4">
                {salaryHistory.map((revision) => (
                  <div key={revision.id} className="border border-slate-200 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-slate-800">{revision.reason}</p>
                        <p className="text-xs text-slate-400">
                          {new Date(revision.revisionDate).toLocaleDateString()} • By {revision.approvedByName}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-400">Old CTC</p>
                        <p className="text-sm font-bold text-slate-500 line-through">
                          {formatCurrency(revision.oldStructure.ctc)}
                        </p>
                        <p className="text-sm font-bold text-emerald-600">
                          {formatCurrency(revision.newStructure.ctc)}
                        </p>
                      </div>
                    </div>
                    {revision.notes && (
                      <p className="text-xs text-slate-500 mt-2 bg-slate-50 p-2 rounded-lg">{revision.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button onClick={() => setShowHistory(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-bold">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pay Grade Modal */}
      {showGradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Award className="w-5 h-5 text-indigo-600" />
                Pay Grades
              </h3>
              <button onClick={() => setShowGradeModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 text-slate-400">
                  <tr>
                    <th className="px-3 py-2 text-left">Name</th>
                    <th className="px-3 py-2 text-left">Code</th>
                    <th className="px-3 py-2 text-left">Min</th>
                    <th className="px-3 py-2 text-left">Max</th>
                    <th className="px-3 py-2 text-left">Level</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payGrades.filter(g => g.isActive).map(grade => (
                    <tr key={grade.id} className="hover:bg-slate-50">
                      <td className="px-3 py-2 font-medium text-slate-700">{grade.name}</td>
                      <td className="px-3 py-2 text-slate-500">{grade.code}</td>
                      <td className="px-3 py-2 text-slate-500">{grade.currency}{grade.minSalary}</td>
                      <td className="px-3 py-2 text-slate-500">{grade.currency}{grade.maxSalary}</td>
                      <td className="px-3 py-2 text-slate-500">{grade.level}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button onClick={() => setShowGradeModal(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-bold">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
