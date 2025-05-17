import { Switch, Route, useLocation, Redirect } from 'wouter';
import { queryClient } from './lib/queryClient';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ThemeProvider } from './components/theme-provider';
import NotFound from '@/pages/not-found';
import Login from '@/pages/auth/login';
import Register from '@/pages/auth/register';
import Dashboard from '@/pages/dashboard';
import Settings from '@/pages/settings';
import MessagesPage from '@/pages/messages';
import ComposeMessagePage from '@/pages/messages/compose';
import MessageThreadPage from '@/pages/messages/thread/[id]';
import { AuthProvider } from '@/lib/auth.tsx';
import { ChatProvider } from '@/lib/openai.tsx';
import DoctorDashboard from '@/pages/doctor';
import DoctorPatients from '@/pages/doctor/patients';
import DoctorMedicalRecords from '@/pages/doctor/medical-records';
import DoctorAppointments from '@/pages/doctor/appointments';
import DoctorPrescriptions from '@/pages/doctor/prescriptions';
import DoctorAnalytics from '@/pages/doctor/analytics';
import PatientDashboard from '@/pages/patient';
import PatientHealth from '@/pages/patient/health';
import PatientMedicalRecords from '@/pages/patient/medical-records';
import PatientAppointments from '@/pages/patient/appointments';
import PatientMedications from '@/pages/patient/medications';
import PatientReminders from '@/pages/patient/reminders';
import HospitalDashboard from '@/pages/hospital';
import HospitalDoctors from '@/pages/hospital/doctors';
import HospitalPatients from '@/pages/hospital/patients';
import { useAuth } from '@/hooks/use-auth';
import { useState, useEffect, Suspense, lazy } from 'react';
import SupabaseTest from './components/supabase-test';
import OnlineTriagePage from './pages/patient/triage';
import { BrowserRouter } from 'react-router-dom';

const env = import.meta.env.VITE_REACT_APP_SUPABASE_SERVICE_KEY;
console.log(env);

function ProtectedRoute({ component: Component, roles, ...rest }: any) {
	const { user, isLoading, isAuthenticated, hasRole } = useAuth();
	const [_, navigate] = useLocation();
	const [mounted] = useState(true);

	useEffect(() => {
		if (!isLoading) {
			if (!isAuthenticated) {
				navigate('/login');
			} else if (roles && !hasRole(roles)) {
				// Redirect to appropriate dashboard based on role
				if (user && typeof user === 'object' && 'role' in user) {
					switch (user.role) {
						case 'doctor':
							navigate('/doctor');
							break;
						case 'patient':
							navigate('/patient');
							break;
						case 'hospital':
							navigate('/hospital');
							break;
						default:
							navigate('/dashboard');
					}
				} else {
					navigate('/dashboard');
				}
			}
		}
	}, [user, isLoading, roles, navigate, isAuthenticated, hasRole]);

	if (isLoading) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				Loading...
			</div>
		);
	}

	if (!isAuthenticated) {
		return null;
	}

	// Only render the component once it's mounted to prevent resetting state during navigation
	if (mounted) {
		return <Component {...rest} />;
	}

	return null;
}

