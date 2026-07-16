with open('src/App.tsx', 'r') as f:
    content = f.read()
content = content.replace("{activeTab === 'employees' && (\\n              canAccess('employees', user?.role) ? (", "{activeTab === 'employees' && (\n              canAccess('employees', user?.role) ? (")
with open('src/App.tsx', 'w') as f:
    f.write(content)
