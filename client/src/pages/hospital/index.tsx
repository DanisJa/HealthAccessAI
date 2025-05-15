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
import { useHospital } from "@/hooks/use-hospital";

export default function HospitalDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState("overview");
  const { selectedHospital } = useHospital();
  
  // Fetch hospital details
  const hospitalQuery = useQuery({
    queryKey: ['hospital', selectedHospital],
    queryFn: async () => {
      if (!selectedHospital) return null;
      
      const response = await fetch(`/api/hospital/${selectedHospital}`);
      if (!response.ok) {
        throw new Error('Failed to fetch hospital details');
      }
      return response.json();
    },
    enabled: !!selectedHospital,
  });

  // Fetch hospital doctors
  const doctorsQuery = useQuery({
    queryKey: ['hospital', selectedHospital, 'doctors'],
    queryFn: async () => {
      if (!selectedHospital) return [];
      
      const response = await fetch(`/api/hospital/${selectedHospital}/doctors`);
      if (!response.ok) {
        throw new Error('Failed to fetch hospital doctors');
      }
      return response.json();
    },
    enabled: !!selectedHospital,
  });
  
  // Mock data for development
  const hospitalData = hospitalQuery.data || {
    id: 1,
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
  const stats = {
    totalDoctors: doctors.length,
    totalPatients: 0,
    pendingInvitations: doctors.filter(d => d.status === "pending").length,
    departments: hospitalData.departments?.length || 5
  };

  if (!user || user.role !== 'hospital') {
    return <div>Not authorized</div>;
  }
  
  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-3xl font-bold">Hospital Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your hospital, doctors, and medical services
          </p>
        </div>
        <Button variant="default">
          <Plus className="mr-2 h-4 w-4" /> Add Doctor
        </Button>
      </div>
      
      <Tabs defaultValue="overview" value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="doctors">Doctors</TabsTrigger>
          <TabsTrigger value="patients">Patients</TabsTrigger>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
          
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
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
        </TabsContent>
        
        <TabsContent value="doctors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Doctors Management</CardTitle>
              <CardDescription>View and manage doctors at your hospital</CardDescription>
            </CardHeader>
            <CardContent>
              <DoctorListCard 
                doctors={doctors} 
                isLoading={doctorsQuery.isLoading} 
                onRefresh={() => doctorsQuery.refetch()} 
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="patients" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Patients Management</CardTitle>
              <CardDescription>View and manage patients at your hospital</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Patient management feature coming soon
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="appointments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Appointments</CardTitle>
              <CardDescription>View and manage all appointments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Appointment management feature coming soon
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Hospital Settings</CardTitle>
              <CardDescription>Manage your hospital details and settings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Hospital settings feature coming soon
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}