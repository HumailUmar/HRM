import re

with open("src/components/Recruitment.tsx", "r") as f:
    content = f.read()

old_func = """  const handleAutoShortlist = () => {
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
    saveCandidates(updated);
    
    if (activeJd) {
        alert(`Shortlist run complete! ${shortlistedCount} candidates shortlisted based on the active Job Description "${activeJd.title}".`);
    } else {
        alert(`Shortlist run complete! Extracted experience and essential skills targets matched. Qualified candidates moved to Shortlisted.`);
    }
  };"""

new_func = """  const handleAutoShortlist = () => {
    let shortlistedCount = 0;
    const requiredSkillNames = targetSkills.filter(s => s.required).map(s => s.name);
    
    let currentMatches = [...jdMatches];

    const updated = candidates.map(cand => {
      if (cand.status === 'Applied' || cand.status === 'Parsed') {
        
        if (activeJd) {
          const matchResult = calculateMatch(cand, activeJd);
          
          // Add or update match
          const existIdx = currentMatches.findIndex(m => m.candidateId === cand.id && m.jobId === activeJd.id);
          if (existIdx >= 0) currentMatches[existIdx] = matchResult;
          else currentMatches.push(matchResult);

          const threshold = activeJd.matchingConfig?.autoShortlist ? (activeJd.matchingConfig?.strongMatchThreshold || 80) : 50;

          if (matchResult.overallScore >= threshold) {
            shortlistedCount++;
            return { ...cand, status: 'Shortlisted' } as Candidate;
          }
          return cand;
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
    saveCandidates(updated);
    setJdMatches(currentMatches);
    saveJDMatches(currentMatches);
    
    if (activeJd) {
        alert(`Shortlist run complete! ${shortlistedCount} candidates shortlisted based on semantic matching against "${activeJd.title}".`);
    } else {
        alert(`Shortlist run complete! Extracted experience and essential skills targets matched. Qualified candidates moved to Shortlisted.`);
    }
  };"""

content = content.replace(old_func, new_func)

with open("src/components/Recruitment.tsx", "w") as f:
    f.write(content)
