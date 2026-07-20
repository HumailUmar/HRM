const fs = require('fs');

let gs = fs.readFileSync('src/services/GoogleSheetsAdapter.ts', 'utf8');
gs = gs.replace(/await this.localFallback.saveDepartments\(\[depts\[0\]\]\);/g, 'await this.localFallback.saveDepartment(depts[0]);');
fs.writeFileSync('src/services/GoogleSheetsAdapter.ts', gs);

let factory = fs.readFileSync('src/services/DataAdapterFactory.ts', 'utf8');
factory = factory.replace(/new GoogleSheetsAdapter\(\)/g, 'new GoogleSheetsAdapter(settings)');
fs.writeFileSync('src/services/DataAdapterFactory.ts', factory);

