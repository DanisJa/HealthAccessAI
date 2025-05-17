import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
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
import { ChatWidget } from "@/components/chat/chat-widget";
import {
  Search,
  RefreshCw,
  Pill,
  FileClock,
  AlertTriangle,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { navigate } from "wouter/use-browser-location";

const PAGE_SIZE = 5;

interface Medication {
  id: number;
  medication: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate?: string;
  status: string;
  instructions?: string;
  doctor: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

type FetchResult = {
  data: Medication[];
  count: number;
};

async function fetchMedications({
  queryKey,
}: {
  queryKey: [string, "active" | "completed" | "all", number, string, string];
}): Promise<FetchResult> {
  const [, tab, page, search, userId] = queryKey;

  let builder = supabase
    .from("prescriptions")
    .select(
      `
        id,
        medication,
        dosage,
        frequency,
        start_date,
        end_date,
        status,
        instructions,
        doctor:users!prescriptions_doctor_id_fkey(
          id,
          first_name,
          last_name
        )
      `,
      { count: "exact" }
    )
    .eq("patient_id", userId);

  if (tab !== "all") {
    builder = builder.eq("status", tab);
  }
  if (search) {
    builder = builder.ilike("medication", `%${search}%`);
  }

  const from = (page - 1) * PAGE_SIZE;
  const to = page * PAGE_SIZE - 1;

  const { data, count, error } = await builder.range(from, to);
  if (error) throw error;

  const meds = (data || []).map((m: any) => ({
    id: m.id,
    medication: m.medication,
    dosage: m.dosage,
    frequency: m.frequency,
    startDate: m.start_date,
    endDate: m.end_date || undefined,
    status: m.status,
    instructions: m.instructions || undefined,
    doctor: {
      id: m.doctor.id,
      firstName: m.doctor.first_name,
      lastName: m.doctor.last_name,
    },
  }));

  return { data: meds, count: count ?? 0 };
}

export default function PatientMedications() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState<"active" | "completed" | "all">("active");

  const { data: medResult = { data: [], count: 0 }, isLoading } =
    useQuery<FetchResult>({
      queryKey: ["patient_medications", tab, page, search, user?.id ?? ""],
      queryFn: fetchMedications,
      enabled: !!user,
      keepPreviousData: true,
    });

  const meds = medResult.data;
  const totalPages = Math.max(1, Math.ceil(medResult.count / PAGE_SIZE));

  // whenever user switches tab or search term, go back to page 1
  useEffect(() => setPage(1), [tab, search]);

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
          <h1 className="text-2xl font-bold">My Medications</h1>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Current and Past Medications</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
                <TabsTrigger value="all">All</TabsTrigger>
              </TabsList>

              <TabsContent value="active">
                <MedicationTable />
              </TabsContent>
              <TabsContent value="completed">
                <MedicationTable />
              </TabsContent>
              <TabsContent value="all">
                <MedicationTable />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <ChatWidget role="patient" />
    </DashboardLayout>
  );

  function MedicationTable() {
    return (
      <div className="space-y-4">
        {/* Search + Refresh */}
        <div className="flex items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              className="pl-10"
              placeholder="Search medications…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => {
              /* optionally call refetch if you capture it from useQuery */
            }}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {/* Table or loading skeleton */}
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
                {meds.length > 0 ? (
                  meds.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell>{m.medication}</TableCell>
                      <TableCell>{m.dosage}</TableCell>
                      <TableCell>{m.frequency}</TableCell>
                      <TableCell>
                        {format(new Date(m.startDate), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        {m.endDate
                          ? format(new Date(m.endDate), "MMM d, yyyy")
                          : "Ongoing"}
                      </TableCell>
                      <TableCell>{getStatusBadge(m.status)}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate("/patient/medical-records")}
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
      </div>
    );
  }
}
