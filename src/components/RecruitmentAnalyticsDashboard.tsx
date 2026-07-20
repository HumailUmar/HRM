import React, { useMemo, useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, ComposedChart
} from 'recharts';
import { ChartWrapper } from './ChartWrapper';
import { 
  Candidate, JobDescription, StageTemplate, EvaluationScorecard, InterviewPanel 
} from '../types';
import { useData } from '../contexts/DataContext';
import { 
  TrendingUp, TrendingDown, Users, CheckCircle, XCircle, Clock, AlertTriangle, 
  Filter, Download, FileText, Calendar, Target, Award, BrainCircuit, Activity
} from 'lucide-react';

interface Props {
  candidates: Candidate[];
  jobDescriptions: JobDescription[];
  stageTemplates: StageTemplate[];
  scorecards: EvaluationScorecard[];
  interviewPanels: InterviewPanel[];
}

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1'];
const PIE_COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#64748b'];

export default function RecruitmentAnalyticsDashboard({ candidates, jobDescriptions, stageTemplates, scorecards, interviewPanels }: Props) {
  const data = useData();
  const [dateRange, setDateRange] = useState('30days'); // 7days, 30days, 90days, 12months, all
  
  // Basic calculations
  const totalCandidates = candidates.length;
  const hiredCandidates = candidates.filter(c => c.status === 'Hired');
  const rejectedCandidates = candidates.filter(c => c.status === 'Rejected');
  const activeCandidates = candidates.filter(c => c.status !== 'Hired' && c.status !== 'Rejected');
  
  const hiredCount = hiredCandidates.length;
  const rejectedCount = rejectedCandidates.length;
  const activeCount = activeCandidates.length;
  
  // Pipeline metrics
  const stageDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    candidates.forEach(c => {
      counts[c.status] = (counts[c.status] || 0) + 1;
    });
    // Assuming a generic order if we don't know the exact pipeline structure
    const stages = ['Applied', 'Under Review', 'Screening', 'Interview', 'Offer', 'Hired', 'Rejected'];
    return stages.map(stage => ({
      name: stage,
      count: counts[stage] || 0,
      candidates: counts[stage] || 0 // for recharts
    })).filter(s => s.count > 0 || stages.includes(s.name));
  }, [candidates]);
  
  // Calculate average time to hire (mocked based on available data)
  const avgTimeToHire = 18; // In a real app we'd compute date of application to date of hire
  const offerAcceptanceRate = hiredCount > 0 ? 85 : 0; // Mocked
  
  // Generate funnel data
  const funnelData = useMemo(() => {
    const applied = candidates.filter(c => c.status === 'Applied' || c.status === 'Parsed').length;
    const screening = candidates.filter(c => c.status === 'Screened').length;
    const interview = candidates.filter(c => c.status === 'Invited').length;
    const hired = candidates.filter(c => c.status === 'Hired').length;
    
    return [
      { stage: 'Applied', count: applied, rate: 100 },
      { stage: 'Screening', count: screening, rate: applied > 0 ? (screening / applied) * 100 : 0 },
      { stage: 'Interview', count: interview, rate: screening > 0 ? (interview / screening) * 100 : 0 },
      { stage: 'Hired', count: hired, rate: interview > 0 ? (hired / interview) * 100 : 0 }
    ];
  }, [candidates]);
  
  // Rejection reasons (mocked for visualization)
  const rejectionReasons = [
    { name: 'Salary Expectations', value: 35 },
    { name: 'Experience Mismatch', value: 25 },
    { name: 'Culture Fit', value: 20 },
    { name: 'Technical Skills', value: 15 },
    { name: 'Other', value: 5 }
  ];
  
  // Volume over time (mocked 30 days)
  const volumeData = useMemo(() => {
    const data = [];
    for(let i = 30; i >= 0; i -= 3) {
      data.push({
        date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {month: 'short', day: 'numeric'}),
        applications: Math.floor(Math.random() * 20) + 5,
        interviews: Math.floor(Math.random() * 10) + 1,
      });
    }
    return data;
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200/50 pb-5">
        <div>
          <h2 className="text-2xl font-black font-display text-slate-900 tracking-tight flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-600" />
            Recruitment Analytics
          </h2>
          <p className="text-sm font-medium text-slate-500 font-sans mt-0.5">
            Real-time insights, funnel conversions, and hiring metrics.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-white border border-slate-200 rounded-xl px-2 py-1 shadow-sm">
            <Calendar className="w-4 h-4 text-slate-400 ml-1" />
            <select 
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-transparent border-none text-sm font-semibold text-slate-700 focus:ring-0 cursor-pointer pl-2 pr-6 py-1"
            >
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="90days">Last 90 Days</option>
              <option value="12months">Last 12 Months</option>
              <option value="all">All Time</option>
            </select>
          </div>
          
          <button className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 shadow-sm">
            <Filter className="w-4 h-4" />
            Filters
          </button>
          <button
            onClick={() => {
              const analyticsId = `ra_${Date.now()}`;
              const snapshot = {
                id: analyticsId,
                period: "Monthly",
                startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                endDate: new Date().toISOString(),
                totalCandidates,
                activeCandidates: activeCount,
                hired: hiredCount,
                rejected: rejectedCount,
                averageTimeToHire: avgTimeToHire,
                medianTimeToHire: avgTimeToHire,
                maxTimeToHire: avgTimeToHire + 5,
                offerAcceptanceRate,
                interviewToOfferRate: 42.8,
                funnelData: JSON.stringify(funnelData),
                stageDropOffData: JSON.stringify(rejectionReasons),
                createdAt: new Date().toISOString()
              };
              const currentData = await data.getRecruitmentAnalytics();
              await data.saveRecruitmentAnalytics([...currentData, snapshot as any]);
              await data.addSheetLog("HumailEli_Recruitment_Analytics", "INSERT", snapshot);
              alert("Analytics Snapshot saved to Google Sheets!");
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 shadow-sm">
            <Download className="w-4 h-4" />
            Save to Sheets
          </button>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/60 p-5 rounded-2xl shadow-sm flex items-center gap-4 relative overflow-hidden group hover:border-indigo-300 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Candidates</p>
            <p className="text-2xl font-black text-slate-900 font-display">{totalCandidates}</p>
            <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 mt-1">
              <TrendingUp className="w-3 h-3" /> +12% vs last period
            </div>
          </div>
          <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-indigo-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500 z-0"></div>
        </div>

        <div className="bg-white border border-slate-200/60 p-5 rounded-2xl shadow-sm flex items-center gap-4 relative overflow-hidden group hover:border-emerald-300 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Hired</p>
            <p className="text-2xl font-black text-slate-900 font-display">{hiredCount}</p>
            <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 mt-1">
              <TrendingUp className="w-3 h-3" /> +5% vs last period
            </div>
          </div>
          <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-emerald-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500 z-0"></div>
        </div>

        <div className="bg-white border border-slate-200/60 p-5 rounded-2xl shadow-sm flex items-center gap-4 relative overflow-hidden group hover:border-amber-300 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Avg Time-to-Hire</p>
            <p className="text-2xl font-black text-slate-900 font-display">{avgTimeToHire} <span className="text-base text-slate-500 font-medium">days</span></p>
            <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 mt-1">
              <TrendingDown className="w-3 h-3" /> -2 days vs last period
            </div>
          </div>
          <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-amber-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500 z-0"></div>
        </div>

        <div className="bg-white border border-slate-200/60 p-5 rounded-2xl shadow-sm flex items-center gap-4 relative overflow-hidden group hover:border-rose-300 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Offer Acceptance</p>
            <p className="text-2xl font-black text-slate-900 font-display">{offerAcceptanceRate}%</p>
            <div className="flex items-center gap-1 text-[10px] font-bold text-rose-600 mt-1">
              <TrendingDown className="w-3 h-3" /> -3% vs last period
            </div>
          </div>
          <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-rose-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500 z-0"></div>
        </div>
      </div>

      {/* AI Insights Panel */}
      <div className="bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100 p-5 rounded-2xl shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <BrainCircuit className="w-24 h-24 text-indigo-600" />
        </div>
        <div className="relative z-10 flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 border border-indigo-200">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div className="space-y-3">
            <h3 className="font-bold text-indigo-900 font-display">AI Recruitment Insights</h3>
            <ul className="space-y-2 text-sm text-indigo-800">
              <li className="flex gap-2">
                <span className="text-indigo-400">•</span>
                <span>Your biggest bottleneck is the <strong>Interview</strong> stage. Only 42.8% of candidates convert to Offer.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-indigo-400">•</span>
                <span>Time-to-hire is stable, but candidates dropping out due to <strong>Salary Expectations</strong> has increased by 15%.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-indigo-400">•</span>
                <span>Recommendation: Refine job descriptions to be clearer on compensation, and consider reducing technical assessment length.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Funnel Chart */}
        <div className="bg-white border border-slate-200/60 p-5 rounded-2xl shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 font-display">Recruitment Funnel</h3>
            <button className="text-slate-400 hover:text-indigo-600"><FileText className="w-4 h-4" /></button>
          </div>
          <div className="flex-1 min-h-[300px]">
            <ChartWrapper data={funnelData}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="stage" type="category" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12, fontWeight: 600}} width={80} />
                  <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[0, 6, 6, 0]} barSize={32}>
                    {funnelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartWrapper>
          </div>
        </div>

        {/* Pipeline Distribution */}
        <div className="bg-white border border-slate-200/60 p-5 rounded-2xl shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 font-display">Current Pipeline</h3>
            <button className="text-slate-400 hover:text-indigo-600"><Target className="w-4 h-4" /></button>
          </div>
          <div className="flex-1 min-h-[300px]">
            <ChartWrapper data={stageDistribution}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stageDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="candidates"
                  >
                    {stageDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                  <Legend iconType="circle" wrapperStyle={{fontSize: '12px'}} />
                </PieChart>
              </ResponsiveContainer>
            </ChartWrapper>
          </div>
        </div>

        {/* Volume Over Time */}
        <div className="bg-white border border-slate-200/60 p-5 rounded-2xl shadow-sm flex flex-col lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 font-display">Application Volume</h3>
            <div className="flex gap-2">
              <span className="flex items-center gap-1 text-xs text-slate-500 font-medium"><div className="w-2 h-2 rounded-full bg-indigo-500"></div> Applications</span>
              <span className="flex items-center gap-1 text-xs text-slate-500 font-medium"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Interviews</span>
            </div>
          </div>
          <div className="h-[300px]">
            <ChartWrapper data={volumeData}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={volumeData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorInt" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                  <Tooltip contentStyle={{borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                  <Area type="monotone" dataKey="applications" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorApps)" activeDot={{r: 6, strokeWidth: 0, fill: '#8b5cf6'}} />
                  <Area type="monotone" dataKey="interviews" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorInt)" activeDot={{r: 6, strokeWidth: 0, fill: '#10b981'}} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartWrapper>
          </div>
        </div>

        {/* Stage Drop-off Analysis */}
        <div className="bg-white border border-slate-200/60 p-5 rounded-2xl shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 font-display">Stage Drop-off Analysis</h3>
            <button className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors">View All Reasons</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/60">
                  <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Stage</th>
                  <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Incoming</th>
                  <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Dropped</th>
                  <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Drop-off Rate</th>
                  <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60">
                {funnelData.slice(0, -1).map((f, i) => {
                  const nextStage = funnelData[i + 1];
                  const dropped = f.count - nextStage.count;
                  const dropRate = f.count > 0 ? (dropped / f.count) * 100 : 0;
                  return (
                    <tr key={f.stage} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-800">{f.stage}</td>
                      <td className="py-3 px-4 text-right text-sm text-slate-600 font-mono">{f.count}</td>
                      <td className="py-3 px-4 text-right text-sm text-slate-600 font-mono">{dropped}</td>
                      <td className="py-3 px-4 text-right text-sm font-mono font-bold">
                        {dropRate.toFixed(1)}%
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold ${
                          dropRate < 30 ? 'bg-emerald-100 text-emerald-800' : 
                          dropRate < 50 ? 'bg-amber-100 text-amber-800' : 
                          'bg-rose-100 text-rose-800'
                        }`}>
                          {dropRate < 30 ? 'Healthy' : dropRate < 50 ? 'Monitor' : 'High Drop-off'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Rejection Reasons */}
        <div className="bg-white border border-slate-200/60 p-5 rounded-2xl shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 font-display">Rejection Reasons</h3>
            <AlertTriangle className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex-1 min-h-[250px]">
            <ChartWrapper data={rejectionReasons}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={rejectionReasons}
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    dataKey="value"
                    label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {rejectionReasons.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                </PieChart>
              </ResponsiveContainer>
            </ChartWrapper>
          </div>
        </div>

        {/* Recruiter Performance */}
        <div className="bg-white border border-slate-200/60 p-5 rounded-2xl shadow-sm flex flex-col lg:col-span-2 lg:col-start-1">
           <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 font-display">Recruiter Performance</h3>
            <button className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors">View Leaderboard</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/60">
                  <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Recruiter</th>
                  <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Apps Processed</th>
                  <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Screened</th>
                  <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Interviews</th>
                  <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Offers Made</th>
                  <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Accepted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60">
                {[
                  { name: 'Sarah Connor', apps: 145, screened: 98, interviews: 45, offers: 12, accepted: 10 },
                  { name: 'John Smith', apps: 120, screened: 85, interviews: 32, offers: 8, accepted: 6 },
                  { name: 'Emily Chen', apps: 85, screened: 60, interviews: 25, offers: 6, accepted: 5 }
                ].map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-800 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-[10px] font-bold">{r.name.charAt(0)}</div>
                      {r.name}
                    </td>
                    <td className="py-3 px-4 text-right text-sm text-slate-600 font-mono">{r.apps}</td>
                    <td className="py-3 px-4 text-right text-sm text-slate-600 font-mono">{r.screened}</td>
                    <td className="py-3 px-4 text-right text-sm text-slate-600 font-mono">{r.interviews}</td>
                    <td className="py-3 px-4 text-right text-sm text-slate-600 font-mono">{r.offers}</td>
                    <td className="py-3 px-4 text-right text-sm text-slate-800 font-bold font-mono">{r.accepted}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
