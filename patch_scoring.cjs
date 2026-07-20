const fs = require('fs');
let content = fs.readFileSync('src/lib/scoring.ts', 'utf8');

const oldStr = `export function evaluateDecisionMatrix(
  weightedScore: number,
  matrices: DecisionMatrix[],
  redFlags: RedFlag[]
): string {
  // Check red flags first
  for (const flag of redFlags) {
    if (eval(flag.condition.replace('score', weightedScore.toString()))) {
      return flag.alertMessage; 
    }
  }

  // Evaluate decision matrices
  for (const matrix of matrices) {
     if (eval(matrix.condition.replace('score', weightedScore.toString()))) {
       return matrix.recommendation; 
     }
  }
    
  return 'Retain'; // Default
}`;

const newStr = `import { evaluate } from 'mathjs';\n\nexport function evaluateDecisionMatrix(
  weightedScore: number,
  matrices: DecisionMatrix[],
  redFlags: RedFlag[]
): string {
  // Check red flags first
  for (const flag of redFlags) {
    try {
      if (evaluate(flag.condition.replace(/score/g, weightedScore.toString()))) {
        return flag.alertMessage; 
      }
    } catch (e) {
      console.error("Failed to evaluate red flag condition:", e);
    }
  }

  // Evaluate decision matrices
  for (const matrix of matrices) {
    try {
      if (evaluate(matrix.condition.replace(/score/g, weightedScore.toString()))) {
        return matrix.recommendation; 
      }
    } catch (e) {
      console.error("Failed to evaluate decision matrix condition:", e);
    }
  }
    
  return 'Retain'; // Default
}`;

content = content.replace(oldStr, newStr);

// Avoid duplicate import if it already has it
if (content.split("import { evaluate } from 'mathjs';").length > 2) {
    content = content.replace("import { evaluate } from 'mathjs';\n\n", "");
    content = "import { evaluate } from 'mathjs';\n" + content;
}

fs.writeFileSync('src/lib/scoring.ts', content);
