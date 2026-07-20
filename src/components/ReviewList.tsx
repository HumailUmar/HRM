import React, { useState, useMemo, useEffect } from 'react';
import { Employee, PerformanceReview, User } from '../types';
import { useData } from '../contexts/DataContext';
import { 
  FileText, Search, Filter, Eye, Download, 
  CheckCircle, Clock, AlertCircle, X, ChevronDown, ChevronUp
} from 'lucide-react';

interface ReviewListProps {
  user: User | null;
}

type SortField = 'employeeName' | 'reviewerName' | 'reviewerType' | 'status' | 'overallScore' | 'submittedAt';
type SortDirection = 'asc' | 'desc';

export default function ReviewList({ user }: ReviewListProps) {
  const data = useData();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [reviews, setReviews] = useState<PerformanceReview[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [sortField, setSortField] = useState<SortField>('submittedAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedReview, setSelectedReview] = useState<PerformanceReview | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([data.getEmployees(), data.getPerformanceReviews()]).then(([emps, revs]) => {
      if (!cancelled) {
        setEmployees(emps);
        setReviews(revs);
      }
    });
    return () => { cancelled = true; };
  }, [data]);

  // Filter reviews based on role and filters
  const filteredReviews = useMemo(() => {
    let filtered = [...reviews];

    // Role-based filtering
    if (user?.role === 'Employee') {
      filtered = filtered.filter(r => r.employeeId === user.employeeId);
    } else if (user?.role === 'Manager') {
      const teamIds = employees.filter(e => e.reportingManagerId === user.employeeId).map(e => e.id);
      filtered = filtered.filter(r => teamIds.includes(r.employeeId));
    }

    // Search term filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(r =>
        (r.employeeName ?? '').toLowerCase().includes(term) ||
        (r.reviewerName ?? '').toLowerCase().includes(term) ||
        (r.reviewCycleName ?? '').toLowerCase().includes(term)
      );
    }

    // Type filter
    if (filterType !== 'All') {
      filtered = filtered.filter(r => r.reviewerType === filterType);
    }

    // Status filter
    if (filterStatus !== 'All') {
      filtered = filtered.filter(r => r.status === filterStatus);
    }

    return filtered;
  }, [reviews, user, employees, searchTerm, filterType, filterStatus]);

  // Sorting
  const sortedReviews = useMemo(() => {
    const sorted = [...filteredReviews];
    sorted.sort((a, b) => {
      let aVal: any = a[sortField as keyof PerformanceReview];
      let bVal: any = b[sortField as keyof PerformanceReview];
      
      if (sortField === 'overallScore') {
        aVal = aVal || 0;
        bVal = bVal || 0;
      }
      
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredReviews, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Completed': return 'bg-emerald-100 text-emerald-700';
      case 'Draft': return 'bg-amber-100 text-amber-700';
      case 'Submitted': return 'bg-blue-100 text-blue-700';
      case 'Acknowledged': return 'bg-indigo-100 text-indigo-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'Completed': return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'Draft': return <Clock className="w-4 h-4 text-amber-500" />;
      case 'Submitted': return <CheckCircle className="w-4 h-4 text-blue-500" />;
      default: return <AlertCircle className="w-4 h-4 text-slate-400" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600';
    if (score >= 60) return 'text-amber-600';
    return 'text-rose-600';
  };

  // Summary stats
  const total = filteredReviews.length;
  const completed = filteredReviews.filter(r => r.status === 'Completed').length;
  const pending = filteredReviews.filter(r => r.status === 'Draft' || r.status === 'Submitted').length;
  const avgScore = completed > 0 
    ? Math.round(filteredReviews.filter(r => r.status === 'Completed').reduce((sum, r) => sum + (r.overallScore || 0), 0) / completed)
    : 0;

  const summaryCards = [
    { label: 'Total Reviews', value: total, color: 'text-indigo-600' },
    { label: 'Completed', value: completed, color: 'text-emerald-600' },
    { label: 'Pending', value: pending, color: 'text-amber-600' },
    { label: 'Avg Score', value: `${avgScore}%`, color: 'text-purple-600' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Reviews</h2>
        <span className="text-sm text-slate-500">{total} reviews</span>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {summaryCards.map((card, idx) => (
          <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-sm text-slate-500">{card.label}</p>
            <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium">Filters:</span>
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-1.5 border border-slate-200 rounded-xl text-sm bg-slate-50"
        >
          <option value="All">All Types</option>
          <option value="Self">Self</option>
          <option value="Manager">Manager</option>
          <option value="Peer">Peer</option>
          <option value="Subordinate">Subordinate</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-1.5 border border-slate-200 rounded-xl text-sm bg-slate-50"
        >
          <option value="All">All Status</option>
          <option value="Completed">Completed</option>
          <option value="Draft">Draft</option>
          <option value="Submitted">Submitted</option>
          <option value="Acknowledged">Acknowledged</option>
        </select>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search employees..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-1.5 border border-slate-200 rounded-xl text-sm bg-slate-50"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th 
                  className="px-6 py-3 text-left cursor-pointer hover:text-slate-800"
                  onClick={() => handleSort('employeeName')}
                >
                  Employee {sortField === 'employeeName' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-6 py-3 text-left cursor-pointer hover:text-slate-800"
                  onClick={() => handleSort('reviewerName')}
                >
                  Reviewer {sortField === 'reviewerName' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-6 py-3 text-left cursor-pointer hover:text-slate-800"
                  onClick={() => handleSort('reviewerType')}
                >
                  Type {sortField === 'reviewerType' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-6 py-3 text-left cursor-pointer hover:text-slate-800"
                  onClick={() => handleSort('status')}
                >
                  Status {sortField === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-6 py-3 text-right cursor-pointer hover:text-slate-800"
                  onClick={() => handleSort('overallScore')}
                >
                  Score {sortField === 'overallScore' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-6 py-3 text-left cursor-pointer hover:text-slate-800"
                  onClick={() => handleSort('submittedAt')}
                >
                  Date {sortField === 'submittedAt' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedReviews.map((review) => {
                const score = review.overallScore || 0;
                const scoreColor = getScoreColor(score);
                const statusColor = getStatusColor(review.status);
                const date = review.submittedAt || review.updatedAt || review.createdAt;

                return (
                  <tr key={review.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3 font-medium text-slate-800">{review.employeeName}</td>
                    <td className="px-6 py-3 text-slate-600">{review.reviewerName}</td>
                    <td className="px-6 py-3 text-slate-600">
                      <span className="text-xs bg-slate-100 px-2 py-0.5 rounded">
                        {review.reviewerType}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
                        {getStatusIcon(review.status)}
                        {review.status}
                      </span>
                    </td>
                    <td className={`px-6 py-3 text-right font-bold ${scoreColor}`}>
                      {score > 0 ? `${score}%` : '—'}
                    </td>
                    <td className="px-6 py-3 text-slate-500 text-xs">
                      {date ? new Date(date).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-6 py-3 text-center">
                      <button
                        onClick={() => { setSelectedReview(review); setShowModal(true); }}
                        className="text-slate-400 hover:text-indigo-600 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {sortedReviews.length === 0 && (
          <div className="p-8 text-center text-slate-500">No reviews found.</div>
        )}
      </div>

      {/* Modal: Review Details */}
      {showModal && selectedReview && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-slate-900">Review Details</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl">
                <div>
                  <p className="text-xs text-slate-500">Employee</p>
                  <p className="font-bold">{selectedReview.employeeName}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Reviewer</p>
                  <p className="font-bold">{selectedReview.reviewerName}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Type</p>
                  <p className="font-bold">{selectedReview.reviewerType}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Status</p>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedReview.status)}`}>
                    {getStatusIcon(selectedReview.status)}
                    {selectedReview.status}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Overall Score</p>
                  <p className={`text-xl font-bold ${getScoreColor(selectedReview.overallScore || 0)}`}>
                    {selectedReview.overallScore || 0}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Cycle</p>
                  <p className="font-medium">{selectedReview.reviewCycleName}</p>
                </div>
              </div>

              {/* Questions and Answers */}
              <div className="space-y-4">
                <h4 className="font-bold text-slate-700">Question Scores & Comments</h4>
                {(selectedReview.questionScores || []).map((q, idx) => (
                  <div key={idx} className="border border-slate-100 p-3 rounded-lg">
                    <div className="flex justify-between items-start">
                      <p className="font-medium text-sm">{q.questionText}</p>
                      <span className={`font-bold ${getScoreColor(q.score * 20)}`}>
                        {q.score}/5
                      </span>
                    </div>
                    {q.comments && (
                      <p className="text-sm text-slate-500 mt-1 italic">"{q.comments}"</p>
                    )}
                  </div>
                ))}
                {(!selectedReview.questionScores || selectedReview.questionScores.length === 0) && (
                  <p className="text-sm text-slate-400 italic">No question scores available.</p>
                )}
              </div>

              {selectedReview.strengths && (
                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                  <p className="text-xs font-bold text-emerald-700">Strengths</p>
                  <p className="text-sm text-emerald-800 mt-1">{selectedReview.strengths}</p>
                </div>
              )}
              {selectedReview.areasForImprovement && (
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                  <p className="text-xs font-bold text-amber-700">Areas for Improvement</p>
                  <p className="text-sm text-amber-800 mt-1">{selectedReview.areasForImprovement}</p>
                </div>
              )}

              <button
                onClick={() => setShowModal(false)}
                className="w-full mt-4 bg-indigo-600 text-white py-2 rounded-xl font-medium hover:bg-indigo-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
