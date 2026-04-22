// Client-side auth utilities for getting JWT tokens
import { jwtVerify } from 'jose';

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
 * Verify JWT token and return user data (browser-safe)
 */
export async function verifyToken(token: string): Promise<AuthUser | null> {
  try {
    const JWT_SECRET = process.env.NEXT_PUBLIC_JWT_SECRET || 'fallback-secret-key';
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as AuthUser;
  } catch (error) {
    return null;
  }
}
