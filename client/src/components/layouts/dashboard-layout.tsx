import React from 'react';
import { HospitalSelector } from '@/components/common/hospital-selector';
import { useAuth } from '@/hooks/use-auth';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user } = useAuth();
  
  if (!user) {
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b">
        <div className="container flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold">Healthcare Portal</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <HospitalSelector />
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {user.firstName} {user.lastName} 
                <span className="ml-2 text-xs text-muted-foreground capitalize">({user.role})</span>
              </span>
            </div>
          </div>
        </div>
      </header>
      
      <main className="flex-1 container py-6 px-4">
        {children}
      </main>
      
      <footer className="border-t py-4">
        <div className="container px-4">
          <p className="text-sm text-center text-muted-foreground">
            &copy; {new Date().getFullYear()} Healthcare Portal. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}