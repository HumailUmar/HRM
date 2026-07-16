import re

with open("src/components/Recruitment.tsx", "r") as f:
    content = f.read()

content = content.replace(
    "{activeTab === 'pipeline' && (\n\n      \n      {/* Header section */}",
    "{activeTab === 'pipeline' && (\n      <>\n      {/* Header section */}"
)

content = content.replace(
    "      )}\n      {activeTab === 'jds'",
    "      </>\n      )}\n      {activeTab === 'jds'"
)

with open("src/components/Recruitment.tsx", "w") as f:
    f.write(content)
