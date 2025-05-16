import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChatWidget } from "@/components/chat/chat-widget";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { PlusCircle } from "lucide-react";
import { queryClient } from "@/lib/queryClient"; // keep for mutation invalidation
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";

import { useAuth } from "@/hooks/use-auth"; // ← pull in the user
import { supabase } from "@/../utils/supabaseClient"; // ← your Supabase client
import { useHospital } from "@/hooks/use-hospital";

export default function PatientHealth() {
  const { user } = useAuth(); // ← get logged-in user
  const { hospital } = useHospital();

  const [isNewParameterOpen, setIsNewParameterOpen] = useState(false);
  const [parameterType, setParameterType] = useState("blood_pressure");
  const [parameterValue, setParameterValue] = useState("");
  const [parameterUnit, setParameterUnit] = useState("");
  const [parameterNotes, setParameterNotes] = useState("");
  const [activeTab, setActiveTab] = useState("blood_pressure");

  const { toast } = useToast();

  const {
    data: parameters = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["parameters", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("parameters")
        .select("id, type, value, unit, notes, recorded_at") // or use alias syntax
        .eq("patient_id", user!.id)
        .order("recorded_at", { ascending: true });

      if (error) throw error;
      return data;
    },
    onError: (err) => {
      console.error("Supabase fetch error:", err);
      toast({
        title: "Failed to load parameters",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const addParameterMutation = useMutation({
    mutationFn: async (newParam: {
      type: string;
      value: string;
      unit: string;
      notes?: string;
    }) => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("parameters")
        .insert([
          {
            type: newParam.type,
            value: newParam.value,
            unit: newParam.unit,
            notes: newParam.notes,
            patient_id: user.id,
            hospital_id: 1,
            recorded_at: new Date().toISOString(),
          },
        ])
        .select(); // return the inserted row if you need it

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Parameter added",
        description: "Your health parameter has been successfully recorded.",
      });
      // close dialog, reset inputs…
      queryClient.invalidateQueries({ queryKey: ["parameters", user?.id] });
    },
    onError: (err: any) => {
      toast({
        title: "Failed to add parameter",
        description: err.message,
        variant: "destructive",
      });
    },
  });
  const getUnitByType = (type: string) => {
    switch (type) {
      case "blood_pressure":
        return "mmHg";
      case "weight":
        return "kg";
      case "height":
        return "cm";
      case "heart_rate":
        return "bpm";
      case "blood_glucose":
        return "mg/dL";
      case "temperature":
        return "°C";
      default:
        return "";
    }
  };

  const handleAddParameter = () => {
    if (!parameterValue) {
      toast({
        title: "Validation error",
        description: "Please enter a value for the parameter",
        variant: "destructive",
      });
      return;
    }

    addParameterMutation.mutate({
      type: parameterType,
      value: parameterValue,
      unit: parameterUnit || getUnitByType(parameterType),
      notes: parameterNotes,
    });
  };

  const formatParameters = (params: any[] = [], type: string) => {
    if (!params || params.length === 0) return [];

    return params
      .filter((param) => param.type === type)
      .map((param) => ({
        date: new Date(param.recorded_at).toLocaleDateString(),
        value: parseFloat(param.value),
        unit: param.unit,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const getChartColor = (type: string) => {
    switch (type) {
      case "blood_pressure":
        return "#1976D2";
      case "weight":
        return "#4CAF50";
      case "heart_rate":
        return "#FF5722";
      case "blood_glucose":
        return "#9C27B0";
      case "temperature":
        return "#F44336";
      default:
        return "#1976D2";
    }
  };

  const getChartTitle = (type: string) => {
    switch (type) {
      case "blood_pressure":
        return "Blood Pressure";
      case "weight":
        return "Weight";
      case "heart_rate":
        return "Heart Rate";
      case "blood_glucose":
        return "Blood Glucose";
      case "temperature":
        return "Body Temperature";
      default:
        return type.replace("_", " ");
    }
  };

  const getLatestValue = (type: string) => {
    if (!parameters || parameters.length === 0) return "No data";

    const filtered = parameters.filter((param: any) => param.type === type);
    if (filtered.length === 0) return "No data";

    const latest = filtered.sort(
      (a: any, b: any) =>
        new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime()
    )[0];

    return `${latest.value} ${latest.unit}`;
  };

  const getParameterStatus = (type: string, value: string) => {
    if (value === "No data") return "No data available";

    // This is simplified and should be replaced with actual medical thresholds
    switch (type) {
      case "blood_pressure":
        return "Normal range";
      case "weight":
        return "Stable";
      case "heart_rate":
        return "Normal range";
      case "blood_glucose":
        return "Good control";
      case "temperature":
        return "Normal";
      default:
        return "Recorded";
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold font-heading">My Health</h1>
          <Button onClick={() => setIsNewParameterOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" /> Record Health Parameter
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Health Parameters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
              <Card
                className="p-4 shadow-sm"
                onClick={() => setActiveTab("blood_pressure")}
              >
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">
                    Blood Pressure
                  </span>
                  <span className="text-xl font-semibold">
                    {isLoading ? (
                      <Skeleton className="h-6 w-20" />
                    ) : (
                      getLatestValue("blood_pressure")
                    )}
                  </span>
                  <span className="text-xs text-muted-foreground mt-1">
                    {isLoading ? (
                      <Skeleton className="h-3 w-16" />
                    ) : (
                      getParameterStatus(
                        "blood_pressure",
                        getLatestValue("blood_pressure")
                      )
                    )}
                  </span>
                </div>
              </Card>

              <Card
                className="p-4 shadow-sm"
                onClick={() => setActiveTab("weight")}
              >
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">Weight</span>
                  <span className="text-xl font-semibold">
                    {isLoading ? (
                      <Skeleton className="h-6 w-20" />
                    ) : (
                      getLatestValue("weight")
                    )}
                  </span>
                  <span className="text-xs text-muted-foreground mt-1">
                    {isLoading ? (
                      <Skeleton className="h-3 w-16" />
                    ) : (
                      getParameterStatus("weight", getLatestValue("weight"))
                    )}
                  </span>
                </div>
              </Card>

              <Card
                className="p-4 shadow-sm"
                onClick={() => setActiveTab("heart_rate")}
              >
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">
                    Heart Rate
                  </span>
                  <span className="text-xl font-semibold">
                    {isLoading ? (
                      <Skeleton className="h-6 w-20" />
                    ) : (
                      getLatestValue("heart_rate")
                    )}
                  </span>
                  <span className="text-xs text-muted-foreground mt-1">
                    {isLoading ? (
                      <Skeleton className="h-3 w-16" />
                    ) : (
                      getParameterStatus(
                        "heart_rate",
                        getLatestValue("heart_rate")
                      )
                    )}
                  </span>
                </div>
              </Card>

              <Card
                className="p-4 shadow-sm"
                onClick={() => setActiveTab("blood_glucose")}
              >
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">
                    Blood Glucose
                  </span>
                  <span className="text-xl font-semibold">
                    {isLoading ? (
                      <Skeleton className="h-6 w-20" />
                    ) : (
                      getLatestValue("blood_glucose")
                    )}
                  </span>
                  <span className="text-xs text-muted-foreground mt-1">
                    {isLoading ? (
                      <Skeleton className="h-3 w-16" />
                    ) : (
                      getParameterStatus(
                        "blood_glucose",
                        getLatestValue("blood_glucose")
                      )
                    )}
                  </span>
                </div>
              </Card>

              <Card
                className="p-4 shadow-sm"
                onClick={() => setActiveTab("temperature")}
              >
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">
                    Temperature
                  </span>
                  <span className="text-xl font-semibold">
                    {isLoading ? (
                      <Skeleton className="h-6 w-20" />
                    ) : (
                      getLatestValue("temperature")
                    )}
                  </span>
                  <span className="text-xs text-muted-foreground mt-1">
                    {isLoading ? (
                      <Skeleton className="h-3 w-16" />
                    ) : (
                      getParameterStatus(
                        "temperature",
                        getLatestValue("temperature")
                      )
                    )}
                  </span>
                </div>
              </Card>
            </div>

            <Tabs
              defaultValue="blood_pressure"
              value={activeTab}
              onValueChange={setActiveTab}
            >
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="blood_pressure">Blood Pressure</TabsTrigger>
                <TabsTrigger value="weight">Weight</TabsTrigger>
                <TabsTrigger value="heart_rate">Heart Rate</TabsTrigger>
                <TabsTrigger value="blood_glucose">Blood Glucose</TabsTrigger>
                <TabsTrigger value="temperature">Temperature</TabsTrigger>
              </TabsList>

              {[
                "blood_pressure",
                "weight",
                "heart_rate",
                "blood_glucose",
                "temperature",
              ].map((type) => (
                <TabsContent key={type} value={type}>
                  <Card>
                    <CardHeader>
                      <CardTitle>{getChartTitle(type)} History</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {isLoading ? (
                        <div className="w-full h-[300px] flex items-center justify-center">
                          <Skeleton className="h-[250px] w-full" />
                        </div>
                      ) : (
                        <div className="w-full h-[300px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                              data={formatParameters(parameters, type)}
                              margin={{
                                top: 5,
                                right: 30,
                                left: 20,
                                bottom: 5,
                              }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="date" />
                              <YAxis />
                              <Tooltip />
                              <Legend />
                              <Line
                                type="monotone"
                                dataKey="value"
                                stroke={getChartColor(type)}
                                activeDot={{ r: 8 }}
                                name={getChartTitle(type)}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      )}

                      <div className="flex justify-end mt-4">
                        <Button onClick={() => setIsNewParameterOpen(true)}>
                          <PlusCircle className="mr-2 h-4 w-4" />
                          Add New Reading
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Add Parameter Dialog */}
      <Dialog open={isNewParameterOpen} onOpenChange={setIsNewParameterOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Record Health Parameter</DialogTitle>
            <DialogDescription>
              Enter your latest health measurement.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="parameter-type">Parameter Type</Label>
              <Select
                value={parameterType}
                onValueChange={(value) => {
                  setParameterType(value);
                  setParameterUnit(getUnitByType(value));
                }}
              >
                <SelectTrigger id="parameter-type">
                  <SelectValue placeholder="Select parameter type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="blood_pressure">Blood Pressure</SelectItem>
                  <SelectItem value="weight">Weight</SelectItem>
                  <SelectItem value="heart_rate">Heart Rate</SelectItem>
                  <SelectItem value="blood_glucose">Blood Glucose</SelectItem>
                  <SelectItem value="temperature">Body Temperature</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="parameter-value">Value</Label>
                <Input
                  id="parameter-value"
                  value={parameterValue}
                  onChange={(e) => setParameterValue(e.target.value)}
                  placeholder={
                    parameterType === "blood_pressure"
                      ? "e.g. 120/80"
                      : "e.g. 72"
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="parameter-unit">Unit</Label>
                <Input
                  id="parameter-unit"
                  value={parameterUnit || getUnitByType(parameterType)}
                  onChange={(e) => setParameterUnit(e.target.value)}
                  placeholder="e.g. mmHg"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="parameter-notes">Notes (Optional)</Label>
              <Input
                id="parameter-notes"
                value={parameterNotes}
                onChange={(e) => setParameterNotes(e.target.value)}
                placeholder="Any additional notes about this reading"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsNewParameterOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              onClick={handleAddParameter}
              disabled={addParameterMutation.isPending}
            >
              {addParameterMutation.isPending ? "Saving..." : "Save Reading"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ChatWidget role="patient" />
    </DashboardLayout>
  );
}
