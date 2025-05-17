import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
	Table,
	TableHeader,
	TableBody,
	TableRow,
	TableHead,
	TableCell,
} from '@/components/ui/table';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

import { ChatWidget } from '@/components/chat/chat-widget';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FileText, MoreVertical, Plus, Search, RefreshCw } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from '@/components/ui/dialog';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardLayout } from '@/components/layouts/dashboard-layout';
import { supabase } from '../../../utils/supabaseClient';
import { useAuth } from '@/hooks/use-auth';

type RecordType = 'report' | 'order';

interface Patient {
	firstName: string;
	lastName: string;
	avatarUrl?: string;
}

interface Record {
	title: string;
	patient: Patient;
	createdAt: string;
	type: RecordType;
}

export default function DoctorMedicalRecords() {
	const [search, setSearch] = useState('');
	const [page, setPage] = useState(1);
	const [tab, setTab] = useState('all');
	const [isNewReportOpen, setIsNewReportOpen] = useState(false);
	const [selectedPatient, setSelectedPatient] = useState('');
	const { user } = useAuth();

	const { data, isLoading: isRecordsLoading } = useQuery({
		queryKey: ['records'],
		queryFn: async () => {
			const { data, error } = await supabase
				.from('record_json_view')
				.select('record_json');
			if (error) {
				throw new Error(error.message);
			}
			return data;
		},
	});

	const { data: patients, isLoading: isPatientsLoading } = useQuery({
		queryKey: ['patients'],
		queryFn: async () => {
			// 1. Fetch patients first
			const { data: patientsData, error: patientsError } = await supabase
				.from('hospital_patients')
				.select('*')
				.eq('primary_doctor_id', user?.id);

			if (patientsError) throw new Error(patientsError.message);
			if (!patientsData) return [];

			// 2. Fetch related users
			const patientIds = patientsData.map((p) => p.patient_id);
			const { data: usersData, error: usersError } = await supabase
				.from('users')
				.select('id, first_name, last_name')
				.in('id', patientIds);

			if (usersError) throw new Error(usersError.message);

			// 3. Combine the data
			return patientsData.map((patient) => ({
				...patient,
				user: usersData?.find((user) => user.id === patient.patient_id),
			}));
		},
	});

	const isLoading = isPatientsLoading || isRecordsLoading;

	const { mutate, isPending } = useMutation({
		mutationKey: ['records'],
		mutationFn: async () => {
			const { data, error } = await supabase.from('medical_reports').insert({});

			if (error) {
				throw new Error(error.message);
			}

			return data;
		},
	});

	const filteredRecords = data?.filter((record: any) => {
		// Skip if record_json is missing or malformed
		if (!record?.record_json?.record) return false;

		const recordData = record.record_json.record;
		const patient = recordData.patient;

		// Apply search filter
		const matchesSearch =
			recordData.title?.toLowerCase().includes(search.toLowerCase()) ||
			`${patient?.firstName || ''} ${patient?.lastName || ''}`
				.toLowerCase()
				.includes(search.toLowerCase());

		// Apply tab filter
		const matchesTab =
			tab === 'all' ||
			(tab === 'reports' && recordData.record_type === 'report') ||
			(tab === 'orders' && recordData.record_type === 'order');

		return matchesSearch && matchesTab;
	});

	console.log('filtered: ', filteredRecords);
	console.log('patients: ', patients);

	return (
		<DashboardLayout>
			<div className="space-y-6">
				<div className="flex justify-between items-center">
					<h1 className="text-2xl font-bold font-heading">Medical Records</h1>
					<Button onClick={() => setIsNewReportOpen(true)}>
						<Plus className="mr-2 h-4 w-4" /> New Medical Report
					</Button>
				</div>

				<Card>
					<CardHeader className="pb-3">
						<CardTitle>Medical Reports</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<div className="relative w-full md:w-96">
									<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
									<Input
										placeholder="Search medical records..."
										className="pl-10"
										value={search}
										onChange={(e) => setSearch(e.target.value)}
									/>
								</div>
								<Button size="icon" variant="ghost">
									<RefreshCw className="h-4 w-4" />
								</Button>
							</div>

							<Tabs defaultValue="all" onValueChange={setTab}>
								<TabsList className="grid w-full md:w-auto grid-cols-3">
									<TabsTrigger value="all">All Records</TabsTrigger>
									<TabsTrigger value="reports">Reports</TabsTrigger>
									<TabsTrigger value="orders">Medical Orders</TabsTrigger>
								</TabsList>
							</Tabs>

							<div className="border rounded-md">
								{isLoading ? (
									<div className="p-4 space-y-4">
										{Array(5)
											.fill(0)
											.map((_, i) => (
												<div key={i} className="flex items-center space-x-4">
													<Skeleton className="h-12 w-12 rounded-full" />
													<div className="space-y-2">
														<Skeleton className="h-4 w-[250px]" />
														<Skeleton className="h-4 w-[200px]" />
													</div>
												</div>
											))}
									</div>
								) : (
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead>Patient</TableHead>
												<TableHead>Type</TableHead>
												<TableHead>Title</TableHead>
												<TableHead>Date</TableHead>
												<TableHead></TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{filteredRecords && filteredRecords.length > 0 ? (
												filteredRecords.map((record: any, i) => (
													<TableRow key={i}>
														<TableCell>
															<div className="flex items-center space-x-3">
																<Avatar>
																	<AvatarImage
																		src={
																			record.record_json
																				? record.record_json.record.patient
																						.avatarUrl
																				: 'fallback'
																		}
																	/>
																	<AvatarFallback>
																		{record.record_json &&
																			record.record_json.record.patient
																				.first_name}
																	</AvatarFallback>
																</Avatar>
																<div>
																	<p className="font-medium">{`${record.record_json.record.patient.firstName} ${record.record_json.record.patient.lastName}`}</p>
																</div>
															</div>
														</TableCell>
														<TableCell>
															<Badge
																variant={
																	record.record_json.record.record_type ===
																	'report'
																		? 'default'
																		: 'outline'
																}
															>
																{record.record_json.record.record_type ===
																'report'
																	? 'Medical Report'
																	: 'Medical Order'}
															</Badge>
														</TableCell>
														<TableCell>
															{record.record_json.record.title}
														</TableCell>
														<TableCell>
															{new Date(
																record.record_json.record.createdAt
															).toLocaleDateString()}
														</TableCell>
														<TableCell>
															<DropdownMenu>
																<DropdownMenuTrigger asChild>
																	<Button variant="ghost" size="icon">
																		<MoreVertical className="h-4 w-4" />
																	</Button>
																</DropdownMenuTrigger>
																<DropdownMenuContent align="end">
																	<DropdownMenuItem>
																		View Details
																	</DropdownMenuItem>
																	<DropdownMenuItem>Edit</DropdownMenuItem>
																	<DropdownMenuItem>Print</DropdownMenuItem>
																	<DropdownMenuItem>Share</DropdownMenuItem>
																</DropdownMenuContent>
															</DropdownMenu>
														</TableCell>
													</TableRow>
												))
											) : (
												<TableRow>
													<TableCell colSpan={5} className="text-center py-6">
														No medical records found
													</TableCell>
												</TableRow>
											)}
										</TableBody>
									</Table>
								)}
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* New Medical Report Dialog */}
			<Modal
				isNewReportOpen={isNewReportOpen}
				setIsNewReportOpen={setIsNewReportOpen}
			/>

			<ChatWidget role="doctor" />
		</DashboardLayout>
	);

	//@ts-ignore Yeah
	function Modal({ isNewReportOpen, setIsNewReportOpen }) {
		return (
			<Dialog open={isNewReportOpen} onOpenChange={setIsNewReportOpen}>
				<DialogContent className="sm:max-w-[600px]">
					<DialogHeader>
						<DialogTitle>New Medical Report</DialogTitle>
						<DialogDescription>
							Create a new medical report for a patient.
						</DialogDescription>
					</DialogHeader>

					<div className="grid gap-4 py-4">
						<div className="grid gap-2">
							<Label htmlFor="patient">Patient</Label>
							<Select
								value={selectedPatient}
								onValueChange={setSelectedPatient}
							>
								<SelectTrigger id="patient">
									<SelectValue placeholder="Select patient" />
								</SelectTrigger>
								<SelectContent>
									{patients &&
										patients.map((patient: any, i) => (
											<SelectItem key={i} value={String(patient.id)}>
												{`${patient.user.first_name} ${patient.user.last_name}`}
											</SelectItem>
										))}
								</SelectContent>
							</Select>
						</div>

						<div className="grid gap-2">
							<Label htmlFor="title">Report Title</Label>
							<Input id="title" placeholder="Enter report title" />
						</div>

						<div className="grid gap-2">
							<Label htmlFor="content">Report Content</Label>
							<Textarea
								id="content"
								placeholder="Enter detailed report"
								className="min-h-[200px]"
							/>
						</div>
					</div>

					<DialogFooter>
						<Button variant="outline" onClick={() => setIsNewReportOpen(false)}>
							Cancel
						</Button>
						<Button type="submit">
							<FileText className="mr-2 h-4 w-4" />
							Save Report
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		);
	}
}
