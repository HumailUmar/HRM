const fs = require('fs');

function patchFile(filename) {
  let content = fs.readFileSync(filename, 'utf8');
  content = content.replace(/'' \|\| 0/g, '0');
  fs.writeFileSync(filename, content);
}

patchFile('src/services/adapters/MySQLAdapter.ts');
patchFile('src/services/adapters/PostgreSQLAdapter.ts');
