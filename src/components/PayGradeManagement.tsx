import React, { useState } from 'react';
import { 
  Award, Plus, Edit2, Trash2, Save, X, 
  CheckCircle, AlertCircle 
} from 'lucide-react';
import { PayGrade } from '../types';
import { getPayGrades, savePayGrades } from '../lib/storage';

export default function PayGradeManagement() {
  const [payGrades, setPayGrades] = useState<PayGrade[]>(getPayGrades());
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<PayGrade>>({
    name: '',
    code: '',
    minSalary: 0,
    maxSalary: 0,
    currency: 'USD',
    level: 1,
    category: 'Staff',
    isActive: true,
    description: ''
  });

  const handleSave = () => {
    if (!formData.name || !formData.code) {
      alert('Name and code are required');
      return;
    }

    const grade: PayGrade = {
      id: editingId || `PG-${Date.now()}`,
      name: formData.name,
      code: formData.code.toUpperCase(),
      minSalary: formData.minSalary || 0,
      maxSalary: formData.maxSalary || 0,
      currency: formData.currency || 'USD',
      level: formData.level || 1,
      category: formData.category || 'Staff',
      isActive: formData.isActive !== false,
      description: formData.description || '',
      createdAt: editingId ? payGrades.find(g => g.id === editingId)?.createdAt || new Date().toISOString() : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    let updated;
    if (editingId) {
      updated = payGrades.map(g => g.id === editingId ? grade : g);
    } else {
      updated = [...payGrades, grade];
    }

    setPayGrades(updated);
    savePayGrades(updated);
    setShowAddModal(false);
    setEditingId(null);
    setFormData({ name: '', code: '', minSalary: 0, maxSalary: 0, currency: 'USD', level: 1, category: 'Staff', isActive: true, description: '' });
    alert(editingId ? 'Pay grade updated!' : 'Pay grade created!');
  };

  const handleDelete = (id: string) => {
    if (!confirm('Delete this pay grade?')) return;
    const updated = payGrades.filter(g => g.id !== id);
    setPayGrades(updated);
    savePayGrades(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <Award className="w-4 h-4 text-indigo-600" />
          Pay Grades & Salary Bands
        </h3>
        <button
          onClick={() => { setEditingId(null); setFormData({ name: '', code: '', minSalary: 0, maxSalary: 0, currency: 'USD', level: 1, category: 'Staff', isActive: true, description: '' }); setShowAddModal(true); }}
          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" /> Add Grade
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 text-slate-400">
            <tr>
              <th className="px-3 py-2 text-left">Name</th>
              <th className="px-3 py-2 text-left">Code</th>
              <th className="px-3 py-2 text-left">Min Salary</th>
              <th className="px-3 py-2 text-left">Max Salary</th>
              <th className="px-3 py-2 text-left">Level</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {payGrades.map(grade => (
              <tr key={grade.id} className="hover:bg-slate-50">
                <td className="px-3 py-2 font-medium text-slate-700">{grade.name}</td>
                <td className="px-3 py-2 text-slate-500">{grade.code}</td>
                <td className="px-3 py-2 text-slate-500">{grade.currency}{grade.minSalary}</td>
                <td className="px-3 py-2 text-slate-500">{grade.currency}{grade.maxSalary}</td>
                <td className="px-3 py-2 text-slate-500">{grade.level}</td>
                <td className="px-3 py-2">
                  <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                    grade.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                  }`}>
                    {grade.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-3 py-2 text-right">
                  <button
                    onClick={() => { setEditingId(grade.id); setFormData(grade); setShowAddModal(true); }}
                    className="text-slate-400 hover:text-slate-600 mr-2"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(grade.id)} className="text-slate-400 hover:text-rose-600">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">
                {editingId ? 'Edit' : 'Add'} Pay Grade
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Grade Name *</label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-sm"
                  placeholder="e.g., Senior Executive"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Code *</label>
                <input
                  type="text"
                  value={formData.code || ''}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-sm"
                  placeholder="e.g., SE"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Min Salary</label>
                <input
                  type="number"
                  value={formData.minSalary || 0}
                  onChange={(e) => setFormData({ ...formData, minSalary: Number(e.target.value) })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Max Salary</label>
                <input
                  type="number"
                  value={formData.maxSalary || 0}
                  onChange={(e) => setFormData({ ...formData, maxSalary: Number(e.target.value) })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Currency</label>
                <select
                  value={formData.currency || 'USD'}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-sm"
                >
                  <option value="PKR">PKR</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="AED">AED</option>
                  <option value="SAR">SAR</option>
                  <option value="INR">INR</option>
                  <option value="CAD">CAD</option>
                  <option value="AUD">AUD</option>
                  <option value="JPY">JPY</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Level</label>
                <input
                  type="number"
                  value={formData.level || 1}
                  onChange={(e) => setFormData({ ...formData, level: Number(e.target.value) })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-sm"
                  min="1"
                  max="10"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Category</label>
                <select
                  value={formData.category || 'Staff'}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-sm"
                >
                  <option value="Executive">Executive</option>
                  <option value="Management">Management</option>
                  <option value="Senior Staff">Senior Staff</option>
                  <option value="Staff">Staff</option>
                  <option value="Entry Level">Entry Level</option>
                  <option value="Intern">Intern</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-500 mt-5">
                  <input
                    type="checkbox"
                    checked={formData.isActive !== false}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded"
                  />
                  Active
                </label>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500">Description</label>
              <input
                type="text"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-sm"
                placeholder="Brief description of this pay grade"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button onClick={() => setShowAddModal(false)} className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium hover:bg-slate-50">
                Cancel
              </button>
              <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold">
                {editingId ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
