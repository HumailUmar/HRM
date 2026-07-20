import re

with open("src/components/Recruitment.tsx", "r") as f:
    content = f.read()

content = content.replace("Employee, LegacyOnboardingTask, OnboardingTemplate } from '../types';", "Employee, LegacyOnboardingTask, OnboardingTemplate, JDResumeMatch } from '../types';\nimport { calculateMatch } from '../utils/matchingAlgorithm';")

with open("src/components/Recruitment.tsx", "w") as f:
    f.write(content)
