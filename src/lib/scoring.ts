import { ReviewTemplateSection, ReviewTemplateKPI, DecisionMatrix, RedFlag } from '../types';

// ============================================================
//  TYPES
// ============================================================

export interface KPI {
  id: string;
  label: string;
  weight: number;
  maxScore?: number;
}

export interface SectionScore {
  sectionId: string;
  sectionName: string;
  kpiScores: Record<string, number>; // kpiId -> score
  weight: number; // Section weight (should sum to 1 across all sections)
}

export interface ScoringValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// ============================================================
//  VALIDATION HELPERS
// ============================================================

/**
 * Validate that all required sections are scored.
 * @param sections – Expected sections from the review template.
 * @param submittedScores – Sections that were actually scored.
 */
function validateAllSectionsScored<T extends { id: string }>(
  sections: T[],
  submittedScores: Pick<SectionScore, 'sectionId'>[]
): string[] {
  const submittedIds = new Set(submittedScores.map(s => s.sectionId));
  const missing = sections.filter(s => !submittedIds.has(s.id)).map(s => s.id);
  if (missing.length > 0) {
    return [`Missing sections: ${missing.join(', ')}`];
  }
  return [];
}

/**
 * Validate that all referenced KPI IDs exist and weights sum to 1.
 */
function validateKPIs(
  kpis: KPI[],
  scores: Record<string, number>
): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  const kpiMap = new Map(kpis.map(k => [k.id, k]));

  // Check for missing KPIs
  for (const kpiId of Object.keys(scores)) {
    if (!kpiMap.has(kpiId)) {
      errors.push(`KPI ID "${kpiId}" not found in template`);
    }
  }

  // Check if any required KPIs are missing
  const requiredIds = kpis.map(k => k.id);
  const scoredIds = Object.keys(scores);
  const missingRequired = requiredIds.filter(id => !scoredIds.includes(id));
  if (missingRequired.length > 0) {
    errors.push(`Missing required KPIs: ${missingRequired.join(', ')}`);
  }

   // Check weights
   const totalWeight = kpis.reduce((sum, k) => sum + (Number.isFinite(k.weight) ? k.weight : 0), 0);
   if (!Number.isFinite(totalWeight) || Math.abs(totalWeight - 1) > 0.001) {
     warnings.push(`KPI weights sum to ${totalWeight * 100}% (expected 100%)`);
   }

  return { errors, warnings };
}

/**
 * Validate a complete section score submission.
 */
