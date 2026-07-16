const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

// 1. Replace authenticateToken and add authorize
const authCodeOld = `const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    // Fallback to API Key if no JWT is provided
    return validateApiKey(req, res, next);
  }

  jwt.verify(token, ACTUAL_JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
};`;

const authCodeNew = `const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  // If no JWT, fallback to API key
  if (!token) {
    return validateApiKey(req, res, next);
  }

  jwt.verify(token, ACTUAL_JWT_SECRET, (err: any, decoded: any) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = decoded; // Attach user payload (id, role, employeeId, etc.)
    next();
  });
};

const authorize = (allowedRoles: string[]) => {
  return (req: any, res: any, next: any) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthenticated' });
    }
    // If it's an API Key, the role might be Admin
    const userRole = req.user.role || 'Employee';
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        error: \`Access denied. Required roles: \${allowedRoles.join(', ')}\` 
      });
    }
    next();
  };
};`;

if(content.includes(authCodeOld)) {
    content = content.replace(authCodeOld, authCodeNew);
} else {
    console.error("authCodeOld not found!");
}

// 2. Update /api/v1/auth/token
const tokenCodeOld = `app.post('/api/v1/auth/token', (req, res) => {
  const { apiKey } = req.body;
  if (!apiKey || !apiKey.startsWith('he_')) {
    return res.status(401).json({ error: 'Invalid API key' });
  }
  const keys = getApiKeys();
  const validKey = keys.find(k => k.key === apiKey && k.isActive === true);
  if (!validKey) {
    return res.status(401).json({ error: 'Invalid or revoked API key' });
  }
  const token = jwt.sign({ apiKey }, ACTUAL_JWT_SECRET, { expiresIn: '24h' });
  res.json({ token, expiresIn: 86400 });
});`;

const tokenCodeNew = `app.post('/api/v1/auth/token', (req: any, res: any) => {
  const { apiKey } = req.body;
  if (!apiKey || !apiKey.startsWith('he_')) {
    return res.status(401).json({ error: 'Invalid API key' });
  }
  const keys = getApiKeys();
  const validKey = keys.find((k: any) => k.key === apiKey && k.isActive === true);
  if (!validKey) {
    return res.status(401).json({ error: 'Invalid or revoked API key' });
  }
  
  const token = jwt.sign(
    { apiKey, role: 'Admin' }, 
    ACTUAL_JWT_SECRET, 
    { expiresIn: '24h' }
  );
  res.json({ token, expiresIn: 86400 });
});`;

if(content.includes(tokenCodeOld)) {
    content = content.replace(tokenCodeOld, tokenCodeNew);
} else {
    console.error("tokenCodeOld not found!");
}

// 3. Remove global app.use('/api/v1', authenticateToken)
const globalAuthOld = `// Specific exception for key management (internal UI use)
const isKeyManagementRoute = (req) => {
  return req.path.startsWith('/api/v1/api-keys');
};
app.use('/api/v1', (req, res, next) => {
  if (isKeyManagementRoute(req)) return next();
  authenticateToken(req, res, next);
});`;

if(content.includes(globalAuthOld)) {
    content = content.replace(globalAuthOld, '');
} else {
    console.error("globalAuthOld not found!");
}

fs.writeFileSync('server.ts', content);
