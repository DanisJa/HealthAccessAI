import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Heart,
  ActivitySquare,
  Droplet,
  Thermometer,
  Loader2,
} from "lucide-react";
import { supabase } from "@/../utils/supabaseClient";

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  parameters: Parameter[];
}

interface Parameter {
  id: number;
  type: string;
  value: string;
  unit: string;
  recorded_at: string;
  patient_id: string;
  hospital_id: number;
  trends?: {
    change: "up" | "down" | "stable";
    percent: number;
    text: string;
  };
}

interface HealthParametersProps {
  hospital: {
    id: number;
    [key: string]: any;
  };
}

export function HealthParameters({ hospital }: HealthParametersProps) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!hospital?.id) return;
      setIsLoading(true);

      try {
        // 1) pull all the parameter rows for this hospital, newest first
        const { data: allParams, error: paramsError } = await supabase
          .from<Parameter>("parameters")
          .select(
            `
            id,
            type,
            value,
            unit,
            recorded_at,
            patient_id,
            hospital_id
          `
          )
          .eq("hospital_id", hospital.id)
          .order("recorded_at", { ascending: false });

        if (paramsError) throw paramsError;
        if (!allParams?.length) {
          setPatients([]);
          return;
        }

        // 2) distinct patient IDs in those rows
        const patientIds = Array.from(
          new Set(allParams.map((p) => p.patient_id))
        );
        console.log("found patientIds:", patientIds);

        // 3) fetch whatever profiles exist
        const { data: usersData = [], error: usersError } = await supabase
          .from<Pick<Patient, "id" | "first_name" | "last_name">>("users")
          .select("id, first_name, last_name")
          .in("id", patientIds)
          .eq("role", "patient"); // if this is dropping one, omit or adjust this filter

        if (usersError) throw usersError;
        console.log("fetched user profiles:", usersData);

        // 4) group params by patient_id
        const paramsByPatient = allParams.reduce(
          (map: Map<string, Parameter[]>, p) => {
            const arr = map.get(p.patient_id) || [];
            arr.push(p);
            map.set(p.patient_id, arr);
            return map;
          },
          new Map<string, Parameter[]>()
        );

        // 5) for each patientId, build a Patient object
        const processed: Patient[] = patientIds.map((pid) => {
          const readings = paramsByPatient.get(pid) || [];
          // they’re already newest→oldest, but just in case:
          readings.sort(
            (a, b) =>
              new Date(b.recorded_at).getTime() -
              new Date(a.recorded_at).getTime()
          );

          // pick latest of each type
          const latestByType = readings.reduce<Record<string, Parameter>>(
            (acc, r) => {
              if (!acc[r.type]) acc[r.type] = r;
              return acc;
            },
            {}
          );

          // find the user, if any
          const user = usersData.find((u) => u.id === pid);

          return {
            id: pid,
            first_name: user?.first_name ?? pid.slice(0, 8), // fallback to part of the UUID
            last_name: user?.last_name ?? "",
            parameters: Object.values(latestByType),
          };
        });

        setPatients(processed);
        if (processed.length) setSelectedPatientId(processed[0].id);
      } catch (err) {
        console.error("HealthParameters fetch error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [hospital]);

  const handlePatientChange = (value: string) => {
    setSelectedPatientId(value);
  };

  const renderTrendIndicator = (trend?: {
    change: "up" | "down" | "stable";
    percent: number;
    text: string;
  }) => {
    if (!trend) return null;
    let icon = <span className="text-neutral-medium text-sm mr-1">-</span>;
    let color = "text-neutral-dark";
    if (trend.change === "up") {
      icon = <span className="text-red-500 text-sm mr-1">↑</span>;
      color = "text-red-500";
    } else if (trend.change === "down") {
      icon = <span className="text-green-500 text-sm mr-1">↓</span>;
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
    const patient = patients.find((p) => p.id === selectedPatientId);
    const param = patient?.parameters.find((p) => p.type === type);
    console.log("Patients: " + patients);
    return (
      <div className="p-3 bg-neutral-lightest rounded-lg">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs font-medium text-neutral-dark">{title}</p>
            <h4 className="text-xl font-semibold">
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : param ? (
                <>
                  {param.value}{" "}
                  <span className="text-sm text-neutral-dark">
                    {param.unit}
                  </span>
                </>
              ) : (
                "No data"
              )}
            </h4>
          </div>
          <div className="text-primary">{icon}</div>
        </div>
        {param && renderTrendIndicator(param.trends)}
      </div>
    );
  };

  if (!isLoading && patients.length === 0) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Patient Health Monitoring</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-neutral-dark">
            No patients found for this hospital.
          </p>
        </CardContent>
      </Card>
    );
  }

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
            <Select
              value={selectedPatientId}
              onValueChange={handlePatientChange}
            >
              <SelectTrigger id="patient-select" className="w-[180px]">
                <SelectValue placeholder="Select patient" />
              </SelectTrigger>
              <SelectContent>
                {patients.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.first_name} {p.last_name}
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
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : selectedPatientId &&
            patients.find((p) => p.id === selectedPatientId)?.parameters
              .length ? (
            <img
              src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&h=300&q=80"
              alt="Health parameter visualization chart"
              className="max-h-full rounded"
            />
          ) : (
            <p className="text-neutral-dark">No health data available</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
