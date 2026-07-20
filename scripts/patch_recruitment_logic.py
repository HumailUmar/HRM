import re

with open("src/components/Recruitment.tsx", "r") as f:
    content = f.read()

# 1. Update handleAutoShortlist
shortlist_old = """  const handleAutoShortlist = () => {
    const requiredSkillNames = targetSkills.filter(s => s.required).map(s => s.name);

    const updated = candidates.map(cand => {
      if (cand.status === 'Applied' || cand.status === 'Parsed') {
        const hasMinExp = cand.experienceYears >= minExpYears;
        const hasSkills = requiredSkillNames.length === 0 || 
                          cand.skills.some(skill => requiredSkillNames.includes(skill));

        if (hasMinExp && hasSkills) {
          addSheetLog(settings.recruitmentSheetName, "UPDATE", {
            candidateId: cand.id,
            name: cand.name,
            status: 'Shortlisted'
          });
          return { ...cand, status: 'Shortlisted' } as Candidate;
        }
      }
      return cand;
    });

    setCandidates(updated);
    alert(`Shortlist run complete! Extracted experience and essential skills targets matched. Qualified candidates moved to Shortlisted.`);
  };"""

shortlist_new = """  const handleAutoShortlist = () => {
    let shortlistedCount = 0;
    const requiredSkillNames = targetSkills.filter(s => s.required).map(s => s.name);

    const updated = candidates.map(cand => {
      if (cand.status === 'Applied' || cand.status === 'Parsed') {
        
        if (activeJd) {
          let totalWeight = 0;
          let earnedWeight = 0;
          
          activeJd.requirements.forEach(req => {
            totalWeight += req.weight;
            if (req.category === 'Skill') {
              if (cand.skills.some(s => s.toLowerCase().includes(req.name.toLowerCase()))) {
                earnedWeight += req.weight;
              }
            } else if (req.category === 'Experience') {
              if (cand.experienceYears >= (req.minValue || 0)) {
                earnedWeight += req.weight;
              }
            }
          });
          
          let newScore = cand.matchScore;
          if (totalWeight > 0) {
            newScore = Math.round((earnedWeight / totalWeight) * 100);
          }
          
          // Require at least 50% match to automatically shortlist based on JD
          if (newScore >= 50) {
            shortlistedCount++;
            return { ...cand, status: 'Shortlisted', matchScore: newScore } as Candidate;
          }
          return { ...cand, matchScore: newScore }; // Keep updated match score
        } else {
          // Fallback old logic
          const hasMinExp = cand.experienceYears >= minExpYears;
          const hasSkills = requiredSkillNames.length === 0 || 
                            cand.skills.some(skill => requiredSkillNames.includes(skill));

          if (hasMinExp && hasSkills) {
            shortlistedCount++;
            return { ...cand, status: 'Shortlisted' } as Candidate;
          }
        }
      }
      return cand;
    });

    setCandidates(updated);
    if (activeJd) {
        alert(`Shortlist run complete! ${shortlistedCount} candidates shortlisted based on the active Job Description "${activeJd.title}".`);
    } else {
        alert(`Shortlist run complete! Extracted experience and essential skills targets matched. Qualified candidates moved to Shortlisted.`);
    }
  };"""

content = content.replace(shortlist_old, shortlist_new)

# 2. Add UI for JD Selection
jd_selector = """        {/* Match auto filter setup */}
        <div className="bg-white/90 backdrop-blur-md border border-slate-200/60 p-6 rounded-2xl shadow-xl shadow-slate-100/40 flex flex-col justify-between">
          
          {jobDescriptions.length > 0 && (
            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-500 mb-2">Active Job Description</label>
              <select
                value={selectedJdId}
                onChange={(e) => setSelectedJdId(e.target.value)}
                className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm mb-4"
              >
                <option value="">-- Legacy Manual Filter Mode --</option>
                {jobDescriptions.filter(j => j.isActive).map(j => (
                  <option key={j.id} value={j.id}>{j.title} ({j.department})</option>
                ))}
              </select>
            </div>
          )}

          <div className="border-b border-slate-100 pb-3 mb-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 font-display">
              <Filter className="w-4 h-4 text-violet-600" />
              Automated Match Settings
            </h3>
            <p className="text-[11px] text-slate-400 font-sans mt-0.5">
              {activeJd ? 'Candidates will be ranked based on JD requirements.' : 'Establish parameters to trigger mass parsing shortlist.'}
            </p>
          </div>

          {!activeJd && (
"""
# Replace the original Match auto filter setup block with the one conditionally wrapping the old logic
content = content.replace("""        {/* Match auto filter setup */}
        <div className="bg-white/90 backdrop-blur-md border border-slate-200/60 p-6 rounded-2xl shadow-xl shadow-slate-100/40 flex flex-col justify-between">
          <div className="border-b border-slate-100 pb-3 mb-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 font-display">
              <Filter className="w-4 h-4 text-violet-600" />
              Automated Match Settings
            </h3>
            <p className="text-[11px] text-slate-400 font-sans mt-0.5">Establish parameters to trigger mass parsing shortlist.</p>
          </div>

          <div className="space-y-4">""", jd_selector + "          <div className=\"space-y-4\">\n")

# Close the !activeJd block after the skills checkboxes but before the button
end_condition = """              </div>
            </div>
          )}
          <button"""
content = content.replace("""              </div>
            </div>

          <button""", end_condition)

with open("src/components/Recruitment.tsx", "w") as f:
    f.write(content)
