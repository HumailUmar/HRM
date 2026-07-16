import re

with open("src/components/JobDescriptions.tsx", "r") as f:
    content = f.read()

content = content.replace(
    "['Basic Info', 'Responsibilities', 'Requirements', 'Evaluation', 'Team & Workflow']",
    "['Basic Info', 'Responsibilities', 'Requirements', 'Evaluation', 'Team', 'Matching']"
)

# Replace the condition for step 5
content = content.replace(
    "currentStep === 5 && (",
    "currentStep === 5 && ("
) # no change yet

# We will need to replace the entire switch/if for currentStep === 5 and add currentStep === 6
