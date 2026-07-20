import re

with open("src/components/Employees.tsx", "r") as f:
    content = f.read()

helper_code = """
  // Helper for Status Badge Colors
  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'Active': return { bg: 'bg-emerald-100 text-emerald-800', dot: 'bg-emerald-500' };
      case 'Onboarding': return { bg: 'bg-violet-100 text-violet-800', dot: 'bg-violet-500' };
      case 'Probation': return { bg: 'bg-amber-100 text-amber-800', dot: 'bg-amber-500' };
      case 'On Leave': return { bg: 'bg-orange-100 text-orange-800', dot: 'bg-orange-500' };
      case 'Suspended': return { bg: 'bg-rose-100 text-rose-800', dot: 'bg-rose-500' };
      case 'Contract Expired': return { bg: 'bg-rose-100 text-rose-800', dot: 'bg-rose-500' };
      case 'Deceased': return { bg: 'bg-slate-800 text-white', dot: 'bg-slate-300' };
      default: return { bg: 'bg-slate-100 text-slate-800', dot: 'bg-slate-500' }; // Resigned, Retired, Terminated
    }
  };
"""

content = content.replace("  const [isMentorModalOpen, setIsMentorModalOpen] = useState(false);", "  const [isMentorModalOpen, setIsMentorModalOpen] = useState(false);\n" + helper_code)

old_badge_td = """                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                            emp.status === 'Active' ? 'bg-emerald-100 text-emerald-800' :
                            emp.status === 'Onboarding' ? 'bg-violet-100 text-violet-800' :
                            'bg-slate-100 text-slate-800'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              emp.status === 'Active' ? 'bg-emerald-500' :
                              emp.status === 'Onboarding' ? 'bg-violet-500' :
                              'bg-slate-500'
                            }`} />
                            {emp.status}
                          </span>
                        </td>"""

new_badge_td = """                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusBadge(emp.status).bg}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${getStatusBadge(emp.status).dot}`} />
                            {emp.status}
                          </span>
                        </td>"""

content = content.replace(old_badge_td, new_badge_td)

with open("src/components/Employees.tsx", "w") as f:
    f.write(content)
