import { calculateMatch } from '../../utils/matchingAlgorithm';
import { JobDescription, Candidate } from '../../types';

describe('Matching Algorithm', () => {
  const mockJob: JobDescription = {
    id: 'JOB-001',
    title: 'Software Engineer',
    department: 'Engineering',
    location: 'Remote',
    employmentType: 'Full-time',
    experienceLevel: 'Mid Level',
    currency: 'USD',
    postingDate: '2026-01-01',
    isActive: true,
    summary: 'Build software.',
    responsibilities: ['Write code'],
    requirements: [
      { id: 'r1', category: 'Skill', name: 'TypeScript', isRequired: true, weight: 1, priority: 'Must Have' },
      { id: 'r2', category: 'Skill', name: 'React', isRequired: true, weight: 1, priority: 'Must Have' },
      { id: 'r3', category: 'Experience', name: 'Experience', isRequired: true, weight: 1, minValue: 3, priority: 'Must Have' },
      { id: 'r4', category: 'Education', name: 'BS Computer Science', isRequired: false, weight: 0.5, priority: 'Nice to Have' },
      { id: 'r5', category: 'Certification', name: 'AWS Certified', isRequired: false, weight: 0.3, priority: 'Nice to Have' },
    ],
    benefits: [],
    evaluationDimensions: [],
    hiringManagerId: '',
    recruitingLeadId: '',
    interviewers: [],
    workflowStages: [],
    autoAdvance: false,
    requireApprovalForHire: false,
    totalApplications: 0,
    candidatesInPipeline: 0,
    averageTimeToHire: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'test',
  };

  const mockCandidate: Candidate = {
    id: 'CAND-001',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '1234567890',
    skills: ['TypeScript', 'React', 'Node.js'],
    experienceYears: 4,
    resumeFileName: 'resume.pdf',
    status: 'Applied',
    education: [
      { degree: 'BS Computer Science', fieldOfStudy: 'Computer Science', institution: 'MIT', startDate: '2018', endDate: '2022', yearOfGraduation: '2022', isHighest: true },
    ],
    certifications: [
      { name: 'AWS Certified Developer', issuingOrganization: 'Amazon', issueDate: '2023-01-01' },
    ],
  };

  test('calculates match score correctly with all data', () => {
    const result = calculateMatch(mockJob, mockCandidate);
    expect(result.matchPercentage).toBeGreaterThanOrEqual(70);
    expect(result.matchLevel).toBe('Strong Match');
    expect(result.matchingSkills).toContain('TypeScript');
    expect(result.matchingSkills).toContain('React');
    expect(result.missingSkills).toHaveLength(0);
    expect(result.skillMatchScore).toBe(1);
    expect(result.experienceMatchScore).toBe(1);
    expect(result.educationMatchScore).toBe(1);
    expect(result.certificationMatchScore).toBe(1);
    expect(result.aiRecommendation).toBe('Advance');
  });

  test('handles missing education and certifications gracefully', () => {
    const candidateWithoutData = {
      ...mockCandidate,
      education: [],
      certifications: [],
    };
    const result = calculateMatch(mockJob, candidateWithoutData);
    expect(result.educationMatchScore).toBe(0);
    expect(result.certificationMatchScore).toBe(0);
    // Overall score should still be calculated from skills and experience
    expect(result.matchPercentage).toBeGreaterThanOrEqual(50);
  });

  test('handles job with no skill requirements', () => {
    const jobNoSkills = { ...mockJob, requirements: mockJob.requirements.filter(r => r.category !== 'Skill') };
    const result = calculateMatch(jobNoSkills, mockCandidate);
    expect(result.skillMatchScore).toBe(0);
    expect(result.matchPercentage).toBeGreaterThan(0);
  });

  test('handles candidate with no skills', () => {
    const candidateNoSkills = { ...mockCandidate, skills: [] };
    const result = calculateMatch(mockJob, candidateNoSkills);
    expect(result.skillMatchScore).toBe(0);
    expect(result.missingSkills).toEqual(['TypeScript', 'React']);
    expect(result.matchPercentage).toBeLessThan(50);
  });

  test('partial skills detection works', () => {
    const candidatePartial = { ...mockCandidate, skills: ['TypeScript', 'ReactJS'] };
    const result = calculateMatch(mockJob, candidatePartial);
    expect(result.partialSkills).toContain('React');
    expect(result.matchingSkills).toContain('TypeScript');
    expect(result.missingSkills).not.toContain('TypeScript');
  });
});
