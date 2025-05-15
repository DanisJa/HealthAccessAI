import React from 'react';
import { Sidebar } from './sidebar';
import { Header } from './header';

interface PageContainerProps {
  children: React.ReactNode;
}

export function PageContainer({ children }: PageContainerProps) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main content */}
      <div className="flex-1 flex flex-col">
        <Header />
        
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
        
        <footer className="bg-white border-t py-4">
          <div className="px-6">
            <p className="text-sm text-center text-muted-foreground">
              &copy; {new Date().getFullYear()} Healthcare Portal. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}