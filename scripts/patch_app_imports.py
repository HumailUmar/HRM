import re

with open("src/App.tsx", "r") as f:
    content = f.read()

content = content.replace(
    "getEmployeeDocuments, saveEmployeeDocuments,",
    "getEmployeeDocuments, saveEmployeeDocuments,\n  getJobDescriptions, saveJobDescriptions,"
)

content = content.replace(
    "Department, Designation, EmployeeDocument } from './types';",
    "Department, Designation, EmployeeDocument, JobDescription } from './types';"
)

content = content.replace(
    "const [documents, setDocuments] = useState<EmployeeDocument[]>(getEmployeeDocuments);",
    "const [documents, setDocuments] = useState<EmployeeDocument[]>(getEmployeeDocuments);\n  const [jobDescriptions, setJobDescriptions] = useState<JobDescription[]>(getJobDescriptions);"
)

content = content.replace(
    "saveEmployeeDocuments(documents);\n    if (!settings.isMockMode && token) {\n      syncAllEmployeeDocumentsToGSheet(documents).catch(err => console.error(\"Auto documents sync failed:\", err));\n    }\n  }, [documents]);",
    "saveEmployeeDocuments(documents);\n    if (!settings.isMockMode && token) {\n      syncAllEmployeeDocumentsToGSheet(documents).catch(err => console.error(\"Auto documents sync failed:\", err));\n    }\n  }, [documents]);\n\n  useEffect(() => {\n    saveJobDescriptions(jobDescriptions);\n  }, [jobDescriptions]);"
)

# Render parts
render_parts = """          {activeTab === 'job_descriptions' && (
            <JobDescriptions
              jobDescriptions={jobDescriptions}
              setJobDescriptions={setJobDescriptions}
              employees={employees}
            />
          )}
          {activeTab === 'audit_trail' && (
            <AuditTrail />
          )}
          {activeTab === 'jd_matching' && (
            <JDMatching />
          )}"""

content = content.replace(
    "{activeTab === 'recruitment' && (",
    render_parts + "\n          {activeTab === 'recruitment' && ("
)

with open("src/App.tsx", "w") as f:
    f.write(content)
