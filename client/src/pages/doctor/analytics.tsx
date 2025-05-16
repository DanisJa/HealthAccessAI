import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useHospital } from "@/hooks/use-hospital";
import { supabase } from "@/../utils/supabaseClient";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  RefreshCw,
  Users,
  CalendarDays,
  ClipboardList,
  Pill,
  Clock,
} from "lucide-react";
import { format, subDays, subMonths, isWithinInterval } from "date-fns";
import {
  BarChart,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Bar,
  Tooltip,
  Line,
  CartesianGrid,
  Legend,
} from "recharts";
import { Badge } from "@/components/ui/badge";

// --- Sample graph data generators (unchanged) ---
const generateAppointmentData = (range: "week" | "month" | "year") => {
  const today = new Date();
  let data: any[] = [];

  if (range === "week") {
    for (let i = 6; i >= 0; i--) {
      const date = subDays(today, i);
      data.push({
        date: format(date, "MMM dd"),
        completed: Math.floor(Math.random() * 8),
        scheduled: Math.floor(Math.random() * 5) + 1,
        cancelled: Math.floor(Math.random() * 3),
      });
    }
  } else if (range === "month") {
    for (let i = 3; i >= 0; i--) {
      data.push({
        date: `Week ${4 - i}`,
        completed: Math.floor(Math.random() * 25) + 5,
        scheduled: Math.floor(Math.random() * 15) + 5,
        cancelled: Math.floor(Math.random() * 10),
      });
    }
  } else {
    for (let i = 11; i >= 0; i--) {
      const date = subMonths(today, i);
      data.push({
        date: format(date, "MMM"),
        completed: Math.floor(Math.random() * 80) + 20,
        scheduled: Math.floor(Math.random() * 40) + 10,
        cancelled: Math.floor(Math.random() * 25),
      });
    }
  }

  return data;
};

const generatePatientMetricsData = (range: "week" | "month" | "year") => {
  const today = new Date();
  let data: any[] = [];

  if (range === "week") {
    for (let i = 6; i >= 0; i--) {
      const date = subDays(today, i);
      data.push({
        date: format(date, "MMM dd"),
        newPatients: Math.floor(Math.random() * 3),
        followUps: Math.floor(Math.random() * 5) + 1,
      });
    }
  } else if (range === "month") {
    for (let i = 3; i >= 0; i--) {
      data.push({
        date: `Week ${4 - i}`,
        newPatients: Math.floor(Math.random() * 8) + 2,
        followUps: Math.floor(Math.random() * 15) + 5,
      });
    }
  } else {
    for (let i = 11; i >= 0; i--) {
      const date = subMonths(today, i);
      data.push({
        date: format(date, "MMM"),
        newPatients: Math.floor(Math.random() * 20) + 5,
        followUps: Math.floor(Math.random() * 40) + 15,
      });
    }
  }

  return data;
};

const generateTimeSpentData = (range: "week" | "month" | "year") => {
  const today = new Date();
  let data: any[] = [];

  if (range === "week") {
    for (let i = 6; i >= 0; i--) {
      const date = subDays(today, i);
      data.push({
        date: format(date, "MMM dd"),
        avgTimePerPatient: Math.floor(Math.random() * 15) + 10,
      });
    }
  } else if (range === "month") {
    for (let i = 3; i >= 0; i--) {
      data.push({
        date: `Week ${4 - i}`,
        avgTimePerPatient: Math.floor(Math.random() * 15) + 10,
      });
    }
  } else {
    for (let i = 11; i >= 0; i--) {
      const date = subMonths(today, i);
      data.push({
        date: format(date, "MMM"),
        avgTimePerPatient: Math.floor(Math.random() * 15) + 10,
      });
    }
  }

  return data;
};

