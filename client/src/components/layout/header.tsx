import { useState } from "react";
import { useLocation, Link } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useRole } from "@/hooks/use-role";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu, X, LogOut, User, Settings } from "lucide-react";
import { getInitials } from "@/lib/utils";

export function MobileNav() {
  const [location] = useLocation();
  const { user } = useAuth();
  const { isDoctor, isPatient } = useRole();
  const [isOpen, setIsOpen] = useState(false);

  const closeNav = () => setIsOpen(false);

  const doctorLinks = [
    { href: "/doctor", label: "Dashboard", icon: "dashboard" },
    { href: "/doctor/patients", label: "Patients", icon: "people" },
    { href: "/doctor/medical-records", label: "Medical Records", icon: "description" },
    { href: "/doctor/appointments", label: "Appointments", icon: "event" },
    { href: "/doctor/prescriptions", label: "Prescriptions", icon: "medication" },
  ];
  
  const patientLinks = [
    { href: "/patient", label: "Dashboard", icon: "dashboard" },
    { href: "/patient/health", label: "My Health", icon: "favorite" },
    { href: "/patient/medical-records", label: "Medical Records", icon: "description" },
    { href: "/patient/appointments", label: "Appointments", icon: "event" },
    { href: "/patient/medications", label: "Medications", icon: "medication" },
    { href: "/patient/reminders", label: "Reminders", icon: "notifications" },
  ];
  
  const links = isDoctor ? doctorLinks : isPatient ? patientLinks : [];

  if (!user) return null;

  return (
    <>
      <button 
        className="md:hidden p-2 text-neutral-medium" 
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle menu"
      >
        <Menu size={24} />
      </button>

      {/* Mobile Menu Overlay */}
      <div className={cn(
        "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm md:hidden",
        isOpen ? "block" : "hidden"
      )} onClick={closeNav} />

      {/* Mobile Menu */}
      <div className={cn(
        "fixed top-0 right-0 z-50 h-full w-3/4 max-w-sm bg-white p-4 shadow-lg md:hidden transform transition-transform duration-200 ease-in-out",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}>
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center">
            <span className="material-icons text-primary text-2xl mr-2">favorite</span>
            <h1 className="text-xl font-bold text-primary font-heading">HealthIoT</h1>
          </div>
          <button className="p-2 text-neutral-medium" onClick={closeNav}>
            <X size={24} />
          </button>
        </div>

        <div className="flex flex-col space-y-6">
          <div className="flex items-center space-x-3 p-2 border-b pb-4">
            <Avatar>
              <AvatarImage src={user.avatarUrl} />
              <AvatarFallback>
                {user ? getInitials(user.firstName, user.lastName) : "GU"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">
                {isDoctor ? "Dr. " : ""}{user.firstName} {user.lastName}
              </p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>

          <nav className="space-y-1">
            {links.map((link) => (
              <Link key={link.href} href={link.href}>
                <a className={cn(
                  "flex items-center p-2 text-base font-normal rounded-lg",
                  location === link.href 
                    ? "text-primary bg-primary-light bg-opacity-10" 
                    : "text-neutral-dark hover:bg-neutral-lightest"
                )} onClick={closeNav}>
                  <span className="material-icons mr-3">{link.icon}</span>
                  <span>{link.label}</span>
                </a>
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </>
  );
}

export function Header() {
  const [_, navigate] = useLocation();
  const { user, logout } = useAuth();
  
  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center md:hidden">
            <MobileNav />
          </div>
          
          <div className="flex md:flex-1 items-center md:justify-end">
            <div className="flex-shrink-0 flex items-center md:hidden">
              <span className="material-icons text-primary text-2xl mr-2">favorite</span>
              <h1 className="text-xl font-bold text-primary font-heading">HealthIoT</h1>
            </div>
          </div>
          
          <div className="flex items-center">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar>
                      <AvatarImage src={user.avatarUrl} alt={`${user.firstName} ${user.lastName}`} />
                      <AvatarFallback>
                        {getInitials(user.firstName, user.lastName)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>
                    {user.role === 'doctor' ? 'Dr. ' : ''}{user.firstName} {user.lastName}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/settings')}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button onClick={() => navigate("/login")}>
                Login
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
