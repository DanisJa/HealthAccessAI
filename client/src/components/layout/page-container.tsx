import { Header } from "./header";
import { Sidebar } from "./sidebar";
import { useAuth } from "@/hooks/use-auth";

interface PageContainerProps {
  children: React.ReactNode;
}

export function PageContainer({ children }: PageContainerProps) {
  const { user } = useAuth();
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <div className="flex flex-1">
        {user && <Sidebar />}
        
        <main className={`flex-1 ${user ? 'p-4 md:p-6 bg-neutral-50' : ''}`}>
          {children}
        </main>
      </div>
      
      <div className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-neutral-light">
        {user && (
          <div className="grid grid-cols-5 h-16">
            <a href={user.role === 'doctor' ? '/doctor' : '/patient'} className="flex flex-col items-center justify-center text-primary">
              <span className="material-icons">dashboard</span>
              <span className="text-xs mt-1">Home</span>
            </a>
            <a href={user.role === 'doctor' ? '/doctor/patients' : '/patient/health'} className="flex flex-col items-center justify-center text-neutral-dark">
              <span className="material-icons">{user.role === 'doctor' ? 'people' : 'favorite'}</span>
              <span className="text-xs mt-1">{user.role === 'doctor' ? 'Patients' : 'Health'}</span>
            </a>
            <a href={user.role === 'doctor' ? '/doctor/appointments' : '/patient/appointments'} className="flex flex-col items-center justify-center text-neutral-dark">
              <span className="material-icons">event</span>
              <span className="text-xs mt-1">Appointments</span>
            </a>
            <a href={user.role === 'doctor' ? '/doctor/prescriptions' : '/patient/medications'} className="flex flex-col items-center justify-center text-neutral-dark">
              <span className="material-icons">medication</span>
              <span className="text-xs mt-1">{user.role === 'doctor' ? 'Prescriptions' : 'Medications'}</span>
            </a>
            <a href="/profile" className="flex flex-col items-center justify-center text-neutral-dark">
              <span className="material-icons">person</span>
              <span className="text-xs mt-1">Profile</span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
