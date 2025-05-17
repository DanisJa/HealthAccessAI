import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useHospital } from '@/hooks/use-hospital';
import { DashboardLayout } from '@/components/layouts/dashboard-layout';
import { WelcomeCard } from '@/components/dashboard/welcome-card';
import { StatsCard } from '@/components/dashboard/stats-card';
import { PatientList } from '@/components/doctor/patient-list';
import { AppointmentList } from '@/components/doctor/appointment-list';
import { HealthParameters } from '@/components/doctor/health-parameters';
import { ChatWidget } from '@/components/chat/chat-widget';
import {
	Activity,
	Users,
	ClipboardList,
	PillIcon,
	Building2,
	Loader2,
} from 'lucide-react';
import { supabase } from '@/../utils/supabaseClient'; // adjust path if needed

interface Stats {
	totalpatients: number;
	appointmentstoday: number;
	pendingreports: number;
	prescriptionsissued: number;
}

interface Patient {
	id: string;
	firstName: string;
	lastName: string;
	age: number;
	gender: string;
	status: string;
	lastVisit: string;
	avatarUrl?: string;
}

interface Appointment {
	id: number;
	patientId: number;
	patient: {
		firstName: string;
		lastName: string;
	};
	date: string;
	duration: number;
	title: string;
	type?: string;
	status: string;
}

function getAge(dob: string) {
	const birthDate = new Date(dob);
	const ageDiffMs = Date.now() - birthDate.getTime();
	const ageDate = new Date(ageDiffMs);
	return Math.abs(ageDate.getUTCFullYear() - 1970);
}

export default function DoctorDashboard() {
	const { user } = useAuth();
	console.log(user);
	const { hospitals, selectedHospital: selectedHospitalId } = useHospital();
	const selectedHospital =
		hospitals.find((h) => h.id === selectedHospitalId) ?? null;
	const [selectedPatientId, setSelectedPatientId] = useState<string | null>(
		null
	);

	// 1) Stats
	const { data: stats, isLoading: isStatsLoading } = useQuery<Stats | null>({
		queryKey: ['doctorStats', user?.id],
		enabled: !!user?.id,
		queryFn: async () => {
			const { data, error } = await supabase
				.from('doctor_stats_view')
				.select('*')
				.eq('doctor_id', user!.id)
				.single();
			if (error) throw new Error('Failed to load stats');
			return data;
		},
	});

	// 3) Today’s Appointments
	const { data: appointments = [], isLoading: isAppointmentsLoading } =
		useQuery<Appointment[]>({
			queryKey: ['todayAppointments', user?.id, selectedHospital?.id],
			enabled: !!user?.id && !!selectedHospital?.id,
			queryFn: async () => {
				const today = new Date();
				const tomorrow = new Date(today);
				tomorrow.setDate(today.getDate() + 1);

				const { data, error } = await supabase
					.from('appointments')
					.select(
						`
  id,
  date,
  duration,
  title,
  type,
  status,
  patient_id,
  users:patient_id (
    first_name,
    last_name
  )
`
					)
					.eq('doctor_id', user!.id)
					.eq('hospital_id', selectedHospital!.id)
					.gte('date', today.toISOString().split('T')[0])
					.lt('date', tomorrow.toISOString().split('T')[0]);
				console.log(data);
				if (error) throw new Error('Failed to load appointments');

				return data.map((a: any) => ({
					id: a.id,
					date: a.date,
					duration: a.duration,
					title: a.title,
					type: a.type,
					status: a.status,
					patientId: a.patient_id,
					patient: {
						first_name: a.users?.first_name ?? 'Unknown',
						last_name: a.users?.last_name ?? '',
					},
				}));
			},
		});

	const isLoading = isStatsLoading || isAppointmentsLoading;

	if (isLoading) {
		return (
			<DashboardLayout>
				<div className="flex justify-center items-center h-[50vh]">
					<Loader2 className="h-8 w-8 animate-spin text-primary" />
				</div>
			</DashboardLayout>
		);
	}

	return (
		<DashboardLayout>
			<WelcomeCard
				role="doctor"
				name={user?.last_name || ''}
				stats={{
					appointments: stats?.appointmentstoday || 0,
					reports: stats?.pendingreports || 0,
				}}
				imgUrl="https://images.unsplash.com/photo-1579684385127-1ef15d508118?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=400&q=80"
			/>

			{selectedHospital && (
				<div className="flex items-center gap-2 mb-4 p-2 bg-muted/20 rounded-md">
					<Building2 className="h-5 w-5 text-primary" />
					<span className="text-sm font-medium">
						Currently viewing: {selectedHospital.name}
					</span>
				</div>
			)}

			<div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
				<StatsCard
					title="Total Patients"
					value={stats?.totalpatients || 0}
					icon={<Users className="h-5 w-5" />}
					color="primary"
				/>
				<StatsCard
					title="Appointments Today"
					value={stats?.appointmentstoday || 0}
					icon={<Activity className="h-5 w-5" />}
					color="secondary"
				/>
				<StatsCard
					title="Pending Reports"
					value={stats?.pendingreports || 0}
					icon={<ClipboardList className="h-5 w-5" />}
					color="accent"
				/>
				<StatsCard
					title="Prescriptions Issued"
					value={stats?.prescriptionsissued || 0}
					icon={<PillIcon className="h-5 w-5" />}
					color="primary-light"
				/>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
				<PatientList />
				<AppointmentList appointments={appointments} />
			</div>

			<HealthParameters hospital={selectedHospital} />

			<ChatWidget role="doctor" />
		</DashboardLayout>
	);
}
