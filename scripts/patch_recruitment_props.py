import re

with open("src/components/Recruitment.tsx", "r") as f:
    content = f.read()

content = content.replace("import { Candidate, AppSettings", "import { Candidate, AppSettings, JobDescription")

props_old = """interface RecruitmentProps {
  candidates: Candidate[];
  setCandidates: (candidates: Candidate[]) => void;
  settings: AppSettings;
  employees: Employee[];
  setEmployees: (employees: Employee[]) => void;
  onboardingTemplates?: OnboardingTemplate[];
}

export default function Recruitment({
  candidates,
  setCandidates,
  settings,
  employees,
  setEmployees,
  onboardingTemplates
}: RecruitmentProps) {"""

props_new = """interface RecruitmentProps {
  candidates: Candidate[];
  setCandidates: (candidates: Candidate[]) => void;
  settings: AppSettings;
  employees: Employee[];
  setEmployees: (employees: Employee[]) => void;
  onboardingTemplates?: OnboardingTemplate[];
  jobDescriptions?: JobDescription[];
}

export default function Recruitment({
  candidates,
  setCandidates,
  settings,
  employees,
  setEmployees,
  onboardingTemplates,
  jobDescriptions = []
}: RecruitmentProps) {"""

content = content.replace(props_old, props_new)

# Add selected JD state
state_jd = """
  // Job Description Integration
  const [selectedJdId, setSelectedJdId] = useState<string>('');
  
  const activeJd = useMemo(() => {
    return jobDescriptions.find(j => j.id === selectedJdId) || null;
  }, [selectedJdId, jobDescriptions]);
"""

content = content.replace("  const [activeScreeningTab, setActiveScreeningTab]", state_jd + "\n  const [activeScreeningTab, setActiveScreeningTab]")

# Modify handleShortlist to use activeJd logic
shortlist_old = """  const handleShortlist = () => {
    let shortlistedCount = 0;
    const updatedCandidates = candidates.map(c => {
      let isShortlisted = false;
      const passExp = c.experienceYears >= minExpYears;
      let passSkills = false;
      
      const skillMatches = c.skills.filter(s => {
        const lowerS = s.toLowerCase();
        return (requireReact && lowerS.includes('react')) || 
               (requireNode && lowerS.includes('node')) || 
               (requireTypescript && lowerS.includes('typescript'));
      });
      
      if (requireReact || requireNode || requireTypescript) {
        passSkills = skillMatches.length > 0;
      } else {
        passSkills = true;
      }
      
      if (passExp && passSkills && c.status === 'Applied') {
        isShortlisted = true;
        shortlistedCount++;
      }
      
      return isShortlisted ? { ...c, status: 'Shortlisted' as const, matchScore: Math.min(100, c.matchScore + 25) } : c;
    });"""

shortlist_new = """  const handleShortlist = () => {
    let shortlistedCount = 0;
    const updatedCandidates = candidates.map(c => {
      let isShortlisted = false;
      let newScore = c.matchScore;
      
      if (c.status === 'Applied') {
        if (activeJd) {
          // Dynamic matching based on JD requirements
          let totalWeight = 0;
          let earnedWeight = 0;
          
          activeJd.requirements.forEach(req => {
            totalWeight += req.weight;
            if (req.category === 'Skill') {
              if (c.skills.some(s => s.toLowerCase().includes(req.name.toLowerCase()))) {
                earnedWeight += req.weight;
              }
            } else if (req.category === 'Experience') {
              if (c.experienceYears >= (req.minValue || 0)) {
                earnedWeight += req.weight;
              }
            }
          });
          
          if (totalWeight > 0) {
            newScore = Math.round((earnedWeight / totalWeight) * 100);
          }
          
          // Require at least 60% match to automatically shortlist, or based on old logic if you want
          if (newScore >= 60) {
            isShortlisted = true;
            shortlistedCount++;
          }
        } else {
          // Fallback old logic
          const passExp = c.experienceYears >= minExpYears;
          let passSkills = false;
          
          const skillMatches = c.skills.filter(s => {
            const lowerS = s.toLowerCase();
            return (requireReact && lowerS.includes('react')) || 
                   (requireNode && lowerS.includes('node')) || 
                   (requireTypescript && lowerS.includes('typescript'));
          });
          
          if (requireReact || requireNode || requireTypescript) {
            passSkills = skillMatches.length > 0;
          } else {
            passSkills = true;
          }
          
          if (passExp && passSkills) {
            isShortlisted = true;
            newScore = Math.min(100, c.matchScore + 25);
            shortlistedCount++;
          }
        }
      }
      
      return isShortlisted ? { ...c, status: 'Shortlisted' as const, matchScore: newScore } : c;
    });"""

content = content.replace(shortlist_old, shortlist_new)

# JD Selection UI before shortlisting
jd_ui = """
          {/* JD Selection */}
          {jobDescriptions.length > 0 && (
            <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <label className="block text-xs font-bold text-slate-500 mb-2">Select Active Job Description for Parsing</label>
              <select
                value={selectedJdId}
                onChange={(e) => setSelectedJdId(e.target.value)}
                className="w-full max-w-sm h-10 px-3 border border-slate-200 rounded-xl text-sm"
              >
                <option value="">-- No JD Selected (Legacy Mode) --</option>
                {jobDescriptions.filter(j => j.isActive).map(j => (
                  <option key={j.id} value={j.id}>{j.title} ({j.department})</option>
                ))}
              </select>
            </div>
          )}
"""
content = content.replace("          {/* Shortlisting Controls */}", jd_ui + "\n          {/* Shortlisting Controls */}")

with open("src/components/Recruitment.tsx", "w") as f:
    f.write(content)
