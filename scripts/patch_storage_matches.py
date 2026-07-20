import re

with open("src/lib/storage.ts", "r") as f:
    content = f.read()

if "export const getJDMatches" not in content:
    content = content.replace(
        "export const saveJobDescriptions = (jds: JobDescription[]) => saveData('job_descriptions', jds);",
        "export const saveJobDescriptions = (jds: JobDescription[]) => saveData('job_descriptions', jds);\n\nexport const getJDMatches = (): JDResumeMatch[] => loadData('jd_matches', []);\nexport const saveJDMatches = (matches: JDResumeMatch[]) => saveData('jd_matches', matches);"
    )
    content = content.replace(
        "Designation, JobDescription } from '../types';",
        "Designation, JobDescription, JDResumeMatch } from '../types';"
    )
    with open("src/lib/storage.ts", "w") as f:
        f.write(content)
