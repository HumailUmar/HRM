import re

with open("src/components/Recruitment.tsx", "r") as f:
    content = f.read()

old_pipeline = """
      const updated = [...mockParsedCandidates, ...candidates];
      setCandidates(updated);
"""

new_pipeline = """
      let currentMatches = [...jdMatches];
      
      const processedCandidates = mockParsedCandidates.map(cand => {
        if (activeJd) {
          const matchResult = calculateMatch(cand, activeJd);
          currentMatches.push(matchResult);
          
          const threshold = activeJd.matchingConfig?.autoShortlist ? (activeJd.matchingConfig?.strongMatchThreshold || 80) : 1000;
          if (matchResult.overallScore >= threshold) {
             return { ...cand, status: 'Shortlisted' } as Candidate;
          }
        }
        return cand;
      });

      const updated = [...processedCandidates, ...candidates];
      setCandidates(updated);
      
      if (activeJd) {
         setJdMatches(currentMatches);
         saveJDMatches(currentMatches);
      }
"""

content = content.replace(old_pipeline, new_pipeline)

with open("src/components/Recruitment.tsx", "w") as f:
    f.write(content)
