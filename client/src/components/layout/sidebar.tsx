import React from 'react';
import { Link, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  User,
  Calendar,
  FileText,
  PieChart,
  Heart,
  MessageSquare,
  Pill,
  Bell,
  Users,
  Building2,
  HelpCircle,
  Settings
} from 'lucide-react';

interface SidebarLinkProps {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  active?: boolean;
}

const SidebarLink = ({ href, icon, children, active }: SidebarLinkProps) => {
  return (
    <Link href={href}>
      <div
        className={cn(
          'flex items-center gap-3 px-3 py-2 rounded-md transition-colors cursor-pointer',
          active 
            ? 'bg-primary/10 text-primary font-medium' 
            : 'text-muted-foreground hover:bg-gray-100 hover:text-foreground'
        )}
      >
        {icon}
        <span>{children}</span>
      </div>
    </Link>
  );
};

export function Sidebar() {
  const [location] = useLocation();
  const { data: user } = useQuery({
    queryKey: ['/api/auth/me'],
  });

  const role = user?.role || 'patient';

  const isActive = (path: string) => {
    return location.startsWith(path);
  };

  return (
    <div className="w-64 border-r bg-white shrink-0 hidden md:block">
      <div className="p-4 border-b">
        <h1 className="text-xl font-bold text-primary">Healthcare Portal</h1>
      </div>
      
      <div className="py-4 px-3">
        <p className="text-xs uppercase text-muted-foreground font-medium mb-2 px-3">
          Main Menu
        </p>
        <nav className="space-y-1">
          <SidebarLink
            href={`/dashboard`}
            icon={<LayoutDashboard className="h-5 w-5" />}
            active={isActive('/dashboard')}
          >
            Dashboard
          </SidebarLink>

          {role === 'patient' && (
            <>
              <SidebarLink
                href="/patient/parameters"
                icon={<Heart className="h-5 w-5" />}
                active={isActive('/patient/parameters')}
              >
                My Health
              </SidebarLink>
              
              <SidebarLink
                href="/patient/appointments"
                icon={<Calendar className="h-5 w-5" />}
                active={isActive('/patient/appointments')}
              >
                Appointments
              </SidebarLink>
              
              <SidebarLink
                href="/patient/medical-records"
                icon={<FileText className="h-5 w-5" />}
                active={isActive('/patient/medical-records')}
              >
                Medical Records
              </SidebarLink>
              
              <SidebarLink
                href="/patient/medications"
                icon={<Pill className="h-5 w-5" />}
                active={isActive('/patient/medications')}
              >
                Medications
              </SidebarLink>
              
              <SidebarLink
                href="/patient/reminders"
                icon={<Bell className="h-5 w-5" />}
                active={isActive('/patient/reminders')}
              >
                Reminders
              </SidebarLink>
            </>
          )}

          {role === 'doctor' && (
            <>
              <SidebarLink
                href="/doctor/patients"
                icon={<Users className="h-5 w-5" />}
                active={isActive('/doctor/patients')}
              >
                Patients
              </SidebarLink>
              
              <SidebarLink
                href="/doctor/appointments"
                icon={<Calendar className="h-5 w-5" />}
                active={isActive('/doctor/appointments')}
              >
                Appointments
              </SidebarLink>
              
              <SidebarLink
                href="/doctor/medical-records"
                icon={<FileText className="h-5 w-5" />}
                active={isActive('/doctor/medical-records')}
              >
                Medical Records
              </SidebarLink>
              
              <SidebarLink
                href="/doctor/prescriptions"
                icon={<Pill className="h-5 w-5" />}
                active={isActive('/doctor/prescriptions')}
              >
                Prescriptions
              </SidebarLink>
              
              <SidebarLink
                href="/doctor/analytics"
                icon={<PieChart className="h-5 w-5" />}
                active={isActive('/doctor/analytics')}
              >
                Analytics
              </SidebarLink>
            </>
          )}

          {role === 'hospital' && (
            <>
              <SidebarLink
                href="/hospital/doctors"
                icon={<User className="h-5 w-5" />}
                active={isActive('/hospital/doctors')}
              >
                Doctors
              </SidebarLink>
              
              <SidebarLink
                href="/hospital/patients"
                icon={<Users className="h-5 w-5" />}
                active={isActive('/hospital/patients')}
              >
                Patients
              </SidebarLink>
              
              <SidebarLink
                href="/hospital/departments"
                icon={<Building2 className="h-5 w-5" />}
                active={isActive('/hospital/departments')}
              >
                Departments
              </SidebarLink>
              
              <SidebarLink
                href="/hospital/analytics"
                icon={<PieChart className="h-5 w-5" />}
                active={isActive('/hospital/analytics')}
              >
                Analytics
              </SidebarLink>
            </>
          )}

          {/* Common links for all roles */}
          <SidebarLink
            href="/messages"
            icon={<MessageSquare className="h-5 w-5" />}
            active={isActive('/messages')}
          >
            Messages
          </SidebarLink>
          
          <SidebarLink
            href="/settings"
            icon={<Settings className="h-5 w-5" />}
            active={isActive('/settings')}
          >
            Settings
          </SidebarLink>
          
          <SidebarLink
            href="/help"
            icon={<HelpCircle className="h-5 w-5" />}
            active={isActive('/help')}
          >
            Help & Support
          </SidebarLink>
        </nav>
      </div>
    </div>
  );
}