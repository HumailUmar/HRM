import re

with open("src/components/Recruitment.tsx", "r") as f:
    content = f.read()

# Replace matchScore logic
content = re.sub(
    r"const matchScore = cand\.matchScore \|\| cand\.screeningTotalScore \|\| 0;",
    r"const activeMatch = jdMatches.find(m => m.candidateId === cand.id && m.jobId === activeJd?.id);\n                    const matchScore = activeMatch ? activeMatch.overallScore : (cand.matchScore || cand.screeningTotalScore || 0);\n                    const matchLevel = activeMatch ? activeMatch.matchLevel : null;",
    content
)

with open("src/components/Recruitment.tsx", "w") as f:
    f.write(content)
