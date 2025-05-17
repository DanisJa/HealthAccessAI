import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/../utils/supabaseClient";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  PlusCircle,
  MoreVertical,
  Search,
  RefreshCw,
  CalendarIcon,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { format } from "date-fns";
import { DayPicker } from "react-day-picker";
import { cn } from "@/lib/utils";
import { ChatWidget } from "@/components/chat/chat-widget";
import { useAuth } from "@/hooks/use-auth";

const PAGE_SIZE = 5;

type Prescription = {
  prescription_id: number;
  patient_first_name: string;
  patient_last_name: string;
  medication: string;
  dosage: string;
  start_date: string;
  end_date: string | null;
  prescription_status: "active" | "completed" | "cancelled" | string;
};

type FetchResult = {
  data: Prescription[];
  count: number;
};

async function fetchPrescriptions({
  queryKey,
}: {
  queryKey: [string, "active" | "completed" | "all", number, string];
}): Promise<FetchResult> {
  const [, statusFilter, page, search] = queryKey;
  let q = supabase
    .from("patient_prescriptions")
    .select("*", { count: "exact" });
  if (statusFilter !== "all") q = q.eq("prescription_status", statusFilter);
  if (search) q = q.ilike("medication", `%${search}%`);
  const from = (page - 1) * PAGE_SIZE;
  const to = page * PAGE_SIZE - 1;
  const { data, count, error } = await q.range(from, to);
  if (error) throw error;
  return { data: data || [], count: count ?? 0 };
}

async function fetchPatients() {
  const { data, error } = await supabase
    .from("users")
    .select("id, first_name, last_name")
    .eq("role", "patient");
  if (error) throw error;
  return data || [];
}

export default function DoctorPrescriptions() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState<"active" | "completed" | "all">("active");
  const [isNewPrescriptionOpen, setIsNewPrescriptionOpen] = useState(false);

  const [selectedPatient, setSelectedPatient] = useState<string>("");
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [medication, setMedication] = useState("");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState("");
  const [instructions, setInstructions] = useState("");

  const queryClient = useQueryClient();

  const { data: presResult = { data: [], count: 0 }, isLoading } =
    useQuery<FetchResult>({
      queryKey: ["patient_prescriptions", tab, page, search],
      queryFn: fetchPrescriptions,
      keepPreviousData: true,
    });

  const { data: patients = [] } = useQuery({
    queryKey: ["patients"],
    queryFn: fetchPatients,
  });

  // Mutation to insert a new prescription
  const createPrescription = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase.from("prescriptions").insert({
        patient_id: selectedPatient,
        doctor_id: user.id, // ← assign current doctor
        medication,
        dosage,
        frequency,
        start_date: startDate?.toISOString().split("T")[0] ?? null,
        end_date: endDate?.toISOString().split("T")[0] ?? null,
        instructions,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      setIsNewPrescriptionOpen(false);
      queryClient.invalidateQueries(["patient_prescriptions"]);
    },
  });
  const prescriptions = presResult.data;
  const totalPages = Math.max(1, Math.ceil(presResult.count / PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [search, tab]);

  const getInitials = (f: string, l: string) =>
    `${f.charAt(0)}${l.charAt(0)}`.toUpperCase();

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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Prescriptions</h1>
          <Button onClick={() => setIsNewPrescriptionOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" /> New Prescription
          </Button>
        </div>

        {/* Table Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Medication Prescriptions</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Search + Refresh */}
            <div className="flex items-center justify-between mb-4">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search prescriptions..."
                  className="pl-10"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() =>
                  queryClient.invalidateQueries(["patient_prescriptions"])
                }
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="active" onValueChange={setTab}>
              <TabsList className="grid w-full md:w-auto grid-cols-3">
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
                <TabsTrigger value="all">All</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Loading or Table */}
            <div className="border rounded-md">
              {isLoading ? (
                <div className="p-4 space-y-4">
                  {Array.from({ length: PAGE_SIZE }).map((_, i) => (
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
                    {prescriptions.length > 0 ? (
                      prescriptions.map((rx) => (
                        <TableRow key={rx.prescription_id}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <Avatar>
                                <AvatarFallback>
                                  {getInitials(
                                    rx.patient_first_name,
                                    rx.patient_last_name
                                  )}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium">
                                {`${rx.patient_first_name} ${rx.patient_last_name}`}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>{rx.medication}</TableCell>
                          <TableCell>{rx.dosage}</TableCell>
                          <TableCell>
                            {format(new Date(rx.start_date), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell>
                            {rx.end_date
                              ? format(new Date(rx.end_date), "MMM d, yyyy")
                              : "Ongoing"}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(rx.prescription_status)}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  View Details
                                </DropdownMenuItem>
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

            {/* Pagination */}
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <PaginationItem key={i}>
                    <Button
                      size="icon"
                      variant={i + 1 === page ? "default" : "outline"}
                      onClick={() => setPage(i + 1)}
                    >
                      {i + 1}
                    </Button>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </CardContent>
        </Card>
      </div>

      {/* New Prescription Modal */}
      <Dialog
        open={isNewPrescriptionOpen}
        onOpenChange={setIsNewPrescriptionOpen}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New Prescription</DialogTitle>
            <DialogDescription>
              Fill out the details and click “Create Prescription.”
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Patient Select */}
            <div className="grid gap-2">
              <Label htmlFor="patient">Patient</Label>
              <Select
                id="patient"
                value={selectedPatient}
                onValueChange={setSelectedPatient}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select patient" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((pt: any) => (
                    <SelectItem key={pt.id} value={pt.id}>
                      {pt.first_name} {pt.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Medication, Dosage, Frequency */}
            <div className="grid gap-2">
              <Label htmlFor="medication">Medication</Label>
              <Input
                id="medication"
                value={medication}
                onChange={(e) => setMedication(e.target.value)}
                placeholder="e.g. Amoxicillin"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="dosage">Dosage</Label>
                <Input
                  id="dosage"
                  value={dosage}
                  onChange={(e) => setDosage(e.target.value)}
                  placeholder="e.g. 500mg"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="frequency">Frequency</Label>
                <Input
                  id="frequency"
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  placeholder="e.g. Twice daily"
                />
              </div>
            </div>

            {/* Start & End Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <DayPicker
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid gap-2">
                <Label>End Date (Optional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "justify-start text-left font-normal",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <DayPicker
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      disabled={[{ before: startDate || new Date() }]}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Instructions */}
            <div className="grid gap-2">
              <Label htmlFor="instructions">Special Instructions</Label>
              <Textarea
                id="instructions"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Any notes for this prescription"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsNewPrescriptionOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => createPrescription.mutate()}
              disabled={createPrescription.isLoading}
            >
              Create Prescription
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ChatWidget role="doctor" />
    </DashboardLayout>
  );
}
