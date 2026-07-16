import React, { useState } from 'react';
import { TrainingAssignment, TrainingModule, TrainingMessage, Employee, User } from '../types';
import { getTrainingAssignments, getTrainingModules, getTrainingMessages, saveTrainingMessages, getEmployees } from '../lib/storage';
import TrainingPlayer from './TrainingPlayer';
import { BookOpen, GraduationCap, Calendar, Clock, CheckCircle2, MessageSquare, Award, ArrowRight, CornerDownRight, Send } from 'lucide-react';

interface TrainingEmployeeProps {
  user: User | null;
}

export default function TrainingEmployee({ user }: TrainingEmployeeProps) {
  const [employees] = useState<Employee[]>(getEmployees());
  const currentEmployee = employees.find(e => e.email === user?.email);

  const [assignments, setAssignments] = useState<TrainingAssignment[]>(() => {
    const all = getTrainingAssignments();
    return currentEmployee ? all.filter(a => a.employeeId === currentEmployee.id) : [];
  });

  const [modules] = useState<TrainingModule[]>(getTrainingModules());
  const [messages, setMessages] = useState<TrainingMessage[]>(getTrainingMessages());

  // Active playing course
  const [activePlay, setActivePlay] = useState<{ assignment: TrainingAssignment; module: TrainingModule } | null>(null);

  // Chat popover
  const [activeChatMentor, setActiveChatMentor] = useState<{ id: string; name: string; assignmentId: string } | null>(null);
  const [chatText, setChatText] = useState('');

  const refreshData = () => {
    const all = getTrainingAssignments();
    if (currentEmployee) {
      setAssignments(all.filter(a => a.employeeId === currentEmployee.id));
    }
    setMessages(getTrainingMessages());
  };

  const handleStartPlay = (assign: TrainingAssignment) => {
    const mod = modules.find(m => m.id === assign.courseId);
    if (!mod) {
      alert('Course details are missing.');
      return;
    }
    setActivePlay({ assignment: assign, module: mod });
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChatMentor || !chatText.trim() || !currentEmployee) return;

    const newMsg: TrainingMessage = {
      id: `MSG-${Date.now()}`,
      mentorshipId: `MENTOR-${activeChatMentor.assignmentId}-${currentEmployee.id}`,
      senderId: currentEmployee.id,
      senderName: currentEmployee.name,
      receiverId: activeChatMentor.id,
      receiverName: activeChatMentor.name,
      message: chatText,
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    const updated = [...messages, newMsg];
    setMessages(updated);
    saveTrainingMessages(updated);
    setChatText('');
  };

  const handleDownloadCert = (assign: TrainingAssignment) => {
    alert(`Downloading completion certificate for "${assign.courseTitle}"...\nCertificate ID: CERT-${assign.id}`);
  };

  return (
    <div className="space-y-6">
      {activePlay ? (
        <TrainingPlayer
          module={activePlay.module}
          assignment={activePlay.assignment}
          onClose={() => {
            setActivePlay(null);
            refreshData();
          }}
          onComplete={() => {
            setActivePlay(null);
            refreshData();
          }}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main learning section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-slate-100 p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-indigo-600" /> My Assigned Trainings
              </h2>
              <p className="text-slate-500 text-xs mt-1">Acquire new credentials, fulfill mandatory learning steps, and interact with your mentor.</p>

              {assignments.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <BookOpen className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                  <p className="font-medium text-slate-600 text-sm">No trainings assigned to you yet.</p>
                  <p className="text-xs text-slate-400 mt-0.5">Please check back later or contact your department manager.</p>
                </div>
              ) : (
                <div className="mt-6 space-y-4">
                  {assignments.map(assign => {
                    const isComplete = assign.progress === 100 || assign.status === 'Completed';
                    return (
                      <div
                        key={assign.id}
                        className="bg-slate-50 border border-slate-100 rounded-2xl p-5 hover:shadow-md transition-all flex flex-col md:flex-row gap-4 items-start md:items-center justify-between"
                      >
                        <div className="flex-1 space-y-1">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isComplete ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-50 text-indigo-700'
                          }`}>
                            {isComplete ? 'Completed' : 'Active Learning'}
                          </span>
                          <h3 className="font-bold text-slate-800 text-base">{assign.courseTitle}</h3>
                          
                          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 font-medium pt-1">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" /> Assigned: {new Date(assign.assignedAt).toLocaleDateString()}
                            </span>
                            {assign.mentorName && (
                              <span className="flex items-center gap-1 text-indigo-600">
                                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" /> Mentor: {assign.mentorName}
                              </span>
                            )}
                          </div>

                          <div className="w-full max-w-xs pt-3 space-y-1">
                            <div className="flex justify-between text-[10px] font-bold text-slate-500">
                              <span>Progress</span>
                              <span>{assign.progress}%</span>
                            </div>
                            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-indigo-600 h-full transition-all duration-300" style={{ width: `${assign.progress}%` }} />
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 pt-2 md:pt-0">
                          {assign.mentorId && (
                            <button
                              onClick={() => setActiveChatMentor({
                                id: assign.mentorId!,
                                name: assign.mentorName || 'Mentor',
                                assignmentId: assign.id
                              })}
                              className="p-2.5 bg-white hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 border rounded-xl transition-all"
                              title="Ask Mentor"
                            >
                              <MessageSquare className="w-4 h-4" />
                            </button>
                          )}
                          {isComplete ? (
                            <button
                              onClick={() => handleDownloadCert(assign)}
                              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                            >
                              <Award className="w-4 h-4" /> View Certificate
                            </button>
                          ) : (
                            <button
                              onClick={() => handleStartPlay(assign)}
                              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-indigo-100"
                            >
                              Start Training <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Mentor details & Chat widget column */}
          <div className="space-y-6">
            {activeChatMentor ? (
              <div className="bg-white/80 backdrop-blur-md border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div>
                    <p className="text-xs text-slate-400 font-bold">CHAT ASSISTANCE</p>
                    <p className="font-bold text-slate-800 text-sm">{activeChatMentor.name}</p>
                  </div>
                  <button
                    onClick={() => setActiveChatMentor(null)}
                    className="text-xs text-slate-400 hover:text-slate-600 font-bold"
                  >
                    Close
                  </button>
                </div>

                <div className="h-64 overflow-y-auto space-y-3 p-2 border border-slate-100 rounded-xl bg-slate-50/50">
                  {messages
                    .filter(msg => msg.mentorshipId === `MENTOR-${activeChatMentor.assignmentId}-${currentEmployee?.id}`)
                    .map(msg => {
                      const isMe = msg.senderId === currentEmployee?.id;
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
                  {messages.filter(msg => msg.mentorshipId === `MENTOR-${activeChatMentor.assignmentId}-${currentEmployee?.id}`).length === 0 && (
                    <p className="text-center text-[11px] text-slate-400 pt-10">Start a chat. Send your doubts or assignment feedback to your mentor.</p>
                  )}
                </div>

                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={chatText}
                    onChange={e => setChatText(e.target.value)}
                    placeholder="Ask mentor a question..."
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
            ) : (
              <div className="bg-white/80 backdrop-blur-md border border-slate-100 rounded-2xl p-5 shadow-sm space-y-3">
                <h3 className="font-bold text-slate-800 text-sm">Learning Support</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Every training path assigned to you contains mentor reviews. Select an active training, click the chat message icon, and you can communicate directly with your reviewer.
                </p>
                <div className="flex items-start gap-2 bg-indigo-50 border border-indigo-100/50 rounded-xl p-3 text-[11px] text-indigo-700 leading-relaxed font-medium">
                  <Clock className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                  <span>Verify and solve practical challenges to request certification approvals.</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
