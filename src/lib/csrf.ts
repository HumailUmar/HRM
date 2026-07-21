// src/lib/csrf.ts

import { Request, Response, NextFunction } from 'express';

const CSRF_COOKIE_NAME = 'hrm_csrf_token';
const CSRF_HEADER_NAME = 'x-csrf-token';

export function csrfProtection(req: Request, res: Response, next: NextFunction): void {
  const cookieToken = req.cookies?.[CSRF_COOKIE_NAME];
  const headerToken = req.headers[CSRF_HEADER_NAME];

  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    return next();
  }

  if (!cookieToken || !headerToken) {
    res.status(403).json({ error: 'CSRF token missing' });
    return;
  }

  if (cookieToken !== headerToken) {
    res.status(403).json({ error: 'CSRF token mismatch' });
    return;
  }

  next();
}

export function setCsrfCookie(res: Response): void {
  const token = `${Date.now()}-${Math.random().toString(36).slice(2, 15)}`;
  res.cookie(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000,
    path: '/',
  });
  return token as any;
}
