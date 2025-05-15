import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus, Search, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function HospitalPatients() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  
  // Fetch hospital patients
  const patientsQuery = useQuery({
    queryKey: ['hospital-patients', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const response = await fetch('/api/hospital/patients');
      if (!response.ok) {
        throw new Error('Failed to fetch hospital patients');
      }
      return response.json();
    },
    enabled: !!user?.id,
  });
  
  // Mock data for hospital patients
  const patients = patientsQuery.data || [
    { id: 1, firstName: "Alice", lastName: "Johnson", email: "alice.j@example.com", dateOfBirth: "1985-03-12", status: "active" },
    { id: 2, firstName: "Bob", lastName: "Smith", email: "bob.smith@example.com", dateOfBirth: "1978-07-23", status: "active" },
    { id: 3, firstName: "Carol", lastName: "Williams", email: "carol.w@example.com", dateOfBirth: "1990-11-05", status: "pending" },
    { id: 4, firstName: "David", lastName: "Brown", email: "david.b@example.com", dateOfBirth: "1965-09-18", status: "active" },
    { id: 5, firstName: "Eva", lastName: "Martinez", email: "eva.m@example.com", dateOfBirth: "1982-05-30", status: "active" }
  ];

  // Filter patients by search query
  const filteredPatients = patients.filter(
    (patient) =>
      patient.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!user || user.role !== 'hospital') {
    return <div>Not authorized</div>;
  }
  
  return (
    <DashboardLayout>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Patients Management</h1>
          <p className="text-muted-foreground">
            View and manage patients at your hospital
          </p>
        </div>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" /> Add New Patient
        </Button>
      </div>
      
      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Patients</CardTitle>
              <CardDescription>
                Patients registered with your hospital
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search patients..."
                  className="pl-8 w-[250px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => patientsQuery.refetch()}
                disabled={patientsQuery.isLoading}
              >
                <RefreshCcw className={`h-4 w-4 ${patientsQuery.isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {patientsQuery.isLoading ? (
            <div className="flex justify-center py-8">
              <RefreshCcw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredPatients.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery ? "No patients found matching your search" : "No patients registered with your hospital yet"}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Date of Birth</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPatients.map((patient) => (
                    <TableRow key={patient.id}>
                      <TableCell className="font-medium">
                        {patient.firstName} {patient.lastName}
                      </TableCell>
                      <TableCell>{patient.email}</TableCell>
                      <TableCell>{new Date(patient.dateOfBirth).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge
                          variant={patient.status === 'active' ? 'default' : 'outline'}
                        >
                          {patient.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">View</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}