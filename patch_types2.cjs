const fs = require('fs');

let typesContent = fs.readFileSync('src/types.ts', 'utf8');

// Add punchCode to root Employee interface
if (!typesContent.includes('  punchCode?: string; // root level alias')) {
  typesContent = typesContent.replace('export interface Employee {\n  id: string;\n  // ===== ROOT-LEVEL ALIASES =====', 'export interface Employee {\n  id: string;\n  // ===== ROOT-LEVEL ALIASES =====\n  punchCode?: string; // root level alias');
  fs.writeFileSync('src/types.ts', typesContent);
}

