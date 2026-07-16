import { useState, FormEvent } from 'react';
import { AppSettings, AttendanceRules, PayrollRules, RecruitmentRules, CompanySettings, StatusManagementRules, AuditTrailRules } from '../types';
import { 
  Sliders, Clock, Coins, UserPlus, Building, Save, Activity, Shield, 
  ChevronDown, ChevronUp, Calendar, Plus, Trash2, CheckCircle2, MessageCircle
} from 'lucide-react';

interface CompanyPoliciesProps {
  settings: AppSettings;
  setSettings: (settings: AppSettings) => void;
}

export default function CompanyPolicies({ settings, setSettings }: CompanyPoliciesProps) {
  // Collapse/Expand state
  const [expanded, setExpanded] = useState({
    attendance: true,
    payroll: true,
    recruitment: true,
    whatsappTemplates: false, // New
    leavePolicies: false,
    company: true,
    status: true,
    audit: true
  });

  // Local Form States
  // Attendance Rules
  const [lateThreshold, setLateThreshold] = useState(settings.attendanceRules?.lateThreshold || "09:05");
  const [earlyDepartureThreshold, setEarlyDepartureThreshold] = useState(settings.attendanceRules?.earlyDepartureThreshold || "17:55");
  const [halfDayHours, setHalfDayHours] = useState(settings.attendanceRules?.halfDayHours ?? 4);
  const [fullDayHours, setFullDayHours] = useState(settings.attendanceRules?.fullDayHours ?? 8);
  const [gracePeriodMinutes, setGracePeriodMinutes] = useState(settings.attendanceRules?.gracePeriodMinutes ?? 5);

  // Payroll Rules
  const [perfectAttendanceBonus, setPerfectAttendanceBonus] = useState(settings.payrollRules?.perfectAttendanceBonus ?? 150);
  const [latePenalty, setLatePenalty] = useState(settings.payrollRules?.latePenalty ?? 5);
  const [halfDayDeduction, setHalfDayDeduction] = useState(settings.payrollRules?.halfDayDeduction ?? 50);
  const [absentPenalty, setAbsentPenalty] = useState(settings.payrollRules?.absentPenalty ?? 100);
  const [overtimeRate, setOvertimeRate] = useState(settings.payrollRules?.overtimeRate ?? 1.5);
  const [taxRate, setTaxRate] = useState(settings.payrollRules?.taxRate ?? 10);
  const [socialSecurityRate, setSocialSecurityRate] = useState(settings.payrollRules?.socialSecurityRate ?? 5);
  const [healthInsuranceDeduction, setHealthInsuranceDeduction] = useState(settings.payrollRules?.healthInsuranceDeduction ?? 50);

  // Recruitment Rules
  const [minExperienceYears, setMinExperienceYears] = useState(settings.recruitmentRules?.minExperienceYears ?? 3);
  const [minScreeningScore, setMinScreeningScore] = useState(settings.recruitmentRules?.minScreeningScore ?? 70);
  const [screeningQuestionsCount, setScreeningQuestionsCount] = useState(settings.recruitmentRules?.screeningQuestionsCount ?? 10);
  const [whatsAppMessageTemplate, setWhatsAppMessageTemplate] = useState(
    settings.recruitmentRules?.whatsAppMessageTemplate || 
    "Dear {name},\n\nCongratulations! Based on your AI screening results, you have been selected for the next round.\n\nInterview Date: {date}\nInterview Time: {time}\nInterviewer: {interviewer}\n\nPlease confirm your availability.\n\nBest regards,\n{company_name} HR Team"
  );

  // Company Settings
  const [companyName, setCompanyName] = useState(settings.companySettings?.companyName || "Humail Eli");
  const [companyEmail, setCompanyEmail] = useState(settings.companySettings?.companyEmail || "hr@humaileli.com");
  const [companyPhone, setCompanyPhone] = useState(settings.companySettings?.companyPhone || "+92 300 1234567");
  const [companyAddress, setCompanyAddress] = useState(settings.companySettings?.companyAddress || "");
  const [workStartTime, setWorkStartTime] = useState(settings.companySettings?.workStartTime || "09:00");
  const [workEndTime, setWorkEndTime] = useState(settings.companySettings?.workEndTime || "18:00");
  const [weekends, setWeekends] = useState<string[]>(settings.companySettings?.weekends || ["Saturday", "Sunday"]);
  const [publicHolidays, setPublicHolidays] = useState<string[]>(settings.companySettings?.publicHolidays || []);
  const [newHoliday, setNewHoliday] = useState("");


  // Status Management Rules
  const [enableStatusManagement, setEnableStatusManagement] = useState(settings.statusRules?.enableStatusManagement ?? true);
  const [autoExpireOnLeave, setAutoExpireOnLeave] = useState(settings.statusRules?.autoExpireOnLeave ?? false);
  const [autoExpireProbation, setAutoExpireProbation] = useState(settings.statusRules?.autoExpireProbation ?? true);
  const [autoResignToTerminated, setAutoResignToTerminated] = useState(settings.statusRules?.autoResignToTerminated ?? true);
  const [enableBulkStatusUpdate, setEnableBulkStatusUpdate] = useState(settings.statusRules?.enableBulkStatusUpdate ?? true);
  const [allowRehireTerminated, setAllowRehireTerminated] = useState(settings.statusRules?.allowRehireTerminated ?? false);


  // Audit Trail Rules
  const [enableAuditTrail, setEnableAuditTrail] = useState(settings.auditTrailRules?.enableAuditTrail ?? true);
  const [requireReasonHighImpact, setRequireReasonHighImpact] = useState(settings.auditTrailRules?.requireReasonHighImpact ?? true);
  const [retentionPeriod, setRetentionPeriod] = useState(settings.auditTrailRules?.retentionPeriod ?? '7 years');

  // Toast / Status state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const toggleSection = (section: keyof typeof expanded) => {
    setExpanded(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleToggleWeekend = (day: string) => {
    setWeekends(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleAddHoliday = () => {
    if (newHoliday && !publicHolidays.includes(newHoliday)) {
      setPublicHolidays(prev => [...prev, newHoliday].sort());
      setNewHoliday("");
    }
  };

  const handleRemoveHoliday = (date: string) => {
    setPublicHolidays(prev => prev.filter(d => d !== date));
  };

  const handleSaveAll = (e: FormEvent) => {
    e.preventDefault();

    const attendanceRules: AttendanceRules = {
      lateThreshold,
      earlyDepartureThreshold,
      halfDayHours,
      fullDayHours,
      gracePeriodMinutes
    };

    const payrollRules: PayrollRules = {
      perfectAttendanceBonus,
      latePenalty,
      halfDayDeduction,
      absentPenalty,
      overtimeRate,
      taxRate,
      socialSecurityRate,
      healthInsuranceDeduction
    };

    const recruitmentRules: RecruitmentRules = {
      minExperienceYears,
      minScreeningScore,
      screeningQuestionsCount,
      whatsAppMessageTemplate
    };



    const auditTrailRules: AuditTrailRules = {
      enableAuditTrail,
      trackAllFields: true,
      trackedFields: [],
      requireReason: false,
      requireReasonHighImpact,
      retentionPeriod
    };

    const statusRules: StatusManagementRules = {
      enableStatusManagement,
      autoExpireOnLeave,
      autoExpireProbation,
      autoResignToTerminated,
      enableBulkStatusUpdate,
      allowRehireTerminated
    };

    const companySettings: CompanySettings = {
      companyName,
      companyEmail,
      companyPhone,
      companyAddress,
      workStartTime,
      workEndTime,
      weekends,
      publicHolidays
    };

    const updatedSettings: AppSettings = {
      ...settings,
      attendanceRules,
      payrollRules,
      recruitmentRules,
      companySettings,
      statusRules,
      auditTrailRules
    };

    setSettings(updatedSettings);

    // Show dynamic beautiful toast
    setToastMessage("All Company Policies and dynamic business rules saved successfully to LocalStorage!");
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const daysOfWeek = [
    "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
  ];

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl" id="company-policies-container">
      {/* Upper header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/50 pb-5">
        <div>
          <h2 className="text-2xl font-black font-display text-slate-900 tracking-tight flex items-center gap-2">
            <Sliders className="w-6 h-6 text-violet-600" />
            Company Policies
          </h2>
          <p className="text-sm font-medium text-slate-500 font-sans mt-0.5">
            Configure dynamic attendance thresholds, payroll parameters, recruitment gating criteria, and general business schedule rules.
          </p>
        </div>
        <button
          onClick={handleSaveAll}
          className="flex items-center gap-2 h-10 px-5 bg-gradient-to-r from-violet-600 to-rose-500 hover:from-violet-700 hover:to-rose-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-violet-600/10 hover:shadow-lg active:scale-[0.98] self-start md:self-center"
          id="btn-save-policies"
        >
          <Save className="w-4 h-4" />
          Save All Settings
        </button>
      </div>

      {/* Success Toast Banner */}
      {toastMessage && (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl shadow-lg shadow-emerald-500/5 animate-scale-in" id="toast-success">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div className="text-xs font-semibold">{toastMessage}</div>
        </div>
      )}

      <form onSubmit={handleSaveAll} className="space-y-6">
        
        {/* SECTION 1: Attendance Rules */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden" id="section-attendance">
          <button
            type="button"
            onClick={() => toggleSection('attendance')}
            className="w-full px-6 py-4 flex items-center justify-between bg-slate-50 hover:bg-slate-100/60 border-b border-slate-100 transition-all text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-sans">1. Attendance & Scheduling Rules</h3>
                <p className="text-[11px] text-slate-400 font-sans font-medium">Define late and early checkouts, grace times, and full/half-day bounds.</p>
              </div>
            </div>
            {expanded.attendance ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          {expanded.attendance && (
            <div className="p-6 space-y-6 animate-slide-down">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Late Clock-In Threshold</label>
                  <input
                    type="time"
                    value={lateThreshold}
                    onChange={(e) => setLateThreshold(e.target.value)}
                    className="w-full h-10 px-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200/80 focus:bg-white rounded-xl text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/60 transition-all"
                  />
                  <p className="text-[10px] text-slate-400 leading-normal">
                    Check-in swipes after this time are automatically marked as Late. Default is <span className="font-mono">09:05</span>.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Early Departure Threshold</label>
                  <input
                    type="time"
                    value={earlyDepartureThreshold}
                    onChange={(e) => setEarlyDepartureThreshold(e.target.value)}
                    className="w-full h-10 px-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200/80 focus:bg-white rounded-xl text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/60 transition-all"
                  />
                  <p className="text-[10px] text-slate-400 leading-normal">
                    Check-out swipes before this time are marked as Early Departure. Default is <span className="font-mono">17:55</span>.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Grace Period (Minutes)</label>
                  <input
                    type="number"
                    min="0"
                    value={gracePeriodMinutes}
                    onChange={(e) => setGracePeriodMinutes(Number(e.target.value))}
                    className="w-full h-10 px-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200/80 focus:bg-white rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/60 transition-all"
                  />
                  <p className="text-[10px] text-slate-400 leading-normal">
                    Permitted buffer duration in minutes after the work start time (e.g., 5 mins grace).
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Half-Day Limit (Hours)</label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    step="0.5"
                    value={halfDayHours}
                    onChange={(e) => setHalfDayHours(Number(e.target.value))}
                    className="w-full h-10 px-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200/80 focus:bg-white rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/60 transition-all"
                  />
                  <p className="text-[10px] text-slate-400 leading-normal">
                    Employees working fewer than these hours in a shift are flagged as Half Day. Default is <span className="font-semibold">4</span>.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Full-Day Required Hours</label>
                  <input
                    type="number"
                    min="1"
                    max="16"
                    step="0.5"
                    value={fullDayHours}
                    onChange={(e) => setFullDayHours(Number(e.target.value))}
                    className="w-full h-10 px-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200/80 focus:bg-white rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/60 transition-all"
                  />
                  <p className="text-[10px] text-slate-400 leading-normal">
                    Standard duration of a complete workday, used in payroll calculations. Default is <span className="font-semibold">8</span>.
                  </p>
                </div>

              </div>
            </div>
          )}
        </div>

        {/* SECTION 2: Payroll Rules */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden" id="section-payroll">
          <button
            type="button"
            onClick={() => toggleSection('payroll')}
            className="w-full px-6 py-4 flex items-center justify-between bg-slate-50 hover:bg-slate-100/60 border-b border-slate-100 transition-all text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Coins className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-sans">2. Payroll Calculation Rules</h3>
                <p className="text-[11px] text-slate-400 font-sans font-medium">Set bonuses, deduction penalties, overtime factors, and tax/social tax rates.</p>
              </div>
            </div>
            {expanded.payroll ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          {expanded.payroll && (
            <div className="p-6 space-y-6 animate-slide-down">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Perfect Attendance Bonus ($)</label>
                  <input
                    type="number"
                    min="0"
                    value={perfectAttendanceBonus}
                    onChange={(e) => setPerfectAttendanceBonus(Number(e.target.value))}
                    className="w-full h-10 px-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200/80 focus:bg-white rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/60 transition-all"
                  />
                  <p className="text-[10px] text-slate-400 leading-normal">
                    Monthly bonus rewarded for zero late, early out, or absent flags.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Late Clock-In Penalty ($)</label>
                  <input
                    type="number"
                    min="0"
                    value={latePenalty}
                    onChange={(e) => setLatePenalty(Number(e.target.value))}
                    className="w-full h-10 px-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200/80 focus:bg-white rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/60 transition-all"
                  />
                  <p className="text-[10px] text-slate-400 leading-normal">
                    Fine deducted per late check-in instance.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Half-Day Deduction ($)</label>
                  <input
                    type="number"
                    min="0"
                    value={halfDayDeduction}
                    onChange={(e) => setHalfDayDeduction(Number(e.target.value))}
                    className="w-full h-10 px-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200/80 focus:bg-white rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/60 transition-all"
                  />
                  <p className="text-[10px] text-slate-400 leading-normal">
                    Salary deduction for each marked half-day worked.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Absent Penalty ($)</label>
                  <input
                    type="number"
                    min="0"
                    value={absentPenalty}
                    onChange={(e) => setAbsentPenalty(Number(e.target.value))}
                    className="w-full h-10 px-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200/80 focus:bg-white rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/60 transition-all"
                  />
                  <p className="text-[10px] text-slate-400 leading-normal">
                    Flat salary deduction fine applied per unexcused absent day.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Overtime Rate Factor</label>
                  <input
                    type="number"
                    min="1.0"
                    max="3.0"
                    step="0.1"
                    value={overtimeRate}
                    onChange={(e) => setOvertimeRate(Number(e.target.value))}
                    className="w-full h-10 px-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200/80 focus:bg-white rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/60 transition-all"
                  />
                  <p className="text-[10px] text-slate-400 leading-normal">
                    Multiplier for extra hours worked (e.g., 1.5x of hourly base).
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Income Tax Rate (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="90"
                    value={taxRate}
                    onChange={(e) => setTaxRate(Number(e.target.value))}
                    className="w-full h-10 px-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200/80 focus:bg-white rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/60 transition-all"
                  />
                  <p className="text-[10px] text-slate-400 leading-normal">
                    Standard percentage deducted for tax withholding.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Social Security (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={socialSecurityRate}
                    onChange={(e) => setSocialSecurityRate(Number(e.target.value))}
                    className="w-full h-10 px-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200/80 focus:bg-white rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/60 transition-all"
                  />
                  <p className="text-[10px] text-slate-400 leading-normal">
                    Social contribution percentage deducted from salary ledger.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Health Insurance ($)</label>
                  <input
                    type="number"
                    min="0"
                    value={healthInsuranceDeduction}
                    onChange={(e) => setHealthInsuranceDeduction(Number(e.target.value))}
                    className="w-full h-10 px-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200/80 focus:bg-white rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/60 transition-all"
                  />
                  <p className="text-[10px] text-slate-400 leading-normal">
                    Flat-rate medical/health benefit insurance deduction.
                  </p>
                </div>

              </div>
            </div>
          )}
        </div>

        {/* SECTION 3: Recruitment Rules */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden" id="section-recruitment">
          <button
            type="button"
            onClick={() => toggleSection('recruitment')}
            className="w-full px-6 py-4 flex items-center justify-between bg-slate-50 hover:bg-slate-100/60 border-b border-slate-100 transition-all text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <UserPlus className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-sans">3. Recruitment & Auto-Gating Rules</h3>
                <p className="text-[11px] text-slate-400 font-sans font-medium">Set screening score targets, required candidate experience, and automated messages.</p>
              </div>
            </div>
            {expanded.recruitment ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          {expanded.recruitment && (
            <div className="p-6 space-y-6 animate-slide-down">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Min Experience Years</label>
                  <input
                    type="number"
                    min="0"
                    value={minExperienceYears}
                    onChange={(e) => setMinExperienceYears(Number(e.target.value))}
                    className="w-full h-10 px-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200/80 focus:bg-white rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/60 transition-all"
                  />
                  <p className="text-[10px] text-slate-400 leading-normal">
                    Candidates with fewer than these experience years will fail automated shortlist gating.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Screening Pass Score (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={minScreeningScore}
                    onChange={(e) => setMinScreeningScore(Number(e.target.value))}
                    className="w-full h-10 px-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200/80 focus:bg-white rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/60 transition-all"
                  />
                  <p className="text-[10px] text-slate-400 leading-normal">
                    Minimum aggregate target percentage on AI interview questions to clear candidate screening.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Screening Questions Count</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={screeningQuestionsCount}
                    onChange={(e) => setScreeningQuestionsCount(Number(e.target.value))}
                    className="w-full h-10 px-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200/80 focus:bg-white rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/60 transition-all"
                  />
                  <p className="text-[10px] text-slate-400 leading-normal">
                    Number of technical and cultural questions requested from the AI interview generator.
                  </p>
                </div>

              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">WhatsApp Invite Template</label>
                <textarea
                  rows={6}
                  value={whatsAppMessageTemplate}
                  onChange={(e) => setWhatsAppMessageTemplate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200/80 focus:bg-white rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/60 transition-all text-slate-800 placeholder-slate-400"
                />
                <p className="text-[10px] text-slate-400 leading-normal">
                  Define placeholders: <span className="font-semibold text-violet-600 font-mono">{"{name}"}</span>, <span className="font-semibold text-violet-600 font-mono">{"{date}"}</span>, <span className="font-semibold text-violet-600 font-mono">{"{time}"}</span>, <span className="font-semibold text-violet-600 font-mono">{"{interviewer}"}</span>, <span className="font-semibold text-violet-600 font-mono">{"{company_name}"}</span>.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 4: WhatsApp Templates */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden" id="section-whatsapp-templates">
          <button
            type="button"
            onClick={() => toggleSection('whatsappTemplates')}
            className="w-full px-6 py-4 flex items-center justify-between bg-slate-50 hover:bg-slate-100/60 border-b border-slate-100 transition-all text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <MessageCircle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-sans">WhatsApp Templates</h3>
                <p className="text-[11px] text-slate-400 font-sans font-medium">Manage pre-approved WhatsApp message templates.</p>
              </div>
            </div>
            {expanded.whatsappTemplates ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          {expanded.whatsappTemplates && (
            <div className="p-6">
              <p className="text-xs text-slate-500">WhatsApp Template management interface goes here.</p>
            </div>
          )}
        </div>

        {/* SECTION: Leave Policies */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden" id="section-leave-policies">
          <button
            type="button"
            onClick={() => toggleSection('leavePolicies')}
            className="w-full px-6 py-4 flex items-center justify-between bg-slate-50 hover:bg-slate-100/60 border-b border-slate-100 transition-all text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-sans">Leave Policy Configuration</h3>
                <p className="text-[11px] text-slate-400 font-sans font-medium">Manage leave types, quotas, and accrual policies.</p>
              </div>
            </div>
            {expanded.leavePolicies ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          {expanded.leavePolicies && (
            <div className="p-6">
              <p className="text-xs text-slate-500">Leave policy management interface to be implemented.</p>
            </div>
          )}
        </div>

        {/* SECTION 5: Company Settings */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden" id="section-company">
          <button
            type="button"
            onClick={() => toggleSection('company')}
            className="w-full px-6 py-4 flex items-center justify-between bg-slate-50 hover:bg-slate-100/60 border-b border-slate-100 transition-all text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                <Building className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-sans">4. Corporate Information & Schedule</h3>
                <p className="text-[11px] text-slate-400 font-sans font-medium">Configure company info, working shift intervals, weekend rest days, and public holidays.</p>
              </div>
            </div>
            {expanded.company ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          {expanded.company && (
            <div className="p-6 space-y-6 animate-slide-down">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Company Name</label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full h-10 px-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200/80 focus:bg-white rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/60 transition-all text-slate-800"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Company Contact Email</label>
                  <input
                    type="email"
                    required
                    value={companyEmail}
                    onChange={(e) => setCompanyEmail(e.target.value)}
                    className="w-full h-10 px-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200/80 focus:bg-white rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/60 transition-all text-slate-800"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Company Phone</label>
                  <input
                    type="text"
                    required
                    value={companyPhone}
                    onChange={(e) => setCompanyPhone(e.target.value)}
                    className="w-full h-10 px-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200/80 focus:bg-white rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/60 transition-all text-slate-800"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Office Address</label>
                  <textarea
                    rows={1}
                    value={companyAddress}
                    onChange={(e) => setCompanyAddress(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200/80 focus:bg-white rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/60 transition-all text-slate-800"
                    placeholder="Physical corporate head office location..."
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Work Shift Start Time</label>
                  <input
                    type="time"
                    required
                    value={workStartTime}
                    onChange={(e) => setWorkStartTime(e.target.value)}
                    className="w-full h-10 px-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200/80 focus:bg-white rounded-xl text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/60 transition-all text-slate-800"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Work Shift End Time</label>
                  <input
                    type="time"
                    required
                    value={workEndTime}
                    onChange={(e) => setWorkEndTime(e.target.value)}
                    className="w-full h-10 px-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200/80 focus:bg-white rounded-xl text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/60 transition-all text-slate-800"
                  />
                </div>

              </div>

              {/* Weekend Days checkboxes */}
              <div className="space-y-2 border-t border-slate-100 pt-4">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Weekly Rest Days (Weekends)</label>
                <div className="flex flex-wrap gap-2">
                  {daysOfWeek.map(day => {
                    const isSelected = weekends.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => handleToggleWeekend(day)}
                        className={`h-9 px-4 rounded-xl text-xs font-bold tracking-wider uppercase transition-all duration-200 border ${
                          isSelected
                            ? 'bg-rose-50 border-rose-200 text-rose-700 font-black shadow-sm'
                            : 'bg-white border-slate-200/80 hover:bg-slate-50 text-slate-400'
                        }`}
                      >
                        {day.slice(0, 3)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Public Holidays list */}
              <div className="space-y-4 border-t border-slate-100 pt-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Public Holidays Calendar</label>
                  <div className="flex gap-2">
                    <div className="flex items-center gap-2 h-10 px-3 bg-slate-50/50 hover:bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-mono font-bold text-slate-700 transition-all focus-within:bg-white focus-within:ring-2 focus-within:ring-violet-500/20 focus-within:border-violet-500/60 flex-1 max-w-xs">
                      <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                      <input
                        type="date"
                        value={newHoliday}
                        onChange={(e) => setNewHoliday(e.target.value)}
                        className="bg-transparent border-none focus:outline-none text-xs font-bold font-mono text-slate-700 w-full h-full"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddHoliday}
                      className="h-10 px-4 inline-flex items-center justify-center gap-1.5 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-600 bg-white hover:bg-slate-50 border border-slate-200/80 hover:border-slate-300 transition-all duration-200"
                    >
                      <Plus className="w-4 h-4" /> Add Date
                    </button>
                  </div>
                </div>

                {/* Holiday Items Grid */}
                {publicHolidays.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {publicHolidays.map(holiday => (
                      <div 
                        key={holiday}
                        className="flex items-center justify-between px-3 py-1.5 bg-slate-50 border border-slate-200/50 rounded-xl text-xs font-mono font-bold text-slate-600"
                      >
                        <span>{holiday}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveHoliday(holiday)}
                          className="text-slate-400 hover:text-rose-600 p-0.5 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 italic">No corporate public holidays added yet.</p>
                )}
              </div>

            </div>
          )}
        </div>

        {/* Master save footer panel */}
        <div className="flex items-center justify-end border-t border-slate-200/50 pt-5">
          <button
            type="submit"
            className="flex items-center gap-2 h-11 px-6 bg-gradient-to-r from-violet-600 to-rose-500 hover:from-violet-700 hover:to-rose-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-violet-600/15 hover:shadow-lg active:scale-[0.98]"
            id="btn-save-policies-bottom"
          >
            <Save className="w-4 h-4" />
            Save All Settings
          </button>
        </div>


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

      </form>
    </div>
  );
}
