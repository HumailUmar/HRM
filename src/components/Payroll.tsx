import { useState, useMemo, useEffect } from 'react';
import { Employee, AttendanceRecord, PayrollRecord, AppSettings, Department, Designation } from '../types';
import { Cpu, Save, Sliders, CheckCircle, Sparkles, TrendingUp, DollarSign, PieChart, ShieldAlert, FileText } from 'lucide-react';
import { addSheetLog } from '../lib/storage';
import { exportPayrollReportToPDF } from '../utils/pdfGenerator';
import { getEmployeeBaseSalary } from '../lib/employeeUtils';

interface PayrollProps {
  employees: Employee[];
  attendance: AttendanceRecord[];
  payrolls: PayrollRecord[];
  setPayrolls: (payrolls: PayrollRecord[]) => void;
  settings: AppSettings;
  setSettings: (settings: AppSettings) => void;
  departments: Department[];
  designations: Designation[];
}

export default function Payroll({
  employees,
  attendance,
  payrolls,
  setPayrolls,
  settings,
  setSettings,
  departments,
  designations
}: PayrollProps) {
  // Generate last 3 months dynamically
  const monthOptions = useMemo(() => {
    const months = [];
    const now = new Date();
    for (let i = 0; i < 3; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = date.toLocaleString('default', { month: 'long', year: 'numeric' });
      const value = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      months.push({ label, value });
    }
    return months;
  }, []);

  const [selectedMonth, setSelectedMonth] = useState(monthOptions[0].label);
  
  // Custom configurable payroll parameters loaded from settings
  const [bonusAmount, setBonusAmount] = useState(settings.payrollRules?.perfectAttendanceBonus ?? 150);
  const [latePenalty, setLatePenalty] = useState(settings.payrollRules?.latePenalty ?? 5);
  const [halfDayDeduction, setHalfDayDeduction] = useState(settings.payrollRules?.halfDayDeduction ?? 50);
  const [absentDeduction, setAbsentDeduction] = useState(settings.payrollRules?.absentPenalty ?? 100);

  // Sync state if settings change (e.g. from Company Policies page)
  useEffect(() => {
    if (settings.payrollRules) {
      setBonusAmount(settings.payrollRules.perfectAttendanceBonus ?? 150);
      setLatePenalty(settings.payrollRules.latePenalty ?? 5);
      setHalfDayDeduction(settings.payrollRules.halfDayDeduction ?? 50);
      setAbsentDeduction(settings.payrollRules.absentPenalty ?? 100);
    }
  }, [settings.payrollRules]);

  // Handle setting updates on slider modifications
  const handleUpdateBonus = (val: number) => {
    setBonusAmount(val);
    setSettings({
      ...settings,
      payrollRules: {
        ...settings.payrollRules,
        perfectAttendanceBonus: val
      }
    });
  };

  const handleUpdateLatePenalty = (val: number) => {
    setLatePenalty(val);
    setSettings({
      ...settings,
      payrollRules: {
        ...settings.payrollRules,
        latePenalty: val
      }
    });
  };

  const handleUpdateHalfDayDeduction = (val: number) => {
    setHalfDayDeduction(val);
    setSettings({
      ...settings,
      payrollRules: {
        ...settings.payrollRules,
        halfDayDeduction: val
      }
    });
  };

  const handleUpdateAbsentDeduction = (val: number) => {
    setAbsentDeduction(val);
    setSettings({
      ...settings,
      payrollRules: {
        ...settings.payrollRules,
        absentPenalty: val
      }
    });
  };

  const [processedRecords, setProcessedRecords] = useState<PayrollRecord[]>([]);
  const [hasProcessed, setHasProcessed] = useState(false);

  const activeEmployees = useMemo(() => employees.filter(e => e.status !== 'Terminated'), [employees]);

  // Run the calculations
  const handleProcessPayroll = () => {
    const monthPrefix = monthOptions.find(m => m.label === selectedMonth)?.value || "2026-07";
    const monthAttendance = attendance.filter(r => r.date.startsWith(monthPrefix));

    const computed: PayrollRecord[] = activeEmployees.map(emp => {
      const empAttendance = monthAttendance.filter(r => r.employeeId === emp.id);

      const lateDaysCount = empAttendance.filter(r => r.lateMinutes > 0).length;
      const halfDaysCount = empAttendance.filter(r => r.status === 'Half Day').length;
      const absentDaysCount = empAttendance.filter(r => r.status === 'Absent').length;

      const base = getEmployeeBaseSalary(emp);
      const bonus = lateDaysCount === 0 ? bonusAmount : 0;
      const penalty = lateDaysCount * latePenalty;
      const leaveDeductions = (halfDaysCount * halfDayDeduction) + (absentDaysCount * absentDeduction);
      const netSalary = Math.max(0, base + bonus - penalty - leaveDeductions);

      return {
        id: `PAY-${Date.now().toString().slice(-4)}-${emp.id.split('-')[1]}`,
        employeeId: emp.id,
        employeeName: emp.name,
        month: selectedMonth,
        baseSalary: base,
        bonus,
        penalty,
        leaveDeductions,
        netSalary,
        status: 'Pending',
        calculatedAt: new Date().toISOString().split('T')[0]
      };
    });

    setProcessedRecords(computed);
    setHasProcessed(true);
    alert(`Salary sheet calculations completed for ${selectedMonth}! Dynamic breakdown has been updated in the visual analytics card.`);
  };

  // Save/Commit Payroll to Google Sheet
  const handleCommitPayroll = () => {
    if (processedRecords.length === 0) return;

    const confirmed = window.confirm(`Save and commit payroll run for ${selectedMonth}? This will append ${processedRecords.length} records to the Google Sheet: "${settings.googleSheets.payrollSheet}".`);
    if (!confirmed) return;

    const cleanedPayrolls = payrolls.filter(p => p.month !== selectedMonth);
    const finalized = processedRecords.map(p => ({ ...p, status: 'Paid' as const }));

    setPayrolls([...finalized, ...cleanedPayrolls]);
    setProcessedRecords([]);
    setHasProcessed(false);

    finalized.forEach(record => {
      addSheetLog(settings.googleSheets.payrollSheet, "INSERT", record);
    });

    alert(`Salary sheet successfully saved! Dispatched rows to "${settings.googleSheets.payrollSheet}" sheet sync.`);
  };

  const historicRecords = useMemo(() => {
    return payrolls.filter(p => p.month === selectedMonth);
  }, [payrolls, selectedMonth]);

  // Aggregate stats for Donut Chart (preview or historic)
  const chartTotals = useMemo(() => {
    const activeList = hasProcessed ? processedRecords : historicRecords;
    
    let totalBase = 0;
    let totalBonus = 0;
    let totalDeductions = 0;
    let totalNet = 0;

    if (activeList.length > 0) {
      activeList.forEach(p => {
        totalBase += p.baseSalary;
        totalBonus += p.bonus;
        totalDeductions += (p.penalty + p.leaveDeductions);
        totalNet += p.netSalary;
      });
    } else {
      // Fallback default calculation based on active staff base salaries
      activeEmployees.forEach(e => {
        totalBase += getEmployeeBaseSalary(e);
      });
      totalNet = totalBase;
    }

    return {
      totalBase,
      totalBonus,
      totalDeductions,
      totalNet
    };
  }, [hasProcessed, processedRecords, historicRecords, activeEmployees]);

  // Donut SVG constants
  const totalFinancials = chartTotals.totalBase + chartTotals.totalBonus + chartTotals.totalDeductions;
  const basePercent = totalFinancials > 0 ? (chartTotals.totalBase / totalFinancials) * 100 : 100;
  const bonusPercent = totalFinancials > 0 ? (chartTotals.totalBonus / totalFinancials) * 100 : 0;
  const deductPercent = totalFinancials > 0 ? (chartTotals.totalDeductions / totalFinancials) * 100 : 0;

  // Pie formulas
  const radius = 15.915;
  const circumference = 2 * Math.PI * radius; // ~100
  const baseOffset = 0;
  const bonusOffset = 100 - basePercent;
  const deductOffset = 100 - basePercent - bonusPercent;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Upper header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/50 pb-5">
        <div>
          <h2 className="text-2xl font-black font-display text-slate-900 tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-600" />
            Payroll Ledger Engine
          </h2>
          <p className="text-sm font-medium text-slate-500 font-sans mt-0.5">Custom regulatory rules, attendance deduction mapping, and direct spreadsheet ledger commits.</p>
        </div>
        <div className="flex items-center gap-2.5 self-start md:self-center">
          <select
            value={selectedMonth}
            onChange={(e) => {
              setSelectedMonth(e.target.value);
              setProcessedRecords([]);
              setHasProcessed(false);
            }}
            className="h-10 px-3 bg-slate-50/50 border border-slate-200/80 hover:border-slate-300 rounded-xl text-xs font-bold uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/60 transition-all text-slate-700"
          >
            {monthOptions.map((m) => (
              <option key={m.value} value={m.label}>{m.label}</option>
            ))}
          </select>

          <button
            onClick={handleProcessPayroll}
            className="h-10 px-4 inline-flex items-center justify-center gap-2 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-gradient-to-r from-violet-600 to-rose-500 hover:from-violet-700 hover:to-rose-600 transition-all duration-300 shadow-md shadow-violet-600/10 hover:shadow-lg active:scale-[0.98]"
          >
            <Cpu className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '3s' }} />
            Run Calculation
          </button>

          <button
            onClick={() => {
              const dataToExport = hasProcessed ? processedRecords : historicRecords;
              if (dataToExport.length === 0) {
                alert(`No payroll records to export for ${selectedMonth}. Adjust parameters and click 'Run Calculation' first.`);
                return;
              }
              exportPayrollReportToPDF(dataToExport, selectedMonth, settings);
            }}
            className="h-10 px-4 inline-flex items-center justify-center gap-2 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/80 hover:border-slate-300 transition-all duration-200 shadow-sm active:scale-[0.98]"
          >
            <FileText className="w-3.5 h-3.5 text-violet-600" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Side-by-Side: Configurable parameters (Left) vs Donut Chart Breakdown (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Sliders (Left Column - 7/12 width) */}
        <div className="lg:col-span-7 bg-white/90 backdrop-blur-md border border-slate-200/60 rounded-2xl p-6 shadow-xl shadow-slate-100/40 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3 mb-5 font-display">
              <Sliders className="w-4 h-4 text-violet-600" />
              Adjust Formula Parameters
            </h3>

            <div className="space-y-6">
              {/* Slider 1 */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-slate-600">
                  <span>Perfect Attendance Bonus</span>
                  <span className="font-mono text-violet-600 bg-violet-50 px-2 py-0.5 rounded">${bonusAmount}</span>
                </div>
                <input
                  type="range"
                  min={50}
                  max={400}
                  step={10}
                  value={bonusAmount}
                  onChange={(e) => handleUpdateBonus(Number(e.target.value))}
                  className="w-full h-1 bg-slate-200 rounded-lg cursor-pointer accent-violet-600"
                />
                <p className="text-[10px] text-slate-400 font-sans">Applicable if the employee registers zero late arrivals during the period.</p>
              </div>

              {/* Slider 2 */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-slate-600">
                  <span>Late Check-in Penalty</span>
                  <span className="font-mono text-violet-600 bg-violet-50 px-2 py-0.5 rounded">${latePenalty} / instance</span>
                </div>
                <input
                  type="range"
                  min={2}
                  max={20}
                  step={1}
                  value={latePenalty}
                  onChange={(e) => handleUpdateLatePenalty(Number(e.target.value))}
                  className="w-full h-1 bg-slate-200 rounded-lg cursor-pointer accent-violet-600"
                />
                <p className="text-[10px] text-slate-400 font-sans">Subtracted per individual checkout instance showing check-in post {settings.attendanceRules?.lateThreshold || "09:05"}.</p>
              </div>

              {/* Slider 3 */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-slate-600">
                  <span>Half Day Deduction</span>
                  <span className="font-mono text-violet-600 bg-violet-50 px-2 py-0.5 rounded">${halfDayDeduction}</span>
                </div>
                <input
                  type="range"
                  min={20}
                  max={120}
                  step={5}
                  value={halfDayDeduction}
                  onChange={(e) => handleUpdateHalfDayDeduction(Number(e.target.value))}
                  className="w-full h-1 bg-slate-200 rounded-lg cursor-pointer accent-violet-600"
                />
                <p className="text-[10px] text-slate-400 font-sans">Subtracted per biometric log tracking less than {settings.attendanceRules?.halfDayHours ?? 4} hours total office attendance.</p>
              </div>

              {/* Slider 4 */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-slate-600">
                  <span>Absent Penalty</span>
                  <span className="font-mono text-violet-600 bg-violet-50 px-2 py-0.5 rounded">${absentDeduction}</span>
                </div>
                <input
                  type="range"
                  min={50}
                  max={200}
                  step={10}
                  value={absentDeduction}
                  onChange={(e) => handleUpdateAbsentDeduction(Number(e.target.value))}
                  className="w-full h-1 bg-slate-200 rounded-lg cursor-pointer accent-violet-600"
                />
                <p className="text-[10px] text-slate-400 font-sans">Deducted per individual day containing zero biometric logs.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Donut Chart (Right Column - 5/12 width) */}
        <div className="lg:col-span-5 bg-[#0f0f1e] text-slate-100 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3 mb-5 font-display">
              <PieChart className="w-4 h-4 text-rose-400" />
              Sallary Distribution Visual
            </h3>

            <div className="flex flex-col items-center justify-center py-2 space-y-5">
              
              {/* Premium interactive donut path */}
              <div className="relative w-36 h-36">
                <svg viewBox="0 0 42 42" className="w-full h-full transform -rotate-90">
                  {/* Empty base track */}
                  <circle cx="21" cy="21" r={radius} fill="transparent" stroke="#1c1c30" strokeWidth="4.5" />
                  
                  {/* Base Salaries Segment (violet) */}
                  {chartTotals.totalBase > 0 && (
                    <circle 
                      cx="21" 
                      cy="21" 
                      r={radius} 
                      fill="transparent" 
                      stroke="#8b5cf6" 
                      strokeWidth="5" 
                      strokeDasharray={`${basePercent} ${100 - basePercent}`}
                      strokeDashoffset="0" 
                    />
                  )}

                  {/* Bonuses Segment (emerald) */}
                  {chartTotals.totalBonus > 0 && (
                    <circle 
                      cx="21" 
                      cy="21" 
                      r={radius} 
                      fill="transparent" 
                      stroke="#10b981" 
                      strokeWidth="5" 
                      strokeDasharray={`${bonusPercent} ${100 - bonusPercent}`}
                      strokeDashoffset={-basePercent} 
                    />
                  )}

                  {/* Deductions Segment (rose) */}
                  {chartTotals.totalDeductions > 0 && (
                    <circle 
                      cx="21" 
                      cy="21" 
                      r={radius} 
                      fill="transparent" 
                      stroke="#f43f5e" 
                      strokeWidth="5.5" 
                      strokeDasharray={`${deductPercent} ${100 - deductPercent}`}
                      strokeDashoffset={-(basePercent + bonusPercent)} 
                    />
                  )}
                </svg>

                {/* Donut Center Label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">Net Total</span>
                  <span className="text-lg font-black text-white font-mono mt-1.5">${chartTotals.totalNet.toLocaleString()}</span>
                </div>
              </div>

              {/* Legends with calculations */}
              <div className="w-full space-y-2 border-t border-slate-800/80 pt-4 text-xs font-medium">
                {/* Legend 1 */}
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <span className="w-2.5 h-2.5 rounded bg-violet-500 shrink-0" />
                    Gross Base Salaries
                  </span>
                  <span className="font-mono text-white">${chartTotals.totalBase.toLocaleString()}</span>
                </div>
                {/* Legend 2 */}
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <span className="w-2.5 h-2.5 rounded bg-emerald-500 shrink-0" />
                    Perfect Attendance Bonuses
                  </span>
                  <span className="font-mono text-emerald-400">+${chartTotals.totalBonus.toLocaleString()}</span>
                </div>
                {/* Legend 3 */}
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <span className="w-2.5 h-2.5 rounded bg-rose-500 shrink-0" />
                    Penalties & Leave Deductions
                  </span>
                  <span className="font-mono text-rose-400">-${chartTotals.totalDeductions.toLocaleString()}</span>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>

      {/* Process list previews or historic records */}
      {hasProcessed ? (
        <div className="bg-white rounded-2xl border border-violet-200 p-6 shadow-xl shadow-slate-100/30 space-y-4 animate-scale-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-violet-600 animate-pulse" />
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-display">Salary Sheet Preview ({selectedMonth})</h3>
                <p className="text-xs text-slate-400 font-sans mt-0.5">Calculated ledger lines awaiting submission to sheets.</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => {
                  setProcessedRecords([]);
                  setHasProcessed(false);
                }}
                className="h-10 px-4 inline-flex items-center justify-center gap-2 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-600 bg-white hover:bg-slate-50 border border-slate-200/80 hover:border-slate-300 transition-all duration-200 active:scale-[0.98]"
              >
                Clear Preview
              </button>
              <button
                onClick={handleCommitPayroll}
                className="h-10 px-4 inline-flex items-center justify-center gap-2 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 transition-all duration-300 shadow-md shadow-emerald-600/10 hover:shadow-lg active:scale-[0.98]"
              >
                <Save className="w-4 h-4" /> Commit to GSheet
              </button>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-100 rounded-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3 text-right">Base</th>
                  <th className="px-4 py-3 text-right">Perfect Bonus</th>
                  <th className="px-4 py-3 text-right">Penalties</th>
                  <th className="px-4 py-3 text-right">Deductions</th>
                  <th className="px-4 py-3 text-right font-extrabold text-violet-700">Net Pay</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {processedRecords.map((p) => (
                  <tr key={p.employeeId} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3.5">
                      <p className="font-bold text-slate-800">{p.employeeName}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{p.employeeId}</p>
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono text-slate-600">${p.baseSalary}</td>
                    <td className="px-4 py-3.5 text-right font-mono text-emerald-600">
                      {p.bonus > 0 ? `+$${p.bonus}` : '—'}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono text-rose-500">
                      {p.penalty > 0 ? `-$${p.penalty}` : '—'}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono text-rose-500">
                      {p.leaveDeductions > 0 ? `-$${p.leaveDeductions}` : '—'}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono font-bold text-violet-700 bg-violet-50/20 text-sm">${p.netSalary}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-xl shadow-slate-100/30 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-display">Committed Payroll History Logs</h3>
              <p className="text-xs text-slate-400 font-sans mt-0.5">Historic finalized sheets committed in Google Sheets.</p>
            </div>
            <div className="text-xs font-mono font-semibold text-slate-400 bg-slate-50 border border-slate-200/50 px-2.5 py-1 rounded-lg">
              SYNC TABLE: {settings.googleSheets.payrollSheet}
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-100 rounded-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3 text-right">Base</th>
                  <th className="px-4 py-3 text-right">Perfect Bonus</th>
                  <th className="px-4 py-3 text-right">Late Penalties</th>
                  <th className="px-4 py-3 text-right">Leave Deductions</th>
                  <th className="px-4 py-3 text-right font-bold text-slate-800">Net Salary</th>
                  <th className="px-4 py-3 text-right">Sync Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {historicRecords.length > 0 ? (
                  historicRecords.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3.5">
                        <p className="font-bold text-slate-800">{p.employeeName}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{p.employeeId} • Run ID {p.id}</p>
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono text-slate-600">${p.baseSalary}</td>
                      <td className="px-4 py-3.5 text-right font-mono text-emerald-600">
                        {p.bonus > 0 ? `+$${p.bonus}` : '—'}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono text-rose-500">
                        {p.penalty > 0 ? `-$${p.penalty}` : '—'}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono text-rose-500">
                        {p.leaveDeductions > 0 ? `-$${p.leaveDeductions}` : '—'}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-emerald-700 bg-emerald-50/10 text-sm">${p.netSalary}</td>
                      <td className="px-4 py-3.5 text-right">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle className="w-3 h-3 text-emerald-600" /> PAID
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-400 font-sans italic">
                      No payments recorded yet for {selectedMonth}. Adjust formula sliders and click "Run Calculation" to compute salary logs.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
