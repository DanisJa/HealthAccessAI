import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { CalendarClock } from "lucide-react";
import { useHospital } from "@/hooks/use-hospital";

interface Medication {
  id: number;
  medication: string;
  dosage: string;
  frequency: string;
  start_date: string;
  end_date?: string;
  status: string;
  refill_due?: number;
}

interface MedicationListProps {
  medications: Medication[];
}

export function MedicationList({ medications }: MedicationListProps) {
  const { selectedHospital } = useHospital();

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Current Medications</CardTitle>
            {selectedHospital && (
              <p className="text-xs text-muted-foreground">
                Filtered by {selectedHospital.name}
              </p>
            )}
          </div>
          <Button
            variant="link"
            size="sm"
            onClick={() => (window.location.href = "/patient/medications")}
          >
            View history
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {medications.length > 0 ? (
            medications.map((med) => (
              <div
                key={med.id}
                className="flex p-3 border border-neutral-light rounded-lg hover:bg-neutral-lightest"
              >
                <div className="p-2 bg-primary-light bg-opacity-10 rounded-lg text-primary flex-shrink-0 mr-3">
                  <span className="material-icons">medication</span>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between">
                    <div>
                      <p className="font-medium">{med.medication}</p>
                      <p className="text-sm text-neutral-dark">
                        {med.dosage}, {med.frequency}
                      </p>
                    </div>
                    <Badge className="h-fit bg-primary bg-opacity-10 text-primary">
                      {med.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-neutral-dark mt-1">
                    Starts {formatDate(med.start_date)}
                    {med.end_date && ` — Ends ${formatDate(med.end_date)}`}
                  </p>
                  {med.refill_due !== undefined && (
                    <div className="mt-1 flex items-center text-xs text-neutral-dark">
                      <CalendarClock className="text-secondary mr-1 h-4 w-4" />
                      <span>Refill due in {med.refill_due} days</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4 text-neutral-500">
              No active medications
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
