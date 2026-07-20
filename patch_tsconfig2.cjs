const fs = require('fs');
let content = fs.readFileSync('tsconfig.json', 'utf8');
let json = JSON.parse(content);
json.compilerOptions.esModuleInterop = true;
json.compilerOptions.allowSyntheticDefaultImports = true;
json.compilerOptions.resolveJsonModule = true;
fs.writeFileSync('tsconfig.json', JSON.stringify(json, null, 2));
