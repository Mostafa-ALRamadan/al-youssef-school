import { NextRequest } from 'next/server';
import { verifyToken, extractToken } from '@/lib/auth';
import { query } from '@/lib/db';

export interface MobileAuthUser {
  userId: string;
  role: 'parent';
  parentId: string;
}

/**
 * Verify mobile JWT token and return parent user data
 */
export async function verifyMobileToken(token: string): Promise<MobileAuthUser | null> {
  try {
    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'parent') {
      return null;
    }

    // Verify parent exists (userId in JWT IS the parent.id)
    const parentResult = await query(
      'SELECT id FROM parents WHERE id = $1',
      [decoded.userId]
    );

    if (parentResult.rows.length === 0) {
      return null;
    }

    return {
      userId: decoded.userId,
      role: 'parent',
      parentId: decoded.userId,
    };
  } catch (error) {
    return null;
  }
}

/**
 * Extract and verify token from mobile request
 */
export async function getMobileUser(request: NextRequest): Promise<MobileAuthUser | null> {
  const token = extractToken(request);
  if (!token) return null;
  return verifyMobileToken(token);
}

/**
 * Validate that parent owns the student
 */
export async function validateParentStudent(parentId: string, studentId: string): Promise<boolean> {
  const result = await query(
    'SELECT 1 FROM students WHERE id = $1 AND parent_id = $2',
    [studentId, parentId]
  );
  return result.rows.length > 0;
}
