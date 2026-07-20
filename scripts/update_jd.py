import re

with open("src/components/JobDescriptions.tsx", "r") as f:
    content = f.read()

# Add step
content = content.replace(
    "['Basic Info', 'Responsibilities', 'Requirements', 'Evaluation', 'Team & Workflow']",
    "['Basic Info', 'Responsibilities', 'Requirements', 'Evaluation', 'Team & Workflow', 'Matching Config']"
)

# Find the switch or if statement for currentStep
# Let's search for currentStep === 5 to see what we can do

content = content.replace("currentStep === 5 && (", "currentStep === 5 && (\n              <div className=\"space-y-6\">\n")
