import re

with open("src/components/Sidebar.tsx", "r") as f:
    content = f.read()

content = content.replace(
    "{ id: 'recruitment', label: 'Recruitment Pipeline', icon: UserPlus },",
    "{ id: 'recruitment', label: 'Recruitment Pipeline', icon: UserPlus },\n    { id: 'jd_matching', label: 'JD Semantic Matching', icon: Search },"
)

with open("src/components/Sidebar.tsx", "w") as f:
    f.write(content)
