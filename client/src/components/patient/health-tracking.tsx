import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useHospital } from "@/hooks/use-hospital";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/../utils/supabaseClient";
import { useAuth } from "@/hooks/use-auth";
import { navigate } from "wouter/use-browser-location";
type ParameterType = "blood_pressure" | "weight" | "blood_glucose";

interface Parameter {
  id: number;
  type: string;
  value: string;
  unit: string;
  recordedAt: string;
}

export function HealthTracking() {
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [parameterType, setParameterType] =
    useState<ParameterType>("blood_pressure");
  const [parameterValue, setParameterValue] = useState("");
  const [parameterUnit, setParameterUnit] = useState("mmHg");

  const { toast } = useToast();
  const { selectedHospital } = useHospital();

  const { data: parameters, isLoading } = useQuery<Parameter[]>({
    queryKey: ["parameters", user?.id, selectedHospital?.id],
    enabled: !!user,
    queryFn: async () => {
      // if no user yet, return empty
      if (!user) return [];

      // build the base query
      let builder = supabase
        .from("parameters")
        .select("id, type, value, unit, recorded_at")
        .eq("patient_id", user.id)
        .order("recorded_at", { ascending: false });

      // optionally filter by hospital
      if (selectedHospital?.id) {
        builder = builder.eq("hospital_id", selectedHospital.id);
      }

      const { data, error } = await builder;
      if (error) throw error;

      // map snake_case → camelCase
      return data.map((p) => ({
        id: p.id,
        type: p.type,
        value: p.value,
        unit: p.unit,
        recordedAt: p.recorded_at,
      }));
    },
  });

  const getUnitForType = (type: ParameterType) => {
    switch (type) {
      case "blood_pressure":
        return "mmHg";
      case "weight":
        return "kg";
      case "blood_glucose":
        return "mg/dL";
      default:
        return "mmHg";
    }
  };

  const handleParameterTypeChange = (type: ParameterType) => {
    setParameterType(type);
    setParameterUnit(getUnitForType(type));
  };

  const handleAddParameter = () => {
    if (!parameterValue.trim()) {
      toast({
        title: "Invalid input",
        description: "Please enter a value for the parameter.",
        variant: "destructive",
      });
      return;
    }

    addParameterMutation.mutate({
      type: parameterType,
      value: parameterValue,
      unit: parameterUnit,
    });
  };

  const getLatestParameter = (type: string): Parameter | undefined => {
    if (!parameters) return undefined;
    return parameters.find((param: Parameter) => param.type === type);
  };

  const getStatusText = (type: string, value: string) => {
    // This is a simplified approach - real implementation would include actual medical evaluation
    switch (type) {
      case "blood_pressure":
        return "Normal range";
      case "weight":
        return "Slightly above target";
      case "blood_glucose":
        return "Normal range";
      case "heart_rate":
        return "Slightly above target";
      case "temperature":
        return "Slightly above target";
      default:
        return "Recorded";
    }
  };

  const renderParameterCard = (type: string, title: string) => {
    const param = getLatestParameter(type);

    return (
      <div className="bg-neutral-lightest p-3 rounded-lg">
        <div className="flex justify-between items-center mb-1">
          <h4 className="font-medium text-neutral-darkest">{title}</h4>
          <span className="text-xs text-neutral-dark">
            {param
              ? `Last updated: ${new Date(
                  param.recordedAt
                ).toLocaleDateString()}`
              : "Not recorded"}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div className="text-2xl font-semibold">
            {param ? (
              <>
                {param.value}{" "}
                <span className="text-sm text-neutral-dark">{param.unit}</span>
              </>
            ) : (
              "No data"
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-primary invisible"
            onClick={() => {
              setParameterType(type as ParameterType);
              setParameterUnit(getUnitForType(type as ParameterType));
              setIsDialogOpen(true);
            }}
          >
            <PlusCircle className="h-5 w-5" />
          </Button>
        </div>
        {param && (
          <>
            <div className="w-full bg-neutral-light rounded-full h-1.5 mt-2">
              <div
                className="bg-green-500 h-1.5 rounded-full"
                style={{ width: "70%" }}
              ></div>
            </div>
            <div className="text-xs text-neutral-dark mt-1">
              {getStatusText(param.type, param.value)}
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle>My Health Parameters</CardTitle>
          <Button size="sm" onClick={() => navigate("/patient/health")}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add New
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {renderParameterCard("blood_pressure", "Blood Pressure")}
          {renderParameterCard("weight", "Weight")}
          {renderParameterCard("blood_glucose", "Blood Glucose")}
          {renderParameterCard("heart_rate", "Heart Rate")}
          {renderParameterCard("temperature", "Temperature")}
        </div>
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Health Parameter</DialogTitle>
            <DialogDescription>
              Record your latest health measurement to track your progress.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddParameter}></Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
