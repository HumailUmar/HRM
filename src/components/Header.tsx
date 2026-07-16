import { useState, useRef, useEffect } from 'react';
import { Search, Bell, Sparkles, User, LogOut, CheckCircle, Clock, Cpu, RefreshCw } from 'lucide-react';

interface HeaderProps {
  user: any;
  onSignOut: () => void;
  onSignIn: () => void;
  isMockMode: boolean;
  onSync: () => void;
}

export default function Header({ user, onSignOut, onSignIn, isMockMode, onSync }: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, text: "AI Resume Parser loaded 2 new candidates.", time: "5m ago", read: false, type: 'ai' },
    { id: 2, text: "David Miller completed 'Welcome Onboarding' checklist.", time: "1h ago", read: false, type: 'info' },
    { id: 3, text: "July 2026 Salary sheet calculations processed.", time: "3h ago", read: true, type: 'success' },
    { id: 4, text: "Biometric attendance sync registered 5 logs.", time: "1d ago", read: true, type: 'biometric' },
  ]);

  const [searchFocused, setSearchFocused] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  return (
    <header className="flex items-center justify-between bg-white/70 backdrop-blur-md border border-slate-200/50 rounded-2xl px-6 py-4 mb-8 shadow-sm transition-all duration-300 relative z-20">
      
      {/* Search Bar with cmd focus helper */}
      <div className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border transition-all duration-300 w-full max-w-sm bg-slate-50/50 ${
        searchFocused ? 'ring-2 ring-violet-500/20 border-violet-500/60 bg-white' : 'border-slate-200/80 hover:border-slate-300'
      }`}>
        <Search className={`w-4 h-4 transition-colors duration-200 ${searchFocused ? 'text-violet-600' : 'text-slate-400'}`} />
        <input 
          type="text" 
          placeholder="Search HRM files, staff or skills... (Ctrl + K)" 
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          className="bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-none w-full font-medium"
        />
        <span className="text-[9px] font-bold font-mono text-slate-400 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded shadow-sm">⌘K</span>
      </div>

      {/* Right Controls Area */}
      <div className="flex items-center gap-4">
        
        {/* Workspace Quick Mode Indicator */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-violet-500/10 to-rose-500/10 border border-violet-100 rounded-xl">
          <Sparkles className="w-3.5 h-3.5 text-violet-600 animate-pulse" />
          <span className="text-[10px] font-extrabold uppercase bg-gradient-to-r from-violet-600 to-rose-500 bg-clip-text text-transparent font-display">Premium Active</span>
        </div>

        {/* Sync Button */}
        <button 
          onClick={onSync}
          className="w-10 h-10 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/60 flex items-center justify-center transition-all duration-200 text-slate-600 hover:scale-105"
          aria-label="Sync Data"
          title="Sync Data"
        >
          <RefreshCw className="w-[18px] h-[18px]" />
        </button>

        {/* Notification Bell */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-10 h-10 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/60 flex items-center justify-center transition-all duration-200 text-slate-600 relative hover:scale-105"
            aria-label="Notifications"
          >
            <Bell className="w-[18px] h-[18px]" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
              </span>
            )}
          </button>

          {/* Floating Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-2xl p-4 animate-scale-in z-50">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-display">Live Notifications</h4>
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllAsRead}
                    className="text-[10px] font-bold text-violet-600 hover:text-violet-800 transition-colors"
                  >
                    Mark read
                  </button>
                )}
              </div>
              <div className="space-y-2.5 max-h-64 overflow-y-auto">
                {notifications.map((n) => (
                  <div 
                    key={n.id} 
                    className={`p-2.5 rounded-xl border transition-all text-xs flex items-start gap-2.5 ${
                      n.read ? 'bg-slate-50/50 border-transparent text-slate-500' : 'bg-violet-50/20 border-violet-100/50 text-slate-700 font-medium'
                    }`}
                  >
                    {n.type === 'ai' && <Cpu className="w-3.5 h-3.5 text-violet-600 mt-0.5 shrink-0" />}
                    {n.type === 'info' && <Clock className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" />}
                    {n.type === 'success' && <CheckCircle className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />}
                    {n.type === 'biometric' && <Sparkles className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />}
                    <div className="flex-1 space-y-0.5 min-w-0">
                      <p className="leading-relaxed break-words">{n.text}</p>
                      <span className="text-[9px] font-mono opacity-60 block">{n.time}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-slate-100 pt-2.5 mt-3 text-center">
                <span className="text-[10px] text-slate-400 font-sans">Syncing with HumailEli Cloud Engine</span>
              </div>
            </div>
          )}
        </div>

        {/* User Account Menu / Avatar */}
        <div className="flex items-center gap-2.5 border-l border-slate-200 pl-4">
          {user ? (
            <div className="flex items-center gap-2.5">
              <div className="text-right hidden sm:block">
                <div className="flex items-center justify-end gap-2 mb-1">
                  <p className="text-xs font-bold text-slate-800 leading-none">{user.displayName || 'Authorized User'}</p>
                  {user.role ? (
                    <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                      user.role === 'Admin' ? 'bg-red-100 text-red-800' :
                      user.role === 'HR' ? 'bg-purple-100 text-purple-800' :
                      user.role === 'Manager' ? 'bg-green-100 text-green-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      👤 {user.role}
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-800">
                      ⚠️ No role
                    </span>
                  )}
                </div>
                <p className="text-[10px] font-mono text-slate-400">{user.email || 'hmufk1@gmail.com'}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-rose-500 text-white flex items-center justify-center font-bold tracking-wider font-display shadow-lg shadow-purple-500/10 cursor-pointer relative group">
                {user.displayName?.charAt(0) || user.email?.charAt(0).toUpperCase() || 'U'}
                <div onClick={onSignOut} className="absolute inset-0 bg-black/80 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200" title="Log Out">
                  <LogOut className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>
          ) : (
            <button 
              onClick={onSignIn}
              className="flex items-center gap-1.5 h-10 px-4 bg-gradient-to-r from-violet-600 to-rose-500 hover:from-violet-700 hover:to-rose-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-violet-600/15"
            >
              <User className="w-3.5 h-3.5" />
              Sign In
            </button>
          )}
        </div>

      </div>

    </header>
  );
}
