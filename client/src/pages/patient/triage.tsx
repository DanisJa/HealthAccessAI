import { useState } from "react";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Stethoscope } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function OnlineTriagePage() {
  const user = useAuth();
  const usr = user.user;

  const [formData, setFormData] = useState({
    symptoms: "",
    age: usr?.dateOfBirth
      ? new Date().getFullYear() - new Date(usr.dateOfBirth).getFullYear()
      : 20,
    weight: "",
    height: "",
    bloodPressure: "",
    temperature: "",
    gender: "",
  });

  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setPrediction("");

    try {
      const response = await fetch("http://localhost:8000/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Prediction failed");

      const data = await response.json();
      setPrediction(data.prediction || "No result returned.");
    } catch (error) {
      setPrediction("Failed to fetch prediction.");
    }

    setLoading(false);
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Stethoscope className="w-6 h-6 text-primary" />
          Online Triage
        </h1>
        <p className="text-muted-foreground mt-1">
          Describe your symptoms and get a quick AI-powered disease prediction.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Symptom Assessment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Symptoms*</Label>
            <Textarea
              name="symptoms"
              value={formData.symptoms}
              onChange={handleChange}
              placeholder="e.g. Fever, cough, fatigue"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Age</Label>
              <Input name="age" type="number" onChange={handleChange} />
            </div>
            <div>
              <Label>Gender</Label>
              <Input
                name="gender"
                placeholder="e.g. male, female"
                onChange={handleChange}
              />
            </div>
            <div>
              <Label>Weight (kg)</Label>
              <Input name="weight" type="number" onChange={handleChange} />
            </div>
            <div>
              <Label>Height (cm)</Label>
              <Input name="height" type="number" onChange={handleChange} />
            </div>
            <div>
              <Label>Blood Pressure</Label>
              <Input
                name="bloodPressure"
                placeholder="e.g. 120/80"
                onChange={handleChange}
              />
            </div>
            <div>
              <Label>Temperature (°C)</Label>
              <Input
                name="temperature"
                type="number"
                step="0.1"
                onChange={handleChange}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Consulting AI..." : "Get Prediction"}
          </Button>

          {prediction && (
            <div className="p-4 bg-muted/30 rounded-md text-sm text-center">
              <strong>Prediction:</strong> {prediction}
            </div>
          )}
        </CardFooter>
      </Card>
    </DashboardLayout>
  );
}