function Router() {
	return (
		<Suspense
			fallback={
				<div className="flex items-center justify-center min-h-screen">
					Loading...
				</div>
			}
		>
			<Switch>
				<Route path="/" component={SupabaseTest} />
				<Route path="/login" component={Login} />
				<Route path="/register" component={Register} />
				<Route path="/dashboard">
					{() => <ProtectedRoute component={Dashboard} />}
				</Route>
				<Route path="/settings">
					{() => <ProtectedRoute component={Settings} />}
				</Route>

				{/* Doctor routes */}
				<Route path="/doctor">
					{() => (
						<ProtectedRoute component={DoctorDashboard} roles={['doctor']} />
					)}
				</Route>
				<Route path="/doctor/patients">
					{() => (
						<ProtectedRoute component={DoctorPatients} roles={['doctor']} />
					)}
				</Route>
				<Route path="/doctor/medical-records">
					{() => (
						<ProtectedRoute
							component={DoctorMedicalRecords}
							roles={['doctor']}
						/>
					)}
				</Route>
				<Route path="/doctor/appointments">
					{() => (
						<ProtectedRoute component={DoctorAppointments} roles={['doctor']} />
					)}
				</Route>
				<Route path="/doctor/prescriptions">
					{() => (
						<ProtectedRoute
							component={DoctorPrescriptions}
							roles={['doctor']}
						/>
					)}
				</Route>
				<Route path="/doctor/analytics">
					{() => (
						<ProtectedRoute component={DoctorAnalytics} roles={['doctor']} />
					)}
				</Route>
				<Route path="/doctor/settings">
					{() => <ProtectedRoute component={Settings} roles={['doctor']} />}
				</Route>

				{/* Patient routes */}
				<Route path="/patient">
					{() => (
						<ProtectedRoute component={PatientDashboard} roles={['patient']} />
					)}
				</Route>
				<Route path="/patient/health">
					{() => (
						<ProtectedRoute component={PatientHealth} roles={['patient']} />
					)}
				</Route>
				<Route path="/patient/medical-records">
					{() => (
						<ProtectedRoute
							component={PatientMedicalRecords}
							roles={['patient']}
						/>
					)}
				</Route>
				<Route path="/patient/appointments">
					{() => (
						<ProtectedRoute
							component={PatientAppointments}
							roles={['patient']}
						/>
					)}
				</Route>
				<Route path="/patient/medications">
					{() => (
						<ProtectedRoute
							component={PatientMedications}
							roles={['patient']}
						/>
					)}
				</Route>
				<Route path="/patient/reminders">
					{() => (
						<ProtectedRoute component={PatientReminders} roles={['patient']} />
					)}
				</Route>
				<Route path="/patient/settings">
					{() => <ProtectedRoute component={Settings} roles={['patient']} />}
				</Route>

				<Route path="/patient/triage">
					{() => (
						<ProtectedRoute component={OnlineTriagePage} roles={['patient']} />
					)}
				</Route>

				{/* Hospital admin routes */}
				<Route path="/hospital">
					{() => (
						<ProtectedRoute
							component={HospitalDashboard}
							roles={['hospital']}
						/>
					)}
				</Route>
				<Route path="/hospital/doctors">
					{() => (
						<ProtectedRoute component={HospitalDoctors} roles={['hospital']} />
					)}
				</Route>
				<Route path="/hospital/patients">
					{() => (
						<ProtectedRoute component={HospitalPatients} roles={['hospital']} />
					)}
				</Route>
				<Route path="/hospital/appointments">
					{() => <ProtectedRoute component={NotFound} roles={['hospital']} />}
				</Route>
				<Route path="/hospital/departments">
					{() => <ProtectedRoute component={NotFound} roles={['hospital']} />}
				</Route>
				<Route path="/hospital/settings">
					{() => <ProtectedRoute component={Settings} roles={['hospital']} />}
				</Route>

				{/* Messaging routes - accessible by all roles */}
				<Route path="/messages">
					{() => <ProtectedRoute component={MessagesPage} />}
				</Route>
				<Route path="/messages/compose">
					{() => <ProtectedRoute component={ComposeMessagePage} />}
				</Route>
				<Route path="/messages/thread/:id">
					{() => <ProtectedRoute component={MessageThreadPage} />}
				</Route>

				{/* Fallback to 404 */}
				<Route component={NotFound} />
			</Switch>
		</Suspense>
	);
}

function App() {
	return (
		<QueryClientProvider client={queryClient}>
			<ThemeProvider defaultTheme="light" storageKey="health-iot-theme">
				<AuthProvider>
					<BrowserRouter>
						<ChatProvider>
							<TooltipProvider>
								<Toaster />
								<Router />
							</TooltipProvider>
						</ChatProvider>
					</BrowserRouter>
				</AuthProvider>
			</ThemeProvider>
		</QueryClientProvider>
	);
}

export default App;
