import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
  priority: boolean;
  avatarUrl?: string;
}

const mockPatients: Patient[] = [
  {
    id: "1",
    firstName: "Alice",
    lastName: "Smith",
    age: 30,
    priority: false,
  },
  {
    id: "2",
    firstName: "Bob",
    lastName: "Johnson",
    age: 42,
    priority: true,
  },
  {
    id: "3",
    firstName: "Charlie",
    lastName: "Brown",
    age: 25,
    priority: false,
  },
];

export function PatientList() {
  const [queue, setQueue] = useState<Patient[]>(
    [...mockPatients].sort((a, b) => Number(b.priority) - Number(a.priority))
  );

  const handleNext = () => {
    setQueue((prev) => prev.slice(1));
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle>Patient Queue</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNext}
            disabled={queue.length === 0}
          >
            Next
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {queue.length === 0 ? (
          <div className="text-center text-neutral-500 py-4">
            Queue is empty
          </div>
        ) : (
          <ul className="space-y-4">
            {queue.map((patient) => (
              <li
                key={patient.id}
                className="flex items-center justify-between border p-3 rounded-md"
              >
                <div className="flex items-center">
                  <Avatar className="h-8 w-8 mr-3">
                    <AvatarImage src={patient.avatarUrl} />
                    <AvatarFallback>
                      {getInitials(patient.firstName, patient.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">
                      {patient.firstName} {patient.lastName}
                    </div>
                    <div className="text-xs text-neutral-dark">
                      {patient.age} years old
                    </div>
                  </div>
                </div>
                {patient.priority && (
                  <Badge className="bg-red-100 text-red-600">Priority</Badge>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
