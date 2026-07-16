const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('src');

files.forEach(file => {
  if (file === 'src/lib/logger.ts') return;
  let content = fs.readFileSync(file, 'utf8');
  
  let changed = false;
  if (content.includes('console.log') || content.includes('console.error') || content.includes('console.warn') || content.includes('console.debug')) {
    content = content.replace(/console\.log/g, 'logger.info');
    content = content.replace(/console\.error/g, 'logger.error');
    content = content.replace(/console\.warn/g, 'logger.warn');
    content = content.replace(/console\.debug/g, 'logger.debug');
    
    // determine relative path to src/lib/logger
    const dir = path.dirname(file);
    const relPath = path.relative(dir, 'src/lib/logger').replace(/\\/g, '/');
    const importPath = relPath.startsWith('.') ? relPath : './' + relPath;
    
    // add import statement at the top
    if (!content.includes("import { logger }")) {
      const importStmt = `import { logger } from '${importPath}';\n`;
      content = importStmt + content;
    }
    
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});
