import React, { useState, useEffect } from 'react';
import { TrainingModule, TrainingSubmission, TrainingAssignment, TrainingQuiz, TrainingQuizQuestion } from '../types';
import { useData } from '../contexts/DataContext';
import { CheckCircle, AlertCircle, FileText, Video, Link as LinkIcon, Download, Award, ChevronLeft, ChevronRight, Play, UploadCloud } from 'lucide-react';

interface TrainingPlayerProps {
  module: TrainingModule;
  assignment: TrainingAssignment;
  onClose: () => void;
  onComplete: () => void;
}

export default function TrainingPlayer({ module, assignment, onClose, onComplete }: TrainingPlayerProps) {
  const data = useData();
  const [submission, setSubmission] = useState<TrainingSubmission | null>(null);
  const [quizzes, setQuizzes] = useState<TrainingQuiz[]>([]);
  const [currentQuiz, setCurrentQuiz] = useState<TrainingQuiz | null>(null);
  const [assignments, setAssignments] = useState<TrainingAssignment[]>([]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([data.getTrainingSubmissions(), data.getTrainingQuizzes(), data.getTrainingAssignments()]).then(([subs, quizList, assigns]) => {
      if (!cancelled) {
        const foundSub = subs.find(s => s.moduleId === module.id && s.employeeId === assignment.employeeId) || null;
        setSubmission(foundSub);
        setQuizzes(quizList);
        setCurrentQuiz(quizList.find(q => q.moduleId === module.id) || null);
        setAssignments(assigns);
      }
    });
    return () => { cancelled = true; };
  }, [data, module.id, assignment.employeeId]);

  // Quiz interactive state
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);

  // Practical / Certificate Upload State
  const [uploadText, setUploadText] = useState('');
  const [uploadUrl, setUploadUrl] = useState('');

  // Video interactive state
  const [videoProgress, setVideoProgress] = useState(0);

  const updateSubmissionProgress = async (progress: number, status: TrainingSubmission['status'], extraData: Partial<TrainingSubmission> = {}) => {
    const subs = await data.getTrainingSubmissions();
    let updatedSubs: TrainingSubmission[] = [];

    const existingSub = subs.find(s => s.moduleId === module.id && s.employeeId === assignment.employeeId);

    const targetStatus: TrainingSubmission['status'] = progress === 100 ? 'Completed' : status;

    if (existingSub) {
      const updatedSub: TrainingSubmission = {
        ...existingSub,
        progress,
        status: targetStatus,
        ...extraData,
        submittedAt: new Date().toISOString(),
      };
      setSubmission(updatedSub);
      updatedSubs = subs.map(s => s.id === existingSub.id ? updatedSub : s);
    } else {
      const newSub: TrainingSubmission = {
        id: `SUB-${Date.now()}`,
        assignmentId: assignment.id,
        moduleId: module.id,
        employeeId: assignment.employeeId,
        employeeName: assignment.employeeName,
        progress,
        status: targetStatus,
        submittedAt: new Date().toISOString(),
        ...extraData,
      };
      setSubmission(newSub);
      updatedSubs = [...subs, newSub];
    }

    await data.saveTrainingSubmissions(updatedSubs);

    // Also update assignment progress
    const assigns = await data.getTrainingAssignments();
    const updatedAssigns = assigns.map(a => {
      if (a.id === assignment.id) {
        const isComplete = targetStatus === 'Completed';
        return {
          ...a,
          progress: Math.max(a.progress, progress),
          status: isComplete ? ('Completed' as const) : ('In Progress' as const),
          completedAt: isComplete ? new Date().toISOString() : undefined,
        };
      }
      return a;
    });
    await data.saveTrainingAssignments(updatedAssigns);

    if (progress === 100 || targetStatus === 'PendingReview') {
      onComplete();
    }
  };

  const handleMarkAsRead = () => {
    updateSubmissionProgress(100, 'Completed');
  };

  const handleOpenLink = () => {
    window.open(module.contentUrl || '#', '_blank', 'noopener,noreferrer');
    updateSubmissionProgress(100, 'Completed');
  };

  const handleSimulateWatch = () => {
    let interval = setInterval(() => {
      setVideoProgress(prev => {
        if (prev >= 80) {
          clearInterval(interval);
          updateSubmissionProgress(100, 'Completed');
          return 100;
        }
        return prev + 10;
      });
    }, 400);
  };

  const handleQuizSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentQuiz) return;

    let correctCount = 0;
    currentQuiz.questions.forEach(q => {
      if (quizAnswers[q.id]?.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()) {
        correctCount++;
      }
    });

    const score = Math.round((correctCount / currentQuiz.questions.length) * 100);
    setQuizScore(score);
    setQuizSubmitted(true);

    const isPassed = score >= currentQuiz.passingScore;
    const progress = isPassed ? 100 : 50;
    const status: TrainingSubmission['status'] = isPassed ? 'Completed' : 'InProgress';

    updateSubmissionProgress(progress, status, {
      grade: score,
      feedback: isPassed ? 'Passed Quiz successfully!' : 'Did not meet passing score. Try again.'
    });
  };

  const handleFileUpload = () => {
    if (!uploadUrl && !uploadText) {
      alert('Please fill out task details or provide a certification link.');
      return;
    }

    // These need mentor verification
    updateSubmissionProgress(80, 'PendingReview', {
      content: uploadText || uploadUrl,
      submittedContentUrl: uploadUrl,
    });
    alert('Submission sent to your mentor for review.');
  };

  return (
    <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-slate-100 p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div>
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-600 mb-1.5 inline-block">
            {module.contentType} Course module
          </span>
          <h2 className="text-xl font-bold text-slate-800">{module.title}</h2>
          <p className="text-slate-500 text-xs mt-0.5">{module.description}</p>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 font-medium text-sm px-3 py-1.5 hover:bg-slate-50 rounded-xl transition-all"
        >
          Back to List
        </button>
      </div>

      {/* Main Content Area depending on ContentType */}
      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
        
        {/* TEXT MODULE */}
        {module.contentType === 'Text' && (
          <div className="space-y-4">
            <div className="prose text-sm text-slate-600 space-y-3 leading-relaxed">
              <p className="whitespace-pre-wrap">{module.textContent || 'No text content provided for this module.'}</p>
            </div>
            {submission?.status !== 'Completed' ? (
              <button
                onClick={handleMarkAsRead}
                className="w-full mt-4 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-xl transition-all"
              >
                <CheckCircle className="w-4 h-4" /> Mark Module as Completed
              </button>
            ) : (
              <div className="flex items-center justify-center gap-2 text-emerald-600 font-medium bg-emerald-50 py-2.5 rounded-xl border border-emerald-100">
                <CheckCircle className="w-4 h-4" /> You have completed this module!
              </div>
            )}
          </div>
        )}

        {/* LINK MODULE */}
        {module.contentType === 'Link' && (
          <div className="text-center py-6 space-y-4">
            <LinkIcon className="w-12 h-12 text-slate-300 mx-auto" />
            <div>
              <p className="font-bold text-slate-700">External Resource Link</p>
              <p className="text-xs text-slate-400 mt-0.5">Clicking the link below will open the training materials and register your progress.</p>
            </div>
            <button
              onClick={handleOpenLink}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl text-sm transition-all shadow-md shadow-indigo-100"
            >
              Open Training Resource
            </button>
          </div>
        )}

        {/* VIDEO MODULE */}
        {module.contentType === 'EmbedVideo' && (
          <div className="space-y-4 text-center py-6">
            <Video className="w-12 h-12 text-slate-300 mx-auto" />
            <div>
              <p className="font-bold text-slate-700">Video Lecture</p>
              <p className="text-xs text-slate-400">Click to play and watch the module presentation.</p>
            </div>
            {videoProgress === 0 ? (
              <button
                onClick={handleSimulateWatch}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl text-sm transition-all"
              >
                <Play className="w-4 h-4 fill-current" /> Watch Video Session (Simulate)
              </button>
            ) : videoProgress < 100 ? (
              <div className="space-y-2 max-w-xs mx-auto">
                <div className="flex justify-between text-xs text-slate-500 font-medium">
                  <span>Watching...</span>
                  <span>{videoProgress}%</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div className="bg-indigo-600 h-full transition-all duration-300" style={{ width: `${videoProgress}%` }} />
                </div>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 text-emerald-600 font-medium bg-emerald-50 px-6 py-2.5 rounded-xl border border-emerald-100">
                <CheckCircle className="w-4 h-4" /> Video Completed!
              </div>
            )}
          </div>
        )}

        {/* FILE MODULE */}
        {module.contentType === 'UploadFile' && (
          <div className="text-center py-6 space-y-4">
            <FileText className="w-12 h-12 text-slate-300 mx-auto" />
            <div>
              <p className="font-bold text-slate-700">Reference Document Download</p>
              <p className="text-xs text-slate-400 mt-0.5">Download or review this learning reference document.</p>
            </div>
            <button
              onClick={handleOpenLink}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl text-sm transition-all"
            >
              <Download className="w-4 h-4" /> Download Material
            </button>
          </div>
        )}

        {/* QUIZ MODULE */}
        {module.contentType === 'Quiz' && (
          <div className="space-y-4">
            {!currentQuiz ? (
              <div className="text-center p-6 text-slate-400">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="text-sm">No Quiz questions configured for this module.</p>
              </div>
            ) : (
              <form onSubmit={handleQuizSubmit} className="space-y-4">
                <h4 className="font-bold text-slate-700 text-sm pb-2 border-b">Module Assessment Quiz</h4>
                {currentQuiz.questions.map((q, idx) => (
                  <div key={q.id} className="p-3 bg-white border border-slate-200 rounded-xl space-y-2 text-xs">
                    <p className="font-semibold text-slate-800">{idx + 1}. {q.question}</p>
                    
                    {q.type === 'MultipleChoice' && q.options && (
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        {q.options.map(opt => (
                          <label key={opt} className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
                            quizAnswers[q.id] === opt ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'hover:bg-slate-50 border-slate-100'
                          }`}>
                            <input
                              type="radio"
                              name={`q-${q.id}`}
                              value={opt}
                              checked={quizAnswers[q.id] === opt}
                              onChange={() => setQuizAnswers({ ...quizAnswers, [q.id]: opt })}
                              className="hidden"
                            />
                            <span>{opt}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {q.type === 'TrueFalse' && (
                      <div className="flex gap-4 mt-1">
                        {['True', 'False'].map(opt => (
                          <label key={opt} className={`flex-1 flex items-center justify-center p-2 rounded-lg border cursor-pointer transition-all ${
                            quizAnswers[q.id] === opt ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'hover:bg-slate-50 border-slate-100'
                          }`}>
                            <input
                              type="radio"
                              name={`q-${q.id}`}
                              value={opt}
                              checked={quizAnswers[q.id] === opt}
                              onChange={() => setQuizAnswers({ ...quizAnswers, [q.id]: opt })}
                              className="hidden"
                            />
                            <span>{opt}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {q.type === 'Text' && (
                      <input
                        type="text"
                        required
                        value={quizAnswers[q.id] || ''}
                        onChange={e => setQuizAnswers({ ...quizAnswers, [q.id]: e.target.value })}
                        placeholder="Type answer here..."
                        className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                      />
                    )}
                  </div>
                ))}

                {quizSubmitted && quizScore !== null && (
                  <div className={`p-4 rounded-xl border text-center text-sm ${
                    quizScore >= currentQuiz.passingScore
                      ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                      : 'bg-rose-50 border-rose-100 text-rose-700'
                  }`}>
                    <p className="font-bold">Score: {quizScore}%</p>
                    <p className="text-xs mt-1">
                      {quizScore >= currentQuiz.passingScore
                        ? `Congratulations! You passed (Required: ${currentQuiz.passingScore}%).`
                        : `Did not meet passing requirement of ${currentQuiz.passingScore}%. Try again.`}
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-xl transition-all"
                >
                  Submit Answers
                </button>
              </form>
            )}
          </div>
        )}

        {/* EXTERNAL CERTIFICATION & PRACTICAL TASK */}
        {(module.contentType === 'ExternalCertification' || module.contentType === 'PracticalTask') && (
          <div className="space-y-4">
            <div className="text-center py-3 space-y-1">
              <UploadCloud className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="font-bold text-slate-700 text-sm">
                {module.contentType === 'ExternalCertification' ? 'Upload Certificate Credentials' : 'Submit Practical Task Work'}
              </p>
              <p className="text-slate-400 text-xs">
                Provide verification information below. Your mentor will review and approve.
              </p>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">Submission Document / Live Project URL</label>
                <input
                  type="url"
                  placeholder="https://example.com/project-link-or-certificate"
                  value={uploadUrl}
                  onChange={e => setUploadUrl(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">Explanation / Submission Note</label>
                <textarea
                  rows={2}
                  placeholder="Provide supporting explanation or code repo credentials..."
                  value={uploadText}
                  onChange={e => setUploadText(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none"
                />
              </div>

              {submission?.status === 'PendingReview' ? (
                <div className="flex items-center justify-center gap-2 text-amber-600 font-medium bg-amber-50 py-2.5 rounded-xl border border-amber-100 text-xs">
                  <AlertCircle className="w-4 h-4" /> Verification is currently pending with your Mentor: {assignment.mentorName || 'Assigned Mentor'}.
                </div>
              ) : submission?.status === 'Completed' ? (
                <div className="flex items-center justify-center gap-2 text-emerald-600 font-medium bg-emerald-50 py-2.5 rounded-xl border border-emerald-100 text-xs">
                  <CheckCircle className="w-4 h-4" /> This task has been approved by your mentor!
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleFileUpload}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-xl transition-all"
                >
                  Send Work for Verification
                </button>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
