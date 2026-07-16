const fs = require('fs');
let content = fs.readFileSync('src/types.ts', 'utf8');

const regex = /export interface AppSettings \{/;
const addFields = `export interface AppSettings {
  storageType?: 'local' | 'mysql' | 'postgresql';
  mysqlHost?: string;
  mysqlPort?: number | string;
  mysqlDatabase?: string;
  mysqlUsername?: string;
  mysqlPassword?: string;
  mysqlSSL?: boolean;
  mysqlPoolSize?: number | string;
  mysqlTimeout?: number | string;
  
  postgresHost?: string;
  postgresPort?: number | string;
  postgresDatabase?: string;
  postgresUsername?: string;
  postgresPassword?: string;
  postgresSSL?: boolean;
  postgresPoolSize?: number | string;
  postgresTimeout?: number | string;
`;
content = content.replace(regex, addFields);
fs.writeFileSync('src/types.ts', content);
