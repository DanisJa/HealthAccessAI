import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Search, RefreshCw, Bell, CheckCircle2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 5;

type Reminder = {
  id: number;
  type: string;
  title: string;
  description: string | null;
  due_date: string;
  recurring: boolean;
  frequency: string | null;
  completed: boolean;
};

type FetchResult = {
  data: Reminder[];
  count: number;
};

async function fetchReminders({
  queryKey,
}: {
  queryKey: [string, "active" | "completed" | "all", number, string, string];
}): Promise<FetchResult> {
  const [, tab, page, search, userId] = queryKey;

  let builder = supabase
    .from("reminders")
    .select("*", { count: "exact" })
    .eq("user_id", userId);

  if (tab !== "all") {
    builder = builder.eq("completed", tab === "completed");
  }
  if (search) {
    builder = builder.ilike("title", `%${search}%`);
  }

  const from = (page - 1) * PAGE_SIZE;
  const to = page * PAGE_SIZE - 1;
  const { data, count, error } = await builder.range(from, to);
  if (error) throw error;
  return { data: data || [], count: count ?? 0 };
}

export default function PatientReminders() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState<"active" | "completed" | "all">("active");
  const [isNewOpen, setIsNewOpen] = useState(false);

  // new reminder form
  const [title, setTitle] = useState("");
  const [type, setType] = useState("medication");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [time, setTime] = useState("08:00");
  const [recurring, setRecurring] = useState(false);
  const [frequency, setFrequency] = useState("daily");

  // fetch
  const { data: result = { data: [], count: 0 }, isLoading } =
    useQuery<FetchResult>({
      queryKey: ["patient_reminders", tab, page, search, user?.id ?? ""],
      queryFn: fetchReminders,
      enabled: !!user,
      keepPreviousData: true,
    });

  // complete mutation
  const completeMutation = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from("reminders")
        .update({ completed: true })
        .eq("id", id)
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries(["patient_reminders"]),
  });

  // create mutation
  const createMutation = useMutation({
    mutationFn: async () => {
      const due = new Date(date!);
      const [h, m] = time.split(":").map(Number);
      due.setHours(h, m, 0, 0);

      const { error } = await supabase.from("reminders").insert({
        type,
        title,
        description: description || null,
        due_date: due.toISOString(),
        recurring,
        frequency: recurring ? frequency : null,
        completed: false,
        user_id: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries(["patient_reminders"]);
      setIsNewOpen(false);
      // reset form
      setTitle("");
      setType("medication");
      setDescription("");
      setDate(new Date());
      setTime("08:00");
      setRecurring(false);
      setFrequency("daily");
    },
  });

  const reminders = result.data;
  const totalPages = Math.max(1, Math.ceil(result.count / PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [tab, search]);

  const getStatusBadge = (r: Reminder) =>
    r.completed ? (
      <Badge className="bg-green-500">Completed</Badge>
    ) : r.due_date < new Date().toISOString() ? (
      <Badge className="bg-red-100 text-red-800">Overdue</Badge>
    ) : (
      <Badge className="bg-blue-100 text-blue-800">Pending</Badge>
    );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <header className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">My Reminders</h1>
          <Button onClick={() => setIsNewOpen(true)}>
            <Bell className="mr-2 h-4 w-4" /> New Reminder
          </Button>
        </header>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>All Reminders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Search & Refresh */}
              <div className="flex items-center justify-between">
                <div className="relative w-full md:w-96">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    className="pl-10"
                    placeholder="Search reminders..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => qc.invalidateQueries(["patient_reminders"])}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>

              {/* Tabs */}
              <Tabs value={tab} onValueChange={setTab}>
                <TabsList className="grid grid-cols-3 mb-4">
                  <TabsTrigger value="active">Active</TabsTrigger>
                  <TabsTrigger value="completed">Completed</TabsTrigger>
                  <TabsTrigger value="all">All</TabsTrigger>
                </TabsList>

                {(["active", "completed", "all"] as const).map((v) => (
                  <TabsContent key={v} value={v}>
                    <div className="border rounded-md">
                      {isLoading ? (
                        <div className="p-4 space-y-4">
                          {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                            <div
                              key={i}
                              className="flex items-center space-x-4"
                            >
                              <Skeleton className="h-10 w-10 rounded-full" />
                              <div className="space-y-2">
                                <Skeleton className="h-4 w-[200px]" />
                                <Skeleton className="h-4 w-[150px]" />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Title</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Due Date</TableHead>
                              <TableHead>Recurring</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {reminders.length > 0 ? (
                              reminders.map((r) => (
                                <TableRow key={r.id}>
                                  <TableCell>{r.title}</TableCell>
                                  <TableCell>
                                    <Badge variant="outline">{r.type}</Badge>
                                  </TableCell>
                                  <TableCell>
                                    {format(
                                      new Date(r.due_date),
                                      "MMM d, yyyy h:mm a"
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    {r.recurring ? r.frequency : "No"}
                                  </TableCell>
                                  <TableCell>{getStatusBadge(r)}</TableCell>
                                  <TableCell>
                                    {!r.completed && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                          completeMutation.mutate(r.id)
                                        }
                                        disabled={completeMutation.isLoading}
                                      >
                                        <CheckCircle2 className="mr-1 h-4 w-4" />
                                        Mark Done
                                      </Button>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))
                            ) : (
                              <TableRow>
                                <TableCell
                                  colSpan={6}
                                  className="text-center py-6"
                                >
                                  No reminders found
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
                            onClick={() =>
                              setPage((p) => Math.min(totalPages, p + 1))
                            }
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* New Reminder Dialog */}
      <Dialog open={isNewOpen} onOpenChange={setIsNewOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Reminder</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Reminder title"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="type">Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="medication">Medication</SelectItem>
                  <SelectItem value="appointment">Appointment</SelectItem>
                  <SelectItem value="measurement">Measurement</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
                    >
                      {date ? format(date, "PPP") : "Pick date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid gap-2">
                <Label>Time</Label>
                <Select value={time} onValueChange={setTime}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["08:00", "12:00", "18:00"].map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={recurring}
                onCheckedChange={(c) => setRecurring(!!c)}
              />
              <Label>Recurring</Label>
            </div>
            {recurring && (
              <div className="grid gap-2">
                <Label>Frequency</Label>
                <Select value={frequency} onValueChange={setFrequency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["daily", "weekly", "monthly"].map((f) => (
                      <SelectItem key={f} value={f}>
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsNewOpen(false)}
              disabled={createMutation.isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isLoading}
            >
              {createMutation.isLoading ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
