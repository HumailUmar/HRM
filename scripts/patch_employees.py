import re

with open("src/components/Employees.tsx", "r") as f:
    content = f.read()

documents_tab_code = """
              {detailsTab === 'documents' && (
                <div className="space-y-5" id="documents-tab">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider font-display text-slate-800 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-violet-600" />
                        Employee Documents
                      </h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">Manage and verify compliance documents for this employee.</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {documents?.filter(d => d.employeeId === selectedEmployee.id).length === 0 ? (
                      <div className="text-center py-6 bg-slate-50/50 border border-dashed border-slate-100 rounded-xl text-slate-400 text-xs font-medium">
                        No documents uploaded for this employee yet.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {documents?.filter(d => d.employeeId === selectedEmployee.id).map(doc => (
                          <div key={doc.id} className="p-3 bg-white border border-slate-200 rounded-xl flex items-start justify-between hover:border-violet-300 transition-colors">
                            <div className="flex items-start gap-2.5">
                              <div className={`p-2 rounded-lg ${doc.isVerified ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                <FileText className="w-4 h-4" />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-slate-800">{doc.documentTypeLabel}</p>
                                <p className="text-[10px] text-slate-500 font-mono truncate max-w-[120px]">{doc.fileName}</p>
                                <div className="mt-1 flex items-center gap-2">
                                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${doc.status === 'Verified' ? 'bg-emerald-100 text-emerald-700' : doc.status === 'Pending Verification' ? 'bg-amber-100 text-amber-700' : doc.status === 'Rejected' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'}`}>
                                    {doc.status}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="p-1.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors" title="View Document">
                              <Eye className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
"""

pattern = r"(?<=              \{detailsTab === 'mentorship' && \(\n)(.*?)(?<=                </div>\n              \)\}\n)"

def replace_fn(match):
    return match.group(0) + documents_tab_code

new_content = re.sub(pattern, replace_fn, content, flags=re.DOTALL)

with open("src/components/Employees.tsx", "w") as f:
    f.write(new_content)
