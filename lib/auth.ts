import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import bcrypt from 'bcrypt';
import { query } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

export interface AuthUser {
  userId: string;
  email: string;
  role: 'admin' | 'teacher' | 'parent';
}

/**
 * Verify JWT token and return user data
 */
export function verifyToken(token: string): AuthUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Extract token from Authorization header
 */
export function extractToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  return authHeader?.replace('Bearer ', '') || null;
}

/**
 * Get current user from request
 */
export function getCurrentUser(request: NextRequest): AuthUser | null {
  const token = extractToken(request);
  if (!token) return null;
  return verifyToken(token);
}

/**
 * Create new auth user with hashed password
 */
export async function createAuthUser(
  email: string, 
  password: string, 
  role: string, 
  name?: string
): Promise<{ id: string; error: Error | null }> {
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const uuidResult = await query('SELECT gen_random_uuid() as uuid');
    const userId = uuidResult.rows[0].uuid;
    
    await query(
      'INSERT INTO users (id, email, password_hash, role, name) VALUES ($1, $2, $3, $4, $5)',
      [userId, email, hashedPassword, role, name || '']
    );
    
    return { id: userId, error: null };
  } catch (error: any) {
    return { id: '', error: error };
  }
}

/**
 * Update auth user (email and/or password)
 */
export async function updateAuthUser(
  userId: string, 
  updates: { email?: string; password?: string }
): Promise<{ error: Error | null }> {
  try {
    if (updates.password) {
      const hashedPassword = await bcrypt.hash(updates.password, 10);
      await query(
        'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [hashedPassword, userId]
      );
    }
    
    if (updates.email) {
      await query(
        'UPDATE users SET email = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [updates.email, userId]
      );
    }
    
    return { error: null };
  } catch (error: any) {
    return { error };
  }
}

/**
 * Delete auth user
 */
export async function deleteAuthUser(userId: string): Promise<{ error: Error | null }> {
  try {
    await query('DELETE FROM users WHERE id = $1', [userId]);
    return { error: null };
  } catch (error: any) {
    return { error };
  }
}
