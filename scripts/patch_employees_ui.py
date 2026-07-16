import re

with open("src/components/Employees.tsx", "r") as f:
    content = f.read()

# Update state
content = re.sub(
    r"const \[filterStatus, setFilterStatus\] = useState\<'All' \| 'Active' \| 'Onboarding' \| 'Terminated'\>\('All'\);",
    r"const [filterStatus, setFilterStatus] = useState<string>('All');",
    content
)

# Update filter logic
filter_logic_old = """  // Filtering
  const filteredEmployees = employees.filter((emp) => {
    const matchesStatus = filterStatus === 'All' || emp.status === filterStatus;
    const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          emp.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          emp.department.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });"""

filter_logic_new = """  // Filtering
  const filteredEmployees = employees.filter((emp) => {
    let matchesStatus = true;
    if (filterStatus === 'All') {
      matchesStatus = true;
    } else if (filterStatus === 'Active') {
      matchesStatus = emp.status === 'Active';
    } else if (filterStatus === 'All Active') {
      matchesStatus = ['Active', 'Onboarding', 'Probation'].includes(emp.status);
    } else if (filterStatus === 'Terminated') {
      matchesStatus = ['Terminated', 'Resigned', 'Retired', 'Deceased', 'Contract Expired'].includes(emp.status);
    } else {
      matchesStatus = emp.status === filterStatus;
    }
    
    const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          emp.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          emp.department.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });"""

content = content.replace(filter_logic_old, filter_logic_new)

# Update UI Tabs
filter_tabs_old = """            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/60 h-10 items-center gap-1 shrink-0">
              {(['All', 'Active', 'Onboarding', 'Terminated'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`h-8 px-3.5 rounded-lg text-xs font-bold tracking-wider transition-all uppercase ${
                    filterStatus === status
                      ? 'bg-white text-slate-800 shadow-sm font-black'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>"""

filter_tabs_new = """            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/60 h-10 items-center gap-1 shrink-0 overflow-x-auto">
              {(['All', 'Active', 'All Active', 'Onboarding', 'Probation', 'On Leave', 'Suspended', 'Terminated'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`h-8 px-3.5 rounded-lg text-xs font-bold tracking-wider transition-all uppercase whitespace-nowrap ${
                    filterStatus === status
                      ? 'bg-white text-slate-800 shadow-sm font-black'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>"""

content = content.replace(filter_tabs_old, filter_tabs_new)

with open("src/components/Employees.tsx", "w") as f:
    f.write(content)
