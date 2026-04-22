'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
  clearUser: () => void;
  setUserInfo: (user: UserInfo) => void;
}

const UserContext = createContext<UserContextType>({
  userInfo: null,
  loading: true,
  refreshUser: async () => {},
  clearUser: () => {},
  setUserInfo: () => {},
});

export function UserProvider({ children }: { children: ReactNode }) {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserInfo = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      
      if (token) {
        // Skip client-side verification, let server verify the token
        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const { user: userData } = await response.json();
          
          setUserInfo({
            id: userData.id,
            email: userData.email,
            name: userData.name,
            role: userData.role,
            is_main_admin: userData.is_main_admin,
          });
        }
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

  const clearUser = () => {
    setUserInfo(null);
  };

  const setUserInfoWrapper = (user: UserInfo) => {
    setUserInfo(user);
  };

  return (
    <UserContext.Provider value={{ userInfo, loading, refreshUser: fetchUserInfo, clearUser, setUserInfo: setUserInfoWrapper }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
