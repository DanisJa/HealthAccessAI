import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/../utils/supabaseClient';

interface Patient {
	id: string;
	firstName: string;
	lastName: string;
	gender: string;
	status: string;
	time: string | null;
	priority: boolean;
}

export function PatientList() {
	// 1) fetch only non-completed rows
	const {
		data: rows,
		isLoading,
		error,
	} = useQuery({
		queryKey: ['patientQueue'],
		queryFn: async () => {
			const { data, error } = await supabase
				.from('queue')
				.select('id, first_name, last_name, gender, status, time')
				.neq('status', 'completed');
			if (error) throw error;
			return data!;
		},
		refetchInterval: 500,
	});

	// 2) local queue state
	const [queue, setQueue] = useState<Patient[]>([]);
	useEffect(() => {
		if (!rows) return;
		const formatted = rows.map((r) => ({
			id: String(r.id),
			firstName: r.first_name,
			lastName: r.last_name,
			gender: r.gender,
			status: r.status,
			time: r.time,
			priority: r.time !== null,
		}));
		formatted.sort((a, b) => Number(b.priority) - Number(a.priority));
		setQueue(formatted);
	}, [rows]);

	// 3) mutation to mark completed
	const completeMutation = useMutation({
		mutationFn: async (id: string) => {
			const { error } = await supabase
				.from('queue')
				.update({ status: 'completed' })
				.eq('id', id);
			if (error) throw error;
		},
	});

	// 4) on Next: remove locally & fire update
	const handleNext = () => {
		if (queue.length === 0) return;
		const [nextPatient, ...rest] = queue;
		setQueue(rest); // optimistically remove
		completeMutation.mutate(nextPatient.id);
	};

	return (
		<Card>
			<CardHeader className="pb-3">
				<div className="flex justify-between items-center">
					<CardTitle>Patient Queue</CardTitle>
					<Button
						variant="outline"
						size="sm"
						onClick={handleNext}
						disabled={
							queue.length === 0 || isLoading || completeMutation.isLoading
						}
					>
						Next
					</Button>
				</div>
			</CardHeader>

			<CardContent>
				{isLoading ? (
					<div className="text-center text-neutral-500 py-4">Loading…</div>
				) : error ? (
					<div className="text-center text-red-500 py-4">
						Error: {error.message}
					</div>
				) : queue.length === 0 ? (
					<div className="text-center text-neutral-500 py-4">
						Queue is empty
					</div>
				) : (
					<ul className="space-y-4">
						{queue.map((p) => (
							<li
								key={p.id}
								className="flex items-center justify-between border p-3 rounded-md"
							>
								<div className="flex items-center">
									<Avatar className="h-8 w-8 mr-3">
										<AvatarImage src={undefined} />
										<AvatarFallback>
											{getInitials(p.firstName, p.lastName)}
										</AvatarFallback>
									</Avatar>
									<div>
										<div className="font-medium">
											{p.firstName} {p.lastName}
										</div>
										<div className="text-xs text-neutral-dark">
											{p.gender} • {p.status}
										</div>
										{p.time && (
											<div className="text-xs text-neutral-dark">
												⏰{' '}
												{new Date(p.time).toLocaleTimeString([], {
													hour: '2-digit',
													minute: '2-digit',
												})}
											</div>
										)}
									</div>
								</div>
								{p.priority && (
									<Badge className="bg-red-100 text-red-600">Priority</Badge>
								)}
							</li>
						))}
					</ul>
				)}
			</CardContent>
		</Card>
	);
}
