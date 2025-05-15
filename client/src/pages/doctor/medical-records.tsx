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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FileText, MoreVertical, Plus, Search, RefreshCw } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

export default function DoctorMedicalRecords() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState("all");
  const [isNewReportOpen, setIsNewReportOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState("");

  const { data: medicalRecords, isLoading } = useQuery({
    queryKey: ['/api/doctor/medical-records', tab, page, search],
  });

  const { data: patients } = useQuery({
    queryKey: ['/api/doctor/patients/all'],
  });

  const totalPages = 5; // This should come from API

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <PageContainer>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold font-heading">Medical Records</h1>
          <Button onClick={() => setIsNewReportOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> New Medical Report
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Medical Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="relative w-full md:w-96">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search medical records..."
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
                  <TabsTrigger value="all">All Records</TabsTrigger>
                  <TabsTrigger value="reports">Reports</TabsTrigger>
                  <TabsTrigger value="orders">Medical Orders</TabsTrigger>
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
                        <TableHead>Type</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {medicalRecords && medicalRecords.length > 0 ? (
                        medicalRecords.map((record: any) => (
                          <TableRow key={record.id}>
                            <TableCell>
                              <div className="flex items-center space-x-3">
                                <Avatar>
                                  <AvatarImage src={record.patient.avatarUrl} />
                                  <AvatarFallback>
                                    {getInitials(record.patient.firstName, record.patient.lastName)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">{`${record.patient.firstName} ${record.patient.lastName}`}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={record.type === 'report' ? 'default' : 'outline'}>
                                {record.type === 'report' ? 'Medical Report' : 'Medical Order'}
                              </Badge>
                            </TableCell>
                            <TableCell>{record.title}</TableCell>
                            <TableCell>{new Date(record.createdAt).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>View Details</DropdownMenuItem>
                                  <DropdownMenuItem>Edit</DropdownMenuItem>
                                  <DropdownMenuItem>Print</DropdownMenuItem>
                                  <DropdownMenuItem>Share</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-6">
                            No medical records found
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

      {/* New Medical Report Dialog */}
      <Dialog open={isNewReportOpen} onOpenChange={setIsNewReportOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>New Medical Report</DialogTitle>
            <DialogDescription>
              Create a new medical report for a patient.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="patient">Patient</Label>
              <Select
                value={selectedPatient}
                onValueChange={setSelectedPatient}
              >
                <SelectTrigger id="patient">
                  <SelectValue placeholder="Select patient" />
                </SelectTrigger>
                <SelectContent>
                  {patients && patients.map((patient: any) => (
                    <SelectItem key={patient.id} value={String(patient.id)}>
                      {`${patient.firstName} ${patient.lastName}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="title">Report Title</Label>
              <Input id="title" placeholder="Enter report title" />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="content">Report Content</Label>
              <Textarea 
                id="content"
                placeholder="Enter detailed report"
                className="min-h-[200px]"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewReportOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              <FileText className="mr-2 h-4 w-4" />
              Save Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ChatWidget role="doctor" />
    </PageContainer>
  );
}
