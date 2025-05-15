import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserCheck, Building, Users, Calendar, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import HospitalStatsCard from "@/components/hospital/hospital-stats-card";
import HospitalDetailsCard from "@/components/hospital/hospital-details-card";
import DoctorListCard from "@/components/hospital/doctor-list-card";

export default function HospitalDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState("overview");
  
  // Fetch hospital self info
  const hospitalQuery = useQuery({
    queryKey: ['hospital', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const response = await fetch(`/api/hospitals/${user.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch hospital details');
      }
      return response.json();
    },
    enabled: !!user?.id,
  });

  // Fetch hospital doctors
  const doctorsQuery = useQuery({
    queryKey: ['hospital-doctors', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const response = await fetch(`/api/hospital/doctors`);
      if (!response.ok) {
        throw new Error('Failed to fetch hospital doctors');
      }
      return response.json();
    },
    enabled: !!user?.id,
  });
  
  // Fetch hospital patients
  const patientsQuery = useQuery({
    queryKey: ['hospital-patients', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const response = await fetch(`/api/hospital/patients`);
      if (!response.ok) {
        throw new Error('Failed to fetch hospital patients');
      }
      return response.json();
    },
    enabled: !!user?.id,
  });
  
  // Mock data for development
  const hospitalData = hospitalQuery.data || {
    id: user?.id || 1,
    name: user?.firstName ? `${user.firstName} ${user.lastName || ''}` : "General Hospital",
    type: "public",
    municipality: user?.municipality || "Central Municipality",
    address: "123 Main Street",
    phone: "+1 (555) 123-4567",
    email: user?.email || "contact@hospital.com",
    departments: ["Cardiology", "Neurology", "Pediatrics", "Orthopedics", "Emergency"],
    services: ["Emergency Care", "Intensive Care", "Surgery", "Diagnostic Imaging"]
  };
  
  const doctors = doctorsQuery.data || [
    { id: 1, firstName: "John", lastName: "Doe", email: "john.doe@example.com", specialty: "Cardiology", status: "active" },
    { id: 2, firstName: "Jane", lastName: "Smith", email: "jane.smith@example.com", specialty: "Neurology", status: "active" },
    { id: 3, firstName: "Robert", lastName: "Johnson", email: "robert.j@example.com", specialty: "Pediatrics", department: "Children's Care", status: "pending" }
  ];
  
  // Stats for the dashboard
  const patients = patientsQuery.data || [];
  
  const stats = {
    totalDoctors: doctors.length,
    totalPatients: patients.length,
    pendingInvitations: doctors.filter((d: any) => d.status === "pending").length,
    departments: hospitalData.departments?.length || 5
  };

  if (!user || user.role !== 'hospital') {
    return <div>Not authorized</div>;
  }
  
  return (
    <DashboardLayout>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Hospital Overview</h1>
          <p className="text-muted-foreground">
            Welcome back to your hospital dashboard
          </p>
        </div>
        <Button variant="default">
          <Plus className="mr-2 h-4 w-4" /> Add Doctor
        </Button>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mt-6">
        <HospitalStatsCard
          title="Total Doctors"
          value={stats.totalDoctors}
          icon={<UserCheck className="h-4 w-4" />}
          description={`${stats.pendingInvitations} pending invitations`}
        />
        <HospitalStatsCard
          title="Total Patients"
          value={stats.totalPatients}
          icon={<Users className="h-4 w-4" />}
          description="Registered at your hospital"
        />
        <HospitalStatsCard
          title="Departments"
          value={stats.departments}
          icon={<Building className="h-4 w-4" />}
          description="Active medical departments"
        />
        <HospitalStatsCard
          title="Upcoming Appointments"
          value="0"
          icon={<Calendar className="h-4 w-4" />}
          description="For today across all doctors"
        />
      </div>
      
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 mt-6">
        <HospitalDetailsCard hospital={hospitalData} />
        
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Recent activity at your hospital
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4 text-muted-foreground">
              No recent activity to show.
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}