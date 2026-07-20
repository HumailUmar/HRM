import React, { useState, useEffect } from 'react';
import { TrainingRequest, Employee, TrainingModule, TrainingAssignment, TrainingMentorship, User, Department, Designation } from '../types';
import { useData } from '../contexts/DataContext';
import { Plus, Check, X, AlertCircle, Clock, Send, Users, FileText, Bookmark, Calendar } from 'lucide-react';
import { getEmployeeDesignation, getEmployeeDepartment } from '../lib/employeeUtils';

interface TrainingRequestsProps {
  user: User | null;
  departments: Department[];
  designations: Designation[];
}

export default function TrainingRequests({ user, departments, designations }: TrainingRequestsProps) {
  const data = useData();
  const [requests, setRequests] = useState<TrainingRequest[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState<TrainingRequest | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([data.getTrainingRequests(), data.getEmployees()]).then(([reqs, emps]) => {
      if (!cancelled) {
        setRequests(reqs);
        setEmployees(emps);
      }
    });
    return () => { cancelled = true; };
  }, [data]);

  // Form states
  const [courseTitle, setCourseTitle] = useState('');
  const [courseDescription, setCourseDescription] = useState('');
  const [whyNeeded, setWhyNeeded] = useState('');
  const [urgency, setUrgency] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);

  // Review states
  const [reviewerFeedback, setReviewerFeedback] = useState('');
  const [assignedMentorId, setAssignedMentorId] = useState('');

  const isHR = user?.role === 'HR' || user?.role === 'Admin';
  const isManager = user?.role === 'Manager';

  // Get current manager's details if any
  const currentEmployee = employees.find(e => e.email === user?.email);

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseTitle || !courseDescription || !whyNeeded || selectedEmployees.length === 0) {
      alert('Please fill out all fields and select at least one employee.');
      return;
    }

    const newRequest: TrainingRequest = {
      id: `REQ-${Date.now()}`,
      requestedBy: currentEmployee?.id || user?.id || 'UNKNOWN',
      requestedByName: currentEmployee?.name || user?.email || 'Department Lead',
      department: currentEmployee ? getEmployeeDepartment(currentEmployee, departments) : 'General',
      courseTitle,
      courseDescription,
      whyNeeded,
      urgency,
      targetEmployees: selectedEmployees,
      status: 'Pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedRequests = [newRequest, ...requests];
    setRequests(updatedRequests);
    await data.saveTrainingRequests(updatedRequests);

    // Reset Form
    setCourseTitle('');
    setCourseDescription('');
    setWhyNeeded('');
    setUrgency('Medium');
    setSelectedEmployees([]);
    setShowCreateForm(false);
  };

  const handleReviewRequest = async (req: TrainingRequest, status: 'Approved' | 'Rejected') => {
    if (status === 'Approved' && !assignedMentorId) {
      alert('Please assign a mentor for this approved training.');
      return;
    }

    const mentor = employees.find(e => e.id === assignedMentorId);

    // Update Request
    const updatedRequests = requests.map(r => {
      if (r.id === req.id) {
        return {
          ...r,
          status: status === 'Approved' ? ('Approved' as const) : ('Rejected' as const),
          assignedMentorId: assignedMentorId || undefined,
          assignedMentorName: mentor?.name || undefined,
          hrReviewerId: currentEmployee?.id || user?.id || 'HR',
          hrReviewerName: currentEmployee?.name || user?.email || 'HR Specialist',
          reviewedAt: new Date().toISOString(),
          feedback: reviewerFeedback,
          updatedAt: new Date().toISOString(),
        };
      }
      return r;
    });

    setRequests(updatedRequests);
    await data.saveTrainingRequests(updatedRequests);

    if (status === 'Approved') {
      // 1. Auto-create training module (Course)
      const existingModules = await data.getTrainingModules();
      const newModule: TrainingModule = {
        id: `MOD-${Date.now()}`,
        title: req.courseTitle,
        description: req.courseDescription,
        contentType: 'Text', // Default content type, editable by HR later
        textContent: `Welcome to "${req.courseTitle}". This course was requested by ${req.requestedByName} for ${req.whyNeeded}.`,
        expectedDurationMinutes: 60,
        isMentorVerificationRequired: true,
        isAutoCompleteAllowed: false,
        createdBy: currentEmployee?.name || user?.email || 'HR Auto-assigned',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await data.saveTrainingModules([...existingModules, newModule]);

      // 2. Create Training Assignments for target employees
      const existingAssignments = await data.getTrainingAssignments();
      const newAssignments: TrainingAssignment[] = req.targetEmployees.map(empId => {
        const emp = employees.find(e => e.id === empId);
        return {
          id: `ASSIGN-${Date.now()}-${empId}`,
          trainingRequestId: req.id,
          courseId: newModule.id,
          courseTitle: newModule.title,
          employeeId: empId,
          employeeName: emp?.name || 'Employee',
          mentorId: mentor?.id,
          mentorName: mentor?.name,
          status: 'Pending',
          progress: 0,
          assignedAt: new Date().toISOString(),
          notes: req.whyNeeded,
        };
      });
      await data.saveTrainingAssignments([...existingAssignments, ...newAssignments]);

      // 3. Create Training Mentorship relationships
      if (mentor) {
        const existingMentorships = await data.getTrainingMentorships();
        const newMentorships: TrainingMentorship[] = newAssignments.map(assign => ({
          id: `MENTOR-${Date.now()}-${assign.employeeId}`,
          trainingAssignmentId: assign.id,
          mentorId: mentor.id,
          mentorName: mentor.name,
          menteeId: assign.employeeId,
          menteeName: assign.employeeName,
          status: 'Active',
          checkInFrequency: 'Weekly',
          notes: `Mentorship for course: ${req.courseTitle}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }));
        await data.saveTrainingMentorships([...existingMentorships, ...newMentorships]);
      }
    }

    // Reset Review Dialog
    setReviewerFeedback('');
    setAssignedMentorId('');
    setShowReviewModal(null);
    alert(`Request has been ${status.toLowerCase()} successfully!`);
  };

  const handleSelectEmployee = (empId: string) => {
    if (selectedEmployees.includes(empId)) {
      setSelectedEmployees(selectedEmployees.filter(id => id !== empId));
    } else {
      setSelectedEmployees([...selectedEmployees, empId]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Training Requests</h2>
          <p className="text-slate-500 text-sm">Submit new course requirements or review ongoing training approvals.</p>
        </div>
        {isManager && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-medium transition-all shadow-md shadow-indigo-100"
          >
            <Plus className="w-4 h-4" /> Request Training
          </button>
        )}
      </div>

      {/* Request Form Dialog */}
      {showCreateForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white/95 border border-slate-100 rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-indigo-600" /> Request New Training Course
              </h3>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-50 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRequest} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Course / Topic Title</label>
                  <input
                    type="text"
                    required
                    value={courseTitle}
                    onChange={e => setCourseTitle(e.target.value)}
                    placeholder="e.g. Advanced React with TypeScript"
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Urgency Level</label>
                  <select
                    value={urgency}
                    onChange={e => setUrgency(e.target.value as any)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="Low">Low (Within 6 months)</option>
                    <option value="Medium">Medium (Within 2-3 months)</option>
                    <option value="High">High (Immediate Requirement)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">Course Overview / Description</label>
                <textarea
                  required
                  rows={2}
                  value={courseDescription}
                  onChange={e => setCourseDescription(e.target.value)}
                  placeholder="Outline key learning outcomes..."
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">Business Justification / Why Needed?</label>
                <textarea
                  required
                  rows={2}
                  value={whyNeeded}
                  onChange={e => setWhyNeeded(e.target.value)}
                  placeholder="Explain why this training is important to the team..."
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 block">Select Target Employees</label>
                <p className="text-[11px] text-slate-400 mb-2">Choose which team members will undergo this training.</p>
                <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl p-2.5 space-y-1.5">
                  {employees
                    .filter(e => e.status !== 'Terminated')
                    .map(emp => (
                      <button
                        type="button"
                        key={emp.id}
                        onClick={() => handleSelectEmployee(emp.id)}
                        className={`w-full flex items-center justify-between p-2 rounded-lg text-xs font-medium transition-all ${
                          selectedEmployees.includes(emp.id)
                            ? 'bg-indigo-50 border border-indigo-100 text-indigo-700'
                            : 'hover:bg-slate-50 border border-transparent text-slate-600'
                        }`}
                      >
                        <div className="text-left">
                          <p className="font-bold">{emp.name}</p>
                          <p className="text-[10px] text-slate-400">{getEmployeeDesignation(emp, designations)} • {getEmployeeDepartment(emp, departments)}</p>
                        </div>
                        {selectedEmployees.includes(emp.id) && (
                          <Check className="w-4 h-4 text-indigo-600" />
                        )}
                      </button>
                    ))}
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium hover:bg-slate-50 text-slate-600 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-all"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review Modal for HR */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white/95 border border-slate-100 rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">Review Training Request</h3>
              <button onClick={() => setShowReviewModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold text-slate-400">Course Title</p>
                <p className="font-bold text-slate-800">{showReviewModal.courseTitle}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400">Description</p>
                <p className="text-sm text-slate-600">{showReviewModal.courseDescription}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-slate-400">Requested By</p>
                  <p className="text-sm font-medium text-slate-700">{showReviewModal.requestedByName}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400">Target Count</p>
                  <p className="text-sm font-medium text-slate-700">{showReviewModal.targetEmployees.length} employees</p>
                </div>
              </div>

              <div className="space-y-1 pt-2 border-t border-slate-100">
                <label className="text-xs font-semibold text-slate-500">Assign Mentor (Required for Approval)</label>
                <select
                  required
                  value={assignedMentorId}
                  onChange={e => setAssignedMentorId(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-xl text-sm"
                >
                  <option value="">Select Mentor...</option>
                  {employees
                    .filter(e => e.status !== 'Terminated')
                    .map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({getEmployeeDesignation(emp, designations)} - {getEmployeeDepartment(emp, departments)})
                      </option>
                    ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">Feedback / Review Notes</label>
                <textarea
                  rows={2}
                  value={reviewerFeedback}
                  onChange={e => setReviewerFeedback(e.target.value)}
                  placeholder="Optional review notes..."
                  className="w-full p-2 border border-slate-200 rounded-xl text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => handleReviewRequest(showReviewModal, 'Rejected')}
                className="px-4 py-2 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-sm font-medium"
              >
                Reject Request
              </button>
              <button
                type="button"
                onClick={() => handleReviewRequest(showReviewModal, 'Approved')}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium"
              >
                Approve & Launch Course
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Request Table / Cards */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-800 text-lg">Training Request Log</h3>
        
        {requests.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            <AlertCircle className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p>No training requests filed yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-slate-600 border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold text-xs">
                  <th className="py-3 px-4 text-left">Course / Topic</th>
                  <th className="py-3 px-4 text-left">Requested By</th>
                  <th className="py-3 px-4 text-left">Target</th>
                  <th className="py-3 px-4 text-left">Urgency</th>
                  <th className="py-3 px-4 text-left">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {requests.map(req => (
                  <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div>
                        <p className="font-bold text-slate-800">{req.courseTitle}</p>
                        <p className="text-xs text-slate-400 line-clamp-1">{req.courseDescription}</p>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div>
                        <p className="font-medium text-slate-700">{req.requestedByName}</p>
                        <p className="text-[10px] text-slate-400">{req.department}</p>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium text-xs">
                        <Users className="w-3.5 h-3.5" />
                        {req.targetEmployees.length} Emp
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        req.urgency === 'High' ? 'bg-rose-50 text-rose-600' :
                        req.urgency === 'Medium' ? 'bg-amber-50 text-amber-600' :
                        'bg-sky-50 text-sky-600'
                      }`}>
                        {req.urgency}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold inline-flex items-center gap-1 ${
                        req.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' :
                        req.status === 'Rejected' ? 'bg-rose-100 text-rose-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        <Clock className="w-3 h-3" />
                        {req.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {isHR && req.status === 'Pending' ? (
                        <button
                          onClick={() => setShowReviewModal(req)}
                          className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg transition-all"
                        >
                          Review & Assign
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400 font-medium">Reviewed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
