import re

with open('server.ts', 'r') as f:
    content = f.read()

# Remove the global app.use
content = re.sub(
    r'// Specific exception for key management \(internal UI use\).*?app\.use\(\'/api/v1\', \(req, res, next\) => \{.*?authenticateToken\(req, res, next\);\n\}\);\n',
    '',
    content,
    flags=re.DOTALL
)

# Employees routes
content = re.sub(
    r"app\.get\('/api/v1/employees', async \(req, res\) => \{",
    r"app.get('/api/v1/employees', authenticateToken, authorize(['HR', 'Admin', 'Manager']), async (req: any, res: any) => {",
    content
)

old_get_emp_id = """app.get('/api/v1/employees/:id', async (req, res) => {
  try {
    const employee = getEmployees().find(e => e.id === req.params.id);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    res.json({ success: true, data: employee });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});"""
new_get_emp_id = """app.get('/api/v1/employees/:id', authenticateToken, authorize(['HR', 'Admin', 'Manager', 'Employee']), async (req: any, res: any) => {
  try {
    const employee = getEmployees().find(e => e.id === req.params.id);
    if (!employee) return res.status(404).json({ error: 'Employee not found' });

    if (req.user.role === 'Employee' && req.user.employeeId !== req.params.id) {
      return res.status(403).json({ error: 'You can only view your own profile' });
    }
    res.json({ success: true, data: employee });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});"""
content = content.replace(old_get_emp_id, new_get_emp_id)

content = re.sub(
    r"app\.post\('/api/v1/employees', async \(req, res\) => \{",
    r"app.post('/api/v1/employees', authenticateToken, authorize(['HR', 'Admin']), async (req: any, res: any) => {",
    content
)

old_put_emp = """app.put('/api/v1/employees/:id', async (req, res) => {
  try {
    const validation = EmployeeSchema.partial().safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.issues[0].message });
    }
    const employees = getEmployees();
    const index = employees.findIndex(e => e.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    employees[index] = { ...employees[index], ...validation.data, updatedAt: new Date().toISOString() };
    saveEmployees(employees);
    res.json({ success: true, data: employees[index] });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});"""
new_put_emp = """app.put('/api/v1/employees/:id', authenticateToken, authorize(['HR', 'Admin', 'Manager', 'Employee']), async (req: any, res: any) => {
  try {
    const employees = getEmployees();
    const index = employees.findIndex(e => e.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Employee not found' });

    if (req.user.role === 'Employee' && req.user.employeeId !== req.params.id) {
      return res.status(403).json({ error: 'You can only update your own profile' });
    }
    if (req.user.role === 'Employee') {
      const allowedFields = ['name', 'phone', 'personalEmail', 'currentAddress', 'city', 'country'];
      const filteredBody: any = {};
      for (const key of allowedFields) {
        if (req.body[key] !== undefined) filteredBody[key] = req.body[key];
      }
      employees[index] = { ...employees[index], ...filteredBody, updatedAt: new Date().toISOString() };
    } else {
      const validation = EmployeeSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.issues[0].message });
      }
      employees[index] = { ...employees[index], ...validation.data, updatedAt: new Date().toISOString() };
    }

    saveEmployees(employees);
    res.json({ success: true, data: employees[index] });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});"""
content = content.replace(old_put_emp, new_put_emp)

content = re.sub(
    r"app\.delete\('/api/v1/employees/:id', async \(req, res\) => \{",
    r"app.delete('/api/v1/employees/:id', authenticateToken, authorize(['Admin']), async (req: any, res: any) => {",
    content
)

# Attendance
old_get_att = """app.get('/api/v1/attendance', async (req, res) => {
  try {
    const { employeeId, startDate, endDate } = req.query;
    let records = getAttendance();
    if (employeeId) records = records.filter(r => r.employeeId === employeeId);
    if (startDate) records = records.filter(r => r.date >= startDate);
    if (endDate) records = records.filter(r => r.date <= endDate);
    res.json({ success: true, data: records, count: records.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});"""
new_get_att = """app.get('/api/v1/attendance', authenticateToken, authorize(['HR', 'Admin', 'Manager', 'Employee']), async (req: any, res: any) => {
  try {
    const { employeeId, startDate, endDate } = req.query as any;
    let records = getAttendance();
    
    if (req.user.role === 'Employee') {
      records = records.filter(r => r.employeeId === req.user.employeeId);
    } else if (employeeId) {
      records = records.filter(r => r.employeeId === employeeId);
    }
    if (startDate) records = records.filter(r => r.date >= startDate);
    if (endDate) records = records.filter(r => r.date <= endDate);
    res.json({ success: true, data: records, count: records.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});"""
content = content.replace(old_get_att, new_get_att)

old_post_att = """app.post('/api/v1/attendance', async (req, res) => {
  try {
    const records = getAttendance();
    const newRecord = {
      id: `ATT-${Date.now()}`,
      ...req.body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    records.push(newRecord);
    saveAttendance(records);
    res.status(201).json({ success: true, data: newRecord });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});"""
