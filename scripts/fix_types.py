with open("src/types.ts", "r") as f:
    lines = f.readlines()

new_lines = []
for i, line in enumerate(lines):
    if i in [56, 57]: # we added probationStartDate, probationEndDate at lines 55, 56 roughly. Let's just remove the ones we added in the top part.
        pass
    new_lines.append(line)
