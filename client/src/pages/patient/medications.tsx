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
import { Badge } from "@/components/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { ChatWidget } from "@/components/chat/chat-widget";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Search,
  RefreshCw,
  Pill,
  FileClock,
  AlertTriangle,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";

interface Medication {
  id: number;
  medication: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate?: string;
  status: string;
  doctor: {
    id: number;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  };
  instructions?: string;
}

export default function PatientMedications() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState("active");
  const [selectedMedication, setSelectedMedication] =
    useState<Medication | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const { data: medications, isLoading } = useQuery({
    queryKey: ["/api/patient/medications", tab, page, search],
  });

  const totalPages = 3; // Should come from API

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500">Active</Badge>;
      case "completed":
        return <Badge variant="outline">Completed</Badge>;
      case "cancelled":
        return (
          <Badge variant="outline" className="text-red-500 border-red-500">
            Cancelled
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const viewMedicationDetails = (medication: Medication) => {
    setSelectedMedication(medication);
    setIsDetailsOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold font-heading">My Medications</h1>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Current and Past Medications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="relative w-full md:w-96">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search medications..."
                    className="pl-10"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <Button size="icon" variant="ghost">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>

              <Tabs defaultValue="active" onValueChange={setTab}>
                <TabsList className="grid w-full md:w-auto grid-cols-3">
                  <TabsTrigger value="active">Active</TabsTrigger>
                  <TabsTrigger value="completed">Completed</TabsTrigger>
                  <TabsTrigger value="all">All</TabsTrigger>
                </TabsList>
              </Tabs>

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
                        <TableHead>Medication</TableHead>
                        <TableHead>Dosage</TableHead>
                        <TableHead>Frequency</TableHead>
                        <TableHead>Start Date</TableHead>
                        <TableHead>End Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {medications && medications.length > 0 ? (
                        medications.map((medication: Medication) => (
                          <TableRow key={medication.id}>
                            <TableCell>{medication.medication}</TableCell>
                            <TableCell>{medication.dosage}</TableCell>
                            <TableCell>{medication.frequency}</TableCell>
                            <TableCell>
                              {format(
                                new Date(medication.startDate),
                                "MMM d, yyyy"
                              )}
                            </TableCell>
                            <TableCell>
                              {medication.endDate
                                ? format(
                                    new Date(medication.endDate),
                                    "MMM d, yyyy"
                                  )
                                : "Ongoing"}
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(medication.status)}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  viewMedicationDetails(medication)
                                }
                              >
                                View Details
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-6">
                            No medications found
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

      {/* Medication Details Dialog */}
      {selectedMedication && (
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Medication Details</DialogTitle>
              <DialogDescription>
                Detailed information about your medication.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <div className="flex items-center space-x-3 mb-6">
                <Avatar>
                  <AvatarImage src={selectedMedication.doctor.avatarUrl} />
                  <AvatarFallback>
                    {getInitials(
                      selectedMedication.doctor.firstName,
                      selectedMedication.doctor.lastName
                    )}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">
                    Prescribed by: Dr. {selectedMedication.doctor.firstName}{" "}
                    {selectedMedication.doctor.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {format(
                      new Date(selectedMedication.startDate),
                      "MMMM d, yyyy"
                    )}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Medication</p>
                  <p className="font-medium flex items-center">
                    <Pill className="mr-2 h-4 w-4 text-primary" />
                    {selectedMedication.medication}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="font-medium">
                    {getStatusBadge(selectedMedication.status)}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Dosage</p>
                  <p className="font-medium">{selectedMedication.dosage}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Frequency</p>
                  <p className="font-medium">{selectedMedication.frequency}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Start Date</p>
                  <p className="font-medium flex items-center">
                    <FileClock className="mr-2 h-4 w-4 text-neutral-500" />
                    {format(
                      new Date(selectedMedication.startDate),
                      "MMMM d, yyyy"
                    )}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">End Date</p>
                  <p className="font-medium">
                    {selectedMedication.endDate
                      ? format(
                          new Date(selectedMedication.endDate),
                          "MMMM d, yyyy"
                        )
                      : "Ongoing"}
                  </p>
                </div>
              </div>

              {selectedMedication.instructions && (
                <div className="border-t pt-4 mt-4">
                  <h4 className="font-medium mb-2">Special Instructions</h4>
                  <p className="text-sm">{selectedMedication.instructions}</p>
                </div>
              )}

              <div className="bg-yellow-50 border border-yellow-100 rounded-md p-4 mt-6 flex">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mr-3 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-700">
                  <p className="font-medium">Important Reminders</p>
                  <ul className="list-disc pl-5 mt-1 space-y-1">
                    <li>Take this medication as prescribed by your doctor.</li>
                    <li>
                      Do not skip doses or stop taking without consulting your
                      doctor.
                    </li>
                    <li>Report any unusual side effects promptly.</li>
                  </ul>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
                Close
              </Button>
              <Button>Request Refill</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <ChatWidget role="patient" />
    </DashboardLayout>
  );
}
