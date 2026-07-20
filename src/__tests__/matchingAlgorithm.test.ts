import { calculateMatch } from '../utils/matchingAlgorithm';
import { JobDescription, Candidate } from '../types';

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
    summary: 'Build cool stuff.',
    responsibilities: ['Write code', 'Review PRs'],
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
      { degree: 'BS Computer Science', fieldOfStudy: 'Computer Science', institution: 'MIT', startDate: '2018', endDate: '2022', yearOfGraduation: '2022', isHighest: true } as any,
    ],
    certifications: [
      { name: 'AWS Certified Developer', issuingOrganization: 'Amazon', issueDate: '2023-01-01' },
    ],
  };

  test('calculates match score correctly with all data', () => {
    const result = calculateMatch(mockJob, mockCandidate);
    expect(result.matchPercentage).toBeGreaterThanOrEqual(70);
    expect(result.matchLevel).toBe('Strong Match');
    expect(result.matchingSkills).toContain('typescript');
    expect(result.matchingSkills).toContain('react');
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
    expect(result.skillMatchScore).toBe(0); // No skills required -> 0
    // Overall score should come from other categories
    expect(result.matchPercentage).toBeGreaterThan(0);
  });

  test('handles candidate with no skills', () => {
    const candidateNoSkills = { ...mockCandidate, skills: [] };
    const result = calculateMatch(mockJob, candidateNoSkills);
    expect(result.skillMatchScore).toBe(0);
    expect(result.missingSkills).toEqual(['typescript', 'react']);
    expect(result.matchPercentage).toBeLessThan(70);
  });

  test('handles job with no experience requirement and redistributes weight', () => {
    const jobNoExp = {
      ...mockJob,
      requirements: mockJob.requirements.filter(r => r.category !== 'Experience'),
    };
    const result = calculateMatch(jobNoExp, mockCandidate);
    
    // Check that experience has 0 weight in scoring details
    const expDetail = result.scoringDetails.find(d => d.category === 'Experience');
    expect(expDetail?.weight).toBe(0);
    
    // Check that remaining categories have dynamic redistributed weights
    // base weights are: skill 0.4, edu 0.2, cert 0.1 -> total 0.7
    // redistributed: skill: 0.4/0.7 = 0.5714, edu: 0.2/0.7 = 0.2857, cert: 0.1/0.7 = 0.1429
    const skillDetail = result.scoringDetails.find(d => d.category === 'Skills');
    expect(skillDetail?.weight).toBeCloseTo(0.4 / 0.7, 4);
  });

  test('correctly identifies and separates fully matched, partially matched, and missing skills', () => {
    const customJob: JobDescription = {
      ...mockJob,
      requirements: [
        { id: 'r1', category: 'Skill', name: 'React', isRequired: true, weight: 1, priority: 'Must Have' },
        { id: 'r2', category: 'Skill', name: 'TypeScript', isRequired: true, weight: 1, priority: 'Must Have' },
        { id: 'r3', category: 'Skill', name: 'Python', isRequired: true, weight: 1, priority: 'Must Have' },
      ],
    };
    const customCandidate = {
      ...mockCandidate,
      skills: ['ReactJS', 'TS'], // ReactJS matches React partially, TS is not React or TypeScript or Python.
    };
    
    const result = calculateMatch(customJob, customCandidate);
    
    // "React" is a partial match for "ReactJS"
    expect(result.partialSkills).toEqual(['react']);
    // "TypeScript" and "Python" are completely missing
    expect(result.missingSkills).toEqual(['typescript', 'python']);
    // Fully matched skills should be empty
    expect(result.matchingSkills).toEqual([]);
  });

  test('education matching avoids naive false positives', () => {
    const jobWithArtEdu: JobDescription = {
      ...mockJob,
      requirements: [
        { id: 'r1', category: 'Education', name: 'art', isRequired: true, weight: 1, priority: 'Must Have' },
      ],
    };
    
    // Candidate has "Dartmouth" but no "art" degree/subject
    const candidateDartmouth = {
      ...mockCandidate,
      education: [
        { degree: 'BS', fieldOfStudy: 'Computer Science', institution: 'Dartmouth', startDate: '2015', endDate: '2019' },
      ],
    };

    const result = calculateMatch(jobWithArtEdu, candidateDartmouth);
    expect(result.educationMatchScore).toBe(0);
    expect(result.scoringDetails.find(d => d.category === 'Education')?.matchedItems).toEqual([]);
    expect(result.scoringDetails.find(d => d.category === 'Education')?.missingItems).toEqual(['art']);
  });

  test('education matching handles token-based match correctly', () => {
    const jobWithCompSciEdu: JobDescription = {
      ...mockJob,
      requirements: [
        { id: 'r1', category: 'Education', name: 'Computer Science', isRequired: true, weight: 1, priority: 'Must Have' },
      ],
    };
    
    const candidateCompSci = {
      ...mockCandidate,
      education: [
        { degree: 'BS', fieldOfStudy: 'Computer Science', institution: 'Berkeley', startDate: '2015', endDate: '2019' },
      ],
    };

    const result = calculateMatch(jobWithCompSciEdu, candidateCompSci);
    expect(result.educationMatchScore).toBe(1);
    expect(result.scoringDetails.find(d => d.category === 'Education')?.matchedItems).toEqual(['computer science']);
  });

  test('certification matching handles token-based requirements and avoids false positives', () => {
    const jobWithAWS: JobDescription = {
      ...mockJob,
      requirements: [
        { id: 'r1', category: 'Certification', name: 'AWS Cloud Practitioner', isRequired: true, weight: 1, priority: 'Must Have' },
      ],
    };
    
    const candidateWithPMP = {
      ...mockCandidate,
      certifications: [
        { name: 'PMP Project Management Professional', issuingOrganization: 'PMI', issueDate: '2020', expirationDate: '2023', credentialId: '123' },
      ],
    };

    const candidateWithAWS = {
      ...mockCandidate,
      certifications: [
        { name: 'AWS Certified Cloud Practitioner', issuingOrganization: 'Amazon Web Services', issueDate: '2020', credentialId: '123' },
      ],
    };

    const resultNoMatch = calculateMatch(jobWithAWS, candidateWithPMP);
    expect(resultNoMatch.certificationMatchScore).toBe(0);

    const resultMatch = calculateMatch(jobWithAWS, candidateWithAWS);
    expect(resultMatch.certificationMatchScore).toBe(1);
  });
});
