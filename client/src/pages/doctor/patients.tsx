import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageContainer } from "@/components/layout/page-container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead, 
  TableCell 
} from "@/components/ui/table";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { ChatWidget } from "@/components/chat/chat-widget";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { MoreVertical, Search, User, RefreshCw } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

export default function DoctorPatients() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState("all");

  const { data: patients, isLoading } = useQuery({
    queryKey: ['/api/doctor/patients', tab, page, search],
  });

  const totalPages = 5; // This should come from API

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500">Active</Badge>;
      case "inactive":
        return <Badge variant="outline">Inactive</Badge>;
      case "critical":
        return <Badge className="bg-red-500">Critical</Badge>;
      case "stable":
        return <Badge className="bg-blue-500">Stable</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <PageContainer>
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
              <div className="flex items-center justify-between">
                <div className="relative w-full md:w-96">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search patients..."
                    className="pl-10"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <Button size="icon" variant="ghost">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>

              <Tabs defaultValue="all" onValueChange={setTab}>
                <TabsList className="grid w-full md:w-auto grid-cols-3">
                  <TabsTrigger value="all">All Patients</TabsTrigger>
                  <TabsTrigger value="active">Active</TabsTrigger>
                  <TabsTrigger value="critical">Critical</TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="border rounded-md">
                {isLoading ? (
                  <div className="p-4 space-y-4">
                    {Array(5).fill(0).map((_, i) => (
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
                        <TableHead>Status</TableHead>
                        <TableHead>Last Visit</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {patients && patients.length > 0 ? (
                        patients.map((patient: any) => (
                          <TableRow key={patient.id}>
                            <TableCell>
                              <div className="flex items-center space-x-3">
                                <Avatar>
                                  <AvatarImage src={patient.avatarUrl} />
                                  <AvatarFallback>
                                    {getInitials(patient.firstName, patient.lastName)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">{`${patient.firstName} ${patient.lastName}`}</p>
                                  <p className="text-xs text-muted-foreground">{`${patient.age}y, ${patient.gender}`}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(patient.status)}</TableCell>
                            <TableCell>{patient.lastVisit}</TableCell>
                            <TableCell>{patient.email}</TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>View Profile</DropdownMenuItem>
                                  <DropdownMenuItem>Medical Records</DropdownMenuItem>
                                  <DropdownMenuItem>Schedule Appointment</DropdownMenuItem>
                                  <DropdownMenuItem>Send Message</DropdownMenuItem>
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
                    <PaginationPrevious onClick={() => setPage(Math.max(1, page - 1))} />
                  </PaginationItem>
                  {Array.from({length: totalPages}, (_, i) => i + 1).map(pageNum => (
                    <PaginationItem key={pageNum}>
                      <Button
                        variant={pageNum === page ? "default" : "outline"}
                        size="icon"
                        onClick={() => setPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext onClick={() => setPage(Math.min(totalPages, page + 1))} />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </CardContent>
        </Card>
      </div>

      <ChatWidget role="doctor" />
    </PageContainer>
  );
}
