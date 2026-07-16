import re

with open("src/components/Sidebar.tsx", "r") as f:
    content = f.read()

content = content.replace("<span>{item.label}</span>", "<span className=\"flex-1 text-left\">{item.label}</span>")
content = content.replace("scale-[1.02]", "scale-[1.02] origin-left")

with open("src/components/Sidebar.tsx", "w") as f:
    f.write(content)
