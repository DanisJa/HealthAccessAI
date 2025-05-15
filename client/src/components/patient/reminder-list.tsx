import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatTime } from "@/lib/utils";
import { CheckCircle, Clock } from "lucide-react";
import { useHospital } from "@/hooks/use-hospital";

interface Reminder {
  id: number;
  type: string;
  title: string;
  description?: string;
  dueDate: string;
  completed: boolean;
  urgency?: 'high' | 'medium' | 'low';
}

interface ReminderListProps {
  reminders: Reminder[];
}

export function ReminderList({ reminders }: ReminderListProps) {
  const [_, navigate] = useLocation();
  const { selectedHospital } = useHospital();

  const getUrgencyBadge = (dueDate: string, urgency?: string) => {
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

  const getReminderIcon = (type?: string) => {
    if (!type) {
      return <span className="material-icons">notifications</span>;
    }
    
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
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle>Reminders</CardTitle>
          <Button size="sm" onClick={() => navigate("/patient/reminders")}>
            <span className="material-icons text-sm mr-1">add</span> New
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {reminders.length > 0 ? (
            reminders.map((reminder) => (
              <div 
                key={reminder.id} 
                className="flex p-3 border border-neutral-light rounded-lg hover:bg-neutral-lightest"
              >
                <div className="p-2 bg-accent bg-opacity-10 rounded-lg text-accent flex-shrink-0 mr-3">
                  {getReminderIcon(reminder.type)}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between">
                    <p className="font-medium">{reminder.title}</p>
                    {getUrgencyBadge(reminder.dueDate, reminder.urgency)}
                  </div>
                  <p className="text-sm text-neutral-dark">
                    {formatTime(reminder.dueDate)}
                    {reminder.description && `, ${reminder.description}`}
                  </p>
                  
                  {!reminder.completed && (
                    <div className="mt-2">
                      <Button size="sm" variant="outline" className="text-green-600 border-green-600">
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
