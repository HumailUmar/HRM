import re

with open("src/types.ts", "r") as f:
    content = f.read()

content = content.replace("  companySettings?: CompanySettings;", "  companySettings?: CompanySettings;\n  statusRules?: StatusManagementRules;")

with open("src/types.ts", "w") as f:
    f.write(content)
