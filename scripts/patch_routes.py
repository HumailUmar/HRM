import re

with open("src/App.tsx", "r") as f:
    content = f.read()

if "import JDMatching from './components/JDMatching';" not in content:
    content = content.replace("import Recruitment from './components/Recruitment';", "import Recruitment from './components/Recruitment';\nimport JDMatching from './components/JDMatching';")
    content = content.replace("case 'settings':", "case 'jd-matching':\n        return <JDMatching />;\n      case 'settings':")
    with open("src/App.tsx", "w") as f:
        f.write(content)

with open("src/components/Sidebar.tsx", "r") as f:
    content = f.read()

if "'jd-matching'" not in content:
    content = content.replace(
        "id: 'recruitment', label: 'Recruitment', icon: Users, color: 'text-rose-600', bgColor: 'bg-rose-100' },",
        "id: 'recruitment', label: 'Recruitment', icon: Users, color: 'text-rose-600', bgColor: 'bg-rose-100' },\n  { id: 'jd-matching', label: 'JD Matching', icon: FileText, color: 'text-indigo-600', bgColor: 'bg-indigo-100' },"
    )
    with open("src/components/Sidebar.tsx", "w") as f:
        f.write(content)
