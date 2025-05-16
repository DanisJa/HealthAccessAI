import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatTime } from "@/lib/utils";
import { useHospital } from "@/hooks/use-hospital";

interface Doctor {
  id: number;
  first_name: string;
  last_name: string;
  specialty?: string;
}

interface Appointment {
  id: number;
  doctor: Doctor;
  date: string;
  duration: number;
  title: string;
  description?: string;
  status: string;
}

interface AppointmentListProps {
  appointments: Appointment[];
}

export function AppointmentList({ appointments }: AppointmentListProps) {
  const [, navigate] = useLocation();
  const { selectedHospital } = useHospital();

  const getDaysUntil = (dateString: string): number => {
    const appt = new Date(dateString);
    const today = new Date();
    appt.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return Math.ceil(
      (appt.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
  };

  const getStatusBadge = (status: string, daysUntil?: number) => {
    if (daysUntil !== undefined) {
      if (daysUntil <= 0)
        return <Badge className="bg-red-100 text-red-800">Today</Badge>;
      if (daysUntil <= 3)
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            In {daysUntil} days
          </Badge>
        );
      return (
        <Badge className="bg-neutral-light text-neutral-dark">
          In {daysUntil} days
        </Badge>
      );
    }
    return <Badge variant="outline">{status}</Badge>;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Upcoming Appointments</CardTitle>
            {selectedHospital && (
              <p className="text-xs text-muted-foreground">
                Filtered by {selectedHospital.name}
              </p>
            )}
          </div>
          <Button size="sm" onClick={() => navigate("/patient/appointments")}>
            <span className="material-icons text-sm mr-1">add</span> New
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {appointments.length > 0 ? (
            appointments.map((a) => {
              const daysUntil = getDaysUntil(a.date);
              return (
                <div
                  key={a.id}
                  className="flex p-3 border border-neutral-light rounded-lg hover:bg-neutral-lightest"
                >
                  <div className="p-2 bg-primary-light bg-opacity-10 rounded-lg text-primary flex-shrink-0 mr-3">
                    <span className="material-icons">calendar_today</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <p className="font-medium">
                        Dr. {a.doctor.last_name} — {a.title}
                      </p>
                      {getStatusBadge(a.status, daysUntil)}
                    </div>
                    <p className="text-sm text-neutral-dark">
                      {formatDate(a.date)} — {formatTime(a.date)}
                    </p>
                    <div className="mt-2 flex space-x-2">
                      <Button variant="outline" className="invisible" size="sm">
                        Reschedule
                      </Button>
                      <Button variant="outline" className="invisible" size="sm">
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-4 text-neutral-500">
              No upcoming appointments scheduled
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
