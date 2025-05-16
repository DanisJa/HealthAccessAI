import { useLocation } from "wouter";
import { formatTime } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Appointment {
  id: number;
  patientId: number;
  patient: {
    firstName: string;
    lastName: string;
  };
  date: string;
  time?: string;
  duration: number;
  title: string;
  type?: string;
  status: string;
}

interface AppointmentListProps {
  appointments: Appointment[];
}

export function AppointmentList({ appointments }: AppointmentListProps) {
  const [_, navigate] = useLocation();

  const getAppointmentTime = (appointment: Appointment) => {
    if (appointment.time) return appointment.time;

    const date = new Date(appointment.date);
    const endTime = new Date(date.getTime() + appointment.duration * 60000);

    return `${formatTime(date)} - ${formatTime(endTime)}`;
  };

  const getAppointmentTypeBadge = (type: string = "Check-up") => {
    let className = "bg-primary bg-opacity-10 text-white";

    if (type === "New Patient") {
      className = "bg-secondary bg-opacity-10 text-secondary";
    } else if (type === "Urgent") {
      className = "bg-accent bg-opacity-10 text-accent";
    }

    return (
      <Badge className={`${className} text-xs px-2 py-1 rounded-full`}>
        {type}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle>Today's Appointments</CardTitle>
          <Button
            variant="link"
            size="sm"
            onClick={() => navigate("/doctor/appointments")}
          >
            View schedule
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {appointments.length > 0 ? (
            appointments.map((appointment) => (
              <div
                key={appointment.id}
                className="flex p-3 border border-neutral-light rounded-lg hover:bg-neutral-lightest"
              >
                <span className="material-icons text-primary mr-3">
                  schedule
                </span>
                <div className="flex-1">
                  <div className="flex justify-between">
                    <p className="font-medium">
                      {getAppointmentTime(appointment)}
                    </p>
                    {getAppointmentTypeBadge(appointment.type)}
                  </div>
                  <p className="text-sm text-neutral-dark">
                    {appointment.patient.first_name}{" "}
                    {appointment.patient.last_name} - {appointment.title}
                    {console.log("aaa" + appointment)}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-neutral-500">
              No appointments scheduled for today
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
