import re

with open("src/utils/matchingAlgorithm.ts", "r") as f:
    content = f.read()

content = content.replace("jd.requirements.filter(r => r.toLowerCase().includes('skill') || r.toLowerCase().includes('proficien') || !r.toLowerCase().includes('year') && !r.toLowerCase().includes('degree'))", "jd.requirements.filter(r => r.category === 'Skill').map(r => r.name)")
content = content.replace("r => r.split(' ')[0].replace(/[^a-zA-Z]/g, '')", "r => r.split(' ')[0].replace(/[^a-zA-Z]/g, '')")

with open("src/utils/matchingAlgorithm.ts", "w") as f:
    f.write(content)
