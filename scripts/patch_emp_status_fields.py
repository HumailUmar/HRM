import re

with open("src/components/Employees.tsx", "r") as f:
    content = f.read()

fields = """
  // State for conditional status fields
  const [leaveStartDate, setLeaveStartDate] = useState('');
  const [leaveEndDate, setLeaveEndDate] = useState('');
  const [leaveType, setLeaveType] = useState('Personal');
  const [suspensionStartDate, setSuspensionStartDate] = useState('');
  const [suspensionEndDate, setSuspensionEndDate] = useState('');
  const [probationStartDate, setProbationStartDate] = useState('');
  const [probationEndDate, setProbationEndDate] = useState('');
  const [resignationDate, setResignationDate] = useState('');
  const [lastWorkingDate, setLastWorkingDate] = useState('');
  const [retirementDate, setRetirementDate] = useState('');
  const [terminationDate, setTerminationDate] = useState('');
  const [dateOfPassing, setDateOfPassing] = useState('');
  const [contractEndDate, setContractEndDate] = useState('');
"""

content = content.replace("  const [statusReason, setStatusReason] = useState('');", "  const [statusReason, setStatusReason] = useState('');\n" + fields)

conditional_ui = """
              {newStatusUpdate === 'On Leave' && (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Leave Start</label>
                    <input type="date" value={leaveStartDate} onChange={e => setLeaveStartDate(e.target.value)} required className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Leave End</label>
                    <input type="date" value={leaveEndDate} onChange={e => setLeaveEndDate(e.target.value)} required className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Leave Type</label>
                    <select value={leaveType} onChange={e => setLeaveType(e.target.value)} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                      <option value="Maternity">Maternity</option>
                      <option value="Paternity">Paternity</option>
                      <option value="Sabbatical">Sabbatical</option>
                      <option value="Study">Study</option>
                      <option value="Medical">Medical</option>
                      <option value="Personal">Personal</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              )}
              {newStatusUpdate === 'Suspended' && (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Suspend Start</label>
                    <input type="date" value={suspensionStartDate} onChange={e => setSuspensionStartDate(e.target.value)} required className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Suspend End</label>
                    <input type="date" value={suspensionEndDate} onChange={e => setSuspensionEndDate(e.target.value)} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs" />
                  </div>
                </div>
              )}
              {newStatusUpdate === 'Probation' && (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Probation Start</label>
                    <input type="date" value={probationStartDate} onChange={e => setProbationStartDate(e.target.value)} required className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Probation End</label>
                    <input type="date" value={probationEndDate} onChange={e => setProbationEndDate(e.target.value)} required className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs" />
                  </div>
                </div>
              )}
              {newStatusUpdate === 'Resigned' && (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Resign Date</label>
                    <input type="date" value={resignationDate} onChange={e => setResignationDate(e.target.value)} required className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Last Working</label>
                    <input type="date" value={lastWorkingDate} onChange={e => setLastWorkingDate(e.target.value)} required className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs" />
                  </div>
                </div>
              )}
              {newStatusUpdate === 'Terminated' && (
                <div className="mt-2">
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Termination Date</label>
                  <input type="date" value={terminationDate} onChange={e => setTerminationDate(e.target.value)} required className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs" />
                </div>
              )}
              {newStatusUpdate === 'Retired' && (
                <div className="mt-2">
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Retirement Date</label>
                  <input type="date" value={retirementDate} onChange={e => setRetirementDate(e.target.value)} required className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs" />
                </div>
              )}
              {newStatusUpdate === 'Deceased' && (
                <div className="mt-2">
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Date of Passing</label>
                  <input type="date" value={dateOfPassing} onChange={e => setDateOfPassing(e.target.value)} required className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs" />
                </div>
              )}
              {newStatusUpdate === 'Contract Expired' && (
                <div className="mt-2">
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Contract End</label>
                  <input type="date" value={contractEndDate} onChange={e => setContractEndDate(e.target.value)} required className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs" />
                </div>
              )}
"""

content = content.replace("              <div>\n                <label className=\"block text-[10px] font-bold uppercase text-slate-400 mb-1\">Reason / Notes</label>", conditional_ui + "\n              <div>\n                <label className=\"block text-[10px] font-bold uppercase text-slate-400 mb-1\">Reason / Notes</label>")

update_emp = """
                  const updatedEmp = { 
                    ...selectedEmployee, 
                    status: newStatusUpdate as any,
                    currentStatusSince: new Date().toISOString(),
                    leaveStartDate: newStatusUpdate === 'On Leave' ? leaveStartDate : selectedEmployee.leaveStartDate,
                    leaveEndDate: newStatusUpdate === 'On Leave' ? leaveEndDate : selectedEmployee.leaveEndDate,
                    leaveType: newStatusUpdate === 'On Leave' ? leaveType : selectedEmployee.leaveType,
                    suspensionStartDate: newStatusUpdate === 'Suspended' ? suspensionStartDate : selectedEmployee.suspensionStartDate,
                    suspensionEndDate: newStatusUpdate === 'Suspended' ? suspensionEndDate : selectedEmployee.suspensionEndDate,
                    suspensionReason: newStatusUpdate === 'Suspended' ? statusReason : selectedEmployee.suspensionReason,
                    probationStartDate: newStatusUpdate === 'Probation' ? probationStartDate : selectedEmployee.probationStartDate,
                    probationEndDate: newStatusUpdate === 'Probation' ? probationEndDate : selectedEmployee.probationEndDate,
                    resignationDate: newStatusUpdate === 'Resigned' ? resignationDate : selectedEmployee.resignationDate,
                    lastWorkingDate: newStatusUpdate === 'Resigned' ? lastWorkingDate : selectedEmployee.lastWorkingDate,
                    retirementDate: newStatusUpdate === 'Retired' ? retirementDate : selectedEmployee.retirementDate,
                    terminationDate: newStatusUpdate === 'Terminated' ? terminationDate : selectedEmployee.terminationDate,
                    terminationReason: newStatusUpdate === 'Terminated' ? statusReason : selectedEmployee.terminationReason,
"""

content = re.sub(r"                  const updatedEmp = \{ \n                    \.\.\.selectedEmployee, \n                    status: newStatusUpdate as any,", update_emp, content)


with open("src/components/Employees.tsx", "w") as f:
    f.write(content)
