import re

# Clean up Sidebar.tsx
with open("src/components/Sidebar.tsx", "r") as f:
    sidebar = f.read()

sidebar = re.sub(
    r"\s*{\s*id:\s*'job_descriptions',\s*label:\s*'Job Descriptions',\s*icon:\s*Briefcase\s*},",
    "",
    sidebar
)
sidebar = re.sub(
    r"\s*{\s*id:\s*'jd_matching',\s*label:\s*'JD Semantic Matching',\s*icon:\s*Search\s*},",
    "",
    sidebar
)

with open("src/components/Sidebar.tsx", "w") as f:
    f.write(sidebar)

# Clean up App.tsx
with open("src/App.tsx", "r") as f:
    app = f.read()

app = re.sub(
    r"\s*{\s*activeTab === 'job_descriptions' && \([^)]*\)\s*}",
    "",
    app
)
app = re.sub(
    r"\s*{\s*activeTab === 'jd_matching' && \(\s*<JDMatching />\s*\)\s*}",
    "",
    app
)

# Also ensure we are passing setJobDescriptions correctly to Recruitment
app = app.replace(
    "onboardingTemplates={onboardingTemplates}",
    "onboardingTemplates={onboardingTemplates}\n              jobDescriptions={jobDescriptions}\n              setJobDescriptions={setJobDescriptions}"
)

with open("src/App.tsx", "w") as f:
    f.write(app)

