with open("src/components/Recruitment.tsx", "r") as f:
    c = f.read()
    
print("const activeMatch" in c)
print("cand.matchScore || cand.screeningTotalScore || 0" in c)
