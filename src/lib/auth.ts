import { logger } from './logger';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { jwtDecode } from 'jwt-decode';

export const GOOGLE_WORKSPACE_SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file',
];

let authInstance: any = null;
const TOKEN_KEY = 'hrm_access_token';
const USER_KEY = 'hrm_user';
const GOOGLE_ACCESS_TOKEN_KEY = 'hrm_google_access_token';

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

export function setAuthData(token: string, user: AuthUser, googleAccessToken?: string | null) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  if (googleAccessToken) {
    localStorage.setItem(GOOGLE_ACCESS_TOKEN_KEY, googleAccessToken);
  }
}

export function clearAuthData() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(GOOGLE_ACCESS_TOKEN_KEY);
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getGoogleAccessToken(): string | null {
  return localStorage.getItem(GOOGLE_ACCESS_TOKEN_KEY);
}

export function getAccessToken(): string | null {
  return getGoogleAccessToken();
}

export function getUser(): AuthUser | null {
  const token = getToken();
  if (!token) return null;

  const data = localStorage.getItem(USER_KEY);
  if (!data) {
    try {
      return jwtDecode<AuthUser>(token);
    } catch {
      return null;
    }
  }

  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function getAuthHeaders(contentType: 'json' | 'none' = 'json'): Record<string, string> {
  const token = getToken();
  return {
    ...(contentType === 'json' ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function verifySession(): Promise<AuthUser | null> {
  const token = getToken();
  if (!token) return null;

  try {
    const response = await fetch('/api/v1/auth/verify', {
      headers: getAuthHeaders('none'),
    });

    if (!response.ok) {
      clearAuthData();
      return null;
    }

    const payload = await response.json();
    const user = payload?.user || getUser();
    if (!user) {
      clearAuthData();
      return null;
    }

    localStorage.setItem(USER_KEY, JSON.stringify(user));
    return user as AuthUser;
  } catch (error) {
    logger.warn('Session verification failed:', error);
    return getUser();
  }
}

export async function isAuthenticated(): Promise<boolean> {
  return (await verifySession()) !== null;
}

export function hasToken(): boolean {
  return localStorage.getItem(TOKEN_KEY) !== null;
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

    const response = await fetch('/api/v1/auth/google', {
      method: 'POST',
      headers: getAuthHeaders('json'),
      body: JSON.stringify({ idToken }),
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

    const { token, user } = responseBody || {};
    if (!token || !user) {
      throw new Error('Login response is missing token or user payload');
    }

    setAuthData(token, user, googleAccessToken);
    return { token, user };
  } catch (error) {
    logger.error('Google sign in failure:', error);
    clearAuthData();
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
    await fetch('/api/v1/auth/logout', {
      method: 'POST',
      headers: getAuthHeaders('none'),
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