new_post_att = """app.post('/api/v1/attendance', authenticateToken, authorize(['HR', 'Admin', 'Manager', 'Employee']), async (req: any, res: any) => {
  try {
    if (req.user.role === 'Employee') {
      req.body.employeeId = req.user.employeeId;
    }
    const records = getAttendance();
    const newRecord = {
      id: \`ATT-\${Date.now()}\`,
      ...req.body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    records.push(newRecord);
    saveAttendance(records);
    res.status(201).json({ success: true, data: newRecord });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});"""
content = content.replace(old_post_att, new_post_att)

# Leaves
old_get_leaves = """app.get('/api/v1/leaves', async (req, res) => {
  try {
    const { employeeId, status } = req.query;
    let leaves = getLeaves();
    if (employeeId) leaves = leaves.filter(l => l.employeeId === employeeId);
    if (status) leaves = leaves.filter(l => l.status === status);
    res.json({ success: true, data: leaves, count: leaves.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});"""
new_get_leaves = """app.get('/api/v1/leaves', authenticateToken, authorize(['HR', 'Admin', 'Manager', 'Employee']), async (req: any, res: any) => {
  try {
    const { employeeId, status } = req.query as any;
    let leaves = getLeaves();
    
    if (req.user.role === 'Employee') {
      leaves = leaves.filter(l => l.employeeId === req.user.employeeId);
    } else if (employeeId) {
      leaves = leaves.filter(l => l.employeeId === employeeId);
    }
    if (status) leaves = leaves.filter(l => l.status === status);
    res.json({ success: true, data: leaves, count: leaves.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});"""
content = content.replace(old_get_leaves, new_get_leaves)

old_post_leaves = """app.post('/api/v1/leaves', async (req, res) => {
  try {
    const leaves = getLeaves();
    const newLeave = {
      id: `LV-${Date.now()}`,
      ...req.body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    leaves.push(newLeave);
    saveLeaves(leaves);
    res.status(201).json({ success: true, data: newLeave });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});"""
new_post_leaves = """app.post('/api/v1/leaves', authenticateToken, authorize(['HR', 'Admin', 'Manager', 'Employee']), async (req: any, res: any) => {
  try {
    if (req.user.role === 'Employee') {
      req.body.employeeId = req.user.employeeId;
      if(req.user.name) req.body.employeeName = req.user.name;
    }
    const leaves = getLeaves();
    const newLeave = {
      id: \`LV-\${Date.now()}\`,
      ...req.body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    leaves.push(newLeave);
    saveLeaves(leaves);
    res.status(201).json({ success: true, data: newLeave });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});"""
content = content.replace(old_post_leaves, new_post_leaves)

content = re.sub(
    r"app\.put\('/api/v1/leaves/:id/approve', async \(req, res\) => \{",
    r"app.put('/api/v1/leaves/:id/approve', authenticateToken, authorize(['HR', 'Admin', 'Manager']), async (req: any, res: any) => {",
    content
)

# Payroll
old_get_payroll = """app.get('/api/v1/payroll', async (req, res) => {
  try {
    const { employeeId, month } = req.query;
    let payroll = getPayroll();
    if (employeeId) payroll = payroll.filter(p => p.employeeId === employeeId);
    if (month) payroll = payroll.filter(p => p.month === month);
    res.json({ success: true, data: payroll, count: payroll.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});"""
new_get_payroll = """app.get('/api/v1/payroll', authenticateToken, authorize(['HR', 'Admin', 'Manager', 'Employee']), async (req: any, res: any) => {
  try {
    const { employeeId, month } = req.query as any;
    let payroll = getPayroll();
    
    if (req.user.role === 'Employee') {
      payroll = payroll.filter(p => p.employeeId === req.user.employeeId);
    } else if (req.user.role === 'Manager') {
      const team = getEmployees().filter(e => e.reportingManagerId === req.user.employeeId);
      const teamIds = team.map(e => e.id);
      payroll = payroll.filter(p => teamIds.includes(p.employeeId));
      if (employeeId) payroll = payroll.filter(p => p.employeeId === employeeId);
    } else if (employeeId) {
      payroll = payroll.filter(p => p.employeeId === employeeId);
    }
    if (month) payroll = payroll.filter(p => p.month === month);
    res.json({ success: true, data: payroll, count: payroll.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});"""
content = content.replace(old_get_payroll, new_get_payroll)

content = re.sub(
    r"app\.post\('/api/v1/payroll/run', async \(req, res\) => \{",
    r"app.post('/api/v1/payroll/run', authenticateToken, authorize(['HR', 'Admin']), async (req: any, res: any) => {",
    content
)

# Other endpoints
content = re.sub(
    r"app\.post\('/api/v1/api-keys/generate', \(req, res\) => \{",
    r"app.post('/api/v1/api-keys/generate', authenticateToken, authorize(['Admin']), (req: any, res: any) => {",
    content
)
content = re.sub(
    r"app\.get\('/api/v1/api-keys', \(req, res\) => \{",
    r"app.get('/api/v1/api-keys', authenticateToken, authorize(['Admin']), (req: any, res: any) => {",
    content
)
content = re.sub(
    r"app\.delete\('/api/v1/api-keys/:key', \(req, res\) => \{",
    r"app.delete('/api/v1/api-keys/:key', authenticateToken, authorize(['Admin']), (req: any, res: any) => {",
    content
)

with open('server.ts', 'w') as f:
    f.write(content)
print("Routes patched.")
