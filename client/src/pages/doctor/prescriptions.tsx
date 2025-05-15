import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageContainer } from "@/components/layout/page-container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { ChatWidget } from "@/components/chat/chat-widget";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PlusCircle, MoreVertical, Search, RefreshCw, CalendarIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DayPicker } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";

export default function DoctorPrescriptions() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState("active");
  const [isNewPrescriptionOpen, setIsNewPrescriptionOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>();

  const { data: prescriptions, isLoading } = useQuery({
    queryKey: ['/api/doctor/prescriptions', tab, page, search],
  });

  const { data: patients } = useQuery({
    queryKey: ['/api/doctor/patients/all'],
  });

  const totalPages = 3; // This should come from API

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500">Active</Badge>;
      case "completed":
        return <Badge variant="outline">Completed</Badge>;
      case "cancelled":
        return <Badge variant="outline" className="text-red-500 border-red-500">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <PageContainer>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold font-heading">Prescriptions</h1>
          <Button onClick={() => setIsNewPrescriptionOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" /> New Prescription
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Medication Prescriptions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="relative w-full md:w-96">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search prescriptions..."
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
                        <TableHead>Medication</TableHead>
                        <TableHead>Dosage</TableHead>
                        <TableHead>Start Date</TableHead>
                        <TableHead>End Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {prescriptions && prescriptions.length > 0 ? (
                        prescriptions.map((prescription: any) => (
                          <TableRow key={prescription.id}>
                            <TableCell>
                              <div className="flex items-center space-x-3">
                                <Avatar>
                                  <AvatarImage src={prescription.patient.avatarUrl} />
                                  <AvatarFallback>
                                    {getInitials(prescription.patient.firstName, prescription.patient.lastName)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">{`${prescription.patient.firstName} ${prescription.patient.lastName}`}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{prescription.medication}</TableCell>
                            <TableCell>{prescription.dosage}</TableCell>
                            <TableCell>{format(new Date(prescription.startDate), 'MMM d, yyyy')}</TableCell>
                            <TableCell>
                              {prescription.endDate ? 
                                format(new Date(prescription.endDate), 'MMM d, yyyy') : 
                                'Ongoing'}
                            </TableCell>
                            <TableCell>{getStatusBadge(prescription.status)}</TableCell>
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
                                  <DropdownMenuItem>Renew</DropdownMenuItem>
                                  <DropdownMenuItem>Cancel</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-6">
                            No prescriptions found
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

      {/* New Prescription Dialog */}
      <Dialog open={isNewPrescriptionOpen} onOpenChange={setIsNewPrescriptionOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>New Prescription</DialogTitle>
            <DialogDescription>
              Create a new prescription for a patient.
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
              <Label htmlFor="medication">Medication</Label>
              <Input id="medication" placeholder="Enter medication name" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="dosage">Dosage</Label>
                <Input id="dosage" placeholder="e.g. 10mg" />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="frequency">Frequency</Label>
                <Input id="frequency" placeholder="e.g. Once daily" />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <DayPicker
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="grid gap-2">
                <Label>End Date (Optional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "justify-start text-left font-normal",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <DayPicker
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                      disabled={[
                        { before: startDate || new Date() }
                      ]}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="instructions">Special Instructions</Label>
              <Textarea 
                id="instructions" 
                placeholder="Add any special instructions for this medication"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewPrescriptionOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Prescription</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ChatWidget role="doctor" />
    </PageContainer>
  );
}
