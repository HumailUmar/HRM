import re

with open("src/components/Recruitment.tsx", "r") as f:
    content = f.read()

# Add jdMatches state
state_code = """
  const [selectedJdId, setSelectedJdId] = useState<string>('');
  const [jdMatches, setJdMatches] = useState<JDResumeMatch[]>([]);

  useEffect(() => {
    setJdMatches(getJDMatches());
  }, []);
"""

content = content.replace("const [selectedJdId, setSelectedJdId] = useState<string>('');", state_code)

with open("src/components/Recruitment.tsx", "w") as f:
    f.write(content)
