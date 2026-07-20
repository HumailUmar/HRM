import re

with open("src/lib/storage.ts", "r") as f:
    content = f.read()

content = content.replace(
    "oldStatus: 'Active', newStatus: 'On Leave'",
    "fieldName: 'status', fieldLabel: 'Status', oldValue: 'Active', newValue: 'On Leave'"
)

content = content.replace(
    "oldStatus: 'Onboarding', newStatus: 'Active'",
    "fieldName: 'status', fieldLabel: 'Status', oldValue: 'Onboarding', newValue: 'Active'"
)

with open("src/lib/storage.ts", "w") as f:
    f.write(content)
