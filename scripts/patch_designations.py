import re
with open("src/components/Designations.tsx", "r") as f:
    content = f.read()
pattern = r"    setDesignations\(designations\.filter.*?\}\)\);"
replacement = """    const updatedDesignations = designations
      .filter(d => d.id !== dsgToDelete.id)
      .map(d => {
        if (d.reportingToDesignationId === dsgToDelete.id) {
          return { ...d, reportingToDesignationId: undefined };
        }
        return d;
      });
    setDesignations(updatedDesignations);"""
new_content = re.sub(pattern, replacement, content, flags=re.DOTALL)
with open("src/components/Designations.tsx", "w") as f:
    f.write(new_content)
