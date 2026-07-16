import re

with open("src/components/CompanyPolicies.tsx", "r") as f:
    content = f.read()

# Add to AppSettings import
content = content.replace("import { AppSettings, AttendanceRules, PayrollRules, RecruitmentRules, CompanySettings } from '../types';", "import { AppSettings, AttendanceRules, PayrollRules, RecruitmentRules, CompanySettings, StatusManagementRules } from '../types';")

# Icons
content = content.replace("Sliders, Clock, Coins, UserPlus, Building, Save,", "Sliders, Clock, Coins, UserPlus, Building, Save, Activity,")

# State
content = content.replace("    company: true\n  });", "    company: true,\n    status: true\n  });")

# Status Rules State
state = """
  // Status Management Rules
  const [enableStatusManagement, setEnableStatusManagement] = useState(settings.statusRules?.enableStatusManagement ?? true);
  const [autoExpireOnLeave, setAutoExpireOnLeave] = useState(settings.statusRules?.autoExpireOnLeave ?? false);
  const [autoExpireProbation, setAutoExpireProbation] = useState(settings.statusRules?.autoExpireProbation ?? true);
  const [autoResignToTerminated, setAutoResignToTerminated] = useState(settings.statusRules?.autoResignToTerminated ?? true);
  const [enableBulkStatusUpdate, setEnableBulkStatusUpdate] = useState(settings.statusRules?.enableBulkStatusUpdate ?? true);
  const [allowRehireTerminated, setAllowRehireTerminated] = useState(settings.statusRules?.allowRehireTerminated ?? false);
"""
content = content.replace("  // Toast / Status state", state + "\n  // Toast / Status state")

# Handle Save
rules_obj = """
    const statusRules: StatusManagementRules = {
      enableStatusManagement,
      autoExpireOnLeave,
      autoExpireProbation,
      autoResignToTerminated,
      enableBulkStatusUpdate,
      allowRehireTerminated
    };
"""
content = content.replace("    const companySettings: CompanySettings = {", rules_obj + "\n    const companySettings: CompanySettings = {")

settings_obj = """    const updatedSettings: AppSettings = {
      ...settings,
      attendanceRules,
      payrollRules,
      recruitmentRules,
      companySettings,
      statusRules
    };"""
content = content.replace("    const updatedSettings: AppSettings = {\n      ...settings,\n      attendanceRules,\n      payrollRules,\n      recruitmentRules,\n      companySettings\n    };", settings_obj)

# Section UI
section_ui = """
        {/* SECTION 5: Status Management Rules */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden" id="section-status">
          <button
            type="button"
            onClick={() => toggleSection('status')}
            className="w-full px-6 py-4 flex items-center justify-between bg-slate-50 hover:bg-slate-100/60 border-b border-slate-100 transition-all text-left"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-100 text-rose-600 rounded-lg">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 font-display">Status Management Rules</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Automations and transitions for employee lifecycle.</p>
              </div>
            </div>
            <div className="text-slate-400">
              {expanded.status ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </div>
          </button>
          
          {expanded.status && (
            <div className="p-6 space-y-6 animate-fade-in bg-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                
                {/* Rule: Enable Status Management */}
                <div className="flex items-start justify-between gap-4 p-4 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">Enable Status Management</h4>
                    <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">Activate extended employee status lifecycle tracking (On Leave, Suspended, Probation, etc.).</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input type="checkbox" className="sr-only peer" checked={enableStatusManagement} onChange={(e) => setEnableStatusManagement(e.target.checked)} />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-violet-600"></div>
                  </label>
                </div>

                {/* Rule: Auto-Expire On Leave */}
                <div className="flex items-start justify-between gap-4 p-4 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">Auto-Expire On Leave</h4>
                    <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">Automatically change status from "On Leave" to "Active" after leave end date.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input type="checkbox" className="sr-only peer" checked={autoExpireOnLeave} onChange={(e) => setAutoExpireOnLeave(e.target.checked)} />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-violet-600"></div>
                  </label>
                </div>
                
                {/* Rule: Auto-Expire Probation */}
                <div className="flex items-start justify-between gap-4 p-4 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">Auto-Expire Probation</h4>
                    <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">Automatically change status from "Probation" to "Active" after probation end date.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input type="checkbox" className="sr-only peer" checked={autoExpireProbation} onChange={(e) => setAutoExpireProbation(e.target.checked)} />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-violet-600"></div>
                  </label>
                </div>
                
                {/* Rule: Auto-Resign to Terminated */}
                <div className="flex items-start justify-between gap-4 p-4 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">Auto-Resign to Terminated</h4>
                    <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">Automatically change status from "Resigned" to "Terminated" after last working date.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input type="checkbox" className="sr-only peer" checked={autoResignToTerminated} onChange={(e) => setAutoResignToTerminated(e.target.checked)} />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-violet-600"></div>
                  </label>
                </div>
                
                {/* Rule: Enable Bulk Status Update */}
                <div className="flex items-start justify-between gap-4 p-4 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">Enable Bulk Status Update</h4>
                    <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">Allow HR administrators to update multiple employee statuses simultaneously.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input type="checkbox" className="sr-only peer" checked={enableBulkStatusUpdate} onChange={(e) => setEnableBulkStatusUpdate(e.target.checked)} />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-violet-600"></div>
                  </label>
                </div>
                
                {/* Rule: Allow Re-hire of Terminated */}
                <div className="flex items-start justify-between gap-4 p-4 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">Allow Re-hire of Terminated</h4>
                    <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">Permit re-hiring of employees who have been previously terminated or retired.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input type="checkbox" className="sr-only peer" checked={allowRehireTerminated} onChange={(e) => setAllowRehireTerminated(e.target.checked)} />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-violet-600"></div>
                  </label>
                </div>

              </div>
            </div>
          )}
        </div>
"""

content = content.replace("      </form>", section_ui + "\n      </form>")

with open("src/components/CompanyPolicies.tsx", "w") as f:
    f.write(content)
