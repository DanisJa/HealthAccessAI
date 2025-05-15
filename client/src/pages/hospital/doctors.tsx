import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import DoctorListCard from "@/components/hospital/doctor-list-card";

export default function HospitalDoctors() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Fetch hospital doctors
  const doctorsQuery = useQuery({
    queryKey: ['hospital-doctors', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const response = await fetch('/api/hospital/doctors');
      if (!response.ok) {
        throw new Error('Failed to fetch hospital doctors');
      }
      return response.json();
    },
    enabled: !!user?.id,
  });
  
  const doctors = doctorsQuery.data || [
    { id: 1, firstName: "John", lastName: "Doe", email: "john.doe@example.com", specialty: "Cardiology", status: "active" },
    { id: 2, firstName: "Jane", lastName: "Smith", email: "jane.smith@example.com", specialty: "Neurology", status: "active" },
    { id: 3, firstName: "Robert", lastName: "Johnson", email: "robert.j@example.com", specialty: "Pediatrics", department: "Children's Care", status: "pending" },
    { id: 4, firstName: "Emily", lastName: "Williams", email: "emily.w@example.com", specialty: "Orthopedics", status: "active" },
    { id: 5, firstName: "Michael", lastName: "Brown", email: "michael.b@example.com", specialty: "Dermatology", status: "active" },
    { id: 6, firstName: "Sarah", lastName: "Taylor", email: "sarah.t@example.com", specialty: "Ophthalmology", status: "pending" }
  ];

  if (!user || user.role !== 'hospital') {
    return <div>Not authorized</div>;
  }
  
  return (
    <DashboardLayout>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Doctors Management</h1>
          <p className="text-muted-foreground">
            View and manage doctors at your hospital
          </p>
        </div>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" /> Add New Doctor
        </Button>
      </div>
      
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>All Doctors</CardTitle>
          <CardDescription>
            Doctors currently affiliated with your hospital
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DoctorListCard 
            doctors={doctors} 
            isLoading={doctorsQuery.isLoading} 
            onRefresh={() => doctorsQuery.refetch()} 
          />
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}