import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatTime } from "@/lib/utils";

interface Doctor {
  id: number;
  firstName: string;
  lastName: string;
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
  const [_, navigate] = useLocation();

  const getStatusBadge = (status: string, daysUntil?: number) => {
    if (daysUntil !== undefined) {
      if (daysUntil <= 1) {
        return <Badge className="bg-red-100 text-red-800">Today</Badge>;
      } else if (daysUntil <= 3) {
        return <Badge className="bg-yellow-100 text-yellow-800">In {daysUntil} days</Badge>;
      } else {
        return <Badge className="bg-neutral-light text-neutral-dark">In {daysUntil} days</Badge>;
      }
    }
    
    return <Badge variant="outline">{status}</Badge>;
  };

  const getDaysUntil = (dateString: string): number => {
    const appointmentDate = new Date(dateString);
    const today = new Date();
    
    // Reset time part for accurate day comparison
    appointmentDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    
    // Calculate the difference in days
    const diffTime = appointmentDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle>Upcoming Appointments</CardTitle>
          <Button size="sm" onClick={() => navigate("/patient/appointments")}>
            <span className="material-icons text-sm mr-1">add</span> New
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {appointments.length > 0 ? (
            appointments.map((appointment) => {
              const daysUntil = getDaysUntil(appointment.date);
              
              return (
                <div 
                  key={appointment.id} 
                  className="flex p-3 border border-neutral-light rounded-lg hover:bg-neutral-lightest"
                >
                  <div className="p-2 bg-primary-light bg-opacity-10 rounded-lg text-primary flex-shrink-0 mr-3">
                    <span className="material-icons">calendar_today</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <p className="font-medium">
                        Dr. {appointment.doctor.lastName} - {appointment.title}
                      </p>
                      {getStatusBadge(appointment.status, daysUntil)}
                    </div>
                    <p className="text-sm text-neutral-dark">
                      {formatDate(appointment.date)} - {formatTime(appointment.date)}
                    </p>
                    <div className="mt-2 flex space-x-2">
                      <Button variant="outline" size="sm">Reschedule</Button>
                      <Button variant="outline" size="sm">Cancel</Button>
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
