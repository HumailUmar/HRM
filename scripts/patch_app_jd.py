import re

with open("src/App.tsx", "r") as f:
    content = f.read()

content = content.replace("import AuditTrail from './components/AuditTrail';", "import AuditTrail from './components/AuditTrail';\nimport JobDescriptions from './components/JobDescriptions';")

content = content.replace("getSuccessionPlans, saveSuccessionPlans,", "getSuccessionPlans, saveSuccessionPlans,\n  getJobDescriptions, saveJobDescriptions,")

# State
state_jd = """
  const [jobDescriptions, setJobDescriptions] = useState<any[]>([]);

  useEffect(() => {
    setJobDescriptions(getJobDescriptions());
  }, []);

  useEffect(() => {
    saveJobDescriptions(jobDescriptions);
  }, [jobDescriptions]);
"""

content = content.replace("const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);", "const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);\n" + state_jd)


render_jd = """      {activeTab === 'recruitment' && <Recruitment candidates={candidates} setCandidates={setCandidates} jobDescriptions={jobDescriptions} />}
      {activeTab === 'job_descriptions' && <JobDescriptions jobDescriptions={jobDescriptions} setJobDescriptions={setJobDescriptions} employees={employees} />}"""

content = content.replace("{activeTab === 'recruitment' && <Recruitment candidates={candidates} setCandidates={setCandidates} />}", render_jd)

with open("src/App.tsx", "w") as f:
    f.write(content)

with open("src/components/Sidebar.tsx", "r") as f:
    sidebar = f.read()

# Replace Recruitment nav items
nav_items_old = "    { id: 'recruitment', label: 'Recruitment Pipeline', icon: UserPlus },"
nav_items_new = "    { id: 'recruitment', label: 'Recruitment Pipeline', icon: UserPlus },\n    { id: 'job_descriptions', label: 'Job Descriptions', icon: Briefcase },"
sidebar = sidebar.replace(nav_items_old, nav_items_new)

with open("src/components/Sidebar.tsx", "w") as f:
    f.write(sidebar)
