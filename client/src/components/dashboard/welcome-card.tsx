import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { CalendarDays, MessageSquare } from "lucide-react";
import { navigate } from "wouter/use-browser-location";

interface WelcomeCardProps {
  role: "doctor" | "patient";
  name: string;
  stats: {
    appointments?: number;
    reports?: number;
    nextAppointment?: string | Date | null;
    doctor?: string | null;
  };
  imgUrl: string;
}

export function WelcomeCard({ role, name, stats, imgUrl }: WelcomeCardProps) {
  return (
    <Card className="mb-6">
      <CardContent className="p-0">
        <div
          className="bg-cover bg-center h-48 rounded-t-lg"
          style={{ backgroundImage: `url('${imgUrl}')` }}
        />
        <div className="p-6">
          <h2 className="text-2xl font-heading font-semibold mb-2">
            Welcome back, {role === "doctor" ? `Dr. ${name}` : name}
          </h2>

          {role === "doctor" && (
            <p className="text-neutral-dark mb-4">
              You have{" "}
              <span className="font-semibold text-primary">
                {stats.appointments || 0} appointments
              </span>{" "}
              today and{" "}
              <span className="font-semibold text-primary">
                {stats.reports || 0} pending reports
              </span>{" "}
              to review.
            </p>
          )}

          {role === "patient" && stats.nextAppointment && (
            <p className="text-neutral-dark mb-4">
              Your next appointment is on{" "}
              <span className="font-semibold text-primary">
                {formatDate(stats.nextAppointment)}
              </span>
              {stats.doctor && (
                <>
                  {" "}
                  with{" "}
                  <span className="font-semibold text-primary">
                    {stats.doctor}
                  </span>
                </>
              )}
              .
            </p>
          )}

          <div className="flex flex-wrap gap-3">
            {role === "doctor" && (
              <>
                <Button>
                  <CalendarDays className="mr-2 h-4 w-4" /> Today's Schedule
                </Button>
                <Button
                  variant="outline"
                  className="border-primary text-primary"
                >
                  <span className="material-icons mr-1 text-sm">
                    assignment
                  </span>{" "}
                  Patient Reports
                </Button>
              </>
            )}

            {role === "patient" && (
              <>
                <Button onClick={() => navigate("/patient/appointments")}>
                  <CalendarDays className="mr-2 h-4 w-4" /> Schedule Appointment
                </Button>
                <Button
                  onClick={() => navigate("/messages")}
                  variant="outline"
                  className="border-primary text-primary"
                >
                  <MessageSquare className="mr-2 h-4 w-4" /> Message Doctor
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
