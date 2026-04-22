import { useState, useEffect } from 'react';
import { verifyToken } from '@/lib/auth';
import type { User } from '@/types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const token = localStorage.getItem('auth_token');
      
      if (token) {
        const verifiedUser = verifyToken(token);
        
        if (verifiedUser) {
          // Get user details from our auth/me endpoint
          const response = await fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const { user: userData } = await response.json();
            setUser(userData);
          }
        }
      }
      
      setLoading(false);
    };

    getUser();
  }, []);

  return { user, loading };
}
