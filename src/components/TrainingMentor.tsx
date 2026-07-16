import React, { useState } from 'react';
import { TrainingMentorship, TrainingSubmission, TrainingCheckIn, TrainingMessage, Employee, TrainingAssignment, User, Department, Designation } from '../types';
import { getTrainingMentorships, saveTrainingMentorships, getTrainingSubmissions, saveTrainingSubmissions, getTrainingCheckIns, saveTrainingCheckIns, getTrainingMessages, saveTrainingMessages, getEmployees, getTrainingAssignments, saveTrainingAssignments } from '../lib/storage';
import { getEmployeeDesignation, getEmployeeDepartment } from '../lib/employeeUtils';
import { Users, BookOpen, Clock, CheckCircle2, MessageSquare, AlertCircle, Calendar, Plus, Send } from 'lucide-react';

interface TrainingMentorProps {
  user: User | null;
  departments: Department[];
  designations: Designation[];
}

export default function TrainingMentor({ user, departments, designations }: TrainingMentorProps) {
  const [employees] = useState<Employee[]>(getEmployees());
  const currentEmployee = employees.find(e => e.email === user?.email);

  const [mentorships, setMentorships] = useState<TrainingMentorship[]>(() => {
    const all = getTrainingMentorships();
    return currentEmployee ? all.filter(m => m.mentorId === currentEmployee.id) : [];
  });

  const [submissions, setSubmissions] = useState<TrainingSubmission[]>(() => {
    const all = getTrainingSubmissions();
    const menteeIds = mentorships.map(m => m.menteeId);
    return all.filter(s => menteeIds.includes(s.employeeId) && s.status === 'PendingReview');
  });

  const [checkIns, setCheckIns] = useState<TrainingCheckIn[]>(getTrainingCheckIns());
  const [messages, setMessages] = useState<TrainingMessage[]>(getTrainingMessages());

  // Interactivity
  const [activeMenteeChat, setActiveMenteeChat] = useState<{ id: string; name: string; mentorshipId: string } | null>(null);
  const [chatText, setChatText] = useState('');

  // Record Check-In state
  const [selectedMentorshipForCheckIn, setSelectedMentorshipForCheckIn] = useState<TrainingMentorship | null>(null);
  const [checkInNotes, setCheckInNotes] = useState('');
  const [checkInFeedback, setCheckInFeedback] = useState('');
  const [checkInNextAction, setCheckInNextAction] = useState('');

  // Submission review state
  const [selectedSubForReview, setSelectedSubForReview] = useState<TrainingSubmission | null>(null);
  const [reviewGrade, setReviewGrade] = useState(100);
  const [reviewFeedback, setReviewFeedback] = useState('');

  const refreshData = () => {
    const allMent = getTrainingMentorships();
    if (currentEmployee) {
      const activeMent = allMent.filter(m => m.mentorId === currentEmployee.id);
      setMentorships(activeMent);

      const allSub = getTrainingSubmissions();
      const menteeIds = activeMent.map(m => m.menteeId);
      setSubmissions(allSub.filter(s => menteeIds.includes(s.employeeId) && s.status === 'PendingReview'));
    }
    setCheckIns(getTrainingCheckIns());
    setMessages(getTrainingMessages());
  };

  const handleReviewSubmission = (status: 'Approved' | 'Rejected') => {
    if (!selectedSubForReview) return;

    // 1. Update Submission status
    const allSub = getTrainingSubmissions();
    const updatedSub = allSub.map(s => {
      if (s.id === selectedSubForReview.id) {
        return {
          ...s,
          status: status === 'Approved' ? ('Completed' as const) : ('Rejected' as const),
          feedback: reviewFeedback,
          grade: reviewGrade,
          reviewedAt: new Date().toISOString(),
        };
      }
      return s;
    });
    saveTrainingSubmissions(updatedSub);

    // 2. Update Assignment progress
    if (selectedSubForReview.assignmentId) {
      const assigns = getTrainingAssignments();
      const updatedAssigns = assigns.map(a => {
        if (a.id === selectedSubForReview.assignmentId) {
          const isApproved = status === 'Approved';
          return {
            ...a,
            progress: isApproved ? 100 : a.progress,
            status: isApproved ? ('Completed' as const) : ('In Progress' as const),
            completedAt: isApproved ? new Date().toISOString() : undefined,
            score: isApproved ? reviewGrade : undefined,
            feedback: reviewFeedback,
          };
        }
        return a;
      });
      saveTrainingAssignments(updatedAssigns);
    }

    alert(`Task has been successfully reviewed & ${status.toLowerCase()}!`);
    setSelectedSubForReview(null);
    setReviewFeedback('');
    refreshData();
  };

  const handleRecordCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMentorshipForCheckIn || !currentEmployee) return;

    const newCheckIn: TrainingCheckIn = {
      id: `CK-${Date.now()}`,
      mentorshipId: selectedMentorshipForCheckIn.id,
      date: new Date().toISOString().split('T')[0],
      notes: checkInNotes,
      feedback: checkInFeedback,
      nextAction: checkInNextAction,
      recordedBy: currentEmployee.id,
      recordedByName: currentEmployee.name,
    };

    const updatedCheckIns = [newCheckIn, ...checkIns];
    setCheckIns(updatedCheckIns);
    saveTrainingCheckIns(updatedCheckIns);

    // Update mentorship last and next check-in dates
    const allMent = getTrainingMentorships();
    const updatedMent = allMent.map(m => {
      if (m.id === selectedMentorshipForCheckIn.id) {
        return {
          ...m,
          lastCheckIn: new Date().toISOString().split('T')[0],
          nextCheckIn: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Auto next week
          updatedAt: new Date().toISOString(),
        };
      }
      return m;
    });
    saveTrainingMentorships(updatedMent);

    setCheckInNotes('');
    setCheckInFeedback('');
    setCheckInNextAction('');
    setSelectedMentorshipForCheckIn(null);
    alert('Progress check-in logged successfully!');
    refreshData();
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMenteeChat || !chatText.trim() || !currentEmployee) return;

    const newMsg: TrainingMessage = {
      id: `MSG-${Date.now()}`,
      mentorshipId: activeMenteeChat.mentorshipId,
      senderId: currentEmployee.id,
      senderName: currentEmployee.name,
      receiverId: activeMenteeChat.id,
      receiverName: activeMenteeChat.name,
      message: chatText,
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    const updated = [...messages, newMsg];
    setMessages(updated);
    saveTrainingMessages(updated);
    setChatText('');
  };

  if (!currentEmployee) {
    return (
      <div className="p-8 text-center bg-white border border-slate-100 rounded-2xl shadow-sm text-slate-500 max-w-lg mx-auto">
        <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
        <p className="font-bold">No Mentor Profile Found</p>
        <p className="text-xs text-slate-400 mt-1">Please sign in as an active employee of the organization to access mentor workflows.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upper overview section */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-slate-100 p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-800">Mentor Dashboard</h2>
        <p className="text-slate-500 text-xs mt-1">
          Review your assigned mentees, verify certification uploads, grade quiz submittals, and record weekly/monthly check-ins.
        </p>
      </div>

      {/* Main grids */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Mentees & Reviews Panel (Left columns) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* List of Mentees */}
          <div className="bg-white/80 backdrop-blur-md border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" /> My Assigned Mentees ({mentorships.length})
            </h3>

            {mentorships.length === 0 ? (
              <p className="text-center py-6 text-xs text-slate-400">You are not currently mentor to any active mentees.</p>
            ) : (
              <div className="space-y-3">
                {mentorships.map(m => (
                  <div key={m.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl gap-3">
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{m.menteeName}</p>
                      <p className="text-[10px] text-slate-400">Frequency: {m.checkInFrequency} check-ins • {m.notes}</p>
                      {m.lastCheckIn && (
                        <p className="text-[10px] text-indigo-600 font-bold mt-1">Last Check-in: {new Date(m.lastCheckIn).toLocaleDateString()}</p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedMentorshipForCheckIn(m)}
                        className="px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold text-xs rounded-lg transition-all"
                      >
                        Log Check-In
                      </button>
                      <button
                        onClick={() => setActiveMenteeChat({
                          id: m.menteeId,
                          name: m.menteeName,
                          mentorshipId: m.id
                        })}
                        className="px-3 py-1.5 bg-white border text-slate-600 hover:bg-slate-50 font-bold text-xs rounded-lg transition-all"
                      >
                        Chat Assist
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pending Submissions for Review */}
          <div className="bg-white/80 backdrop-blur-md border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-600" /> Pending Submissions Awaiting Review ({submissions.length})
            </h3>

            {submissions.length === 0 ? (
              <p className="text-center py-6 text-xs text-slate-400">All submissions are fully graded and reviewed!</p>
            ) : (
              <div className="space-y-4">
                {submissions.map(sub => (
                  <div key={sub.id} className="p-4 border border-slate-200 rounded-xl space-y-2 text-xs">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-slate-800">{sub.employeeName || 'Mentee'}</p>
                        <p className="text-[10px] text-slate-400">Submitted At: {new Date(sub.submittedAt).toLocaleDateString()}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold">Needs Review</span>
                    </div>

                    {sub.content && (
                      <div className="p-2 bg-slate-50 rounded border text-[11px] leading-relaxed text-slate-600 max-h-24 overflow-y-auto">
                        <span className="font-bold text-slate-700">Student Explanation: </span>
                        {sub.content}
                      </div>
                    )}

                    {sub.submittedContentUrl && (
                      <p className="text-indigo-600 font-semibold text-[10px]">
                        <a href={sub.submittedContentUrl} target="_blank" rel="noreferrer" className="underline">
                          View Project Submission Document / Certificate Link
                        </a>
                      </p>
                    )}

                    <div className="pt-2 flex justify-end gap-2">
                      <button
                        onClick={() => setSelectedSubForReview(sub)}
                        className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-[10px]"
                      >
                        Grading & Approval
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Sidebar panels (Right column - active chat / Logging checkin) */}
        <div className="space-y-6">
          
          {/* Chat with Mentee */}
          {activeMenteeChat && (
            <div className="bg-white/80 backdrop-blur-md border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <p className="text-xs text-slate-400 font-bold">MENTEE CHAT</p>
                  <p className="font-bold text-slate-800 text-sm">{activeMenteeChat.name}</p>
                </div>
                <button
                  onClick={() => setActiveMenteeChat(null)}
                  className="text-xs text-slate-400 hover:text-slate-600 font-bold"
                >
                  Close
                </button>
              </div>

              <div className="h-64 overflow-y-auto space-y-3 p-2 border border-slate-100 rounded-xl bg-slate-50/50">
                {messages
                  .filter(msg => msg.mentorshipId === activeMenteeChat.mentorshipId)
                  .map(msg => {
                    const isMe = msg.senderId === currentEmployee.id;
                    return (
                      <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        <span className="text-[9px] text-slate-400 font-bold px-1">{msg.senderName}</span>
                        <p className={`p-2.5 rounded-2xl max-w-[85%] text-xs shadow-sm mt-0.5 leading-relaxed ${
                          isMe ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-slate-700 border rounded-tl-none'
                        }`}>
                          {msg.message}
                        </p>
                      </div>
                    );
                  })}
              </div>

              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={chatText}
                  onChange={e => setChatText(e.target.value)}
                  placeholder="Ask mentee a question..."
                  className="flex-1 p-2 border border-slate-200 rounded-xl text-xs focus:outline-none"
                />
                <button
                  type="submit"
                  className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          )}

          {/* Record Check-In Panel */}
          {selectedMentorshipForCheckIn && (
            <form onSubmit={handleRecordCheckIn} className="bg-white/80 backdrop-blur-md border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h4 className="font-bold text-slate-800 text-sm">Log Mentorship Check-In</h4>
                <button type="button" onClick={() => setSelectedMentorshipForCheckIn(null)} className="text-slate-400 hover:text-slate-600">
                  Cancel
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <p className="font-semibold text-slate-500">Mentee Name</p>
                  <p className="font-bold text-slate-800 text-sm">{selectedMentorshipForCheckIn.menteeName}</p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Discussion Notes</label>
                  <textarea
                    required
                    rows={2}
                    value={checkInNotes}
                    onChange={e => setCheckInNotes(e.target.value)}
                    placeholder="e.g. Discussed current module challenges..."
                    className="w-full p-2 border border-slate-200 rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Feedback / Performance Advice</label>
                  <textarea
                    required
                    rows={2}
                    value={checkInFeedback}
                    onChange={e => setCheckInFeedback(e.target.value)}
                    placeholder="Provide recommendations for improvements..."
                    className="w-full p-2 border border-slate-200 rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Next Recommended Action</label>
                  <input
                    type="text"
                    required
                    value={checkInNextAction}
                    onChange={e => setCheckInNextAction(e.target.value)}
                    placeholder="e.g. Complete Quiz 2 before next Friday..."
                    className="w-full p-2 border border-slate-200 rounded-xl"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-all"
                >
                  Save Check-In
                </button>
              </div>
            </form>
          )}

          {/* Submission Review Grading Panel */}
          {selectedSubForReview && (
            <div className="bg-white/80 backdrop-blur-md border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h4 className="font-bold text-slate-800 text-sm">Grading & Approval</h4>
                <button onClick={() => setSelectedSubForReview(null)} className="text-slate-400 hover:text-slate-600">
                  Cancel
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <p className="font-semibold text-slate-500">Reviewing For</p>
                  <p className="font-bold text-slate-800 text-sm">{selectedSubForReview.employeeName || 'Mentee'}</p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 block">Overall Score (0 - 100)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={reviewGrade}
                    onChange={e => setReviewGrade(Number(e.target.value))}
                    className="w-full p-2 border border-slate-200 rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Feedback / Grading Notes</label>
                  <textarea
                    required
                    rows={2}
                    value={reviewFeedback}
                    onChange={e => setReviewFeedback(e.target.value)}
                    placeholder="Excellent work or reasons for correction..."
                    className="w-full p-2 border border-slate-200 rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleReviewSubmission('Rejected')}
                    className="py-2 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl font-medium"
                  >
                    Reject Task
                  </button>
                  <button
                    onClick={() => handleReviewSubmission('Approved')}
                    className="py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium"
                  >
                    Approve Task
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
