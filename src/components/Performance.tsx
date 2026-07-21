import React, { useState, useEffect } from 'react';
import { Target, BarChart3, Plus, Edit2, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { User, Employee, PerformanceReviewCycle, PerformanceGoal, Department, Designation } from '../types';
import { useData } from '../contexts/DataContext';
import ReviewCycleModal from './ReviewCycleModal';
import ReviewTemplates from './ReviewTemplates';
import SelfReview from './SelfReview';
import ManagerReview from './ManagerReview';
import PeerReview from './PeerReview';
import ReviewList from './ReviewList';
import Feedback360 from './Feedback360';
import PerformanceAnalytics from './PerformanceAnalytics';
import PerformanceGoals from './PerformanceGoals';

interface PerformanceProps {
  user: User | null;
  departments: Department[];
  designations: Designation[];
}

export default function Performance({ user, departments, designations }: PerformanceProps) {
  const data = useData();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'cycles' | 'reviews' | 'goals' | 'feedback' | 'analytics' | 'templates' | 'my-reviews' | 'team-reviews' | 'peer-reviews'>('dashboard');
  const [cycles, setCycles] = useState<PerformanceReviewCycle[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCycle, setEditingCycle] = useState<PerformanceReviewCycle | undefined>(undefined);

  useEffect(() => {
    let mounted = true;
    async function load() {
      const [cyc, emps, revs] = await Promise.all([
        data.getPerformanceReviewCycles(),
        data.getEmployees(),
        data.getPerformanceReviews(),
      ]);
      if (mounted) {
        setCycles(cyc);
        setEmployees(emps as any);
        setReviews(revs as any);
      }
    }
    load();
    return () => { mounted = false; };
  }, [data]);

  const getFilteredData = () => {
    let filteredReviews = reviews;
    let filteredEmployees = employees.filter(e => e.employment.status !== 'Terminated');

    if (user?.role === 'Employee') {
      filteredReviews = reviews.filter(r => r.employeeId === user.employeeId);
      filteredEmployees = employees.filter(e => e.id === user.employeeId);
    } else if (user?.role === 'Manager') {
      const teamIds = employees.filter(e => e.employment.reportingManagerId === user.employeeId).map(e => e.id);
      filteredReviews = reviews.filter(r => teamIds.includes(r.employeeId));
      filteredEmployees = employees.filter(e => teamIds.includes(e.id) || e.id === user.employeeId);
    }
    
    return { filteredReviews, filteredEmployees };
  };

  const { filteredReviews, filteredEmployees } = getFilteredData();
  const completedReviews = filteredReviews.filter(r => r.status === 'Completed');
  const pendingReviews = filteredReviews.filter(r => r.status === 'Draft' || r.status === 'Submitted');
  const rawAvgScore = completedReviews.length > 0
    ? (completedReviews.reduce((sum, r) => sum + (r.overallScore || 0), 0) / completedReviews.length)
    : 0;
  const avgScore = (rawAvgScore / 20).toFixed(1);

  const handleSaveCycle = async (cycle: PerformanceReviewCycle) => {
    if (new Date(cycle.startDate) >= new Date(cycle.endDate)) {
      alert("Start date must be before end date.");
      return;
    }

    const isOverlapping = cycles.some(c => {
      if (c.id === cycle.id) return false;
      if (c.status !== 'Active' || cycle.status !== 'Active') return false;
      
      const startA = new Date(cycle.startDate);
      const endA = new Date(cycle.endDate);
      const startB = new Date(c.startDate);
      const endB = new Date(c.endDate);
      
      return startA <= endB && endA >= startB;
    });

    if (isOverlapping) {
      alert("This cycle overlaps with an existing Active review cycle.");
      return;
    }

    let newCycles;
    if (editingCycle) {
      newCycles = cycles.map(c => c.id === cycle.id ? cycle : c);
    } else {
      newCycles = [...cycles, cycle];
    }
    setCycles(newCycles);
    await data.savePerformanceReviewCycles(newCycles);
    setIsModalOpen(false);
    setEditingCycle(undefined);
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'cycles', label: 'Review Cycles' },
    { id: 'templates', label: 'Templates' },
    { id: 'reviews', label: 'Reviews' },
    { id: 'my-reviews', label: 'My Reviews' },
    { id: 'team-reviews', label: 'Team Reviews' },
    { id: 'peer-reviews', label: 'Peer Reviews' },
    { id: 'goals', label: 'Goals' },
    { id: 'feedback', label: '360 Feedback' },
    { id: 'analytics', label: 'Analytics' },
  ] as const;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Performance Management</h1>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl font-bold whitespace-nowrap ${activeTab === tab.id ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'dashboard' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Employees', value: filteredEmployees.length },
            { label: 'Reviews Completed', value: completedReviews.length },
            { label: 'Pending Reviews', value: pendingReviews.length },
            { label: 'Avg Score', value: `${avgScore}/5` },
          ].map((item, index) => (
            <div key={index} className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
              <p className="text-xs text-slate-500 font-medium uppercase">{item.label}</p>
              <p className="text-2xl font-bold text-slate-900">{item.value}</p>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'cycles' && (
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-slate-900">Review Cycles</h3>
            <button 
              onClick={() => { setEditingCycle(undefined); setIsModalOpen(true); }}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Create Review Cycle
            </button>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-6 py-3 text-left">Name</th>
                <th className="px-6 py-3 text-left">Type</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-left">Start Date</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cycles.map(cycle => (
                <tr key={cycle.id}>
                  <td className="px-6 py-4 font-medium">{cycle.name}</td>
                  <td className="px-6 py-4">{cycle.type}</td>
                  <td className="px-6 py-4">{cycle.status}</td>
                  <td className="px-6 py-4">{cycle.startDate}</td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => { setEditingCycle(cycle); setIsModalOpen(true); }}
                      className="text-slate-500 hover:text-indigo-600 mr-2"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button className="text-slate-500 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'templates' && <ReviewTemplates />}
      {activeTab === 'my-reviews' && <SelfReview employeeId={user?.employeeId} />}
      {activeTab === 'team-reviews' && (
        <ManagerReview 
          managerId={user?.employeeId} 
          managerName={employees.find(e => e.id === user?.employeeId)?.name || 'Manager'} 
        />
      )}
      {activeTab === 'peer-reviews' && (
        <PeerReview 
          userId={user?.employeeId} 
          userName={employees.find(e => e.id === user?.employeeId)?.name || 'Employee'} 
        />
      )}
      {activeTab === 'goals' && <PerformanceGoals user={user} />}
      {activeTab === 'feedback' && (
        <Feedback360 
          userId={user?.employeeId} 
          userRole={user?.role} 
        />
      )}

      {activeTab === 'analytics' && (
        <PerformanceAnalytics user={user} departments={departments} designations={designations} />
      )}

      {activeTab === 'reviews' && (
        <ReviewList user={user} />
      )}
      <ReviewCycleModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSaveCycle}
        cycle={editingCycle}
      />
    </div>
  );
}
