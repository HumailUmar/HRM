const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const oldCode = `app.delete('/api/v1/employees/:id', authenticateToken, authorize(['Admin']), async (req: any, res: any) => {
  try {
    const employees = getEmployees().filter(e => e.id !== req.params.id);
    await saveEmployeesToDB(employees);
    res.json({ success: true, message: 'Employee deleted' });
  } catch (error: any) {`;

const newCode = `app.delete('/api/v1/employees/:id', authenticateToken, authorize(['Admin']), async (req: any, res: any) => {
  try {
    await deleteEmployeeFromDB(req.params.id);
    res.json({ success: true, message: 'Employee deleted' });
  } catch (error: any) {`;

if (content.includes(oldCode)) {
  content = content.replace(oldCode, newCode);
  fs.writeFileSync('server.ts', content);
  console.log("Successfully replaced!");
} else {
  console.error("Not found!");
}
