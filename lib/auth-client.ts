// Client-side auth utilities for getting JWT tokens

const TOKEN_KEY = 'auth_token';

export interface AuthUser {
  userId: string;
  email: string;
  role: 'admin' | 'teacher' | 'parent';
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
}

export function getAuthHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

/**
 * Note: JWT verification should be done server-side for security
 * This function only checks if token exists and has valid format
 */
export function isTokenValid(token: string): boolean {
  try {
    // Basic format check - JWT has 3 parts separated by dots
    const parts = token.split('.');
    return parts.length === 3 && parts.every(part => part.length > 0);
  } catch (error) {
    return false;
  }
}
