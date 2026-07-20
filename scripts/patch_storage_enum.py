import re

with open("src/lib/storage.ts", "r") as f:
    content = f.read()

content = content.replace(
    "changeType: 'Update', source: 'System'",
    "changeType: 'UPDATE', source: 'SYSTEM_AUTO'"
)

with open("src/lib/storage.ts", "w") as f:
    f.write(content)
