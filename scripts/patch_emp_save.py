import re

with open("src/components/Employees.tsx", "r") as f:
    content = f.read()

# Make sure generateEmployeeDiff, addEmployeeHistory are imported
content = content.replace("import { addSheetLog, getSettings } from '../lib/storage';", "import { addSheetLog, getSettings, generateEmployeeDiff, addEmployeeHistory } from '../lib/storage';")

# 1. Update handleSaveEdit
save_edit_old = """  const handleSaveEdit = () => {
    if (!selectedEmployee) return;
    
    const updatedEmployees = employees.map(emp => 
      emp.id === selectedEmployee.id ? selectedEmployee : emp
    );
    
    setEmployees(updatedEmployees);
    setShowEditModal(false);"""

save_edit_new = """  const handleSaveEdit = () => {
    if (!selectedEmployee) return;
    
    const oldEmp = employees.find(e => e.id === selectedEmployee.id) || null;
    const diffs = generateEmployeeDiff(oldEmp, selectedEmployee, 'currentUser', 'Current User', 'UPDATE', 'MANUAL', 'Profile Update');
    if (diffs.length > 0) {
      addEmployeeHistory(diffs);
    }
    
    const updatedEmployees = employees.map(emp => 
      emp.id === selectedEmployee.id ? selectedEmployee : emp
    );
    
    setEmployees(updatedEmployees);
    setShowEditModal(false);"""

content = content.replace(save_edit_old, save_edit_new)

# 2. Update status save modal
status_save_old = """                  const updatedEmps = employees.map(emp => emp.id === selectedEmployee.id ? updatedEmp : emp);
                  setEmployees(updatedEmps);"""

status_save_new = """                  const updatedEmps = employees.map(emp => emp.id === selectedEmployee.id ? updatedEmp : emp);
                  const diffs = generateEmployeeDiff(selectedEmployee, updatedEmp, 'currentUser', 'Current User', 'UPDATE', 'TRANSITION', statusReason);
                  if (diffs.length > 0) addEmployeeHistory(diffs);
                  setEmployees(updatedEmps);"""

content = content.replace(status_save_old, status_save_new)

# 3. Update Bulk Status
bulk_status_old = """                onClick={() => {
                  if (!bulkStatus) return;
                  const updatedEmps = employees.map(emp => {
                    if (selectedIds.includes(emp.id)) {
                      return { ...emp, status: bulkStatus as any };
                    }
                    return emp;
                  });"""

bulk_status_new = """                onClick={() => {
                  if (!bulkStatus) return;
                  let allDiffs: any[] = [];
                  const updatedEmps = employees.map(emp => {
                    if (selectedIds.includes(emp.id)) {
                      const updated = { ...emp, status: bulkStatus as any };
                      const diffs = generateEmployeeDiff(emp, updated, 'currentUser', 'Current User', 'BULK_UPDATE', 'MANUAL');
                      allDiffs = [...allDiffs, ...diffs];
                      return updated;
                    }
                    return emp;
                  });
                  if (allDiffs.length > 0) addEmployeeHistory(allDiffs);"""

content = content.replace(bulk_status_old, bulk_status_new)

with open("src/components/Employees.tsx", "w") as f:
    f.write(content)
