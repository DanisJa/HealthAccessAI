import { useMemo } from "react";
import { useLocation, Link } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useRole } from "@/hooks/use-role";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Calendar, 
  Pill, 
  BarChart3, 
  MessageSquare, 
  Settings, 
  Heart, 
  Bell
} from "lucide-react";

interface SidebarItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
}

function SidebarItem({ href, icon, label, active }: SidebarItemProps) {
  return (
    <li>
      <Link href={href}>
        <a className={cn(
          "flex items-center p-2 text-base font-normal rounded-lg",
          active 
            ? "text-primary bg-primary-light bg-opacity-10" 
            : "text-neutral-dark hover:bg-neutral-lightest"
        )}>
          {icon}
          <span className="ml-3">{label}</span>
        </a>
      </Link>
    </li>
  );
}

export function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { isDoctor, isPatient } = useRole();
  
  const doctorLinks = useMemo(() => [
    { href: "/doctor", icon: <LayoutDashboard className="h-5 w-5" />, label: "Dashboard" },
    { href: "/doctor/patients", icon: <Users className="h-5 w-5" />, label: "Patients" },
    { href: "/doctor/medical-records", icon: <FileText className="h-5 w-5" />, label: "Medical Records" },
    { href: "/doctor/appointments", icon: <Calendar className="h-5 w-5" />, label: "Appointments" },
    { href: "/doctor/prescriptions", icon: <Pill className="h-5 w-5" />, label: "Prescriptions" },
    { href: "/doctor/analytics", icon: <BarChart3 className="h-5 w-5" />, label: "Analytics" },
    { href: "/doctor/messages", icon: <MessageSquare className="h-5 w-5" />, label: "Messages" },
    { href: "/doctor/settings", icon: <Settings className="h-5 w-5" />, label: "Settings" }
  ], []);
  
  const patientLinks = useMemo(() => [
    { href: "/patient", icon: <LayoutDashboard className="h-5 w-5" />, label: "Dashboard" },
    { href: "/patient/health", icon: <Heart className="h-5 w-5" />, label: "My Health" },
    { href: "/patient/medical-records", icon: <FileText className="h-5 w-5" />, label: "Medical Records" },
    { href: "/patient/appointments", icon: <Calendar className="h-5 w-5" />, label: "Appointments" },
    { href: "/patient/medications", icon: <Pill className="h-5 w-5" />, label: "Medications" },
    { href: "/patient/reminders", icon: <Bell className="h-5 w-5" />, label: "Reminders" },
    { href: "/patient/messages", icon: <MessageSquare className="h-5 w-5" />, label: "Messages" },
    { href: "/patient/settings", icon: <Settings className="h-5 w-5" />, label: "Settings" }
  ], []);
  
  const links = useMemo(() => {
    if (isDoctor) return doctorLinks;
    if (isPatient) return patientLinks;
    return [];
  }, [isDoctor, isPatient, doctorLinks, patientLinks]);
  
  if (!user) return null;
  
  return (
    <aside className="bg-white shadow-md hidden md:block md:w-64 h-screen">
      <div className="h-full px-3 py-4 overflow-y-auto">
        <div className="flex items-center mb-5 ml-2">
          <span className="material-icons text-primary text-2xl mr-2">favorite</span>
          <h1 className="text-xl font-bold text-primary font-heading">HealthIoT</h1>
        </div>
        
        <ul className="space-y-2">
          {links.map((link) => (
            <SidebarItem 
              key={link.href}
              href={link.href}
              icon={link.icon}
              label={link.label}
              active={location === link.href}
            />
          ))}
        </ul>
        
        <div className="pt-4 mt-8 border-t border-neutral-light">
          <Button 
            variant="ghost" 
            className="w-full justify-start text-neutral-dark"
            onClick={() => logout()}
          >
            <span className="material-icons mr-3">logout</span>
            Sign Out
          </Button>
        </div>
      </div>
    </aside>
  );
}
