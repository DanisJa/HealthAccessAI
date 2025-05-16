import { useState } from "react";
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
import {
  Activity,
  Users,
  ClipboardList,
  PillIcon,
  Building2,
} from "lucide-react";
import { Loader2 } from "lucide-react";

interface Stats {
  totalpatients: number;
  appointmentstoday: number;
  pendingreports: number;
  prescriptionsissued: number;
}

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
  gender: string;
  status: string;
  lastVisit: string;
  avatarUrl?: string;
}

interface Appointment {
  id: string;
  hospital_id: number;
  date: string;
  // …other fields your AppointmentList expects
}

export default function DoctorDashboard() {
  const { user } = useAuth();
  // selectedHospitalId is just a number.  Grab the full object from the list.
  const { hospitals, selectedHospital: selectedHospitalId } = useHospital();
  // find the object; might be undefined until the hook populates it
  const selectedHospital =
    hospitals.find((h) => h.id === selectedHospitalId) ?? null;

  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(
    null
  );

  // 1) Stats
  const { data: stats = [], isLoading: isStatsLoading } = useQuery<Stats[]>({
    queryKey: ["doctorStats", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const res = await fetch(`/api/doctor/stats?doctorId=${user.id}`);
      if (!res.ok) throw new Error("Failed to load stats");
      return res.json();
    },
    enabled: !!user,
  });

  // 2) Recent patients
  // Now pass the raw ID into the fetch, and lookup .id only on the object
  const { data: patients = [], isLoading: isPatientsLoading } = useQuery<
    Patient[]
  >({
    queryKey: ["recentPatients", user?.id, selectedHospitalId],
    enabled: !!user && selectedHospitalId !== null,
    queryFn: async () => {
      const url = selectedHospitalId
        ? `/api/doctor/patients/recent?hospitalId=${selectedHospitalId}`
        : "/api/doctor/patients/recent";

      console.log(url);
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load patients");
      return res.json();
    },
  });

  // 3) Today’s appointments
  const { data: appointments = [], isLoading: isAppointmentsLoading } =
    useQuery<Appointment[]>({
      queryKey: ["todayAppointments", user?.id, selectedHospital?.id],
      queryFn: async () => {
        if (!user) return [];
        const url = selectedHospital
          ? `/api/doctor/appointments/today?hospitalId=${selectedHospital.id}`
          : "/api/doctor/appointments/today";
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to load appointments");
        return res.json();
      },
      enabled: !!user,
    });

  // 4) Health parameters for selected patient
  const { data: parameters = [], isLoading: isParamsLoading } = useQuery<any[]>(
    {
      queryKey: ["patientParameters", selectedPatientId],
      queryFn: async () => {
        if (!selectedPatientId) return [];
        const res = await fetch(
          `/api/doctor/patients/parameters?patientId=${selectedPatientId}`
        );
        if (!res.ok) throw new Error("Failed to load parameters");
        return res.json();
      },
      enabled: !!selectedPatientId,
    }
  );

  const isLoading =
    isStatsLoading || isPatientsLoading || isAppointmentsLoading;

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
      {/* Welcome */}
      <WelcomeCard
        role="doctor"
        name={user?.firstName || ""}
        stats={{
          appointments: stats[0]?.appointmentstoday || 0,
          reports: stats[0]?.pendingreports || 0,
        }}
        imgUrl="https://images.unsplash.com/photo-1579684385127-1ef15d508118?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=400&q=80"
      />

      {/* Hospital Info */}
      {selectedHospital && (
        <div className="flex items-center gap-2 mb-4 p-2 bg-muted/20 rounded-md">
          <Building2 className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium">
            Currently viewing: {selectedHospital.name}
          </span>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatsCard
          title="Total Patients"
          value={stats[0]?.totalpatients || 0}
          icon={<Users className="h-5 w-5" />}
          color="primary"
        />
        <StatsCard
          title="Appointments Today"
          value={stats[0]?.appointmentstoday || 0}
          icon={<Activity className="h-5 w-5" />}
          color="secondary"
        />
        <StatsCard
          title="Pending Reports"
          value={stats[0]?.pendingreports || 0}
          icon={<ClipboardList className="h-5 w-5" />}
          color="accent"
        />
        <StatsCard
          title="Prescriptions Issued"
          value={stats[0]?.prescriptionsissued || 0}
          icon={<PillIcon className="h-5 w-5" />}
          color="primary-light"
        />
      </div>

      {/* Recent Patients & Appointments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <PatientList patients={patients} isLoading={isPatientsLoading} />
        <AppointmentList appointments={appointments} />
      </div>

      {/* Health Parameters */}
      <HealthParameters
        patients={patients}
        selectedPatientId={selectedPatientId}
        onPatientSelect={setSelectedPatientId}
        parameters={parameters}
        isLoading={isParamsLoading}
      />

      {/* Chat */}
      <ChatWidget role="doctor" />
    </DashboardLayout>
  );
}
