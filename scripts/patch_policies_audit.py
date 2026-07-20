import re

with open("src/components/CompanyPolicies.tsx", "r") as f:
    content = f.read()

# Add AuditTrailRules to import
content = content.replace("StatusManagementRules } from '../types';", "StatusManagementRules, AuditTrailRules } from '../types';")

# Add Shield icon
content = content.replace("Sliders, Clock, Coins, UserPlus, Building, Save, Activity", "Sliders, Clock, Coins, UserPlus, Building, Save, Activity, Shield")

# Add state
state_audit = """
  // Audit Trail Rules
  const [enableAuditTrail, setEnableAuditTrail] = useState(settings.auditTrailRules?.enableAuditTrail ?? true);
  const [requireReasonHighImpact, setRequireReasonHighImpact] = useState(settings.auditTrailRules?.requireReasonHighImpact ?? true);
  const [retentionPeriod, setRetentionPeriod] = useState(settings.auditTrailRules?.retentionPeriod ?? '7 years');
"""
content = content.replace("  // Toast / Status state", state_audit + "\n  // Toast / Status state")

content = content.replace("status: true", "status: true,\n    audit: true")

rules_obj = """
    const auditTrailRules: AuditTrailRules = {
      enableAuditTrail,
      trackAllFields: true,
      trackedFields: [],
      requireReason: false,
      requireReasonHighImpact,
      retentionPeriod
    };
"""
content = content.replace("    const statusRules: StatusManagementRules = {", rules_obj + "\n    const statusRules: StatusManagementRules = {")

settings_obj = """    const updatedSettings: AppSettings = {
      ...settings,
      attendanceRules,
      payrollRules,
      recruitmentRules,
      companySettings,
      statusRules,
      auditTrailRules
    };"""
content = content.replace("    const updatedSettings: AppSettings = {\n      ...settings,\n      attendanceRules,\n      payrollRules,\n      recruitmentRules,\n      companySettings,\n      statusRules\n    };", settings_obj)

section_audit = """
        {/* SECTION 6: Audit Trail Rules */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden" id="section-audit">
          <button
            type="button"
            onClick={() => toggleSection('audit' as any)}
            className="w-full px-6 py-4 flex items-center justify-between bg-slate-50 hover:bg-slate-100/60 border-b border-slate-100 transition-all text-left"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 font-display">Audit Trail & Compliance</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Manage data retention, history tracking, and compliance logs.</p>
              </div>
            </div>
            <div className="text-slate-400">
              {(expanded as any).audit ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </div>
          </button>
          
          {(expanded as any).audit && (
            <div className="p-6 space-y-6 animate-fade-in bg-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                
                <div className="flex items-start justify-between gap-4 p-4 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">Enable Audit Trail</h4>
                    <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">Track and log all changes to employee records, including old and new values.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input type="checkbox" className="sr-only peer" checked={enableAuditTrail} onChange={(e) => setEnableAuditTrail(e.target.checked)} />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                <div className="flex items-start justify-between gap-4 p-4 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">Require Reason for High Impact</h4>
                    <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">Require administrators to provide a reason when modifying Salary, Status, Manager, or Designation.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input type="checkbox" className="sr-only peer" checked={requireReasonHighImpact} onChange={(e) => setRequireReasonHighImpact(e.target.checked)} />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                <div className="flex items-start justify-between gap-4 p-4 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">Retention Period</h4>
                    <p className="text-[10px] text-slate-500 mt-1 leading-relaxed mb-2">Duration for which audit logs are kept before they can be archived.</p>
                    <select
                      value={retentionPeriod}
                      onChange={(e) => setRetentionPeriod(e.target.value)}
                      className="w-full h-10 px-3 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 rounded-xl text-sm font-medium"
                    >
                      <option value="1 year">1 year</option>
                      <option value="3 years">3 years</option>
                      <option value="5 years">5 years</option>
                      <option value="7 years">7 years (Recommended)</option>
                      <option value="10 years">10 years</option>
                      <option value="Forever">Forever</option>
                    </select>
                  </div>
                </div>

              </div>
            </div>
          )}
        </div>
"""

content = content.replace("      </form>", section_audit + "\n      </form>")

with open("src/components/CompanyPolicies.tsx", "w") as f:
    f.write(content)