// Sample top diagnoses and recent activity (unchanged)
const topDiagnoses = [
  { condition: "Hypertension", count: 24, change: "+12%" },
  { condition: "Diabetes Type 2", count: 18, change: "+5%" },
  { condition: "Respiratory Infection", count: 15, change: "-3%" },
  { condition: "Anxiety Disorder", count: 12, change: "+8%" },
  { condition: "Lower Back Pain", count: 10, change: "+2%" },
];
const recentActivity = [
  {
    id: 1,
    type: "appointment",
    description: "Completed appointment with Sarah Johnson",
    date: subDays(new Date(), 1),
  },
  {
    id: 2,
    type: "record",
    description: "Created medical record for Michael Chen",
    date: subDays(new Date(), 2),
  },
  {
    id: 3,
    type: "prescription",
    description: "Issued prescription for Emma Wilson",
    date: subDays(new Date(), 2),
  },
  {
    id: 4,
    type: "appointment",
    description: "Scheduled follow-up with David Lee",
    date: subDays(new Date(), 3),
  },
  {
    id: 5,
    type: "record",
    description: "Updated medical history for James Smith",
    date: subDays(new Date(), 4),
  },
];
const getActivityIcon = (type: string) => {
  switch (type) {
    case "appointment":
      return <CalendarDays className="h-4 w-4 text-blue-500" />;
    case "record":
      return <ClipboardList className="h-4 w-4 text-green-500" />;
    case "prescription":
      return <Pill className="h-4 w-4 text-purple-500" />;
    default:
      return <Loader2 className="h-4 w-4" />;
  }
};

