import re

with open("src/components/Sidebar.tsx", "r") as f:
    content = f.read()

content = content.replace(
    "import { Activity, LayoutDashboard, Users, Clock, CreditCard, UserPlus, Sliders, Settings, Database, ServerCrash, Calendar, GitBranch, ClipboardList, Building, Briefcase, FileText } from 'lucide-react';",
    "import { Activity, LayoutDashboard, Users, Clock, CreditCard, UserPlus, Sliders, Settings, Database, ServerCrash, Calendar, GitBranch, ClipboardList, Building, Briefcase, FileText, Search } from 'lucide-react';"
)

with open("src/components/Sidebar.tsx", "w") as f:
    f.write(content)
