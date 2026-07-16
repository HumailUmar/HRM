import React, { useState, useEffect, useMemo } from 'react';
import { Employee, PerformanceReview, PerformanceReviewCycle } from '../types';
import { getPerformanceReviews, getEmployees, getPerformanceReviewCycles } from '../lib/storage';
import { 
  User, Users, Star, Award, TrendingUp, TrendingDown, 
  CheckCircle, Clock, AlertCircle, ChevronRight, 
  FileText, Download, BarChart3, Eye
} from 'lucide-react';

interface Feedback360Props {
  userId?: string;
  userRole?: string;
}

type ReviewType = 'Self' | 'Manager' | 'Peer' | 'Subordinate';

interface ReviewAggregate {
  type: ReviewType;
  score: number;
  totalQuestions: number;
  answeredQuestions: number;
  responses: PerformanceReview[];
  status: 'Not Started' | 'In Progress' | 'Completed';
  progress: number;
}

export default function Feedback360({ userId, userRole }: Feedback360Props) {
  const [employees] = useState<Employee[]>(getEmployees());
  const [reviews] = useState<PerformanceReview[]>(getPerformanceReviews());
  const [cycles] = useState<PerformanceReviewCycle[]>(getPerformanceReviewCycles());
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showReport, setShowReport] = useState(false);

  if (!userId) return <div>Please log in to view 360 feedback.</div>;

  // Determine which employees to show
  const visibleEmployees = useMemo(() => {
    if (userRole === 'Admin' || userRole === 'HR') {
      return employees.filter(e => e.status === 'Active');
    } else if (userRole === 'Manager') {
      return employees.filter(e => e.reportingManagerId === userId);
    } else {
      return employees.filter(e => e.id === userId);
    }
  }, [employees, userId, userRole]);

  // Get all review cycles that include 360 feedback
  const activeCycles = cycles.filter(c => 
    c.status === 'Active' && 
    (c.includesSelfReview || c.includesManagerReview || c.includesPeerReview || c.includesSubordinateReview)
  );

  // Calculate review aggregates for an employee
  const getReviewAggregates = (employeeId: string): ReviewAggregate[] => {
    const employeeReviews = reviews.filter(r => r.employeeId === employeeId);
    const types: ReviewType[] = ['Self', 'Manager', 'Peer', 'Subordinate'];
    
    return types.map(type => {
      const typeReviews = employeeReviews.filter(r => r.reviewerType === type);
      const completedReviews = typeReviews.filter(r => r.status === 'Completed');
      const totalQuestions = typeReviews.reduce((sum, r) => sum + (r.questionScores?.length || 0), 0);
      const answeredQuestions = typeReviews.reduce((sum, r) => sum + (r.questionScores?.filter(q => q.score > 0).length || 0), 0);
      
      // Calculate average score
      let totalScore = 0;
      let questionCount = 0;
      completedReviews.forEach(r => {
        (r.questionScores || []).forEach(q => {
          totalScore += q.score || 0;
          questionCount++;
        });
      });
      
      const avgScore = questionCount > 0 ? Math.round((totalScore / (questionCount * 5)) * 100) : 0;
      
      let status: 'Not Started' | 'In Progress' | 'Completed' = 'Not Started';
      if (completedReviews.length > 0) {
        status = 'Completed';
      } else if (typeReviews.length > 0) {
        status = 'In Progress';
      }
      
      return {
        type,
        score: avgScore,
        totalQuestions: totalQuestions || 0,
        answeredQuestions: answeredQuestions || 0,
        responses: typeReviews,
        status,
        progress: totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0
      };
    });
  };

  // Calculate overall 360 score
  const getOverallScore = (aggregates: ReviewAggregate[]) => {
    const completed = aggregates.filter(a => a.status === 'Completed');
    if (completed.length === 0) return 0;
    const total = completed.reduce((sum, a) => sum + a.score, 0);
    return Math.round(total / completed.length);
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'Completed': return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'In Progress': return <Clock className="w-4 h-4 text-amber-500" />;
      default: return <AlertCircle className="w-4 h-4 text-slate-300" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch(type) {
      case 'Self': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'Manager': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'Peer': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'Subordinate': return 'text-purple-600 bg-purple-50 border-purple-200';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  // Report View
  if (selectedEmployee && showReport) {
    const aggregates = getReviewAggregates(selectedEmployee.id);
    const overallScore = getOverallScore(aggregates);
    const completedCount = aggregates.filter(a => a.status === 'Completed').length;
    const totalTypes = aggregates.length;

    return (
      <div className="space-y-6">
        <button 
          onClick={() => { setShowReport(false); setSelectedEmployee(null); }} 
          className="flex items-center text-slate-500 hover:text-indigo-600"
        >
          <ChevronRight className="w-4 h-4 rotate-180" /> Back to Dashboard
        </button>

        <div className="bg-white rounded-2xl p-6 border border-slate-200">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold">{selectedEmployee.name}</h2>
              <p className="text-slate-500">{selectedEmployee.role} • {selectedEmployee.department}</p>
            </div>
            <div className="text-right">
              <div className={`px-4 py-2 rounded-xl ${completedCount === totalTypes ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                {completedCount}/{totalTypes} Reviews Complete
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
              <p className="text-xs text-slate-500">Overall Score</p>
              <p className="text-2xl font-bold text-indigo-600">{overallScore}%</p>
            </div>
            {aggregates.filter(a => a.status === 'Completed').map(a => (
              <div key={a.type} className="p-4 bg-white rounded-xl border border-slate-200">
                <p className="text-xs text-slate-500">{a.type}</p>
                <p className="text-xl font-bold" style={{ color: a.score > 70 ? '#10b981' : a.score > 50 ? '#f59e0b' : '#ef4444' }}>
                  {a.score}%
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 space-y-4">
            {aggregates.map(agg => (
              <div key={agg.type} className={`border rounded-xl p-4 ${getTypeColor(agg.type)}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(agg.status)}
                    <h4 className="font-bold">{agg.type} Assessment</h4>
                    <span className="text-xs bg-white/50 px-2 py-0.5 rounded">{agg.responses.length} responses</span>
                  </div>
                  <span className="font-bold">{agg.score}%</span>
                </div>
                <div className="mt-2 w-full bg-white/50 rounded-full h-1.5">
                  <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: `${agg.progress}%` }} />
                </div>
                {agg.responses.map((r, idx) => (
                  <div key={idx} className="mt-3 p-3 bg-white/60 rounded-lg text-sm">
                    <p className="font-medium">{r.reviewerName}</p>
                    <p className="text-xs text-slate-500">Submitted: {r.submittedAt ? new Date(r.submittedAt).toLocaleDateString() : 'N/A'}</p>
                    {(r.questionScores || []).slice(0, 3).map((q, qi) => (
                      <div key={qi} className="flex justify-between text-xs mt-1">
                        <span className="text-slate-600 truncate max-w-[200px]">{q.questionText}</span>
                        <span className="font-medium">{q.score}/5</span>
                      </div>
                    ))}
                    {(r.questionScores || []).length > 3 && (
                      <p className="text-xs text-slate-400 mt-1">+{r.questionScores.length - 3} more questions</p>
                    )}
                  </div>
                ))}
                {agg.status === 'Not Started' && (
                  <p className="text-xs text-slate-500 mt-2 italic">No responses yet.</p>
                )}
              </div>
            ))}
          </div>

          <div className="mt-6 flex gap-2">
            <button className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl font-medium">
              <Download className="w-4 h-4" /> Export PDF
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard View
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">360 Feedback</h2>
        <span className="text-sm text-slate-500">{visibleEmployees.length} employees</span>
      </div>

      {visibleEmployees.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center">
          <Users size={48} className="mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500">No employees to display.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {visibleEmployees.map(emp => {
            const aggregates = getReviewAggregates(emp.id);
            const overallScore = getOverallScore(aggregates);
            const completedCount = aggregates.filter(a => a.status === 'Completed').length;
            const totalTypes = aggregates.length;

            return (
              <div key={emp.id} className="bg-white p-6 rounded-2xl border border-slate-200 hover:shadow-md transition-shadow">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-lg">{emp.name}</h3>
                      <span className="text-xs bg-slate-100 px-2 py-0.5 rounded">{emp.role}</span>
                    </div>
                    <p className="text-sm text-slate-500">{emp.department}</p>
                    <div className="mt-2 flex flex-wrap gap-3">
                      {aggregates.map(a => (
                        <div key={a.type} className="flex items-center gap-1 text-xs">
                          {getStatusIcon(a.status)}
                          <span className={`${a.status === 'Completed' ? 'text-emerald-600' : 'text-slate-400'}`}>
                            {a.type}: {a.status === 'Completed' ? `${a.score}%` : 'Pending'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-2xl font-bold">{overallScore}%</div>
                      <div className="text-xs text-slate-500">Overall Score</div>
                      <div className="text-xs text-slate-400">{completedCount}/{totalTypes} Complete</div>
                    </div>
                    <button
                      onClick={() => { setSelectedEmployee(emp); setShowReport(true); }}
                      className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-lg font-medium hover:bg-indigo-100 flex items-center gap-2"
                    >
                      View Report <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
