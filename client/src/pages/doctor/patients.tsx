import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { ChatWidget } from "@/components/chat/chat-widget";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { MoreVertical, Search, User, RefreshCw } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";

const fetchPatientsByHospital = async (
  hospitalId: string,
  doctorId: string
) => {
  const response = await fetch(
    `/api/doctor/patients?hospitalId=${hospitalId}&doctorId=${doctorId}`
  );
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }
  return response.json();
};

export default function DoctorPatients() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState("all");

  const { data: patients, isLoading } = useQuery({
    queryKey: ["/api/doctor/patients", tab, page, search],
    queryFn: () => fetchPatientsByHospital("hospitalId", "doctorId"),
  });

  const totalPages = 5; // This should come from API

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold font-heading">Patients</h1>
          <Button>
            <User className="mr-2 h-4 w-4" /> Add New Patient
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
                        <TableHead>Last Visit</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {patients && patients.length > 0 ? (
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
                                  <p className="text-xs text-muted-foreground">
                                    N/A
                                  </p>
                                </div>
                              </div>
                            </TableCell>

                            <TableCell>
                              N/A{" "}
                              {/* Replace with patient.lastVisit if you have it */}
                            </TableCell>
                            <TableCell>{patient.email ?? "N/A"}</TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>
                                    View Profile
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    Medical Records
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    Schedule Appointment
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    Send Message
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-6">
                            No patients found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </div>

              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setPage(Math.max(1, page - 1))}
                    />
                  </PaginationItem>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (pageNum) => (
                      <PaginationItem key={pageNum}>
                        <Button
                          variant={pageNum === page ? "default" : "outline"}
                          size="icon"
                          onClick={() => setPage(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      </PaginationItem>
                    )
                  )}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setPage(Math.min(totalPages, page + 1))}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </CardContent>
        </Card>
      </div>

      <ChatWidget role="doctor" />
    </DashboardLayout>
  );
}
