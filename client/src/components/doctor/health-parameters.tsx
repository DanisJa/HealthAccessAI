import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";
import { Heart, ActivitySquare, Droplet, Thermometer } from "lucide-react";

interface Patient {
  id: number;
  firstName: string;
  lastName: string;
}

interface HealthParametersProps {
  patients: Patient[];
  selectedPatientId: number | null;
  onPatientSelect: (id: number) => void;
}

interface Parameter {
  id: number;
  type: string;
  value: string;
  unit: string;
  recordedAt: string;
  trends?: {
    change: "up" | "down" | "stable";
    percent: number;
    text: string;
  };
}

export function HealthParameters({
  patients,
  selectedPatientId,
  onPatientSelect,
}: HealthParametersProps) {
  const [selectedId, setSelectedId] = useState<string>("");

  useEffect(() => {
    if (patients.length > 0 && !selectedPatientId) {
      onPatientSelect(patients[0].id);
      setSelectedId(patients[0].id.toString());
    } else if (selectedPatientId) {
      setSelectedId(selectedPatientId.toString());
    }
  }, [patients, selectedPatientId, onPatientSelect]);

  const { data: parameters, isLoading } = useQuery({
    queryKey: ["/api/doctor/patients/parameters", selectedId],
    queryFn: async () => {
      if (!selectedId) return [];
      try {
        const response = await fetch(
          `/api/doctor/patients/parameters?patientId=${selectedId}`
        );
        if (!response.ok) {
          return [];
        }
        return response.json();
      } catch (error) {
        console.error("Failed to fetch patient parameters:", error);
        return [];
      }
    },
    enabled: !!selectedId,
  });

  const handlePatientChange = (value: string) => {
    setSelectedId(value);
    onPatientSelect(parseInt(value, 10));
  };

  const renderTrendIndicator = (trend?: {
    change: "up" | "down" | "stable";
    percent: number;
    text: string;
  }) => {
    if (!trend) return null;

    let icon = (
      <span className="material-icons text-neutral-medium text-sm mr-1">
        remove
      </span>
    );
    let color = "text-neutral-dark";

    if (trend.change === "up") {
      icon = (
        <span className="material-icons text-red-500 text-sm mr-1">
          arrow_upward
        </span>
      );
      color = "text-red-500";
    } else if (trend.change === "down") {
      icon = (
        <span className="material-icons text-green-500 text-sm mr-1">
          arrow_downward
        </span>
      );
      color = "text-green-500";
    }

    return (
      <div className={`mt-2 text-xs flex items-center ${color}`}>
        {icon}
        <span>{trend.text}</span>
      </div>
    );
  };

  const renderParameterCard = (
    type: string,
    title: string,
    icon: React.ReactNode
  ) => {
    const paramData = parameters?.find(
      (param: Parameter) => param.type === type
    );

    return (
      <div className="p-3 bg-neutral-lightest rounded-lg">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs font-medium text-neutral-dark">{title}</p>
            <h4 className="text-xl font-semibold">
              {isLoading ? (
                "Loading..."
              ) : paramData ? (
                <>
                  {paramData.value}{" "}
                  <span className="text-sm text-neutral-dark">
                    {paramData.unit}
                  </span>
                </>
              ) : (
                "No data"
              )}
            </h4>
          </div>
          <div className="text-primary">{icon}</div>
        </div>
        {paramData && renderTrendIndicator(paramData.trends)}
      </div>
    );
  };

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle>Patient Health Monitoring</CardTitle>
          <div className="flex items-center">
            <Label
              htmlFor="patient-select"
              className="mr-2 text-sm font-medium text-neutral-dark"
            >
              Patient:
            </Label>
            <Select value={selectedId} onValueChange={handlePatientChange}>
              <SelectTrigger id="patient-select" className="w-[180px]">
                <SelectValue placeholder="Select patient" />
              </SelectTrigger>
              <SelectContent>
                {patients.map((patient) => (
                  <SelectItem key={patient.id} value={patient.id.toString()}>
                    {patient.firstName} {patient.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          {renderParameterCard(
            "blood_pressure",
            "Blood Pressure",
            <Heart className="h-5 w-5" />
          )}
          {renderParameterCard(
            "heart_rate",
            "Heart Rate",
            <ActivitySquare className="h-5 w-5" />
          )}
          {renderParameterCard(
            "blood_glucose",
            "Blood Glucose",
            <Droplet className="h-5 w-5" />
          )}
          {renderParameterCard(
            "temperature",
            "Body Temperature",
            <Thermometer className="h-5 w-5" />
          )}
        </div>

        <div className="bg-neutral-lightest rounded-lg p-4 h-64 flex flex-col items-center justify-center">
          <img
            src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&h=300&q=80"
            alt="Health parameter visualization chart"
            className="max-h-full rounded"
          />
        </div>
      </CardContent>
    </Card>
  );
}
