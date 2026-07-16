import re

with open("src/lib/mockData.ts", "r") as f:
    content = f.read()

content = content.replace("  companySettings: DEFAULT_COMPANY_SETTINGS", "  companySettings: DEFAULT_COMPANY_SETTINGS,\n  statusRules: {\n    enableStatusManagement: true,\n    autoExpireOnLeave: false,\n    autoExpireProbation: true,\n    autoResignToTerminated: true,\n    enableBulkStatusUpdate: true,\n    allowRehireTerminated: false\n  }")

with open("src/lib/mockData.ts", "w") as f:
    f.write(content)
