import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useHospital } from "@/hooks/use-hospital";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { WelcomeCard } from "@/components/dashboard/welcome-card";
import { StatsCard } from "@/components/dashboard/stats-card";
import { HealthTracking } from "@/components/patient/health-tracking";
import { MedicationList } from "@/components/patient/medication-list";
import { AppointmentList } from "@/components/patient/appointment-list";
import { ReminderList } from "@/components/patient/reminder-list";
import { ChatWidget } from "@/components/chat/chat-widget";
import { Calendar, PillIcon, Bell, FileText, Building2 } from "lucide-react";
import { Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function PatientDashboard() {
  const { user } = useAuth();
  const { selectedHospital } = useHospital();

  const { data: stats, isLoading: isStatsLoading } = useQuery({
    queryKey: ['/api/patient/stats', selectedHospital?.id],
    queryFn: async () => {
      const url = selectedHospital 
        ? `/api/patient/stats?hospitalId=${selectedHospital.id}`
        : '/api/patient/stats';
      return apiRequest(url);
    },
    enabled: !!user,
  });

  const { data: appointments, isLoading: isAppointmentsLoading } = useQuery({
    queryKey: ['/api/patient/appointments/upcoming', selectedHospital?.id],
    queryFn: async () => {
      const url = selectedHospital 
        ? `/api/patient/appointments/upcoming?hospitalId=${selectedHospital.id}`
        : '/api/patient/appointments/upcoming';
      return apiRequest(url);
    },
    enabled: !!user,
  });

  const { data: medications, isLoading: isMedicationsLoading } = useQuery({
    queryKey: ['/api/patient/medications', selectedHospital?.id],
    queryFn: async () => {
      const url = selectedHospital 
        ? `/api/patient/medications?hospitalId=${selectedHospital.id}`
        : '/api/patient/medications';
      return apiRequest(url);
    },
    enabled: !!user,
  });

  const { data: reminders, isLoading: isRemindersLoading } = useQuery({
    queryKey: ['/api/patient/reminders', selectedHospital?.id],
    queryFn: async () => {
      const url = selectedHospital 
        ? `/api/patient/reminders?hospitalId=${selectedHospital.id}`
        : '/api/patient/reminders';
      return apiRequest(url);
    },
    enabled: !!user,
  });

  const isLoading = isStatsLoading || isAppointmentsLoading || isMedicationsLoading || isRemindersLoading;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Welcome Section */}
      <WelcomeCard
        role="patient"
        name={user?.firstName || ''}
        stats={{
          nextAppointment: appointments && appointments.length > 0 ? appointments[0].date : null,
          doctor: appointments && appointments.length > 0 ? `Dr. ${appointments[0].doctor.lastName}` : null
        }}
        imgUrl="https://images.unsplash.com/photo-1505751172876-fa1923c5c528?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=400&q=80"
      />
      
      {/* Hospital Info */}
      {selectedHospital && (
        <div className="flex items-center gap-2 mb-4 p-2 bg-muted/20 rounded-md">
          <Building2 className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium">
            Currently viewing: {selectedHospital.name} ({selectedHospital.type}) - {selectedHospital.municipality}
          </span>
        </div>
      )}

      {/* Patient Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatsCard
          title="Upcoming Appointments"
          value={stats?.upcomingAppointments || 0}
          icon={<Calendar className="h-5 w-5" />}
          color="primary"
        />
        <StatsCard
          title="Active Medications"
          value={stats?.activeMedications || 0}
          icon={<PillIcon className="h-5 w-5" />}
          color="secondary"
        />
        <StatsCard
          title="Reminders Today"
          value={stats?.remindersToday || 0}
          icon={<Bell className="h-5 w-5" />}
          color="accent"
        />
        <StatsCard
          title="New Reports"
          value={stats?.newReports || 0}
          icon={<FileText className="h-5 w-5" />}
          color="primary-light"
        />
      </div>

      {/* Health Tracking & Medications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <HealthTracking />
        <MedicationList medications={medications || []} />
      </div>

      {/* Upcoming Appointments & Reminders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <AppointmentList appointments={appointments || []} />
        <ReminderList reminders={reminders || []} />
      </div>

      {/* Chat Widget */}
      <ChatWidget role="patient" />
    </DashboardLayout>
  );
}
