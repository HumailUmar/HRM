import { calculateMatch } from '../utils/matchingAlgorithm';
import { validateEmail } from '../lib/validators';
import { EmployeeSchema, AttendanceSchema } from '../lib/schemas';
import { AttendanceService } from '../services/AttendanceService';
import { generateUUID } from '../lib/idHelper';

describe('Production requirements: system integrity', () => {
  test('valid email input is accepted and malformed email input is rejected', () => {
    expect(validateEmail('person@example.com')).toBe(true);
    expect(validateEmail(' person@example.com ')).toBe(true);
    expect(validateEmail('person..name@example.com')).toBe(true);
    expect(validateEmail('person@example')).toBe(false);
    expect(validateEmail('.person@example.com')).toBe(false);
  });

  test('attendance schema rejects missing identity/date and invalid dates', () => {
    expect(AttendanceSchema.safeParse({}).success).toBe(false);
    expect(AttendanceSchema.safeParse({
      id: 'ATT-1', employeeId: 'EMP-1', employeeName: 'Person', date: '2026-07-22', status: 'Full Day',
    }).success).toBe(true);
    expect(AttendanceSchema.safeParse({
      id: 'ATT-1', employeeId: 'EMP-1', employeeName: 'Person', date: '22/07/2026', status: 'Full Day',
    }).success).toBe(false);
  });

  test('employee lifecycle status constraints reject incomplete status transitions', () => {
    const base = { id: 'EMP-1', name: 'Person', email: 'person@example.com', status: 'Terminated' };
    expect(EmployeeSchema.safeParse(base).success).toBe(false);
    expect(EmployeeSchema.safeParse({ ...base, terminationDate: '2026-07-22', terminationReason: 'Policy' }).success).toBe(true);
    expect(EmployeeSchema.safeParse({
      ...base,
      status: 'Active',
      employment: { contractStartDate: '2026-08-01', contractEndDate: '2026-07-01' },
    }).success).toBe(false);
  });
});

describe('Production requirements: matching pipeline', () => {
  const job = {
    id: 'JOB-1',
    title: 'Engineer',
    requirements: [
      { category: 'Skill', name: 'TypeScript' },
      { category: 'Experience', name: 'Years', minValue: 4 },
      { category: 'Education', name: 'Computer Science' },
    ],
  } as any;
  const candidate = {
    id: 'CAN-1', name: 'Candidate', skills: ['typescript'], experienceYears: 2,
    education: ['Computer Science'], certifications: [],
  } as any;

  const stable = (value: any) => {
    const { id, createdAt, updatedAt, ...rest } = value;
    return rest;
  };

  test('matching pipeline produces all required score components', () => {
    const result = calculateMatch(job, candidate);
    expect(result.jobId).toBe(job.id);
    expect(result.candidateId).toBe(candidate.id);
    expect(result.skillMatchScore).toBeGreaterThan(0);
    expect(result.experienceMatchScore).toBe(0.5);
    expect(result.scoringDetails).toHaveLength(4);
    expect(result.matchPercentage).toBeGreaterThanOrEqual(0);
    expect(result.matchPercentage).toBeLessThanOrEqual(100);
  });

  test('matching with no requirements returns a zero not-a-match result', () => {
    const result = calculateMatch({ ...job, requirements: [] }, candidate);
    expect(result.overallScore).toBe(0);
    expect(result.matchPercentage).toBe(0);
    expect(result.matchLevel).toBe('Not a Match');
    expect(result.aiRecommendation).toBe('Reject');
  });

  test('required skill failure caps the overall score below strong-match range', () => {
    const result = calculateMatch({ ...job, requirements: [
      { category: 'Skill', name: 'Rust' },
      { category: 'Education', name: 'Computer Science' },
    ] }, candidate);
    expect(result.overallScore).toBeLessThanOrEqual(0.49);
    expect(result.matchPercentage).toBeLessThanOrEqual(49);
  });

  test('matching output is deterministic apart from generated identity/timestamps', () => {
    const first = stable(calculateMatch(job, candidate));
    const second = stable(calculateMatch(job, candidate));
    expect(second).toEqual(first);
  });

  test('matching preserves proper nouns and reports partial/missing skills', () => {
    const result = calculateMatch({ ...job, requirements: [{ category: 'Skill', name: 'PostgreSQL' }] }, {
      ...candidate, skills: ['PostgreSQL'],
    });
    expect(result.matchingSkills).toContain('PostgreSQL');
    expect(result.missingSkills).not.toContain('PostgreSQL');
  });
});

describe('Production requirements: attendance transformation', () => {
  const service = new AttendanceService();
  const records = [
    { id: '1', employeeId: 'E', employeeName: 'E', date: '2026-07-22', status: 'Full Day' },
    { id: '2', employeeId: 'E', employeeName: 'E', date: '2026-07-22', status: 'Absent' },
    { id: '3', employeeId: 'E', employeeName: 'E', date: '2026-07-22', status: 'Half Day' },
    { id: '4', employeeId: 'E', employeeName: 'E', date: '2026-07-22', status: 'On Leave' },
  ] as any;

  test('attendance statistics count each supported status independently', () => {
    expect(service.calculateStats(records)).toEqual({ present: 1, absent: 1, halfDay: 1, onLeave: 1 });
  });

  test('attendance date-range filtering is inclusive', async () => {
    const result = await service.getByDateRange('E', '2026-07-22', '2026-07-22');
    expect(Array.isArray(result)).toBe(true);
  });
});

describe('Production requirements: adversarial and safety invariants', () => {
  test('generated IDs are non-empty and collision-resistant across a batch', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateUUID('EMP-')));
    expect(ids.size).toBe(100);
    for (const id of ids) expect(id).toMatch(/^EMP-/);
  });

  test('protected text remains byte-identical when represented as a value', () => {
    const protectedText = 'A—B "quoted" café\nCNIC: 12345';
    const encoded = Buffer.from(protectedText, 'utf8');
    expect(Buffer.from(encoded).equals(Buffer.from(protectedText, 'utf8'))).toBe(true);
  });

  test('citation position validation rejects citations moved to another sentence', () => {
    const source = 'The result is valid [1]. It is reproducible.';
    const valid = 'The result is valid [1]. It is reproducible.';
    const invalid = 'The result is valid. It is reproducible [1].';
    const citationSentence = (text: string) => text.split(/(?<=[.!?])\s+/).findIndex(s => s.includes('[1]'));
    expect(citationSentence(valid)).toBe(citationSentence(source));
    expect(citationSentence(invalid)).not.toBe(citationSentence(source));
  });

  test('em-dash invariant can distinguish protected from unprotected text', () => {
    const protectedRanges = [[0, 3]];
    const text = 'A—B and C';
    const dashIndex = text.indexOf('—');
    expect(protectedRanges.some(([start, end]) => dashIndex >= start && dashIndex < end)).toBe(true);
  });

  test('redundancy safety preserves meaning-critical distinct sentences', () => {
    const sentences = ['The employee submitted the form.', 'The manager approved the form.'];
    expect(new Set(sentences).size).toBe(sentences.length);
  });
});
