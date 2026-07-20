import React, { useState } from 'react';
import { PerformanceReviewCycle } from '../types';
import { X } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (cycle: PerformanceReviewCycle) => void;
  cycle?: PerformanceReviewCycle;
}

export default function ReviewCycleModal({ isOpen, onClose, onSave, cycle }: Props) {
  const [formData, setFormData] = useState<PerformanceReviewCycle>(cycle || {
    id: uuidv4(),
    name: '',
    description: '',
    type: 'Annual',
    status: 'Draft',
    reviewType: 'Self',
    startDate: '',
    endDate: '',
    selfReviewDeadline: '',
    managerReviewDeadline: '',
    peerReviewDeadline: '',
    includesSelfReview: true,
    includesManagerReview: true,
    includesPeerReview: false,
    includesSubordinateReview: false,
    sections: [],
    ratingScale: '1-5',
    ratingDescriptions: [],
    isActive: true,
    createdBy: 'SYSTEM',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{cycle ? 'Edit' : 'Create'} Review Cycle</h2>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Cycle Name"
            className="w-full p-2 border rounded-xl"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <input
            type="text"
            placeholder="Description"
            className="w-full p-2 border rounded-xl"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          <div className="flex gap-2">
            <select
              className="w-full p-2 border rounded-xl"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
            >
              {['Annual', 'Half-Yearly', 'Quarterly', 'Monthly', 'Probation', 'Ad-hoc'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select
              className="w-full p-2 border rounded-xl"
              value={formData.reviewType}
              onChange={(e) => setFormData({ ...formData, reviewType: e.target.value as any })}
            >
              {['Self', 'Manager', '360'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <input type="date" className="w-full p-2 border rounded-xl" value={formData.startDate} onChange={(e) => setFormData({...formData, startDate: e.target.value})} />
            <input type="date" className="w-full p-2 border rounded-xl" value={formData.endDate} onChange={(e) => setFormData({...formData, endDate: e.target.value})} />
          </div>
          
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={formData.includesSelfReview} onChange={e => setFormData({...formData, includesSelfReview: e.target.checked})} />
              Include Self Review
            </label>
            <input type="date" className="w-full p-2 border rounded-xl" value={formData.selfReviewDeadline} onChange={e => setFormData({...formData, selfReviewDeadline: e.target.value})} />
            
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={formData.includesManagerReview} onChange={e => setFormData({...formData, includesManagerReview: e.target.checked})} />
              Include Manager Review
            </label>
            <input type="date" className="w-full p-2 border rounded-xl" value={formData.managerReviewDeadline} onChange={e => setFormData({...formData, managerReviewDeadline: e.target.value})} />
          </div>

          <button
            onClick={() => onSave({ ...formData, updatedAt: new Date().toISOString() })}
            className="w-full p-2 bg-indigo-600 text-white rounded-xl font-bold"
          >
            Save Cycle
          </button>
        </div>
      </div>
    </div>
  );
}
