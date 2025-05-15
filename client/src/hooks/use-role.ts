import { useAuth } from './use-auth';

export function useRole() {
  const { user } = useAuth();
  
  const isDoctor = user?.role === 'doctor';
  const isPatient = user?.role === 'patient';
  
  const checkRole = (requiredRole: string | string[]): boolean => {
    if (!user) return false;
    
    if (Array.isArray(requiredRole)) {
      return requiredRole.includes(user.role);
    }
    
    return user.role === requiredRole;
  };
  
  return {
    role: user?.role,
    isDoctor,
    isPatient,
    checkRole,
  };
}
