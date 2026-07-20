import re

with open("src/types.ts", "r") as f:
    content = f.read()

match_types = """
export interface JDResumeMatch {
  id: string;
  jobId: string;
  candidateId: string;
  candidateName: string;

  overallScore: number;
  matchPercentage: number;
  matchLevel: 'Strong Match' | 'Good Match' | 'Potential Match' | 'Weak Match' | 'Not a Match';

  skillMatchScore: number;
  experienceMatchScore: number;
  educationMatchScore: number;
  certificationMatchScore: number;

  matchingSkills: string[];
  missingSkills: string[];
  partialSkills: string[];
  experienceYears: number;
  experienceRequired: number;
  educationMatch: boolean;
  certificationMatch: boolean;

  scoringDetails: {
    category: string;
    score: number;
    weight: number;
    weightedScore: number;
    matchedItems: string[];
    missingItems: string[];
  }[];

  aiSummary: string;
  aiRecommendation: 'Advance' | 'Consider' | 'Reject';
  aiReasoning: string;

  status: 'Pending' | 'Reviewed' | 'Shortlisted' | 'Rejected';
  reviewedBy?: string;
  reviewedAt?: string;
  notes: string;

  createdAt: string;
  updatedAt: string;
}

export interface MatchingConfig {
  id?: string;
  jobId?: string;

  skillWeight: number;
  experienceWeight: number;
  educationWeight: number;
  certificationWeight: number;

  strongMatchThreshold: number;
  goodMatchThreshold: number;
  potentialMatchThreshold: number;
  weakMatchThreshold: number;

  mustHaveExperience: boolean;
  mustHaveEducation: boolean;
  mustHaveCertifications: boolean;
  minExperienceYears: number;

  useAI: boolean;
  aiModel: string;
  autoShortlist: boolean;
}
"""

if "export interface JDResumeMatch" not in content:
    content = content + "\n" + match_types

# Add matchingConfig to JobDescription
if "matchingConfig?: MatchingConfig;" not in content:
    content = content.replace("workflowStages: string[];", "matchingConfig?: MatchingConfig;\n  workflowStages: string[];")

with open("src/types.ts", "w") as f:
    f.write(content)
