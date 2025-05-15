import { Switch, Route, useLocation, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "./components/theme-provider";
import NotFound from "@/pages/not-found";
import Login from "@/pages/auth/login";
import Register from "@/pages/auth/register";
import Dashboard from "@/pages/dashboard";
import { AuthProvider } from "@/lib/auth.tsx";
import { ChatProvider } from "@/lib/openai.tsx";
import DoctorDashboard from "@/pages/doctor";
import DoctorPatients from "@/pages/doctor/patients";
import DoctorMedicalRecords from "@/pages/doctor/medical-records";
import DoctorAppointments from "@/pages/doctor/appointments";
import DoctorPrescriptions from "@/pages/doctor/prescriptions";
import PatientDashboard from "@/pages/patient";
import PatientHealth from "@/pages/patient/health";
import PatientMedicalRecords from "@/pages/patient/medical-records";
import PatientAppointments from "@/pages/patient/appointments";
import PatientMedications from "@/pages/patient/medications";
import PatientReminders from "@/pages/patient/reminders";
import HospitalDashboard from "@/pages/hospital";
import { useAuth } from "@/hooks/use-auth";
import { useState, useEffect } from "react";

function ProtectedRoute({ component: Component, roles, ...rest }: any) {
  const { user, isLoading } = useAuth();
  const [location, navigate] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/login");
    } else if (user && roles && !roles.includes(user.role)) {
      navigate("/dashboard");
    }
  }, [user, isLoading, roles, navigate]);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!user) {
    return null;
  }

  return <Component {...rest} />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => <Redirect to="/dashboard" />} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/dashboard">
        {() => <ProtectedRoute component={Dashboard} />}
      </Route>
      
      {/* Doctor routes */}
      <Route path="/doctor">
        {() => <ProtectedRoute component={DoctorDashboard} roles={['doctor']} />}
      </Route>
      <Route path="/doctor/patients">
        {() => <ProtectedRoute component={DoctorPatients} roles={['doctor']} />}
      </Route>
      <Route path="/doctor/medical-records">
        {() => <ProtectedRoute component={DoctorMedicalRecords} roles={['doctor']} />}
      </Route>
      <Route path="/doctor/appointments">
        {() => <ProtectedRoute component={DoctorAppointments} roles={['doctor']} />}
      </Route>
      <Route path="/doctor/prescriptions">
        {() => <ProtectedRoute component={DoctorPrescriptions} roles={['doctor']} />}
      </Route>
      
      {/* Patient routes */}
      <Route path="/patient">
        {() => <ProtectedRoute component={PatientDashboard} roles={['patient']} />}
      </Route>
      <Route path="/patient/health">
        {() => <ProtectedRoute component={PatientHealth} roles={['patient']} />}
      </Route>
      <Route path="/patient/medical-records">
        {() => <ProtectedRoute component={PatientMedicalRecords} roles={['patient']} />}
      </Route>
      <Route path="/patient/appointments">
        {() => <ProtectedRoute component={PatientAppointments} roles={['patient']} />}
      </Route>
      <Route path="/patient/medications">
        {() => <ProtectedRoute component={PatientMedications} roles={['patient']} />}
      </Route>
      <Route path="/patient/reminders">
        {() => <ProtectedRoute component={PatientReminders} roles={['patient']} />}
      </Route>
      
      {/* Hospital admin routes */}
      <Route path="/hospital">
        {() => <ProtectedRoute component={HospitalDashboard} roles={['hospital']} />}
      </Route>
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="health-iot-theme">
        <AuthProvider>
          <ChatProvider>
            <TooltipProvider>
              <Toaster />
              <Router />
            </TooltipProvider>
          </ChatProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
