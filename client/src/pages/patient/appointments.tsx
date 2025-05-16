import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChatWidget } from "@/components/chat/chat-widget";
import {
  CalendarPlus,
  Clock,
  Calendar as CalendarIcon,
  CheckCircle2,
  XCircle,
  Clock3,
  ListFilter,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { toast, useToast } from "@/hooks/use-toast";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/../utils/supabaseClient";

export default function PatientAppointments() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [tab, setTab] = useState("upcoming");
  const [isNewAppointmentOpen, setIsNewAppointmentOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [appointmentTitle, setAppointmentTitle] = useState("");
  const [appointmentDescription, setAppointmentDescription] = useState("");
  const { toast } = useToast();
  const { user } = useAuth(); // Ako koristiš supabase-auth-helpers

  const [filterDoctor, setFilterDoctor] = useState<string>("");
  const [filterHospital, setFilterHospital] = useState<string>("all-hospitals");

  const { data: appointments, isLoading: isAppointmentsLoading } = useQuery({
    queryKey: [
      "appointments",
      tab,
      date ? format(date, "yyyy-MM-dd") : null,
      filterDoctor,
      filterHospital,
    ],
    queryFn: async () => {
      const selectedDate = format(date!, "yyyy-MM-dd");

      let query = supabase
        .from("appointments")
        .select(
          `*,
         doctor:doctor_id(first_name, last_name),
         hospital:hospital_id(name)`
        )
        .eq("patient_id", user?.id)
        .gte("date", `${selectedDate}T00:00:00`)
        .lt("date", `${selectedDate}T23:59:59`);

      if (tab === "upcoming")
        query = query.in("status", ["pending", "approved"]);
      if (tab === "completed") query = query.eq("status", "completed");
      if (tab === "cancelled") query = query.eq("status", "cancelled");

      if (filterDoctor) query = query.eq("doctor_id", filterDoctor);
      // if (filterHospital) query = query.eq("hospital_id", filterHospital);
      if (filterHospital && filterHospital !== "all-hospitals") {
        query = query.eq("hospital_id", filterHospital);
      }

      const { data, error } = await query;

      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!user?.id && !!date,
  });

  const { data: doctors, isLoading: isDoctorsLoading } = useQuery({
    queryKey: ["doctors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("users")
        .select("id, first_name, last_name, specialty, hospital_id")
        .eq("role", "doctor");

      if (error) throw new Error(error.message);
      return data;
    },
  });

  const { data: hospitals } = useQuery({
    queryKey: ["hospitals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hospitals")
        .select("id, name, type");

      if (error) throw new Error(error.message);
      return data;
    },
  });

  const handleCreateAppointment = async () => {
    let doctorIdToUse = selectedDoctor;

    if (!selectedHospitalId || !appointmentTime || !date || !appointmentTitle) {
      toast({
        title: "Incomplete form",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    // Ako je privatna bolnica, doktor mora biti ručno izabran
    if (selectedHospitalType === "private" && !selectedDoctor) {
      toast({
        title: "Incomplete form",
        description: "Please select a doctor for private hospitals.",
        variant: "destructive",
      });
      return;
    }

    // Ako je državna bolnica, automatski izaberi jednog doktora
    if (selectedHospitalType === "public") {
      const { data: stateDoctors, error } = await supabase
        .from("hospital_doctors")
        .select("doctor_id")
        .eq("hospital_id", selectedHospitalId)
        .limit(1);

      if (error || !stateDoctors?.length) {
        toast({
          title: "Error",
          description: "No doctors available in selected state hospital.",
          variant: "destructive",
        });
        return;
      }

      doctorIdToUse = stateDoctors[0].doctor_id;
    }

    const appointmentDate = new Date(date);
    const [hours, minutes] = appointmentTime.split(":").map(Number);
    appointmentDate.setHours(hours, minutes, 0, 0);

    console.log(user?.id);
    console.log(doctorIdToUse);
    console.log(typeof doctorIdToUse);
    const { error } = await supabase.from("appointments").insert([
      {
        doctor_id: doctorIdToUse,
        patient_id: user?.id,
        hospital_id: parseInt(selectedHospitalId),
        date: appointmentDate.toISOString(),
        title: appointmentTitle,
        description: appointmentDescription,
        duration: 30,
        type: "In-person",
        created_by: parseInt(selectedHospitalId),
        status: "pending",
      },
    ]);

    if (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to schedule appointment",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Appointment scheduled",
      description: "Your appointment has been successfully scheduled.",
    });

    setIsNewAppointmentOpen(false);
    setSelectedDoctor("");
    setAppointmentTime("");
    setAppointmentTitle("");
    setAppointmentDescription("");

    // Refresh appointments
    queryClient.invalidateQueries({ queryKey: ["appointments"] });
  };

  const [selectedHospitalId, setSelectedHospitalId] = useState<string>("");
  const [symptoms, setSymptoms] = useState("");
  const [predictedDisease, setPredictedDisease] = useState<string | null>(null);
  const [isLoadingDiagnosis, setIsLoadingDiagnosis] = useState(false);
  const [selectedHospitalType, setSelectedHospitalType] = useState<string>("");

  const [hospitalDoctors, setHospitalDoctors] = useState([]);

  useEffect(() => {
    const fetchHospitalDoctors = async () => {
      if (selectedHospitalId && selectedHospitalType === "private") {
        const { data, error } = await supabase
          .from("hospital_doctors")
          .select(
            "doctor_id, doctor:doctor_id(id, first_name, last_name, specialty)"
          )
          .eq("hospital_id", selectedHospitalId);

        if (!error && data) {
          setHospitalDoctors(data.map((entry) => entry.doctor));
        }
      }
    };

    fetchHospitalDoctors();
  }, [selectedHospitalId, selectedHospitalType]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "scheduled":
        return <Badge className="bg-blue-500">Scheduled</Badge>;
      case "completed":
        return <Badge className="bg-green-500">Completed</Badge>;
      case "cancelled":
        return (
          <Badge variant="outline" className="text-red-500 border-red-500">
            Cancelled
          </Badge>
        );
      case "no-show":
        return (
          <Badge variant="outline" className="text-amber-500 border-amber-500">
            No Show
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "scheduled":
        return <Clock3 className="h-5 w-5 text-blue-500" />;
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "cancelled":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "no-show":
        return <XCircle className="h-5 w-5 text-amber-500" />;
      default:
        return <Clock3 className="h-5 w-5" />;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold font-heading">My Appointments</h1>
          <Button onClick={() => setIsNewAppointmentOpen(true)}>
            <CalendarPlus className="mr-2 h-4 w-4" /> Schedule Appointment
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle>Appointment Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-4 mb-4">
                  {/* <Select value={filterDoctor} onValueChange={setFilterDoctor}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by doctor" />
                    </SelectTrigger>
                    <SelectContent>
                      {doctors?.map((d: any) => (
                        <SelectItem key={d.id} value={d.id.toString()}>
                          Dr. {d.first_name} {d.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select> */}

                  <Select
                    value={filterHospital}
                    onValueChange={setFilterHospital}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by hospital" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all-hospitals">
                        All Hospitals
                      </SelectItem>
                      {hospitals?.map((h: any) => (
                        <SelectItem key={h.id} value={h.id.toString()}>
                          {h.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-semibold">
                      {date ? format(date, "MMMM d, yyyy") : "Select a date"}
                    </h3>
                  </div>

                  {isAppointmentsLoading ? (
                    <div className="space-y-4">
                      {Array(3)
                        .fill(0)
                        .map((_, i) => (
                          <div
                            key={i}
                            className="flex items-start p-4 border rounded-lg"
                          >
                            <Skeleton className="h-10 w-10 rounded-full mr-4" />
                            <div className="space-y-2 flex-1">
                              <Skeleton className="h-4 w-[200px]" />
                              <Skeleton className="h-4 w-[150px]" />
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {appointments && appointments.length > 0 ? (
                        appointments.map((appointment: any) => (
                          <div
                            key={appointment.id}
                            className="flex p-3 border border-neutral-200 rounded-lg hover:bg-neutral-50"
                          >
                            <div className="mr-3">
                              {getStatusIcon(appointment.status)}
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between">
                                <p className="font-medium">
                                  {format(new Date(appointment.date), "h:mm a")}{" "}
                                  -{" "}
                                  {format(
                                    new Date(
                                      new Date(appointment.date).getTime() +
                                        appointment.duration * 60000
                                    ),
                                    "h:mm a"
                                  )}
                                </p>
                                {/* {getStatusBadge(appointment.status)} */}
                              </div>
                              <p className="text-sm text-neutral-600">
                                Dr. {appointment.doctor.firstName}{" "}
                                {appointment.doctor.lastName} -{" "}
                                {appointment.title}
                              </p>
                              {appointment.description && (
                                <p className="text-xs text-neutral-500 mt-1">
                                  {appointment.description}
                                </p>
                              )}
                              {appointment.status === "scheduled" && (
                                <div className="flex space-x-2 mt-2">
                                  <Button variant="outline" size="sm">
                                    Reschedule
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-red-500 border-red-500 hover:bg-red-50"
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-neutral-500">
                          No appointments{" "}
                          {tab === "upcoming" ? "scheduled" : tab} for this date
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Calendar</CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md border"
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Schedule Appointment Dialog */}
      <Dialog
        open={isNewAppointmentOpen}
        onOpenChange={setIsNewAppointmentOpen}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Schedule New Appointment</DialogTitle>
            <DialogDescription>
              Book an appointment with your healthcare provider.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              {/* <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                <SelectTrigger id="doctor">
                  <SelectValue placeholder="Choose a doctor" />
                </SelectTrigger>
                <SelectContent>
                  {doctors &&
                    doctors.map((doctor: any) => (
                      <SelectItem key={doctor.id} value={doctor.id.toString()}>
                        Dr. {doctor.firstName} {doctor.lastName}
                        {doctor.specialty ? ` - ${doctor.specialty}` : ""}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select> */}

              <div className="grid gap-2">
                <Label htmlFor="hospital">Select Hospital</Label>
                <Select
                  value={selectedHospitalId}
                  onValueChange={(hospitalId) => {
                    setSelectedHospitalId(hospitalId);
                    const hospital = hospitals?.find(
                      (h: any) => h.id.toString() === hospitalId
                    );
                    setSelectedHospitalType(hospital?.type ?? ""); // assumes type is "private" or "state"
                  }}
                >
                  <SelectTrigger id="hospital">
                    <SelectValue placeholder="Choose a hospital" />
                  </SelectTrigger>
                  <SelectContent>
                    {hospitals?.map((hospital: any) => (
                      <SelectItem
                        key={hospital.id}
                        value={hospital.id.toString()}
                      >
                        {hospital.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedHospitalType === "private" && (
                <>
                  {" "}
                  <div className="grid gap-2">
                    <Label htmlFor="symptoms">Enter your symptoms</Label>
                    <Textarea
                      id="symptoms"
                      placeholder="e.g. headache, sore throat, fatigue..."
                      value={symptoms}
                      onChange={(e) => setSymptoms(e.target.value)}
                    />
                  </div>
                  <Button
                    onClick={async () => {
                      if (!symptoms) return;
                      setIsLoadingDiagnosis(true);
                      setPredictedDisease(null);
                      try {
                        const response = await fetch(
                          "https://api.cropview.aquilla.dev/plant/detect",
                          {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ symptoms }),
                          }
                        );
                        const result = await response.json();
                        setPredictedDisease(result?.disease || "Unknown issue");
                      } catch (err) {
                        setPredictedDisease("Error fetching diagnosis.");
                      }
                      setIsLoadingDiagnosis(false);
                    }}
                    disabled={!symptoms || isLoadingDiagnosis}
                  >
                    {isLoadingDiagnosis
                      ? "Analyzing..."
                      : "Check Potential Disease"}
                  </Button>
                  {predictedDisease && (
                    <div className="bg-muted p-3 rounded-md mt-2 space-y-2">
                      <p className="text-sm">
                        🧠 <strong>Possible Condition:</strong>{" "}
                        {predictedDisease}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsNewAppointmentOpen(false);
                            router.push(`/triage`);
                          }}
                        >
                          Go to Triage
                        </Button>
                        <Button
                          onClick={() => {
                            // Scroll to doctor selection
                            document
                              .getElementById("doctor")
                              ?.scrollIntoView({ behavior: "smooth" });
                          }}
                        >
                          Book with General Practitioner
                        </Button>
                      </div>
                    </div>
                  )}
                  <div className="grid gap-2">
                    {/* <Label htmlFor="doctor">Select Doctor</Label> */}

                    <Label htmlFor="doctor">Select Doctor</Label>
                    <Select
                      value={selectedDoctor}
                      onValueChange={setSelectedDoctor}
                    >
                      <SelectTrigger id="doctor">
                        <SelectValue placeholder="Choose a doctor" />
                      </SelectTrigger>
                      <SelectContent>
                        {hospitalDoctors.map((doctor: any) => (
                          <SelectItem
                            key={doctor.id}
                            value={doctor.id.toString()}
                          >
                            Dr. {doctor.first_name} {doctor.last_name}
                            {doctor.specialty ? ` - ${doctor.specialty}` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {predictedDisease && (
                    <div className="bg-muted p-3 rounded-md mt-2 space-y-2">
                      <p className="text-sm">
                        🧠 <strong>Possible Condition:</strong>{" "}
                        {predictedDisease}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsNewAppointmentOpen(false);
                            router.push(`/triage`);
                          }}
                        >
                          Go to Triage
                        </Button>
                        <Button
                          onClick={() => {
                            // Scroll to doctor selection
                            document
                              .getElementById("doctor")
                              ?.scrollIntoView({ behavior: "smooth" });
                          }}
                        >
                          Book with General Practitioner
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {selectedHospitalId && (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="title">Reason for Visit</Label>
                  <Input
                    id="title"
                    placeholder="e.g. Annual check-up"
                    value={appointmentTitle}
                    onChange={(e) => setAppointmentTitle(e.target.value)}
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
                            !date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {date ? (
                            format(date, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={date}
                          onSelect={setDate}
                          initialFocus
                          disabled={(date) => {
                            // Disable dates in the past and weekends (example)
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            return date < today;
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="time">Time</Label>
                    <Select
                      value={appointmentTime}
                      onValueChange={setAppointmentTime}
                    >
                      <SelectTrigger id="time">
                        <SelectValue placeholder="Select time" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 12 }, (_, i) => i + 8).map(
                          (hour) => (
                            <>
                              <SelectItem
                                key={`${hour}:00`}
                                value={`${hour}:00`}
                              >
                                {`${hour > 12 ? hour - 12 : hour}:00 ${
                                  hour >= 12 ? "PM" : "AM"
                                }`}
                              </SelectItem>
                              <SelectItem
                                key={`${hour}:30`}
                                value={`${hour}:30`}
                              >
                                {`${hour > 12 ? hour - 12 : hour}:30 ${
                                  hour >= 12 ? "PM" : "AM"
                                }`}
                              </SelectItem>
                            </>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="notes">Additional Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Any additional information about your visit"
                    value={appointmentDescription}
                    onChange={(e) => setAppointmentDescription(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsNewAppointmentOpen(false)}
              // disabled={createAppointmentMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              onClick={handleCreateAppointment}
              // disabled={createAppointmentMutation.isPending}
            >
              {false ? (
                <>Scheduling...</>
              ) : (
                <>
                  <Clock className="mr-2 h-4 w-4" />
                  Schedule Appointment
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ChatWidget role="patient" />
    </DashboardLayout>
  );
}
