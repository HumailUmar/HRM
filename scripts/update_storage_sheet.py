import re

with open("src/lib/storage.ts", "r") as f:
    content = f.read()

# Headers
headers = """export const JD_MATCHES_HEADERS = ['id', 'jobId', 'candidateId', 'candidateName', 'overallScore', 'matchLevel', 'skillMatchScore', 'experienceMatchScore', 'educationMatchScore', 'certificationMatchScore', 'matchingSkills', 'missingSkills', 'aiSummary', 'aiRecommendation', 'aiReasoning', 'status', 'reviewedBy', 'reviewedAt', 'notes', 'createdAt', 'updatedAt'];"""
if "export const JD_MATCHES_HEADERS" not in content:
    content = content.replace("export const STATUS_HISTORY_HEADERS", headers + "\nexport const STATUS_HISTORY_HEADERS")

# saveJDMatches func
save_jd = """export const saveJDMatches = (matches: JDResumeMatch[]) => {
  saveData('jd_matches', matches);
  if (!getSettings().isMockMode) {
    import('../services/googleSheetsService').then(m => {
      const rows = matches.map(match => [
        match.id, match.jobId, match.candidateId, match.candidateName,
        match.overallScore, match.matchLevel,
        match.skillMatchScore, match.experienceMatchScore, match.educationMatchScore, match.certificationMatchScore,
        match.matchingSkills.join(','), match.missingSkills.join(','),
        match.aiSummary, match.aiRecommendation, match.aiReasoning,
        match.status, match.reviewedBy || '', match.reviewedAt || '', match.notes,
        match.createdAt, match.updatedAt
      ]);
      m.appendToSheet('HumailEli_JD_Matches', rows);
    });
  }
};"""
content = content.replace("export const saveJDMatches = (matches: JDResumeMatch[]) => saveData('jd_matches', matches);", save_jd)

with open("src/lib/storage.ts", "w") as f:
    f.write(content)
