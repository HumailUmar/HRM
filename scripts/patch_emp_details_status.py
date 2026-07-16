import re

with open("src/components/Employees.tsx", "r") as f:
    content = f.read()

state = """
  const [showStatusUpdateModal, setShowStatusUpdateModal] = useState(false);
  const [newStatusUpdate, setNewStatusUpdate] = useState('');
  const [statusReason, setStatusReason] = useState('');
"""
content = content.replace("  const [showDocUploadModal, setShowDocUploadModal] = useState(false);", "  const [showDocUploadModal, setShowDocUploadModal] = useState(false);\n" + state)


# Top right corner of details pane has action buttons. Let's add a "Change Status" button.
action_btns = """                    <button
                      onClick={() => setShowStatusUpdateModal(true)}
                      className="text-[10px] text-slate-500 hover:text-violet-600 hover:bg-violet-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-bold uppercase tracking-wider transition-all"
                    >
                      Change Status
                    </button>"""
content = content.replace("                    <button\n                      onClick={() => setShowDocUploadModal(true)}\n                      className=\"px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors shadow-sm flex items-center gap-1\"\n                    >\n                      <UploadCloud className=\"w-3.5 h-3.5\" /> Upload\n                    </button>", "                    <button\n                      onClick={() => setShowDocUploadModal(true)}\n                      className=\"px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors shadow-sm flex items-center gap-1\"\n                    >\n                      <UploadCloud className=\"w-3.5 h-3.5\" /> Upload\n                    </button>\n" + action_btns)

modal = """
      {/* MODAL: UPDATE STATUS */}
      {showStatusUpdateModal && selectedEmployee && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl flex flex-col border border-slate-100 animate-scale-in">
            <h3 className="text-lg font-black text-slate-900 font-display mb-2">Change Status</h3>
            <p className="text-xs text-slate-500 mb-4">Update status for {selectedEmployee.name}</p>
            
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">New Status</label>
                <select
                  value={newStatusUpdate}
                  onChange={(e) => setNewStatusUpdate(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 rounded-xl text-sm font-medium"
                >
                  <option value="">Select New Status</option>
                  <option value="Active">Active</option>
                  <option value="Onboarding">Onboarding</option>
                  <option value="Probation">Probation</option>
                  <option value="On Leave">On Leave</option>
                  <option value="Suspended">Suspended</option>
                  <option value="Resigned">Resigned</option>
                  <option value="Retired">Retired</option>
                  <option value="Deceased">Deceased</option>
                  <option value="Contract Expired">Contract Expired</option>
                  <option value="Terminated">Terminated</option>
                </select>
              </div>
              
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Reason / Notes</label>
                <textarea
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 rounded-xl text-xs font-medium"
                  rows={3}
                  placeholder="Reason for status change..."
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowStatusUpdateModal(false)} className="px-4 py-2 text-slate-500 text-xs font-bold hover:bg-slate-50 rounded-lg">Cancel</button>
              <button 
                onClick={() => {
                  if (!newStatusUpdate) return;
                  const validTransitions: any = {
                    'Onboarding': ['Active', 'Probation', 'Terminated'],
                    'Probation': ['Active', 'Terminated'],
                    'Active': ['On Leave', 'Suspended', 'Resigned', 'Retired', 'Terminated', 'Contract Expired'],
                    'On Leave': ['Active', 'Terminated', 'Resigned'],
                    'Suspended': ['Active', 'Terminated'],
                    'Resigned': ['Terminated'],
                    'Retired': [],
                    'Deceased': [],
                    'Contract Expired': [],
                    'Terminated': []
                  };
                  
                  if (selectedEmployee.status && validTransitions[selectedEmployee.status] && !validTransitions[selectedEmployee.status].includes(newStatusUpdate)) {
                    alert(`Cannot change status from ${selectedEmployee.status} to ${newStatusUpdate}. Valid transitions are: ${validTransitions[selectedEmployee.status].join(', ') || 'None'}`);
                    return;
                  }
                  
                  const updatedEmp = { 
                    ...selectedEmployee, 
                    status: newStatusUpdate as any,
                    statusHistory: [
                      {
                        id: `SH-${Date.now()}`,
                        employeeId: selectedEmployee.id,
                        employeeName: selectedEmployee.name,
                        oldStatus: selectedEmployee.status,
                        newStatus: newStatusUpdate,
                        changedBy: 'Admin',
                        changedByName: 'HR Admin',
                        changedAt: new Date().toISOString(),
                        reason: statusReason,
                        notes: ''
                      },
                      ...(selectedEmployee.statusHistory || [])
                    ]
                  };
                  
                  const updatedEmps = employees.map(emp => emp.id === selectedEmployee.id ? updatedEmp : emp);
                  setEmployees(updatedEmps);
                  setSelectedEmployee(updatedEmp);
                  setShowStatusUpdateModal(false);
                  setNewStatusUpdate('');
                  setStatusReason('');
                }} 
                disabled={!newStatusUpdate} 
                className="px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-sm"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
"""
content = content.replace("      {/* MODAL: BULK STATUS UPDATE */}", modal + "\n      {/* MODAL: BULK STATUS UPDATE */}")


# Show Status history tab in selected employee details
tabs_old = """                  <button
                    onClick={() => setDetailsTab('mentorship')}
                    className={`pb-2.5 px-1.5 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
                      detailsTab === 'mentorship' 
                        ? 'border-violet-600 text-violet-600' 
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    Mentorship
                  </button>
                  <button
                    onClick={() => setDetailsTab('documents')}
                    className={`pb-2.5 px-1.5 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
                      detailsTab === 'documents' 
                        ? 'border-violet-600 text-violet-600' 
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    Documents
                  </button>"""

tabs_new = tabs_old + """
                  <button
                    onClick={() => setDetailsTab('status_history' as any)}
                    className={`pb-2.5 px-1.5 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
                      detailsTab === 'status_history' as any
                        ? 'border-violet-600 text-violet-600' 
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    Status
                  </button>"""

content = content.replace(tabs_old, tabs_new)

sh_panel = """
              {detailsTab === 'status_history' as any && (
                <div className="space-y-5 animate-fade-in">
                  <h4 className="text-xs font-black uppercase tracking-wider font-display text-slate-800 border-b border-slate-100 pb-2">Status History</h4>
                  
                  <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                    {(!selectedEmployee.statusHistory || selectedEmployee.statusHistory.length === 0) ? (
                      <div className="text-center py-6 bg-slate-50 border border-slate-100 rounded-xl text-slate-400 text-xs font-medium relative z-10">
                        No status history available.
                      </div>
                    ) : (
                      selectedEmployee.statusHistory.map((sh, idx) => (
                        <div key={sh.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                          <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-slate-200 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                            <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
                          </div>
                          
                          <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-all">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-slate-500 line-through">{sh.oldStatus}</span>
                                <span className="text-xs font-bold text-slate-800">→</span>
                                <span className="text-xs font-bold text-violet-600">{sh.newStatus}</span>
                              </div>
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                                {new Date(sh.changedAt).toLocaleDateString()}
                              </span>
                            </div>
                            {sh.reason && (
                              <p className="text-xs text-slate-600 mt-2 bg-slate-50 p-2 rounded-lg">{sh.reason}</p>
                            )}
                            <p className="text-[9px] text-slate-400 mt-2 font-mono">By: {sh.changedByName}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
"""

content = content.replace("              {detailsTab === 'documents' && (", sh_panel + "\n              {detailsTab === 'documents' && (")

with open("src/components/Employees.tsx", "w") as f:
    f.write(content)
