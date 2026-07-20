const fs = require('fs');
let content = fs.readFileSync('src/lib/scoring.ts', 'utf8');

content = content.replace(/eval\(flag\.condition\.replace\('score', weightedScore\.toString\(\)\)\)/g, 'evaluate(flag.condition.replace(/score/g, weightedScore.toString()))');
content = content.replace(/eval\(matrix\.condition\.replace\('score', weightedScore\.toString\(\)\)\)/g, 'evaluate(matrix.condition.replace(/score/g, weightedScore.toString()))');

if (!content.includes("import { evaluate }")) {
    content = "import { evaluate } from 'mathjs';\n" + content;
}

fs.writeFileSync('src/lib/scoring.ts', content);
