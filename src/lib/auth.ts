import { logger } from './logger';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { fetchWithRetry, CircuitBreakerConfig } from './retry';
import { incrementAuthSuccess, incrementAuthFailure } from './metrics';

const AUTH_CIRCUIT_BREAKER: CircuitBreakerConfig = {
  failureThreshold: 5,
  successThreshold: 2,
  timeout: 30000,
};

export const GOOGLE_WORKSPACE_SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file',
];

let authInstance: any = null;
// Credentials live in a Secure, HttpOnly session cookie set by the server.
// Only non-secret profile data is kept in memory for the current tab.
let currentUser: AuthUser | null = null;
let googleAccessToken: string | null = null;

export interface AuthUser {
  employeeId: string;
  email: string;
  name: string;
  role: 'Employee' | 'Manager' | 'HR' | 'Admin';
  exp?: number;
}

const getFirebaseAuth = () => {
  if (authInstance) return authInstance;

  try {
    const app = initializeApp(firebaseConfig);
    authInstance = getAuth(app);
    return authInstance;
  } catch (error) {
    logger.error('Failed to initialize Firebase:', error);
    return null;
  }
};

export function setAuthData(_token: string, user: AuthUser, accessToken?: string | null) {
  currentUser = user;
  googleAccessToken = accessToken || null;
}

export function clearAuthData() {
  currentUser = null;
  googleAccessToken = null;
}

// JWTs are intentionally not readable from JavaScript. The browser sends the
// HttpOnly cookie automatically for same-origin API requests.
export function getToken(): string | null { return null; }
export function getGoogleAccessToken(): string | null { return googleAccessToken; }
export function getAccessToken(): string | null { return googleAccessToken; }
export function getUser(): AuthUser | null { return currentUser; }

export function getAuthHeaders(contentType: 'json' | 'none' = 'json'): Record<string, string> {
  return {
    ...(contentType === 'json' ? { 'Content-Type': 'application/json' } : {}),
    // JWT is sent via HttpOnly cookie; add an X-Requested-With header for CSRF defense
    'X-Requested-With': 'XMLHttpRequest',
  };
}

export async function verifySession(): Promise<AuthUser | null> {
  try {
    const response = await fetchWithRetry('/api/v1/auth/verify', {
      headers: { ...getAuthHeaders('none') },
      credentials: 'same-origin',
    }, {
      maxRetries: 2,
      baseDelay: 500,
      maxDelay: 5000,
      circuitBreaker: AUTH_CIRCUIT_BREAKER,
    });

    if (!response.ok) {
      clearAuthData();
      incrementAuthFailure();
      return null;
    }

    const payload = await response.json();
    const user = payload?.user || getUser();
    if (!user) {
      clearAuthData();
      incrementAuthFailure();
      return null;
    }

    currentUser = user as AuthUser;
    incrementAuthSuccess();
    return currentUser;
  } catch (error) {
    logger.warn('Session verification failed:', error);
    incrementAuthFailure();
    return getUser();
  }
}

export async function isAuthenticated(): Promise<boolean> {
  return (await verifySession()) !== null;
}

export function hasToken(): boolean {
  return currentUser !== null;
}

export const googleSignIn = async (): Promise<{ user: AuthUser; token: string } | null> => {
  const auth = getFirebaseAuth();
  if (!auth) {
    logger.error('Firebase Auth not initialized');
    return null;
  }

  try {
    const provider = new GoogleAuthProvider();
    GOOGLE_WORKSPACE_SCOPES.forEach((scope) => provider.addScope(scope));

    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const googleAccessToken = credential?.accessToken || null;
    const idToken = await result.user.getIdToken();
    if (!idToken) {
      throw new Error('Failed to extract Google ID Token');
    }

    const response = await fetchWithRetry('/api/v1/auth/google', {
      method: 'POST',
      headers: getAuthHeaders('json'),
      body: JSON.stringify({ idToken }),
    }, {
      maxRetries: 2,
      baseDelay: 500,
      maxDelay: 5000,
      circuitBreaker: AUTH_CIRCUIT_BREAKER,
    });

    let responseBody: any = null;
    try {
      responseBody = await response.json();
    } catch {
      responseBody = null;
    }

    if (!response.ok) {
      throw new Error(responseBody?.error || responseBody?.message || 'Login failed');
    }

    const { user } = responseBody || {};
    if (!user) {
      throw new Error('Login response is missing user payload');
    }

    setAuthData('', user, googleAccessToken);
    incrementAuthSuccess();
    return { token: '', user };
  } catch (error) {
    logger.error('Google sign in failure:', error);
    clearAuthData();
    incrementAuthFailure();
    return null;
  }
};

export const logout = async () => {
  const auth = getFirebaseAuth();
  if (auth) {
    try {
      await auth.signOut();
    } catch (e) {
      logger.warn('Sign out err:', e);
    }
  }

  clearAuthData();

  try {
    await fetchWithRetry('/api/v1/auth/logout', {
      method: 'POST',
      headers: { ...getAuthHeaders('none') },
      credentials: 'same-origin',
    }, {
      maxRetries: 1,
      baseDelay: 500,
      maxDelay: 2000,
      circuitBreaker: AUTH_CIRCUIT_BREAKER,
    });
  } catch {
    // Ignore logout transport errors.
  }
};

export const initAuth = (
  _onAuthSuccess: (user: any, token: string) => void,
  _onAuthFailure: () => void,
) => {
  return () => {};
};
