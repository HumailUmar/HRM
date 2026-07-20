import React, { useState, useEffect } from 'react';
import { PerformanceReviewCycle, PerformanceReview, Employee, PeerAssignment } from '../types';
import { getPerformanceReviewCycles, getPerformanceReviews, savePerformanceReviews, getEmployees, getPeerAssignments, savePeerAssignments } from '../lib/storage';
import { ChevronRight, Clock, Save, Send, ArrowLeft, Users } from 'lucide-react';

interface PeerReviewProps {
  userId?: string;
  userName?: string;
}

export default function PeerReview({ userId, userName }: PeerReviewProps) {
  const [cycles] = useState<PerformanceReviewCycle[]>(getPerformanceReviewCycles());
  const [reviews, setReviews] = useState<PerformanceReview[]>(getPerformanceReviews());
  const [employees] = useState<Employee[]>(getEmployees());
  const [assignments, setAssignments] = useState<PeerAssignment[]>(getPeerAssignments());
  const [selectedPeer, setSelectedPeer] = useState<Employee | null>(null);
  const [selectedCycle, setSelectedCycle] = useState<PerformanceReviewCycle | null>(null);
  const [currentReview, setCurrentReview] = useState<PerformanceReview | null>(null);
  const [progress, setProgress] = useState(0);

  if (!userId) return <div>Please log in to view peer reviews.</div>;

  // Get peers assigned to this user
  const myAssignments = assignments.filter(a => a.peerId === userId);
  const peerIds = myAssignments.map(a => a.employeeId);
  const peers = employees.filter(e => peerIds.includes(e.id));

  const getStatus = (peer: Employee, cycle: PerformanceReviewCycle) => {
    const review = reviews.find(r => r.employeeId === peer.id && r.reviewCycleId === cycle.id && r.reviewerType === 'Peer' && r.reviewerId === userId);
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

  const handleStartReview = (peer: Employee, cycle: PerformanceReviewCycle) => {
    let review = reviews.find(r => r.employeeId === peer.id && r.reviewCycleId === cycle.id && r.reviewerType === 'Peer' && r.reviewerId === userId);
    if (!review) {
      review = {
        id: `rev-${Date.now()}`,
        employeeId: peer.id,
        employeeName: peer.name,
        reviewerId: userId,
        reviewerName: userName || 'Peer',
        reviewerType: 'Peer',
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
    setSelectedPeer(peer);
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
    savePerformanceReviews(updated);

    // Update assignment status
    const updatedAssignments = assignments.map(a => {
      if (a.peerId === userId && a.employeeId === selectedPeer?.id) {
        return { ...a, status: 'Completed' as const, completedAt: new Date().toISOString() };
      }
      return a;
    });
    setAssignments(updatedAssignments);
    savePeerAssignments(updatedAssignments);

    alert('Review submitted successfully!');
    setSelectedPeer(null);
    setSelectedCycle(null);
    setCurrentReview(null);
  };

  // Auto-create assignments for testing
  useEffect(() => {
    let cancelled = false;
    if (assignments.length === 0 && employees.length > 1 && cycles.length > 0) {
      const activeCycles = cycles.filter(c => c.status === 'Active' && c.includesPeerReview);
      if (activeCycles.length > 0) {
        const newAssignments: PeerAssignment[] = [];
        // Assign peers from same department
        employees.forEach(emp => {
          const deptPeers = employees.filter(e => e.department === emp.department && e.id !== emp.id);
          deptPeers.forEach(peer => {
            activeCycles.forEach(cycle => {
              newAssignments.push({
                id: `pa-${Date.now()}-${Math.random()}`,
                reviewCycleId: cycle.id,
                employeeId: emp.id,
                peerId: peer.id,
                status: 'Pending',
                assignedAt: new Date().toISOString()
              });
            });
          });
        });
        if (newAssignments.length > 0 && !cancelled) {
          setAssignments(newAssignments);
          savePeerAssignments(newAssignments);
        }
      }
    }
    return () => { cancelled = true; };
  }, [assignments, employees, cycles]);

  if (selectedPeer && selectedCycle && currentReview) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-slate-200">
        <button onClick={() => { setSelectedPeer(null); setSelectedCycle(null); setCurrentReview(null); }} className="flex items-center text-slate-500 mb-4 hover:text-indigo-600">
          <ArrowLeft size={16} className="mr-1" /> Back to Peers
        </button>
        <h2 className="text-2xl font-bold mb-1">Peer Review for {currentReview.employeeName}</h2>
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

  const activeCycles = cycles.filter(c => c.status === 'Active' && c.includesPeerReview);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Peer Reviews</h2>
        <span className="text-sm text-slate-500">{peers.length} peers to review</span>
      </div>
      {peers.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center">
          <Users size={48} className="mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500">No peer reviews assigned to you yet.</p>
          <p className="text-sm text-slate-400 mt-2">When peers are assigned, they will appear here.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {peers.map(peer => (
            <div key={peer.id} className="bg-white p-6 rounded-2xl border border-slate-200">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg">{peer.name}</h3>
                  <p className="text-slate-500 text-sm">{peer.role} • {peer.department}</p>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                {activeCycles.map(cycle => {
                  const status = getStatus(peer, cycle);
                  const statusColors = {
                    'Not Started': 'bg-amber-100 text-amber-700',
                    'In Progress': 'bg-blue-100 text-blue-700',
                    'Completed': 'bg-green-100 text-green-700',
                    'Draft': 'bg-slate-100 text-slate-700',
                    'Submitted': 'bg-green-100 text-green-700',
                    'Acknowledged': 'bg-indigo-100 text-indigo-700'
                  };
                  const statusColor = statusColors[status] || 'bg-slate-100 text-slate-700';

                  return (
                    <div key={cycle.id} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg">
                      <div>
                        <span className="font-medium text-sm">{cycle.name}</span>
                        <span className={`ml-3 px-2 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
                          {status}
                        </span>
                      </div>
                      <button
                        onClick={() => handleStartReview(peer, cycle)}
                        className="text-indigo-600 font-medium text-sm hover:underline"
                      >
                        {status === 'Not Started' ? 'Start Review' : status === 'Completed' ? 'View Review' : 'Continue Review'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
