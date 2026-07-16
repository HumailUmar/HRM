import re

with open("src/App.tsx", "r") as f:
    content = f.read()

content = content.replace(
    "              onboardingTemplates={onboardingTemplates}\n              jobDescriptions={jobDescriptions}\n              setJobDescriptions={setJobDescriptions}\n              departments={departments}",
    "              onboardingTemplates={onboardingTemplates}\n              departments={departments}"
)

with open("src/App.tsx", "w") as f:
    f.write(content)
