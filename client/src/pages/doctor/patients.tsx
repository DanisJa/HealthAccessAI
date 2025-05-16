import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useHospital } from "@/hooks/use-hospital";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MoreVertical, User as UserIcon } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { ChatWidget } from "@/components/chat/chat-widget";

// Fetch patients filtered by hospital and doctor (with pagination, search and tab)
const fetchPatientsByHospital = async (
  hospitalId: string,
  doctorId: string,
  page: number,
  search: string,
  tab: string
) => {
  const params = new URLSearchParams();
  params.append("hospitalId", hospitalId);
  params.append("doctorId", doctorId);
  if (search) params.append("search", search);
  params.append("page", page.toString());
  params.append("tab", tab);

  const response = await fetch(`/api/doctor/patients?${params.toString()}`);
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }
  return response.json();
};

export default function DoctorPatients() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState("all");
  const { selectedHospital } = useHospital();
  const { user } = useAuth();
  const doctorId = user?.id;

  const { data: patients = [], isLoading } = useQuery({
    queryKey: ["doctor-patients", selectedHospital, page, search, tab],
    queryFn: () =>
      fetchPatientsByHospital(selectedHospital, doctorId!, page, search, tab),
    enabled: Boolean(selectedHospital && doctorId),
  });

  const totalPages = 5; // Ideally this should come from the API response

  const getInitials = (firstName: string, lastName: string) =>
    `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center invisible">
          <h1 className="text-2xl font-bold font-heading">Patients</h1>
          <Button>
            <UserIcon className="mr-2 h-4 w-4" /> Add New Patient
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Patient Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border rounded-md">
                {isLoading ? (
                  <div className="p-4 space-y-4">
                    {Array(5)
                      .fill(0)
                      .map((_, i) => (
                        <div key={i} className="flex items-center space-x-4">
                          <Skeleton className="h-12 w-12 rounded-full" />
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-[250px]" />
                            <Skeleton className="h-4 w-[200px]" />
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Patient</TableHead>
                        <TableHead>Address</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {patients.length > 0 ? (
                        patients.map((patient: any) => (
                          <TableRow key={patient.patient_id}>
                            <TableCell>
                              <div className="flex items-center space-x-3">
                                <Avatar>
                                  <AvatarFallback>
                                    {getInitials(
                                      patient.first_name,
                                      patient.last_name
                                    )}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">
                                    {`${patient.first_name} ${patient.last_name}`}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{patient.address ?? "N/A"}</TableCell>
                            <TableCell>{patient.email ?? "N/A"}</TableCell>
                            <TableCell>
                              <Link
                                to={`/doctor/appointments?id=${patient.patient_id}`}
                              >
                                <Button variant="outline" size="sm">
                                  View Medical History
                                </Button>
                              </Link>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-6">
                            No patients found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <ChatWidget role="doctor" />
    </DashboardLayout>
  );
}
