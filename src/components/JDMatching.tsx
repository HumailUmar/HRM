import React, { useState, useEffect } from 'react';
import { getJDMatches, getJobDescriptions, getCandidates, saveJDMatches, saveCandidates } from '../lib/storage';
import { JDResumeMatch, JobDescription, Candidate } from '../types';
import { FileText, Search, Filter, CheckCircle2, XCircle, AlertCircle, TrendingUp, BarChart2, Star, UserPlus, FileSearch, ArrowRight, Activity, ChevronRight, X, Play, Target } from 'lucide-react';
import { calculateMatch } from '../utils/matchingAlgorithm';

export default function JDMatching() {
  const [jds, setJds] = useState<JobDescription[]>([]);
  const [matches, setMatches] = useState<JDResumeMatch[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedJdId, setSelectedJdId] = useState<string>('');
  const [selectedMatch, setSelectedMatch] = useState<JDResumeMatch | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState<string>('All');
  
  useEffect(() => {
    const loadedJds = getJobDescriptions();
    setJds(loadedJds);
    if (loadedJds.length > 0) {
      setSelectedJdId(loadedJds[0].id);
    }
    setMatches(getJDMatches());
    setCandidates(getCandidates());
  }, []);

  const handleRunMatching = () => {
    if (!selectedJdId) return;
    const jd = jds.find(j => j.id === selectedJdId);
    if (!jd) return;
    
    // For this JD, find all candidates that are in Applied state (or all, for demo)
    // We'll just match all candidates for now
    const newMatches = candidates.map(c => calculateMatch(c, jd));
    
    // Merge new matches with existing
    let updatedMatches = [...matches];
    newMatches.forEach(nm => {
      const idx = updatedMatches.findIndex(m => m.candidateId === nm.candidateId && m.jobId === nm.jobId);
      if (idx >= 0) updatedMatches[idx] = nm;
      else updatedMatches.push(nm);
    });
    
    setMatches(updatedMatches);
    saveJDMatches(updatedMatches);
    
    // Auto-shortlist logic
    if (jd.matchingConfig?.autoShortlist) {
      const updatedCandidates = candidates.map(c => {
        const match = updatedMatches.find(m => m.candidateId === c.id && m.jobId === jd.id);
        if (match && match.overallScore >= (jd.matchingConfig?.strongMatchThreshold || 80)) {
          return { ...c, status: 'Shortlisted' } as Candidate;
        }
        return c;
      });
      setCandidates(updatedCandidates);
      saveCandidates(updatedCandidates);
    }
  };

  const jdMatches = matches.filter(m => m.jobId === selectedJdId);
  const filteredMatches = jdMatches.filter(m => {
    if (searchTerm && !m.candidateName.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (filterLevel !== 'All' && m.matchLevel !== filterLevel) return false;
    return true;
  }).sort((a, b) => b.overallScore - a.overallScore);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (score >= 65) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (score >= 50) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-rose-600 bg-rose-50 border-rose-200';
  };

  const getScoreRingColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500';
    if (score >= 65) return 'text-blue-500';
    if (score >= 50) return 'text-amber-500';
    return 'text-rose-500';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 font-display flex items-center gap-3">
            <Target className="w-8 h-8 text-indigo-600 p-1.5 bg-indigo-100 rounded-xl" />
            JD-Resume Semantic Matching
          </h1>
          <p className="text-sm text-slate-500 mt-1">AI-powered candidate ranking and scoring.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-5 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex-1 w-full flex flex-col md:flex-row gap-4 items-center">
          <div className="w-full md:w-64">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Select Job Description</label>
            <select 
              value={selectedJdId} 
              onChange={e => setSelectedJdId(e.target.value)}
              className="w-full text-sm border-slate-200 rounded-xl bg-slate-50 py-2.5 px-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            >
              {jds.map(j => (
                <option key={j.id} value={j.id}>{j.title}</option>
              ))}
            </select>
          </div>
          <button 
            onClick={handleRunMatching}
            className="w-full md:w-auto mt-6 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-md transition-all active:scale-95 text-sm"
          >
            <Play className="w-4 h-4 fill-white" />
            Run Matching Engine
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/60 flex flex-col items-center justify-center text-center">
          <div className="text-3xl font-black text-slate-700">{jdMatches.length}</div>
          <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mt-1">Total Matched</div>
        </div>
        <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex flex-col items-center justify-center text-center">
          <div className="text-3xl font-black text-emerald-700">{jdMatches.filter(m => m.matchLevel === 'Strong Match').length}</div>
          <div className="text-[10px] uppercase font-bold tracking-wider text-emerald-600 mt-1">Strong Matches</div>
        </div>
        <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex flex-col items-center justify-center text-center">
          <div className="text-3xl font-black text-blue-700">{jdMatches.filter(m => m.matchLevel === 'Good Match').length}</div>
          <div className="text-[10px] uppercase font-bold tracking-wider text-blue-600 mt-1">Good Matches</div>
        </div>
        <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex flex-col items-center justify-center text-center">
          <div className="text-3xl font-black text-amber-700">{jdMatches.filter(m => m.matchLevel === 'Potential Match').length}</div>
          <div className="text-[10px] uppercase font-bold tracking-wider text-amber-600 mt-1">Potential Matches</div>
        </div>
        <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100 flex flex-col items-center justify-center text-center">
          <div className="text-3xl font-black text-rose-700">{jdMatches.filter(m => m.matchLevel === 'Weak Match' || m.matchLevel === 'Not a Match').length}</div>
          <div className="text-[10px] uppercase font-bold tracking-wider text-rose-600 mt-1">Weak/No Match</div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden flex flex-col h-[600px]">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search candidates..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={filterLevel}
                onChange={e => setFilterLevel(e.target.value)}
                className="text-sm border-slate-200 rounded-xl bg-white py-2 px-3 outline-none"
              >
                <option value="All">All Levels</option>
                <option value="Strong Match">Strong Matches</option>
                <option value="Good Match">Good Matches</option>
                <option value="Potential Match">Potential Matches</option>
                <option value="Weak Match">Weak Matches</option>
              </select>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {filteredMatches.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8">
                <FileSearch className="w-12 h-12 mb-3 text-slate-300" />
                <p className="text-sm">No matches found for this job description.</p>
                <p className="text-xs mt-1">Run the matching engine or adjust your filters.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="bg-white sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">Candidate</th>
                    <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 text-center">Score</th>
                    <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">Match Level</th>
                    <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">Skills</th>
                    <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMatches.map(match => (
                    <tr 
                      key={match.id} 
                      className={`hover:bg-slate-50 transition-colors cursor-pointer ${selectedMatch?.id === match.id ? 'bg-indigo-50/50' : ''}`}
                      onClick={() => setSelectedMatch(match)}
                    >
                      <td className="py-3 px-4">
                        <div className="font-semibold text-sm text-slate-800">{match.candidateName}</div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center justify-center">
                          <div className={`text-lg font-black ${getScoreRingColor(match.overallScore)}`}>
                            {match.overallScore}<span className="text-xs font-medium opacity-60">%</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getScoreColor(match.overallScore)}`}>
                          {match.matchLevel}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-xs text-slate-600 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> {match.matchingSkills.length}
                          <XCircle className="w-3.5 h-3.5 text-rose-500 ml-2" /> {match.missingSkills.length}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <ChevronRight className="w-4 h-4 text-slate-300 inline-block" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
        
        {/* Detail View */}
        <div className="w-full lg:w-[450px] shrink-0">
          {selectedMatch ? (
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200/60 overflow-hidden flex flex-col sticky top-6 max-h-[calc(100vh-100px)]">
              <div className="p-5 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">{selectedMatch.candidateName}</h3>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getScoreColor(selectedMatch.overallScore)}`}>
                      {selectedMatch.matchLevel}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">{selectedMatch.overallScore}% Overall Match</span>
                  </div>
                </div>
                <button onClick={() => setSelectedMatch(null)} className="p-1 hover:bg-slate-200 rounded-full text-slate-400 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-5 space-y-6">
                
                {/* AI Summary */}
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="w-4 h-4 text-indigo-600 fill-indigo-600" />
                    <span className="text-xs font-bold text-indigo-800 uppercase tracking-wider">AI Analysis</span>
                  </div>
                  <p className="text-sm text-indigo-900 leading-relaxed mb-3">{selectedMatch.aiSummary}</p>
                  
                  <div className="flex items-start gap-2 bg-white/60 p-3 rounded-lg border border-indigo-100/50">
                    <div className="mt-0.5">
                      {selectedMatch.aiRecommendation === 'Advance' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : 
                       selectedMatch.aiRecommendation === 'Consider' ? <AlertCircle className="w-4 h-4 text-amber-600" /> : 
                       <XCircle className="w-4 h-4 text-rose-600" />}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800">Recommendation: {selectedMatch.aiRecommendation}</div>
                      <div className="text-[11px] text-slate-600 mt-0.5">{selectedMatch.aiReasoning}</div>
                    </div>
                  </div>
                </div>
                
                {/* Score Breakdown */}
                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">Score Breakdown</h4>
                  <div className="space-y-3">
                    {selectedMatch.scoringDetails.map(detail => (
                      <div key={detail.category} className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-medium text-slate-600">{detail.category}</span>
                          <span className="font-bold text-slate-800">{detail.score}/100 <span className="text-slate-400 font-normal">(w: {detail.weight}%)</span></span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${getScoreRingColor(detail.score).replace('text-', 'bg-')}`} 
                            style={{ width: `${detail.score}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Skill Gap Analysis */}
                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center justify-between">
                    <span>Skill Gap Analysis</span>
                    <span className="text-slate-400">{selectedMatch.matchingSkills.length} of {selectedMatch.matchingSkills.length + selectedMatch.missingSkills.length}</span>
                  </h4>
                  <div className="space-y-3">
                    {selectedMatch.matchingSkills.length > 0 && (
                      <div>
                        <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Matched Skills
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedMatch.matchingSkills.map(s => (
                            <span key={s} className="px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded text-xs">{s}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {selectedMatch.missingSkills.length > 0 && (
                      <div>
                        <div className="text-[10px] font-bold text-rose-600 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                          <XCircle className="w-3 h-3" /> Missing Requirements
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedMatch.missingSkills.map(s => (
                            <span key={s} className="px-2 py-1 bg-rose-50 text-rose-700 border border-rose-100 rounded text-xs">{s}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
              </div>
              
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-2">
                <button className="flex-1 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs py-2 rounded-lg transition-colors">
                  Reject
                </button>
                <button className="flex-1 bg-indigo-600 text-white hover:bg-indigo-700 font-bold text-xs py-2 rounded-lg transition-colors shadow-sm">
                  Shortlist
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full bg-white rounded-2xl border border-dashed border-slate-300 flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <BarChart2 className="w-12 h-12 mb-3 text-slate-200" />
              <p className="text-sm font-medium text-slate-500">Select a candidate</p>
              <p className="text-xs mt-1">View detailed semantic match breakdown, AI reasoning, and skill gap analysis.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
