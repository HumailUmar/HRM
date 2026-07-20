import re

with open("src/components/Employees.tsx", "r") as f:
    content = f.read()

status_details = """
                  {/* Section 1.5: Status Details */}
                  {selectedEmployee.status !== 'Active' && selectedEmployee.status !== 'Onboarding' && (
                    <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-3">
                      <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 font-mono border-b border-slate-100 pb-2 flex items-center gap-2">
                        <Activity className="w-3.5 h-3.5" />
                        Status Information
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        {selectedEmployee.status === 'On Leave' && (
                          <>
                            <div><p className="text-[9px] font-bold uppercase text-slate-400">Leave Start</p><p className="font-semibold text-xs text-slate-800">{selectedEmployee.leaveStartDate || '—'}</p></div>
                            <div><p className="text-[9px] font-bold uppercase text-slate-400">Leave End</p><p className="font-semibold text-xs text-slate-800">{selectedEmployee.leaveEndDate || '—'}</p></div>
                            <div><p className="text-[9px] font-bold uppercase text-slate-400">Leave Type</p><p className="font-semibold text-xs text-slate-800">{selectedEmployee.leaveType || '—'}</p></div>
                          </>
                        )}
                        {selectedEmployee.status === 'Suspended' && (
                          <>
                            <div><p className="text-[9px] font-bold uppercase text-slate-400">Suspension Start</p><p className="font-semibold text-xs text-slate-800">{selectedEmployee.suspensionStartDate || '—'}</p></div>
                            <div><p className="text-[9px] font-bold uppercase text-slate-400">Suspension End</p><p className="font-semibold text-xs text-slate-800">{selectedEmployee.suspensionEndDate || '—'}</p></div>
                            <div className="col-span-2"><p className="text-[9px] font-bold uppercase text-slate-400">Reason</p><p className="font-semibold text-xs text-slate-800">{selectedEmployee.suspensionReason || '—'}</p></div>
                          </>
                        )}
                        {selectedEmployee.status === 'Probation' && (
                          <>
                            <div><p className="text-[9px] font-bold uppercase text-slate-400">Probation Start</p><p className="font-semibold text-xs text-slate-800">{selectedEmployee.probationStartDate || '—'}</p></div>
                            <div><p className="text-[9px] font-bold uppercase text-slate-400">Probation End</p><p className="font-semibold text-xs text-slate-800">{selectedEmployee.probationEndDate || '—'}</p></div>
                          </>
                        )}
                        {selectedEmployee.status === 'Resigned' && (
                          <>
                            <div><p className="text-[9px] font-bold uppercase text-slate-400">Resignation Date</p><p className="font-semibold text-xs text-slate-800">{selectedEmployee.resignationDate || '—'}</p></div>
                            <div><p className="text-[9px] font-bold uppercase text-slate-400">Last Working Date</p><p className="font-semibold text-xs text-slate-800">{selectedEmployee.lastWorkingDate || '—'}</p></div>
                          </>
                        )}
                        {selectedEmployee.status === 'Terminated' && (
                          <>
                            <div><p className="text-[9px] font-bold uppercase text-slate-400">Termination Date</p><p className="font-semibold text-xs text-slate-800">{selectedEmployee.terminationDate || '—'}</p></div>
                            <div className="col-span-2"><p className="text-[9px] font-bold uppercase text-slate-400">Reason</p><p className="font-semibold text-xs text-slate-800">{selectedEmployee.terminationReason || '—'}</p></div>
                          </>
                        )}
                        {selectedEmployee.status === 'Retired' && (
                          <div><p className="text-[9px] font-bold uppercase text-slate-400">Retirement Date</p><p className="font-semibold text-xs text-slate-800">{selectedEmployee.retirementDate || '—'}</p></div>
                        )}
                        {selectedEmployee.status === 'Contract Expired' && (
                          <div><p className="text-[9px] font-bold uppercase text-slate-400">Contract End Date</p><p className="font-semibold text-xs text-slate-800">{selectedEmployee.contractEndDate || '—'}</p></div>
                        )}
                      </div>
                    </div>
                  )}
"""

content = content.replace("                  {/* Section 2: Contact Info */}", status_details + "\n                  {/* Section 2: Contact Info */}")

with open("src/components/Employees.tsx", "w") as f:
    f.write(content)
