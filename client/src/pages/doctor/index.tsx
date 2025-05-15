import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useHospital } from "@/hooks/use-hospital";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { WelcomeCard } from "@/components/dashboard/welcome-card";
import { StatsCard } from "@/components/dashboard/stats-card";
import { PatientList } from "@/components/doctor/patient-list";
import { AppointmentList } from "@/components/doctor/appointment-list";
import { HealthParameters } from "@/components/doctor/health-parameters";
import { ChatWidget } from "@/components/chat/chat-widget";
import { Activity, Users, ClipboardList, PillIcon, Building2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";

export default function DoctorDashboard() {
  const { user } = useAuth();
  const { selectedHospital } = useHospital();
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);

  const { data: stats, isLoading: isStatsLoading } = useQuery({
    queryKey: ['/api/doctor/stats', selectedHospital?.id],
    enabled: !!user,
  });

  const { data: patients, isLoading: isPatientsLoading } = useQuery({
    queryKey: ['/api/doctor/patients/recent', selectedHospital?.id],
    enabled: !!user,
  });

  const { data: appointments, isLoading: isAppointmentsLoading } = useQuery({
    queryKey: ['/api/doctor/appointments/today', selectedHospital?.id],
    queryFn: async () => {
      const url = selectedHospital 
        ? `/api/doctor/today-appointments?hospitalId=${selectedHospital.id}`
        : '/api/doctor/today-appointments';
      const response = await fetch(url);
      if (!response.ok) {
        // Fallback data if API fails
        return [];
      }
      return response.json();
    },
    enabled: !!user,
  });

  const isLoading = isStatsLoading || isPatientsLoading || isAppointmentsLoading;

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
        role="doctor"
        name={user?.firstName || ''}
        stats={{
          appointments: stats?.appointmentsToday || 0,
          reports: stats?.pendingReports || 0
        }}
        imgUrl="https://images.unsplash.com/photo-1579684385127-1ef15d508118?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=400&q=80"
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

      {/* Doctor Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatsCard
          title="Total Patients"
          value={stats?.totalPatients || 0}
          icon={<Users className="h-5 w-5" />}
          color="primary"
        />
        <StatsCard
          title="Appointments Today"
          value={stats?.appointmentsToday || 0}
          icon={<Activity className="h-5 w-5" />}
          color="secondary"
        />
        <StatsCard
          title="Pending Reports"
          value={stats?.pendingReports || 0}
          icon={<ClipboardList className="h-5 w-5" />}
          color="accent"
        />
        <StatsCard
          title="Prescriptions Issued"
          value={stats?.prescriptionsIssued || 0}
          icon={<PillIcon className="h-5 w-5" />}
          color="primary-light"
        />
      </div>

      {/* Recent Patients & Upcoming Appointments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <PatientList patients={patients || []} />
        <AppointmentList appointments={appointments || []} />
      </div>

      {/* Patient Health Parameters Dashboard */}
      <HealthParameters 
        patients={patients || []} 
        selectedPatientId={selectedPatientId} 
        onPatientSelect={setSelectedPatientId} 
      />

      {/* Chat Widget */}
      <ChatWidget role="doctor" />
    </DashboardLayout>
  );
}
