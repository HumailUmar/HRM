import re

with open("src/lib/storage.ts", "r") as f:
    content = f.read()

content = content.replace(
    "reason: 'Approved Leave', notes: 'Annual Vacation' }",
    "reason: 'Approved Leave', notes: 'Annual Vacation', changeType: 'Update', source: 'System' }"
)

content = content.replace(
    "reason: 'Completed Onboarding', notes: 'All documents verified' }",
    "reason: 'Completed Onboarding', notes: 'All documents verified', changeType: 'Update', source: 'System' }"
)

with open("src/lib/storage.ts", "w") as f:
    f.write(content)
