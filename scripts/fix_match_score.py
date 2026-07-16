import re

with open("src/components/Recruitment.tsx", "r") as f:
    content = f.read()

content = content.replace("const matchScore = cand.screeningTotalScore || 0;", "const matchScore = cand.matchScore || cand.screeningTotalScore || 0;")

with open("src/components/Recruitment.tsx", "w") as f:
    f.write(content)
