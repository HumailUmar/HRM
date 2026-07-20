import re

with open("src/components/Dashboard.tsx", "r") as f:
    content = f.read()

history_widget = """
      {/* ROW 1.5: Audit Trail Widget */}
      <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-xl shadow-slate-100/30 mb-8">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-md font-bold text-slate-900 font-display flex items-center gap-2">
              <Activity className="w-4 h-4 text-violet-600" />
              Recent System Changes
            </h3>
            <p className="text-[10px] text-slate-500 font-medium">Tracking all employee modifications.</p>
          </div>
          <button onClick={() => setActiveTab('audit_trail')} className="text-xs font-bold text-violet-600 hover:text-violet-800 flex items-center gap-1 transition-colors">
            View Full Audit Trail <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="pb-2 text-[9px] font-extrabold uppercase tracking-widest text-slate-400 border-b border-slate-100">Time</th>
                <th className="pb-2 text-[9px] font-extrabold uppercase tracking-widest text-slate-400 border-b border-slate-100">Employee</th>
                <th className="pb-2 text-[9px] font-extrabold uppercase tracking-widest text-slate-400 border-b border-slate-100">Change</th>
                <th className="pb-2 text-[9px] font-extrabold uppercase tracking-widest text-slate-400 border-b border-slate-100">User</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {(() => {
                let rChanges = [];
                try {
                  const saved = localStorage.getItem('employee_history');
                  if (saved) rChanges = JSON.parse(saved).slice(0, 5);
                } catch(e) {}
                if (rChanges.length === 0) {
                  return <tr><td colSpan={4} className="py-4 text-center text-xs text-slate-400">No recent changes</td></tr>;
                }
                return rChanges.map((c: any) => (
                  <tr key={c.id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-1"><span className="text-[10px] font-mono text-slate-500">{new Date(c.changedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span></td>
                    <td className="py-2.5 px-1"><span className="text-[11px] font-bold text-slate-800">{c.employeeName}</span></td>
                    <td className="py-2.5 px-1">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] uppercase font-bold">{c.fieldLabel}</span>
                        <span className="text-[9px] text-slate-400 max-w-[120px] truncate" title={`${c.oldValue} -> ${c.newValue}`}>{c.oldValue || '—'} → {c.newValue}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-1"><span className="text-[10px] font-medium text-slate-500">{c.changedByName}</span></td>
                  </tr>
                ));
              })()}
            </tbody>
          </table>
        </div>
      </div>

      {/* Middle Grid: Left = Recent Attendance Table; Right = Heatmap / Department Chart */}
"""

content = content.replace("      {/* Middle Grid: Left = Recent Attendance Table; Right = Heatmap / Department Chart */}", history_widget)

content = content.replace("import { Users, UserCheck,", "import { Activity, ArrowRight, Users, UserCheck,")

with open("src/components/Dashboard.tsx", "w") as f:
    f.write(content)
