import { JobDescription, Candidate, JDResumeMatch } from '../types';

/**
 * Calculates a match score between a job description and a candidate.
 * Every score is calculated from real data – no hardcoded placeholders.
 */
export function calculateMatch(job: JobDescription, candidate: Candidate): JDResumeMatch {
  // 1. Skill Match
  const skillScore = calculateSkillScore(job, candidate);

  // 2. Experience Match
  const experienceScore = calculateExperienceScore(job, candidate);

  // 3. Education Match – NOW REAL
  const educationScore = calculateEducationScore(job, candidate);

  // 4. Certification Match – NOW REAL
  const certificationScore = calculateCertificationScore(job, candidate);

  // Determine if each requirement exists in the job
  const hasSkillReq = job.requirements.some(r => r.category === 'Skill');
  const hasExpReq = job.requirements.some(r => r.category === 'Experience') && getExperienceRequired(job) > 0;
  const hasEduReq = job.requirements.some(r => r.category === 'Education');
  const hasCertReq = job.requirements.some(r => r.category === 'Certification');

  // Base weights – sum to 1.0
  const skillW = 0.4;
  const expW = 0.3;
  const eduW = 0.2;
  const certW = 0.1;

  // If a category has no requirements, set its weight to 0 and redistribute proportionally
  const activeCategories = [
    { key: 'skill', has: hasSkillReq, weight: skillW },
    { key: 'experience', has: hasExpReq, weight: expW },
    { key: 'education', has: hasEduReq, weight: eduW },
    { key: 'certification', has: hasCertReq, weight: certW },
  ];

  const totalActiveWeight = activeCategories.filter(c => c.has).reduce((sum, c) => sum + c.weight, 0);

  // If no active categories, return a default match (0%)
  if (totalActiveWeight === 0) {
    return {
      id: `MATCH-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      jobId: job.id,
      candidateId: candidate.id,
      candidateName: candidate.name,

      overallScore: 0,
      matchPercentage: 0,
      matchLevel: 'Not a Match',

      skillMatchScore: 0,
      experienceMatchScore: 0,
      educationMatchScore: 0,
      certificationMatchScore: 0,

      matchingSkills: [],
      missingSkills: [],
      partialSkills: [],
      experienceYears: candidate.experienceYears || 0,
      experienceRequired: getExperienceRequired(job),
      educationMatch: false,
      certificationMatch: false,

      scoringDetails: [
        { category: 'Skills', score: 0, weight: 0, weightedScore: 0, matchedItems: [], missingItems: [] },
        { category: 'Experience', score: 0, weight: 0, weightedScore: 0, matchedItems: [], missingItems: [] },
        { category: 'Education', score: 0, weight: 0, weightedScore: 0, matchedItems: [], missingItems: [] },
        { category: 'Certifications', score: 0, weight: 0, weightedScore: 0, matchedItems: [], missingItems: [] },
      ],
      aiSummary: 'No requirements specified for this job.',
      aiRecommendation: 'Reject',
      aiReasoning: 'No requirements specified for this job.',

      status: 'Pending',
      reviewedBy: undefined,
      reviewedAt: undefined,
      notes: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  // Normalize weights so they sum to 1 across active categories only
  const weights = {
    skill: hasSkillReq ? skillW / totalActiveWeight : 0,
    experience: hasExpReq ? expW / totalActiveWeight : 0,
    education: hasEduReq ? eduW / totalActiveWeight : 0,
    certification: hasCertReq ? certW / totalActiveWeight : 0,
  };

  const isRedistributed = activeCategories.some(c => !c.has);
  if (isRedistributed) {
    console.log(`[Matching] Dynamic weight redistribution active. Total active base weight: ${totalActiveWeight}. Normalized weights:`, weights);
  }

  const rawOverallScore =
    skillScore * weights.skill +
    experienceScore * weights.experience +
    educationScore * weights.education +
    certificationScore * weights.certification;

  // Guardrail: if the candidate misses all required skills, other factors should not
  // overstate the match. This keeps "no-skill" candidates out of strong ranges.
  const overallScore = hasSkillReq && skillScore === 0
    ? Math.min(rawOverallScore, 0.49)
    : rawOverallScore;

  const matchPercentage = Math.round(overallScore * 100);
  const matchLevel = getMatchLevel(matchPercentage);

  // Build detailed scoring breakdown with real matched items
  const scoringDetails = [
    {
      category: 'Skills',
      score: skillScore,
      weight: weights.skill,
      weightedScore: skillScore * weights.skill,
      matchedItems: getMatchedSkills(job, candidate),
      missingItems: getMissingSkills(job, candidate),
    },
    {
      category: 'Experience',
      score: experienceScore,
      weight: weights.experience,
      weightedScore: experienceScore * weights.experience,
      matchedItems: [],
      missingItems: [],
    },
    {
      category: 'Education',
      score: educationScore,
      weight: weights.education,
      weightedScore: educationScore * weights.education,
      matchedItems: getMatchedEducation(job, candidate),
      missingItems: getMissingEducation(job, candidate),
    },
    {
      category: 'Certifications',
      score: certificationScore,
      weight: weights.certification,
      weightedScore: certificationScore * weights.certification,
      matchedItems: getMatchedCertifications(job, candidate),
      missingItems: getMissingCertifications(job, candidate),
    },
  ];

  const aiSummary = generateAISummary(matchPercentage, scoringDetails);
  const aiRecommendation = matchPercentage >= 70 ? 'Advance' : matchPercentage >= 40 ? 'Consider' : 'Reject';

  return {
    id: `MATCH-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    jobId: job.id,
    candidateId: candidate.id,
    candidateName: candidate.name,

    overallScore,
    matchPercentage,
    matchLevel,

    skillMatchScore: skillScore,
    experienceMatchScore: experienceScore,
    educationMatchScore: educationScore,
    certificationMatchScore: certificationScore,

    matchingSkills: getMatchedSkills(job, candidate),
    missingSkills: getMissingSkills(job, candidate),
    partialSkills: getPartialSkills(job, candidate),
    experienceYears: candidate.experienceYears || 0,
    experienceRequired: getExperienceRequired(job),
    educationMatch: educationScore >= 0.8,
    certificationMatch: certificationScore >= 0.8,

    scoringDetails,
    aiSummary,
    aiRecommendation,
    aiReasoning: `Match score ${matchPercentage}% based on skills, experience, education, and certifications.`,

    status: 'Pending',
    reviewedBy: undefined,
    reviewedAt: undefined,
    notes: '',

    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// ============================================================
//  HELPER FUNCTIONS – All use REAL data, no placeholders
// ============================================================

function getSkillRequirements(job: JobDescription): string[] {
  return job.requirements
    .filter(r => r.category === 'Skill')
    .map(r => r.name);
}

function getEducationRequirements(job: JobDescription): string[] {
  return job.requirements
    .filter(r => r.category === 'Education')
    .map(r => r.name);
}

function getCertificationRequirements(job: JobDescription): string[] {
  return job.requirements
    .filter(r => r.category === 'Certification')
    .map(r => r.name);
}

function getExperienceRequired(job: JobDescription): number {
  const req = job.requirements.find(r => r.category === 'Experience');
  return req?.minValue || 0;
}

// ---- SKILL ----
function calculateSkillScore(job: JobDescription, candidate: Candidate): number {
  const jobSkills = getSkillRequirements(job);
  if (jobSkills.length === 0) return 0;

  const normalizedCandidateSkills = (candidate.skills || []).map(normalizeText);
  const matched = jobSkills.filter(skill => normalizedCandidateSkills.includes(normalizeText(skill)));
  return matched.length / jobSkills.length;
}

function getMatchedSkills(job: JobDescription, candidate: Candidate): string[] {
  const jobSkills = getSkillRequirements(job);
  const normalizedCandidateSkills = (candidate.skills || []).map(normalizeText);
  return jobSkills.filter(skill => normalizedCandidateSkills.includes(normalizeText(skill)));
}

function getMissingSkills(job: JobDescription, candidate: Candidate): string[] {
  const jobSkills = getSkillRequirements(job);
  const normalizedCandidateSkills = (candidate.skills || []).map(normalizeText);
  const partials = new Set(getPartialSkills(job, candidate).map(normalizeText));
  return jobSkills.filter(skill => !normalizedCandidateSkills.includes(normalizeText(skill)) && !partials.has(normalizeText(skill)));
}

function getPartialSkills(job: JobDescription, candidate: Candidate): string[] {
  const jobSkills = getSkillRequirements(job);
  if (jobSkills.length === 0) return [];

  const normalizedCandidateSkills = (candidate.skills || []).map(normalizeText);
  const partials: string[] = [];

  for (const jobSkill of jobSkills) {
    const normalizedJobSkill = normalizeText(jobSkill);
    if (normalizedCandidateSkills.includes(normalizedJobSkill)) continue;

    if (normalizedCandidateSkills.some(candidateSkill => candidateSkill.includes(normalizedJobSkill) || normalizedJobSkill.includes(candidateSkill))) {
      partials.push(jobSkill);
    }
  }

  return partials;
}

// ---- EXPERIENCE ----
function calculateExperienceScore(job: JobDescription, candidate: Candidate): number {
  const required = getExperienceRequired(job);
  if (required === 0) return 1;
  const candidateExp = candidate.experienceYears || 0;
  return Math.min(candidateExp / required, 1);
}

// ---- EDUCATION – NOW REAL (from candidate.education array) ----
// ============================================================
//  TEXT NORMALIZATION & MATCHING
// ============================================================

/**
 * Normalize a string: lowercase, remove punctuation, collapse spaces.
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ') // Replace punctuation with space
    .replace(/\s+/g, ' ')         // Collapse multiple spaces
    .trim();
}

/**
 * Tokenize a normalized string into an array of meaningful tokens.
 * Ignores tokens of length 1 (e.g., 'a', 'i') to reduce noise.
 */
function tokenizeText(text: string): string[] {
  if (!text) return [];
  return normalizeText(text)
    .split(/\s+/)
    .filter(token => token.length > 1);
}

/**
 * Check if a candidate's text matches a job requirement.
 * Returns true if:
 *  - Exact match after normalization.
 *  - All tokens from the requirement are present in the candidate.
 *  - The requirement is a substring of the candidate (for phrases like "Computer Science").
 */
function textMatchesRequirement(candidateText: string, requirement: string): boolean {
  const normalizedCandidate = normalizeText(candidateText);
  const normalizedReq = normalizeText(requirement);

  if (!normalizedCandidate || !normalizedReq) return false;

  // 1. Exact normalized match
  if (normalizedCandidate === normalizedReq) return true;

  // 2. Token-based match
  const reqTokens = tokenizeText(requirement);
  const candTokens = tokenizeText(candidateText);

  // If requirement has no meaningful tokens, treat as no match
  if (reqTokens.length === 0) return false;

  // All requirement tokens must be present in candidate tokens
  const allTokensPresent = reqTokens.every(reqToken => 
    candTokens.some(candToken => candToken === reqToken)
  );
  if (allTokensPresent) return true;

  // 3. Fallback: substring match (useful for compound words or slight differences)
  // Only do this if the requirement is longer than 3 chars to avoid "BS" matching "Business"
  if (normalizedReq.length > 3 && normalizedCandidate.includes(normalizedReq)) {
    return true;
  }

  return false;
}

/**
 * Check if a candidate's education entry matches a job's education requirement.
 * Combines degree, fieldOfStudy, and institution into one searchable string.
 */
function educationMatchesRequirement(education: any, requirement: string): boolean {
  const candidateText = `${education.degree || ''} ${education.fieldOfStudy || ''} ${education.institution || ''}`;
  return textMatchesRequirement(candidateText, requirement);
}

/**
 * Check if a candidate's certification matches a job's certification requirement.
 * Combines name and issuingOrganization.
 */
function certificationMatchesRequirement(certification: any, requirement: string): boolean {
  const candidateText = `${certification.name || ''} ${certification.issuingOrganization || ''}`;
  return textMatchesRequirement(candidateText, requirement);
}

function calculateEducationScore(job: JobDescription, candidate: Candidate): number {
  const eduReqs = getEducationRequirements(job);
  if (eduReqs.length === 0) return 1;

  const candidateEducation = candidate.education || [];
  if (candidateEducation.length === 0) return 0;

  let matched = 0;
  for (const req of eduReqs) {
    const isMatched = candidateEducation.some(edu => 
      educationMatchesRequirement(edu, req)
    );
    if (isMatched) matched++;
  }

  return matched / eduReqs.length;
}

function getMatchedEducation(job: JobDescription, candidate: Candidate): string[] {
  const eduReqs = getEducationRequirements(job);
  const candidateEducation = candidate.education || [];
  return eduReqs.filter(req => 
    candidateEducation.some(edu => educationMatchesRequirement(edu, req))
  );
}

function getMissingEducation(job: JobDescription, candidate: Candidate): string[] {
  const eduReqs = getEducationRequirements(job);
  const candidateEducation = candidate.education || [];
  return eduReqs.filter(req => 
    !candidateEducation.some(edu => educationMatchesRequirement(edu, req))
  );
}

// ---- CERTIFICATIONS – NOW REAL (from candidate.certifications array) ----
function calculateCertificationScore(job: JobDescription, candidate: Candidate): number {
  const certReqs = getCertificationRequirements(job);
  if (certReqs.length === 0) return 1;

  const candidateCerts = candidate.certifications || [];
  if (candidateCerts.length === 0) return 0;

  let matched = 0;
  for (const req of certReqs) {
    const isMatched = candidateCerts.some(cert => 
      certificationMatchesRequirement(cert, req)
    );
    if (isMatched) matched++;
  }

  return matched / certReqs.length;
}

function getMatchedCertifications(job: JobDescription, candidate: Candidate): string[] {
  const certReqs = getCertificationRequirements(job);
  const candidateCerts = candidate.certifications || [];
  return certReqs.filter(req => 
    candidateCerts.some(cert => certificationMatchesRequirement(cert, req))
  );
}

function getMissingCertifications(job: JobDescription, candidate: Candidate): string[] {
  const certReqs = getCertificationRequirements(job);
  const candidateCerts = candidate.certifications || [];
  return certReqs.filter(req => 
    !candidateCerts.some(cert => certificationMatchesRequirement(cert, req))
  );
}

// ---- UTILITY ----
function getMatchLevel(percentage: number): JDResumeMatch['matchLevel'] {
  if (percentage >= 80) return 'Strong Match';
  if (percentage >= 60) return 'Good Match';
  if (percentage >= 40) return 'Potential Match';
  if (percentage >= 20) return 'Weak Match';
  return 'Not a Match';
}

function generateAISummary(percentage: number, details: any[]): string {
  const strengths = details.filter(d => d.score >= 0.7).map(d => d.category);
  const weaknesses = details.filter(d => d.score < 0.5).map(d => d.category);
  let summary = `Match score: ${percentage}%. `;
  if (strengths.length) summary += `Strong in: ${strengths.join(', ')}. `;
  if (weaknesses.length) summary += `Needs improvement in: ${weaknesses.join(', ')}.`;
  return summary || 'Candidate matches some requirements.';
}
