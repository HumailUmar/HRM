import re

with open("src/components/Sidebar.tsx", "r") as f:
    content = f.read()

# Replace Brand Logo section
brand_logo_old = """      <div className="p-6 border-b border-slate-800/40 bg-[#0c0c19]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 via-purple-600 to-rose-500 flex items-center justify-center font-display text-lg font-bold tracking-wider text-white shadow-lg shadow-purple-500/20">
            HE
          </div>
          <div>
            <h1 className="text-md font-bold tracking-tight text-white font-display">Humail Eli</h1>
            <p className="text-[10px] bg-gradient-to-r from-violet-400 to-rose-400 bg-clip-text text-transparent font-mono tracking-wider font-extrabold uppercase">HRM SaaS Engine</p>
          </div>
        </div>
      </div>"""

brand_logo_new = """      <div className="py-6 border-b border-slate-800/40 bg-[#0c0c19]">
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
      </div>"""
content = content.replace(brand_logo_old, brand_logo_new)

# Replace Mode Status Banner
mode_status_old = """      <div className="px-6 py-3 border-b border-slate-800/40 bg-[#0d0d1a]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${settings.isMockMode ? 'bg-amber-400' : 'bg-emerald-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${settings.isMockMode ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
            </span>
            <span className="text-xs font-semibold text-slate-300">
              {settings.isMockMode ? 'Sandbox Simulator' : 'GSheet Connected'}
            </span>
          </div>
          {settings.isMockMode && (
            <span className="text-[9px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded font-mono border border-amber-500/20 font-bold">
              OFFLINE
            </span>
          )}
        </div>
      </div>"""

mode_status_new = """      <div className="py-3 border-b border-slate-800/40 bg-[#0d0d1a]">
        <div className="flex items-center justify-between px-6">
          <div className="flex items-center gap-2 flex-1">
            <div className="w-8 flex items-center justify-start">
              <span className="relative flex h-2.5 w-2.5">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${settings.isMockMode ? 'bg-amber-400' : 'bg-emerald-400'}`}></span>
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${settings.isMockMode ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
              </span>
            </div>
            <div className="flex-1 text-left">
              <span className="text-xs font-semibold text-slate-300">
                {settings.isMockMode ? 'Sandbox Simulator' : 'GSheet Connected'}
              </span>
            </div>
          </div>
          {settings.isMockMode && (
            <span className="text-[9px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded font-mono border border-amber-500/20 font-bold ml-2">
              OFFLINE
            </span>
          )}
        </div>
      </div>"""
content = content.replace(mode_status_old, mode_status_new)

# Replace Navigation Links
nav_old = """      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-start text-left gap-3.5 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 group relative ${
                isActive
                  ? 'bg-gradient-to-r from-violet-600 to-rose-500 text-white font-extrabold shadow-md shadow-violet-600/30 -translate-y-0.5 scale-[1.02] origin-left'
                  : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200 hover:-translate-y-0.5'
              }`}
            >
              <Icon className={`w-4 h-4 transition-transform duration-300 ${
                isActive ? 'scale-110 text-white' : 'text-slate-400 group-hover:scale-110 group-hover:text-slate-200'
              }`} />
              <span className="flex-1 text-left">{item.label}</span>
              {isActive && (
                <span className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-white rounded-r-md animate-pulse" />
              )}
            </button>
          );
        })}
      </nav>"""

nav_new = """      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center text-left gap-2 px-2 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 group relative ${
                isActive
                  ? 'bg-gradient-to-r from-violet-600 to-rose-500 text-white font-extrabold shadow-md shadow-violet-600/30'
                  : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
              }`}
            >
              <div className="w-8 flex items-center justify-start">
                <Icon className={`w-4 h-4 transition-transform duration-300 origin-left ${
                  isActive ? 'scale-110 text-white' : 'text-slate-400 group-hover:scale-110 group-hover:text-slate-200'
                }`} />
              </div>
              <span className="flex-1 text-left">{item.label}</span>
              {isActive && (
                <span className="absolute -left-4 top-1/4 bottom-1/4 w-1 bg-white rounded-r-md animate-pulse" />
              )}
            </button>
          );
        })}
      </nav>"""
content = content.replace(nav_old, nav_new)

# Replace Footer
footer_old = """      <div className="p-4 border-t border-slate-800/40 bg-[#0c0c19]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-slate-800/40 border border-slate-700/30 flex items-center justify-center">
            <Database className="w-4 h-4 text-slate-400" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Database Mode</p>
            <p className="text-[11px] font-semibold text-rose-400 font-mono truncate">
              {settings.isMockMode ? 'Simulated Schema' : 'Google Sheets Sync'}
            </p>
          </div>
        </div>
      </div>"""

footer_new = """      <div className="py-4 border-t border-slate-800/40 bg-[#0c0c19]">
        <div className="flex items-center gap-2 px-6">
          <div className="w-8 flex items-center justify-start">
            <div className="w-8 h-8 rounded-lg bg-slate-800/40 border border-slate-700/30 flex items-center justify-center">
              <Database className="w-4 h-4 text-slate-400" />
            </div>
          </div>
          <div className="flex-1 text-left min-w-0">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Database Mode</p>
            <p className="text-[11px] font-semibold text-rose-400 font-mono truncate">
              {settings.isMockMode ? 'Simulated Schema' : 'Google Sheets Sync'}
            </p>
          </div>
        </div>
      </div>"""
content = content.replace(footer_old, footer_new)

with open("src/components/Sidebar.tsx", "w") as f:
    f.write(content)

