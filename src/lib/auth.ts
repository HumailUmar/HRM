import { logger } from './logger';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { jwtDecode } from 'jwt-decode';

// Define combined OAuth scopes for Google Sheets and Google Drive File
export const GOOGLE_WORKSPACE_SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file'
];

let authInstance: any = null;
let isSigningIn = false;
const TOKEN_KEY = 'hrm_access_token';
const USER_KEY = 'hrm_user';

export interface AuthUser {
  employeeId: string;
  email: string;
  name: string;
  role: 'Employee' | 'Manager' | 'HR' | 'Admin';
  exp?: number;
}

// Safe lazy initialization of Firebase Auth
const getFirebaseAuth = () => {
  if (authInstance) return authInstance;

  try {
    const app = initializeApp(firebaseConfig);
    authInstance = getAuth(app);
    return authInstance;
  } catch (error) {
    logger.error("Failed to initialize Firebase:", error);
    return null;
  }
};

/**
 * Store the JWT token and decoded user info
 */
export function setAuthData(token: string, user: AuthUser) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

/**
 * Clear auth data on logout
 */
export function clearAuthData() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

/**
 * Get the stored JWT token
 */
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Get the stored user info (decoded from JWT)
 */
export function getUser(): AuthUser | null {
  const token = getToken();
  if (!token) return null;
  const data = localStorage.getItem(USER_KEY);
  if (!data) {
    try {
      const decoded = jwtDecode<AuthUser>(token);
      return decoded;
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

/**
 * Check if the user is authenticated by verifying the token with the server.
 * This calls a protected endpoint to validate the token.
 */
export async function isAuthenticated(): Promise<boolean> {
  const token = getToken();
  if (!token) return false;

  // Verify token with the server
  try {
    const response = await fetch('/api/v1/auth/verify', {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (response.ok) {
      // Token is valid, user is authenticated
      return true;
    }
    // Token invalid or expired
    clearAuthData();
    return false;
  } catch {
    // Network error – assume not authenticated
    return false;
  }
}

/**
 * Synchronous version for initial render (checks presence only)
 * Use isAuthenticated() for actual validation.
 */
export function hasToken(): boolean {
  return localStorage.getItem(TOKEN_KEY) !== null;
}

/**
 * Google OAuth sign-in – gets a JWT from the server
 */
export const googleSignIn = async (): Promise<{ user: AuthUser; token: string } | null> => {
  const auth = getFirebaseAuth();
  if (!auth) {
    logger.error("Firebase Auth not initialized");
    return null;
  }

  try {
    isSigningIn = true;
    const provider = new GoogleAuthProvider();
    GOOGLE_WORKSPACE_SCOPES.forEach(scope => provider.addScope(scope));

    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    
    // Get ID Token from signed in user
    const idToken = await result.user.getIdToken();
    if (!idToken) {
      throw new Error('Failed to extract Google ID Token');
    }

    const response = await fetch('/api/v1/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken, googleAccessToken: credential?.accessToken }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || error.message || 'Login failed');
    }

    const data = await response.json();
    const { token, user } = data;
    setAuthData(token, user);
    return { token, user };
  } catch (error) {
    logger.error("Google sign in failure:", error);
    return null;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Logout – clear auth data
 */
export const logout = async () => {
  const auth = getFirebaseAuth();
  if (auth) {
    try {
      await auth.signOut();
    } catch (e) {
      logger.warn("Sign out err:", e);
    }
  }
  clearAuthData();
  // Optionally call server logout endpoint
  try {
    await fetch('/api/v1/auth/logout', { method: 'POST' });
  } catch {
    // Ignore network errors
  }
};

export const initAuth = (
  onAuthSuccess: (user: any, token: string) => void,
  onAuthFailure: () => void
) => {
  // Return dummy unsubscribe to prevent runtime/compile issues during migration
  return () => {};
};

export const getAccessToken = () => localStorage.getItem(TOKEN_KEY);
