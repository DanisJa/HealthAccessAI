import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";

export default function Dashboard() {
  const { user, isLoading } = useAuth();
  const [_, navigate] = useLocation();

  useEffect(() => {
    console.log(user?.role);
    if (!isLoading && user) {
      if (user.role === "doctor") {
        navigate("/doctor");
      } else if (user.role === "patient") {
        navigate("/patient");
      } else if (user.role === "hospital") {
        navigate("/hospital");
      }
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-neutral-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 flex flex-col items-center">
            <div className="flex items-center justify-center mb-4">
              <img src="../../public/logo.png" />
              {/* <span className="material-icons text-primary text-3xl mr-2">
                favorite
              </span> */}
              <h1 className="text-2xl font-bold text-primary font-heading">
                Medi
              </h1>
            </div>
            <h2 className="text-2xl font-bold mb-4 font-heading">
              Welcome to Medi
            </h2>
            <p className="text-center mb-6 text-muted-foreground">
              A secure healthcare platform for patients and doctors, with IoT
              integration and AI assistance.
            </p>
            <div className="flex flex-col space-y-2 w-full">
              <Button onClick={() => navigate("/login")} className="w-full">
                Sign In
              </Button>
              <Button
                onClick={() => navigate("/register")}
                variant="outline"
                className="w-full"
              >
                Create Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex justify-center items-center min-h-[60vh]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 flex flex-col items-center">
            <h2 className="text-2xl font-bold mb-4">Redirecting...</h2>
            <Loader2 className="h-8 w-8 animate-spin" />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
