import re

with open("src/components/Recruitment.tsx", "r") as f:
    content = f.read()

# Imports
if "getJDMatches" not in content:
    content = content.replace("saveJobDescriptions, ", "saveJobDescriptions, getJDMatches, saveJDMatches, ")
    content = content.replace("Designation } from '../types';", "Designation, JDResumeMatch } from '../types';\nimport { calculateMatch } from '../utils/matchingAlgorithm';")

# State for matches
if "const [jdMatches, setJdMatches]" not in content:
    content = content.replace("const [candidates, setCandidates] = useState<Candidate[]>([]);", "const [candidates, setCandidates] = useState<Candidate[]>([]);\n  const [jdMatches, setJdMatches] = useState<JDResumeMatch[]>([]);")
    content = content.replace("setCandidates(getCandidates());", "setCandidates(getCandidates());\n    setJdMatches(getJDMatches());")

# Render match level and score from JDResumeMatch instead of cand.matchScore
render_old = """
                    const matchScore = cand.matchScore || cand.screeningTotalScore || 0;
                    return (
                      <div
"""

render_new = """
                    const activeMatch = jdMatches.find(m => m.candidateId === cand.id && m.jobId === activeJdId);
                    const matchScore = activeMatch ? activeMatch.overallScore : (cand.matchScore || cand.screeningTotalScore || 0);
                    const matchLevel = activeMatch ? activeMatch.matchLevel : null;
                    return (
                      <div
"""
content = content.replace(render_old, render_new)

# Add badge for Match Level
badge_old = """
                        {/* Circular Match Score in top right */}
                        {matchScore > 0 && (
                          <div className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center text-[8px] font-mono font-bold text-violet-700 bg-violet-50 border border-violet-100 rounded-full">
                            {matchScore}%
                          </div>
                        )}
"""
badge_new = """
                        {/* Match Score & Badge in top right */}
                        {matchScore > 0 && (
                          <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
                            <div className="w-7 h-7 flex items-center justify-center text-[8px] font-mono font-bold text-violet-700 bg-violet-50 border border-violet-100 rounded-full">
                              {matchScore}%
                            </div>
                            {matchLevel && (
                              <div className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded border ${
                                matchLevel.includes('Strong') ? 'text-emerald-700 bg-emerald-50 border-emerald-200' :
                                matchLevel.includes('Good') ? 'text-blue-700 bg-blue-50 border-blue-200' :
                                matchLevel.includes('Potential') ? 'text-amber-700 bg-amber-50 border-amber-200' :
                                'text-rose-700 bg-rose-50 border-rose-200'
                              }`}>
                                {matchLevel.split(' ')[0]}
                              </div>
                            )}
                          </div>
                        )}
"""
content = content.replace(badge_old, badge_new)

with open("src/components/Recruitment.tsx", "w") as f:
    f.write(content)
