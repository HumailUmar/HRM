import re

with open("src/components/Employees.tsx", "r") as f:
    content = f.read()

content = content.replace("import { addSheetLog, getSettings, generateEmployeeDiff, addEmployeeHistory } from '../lib/storage';", "import { addSheetLog, getSettings, generateEmployeeDiff, addEmployeeHistory, getEmployeeHistory } from '../lib/storage';")

tab_btn = """
                  <button
                    onClick={() => setDetailsTab('history' as any)}
                    className={`pb-2.5 px-1.5 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
                      detailsTab === 'history' as any
                        ? 'border-violet-600 text-violet-600' 
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    History
                  </button>"""

content = content.replace("                  </button>\n                  <button\n                    onClick={() => setDetailsTab('status_history' as any)}", tab_btn + "\n                  </button>\n                  <button\n                    onClick={() => setDetailsTab('status_history' as any)}")


history_panel = """
              {detailsTab === 'history' as any && (
                <div className="space-y-5 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h4 className="text-xs font-black uppercase tracking-wider font-display text-slate-800">History & Changes</h4>
                  </div>
                  
                  <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                    {(() => {
                      const empHistory = getEmployeeHistory().filter(h => h.employeeId === selectedEmployee.id);
                      if (empHistory.length === 0) {
                        return (
                          <div className="text-center py-6 bg-slate-50 border border-slate-100 rounded-xl text-slate-400 text-xs font-medium relative z-10">
                            No history available for this employee.
                          </div>
                        );
                      }
                      
                      return empHistory.map(h => {
                        const isAdd = h.changeType === 'CREATE';
                        const isDel = h.changeType === 'DELETE';
                        
                        return (
                          <div key={h.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 ${
                              isAdd ? 'bg-emerald-100 text-emerald-600' : isDel ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'
                            }`}>
                              <Activity className="w-4 h-4" />
                            </div>
                            
                            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-all">
                              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2">
                                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] uppercase font-bold tracking-wider">{h.fieldLabel}</span>
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono mt-1 sm:mt-0">
                                  {new Date(h.changedAt).toLocaleDateString()} {new Date(h.changedAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                </span>
                              </div>
                              
                              <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg mb-2 overflow-hidden">
                                {isAdd ? (
                                  <span className="text-xs font-bold text-emerald-600 truncate">{h.newValue}</span>
                                ) : isDel ? (
                                  <span className="text-xs font-bold text-rose-600 line-through truncate">{h.oldValue}</span>
                                ) : (
                                  <>
                                    <span className="text-xs text-slate-500 line-through truncate max-w-[40%]">{h.oldValue || '—'}</span>
                                    <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                                    <span className="text-xs font-bold text-blue-600 truncate max-w-[40%]">{h.newValue}</span>
                                  </>
                                )}
                              </div>
                              
                              <div className="flex justify-between items-end mt-2 pt-2 border-t border-slate-50">
                                <p className="text-[9px] text-slate-400 font-mono">By: {h.changedByName}</p>
                                {h.reason && <p className="text-[9px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded truncate max-w-[60%]">Reason: {h.reason}</p>}
                              </div>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              )}
"""

content = content.replace("              {detailsTab === 'status_history' as any && (", history_panel + "\n              {detailsTab === 'status_history' as any && (")

with open("src/components/Employees.tsx", "w") as f:
    f.write(content)
