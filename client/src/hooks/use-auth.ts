import { useContext } from 'react';
import { AuthContext } from '@/lib/auth.tsx';

export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return {
    ...context,
    // Provide helper method to check if user is authenticated
    isAuthenticated: !!context.user,
    // Add helper to check user role
    hasRole: (role: string | string[]) => {
      if (!context.user) return false;
      const roles = Array.isArray(role) ? role : [role];
      return roles.includes(context.user.role);
    }
  };
}
