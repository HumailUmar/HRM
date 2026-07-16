import { Activity, LayoutDashboard, Users, Clock, CreditCard, UserPlus, Sliders, Settings, Calendar, GitBranch, ClipboardList, Building, Briefcase, FileText, Target, ChevronDown, ChevronRight, User, GraduationCap } from 'lucide-react';
import { AppSettings } from '../types';
import { useState, useEffect } from 'react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  settings: AppSettings;
  user?: any;
}

const navigation = {
  admin: [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, children: [] },
    { id: 'employees', label: 'Employee Management', icon: Users, children: [
      { id: 'employees', label: 'All Employees' },
      { id: 'departments', label: 'Departments' },
      { id: 'designations', label: 'Designations' },
      { id: 'onboarding-templates', label: 'Onboarding Templates' }
    ]},
    { id: 'attendance', label: 'Attendance & Leave', icon: Clock, children: [
      { id: 'attendance', label: 'Attendance' },
      { id: 'leaves', label: 'Leave Management' },
      { id: 'my-leave', label: 'My Leave' },
      { id: 'shift-management', label: 'Shift Management' }
    ]},
    { id: 'payroll', label: 'Payroll', icon: CreditCard, children: [
      { id: 'payroll', label: 'Payroll Engine' }
    ]},
    { id: 'recruitment', label: 'Recruitment', icon: UserPlus, children: [
      { id: 'recruitment', label: 'Pipeline' }
    ]},
    { id: 'talent', label: 'Talent & Performance', icon: Target, children: [
      { id: 'performance', label: 'Performance Reviews' },
      { id: 'succession', label: 'Succession Planning' }
    ]},
    { id: 'training', label: 'Training Management', icon: GraduationCap, children: [
      { id: 'training', label: 'All Training' },
      { id: 'training-requests', label: 'Training Requests' },
      { id: 'training-mentor', label: 'Mentor Dashboard' },
      { id: 'training-analytics', label: 'Analytics' }
    ]},
    { id: 'documents', label: 'Documents & Policies', icon: FileText, children: [
      { id: 'documents', label: 'Employee Documents' },
      { id: 'policies', label: 'Company Policies' },
      { id: 'importer', label: 'Data Importer' }
    ]},
    { id: 'system', label: 'System', icon: Settings, children: [
      { id: 'settings', label: 'Settings' },
      { id: 'exit-management', label: 'Exit Management' },
      { id: 'audit_trail', label: 'Audit Trail' },
      { id: 'system-test', label: 'System Test' }
    ]}
  ],
  manager: [
    { id: 'manager-portal', label: 'Manager Dashboard', icon: LayoutDashboard, children: [] },
    { id: 'my-profile', label: 'My Profile', icon: User, children: [
      { id: 'my-leave', label: 'My Leave' }
    ]},
    // ===== NEW MANAGER MENU ITEMS =====
    { id: 'team-members', label: 'Team Members', icon: Users, children: [] },
    { id: 'team-onboarding', label: 'Team Onboarding', icon: ClipboardList, children: [] },
    { id: 'team-attendance', label: 'Team Attendance', icon: Clock, children: [] },
    { id: 'leave-approvals', label: 'Leave Approvals', icon: Calendar, children: [] },
    { id: 'team-performance', label: 'Team Performance', icon: Target, children: [] },
    { id: 'training', label: 'Training Management', icon: GraduationCap, children: [
      { id: 'training', label: 'My Trainings' },
      { id: 'training-requests', label: 'Training Requests' },
      { id: 'training-mentor', label: 'Mentor Dashboard' }
    ]}
  ],
  employee: [
    { id: 'employee-portal', label: 'My Dashboard', icon: LayoutDashboard, children: [] },
    { id: 'my-profile', label: 'My Profile', icon: User, children: [
      { id: 'my-leave', label: 'My Leave' }
    ]},
    // ===== NEW EMPLOYEE MENU ITEMS =====
    { id: 'my-attendance', label: 'My Attendance', icon: Clock, children: [] },
    { id: 'my-payslips', label: 'My Payslips', icon: FileText, children: [] },
    { id: 'my-onboarding', label: 'My Onboarding', icon: ClipboardList, children: [] },
    { id: 'my-performance', label: 'My Performance', icon: Target, children: [] },
    { id: 'training', label: 'Training Management', icon: GraduationCap, children: [
      { id: 'training', label: 'My Trainings' },
      { id: 'training-requests', label: 'Training Requests' },
      { id: 'training-mentor', label: 'Mentor Dashboard' }
    ]}
  ]
};

export default function Sidebar({ activeTab, setActiveTab, settings, user }: SidebarProps) {
  const role = (user?.role || 'Employee').toLowerCase();
  const navItems = navigation[role as keyof typeof navigation] || navigation.employee;
  
  const [openParents, setOpenParents] = useState<string[]>(() => {
    const saved = localStorage.getItem('sidebarOpenParents');
    return saved ? JSON.parse(saved) : navItems.map(n => n.id);
  });

  useEffect(() => {
    localStorage.setItem('sidebarOpenParents', JSON.stringify(openParents));
  }, [openParents]);

  const toggleParent = (id: string) => {
    setOpenParents(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  return (
    <aside className="w-64 bg-[#0f0f1e] text-slate-100 flex flex-col border-r border-slate-800/50 h-screen sticky top-0 font-sans z-30">
      <div className="py-6 border-b border-slate-800/40 bg-[#0c0c19]">
        <div className="flex items-center gap-2 px-6">
          <div className="w-8 flex items-center justify-start">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 via-purple-600 to-rose-500 flex items-center justify-center font-display text-base font-bold tracking-wider text-white shadow-lg shadow-purple-500/20">
              HE
            </div>
          </div>
          <div className="flex-1 text-left">
            <h1 className="text-md font-bold tracking-tight text-white font-display leading-none">Humail Eli</h1>
            <p className="text-[10px] bg-gradient-to-r from-violet-400 to-rose-400 bg-clip-text text-transparent font-mono tracking-wider font-extrabold uppercase mt-1.5 leading-none">HRM SaaS Engine</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isOpen = openParents.includes(item.id);
          const hasChildren = item.children.length > 0;
          
          if (!hasChildren) {
             const isActive = activeTab === item.id;
             return (
               <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center text-left gap-2 px-2 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                    isActive
                      ? 'bg-gradient-to-r from-violet-600 to-rose-500 text-white shadow-md shadow-violet-600/30'
                      : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="flex-1">{item.label}</span>
                </button>
             );
          }

          return (
            <div key={item.id} className="space-y-1">
              <button
                onClick={() => toggleParent(item.id)}
                className="w-full flex items-center text-left gap-2 px-2 py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-300 hover:bg-slate-800/40 hover:text-white transition-all"
              >
                <Icon className="w-4 h-4 text-violet-400" />
                <span className="flex-1">{item.label}</span>
                {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
              
              {isOpen && (
                <div className="pl-6 space-y-1">
                  {item.children.map(child => {
                     const isActive = activeTab === child.id;
                     return (
                      <button
                        key={child.id}
                        onClick={() => setActiveTab(child.id)}
                        className={`w-full text-left px-2 py-2 rounded-lg text-[11px] font-medium tracking-wide transition-all ${
                          isActive
                            ? 'bg-gradient-to-r from-slate-800/80 to-slate-800/40 text-white border-l-2 border-violet-500'
                            : 'text-slate-500 hover:text-slate-200 hover:bg-slate-800/30'
                        }`}
                      >
                        {child.label}
                      </button>
                     );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
