const fs = require('fs');
let content = fs.readFileSync('src/components/Documents.tsx', 'utf8');

// Replace the escaped syntax
content = content.replace(/id: \\`DOC-\\\${Date.now\(\)}\\`/, "id: `DOC-${Date.now()}`");
content = content.replace(/fileUrl: data.fileUrl \|\| \\`https:\/\/drive.google.com\/uc\?export=view&id=\\\${data.fileId}\\`/, "fileUrl: data.fileUrl || `https://drive.google.com/uc?export=view&id=${data.fileId}`");
content = content.replace(/className={\\`text-xs px-2 py-0.5 rounded-full \\\${/g, "className={`text-xs px-2 py-0.5 rounded-full ${");
content = content.replace(/  'bg-amber-100 text-amber-700'\\n                          }\\`}/g, "  'bg-amber-100 text-amber-700'\n                          }`}");

fs.writeFileSync('src/components/Documents.tsx', content);
