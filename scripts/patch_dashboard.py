import re

with open("src/components/Dashboard.tsx", "r") as f:
    content = f.read()

# Add PieChart widget. I can use simple flex row with colors to simulate pie chart if D3/Recharts is not configured or I can use Recharts since recharts is available in standard package.json for this project usually? The guideline says "Use recharts for charts."
# First, let's see if recharts is imported.
if "recharts" not in content:
    content = "import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';\n" + content

# Prepare data for Status Distribution
# find where metrics are calculated
metrics_calc = """
  const presentToday = activeAttendance.filter(a => a.status === 'Present').length;
  const onLeaveToday = activeAttendance.filter(a => a.status === 'Leave').length;
"""

new_metrics = metrics_calc + """
  // Status Distribution Data
  const statusCounts = employees.reduce((acc, emp) => {
    acc[emp.status] = (acc[emp.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const statusPieData = Object.keys(statusCounts).map(status => ({
    name: status,
    value: statusCounts[status]
  }));
  
  const COLORS: Record<string, string> = {
    'Active': '#10b981', // emerald
    'Onboarding': '#8b5cf6', // violet
    'Probation': '#f59e0b', // amber
    'On Leave': '#f97316', // orange
    'Suspended': '#ef4444', // rose
    'Resigned': '#64748b', // slate
    'Retired': '#94a3b8', 
    'Deceased': '#0f172a',
    'Contract Expired': '#e11d48',
    'Terminated': '#cbd5e1'
  };
"""

content = content.replace(metrics_calc, new_metrics)

# Let's add the widget to the dashboard layout.
# We'll find a place to put it, e.g., above the seat chart
dashboard_layout = """
        {/* ROW 2: Activity Map & Department Insights */}
"""

status_widget = """
        {/* Status Distribution Widget */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-1 bg-white p-6 rounded-3xl shadow-xl shadow-slate-100/50 border border-slate-100">
            <h3 className="text-sm font-black font-display tracking-tight text-slate-800 flex items-center gap-2 mb-4">
              <PieChart className="w-4 h-4 text-violet-500" />
              Employee Status
            </h3>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={statusPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {statusPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[entry.name] || '#94a3b8'} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }}
                    itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {statusPieData.map((s, idx) => (
                <div key={idx} className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[s.name] || '#94a3b8' }} />
                  <span className="text-[10px] font-bold text-slate-500 uppercase">{s.name} ({s.value})</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* On Leave Summary */}
            <div className="bg-orange-50/50 border border-orange-100/50 p-5 rounded-3xl flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-black uppercase text-orange-600 mb-2 font-display">On Leave Summary</h4>
                <div className="space-y-2">
                  {employees.filter(e => e.status === 'On Leave').length === 0 ? (
                    <p className="text-xs text-orange-400/80 font-bold">No employees currently on leave.</p>
                  ) : (
                    employees.filter(e => e.status === 'On Leave').slice(0, 3).map(e => (
                      <div key={e.id} className="bg-white/80 p-2 rounded-xl flex items-center justify-between text-xs font-bold text-orange-800 shadow-sm border border-orange-100">
                        <span>{e.name}</span>
                        <span className="bg-orange-200/50 px-2 py-0.5 rounded-lg text-[9px]">{e.leaveType || 'Leave'}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <button onClick={() => setActiveTab('employees')} className="text-[10px] font-bold text-orange-600 hover:text-orange-800 mt-4 self-start">View All →</button>
            </div>

            {/* Probation Ending Soon */}
            <div className="bg-amber-50/50 border border-amber-100/50 p-5 rounded-3xl flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-black uppercase text-amber-600 mb-2 font-display">Probation Ending</h4>
                <div className="space-y-2">
                  {employees.filter(e => e.status === 'Probation').length === 0 ? (
                    <p className="text-xs text-amber-400/80 font-bold">No employees on probation.</p>
                  ) : (
                    employees.filter(e => e.status === 'Probation').slice(0, 3).map(e => {
                      const end = e.probationEndDate ? new Date(e.probationEndDate) : new Date();
                      const days = Math.ceil((end.getTime() - new Date().getTime()) / (1000 * 3600 * 24));
                      return (
                        <div key={e.id} className="bg-white/80 p-2 rounded-xl flex items-center justify-between text-xs font-bold text-amber-800 shadow-sm border border-amber-100">
                          <span>{e.name}</span>
                          <span className={`px-2 py-0.5 rounded-lg text-[9px] ${days < 7 ? 'bg-rose-100 text-rose-700' : 'bg-amber-200/50'}`}>
                            {days > 0 ? `${days} days left` : 'Expired'}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
              <button onClick={() => setActiveTab('employees')} className="text-[10px] font-bold text-amber-600 hover:text-amber-800 mt-4 self-start">Review Probationers →</button>
            </div>
          </div>
        </div>
"""

content = content.replace("        {/* ROW 2: Activity Map & Department Insights */}", status_widget + "\n        {/* ROW 2: Activity Map & Department Insights */}")

with open("src/components/Dashboard.tsx", "w") as f:
    f.write(content)
