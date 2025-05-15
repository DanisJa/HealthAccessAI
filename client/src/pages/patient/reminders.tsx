import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
import { Badge } from "@/components/ui/badge";
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { ChatWidget } from "@/components/chat/chat-widget";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Search, 
  RefreshCw, 
  Plus, 
  Bell, 
  Calendar as CalendarIcon,
  CheckCircle2, 
  Check,
  AlertCircle
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { DayPicker } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export default function PatientReminders() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState("active");
  const [isNewReminderOpen, setIsNewReminderOpen] = useState(false);
  const [reminderTitle, setReminderTitle] = useState("");
  const [reminderType, setReminderType] = useState("medication");
  const [reminderDescription, setReminderDescription] = useState("");
  const [reminderDate, setReminderDate] = useState<Date | undefined>(new Date());
  const [reminderTime, setReminderTime] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState("");
  
  const { toast } = useToast();

  const { data: reminders, isLoading } = useQuery({
    queryKey: ['/api/patient/reminders', tab, page, search],
  });

  const createReminderMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', '/api/patient/reminders', data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Reminder created",
        description: "Your reminder has been successfully created.",
      });
      setIsNewReminderOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['/api/patient/reminders'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to create reminder",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    },
  });

  const completeReminderMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('PATCH', `/api/patient/reminders/${id}/complete`, {});
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Reminder completed",
        description: "Your reminder has been marked as completed.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/patient/reminders'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to complete reminder",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    },
  });

  const totalPages = 3; // This should come from API

  const resetForm = () => {
    setReminderTitle("");
    setReminderType("medication");
    setReminderDescription("");
    setReminderDate(new Date());
    setReminderTime("");
    setIsRecurring(false);
    setFrequency("");
  };

  const handleCreateReminder = () => {
    if (!reminderTitle || !reminderDate || !reminderTime) {
      toast({
        title: "Incomplete form",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    // Combine date and time
    const dueDate = new Date(reminderDate);
    const [hours, minutes] = reminderTime.split(":").map(Number);
    dueDate.setHours(hours, minutes);

    createReminderMutation.mutate({
      type: reminderType,
      title: reminderTitle,
      description: reminderDescription,
      dueDate: dueDate.toISOString(),
      recurring: isRecurring,
      frequency: isRecurring ? frequency : null,
    });
  };

  const getUrgencyBadge = (dueDate: string) => {
    const today = new Date();
    const reminderDate = new Date(dueDate);
    
    // Reset time part for accurate day comparison
    today.setHours(0, 0, 0, 0);
    reminderDate.setHours(0, 0, 0, 0);
    
    // Calculate days difference
    const diffTime = reminderDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return <Badge className="bg-red-100 text-red-800">Overdue</Badge>;
    } else if (diffDays === 0) {
      return <Badge className="bg-red-100 text-red-800">Today</Badge>;
    } else if (diffDays === 1) {
      return <Badge className="bg-yellow-100 text-yellow-800">Tomorrow</Badge>;
    } else if (diffDays <= 3) {
      return <Badge className="bg-yellow-100 text-yellow-800">In {diffDays} days</Badge>;
    } else {
      return <Badge className="bg-neutral-light text-neutral-dark">In {diffDays} days</Badge>;
    }
  };

  const getReminderIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'medication':
        return <span className="material-icons">medication</span>;
      case 'appointment':
        return <span className="material-icons">event</span>;
      case 'measurement':
        return <span className="material-icons">monitor_heart</span>;
      default:
        return <span className="material-icons">notifications</span>;
    }
  };

  return (
    <PageContainer>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold font-heading">My Reminders</h1>
          <Button onClick={() => setIsNewReminderOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> New Reminder
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>All Reminders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="relative w-full md:w-96">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search reminders..."
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
                        <Skeleton className="h-10 w-10 rounded-full" />
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
                        <TableHead>Title</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Recurring</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reminders && reminders.length > 0 ? (
                        reminders.map((reminder: any) => (
                          <TableRow key={reminder.id}>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <div className="p-2 bg-accent bg-opacity-10 rounded-lg text-accent">
                                  {getReminderIcon(reminder.type)}
                                </div>
                                <div>
                                  {reminder.title}
                                  {reminder.description && (
                                    <p className="text-xs text-muted-foreground">{reminder.description}</p>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {reminder.type.charAt(0).toUpperCase() + reminder.type.slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span>{format(new Date(reminder.dueDate), 'MMM d, yyyy')}</span>
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(reminder.dueDate), 'h:mm a')}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {reminder.recurring ? (
                                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                  {reminder.frequency}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground">No</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {reminder.completed ? (
                                <Badge className="bg-green-500">Completed</Badge>
                              ) : (
                                getUrgencyBadge(reminder.dueDate)
                              )}
                            </TableCell>
                            <TableCell>
                              {!reminder.completed ? (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="flex items-center text-green-600 border-green-600 hover:bg-green-50"
                                  onClick={() => completeReminderMutation.mutate(reminder.id)}
                                  disabled={completeReminderMutation.isPending}
                                >
                                  <CheckCircle2 className="mr-1 h-4 w-4" /> Mark as Done
                                </Button>
                              ) : (
                                <span className="flex items-center text-green-600">
                                  <Check className="mr-1 h-4 w-4" /> Completed
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-6">
                            No reminders found
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

      {/* New Reminder Dialog */}
      <Dialog open={isNewReminderOpen} onOpenChange={setIsNewReminderOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Reminder</DialogTitle>
            <DialogDescription>
              Set up a reminder for your health activities.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="reminder-title">Reminder Title</Label>
              <Input
                id="reminder-title"
                placeholder="e.g. Take blood pressure medication"
                value={reminderTitle}
                onChange={(e) => setReminderTitle(e.target.value)}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="reminder-type">Reminder Type</Label>
              <Select
                value={reminderType}
                onValueChange={setReminderType}
              >
                <SelectTrigger id="reminder-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="medication">Medication</SelectItem>
                  <SelectItem value="appointment">Appointment</SelectItem>
                  <SelectItem value="measurement">Health Measurement</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="reminder-description">Description (Optional)</Label>
              <Textarea
                id="reminder-description"
                placeholder="Add more details about this reminder"
                value={reminderDescription}
                onChange={(e) => setReminderDescription(e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "justify-start text-left font-normal",
                        !reminderDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {reminderDate ? format(reminderDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={reminderDate}
                      onSelect={setReminderDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="reminder-time">Time</Label>
                <Select
                  value={reminderTime}
                  onValueChange={setReminderTime}
                >
                  <SelectTrigger id="reminder-time">
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({length: 24}, (_, hour) => {
                      return [
                        <SelectItem key={`${hour}:00`} value={`${hour}:00`}>
                          {`${hour === 0 ? 12 : hour > 12 ? hour - 12 : hour}:00 ${hour >= 12 ? 'PM' : 'AM'}`}
                        </SelectItem>,
                        <SelectItem key={`${hour}:30`} value={`${hour}:30`}>
                          {`${hour === 0 ? 12 : hour > 12 ? hour - 12 : hour}:30 ${hour >= 12 ? 'PM' : 'AM'}`}
                        </SelectItem>
                      ];
                    }).flat()}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="recurring" 
                checked={isRecurring} 
                onCheckedChange={(checked) => setIsRecurring(checked === true)}
              />
              <Label htmlFor="recurring">Recurring Reminder</Label>
            </div>
            
            {isRecurring && (
              <div className="grid gap-2">
                <Label htmlFor="frequency">Frequency</Label>
                <Select
                  value={frequency}
                  onValueChange={setFrequency}
                >
                  <SelectTrigger id="frequency">
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="biweekly">Bi-Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {reminderType === "medication" && (
              <div className="bg-blue-50 p-3 rounded-md flex items-start">
                <AlertCircle className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
                <p className="text-sm text-blue-700">
                  Medication reminders will help you remember to take your prescribed medications on time.
                </p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsNewReminderOpen(false)}
              disabled={createReminderMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateReminder}
              disabled={createReminderMutation.isPending}
            >
              {createReminderMutation.isPending ? (
                "Creating..."
              ) : (
                <>
                  <Bell className="mr-2 h-4 w-4" />
                  Create Reminder
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ChatWidget role="patient" />
    </PageContainer>
  );
}
