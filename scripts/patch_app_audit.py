import re

with open("src/App.tsx", "r") as f:
    content = f.read()

content = content.replace("import Departments from './components/Departments';", "import Departments from './components/Departments';\nimport AuditTrail from './components/AuditTrail';")

render_audit = """      {activeTab === 'departments' && <Departments departments={departments} setDepartments={setDepartments} />}
      {activeTab === 'audit_trail' && <AuditTrail />}"""

content = content.replace("      {activeTab === 'departments' && <Departments departments={departments} setDepartments={setDepartments} />}", render_audit)

with open("src/App.tsx", "w") as f:
    f.write(content)

with open("src/components/Sidebar.tsx", "r") as f:
    sidebar = f.read()

audit_nav = """        <NavItem icon={<FileText className="w-4 h-4" />} label="Documents" isActive={activeTab === 'documents'} onClick={() => setActiveTab('documents')} />
        <NavItem icon={<Activity className="w-4 h-4" />} label="Audit Trail" isActive={activeTab === 'audit_trail'} onClick={() => setActiveTab('audit_trail')} />"""

sidebar = sidebar.replace("        <NavItem icon={<FileText className=\"w-4 h-4\" />} label=\"Documents\" isActive={activeTab === 'documents'} onClick={() => setActiveTab('documents')} />", audit_nav)

with open("src/components/Sidebar.tsx", "w") as f:
    f.write(sidebar)
