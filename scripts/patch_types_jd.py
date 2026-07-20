import re

with open("src/types.ts", "r") as f:
    content = f.read()

jd_types = """
export interface JobRequirement {
  id: string;
  category: 'Skill' | 'Experience' | 'Education' | 'Certification';
  name: string;
  isRequired: boolean;
  weight: number;
  minValue?: number;
  maxValue?: number;
  priority: 'Must Have' | 'Nice to Have' | 'Preferred';
}

export interface EvaluationQuestion {
  id: string;
  question: string;
  category: string;
  scoringRubric: {
    1: string;
    2: string;
    3: string;
    4: string;
    5: string;
  };
  weight: number;
  isRequired: boolean;
}

export interface EvaluationDimension {
  id: string;
  name: string;
  description: string;
  weight: number;
  questions: EvaluationQuestion[];
}

export interface JobDescription {
  id: string;
  title: string;
  department: string;
  location: string;
  employmentType: 'Full-time' | 'Part-time' | 'Contract' | 'Internship' | 'Freelance';
  experienceLevel: 'Entry Level' | 'Mid Level' | 'Senior Level' | 'Executive' | 'Director';
  minSalary?: number;
  maxSalary?: number;
  currency: string;
  postingDate: string;
  closingDate?: string;
  isActive: boolean;

  summary: string;
  responsibilities: string[];
  requirements: JobRequirement[];
  benefits: string[];
  evaluationDimensions: EvaluationDimension[];

  hiringManagerId: string;
  recruitingLeadId: string;
  interviewers: string[];

  workflowStages: string[];
  autoAdvance: boolean;
  requireApprovalForHire: boolean;

  totalApplications: number;
  candidatesInPipeline: number;
  averageTimeToHire: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface JobCandidate {
  id: string;
  jobId: string;
  candidateId: string;
  candidateName: string;
  matchScore: number;
  status: 'Applied' | 'Under Review' | 'Shortlisted' | 'Rejected' | 'Hired';
  appliedDate: string;
  currentStage: string;
  notes: string;
  rejectionReason?: string;
  offerSentDate?: string;
  offerAcceptedDate?: string;
}
"""

if "export interface JobDescription" not in content:
    content = content + "\n" + jd_types

with open("src/types.ts", "w") as f:
    f.write(content)
