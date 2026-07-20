import re

with open("src/components/Employees.tsx", "r") as f:
    content = f.read()

# Add selection state
content = content.replace("  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);", "  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);\n  const [selectedIds, setSelectedIds] = useState<string[]>([]);\n  const [showBulkStatusModal, setShowBulkStatusModal] = useState(false);\n  const [bulkStatus, setBulkStatus] = useState('');")

# Checkboxes in table
header_cb = """                      <th className="px-4 py-3 font-extrabold uppercase tracking-widest border-b border-slate-100 text-slate-400 font-mono w-10">
                        <input type="checkbox" onChange={(e) => setSelectedIds(e.target.checked ? filteredEmployees.map(e => e.id) : [])} checked={selectedIds.length === filteredEmployees.length && filteredEmployees.length > 0} />
                      </th>"""
content = content.replace("<th className=\"px-4 py-3 font-extrabold uppercase tracking-widest border-b border-slate-100 text-slate-400 font-mono\">Employee</th>", header_cb + "\n<th className=\"px-4 py-3 font-extrabold uppercase tracking-widest border-b border-slate-100 text-slate-400 font-mono\">Employee</th>")

row_cb = """                        <td className="px-4 py-3.5">
                          <input type="checkbox" checked={selectedIds.includes(emp.id)} onChange={(e) => {
                            e.stopPropagation();
                            setSelectedIds(prev => e.target.checked ? [...prev, emp.id] : prev.filter(id => id !== emp.id));
                          }} />
                        </td>"""
content = content.replace("<td className=\"px-4 py-3.5\">\n                          <div className=\"flex items-center gap-3\">", row_cb + "\n<td className=\"px-4 py-3.5\">\n                          <div className=\"flex items-center gap-3\">")

# Bulk Action Button
bulk_btn = """
          {selectedIds.length > 0 && (
            <button
              onClick={() => setShowBulkStatusModal(true)}
              className="flex items-center gap-2 h-10 px-4 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md active:scale-[0.98]"
            >
              Update Status ({selectedIds.length})
            </button>
          )}
"""
content = content.replace("          <button\n            onClick={() => setShowAddModal(true)}", bulk_btn + "\n          <button\n            onClick={() => setShowAddModal(true)}")

bulk_modal = """
      {/* MODAL: BULK STATUS UPDATE */}
      {showBulkStatusModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl flex flex-col border border-slate-100 animate-scale-in">
            <h3 className="text-lg font-black text-slate-900 font-display mb-4">Bulk Status Update</h3>
            <p className="text-xs text-slate-500 mb-4">You are about to update the status of {selectedIds.length} employees.</p>
            
            <select
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value)}
              className="w-full h-10 px-3 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 rounded-xl text-sm font-medium mb-4"
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
            
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowBulkStatusModal(false)} className="px-4 py-2 text-slate-500 text-xs font-bold hover:bg-slate-50 rounded-lg">Cancel</button>
              <button 
                onClick={() => {
                  if (!bulkStatus) return;
                  const updatedEmps = employees.map(emp => {
                    if (selectedIds.includes(emp.id)) {
                      return { ...emp, status: bulkStatus as any };
                    }
                    return emp;
                  });
                  setEmployees(updatedEmps);
                  setShowBulkStatusModal(false);
                  setSelectedIds([]);
                  setBulkStatus('');
                }} 
                disabled={!bulkStatus} 
                className="px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-sm"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}
"""
content = content.replace("      {/* MODAL: UPLOAD PROFILE DOCUMENT */}", bulk_modal + "\n      {/* MODAL: UPLOAD PROFILE DOCUMENT */}")

with open("src/components/Employees.tsx", "w") as f:
    f.write(content)
