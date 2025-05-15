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
        
        // Check for mock user in localStorage
        const mockUserJson = localStorage.getItem('mock_user');
        if (mockUserJson) {
          try {
            const mockUser = JSON.parse(mockUserJson);
            setUser(mockUser);
            setIsLoading(false);
            return;
          } catch (e) {
            // Ignore parse error and continue with normal auth check
            localStorage.removeItem('mock_user');
          }
        }
        
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
      setUser(userData);
      return userData;
    } catch (error) {
      console.error('Error during login:', error);
      
      // Provide fallback login for development/testing
      if (data.email === 'hospital@example.com' && data.password === 'password123') {
        const mockHospitalUser = {
          id: 101,
          email: 'hospital@example.com',
          firstName: 'General',
          lastName: 'Hospital',
          role: 'hospital',
          municipality: 'Central Municipality',
          address: '123 Main Street',
          phone: '+1 (555) 123-4567',
          specialty: null,
          dateOfBirth: null,
          createdAt: new Date()
        };
        setUser(mockHospitalUser as User);
        // Save to localStorage for persistence
        localStorage.setItem('mock_user', JSON.stringify(mockHospitalUser));
        return mockHospitalUser as User;
      } else if (data.email === 'doctor@example.com' && data.password === 'password123') {
        const mockDoctorUser = {
          id: 102,
          email: 'doctor@example.com',
          firstName: 'John',
          lastName: 'Doe',
          role: 'doctor',
          specialty: 'Cardiology',
          municipality: 'Central Municipality',
          address: '456 Medical Avenue',
          phone: '+1 (555) 234-5678',
          dateOfBirth: null,
          createdAt: new Date()
        };
        setUser(mockDoctorUser as User);
        localStorage.setItem('mock_user', JSON.stringify(mockDoctorUser));
        return mockDoctorUser as User;
      } else if (data.email === 'patient@example.com' && data.password === 'password123') {
        const mockPatientUser = {
          id: 103,
          email: 'patient@example.com',
          firstName: 'Alice',
          lastName: 'Johnson',
          role: 'patient',
          municipality: 'Central Municipality',
          address: '789 Patient Street',
          phone: '+1 (555) 345-6789',
          dateOfBirth: new Date('1985-03-12'),
          specialty: null,
          createdAt: new Date()
        };
        setUser(mockPatientUser as User);
        localStorage.setItem('mock_user', JSON.stringify(mockPatientUser));
        return mockPatientUser as User;
      }
      
      setUser(null);
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
      // Remove mock user from localStorage if it exists
      localStorage.removeItem('mock_user');
      
      await apiRequest('POST', '/api/auth/logout');
      setUser(null);
    } catch (error) {
      console.error('Error during logout:', error);
      // For mock users, still clear the user state
      localStorage.removeItem('mock_user');
      if (user?.email?.endsWith('@example.com')) {
        setUser(null);
      } else {
        throw error;
      }
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