export function validateScoringSubmission(
  sections: SectionScore[],
  templateSections: any[], // Array of { id, weight, kpis: KPI[] }
  isPartialAllowed: boolean = false // Default: partial submissions not allowed
): ScoringValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Validate all sections are scored (unless partial allowed)
  if (!isPartialAllowed) {
    const missing = validateAllSectionsScored(templateSections, sections);
    if (missing.length > 0) {
      errors.push(...missing);
    }
  }

  // 2. Validate each section's KPIs
  for (const section of sections) {
    const templateSection = templateSections.find(s => s.id === section.sectionId);
    if (!templateSection) {
      errors.push(`Section "${section.sectionId}" not found in template`);
      continue;
    }

    // Validate KPIs within this section
    const kpiValidation = validateKPIs(templateSection.kpis, section.kpiScores);
    errors.push(...kpiValidation.errors);
    warnings.push(...kpiValidation.warnings);
  }

  // 3. Check section weights sum to 1
  const totalSectionWeight = sections.reduce((sum, s) => sum + s.weight, 0);
  if (Math.abs(totalSectionWeight - 1) > 0.001) {
    warnings.push(`Section weights sum to ${totalSectionWeight * 100}% (expected 100%)`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// ============================================================
//  SCORE CALCULATIONS (with validation)
// ============================================================

/**
 * Calculate a section score with proper validation.
 * Throws error if validation fails.
 */
export function calculateSectionScore(
  kpis: KPI[],
  scores: Record<string, number>,
  sectionId: string
): { score: number; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Validate all KPIs exist
  const kpiMap = new Map(kpis.map(k => [k.id, k]));
  const missingKpis = Object.keys(scores).filter(id => !kpiMap.has(id));
  if (missingKpis.length > 0) {
    errors.push(`Unknown KPIs in section ${sectionId}: ${missingKpis.join(', ')}`);
  }

  // 2. Check all required KPIs are scored
  const requiredKpis = kpis.filter(k => (k.weight || 0) > 0);
  const missingRequired = requiredKpis.filter(k => !(k.id in scores));
  if (missingRequired.length > 0) {
    errors.push(`Missing required KPIs for section ${sectionId}: ${missingRequired.map(k => k.id).join(', ')}`);
  }

  // 3. Validate weights sum to 1
  const totalWeight = kpis.reduce((sum, k) => sum + (Number.isFinite(k.weight) ? k.weight : 0), 0);
  if (!Number.isFinite(totalWeight) || Math.abs(totalWeight - 1) > 0.001) {
    warnings.push(`Section ${sectionId} weights sum to ${totalWeight * 100}% (expected 100%)`);
  }

  // If there are errors, return 0 with error details
  if (errors.length > 0) {
    return { score: 0, errors, warnings };
  }

  // 4. Calculate weighted score
  let weightedScore = 0;
  let scoreErrors: string[] = [];

  for (const kpi of kpis) {
    const score = scores[kpi.id];
    const weight = Number.isFinite(kpi.weight) ? kpi.weight : 0;
    if (score === undefined || !Number.isFinite(score) || score < 0) {
      scoreErrors.push(`KPI ${kpi.id} has invalid score: ${score}`);
      continue;
    }
    weightedScore += score * weight;
  }

  if (scoreErrors.length > 0) {
    errors.push(...scoreErrors);
    return { score: 0, errors, warnings };
  }

  if (!Number.isFinite(weightedScore)) {
    errors.push(`Section ${sectionId} produced a non-finite score`);
    return { score: 0, errors, warnings };
  }

  return { score: weightedScore, errors: [], warnings };
}

/**
 * Calculate overall score across all sections with validation.
 * Throws error if validation fails.
 */
export function calculateOverallScore(
  sections: SectionScore[],
  templateSections: any[],
  isPartialAllowed: boolean = false
): { score: number; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Validate all sections are scored (unless partial allowed)
  if (!isPartialAllowed) {
    const missing = validateAllSectionsScored(templateSections, sections);
    if (missing.length > 0) {
      errors.push(...missing);
    }
  }

  // 2. Calculate each section score
  let overallScore = 0;
  const sectionErrors: string[] = [];

  for (const section of sections) {
    const templateSection = templateSections.find(s => s.id === section.sectionId);
    if (!templateSection) {
      errors.push(`Section "${section.sectionId}" not found in template`);
      continue;
    }

    const { score, errors: secErrors, warnings: secWarnings } = calculateSectionScore(
      templateSection.kpis,
      section.kpiScores,
      section.sectionId
    );

    if (secErrors.length > 0) {
      sectionErrors.push(...secErrors);
    }
    warnings.push(...secWarnings);

    // Weighted by section weight
    const sectionWeight = Number.isFinite(section.weight) ? section.weight : 0;
    overallScore += score * sectionWeight;
  }

  // 3. Check section weights sum to 1
  const totalSectionWeight = sections.reduce((sum, s) => sum + (Number.isFinite(s.weight) ? s.weight : 0), 0);
  if (!Number.isFinite(totalSectionWeight) || Math.abs(totalSectionWeight - 1) > 0.001) {
    warnings.push(`Section weights sum to ${totalSectionWeight * 100}% (expected 100%)`);
  }

  if (errors.length > 0 || sectionErrors.length > 0) {
    errors.push(...sectionErrors);
    return { score: 0, errors, warnings };
  }

  if (!Number.isFinite(overallScore)) {
    errors.push('Overall score is non-finite');
    return { score: 0, errors, warnings };
  }

  return { score: overallScore, errors: [], warnings };
}

/**
 * SAFE EXPRESSION EVALUATOR
 * 
 * Only allows:
 * - Numbers (integers and decimals)
 * - Comparison operators: ==, !=, >, <, >=, <=
 * - Boolean operators: &&, ||, !
 * - Parentheses for grouping
 * - Variables: score (the numeric score)
 * 
 * NO function calls, NO object access, NO array access, NO arbitrary code execution.
 */
function safeEvaluate(expression: string, score: number): boolean {
  if (!Number.isFinite(score)) {
    throw new Error(`Cannot evaluate against non-finite score: ${score}`);
  }
  // 1. Replace 'score' with the actual numeric value
  const sanitized = expression.replace(/score/g, String(score));

  // 2. Validate that the expression contains ONLY safe characters.
  // Arithmetic operators (* / %) are NOT allowed: conditions must be comparisons.
  // Permitting them let misconfigured conditions silently evaluate to false.
  const allowedPattern = /^[\d\s+\-.]+$/;
  if (!allowedPattern.test(sanitized)) {
    throw new Error(`Unsafe or unsupported expression detected: "${expression}"`);
  }

  // 3. For maximum safety, use a simple parser.
  return evaluateSafeExpression(sanitized);
}

/**
 * Manually parse and evaluate a safe expression.
 * This avoids eval() and Function constructor entirely.
 */
function evaluateSafeExpression(expr: string): boolean {
  // Remove whitespace for easier parsing
  const cleaned = expr.replace(/\s/g, '');
  
  // Handle simple comparisons first
  // Pattern: value1 operator value2
  const comparisonMatch = cleaned.match(/^([\d.]+)(==|!=|>=|<=|>|<)([\d.]+)$/);
  if (comparisonMatch) {
    const [, left, operator, right] = comparisonMatch;
    const leftNum = parseFloat(left);
    const rightNum = parseFloat(right);
    
    switch (operator) {
      case '==': return leftNum === rightNum;
      case '!=': return leftNum !== rightNum;
      case '>=': return leftNum >= rightNum;
      case '<=': return leftNum <= rightNum;
      case '>': return leftNum > rightNum;
      case '<': return leftNum < rightNum;
      default: return false;
    }
  }
  
  // Handle boolean AND/OR with comparisons inside
  // Pattern: (value1 operator value2) && (value3 operator value4)
  // Split on && and || and evaluate each part.
  
  // Check for AND (&&)
  if (cleaned.includes('&&')) {
    const parts = cleaned.split('&&');
    return parts.every(part => evaluateSafeExpression(part));
  }
  
  // Check for OR (||)
  if (cleaned.includes('||')) {
    const parts = cleaned.split('||');
    return parts.some(part => evaluateSafeExpression(part));
  }
  
  // Check for NOT (!)
  if (cleaned.startsWith('!')) {
    return !evaluateSafeExpression(cleaned.slice(1));
  }
  
  // Check for parentheses
  if (cleaned.startsWith('(') && cleaned.endsWith(')')) {
    return evaluateSafeExpression(cleaned.slice(1, -1));
  }
  
  // Fallback: try parsing as a simple comparison
  const match = cleaned.match(/^([\d.]+)(==|!=|>=|<=|>|<)([\d.]+)$/);
  if (match) {
    const [, left, operator, right] = match;
    const leftNum = parseFloat(left);
    const rightNum = parseFloat(right);
    
    switch (operator) {
      case '==': return leftNum === rightNum;
      case '!=': return leftNum !== rightNum;
      case '>=': return leftNum >= rightNum;
      case '<=': return leftNum <= rightNum;
      case '>': return leftNum > rightNum;
      case '<': return leftNum < rightNum;
      default: return false;
    }
  }
  
  // If we can't parse it, return false (safe default)
  console.warn(`Unparseable expression: "${expr}"`);
  return false;
}

/**
 * Evaluates a weight against conditions
 */
function evaluateCondition(
  condition: string | undefined,
  weightedScore: number
): boolean {
  if (!condition) return true;
  
  try {
    return safeEvaluate(condition, weightedScore);
  } catch (error) {
    console.error(`Failed to evaluate condition: "${condition}"`, error);
    return false; // Fail safe
  }
}

/**
 * Evaluate Red Flag conditions
 * 
 * @param flags - Array of RedFlag objects
 * @param weightedScore - The weighted score to evaluate against
 * @returns Array of triggered RedFlag objects
 */
export function evaluateRedFlags(
  flags: RedFlag[],
  weightedScore: number
): RedFlag[] {
  return flags.filter(flag => {
    try {
      return evaluateCondition(flag.condition, weightedScore);
    } catch (error) {
      console.error('Error evaluating red flag:', flag, error);
      return false;
    }
  });
}

/**
 * Evaluate Decision Matrix
 * 
 * @param matrix - Array of DecisionMatrix objects
 * @param weightedScore - The weighted score to evaluate against
 * @returns The matching DecisionMatrix or null
 */
export function evaluateDecisionMatrix(
  matrix: DecisionMatrix[],
  weightedScore: number
): DecisionMatrix | null {
  // Sort by complexity or order (assuming order is significant)
  // Find the first matching condition
  for (const item of matrix) {
    try {
      if (evaluateCondition(item.condition, weightedScore)) {
        return item;
      }
    } catch (error) {
      console.error('Error evaluating decision matrix item:', item, error);
      // Continue to next item
    }
  }
  return null;
}
