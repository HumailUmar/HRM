import re

with open("src/components/Recruitment.tsx", "r") as f:
    content = f.read()

content = content.replace("const colCandidates = searchedCandidates.filter(c => col.statuses.includes(c.status));", "const colCandidates = searchedCandidates.filter(c => col.statuses.includes(c.status)).sort((a, b) => (b.matchScore || b.screeningTotalScore || 0) - (a.matchScore || a.screeningTotalScore || 0));")

with open("src/components/Recruitment.tsx", "w") as f:
    f.write(content)
