import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatTime } from "@/lib/utils";
import { CheckCircle } from "lucide-react";
import { useHospital } from "@/hooks/use-hospital";

interface Reminder {
  id: number;
  type: string;
  title: string;
  description?: string;
  due_date: string;
  completed: boolean;
  urgency?: "high" | "medium" | "low";
}

interface ReminderListProps {
  reminders: Reminder[];
}

export function ReminderList({ reminders }: ReminderListProps) {
  const [, navigate] = useLocation();
  const { selectedHospital } = useHospital();

  const getUrgencyBadge = (due: string) => {
    const today = new Date();
    const d = new Date(due);
    today.setHours(0, 0, 0, 0);
    d.setHours(0, 0, 0, 0);
    const diff = Math.ceil(
      (d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diff < 0)
      return <Badge className="bg-red-100 text-red-800">Overdue</Badge>;
    if (diff === 0)
      return <Badge className="bg-red-100 text-red-800">Today</Badge>;
    if (diff === 1)
      return <Badge className="bg-yellow-100 text-yellow-800">Tomorrow</Badge>;
    if (diff <= 3)
      return (
        <Badge className="bg-yellow-100 text-yellow-800">In {diff} days</Badge>
      );
    return (
      <Badge className="bg-neutral-light text-neutral-dark">
        In {diff} days
      </Badge>
    );
  };

  const getIcon = (type?: string) => {
    switch (type?.toLowerCase()) {
      case "medication":
        return <span className="material-icons">medication</span>;
      case "appointment":
        return <span className="material-icons">event</span>;
      case "measurement":
        return <span className="material-icons">monitor_heart</span>;
      default:
        return <span className="material-icons">notifications</span>;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Reminders</CardTitle>
            {selectedHospital && (
              <p className="text-xs text-muted-foreground">
                Filtered by {selectedHospital.name}
              </p>
            )}
          </div>
          <Button size="sm" onClick={() => navigate("/patient/reminders")}>
            <span className="material-icons text-sm mr-1">add</span> New
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {reminders.length > 0 ? (
            reminders.map((r) => (
              <div
                key={r.id}
                className="flex p-3 border border-neutral-light rounded-lg hover:bg-neutral-lightest"
              >
                <div className="p-2 bg-accent bg-opacity-10 rounded-lg text-accent flex-shrink-0 mr-3">
                  {getIcon(r.type)}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between">
                    <p className="font-medium">{r.title}</p>
                    {getUrgencyBadge(r.due_date)}
                  </div>
                  <p className="text-sm text-neutral-dark">
                    {formatTime(r.due_date)}
                    {r.description && `, ${r.description}`}
                  </p>
                  {!r.completed && (
                    <div className="mt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-green-600 border-green-600"
                      >
                        <CheckCircle className="mr-1 h-4 w-4" /> Mark as Done
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4 text-neutral-500">
              No reminders scheduled
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
