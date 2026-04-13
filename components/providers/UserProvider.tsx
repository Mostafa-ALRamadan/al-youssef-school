'use client';

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { createClient } from '@/lib/supabase';

interface UserInfo {
  id: string;
  email: string;
  name?: string;
  role: string;
  is_main_admin?: boolean;
}

interface UserContextType {
  userInfo: UserInfo | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType>({
  userInfo: null,
  loading: true,
  refreshUser: async () => {},
});

export function UserProvider({ children }: { children: ReactNode }) {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserInfo = async () => {
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // Use session data immediately (no loading flash)
        const sessionEmail = session.user.email || '';
        
        // Fetch profile in background for role, name, and main admin status
        const { data: profile } = await supabase
          .from('users')
          .select('id, email, role, is_main_admin')
          .eq('id', session.user.id)
          .single();

        // For display name, fetch from role tables
        let displayName = null;
        if (profile?.role === 'teacher') {
          const { data: teacher } = await supabase
            .from('teachers')
            .select('name')
            .eq('user_id', session.user.id)
            .single();
          displayName = teacher?.name;
        }

        setUserInfo({
          id: session.user.id,
          email: profile?.email || sessionEmail,
          name: displayName,
          role: profile?.role || 'authenticated',
          is_main_admin: profile?.is_main_admin,
        });
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserInfo();
  }, []);

  return (
    <UserContext.Provider value={{ userInfo, loading, refreshUser: fetchUserInfo }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
