import React from "react";
import { Link, useLocation } from "wouter";
import { HospitalSelector } from "@/components/common/hospital-selector";
import { useAuth } from "@/hooks/use-auth";
import {
  BarChart3,
  CalendarDays,
  ClipboardList,
  Pill,
  Settings,
  Activity,
  ChevronRight,
  UserRound,
  Building2,
  Stethoscope,
  Users,
  LogOut,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  if (!user) {
    return null;
  }

  // Define navigation items based on user role
  const getNavItems = () => {
    if (user.role === "patient") {
      return [
        {
          href: "/patient",
          label: "Dashboard",
          icon: <BarChart3 className="h-5 w-5" />,
        },
        {
          href: "/patient/health",
          label: "Health Tracking",
          icon: <Activity className="h-5 w-5" />,
        },
        {
          href: "/patient/appointments",
          label: "Appointments",
          icon: <CalendarDays className="h-5 w-5" />,
        },
        {
          href: "/patient/medical-records",
          label: "Medical Records",
          icon: <ClipboardList className="h-5 w-5" />,
        },
        {
          href: "/patient/medications",
          label: "Medications",
          icon: <Pill className="h-5 w-5" />,
        },
        {
          href: "/patient/reminders",
          label: "Reminders",
          icon: <CalendarDays className="h-5 w-5" />,
        },
        {
          href: "/messages",
          label: "Messages",
          icon: <MessageSquare className="h-5 w-5" />,
        },
        {
          href: "/patient/settings",
          label: "Settings",
          icon: <Settings className="h-5 w-5" />,
        },
        {
          href: "/patient/triage",
          label: "Online Triage",
          icon: <Stethoscope className="h-5 w-5" />,
        },
      ];
    } else if (user.role === "doctor") {
      return [
        {
          href: "/doctor",
          label: "Dashboard",
          icon: <BarChart3 className="h-5 w-5" />,
        },
        {
          href: "/doctor/patients",
          label: "Patients",
          icon: <UserRound className="h-5 w-5" />,
        },
        {
          href: "/doctor/appointments",
          label: "Appointments",
          icon: <CalendarDays className="h-5 w-5" />,
        },
        {
          href: "/doctor/medical-records",
          label: "Medical Records",
          icon: <ClipboardList className="h-5 w-5" />,
        },
        {
          href: "/doctor/prescriptions",
          label: "Prescriptions",
          icon: <Pill className="h-5 w-5" />,
        },
        {
          href: "/doctor/analytics",
          label: "Analytics",
          icon: <Activity className="h-5 w-5" />,
        },
        {
          href: "/messages",
          label: "Messages",
          icon: <MessageSquare className="h-5 w-5" />,
        },
        {
          href: "/doctor/settings",
          label: "Settings",
          icon: <Settings className="h-5 w-5" />,
        },
      ];
    } else if (user.role === "hospital") {
      return [
        {
          href: "/hospital",
          label: "Dashboard",
          icon: <BarChart3 className="h-5 w-5" />,
        },
        {
          href: "/hospital/doctors",
          label: "Doctors",
          icon: <Stethoscope className="h-5 w-5" />,
        },
        {
          href: "/hospital/patients",
          label: "Patients",
          icon: <Users className="h-5 w-5" />,
        },

        {
          href: "/messages",
          label: "Messages",
          icon: <MessageSquare className="h-5 w-5" />,
        },
        {
          href: "/hospital/settings",
          label: "Settings",
          icon: <Settings className="h-5 w-5" />,
        },
      ];
    }
    return [];
  };

  const navItems = getNavItems();

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="hidden md:flex flex-col w-64 border-r bg-white">
        <div className="border-b">
          {/* <h1 className="text-xl font-semibold">Healthcare Portal</h1> */}
          <div className="flex items-center gap-2 px-2">
            <img src="/logo.png" className="w-24 h-24" />
            <p className="text-sm text-muted-foreground capitalize">
              {user.role} Portal
            </p>
          </div>
        </div>

        <div className="flex-1 py-6 px-4">
          <nav className="space-y-1">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  className={`w-full justify-between px-3 py-2 h-auto rounded-md text-sm font-medium ${location === item.href
                      ? // location.startsWith(item.href + "/")
                      "bg-primary/10 text-primary hover:bg-primary/20"
                      : "text-gray-700 hover:bg-gray-100"
                    }`}
                >
                  <div className="flex items-center">
                    {item.icon}
                    <span className="ml-3">{item.label}</span>
                  </div>
                  {location === item.href && (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              </Link>
            ))}
          </nav>
        </div>

        <div className="p-4 border-t fixed bottom-0 w-64">
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={logout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b">
          <div className="flex items-center justify-between h-16 px-6">
            {/* Shown only on mobile */}
            <div className="md:hidden">
              <h1 className="text-lg font-semibold">Healthcare Portal</h1>
            </div>

            <div className="flex items-center gap-4 ml-auto">
              {/* Only show hospital selector for doctors */}
              {user.role === "doctor" && <HospitalSelector />}

              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {user.firstName} {user.lastName}
                  <span className="ml-2 text-xs text-muted-foreground capitalize">
                    ({user.role})
                  </span>
                </span>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">{children}</main>

        <footer className="bg-white border-t py-4">
          <div className="px-6">
            <p className="text-sm text-center text-muted-foreground">
              &copy; {new Date().getFullYear()} Healthcare Portal. All rights
              reserved.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