export default function DoctorAnalytics() {
  const { user } = useAuth();
  const { selectedHospital } = useHospital();
  const [timeRange, setTimeRange] = useState<"week" | "month" | "year">("week");

  // Chart data
  const [appointmentData, setAppointmentData] = useState<any[]>([]);
  const [patientMetricsData, setPatientMetricsData] = useState<any[]>([]);
  const [timeSpentData, setTimeSpentData] = useState<any[]>([]);

  useEffect(() => {
    setAppointmentData(generateAppointmentData(timeRange));
    setPatientMetricsData(generatePatientMetricsData(timeRange));
    setTimeSpentData(generateTimeSpentData(timeRange));
  }, [timeRange]);

  // 1) RPC for top‐of‐dashboard metrics
  const { data: dashboard, isLoading: isDashboardLoading } = useQuery({
    queryKey: ["get_doctor_dashboard", user!.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_doctor_dashboard", {
        p_doctor_id: user!.id,
      });
      if (error) throw error;
      return (data as any[])[0];
    },
    enabled: !!user,
  });

  // 2) Legacy REST queries (to keep your old endpoints for other uses)
  const patientsQuery = useQuery({
    queryKey: ["/api/doctor/patients/all", selectedHospital?.id],
    queryFn: async () => {
      const resp = await fetch(
        `/api/doctor/patients/all?hospitalId=${selectedHospital?.id}`,
        { credentials: "include" }
      );
      if (!resp.ok) throw new Error("Failed to fetch patients");
      return resp.json();
    },
    enabled: !!user,
  });

  const appointmentsQuery = useQuery({
    queryKey: ["/api/doctor/today-appointments", selectedHospital?.id],
    queryFn: async () => {
      const resp = await fetch(
        `/api/doctor/today-appointments?hospitalId=${selectedHospital?.id}`,
        { credentials: "include" }
      );
      if (!resp.ok) throw new Error("Failed to fetch appointments");
      return resp.json();
    },
    enabled: !!user,
  });

  const prescriptionsQuery = useQuery({
    queryKey: ["/api/doctor/prescriptions", selectedHospital?.id],
    queryFn: async () => {
      const resp = await fetch(
        `/api/doctor/prescriptions?hospitalId=${selectedHospital?.id}`,
        { credentials: "include" }
      );
      if (!resp.ok) throw new Error("Failed to fetch prescriptions");
      return resp.json();
    },
    enabled: !!user,
  });

  const medicalRecordsQuery = useQuery({
    queryKey: ["/api/doctor/medical-records", selectedHospital?.id],
    queryFn: async () => {
      const resp = await fetch(
        `/api/doctor/medical-records?hospitalId=${selectedHospital?.id}`,
        { credentials: "include" }
      );
      if (!resp.ok) throw new Error("Failed to fetch medical records");
      return resp.json();
    },
    enabled: !!user,
  });

  // show loader while ANY of these is loading
  const isLoading =
    isDashboardLoading ||
    patientsQuery.isLoading ||
    appointmentsQuery.isLoading ||
    prescriptionsQuery.isLoading ||
    medicalRecordsQuery.isLoading;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  // Unpack RPC metrics
  const totalPatients = dashboard?.total_patients ?? 0;
  const totalAppointments = dashboard?.total_appointments ?? 0;
  const totalRecords = dashboard?.total_medical_records ?? 0;
  const totalPrescriptions = dashboard?.total_prescriptions ?? 0;
  const avgTimePerPatient = dashboard?.avg_time_minutes ?? 0;

  // From legacy queries (if you need them elsewhere)
  const allPatients = patientsQuery.data ?? [];
  const allAppointments = appointmentsQuery.data ?? [];
  const allPrescriptions = prescriptionsQuery.data ?? [];
  const allRecords = medicalRecordsQuery.data ?? [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header + Time‐range selector */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
            <p className="text-muted-foreground">
              Insights for {selectedHospital?.name ?? "your practice"}
            </p>
          </div>
          <div className="flex items-center gap-2 invisible">
            <Select value={timeRange} onValueChange={(v) => setTimeRange(v)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Past Week</SelectItem>
                <SelectItem value="month">Past Month</SelectItem>
                <SelectItem value="year">Past Year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Top metrics (via RPC) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/** Total Patients **/}
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Patients</CardDescription>
              <CardTitle className="text-3xl">{totalPatients}</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center text-sm">
              <Users className="mr-1 h-4 w-4 text-primary" />
              Active patients
            </CardContent>
          </Card>

          {/** Appointments **/}
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Appointments</CardDescription>
              <CardTitle className="text-3xl">{totalAppointments}</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center text-sm">
              <CalendarDays className="mr-1 h-4 w-4 text-primary" />
              Pending:{" "}
              {/* you could compute from allAppointments if you like */}
            </CardContent>
          </Card>

          {/** Medical Records **/}
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Medical Records</CardDescription>
              <CardTitle className="text-3xl">{totalRecords}</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center text-sm">
              <ClipboardList className="mr-1 h-4 w-4 text-primary" />
              Total records
            </CardContent>
          </Card>

          {/** Prescriptions **/}
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Prescriptions</CardDescription>
              <CardTitle className="text-3xl">{totalPrescriptions}</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center text-sm">
              <Pill className="mr-1 h-4 w-4 text-primary" />
              Issued
            </CardContent>
          </Card>

          {/** Avg. Time **/}
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Avg. Time</CardDescription>
              <CardTitle className="text-3xl">
                {avgTimePerPatient} min
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center text-sm">
              <Clock className="mr-1 h-4 w-4 text-primary" />
              Per patient
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Appointment Trends</CardTitle>
              <CardDescription>
                {timeRange === "week"
                  ? "Past 7 days"
                  : timeRange === "month"
                  ? "Past 4 weeks"
                  : "Past 12 months"}
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={appointmentData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="completed"
                    name="Completed"
                    stackId="a"
                    fill="#4ade80"
                  />
                  <Bar
                    dataKey="scheduled"
                    name="Scheduled"
                    stackId="a"
                    fill="#60a5fa"
                  />
                  <Bar
                    dataKey="cancelled"
                    name="Cancelled"
                    stackId="a"
                    fill="#f87171"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Patient Metrics</CardTitle>
              <CardDescription>New patients vs. follow-ups</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={patientMetricsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="newPatients"
                    name="New Patients"
                    stroke="#2563eb"
                    activeDot={{ r: 8 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="followUps"
                    name="Follow-ups"
                    stroke="#7c3aed"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Time Per Patient</CardTitle>
              <CardDescription>Average minutes</CardDescription>
            </CardHeader>
            <CardContent className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeSpentData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="avgTimePerPatient"
                    name="Minutes"
                    stroke="#f97316"
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Diagnoses</CardTitle>
              <CardDescription>Most common conditions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {topDiagnoses.map((d, i) => (
                <div key={i} className="flex justify-between items-center">
                  <div className="flex items-center">
                    <span className="text-muted-foreground mr-3">{i + 1}</span>
                    {d.condition}
                  </div>
                  <div className="flex items-center">
                    <span className="font-medium mr-2">{d.count}</span>
                    <Badge
                      variant={
                        d.change.startsWith("+") ? "outline" : "secondary"
                      }
                      className={
                        d.change.startsWith("+")
                          ? "text-green-600"
                          : "text-red-600"
                      }
                    >
                      {d.change}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest actions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentActivity
                .filter((a) =>
                  isWithinInterval(a.date, {
                    start: subDays(
                      new Date(),
                      timeRange === "week"
                        ? 7
                        : timeRange === "month"
                        ? 30
                        : 365
                    ),
                    end: new Date(),
                  })
                )
                .slice(0, 5)
                .map((a) => (
                  <div key={a.id} className="flex items-start">
                    <div className="mr-2 mt-0.5">{getActivityIcon(a.type)}</div>
                    <div>
                      <p className="text-sm">{a.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(a.date, "MMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
