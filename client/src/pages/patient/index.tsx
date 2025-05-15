import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { PageContainer } from "@/components/layout/page-container";
import { WelcomeCard } from "@/components/dashboard/welcome-card";
import { StatsCard } from "@/components/dashboard/stats-card";
import { HealthTracking } from "@/components/patient/health-tracking";
import { MedicationList } from "@/components/patient/medication-list";
import { AppointmentList } from "@/components/patient/appointment-list";
import { ReminderList } from "@/components/patient/reminder-list";
import { ChatWidget } from "@/components/chat/chat-widget";
import { Calendar, PillIcon, Bell, FileText } from "lucide-react";
import { Loader2 } from "lucide-react";

export default function PatientDashboard() {
  const { user } = useAuth();

  const { data: stats, isLoading: isStatsLoading } = useQuery({
    queryKey: ['/api/patient/stats'],
    enabled: !!user,
  });

  const { data: appointments, isLoading: isAppointmentsLoading } = useQuery({
    queryKey: ['/api/patient/appointments/upcoming'],
    enabled: !!user,
  });

  const { data: medications, isLoading: isMedicationsLoading } = useQuery({
    queryKey: ['/api/patient/medications'],
    enabled: !!user,
  });

  const { data: reminders, isLoading: isRemindersLoading } = useQuery({
    queryKey: ['/api/patient/reminders'],
    enabled: !!user,
  });

  const isLoading = isStatsLoading || isAppointmentsLoading || isMedicationsLoading || isRemindersLoading;

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex justify-center items-center h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
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
    </PageContainer>
  );
}
