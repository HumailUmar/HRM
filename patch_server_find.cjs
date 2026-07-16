const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

content = content.replace(/await getEmployeesFromDB\(\)\.find/g, "(await getEmployeesFromDB()).find");
content = content.replace(/await getEmployeesFromDB\(\)\.findIndex/g, "(await getEmployeesFromDB()).findIndex");
content = content.replace(/await getLeavesFromDB\(\)\.findIndex/g, "(await getLeavesFromDB()).findIndex");

fs.writeFileSync('server.ts', content);
