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
import { supabase } from "@/../utils/supabaseClient";
import { Link } from "react-router-dom";
export default function PatientDashboard() {
  const { user } = useAuth();
  const { selectedHospital } = useHospital();
  const patientId = user?.id!;

  // 1) Stats
  const { data: stats, isLoading: isStatsLoading } = useQuery({
    queryKey: ["patientStats", patientId, selectedHospital?.id],
    enabled: !!patientId,
    queryFn: async () => {
      const { count: upcomingAppointments = 0 } = await supabase
        .from("appointments")
        .select("*", { head: true, count: "exact" })
        .eq("patient_id", patientId)
        .gte("date", new Date().toISOString());

      const { count: activeMedications = 0 } = await supabase
        .from("prescriptions")
        .select("*", { head: true, count: "exact" })
        .eq("patient_id", patientId)
        .eq("status", "active");

      const today = new Date().toISOString().split("T")[0];
      const { count: remindersToday = 0 } = await supabase
        .from("reminders")
        .select("*", { head: true, count: "exact" })
        .eq("user_id", patientId)
        .gte("due_date", today)
        .lt(
          "due_date",
          new Date(Date.now() + 86400000).toISOString().split("T")[0]
        );

      const { count: newReports = 0 } = await supabase
        .from("medical_reports")
        .select("*", { head: true, count: "exact" })
        .eq("patient_id", patientId)
        .eq("is_pending", false);

      return {
        upcomingAppointments,
        activeMedications,
        remindersToday,
        newReports,
      };
    },
  });

  // 2) Upcoming Appointments
  const { data: appointments = [], isLoading: isAppointmentsLoading } =
    useQuery({
      queryKey: ["patientAppointments", patientId, selectedHospital?.id],
      enabled: !!patientId,
      queryFn: async () => {
        const { data, error } = await supabase
          .from("appointments")
          .select(`id, date, title, doctor:doctor_id ( last_name )`)
          .eq("patient_id", patientId)
          .gte("date", new Date().toISOString())
          .order("date", { ascending: true });
        if (error) throw error;
        return data!;
      },
    });

  // 3) Active Medications
  const { data: medications = [], isLoading: isMedicationsLoading } = useQuery({
    queryKey: ["patientMedications", patientId, selectedHospital?.id],
    enabled: !!patientId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prescriptions")
        .select("*")
        .eq("patient_id", patientId)
        .eq("status", "active")
        .order("start_date", { ascending: false });
      if (error) throw error;
      return data!;
    },
  });

  // 4) Reminders
  const { data: reminders = [], isLoading: isRemindersLoading } = useQuery({
    queryKey: ["patientReminders", patientId, selectedHospital?.id],
    enabled: !!patientId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reminders")
        .select("*")
        .eq("user_id", patientId)
        .order("due_date", { ascending: true });
      if (error) throw error;
      return data!;
    },
  });

  const isLoading =
    isStatsLoading ||
    isAppointmentsLoading ||
    isMedicationsLoading ||
    isRemindersLoading;

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
        role="patient"
        name={user?.first_name || ""}
        stats={{
          nextAppointment:
            appointments.length > 0 ? appointments[0].date : null,
          doctor:
            appointments.length > 0
              ? `Dr. ${appointments[0].doctor.last_name}`
              : null,
        }}
        imgUrl="https://images.unsplash.com/photo-1505751172876-fa1923c5c528?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=400&q=80"
      />

      {/* Hospital Info */}
      {selectedHospital && (
        <div className="flex items-center gap-2 mb-4 p-2 bg-muted/20 rounded-md">
          <Building2 className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium">
            Currently viewing: {selectedHospital.name} ({selectedHospital.type})
            — {selectedHospital.municipality}
          </span>
        </div>
      )}

      {/* Stats */}
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

      {/* Tracking & Meds */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <HealthTracking />
        <MedicationList medications={medications} />
      </div>

      {/* Appts & Reminders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <AppointmentList appointments={appointments} />
        <ReminderList reminders={reminders} />
      </div>

      {/* Chat */}
      <ChatWidget role="patient" />
    </DashboardLayout>
  );
}
