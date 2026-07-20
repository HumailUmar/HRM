import re

with open("src/lib/storage.ts", "r") as f:
    content = f.read()

# Add types
content = content.replace("Designation\n} from '../types';", "Designation,\n  JobDescription\n} from '../types';")
content = content.replace("INITIAL_DESIGNATIONS } from './mockData';", "INITIAL_DESIGNATIONS,\n  INITIAL_JOB_DESCRIPTIONS\n} from './mockData';")

jd_storage = """
export const getJobDescriptions = (): JobDescription[] => loadData<JobDescription[]>('job_descriptions', INITIAL_JOB_DESCRIPTIONS);
export const saveJobDescriptions = (jds: JobDescription[]) => saveData('job_descriptions', jds);
"""

if "getJobDescriptions" not in content:
    content = content.replace("export const getSettings", jd_storage + "\nexport const getSettings")

with open("src/lib/storage.ts", "w") as f:
    f.write(content)
