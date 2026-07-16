import re

with open("src/components/Dashboard.tsx", "r") as f:
    content = f.read()

# 1. Update Props
content = content.replace("import { Employee, EmployeeDocument", "import { Employee, EmployeeDocument, JobDescription")
content = content.replace("documents: EmployeeDocument[];\n}", "documents: EmployeeDocument[];\n  jobDescriptions?: JobDescription[];\n}")
content = content.replace("  documents\n}: DashboardProps) {", "  documents,\n  jobDescriptions = []\n}: DashboardProps) {")

# 2. Add Active Jobs Widget in Row 1 (or 1.5)
widget_code = """
      {/* JD Widget */}
      {jobDescriptions.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-xl shadow-slate-100/30 mb-8 flex flex-col md:flex-row gap-6">
          <div className="flex-1">
            <h3 className="text-md font-bold text-slate-900 font-display flex items-center gap-2 mb-2">
              <Briefcase className="w-4 h-4 text-violet-600" />
              Active Job Postings
            </h3>
            <p className="text-[10px] text-slate-500 font-medium mb-4">Tracking open positions and pipeline.</p>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-violet-50 rounded-xl border border-violet-100">
                <p className="text-[10px] font-bold uppercase text-violet-600 mb-1">Open Positions</p>
                <p className="text-2xl font-black text-slate-800">{jobDescriptions.filter(j => j.isActive).length}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                <p className="text-[10px] font-bold uppercase text-blue-600 mb-1">Total Pipeline</p>
                <p className="text-2xl font-black text-slate-800">{jobDescriptions.reduce((sum, jd) => sum + jd.candidatesInPipeline, 0)}</p>
              </div>
            </div>
          </div>
          <div className="flex-[2] overflow-x-auto">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Recent Job Descriptions</h4>
            <table className="w-full text-left">
              <thead>
                <tr>
                  <th className="pb-2 text-[9px] font-extrabold uppercase tracking-widest text-slate-400 border-b border-slate-100">Title</th>
                  <th className="pb-2 text-[9px] font-extrabold uppercase tracking-widest text-slate-400 border-b border-slate-100">Dept</th>
                  <th className="pb-2 text-[9px] font-extrabold uppercase tracking-widest text-slate-400 border-b border-slate-100">Status</th>
                  <th className="pb-2 text-[9px] font-extrabold uppercase tracking-widest text-slate-400 border-b border-slate-100">Apps</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {jobDescriptions.slice(0, 3).map(jd => (
                  <tr key={jd.id} className="hover:bg-slate-50/50">
                    <td className="py-2 px-1"><span className="text-[11px] font-bold text-slate-800">{jd.title}</span></td>
                    <td className="py-2 px-1"><span className="text-[10px] font-medium text-slate-500">{jd.department}</span></td>
                    <td className="py-2 px-1">
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${jd.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{jd.isActive ? 'Active' : 'Closed'}</span>
                    </td>
                    <td className="py-2 px-1"><span className="text-[10px] font-medium text-slate-800">{jd.totalApplications}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
"""

content = content.replace("      {/* ROW 1.5: Audit Trail Widget */}", widget_code + "\n      {/* ROW 1.5: Audit Trail Widget */}")

with open("src/components/Dashboard.tsx", "w") as f:
    f.write(content)
