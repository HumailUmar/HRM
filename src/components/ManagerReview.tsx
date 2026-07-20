import React, { useState, useEffect } from 'react';
import { PerformanceReviewCycle, PerformanceReview, Employee } from '../types';
import { useData } from '../contexts/DataContext';
import { ChevronRight, ClipboardList, CheckCircle, Clock, Save, Send, ArrowLeft } from 'lucide-react';

interface ManagerReviewProps {
  managerId?: string;
  managerName?: string;
}

export default function ManagerReview({ managerId, managerName }: ManagerReviewProps) {
  const data = useData();
  const [cycles, setCycles] = useState<PerformanceReviewCycle[]>([]);
  const [reviews, setReviews] = useState<PerformanceReview[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedCycle, setSelectedCycle] = useState<PerformanceReviewCycle | null>(null);
  const [currentReview, setCurrentReview] = useState<PerformanceReview | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let cancelled = false;
    Promise.all([data.getPerformanceReviewCycles(), data.getPerformanceReviews(), data.getEmployees()]).then(([cyc, revs, emps]) => {
      if (!cancelled) {
        setCycles(cyc);
        setReviews(revs);
        setEmployees(emps);
      }
    });
    return () => { cancelled = true; };
  }, [data]);

  if (!managerId) return <div>Please log in as a manager to view team reviews.</div>;

  const team = employees.filter(e => e.reportingManagerId === managerId);

  const getStatus = (employee: Employee, cycle: PerformanceReviewCycle) => {
    const review = reviews.find(r => r.employeeId === employee.id && r.reviewCycleId === cycle.id && r.reviewerType === 'Manager');
    return review ? review.status : 'Not Started';
  };

  useEffect(() => {
    if (!currentReview || !selectedCycle) return;
    const allQuestions = (selectedCycle.sections || []).flatMap(s => s.questions || []);
    const totalQuestions = allQuestions.length;
    if (totalQuestions === 0) {
      setProgress(0);
      return;
    }
    const answeredQuestions = (currentReview.questionScores || []).filter(q => q.score > 0).length;
    setProgress(Math.round((answeredQuestions / totalQuestions) * 100));
  }, [currentReview, selectedCycle]);

  const handleStartReview = (employee: Employee, cycle: PerformanceReviewCycle) => {
    let review = reviews.find(r => r.employeeId === employee.id && r.reviewCycleId === cycle.id && r.reviewerType === 'Manager');
    if (!review) {
      review = {
        id: `rev-${Date.now()}`,
        employeeId: employee.id,
        employeeName: employee.name,
        reviewerId: managerId,
        reviewerName: managerName || 'Manager',
        reviewerType: 'Manager',
        reviewCycleId: cycle.id,
        reviewCycleName: cycle.name,
        sectionScores: [],
        questionScores: [],
        overallScore: 0,
        weightedOverallScore: 0,
        strengths: '',
        areasForImprovement: '',
        goals: '',
        recommendation: 'Retain',
        additionalComments: '',
        status: 'In Progress',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      const updated = [...reviews, review];
      setReviews(updated);
      await data.savePerformanceReviews(updated);
    }
    setSelectedEmployee(employee);
    setSelectedCycle(cycle);
    setCurrentReview(review);
  };

  const updateQuestionScore = (questionId: string, questionText: string, score: number, comments?: string) => {
    if (!currentReview) return;
    const newScores = [...(currentReview.questionScores || [])];
    const index = newScores.findIndex(s => s.questionId === questionId);
    if (index > -1) {
      newScores[index] = { ...newScores[index], score, comments: comments || '' };
    } else {
      newScores.push({ questionId, questionText, score, comments: comments || '' });
    }
    setCurrentReview({ ...currentReview, questionScores: newScores, updatedAt: new Date().toISOString() });
  };

  const handleSaveDraft = async () => {
    if (!currentReview) return;
    const updated = reviews.map(r => r.id === currentReview.id ? currentReview : r);
    setReviews(updated);
    await data.savePerformanceReviews(updated);
    alert('Draft saved successfully!');
  };

  const handleSubmit = () => {
    if (!currentReview || !selectedCycle) return;

    // Validate required questions
    const allQuestions = (selectedCycle.sections || []).flatMap(s => s.questions || []);
    const requiredQuestions = allQuestions.filter(q => q.isRequired);
    const answeredQuestionIds = (currentReview.questionScores || []).filter(q => q.score > 0).map(q => q.questionId);
    const missingRequired = requiredQuestions.filter(q => !answeredQuestionIds.includes(q.id));

    if (missingRequired.length > 0) {
      alert(`Please answer all required questions:\n${missingRequired.map(q => q.question).join('\n')}`);
      return;
    }

    const totalScore = (currentReview.questionScores || []).reduce((sum, q) => sum + (q.score || 0), 0);
    const maxScore = allQuestions.reduce((sum, q) => sum + (q.maxScore || 5), 0);
    const overallScore = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

    const finalizedReview = {
      ...currentReview,
      status: 'Completed' as const,
      submittedAt: new Date().toISOString(),
      overallScore: overallScore
    };

    const updated = reviews.map(r => r.id === finalizedReview.id ? finalizedReview : r);
    setReviews(updated);
    await data.savePerformanceReviews(updated);

    alert('Review submitted successfully!');
    setSelectedEmployee(null);
    setSelectedCycle(null);
    setCurrentReview(null);
  };

  if (selectedEmployee && selectedCycle && currentReview) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-slate-200">
        <button onClick={() => { setSelectedEmployee(null); setSelectedCycle(null); setCurrentReview(null); }} className="flex items-center text-slate-500 mb-4 hover:text-indigo-600">
          <ArrowLeft size={16} className="mr-1" /> Back to Team
        </button>
        <h2 className="text-2xl font-bold mb-1">Review for {currentReview.employeeName}</h2>
        <p className="text-slate-600 mb-6">{selectedCycle.name}</p>
        <div className="w-full bg-slate-200 rounded-full h-2 mb-6">
          <div className="bg-indigo-600 h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
        <div className="space-y-8">
          {(selectedCycle.sections || []).map((section, sIdx) => (
            <div key={sIdx} className="border border-slate-100 p-6 rounded-xl">
              <h3 className="font-bold text-lg mb-1">{section.name}</h3>
              <p className="text-sm text-slate-500 mb-4">{section.description}</p>
              <div className="space-y-4">
                {(section.questions || []).map((q, qIdx) => {
                  const scoreObj = currentReview.questionScores?.find(s => s.questionId === q.id);
                  const maxScore = q.maxScore || 5;
                  return (
                    <div key={qIdx} className="border-t pt-4">
                      <p className="font-medium text-slate-800">{q.question}</p>
                      <p className="text-sm text-slate-500 mb-2">{q.description}</p>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {[...Array(maxScore)].map((_, i) => (
                          <button key={i} onClick={() => updateQuestionScore(q.id, q.question, i + 1, scoreObj?.comments)} className={`w-10 h-10 rounded-lg border transition-all ${scoreObj?.score === i + 1 ? 'bg-indigo-600 text-white border-indigo-600' : 'hover:bg-slate-50 border-slate-200'}`}>{i + 1}</button>
                        ))}
                      </div>
                      <textarea placeholder="Comments..." value={scoreObj?.comments || ''} onChange={e => updateQuestionScore(q.id, q.question, scoreObj?.score || 0, e.target.value)} className="w-full p-2 border rounded-lg text-sm bg-slate-50" rows={2} />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8 flex gap-4">
          <button onClick={handleSaveDraft} className="flex-1 flex items-center justify-center gap-2 bg-slate-100 text-slate-700 py-3 rounded-xl font-bold hover:bg-slate-200"><Save size={18} /> Save Draft</button>
          <button onClick={handleSubmit} className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700"><Send size={18} /> Submit Review</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">Team Reviews</h2>
      <div className="grid gap-4">
        {team.map(employee => (
          <div key={employee.id} className="bg-white p-6 rounded-2xl border border-slate-200">
            <h3 className="font-bold text-lg">{employee.name}</h3>
            <p className="text-slate-500 text-sm mb-4">{employee.department}</p>
            <div className="space-y-2">
              {cycles.filter(c => c.status === 'Active' && c.includesManagerReview).map(cycle => (
                <div key={cycle.id} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg">
                  <span className="font-medium text-sm">{cycle.name}</span>
                  <button onClick={() => handleStartReview(employee, cycle)} className="text-indigo-600 font-medium text-sm hover:underline">{getStatus(employee, cycle) === 'Not Started' ? 'Start' : 'Continue'} Review</button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
