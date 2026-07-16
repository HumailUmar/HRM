import re

with open("src/components/Recruitment.tsx", "r") as f:
    content = f.read()

content = content.replace("import { addSheetLog } from '../lib/storage';", "import { addSheetLog, getJDMatches, saveJDMatches, saveCandidates } from '../lib/storage';")

with open("src/components/Recruitment.tsx", "w") as f:
    f.write(content)
