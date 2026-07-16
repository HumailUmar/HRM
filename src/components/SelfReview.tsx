import { logger } from '../lib/logger';
import React, { useState, useEffect } from 'react';
import { User, PerformanceReviewCycle, PerformanceReview, ReviewTemplateSection, ReviewQuestion, Employee } from '../types';
import { getPerformanceReviewCycles, getPerformanceReviews, savePerformanceReviews, getEmployees } from '../lib/storage';
import { ChevronRight, ClipboardList, CheckCircle, Clock, Save, Send, ArrowLeft } from 'lucide-react';

export default function SelfReview({ employeeId }: { employeeId?: string }) {
  const [cycles] = useState<PerformanceReviewCycle[]>(getPerformanceReviewCycles());
  const [reviews, setReviews] = useState<PerformanceReview[]>(getPerformanceReviews());
  const [employees] = useState<Employee[]>(getEmployees());
  const [selectedCycle, setSelectedCycle] = useState<PerformanceReviewCycle | null>(null);
  const [currentReview, setCurrentReview] = useState<PerformanceReview | null>(null);
  const [progress, setProgress] = useState(0);

  if (!employeeId) return <div>Please log in as an employee to view reviews.</div>;
  const employee = employees.find(e => e.id === employeeId);
  const employeeName = employee?.name || 'Current User';

  const employeeReviews = reviews.filter(r => r.employeeId === employeeId);

  const getStatus = (cycle: PerformanceReviewCycle) => {
    const review = employeeReviews.find(r => r.reviewCycleId === cycle.id);
    return review ? review.status : 'Not Started';
  };

  // Calculate progress whenever currentReview changes
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

  const handleStartReview = (cycle: PerformanceReviewCycle) => {
    let review = employeeReviews.find(r => r.reviewCycleId === cycle.id);
    if (!review) {
      review = {
        id: `rev-${Date.now()}`,
        employeeId: employeeId,
        employeeName: employeeName || 'Current User',
        reviewerId: employeeId,
        reviewerName: employeeName || 'Current User',
        reviewerType: 'Self',
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
      savePerformanceReviews(updated);
    }
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

  const handleSaveDraft = () => {
    if (!currentReview) return;
    const updated = reviews.map(r => r.id === currentReview.id ? currentReview : r);
    setReviews(updated);
    savePerformanceReviews(updated);
    alert('Draft saved successfully!');
  };

  const handleSubmit = () => {
    if (!currentReview || !selectedCycle) return;

    // 1. Validate required questions
    const allQuestions = (selectedCycle.sections || []).flatMap(s => s.questions || []);
    const requiredQuestions = allQuestions.filter(q => q.isRequired);
    const answeredQuestionIds = (currentReview.questionScores || []).filter(q => q.score > 0).map(q => q.questionId);
    const missingRequired = requiredQuestions.filter(q => !answeredQuestionIds.includes(q.id));

    if (missingRequired.length > 0) {
      alert(`Please answer all required questions:\n${missingRequired.map(q => q.question).join('\n')}`);
      return;
    }

    // 2. Calculate overall score
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
    savePerformanceReviews(updated);

    // 3. Simulate notification (optional)
    logger.info(`Notification: Self-review submitted by ${employeeName || employeeId} for ${selectedCycle.name}`);

    alert('Review submitted successfully!');
    setSelectedCycle(null);
    setCurrentReview(null);
  };

  if (selectedCycle && currentReview) {
    const allQuestions = (selectedCycle.sections || []).flatMap(s => s.questions || []);
    const totalQuestions = allQuestions.length;
    const answeredQuestions = (currentReview.questionScores || []).filter(q => q.score > 0).length;

    return (
      <div className="bg-white rounded-2xl p-6 border border-slate-200">
        <button onClick={() => setSelectedCycle(null)} className="flex items-center text-slate-500 mb-4 hover:text-indigo-600">
          <ArrowLeft size={16} className="mr-1" /> Back
        </button>
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-2xl font-bold">{selectedCycle.name}</h2>
          <span className="text-sm font-medium text-slate-500">Progress: {progress}%</span>
        </div>
        <p className="text-slate-600 mb-2">{selectedCycle.description}</p>
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
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-slate-800">{q.question}</p>
                          <p className="text-sm text-slate-500 mb-2">{q.description}</p>
                          {q.isRequired && <span className="text-xs text-rose-600 font-medium">* Required</span>}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {[...Array(maxScore)].map((_, i) => (
                          <button
                            key={i}
                            onClick={() => updateQuestionScore(q.id, q.question, i + 1, scoreObj?.comments)}
                            className={`w-10 h-10 rounded-lg border transition-all ${
                              scoreObj?.score === i + 1
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'hover:bg-slate-50 border-slate-200'
                            }`}
                          >
                            {i + 1}
                          </button>
                        ))}
                        <span className="text-xs text-slate-400 ml-2 self-center">(Rate 1-{maxScore})</span>
                      </div>
                      <textarea
                        placeholder="Comments..."
                        value={scoreObj?.comments || ''}
                        onChange={e => updateQuestionScore(q.id, q.question, scoreObj?.score || 0, e.target.value)}
                        className="w-full p-2 border rounded-lg text-sm bg-slate-50"
                        rows={2}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap gap-4">
          <button
            onClick={handleSaveDraft}
            className="flex-1 flex items-center justify-center gap-2 bg-slate-100 text-slate-700 py-3 rounded-xl font-bold hover:bg-slate-200"
          >
            <Save size={18} /> Save Draft
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700"
          >
            <Send size={18} /> Submit Review
          </button>
        </div>
      </div>
    );
  }

  // List view
  const filteredCycles = cycles.filter(c => c.status === 'Active' && c.includesSelfReview);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">My Reviews</h2>
        <span className="text-sm text-slate-500">{filteredCycles.length} active cycles</span>
      </div>
      {filteredCycles.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center">
          <p className="text-slate-500">No active self-review cycles available.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredCycles.map(cycle => {
            const status = getStatus(cycle);
            const statusColors = {
              'Not Started': 'bg-amber-100 text-amber-700',
              'In Progress': 'bg-blue-100 text-blue-700',
              'Completed': 'bg-green-100 text-green-700',
              'Draft': 'bg-slate-100 text-slate-700',
              'Submitted': 'bg-green-100 text-green-700',
              'Acknowledged': 'bg-indigo-100 text-indigo-700'
            };
            const statusColor = statusColors[status as keyof typeof statusColors] || 'bg-slate-100 text-slate-700';
            const deadline = cycle.selfReviewDeadline ? new Date(cycle.selfReviewDeadline).toLocaleDateString() : 'No deadline';

            return (
              <div key={cycle.id} className="bg-white p-6 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:shadow-md transition-shadow">
                <div className="flex-1">
                  <h3 className="font-bold text-lg">{cycle.name}</h3>
                  <p className="text-slate-500 text-sm">{cycle.description}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-4 text-sm">
                    <span className="flex items-center gap-1 text-slate-500">
                      <Clock size={16} /> Deadline: {deadline}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
                      {status}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleStartReview(cycle)}
                  className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg font-medium hover:bg-indigo-100 flex items-center gap-2 whitespace-nowrap"
                >
                  {status === 'Not Started' ? 'Start Review' : status === 'Completed' ? 'View Review' : 'Continue Review'}
                  <ChevronRight size={18} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
