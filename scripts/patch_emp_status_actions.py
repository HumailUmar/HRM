import re

with open("src/components/Employees.tsx", "r") as f:
    content = f.read()

update_logic_old = """                  const updatedEmp = { 
                    ...selectedEmployee, 
                    status: newStatusUpdate as any,
                    currentStatusSince: new Date().toISOString(),"""

update_logic_new = """                  const updatedEmp = { 
                    ...selectedEmployee, 
                    status: newStatusUpdate as any,
                    seatNumber: ['On Leave', 'Suspended', 'Resigned', 'Terminated', 'Retired', 'Deceased', 'Contract Expired'].includes(newStatusUpdate) ? 0 : selectedEmployee.seatNumber,
                    currentStatusSince: new Date().toISOString(),"""

content = content.replace(update_logic_old, update_logic_new)

with open("src/components/Employees.tsx", "w") as f:
    f.write(content)
