import re

with open("src/components/Sidebar.tsx", "r") as f:
    content = f.read()

content = content.replace(
    "import { Users, UserPlus, CreditCard, Calendar, BarChart2, Briefcase, ChevronLeft, ChevronRight, FileText, ClipboardList, Activity, Settings, LayoutDashboard, Sliders } from 'lucide-react';",
    "import { Users, UserPlus, CreditCard, Calendar, BarChart2, Briefcase, ChevronLeft, ChevronRight, FileText, ClipboardList, Activity, Settings, LayoutDashboard, Sliders, Search } from 'lucide-react';"
)

with open("src/components/Sidebar.tsx", "w") as f:
    f.write(content)
