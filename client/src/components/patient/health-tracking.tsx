import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type ParameterType = "blood_pressure" | "weight" | "blood_glucose";

interface Parameter {
  id: number;
  type: string;
  value: string;
  unit: string;
  recordedAt: string;
}

export function HealthTracking() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [parameterType, setParameterType] = useState<ParameterType>("blood_pressure");
  const [parameterValue, setParameterValue] = useState("");
  const [parameterUnit, setParameterUnit] = useState("mmHg");

  const { toast } = useToast();

  const { data: parameters, isLoading } = useQuery({
    queryKey: ['/api/patient/parameters/recent'],
  });

  const addParameterMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', '/api/patient/parameters', data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Parameter added successfully",
        description: "Your health parameter has been recorded.",
      });
      setIsDialogOpen(false);
      setParameterValue("");
      queryClient.invalidateQueries({ queryKey: ['/api/patient/parameters/recent'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to add parameter",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
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
            {param ? `Last updated: ${new Date(param.recordedAt).toLocaleDateString()}` : 'Not recorded'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div className="text-2xl font-semibold">
            {param ? (
              <>
                {param.value} <span className="text-sm text-neutral-dark">{param.unit}</span>
              </>
            ) : (
              "No data"
            )}
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-primary" 
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
              <div className="bg-green-500 h-1.5 rounded-full" style={{ width: "70%" }}></div>
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
          <Button size="sm" onClick={() => setIsDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add New
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {renderParameterCard("blood_pressure", "Blood Pressure")}
          {renderParameterCard("weight", "Weight")}
          {renderParameterCard("blood_glucose", "Blood Glucose")}
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
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="parameter-type">Parameter Type</Label>
              <Select 
                value={parameterType} 
                onValueChange={(value) => handleParameterTypeChange(value as ParameterType)}
              >
                <SelectTrigger id="parameter-type">
                  <SelectValue placeholder="Select parameter type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="blood_pressure">Blood Pressure</SelectItem>
                  <SelectItem value="weight">Weight</SelectItem>
                  <SelectItem value="blood_glucose">Blood Glucose</SelectItem>
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
                  placeholder={parameterType === "blood_pressure" ? "120/80" : "70"}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="parameter-unit">Unit</Label>
                <Input 
                  id="parameter-unit" 
                  value={parameterUnit} 
                  readOnly 
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDialogOpen(false)}
              disabled={addParameterMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddParameter}
              disabled={addParameterMutation.isPending}
            >
              {addParameterMutation.isPending ? "Adding..." : "Add Parameter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
