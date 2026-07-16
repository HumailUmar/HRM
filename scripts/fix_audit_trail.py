import re

with open("src/components/AuditTrail.tsx", "r") as f:
    content = f.read()

content = content.replace(".map(s => JSON.parse(s));", ".map(s => JSON.parse(s as string));")

with open("src/components/AuditTrail.tsx", "w") as f:
    f.write(content)
