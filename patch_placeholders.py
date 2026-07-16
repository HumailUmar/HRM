import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Remove the Placeholder import
content = re.sub(r"const Placeholder = lazy\(\(\) => import\('\./components/Placeholder'\)\);\n?", "", content)

# Remove the blocks from App.tsx
blocks_to_remove = [
    r"\{\s*activeTab === 'team-members' && \([\s\S]*?\)\s*\}",
    r"\{\s*activeTab === 'team-onboarding' && \([\s\S]*?\)\s*\}",
    r"\{\s*activeTab === 'team-attendance' && \([\s\S]*?\)\s*\}",
    r"\{\s*activeTab === 'approvals' && \([\s\S]*?\)\s*\}",
    r"\{\s*activeTab === 'team-performance' && \([\s\S]*?\)\s*\}",
    r"\{\s*activeTab === 'my-profile' && \([\s\S]*?\)\s*\}",
    r"\{\s*activeTab === 'my-attendance' && \([\s\S]*?\)\s*\}",
    r"\{\s*activeTab === 'my-payslips' && \([\s\S]*?\)\s*\}",
    r"\{\s*activeTab === 'my-onboarding' && \([\s\S]*?\)\s*\}",
    r"\{\s*activeTab === 'my-performance' && \([\s\S]*?\)\s*\}"
]

for block in blocks_to_remove:
    content = re.sub(block, "", content)

# Remove the ROLE_PERMISSIONS keys
keys_to_remove = [
    r"\s*'team-members':.*?,",
    r"\s*'team-onboarding':.*?,",
    r"\s*'team-attendance':.*?,",
    r"\s*'approvals':.*?,",
    r"\s*'team-performance':.*?,",
    r"\s*'my-profile':.*?,",
    r"\s*'my-attendance':.*?,",
    r"\s*'my-payslips':.*?,",
    r"\s*'my-onboarding':.*?,",
    r"\s*'my-performance':.*?,"
]

for key in keys_to_remove:
    content = re.sub(key, "", content)

# Clean up multiple blank lines
content = re.sub(r'\n\s*\n\s*\n', '\n\n', content)

with open('src/App.tsx', 'w') as f:
    f.write(content)

