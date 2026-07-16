import re

with open("src/lib/mockData.ts", "r") as f:
    content = f.read()

content = content.replace("import {", "import { JobDescription,")

jd_mock = """
export const INITIAL_JOB_DESCRIPTIONS: JobDescription[] = [
  {
    id: "JD-001",
    title: "Senior Software Engineer",
    department: "Engineering",
    location: "Remote",
    employmentType: "Full-time",
    experienceLevel: "Senior Level",
    minSalary: 120000,
    maxSalary: 160000,
    currency: "USD",
    postingDate: "2026-07-01",
    isActive: true,
    summary: "We are looking for an experienced Senior Software Engineer to build scalable web applications.",
    responsibilities: [
      "Architect and develop full-stack applications",
      "Mentor junior developers",
      "Participate in code reviews"
    ],
    requirements: [
      { id: "req-1", category: "Skill", name: "JavaScript", isRequired: true, weight: 20, priority: "Must Have" },
      { id: "req-2", category: "Skill", name: "React", isRequired: true, weight: 20, priority: "Must Have" },
      { id: "req-3", category: "Skill", name: "Node.js", isRequired: true, weight: 20, priority: "Must Have" },
      { id: "req-4", category: "Skill", name: "AWS", isRequired: false, weight: 10, priority: "Preferred" },
      { id: "req-5", category: "Experience", name: "Software Development", isRequired: true, weight: 30, minValue: 5, priority: "Must Have" }
    ],
    benefits: ["Health Insurance", "401k", "Unlimited PTO"],
    evaluationDimensions: [
      {
        id: "dim-1",
        name: "Technical Skills",
        description: "Core programming and system design.",
        weight: 40,
        questions: []
      },
      {
        id: "dim-2",
        name: "Communication",
        description: "Ability to explain technical concepts.",
        weight: 30,
        questions: []
      },
      {
        id: "dim-3",
        name: "Cultural Fit",
        description: "Alignment with company values.",
        weight: 30,
        questions: []
      }
    ],
    hiringManagerId: "EMP-001",
    recruitingLeadId: "EMP-002",
    interviewers: ["EMP-001", "EMP-003"],
    workflowStages: ["Applied", "Screening", "Interview", "Offer", "Hired"],
    autoAdvance: false,
    requireApprovalForHire: true,
    totalApplications: 12,
    candidatesInPipeline: 3,
    averageTimeToHire: 0,
    createdAt: "2026-07-01T00:00:00Z",
    updatedAt: "2026-07-01T00:00:00Z",
    createdBy: "EMP-002"
  },
  {
    id: "JD-002",
    title: "Marketing Manager",
    department: "Marketing",
    location: "New York, NY",
    employmentType: "Full-time",
    experienceLevel: "Mid Level",
    minSalary: 80000,
    maxSalary: 110000,
    currency: "USD",
    postingDate: "2026-07-05",
    isActive: true,
    summary: "Seeking a creative Marketing Manager to drive our digital campaigns.",
    responsibilities: [
      "Develop digital marketing strategies",
      "Manage social media presence",
      "Analyze campaign performance"
    ],
    requirements: [
      { id: "req-1", category: "Skill", name: "Digital Marketing", isRequired: true, weight: 30, priority: "Must Have" },
      { id: "req-2", category: "Skill", name: "SEO", isRequired: true, weight: 20, priority: "Must Have" },
      { id: "req-3", category: "Skill", name: "Content Strategy", isRequired: true, weight: 20, priority: "Must Have" },
      { id: "req-4", category: "Experience", name: "Marketing", isRequired: true, weight: 30, minValue: 3, priority: "Must Have" }
    ],
    benefits: ["Health Insurance", "Remote Work Options", "Gym Membership"],
    evaluationDimensions: [
      {
        id: "dim-1",
        name: "Marketing Expertise",
        description: "Knowledge of marketing principles.",
        weight: 35,
        questions: []
      },
      {
        id: "dim-2",
        name: "Communication",
        description: "Verbal and written communication.",
        weight: 35,
        questions: []
      },
      {
        id: "dim-3",
        name: "Cultural Fit",
        description: "Team collaboration and values.",
        weight: 30,
        questions: []
      }
    ],
    hiringManagerId: "EMP-002",
    recruitingLeadId: "EMP-004",
    interviewers: ["EMP-002"],
    workflowStages: ["Applied", "Under Review", "Interview", "Offer", "Hired"],
    autoAdvance: true,
    requireApprovalForHire: false,
    totalApplications: 25,
    candidatesInPipeline: 5,
    averageTimeToHire: 0,
    createdAt: "2026-07-05T00:00:00Z",
    updatedAt: "2026-07-05T00:00:00Z",
    createdBy: "EMP-004"
  },
  {
    id: "JD-003",
    title: "HR Specialist",
    department: "Human Resources",
    location: "London, UK",
    employmentType: "Full-time",
    experienceLevel: "Entry Level",
    minSalary: 50000,
    maxSalary: 65000,
    currency: "GBP",
    postingDate: "2026-07-10",
    isActive: true,
    summary: "Looking for an HR Specialist to assist with recruitment and employee relations.",
    responsibilities: [
      "Assist with full-cycle recruiting",
      "Manage payroll operations",
      "Ensure labor law compliance"
    ],
    requirements: [
      { id: "req-1", category: "Skill", name: "Recruitment", isRequired: true, weight: 30, priority: "Must Have" },
      { id: "req-2", category: "Skill", name: "Payroll", isRequired: true, weight: 20, priority: "Must Have" },
      { id: "req-3", category: "Skill", name: "Labor Law", isRequired: true, weight: 20, priority: "Must Have" },
      { id: "req-4", category: "Experience", name: "HR Operations", isRequired: true, weight: 30, minValue: 2, priority: "Must Have" }
    ],
    benefits: ["Health Insurance", "Pension Plan", "Training Budget"],
    evaluationDimensions: [
      {
        id: "dim-1",
        name: "Technical Knowledge",
        description: "HR processes and laws.",
        weight: 30,
        questions: []
      },
      {
        id: "dim-2",
        name: "Communication",
        description: "Interpersonal skills.",
        weight: 40,
        questions: []
      },
      {
        id: "dim-3",
        name: "Cultural Fit",
        description: "Empathy and alignment.",
        weight: 30,
        questions: []
      }
    ],
    hiringManagerId: "EMP-003",
    recruitingLeadId: "EMP-004",
    interviewers: ["EMP-003"],
    workflowStages: ["Applied", "Screening", "Interview", "Offer", "Hired"],
    autoAdvance: false,
    requireApprovalForHire: true,
    totalApplications: 8,
    candidatesInPipeline: 2,
    averageTimeToHire: 0,
    createdAt: "2026-07-10T00:00:00Z",
    updatedAt: "2026-07-10T00:00:00Z",
    createdBy: "EMP-004"
  }
];
"""

if "INITIAL_JOB_DESCRIPTIONS" not in content:
    content = content + "\n" + jd_mock

with open("src/lib/mockData.ts", "w") as f:
    f.write(content)
