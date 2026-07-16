import re

with open("src/App.tsx", "r") as f:
    content = f.read()

app_dash_old = "{activeTab === 'dashboard' && <Dashboard "
app_dash_new = "{activeTab === 'dashboard' && <Dashboard jobDescriptions={jobDescriptions} "

content = content.replace(app_dash_old, app_dash_new)

with open("src/App.tsx", "w") as f:
    f.write(content)
