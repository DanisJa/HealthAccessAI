import React, { createContext, useEffect, useState } from 'react';
import { apiRequest } from './queryClient';
import { User, LoginInput, RegisterInput } from '@shared/schema';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (data: LoginInput) => Promise<User>;
  register: (data: RegisterInput) => Promise<User>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: async () => { throw new Error('AuthContext not initialized'); },
  register: async () => { throw new Error('AuthContext not initialized'); },
  logout: async () => { throw new Error('AuthContext not initialized'); },
});

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated on component mount
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        const response = await apiRequest('GET', '/api/auth/me');
        const userData = await response.json();
        setUser(userData);
      } catch (error) {
        console.error('Failed to fetch user data:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (data: LoginInput): Promise<User> => {
    setIsLoading(true);
    try {
      const response = await apiRequest('POST', '/api/auth/login', data);
      const userData = await response.json();
      console.log('User data after login:', userData);
      setUser(userData);
      return userData;
    } catch (error) {
      setUser(null);
      console.log('User data error:', error);

      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterInput): Promise<User> => {
    setIsLoading(true);
    try {
      const response = await apiRequest('POST', '/api/auth/register', data);
      const userData = await response.json();
      return userData;
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await apiRequest('POST', '/api/auth/logout');
      setUser(null);
    } catch (error) {
      console.error('Error during logout:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
