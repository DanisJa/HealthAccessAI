import { create } from 'zustand';
import { useAuth } from '@/hooks/use-auth';
import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { parameters } from '../../../shared/schema';

type HospitalStore = {
	selectedHospital: number | null;
	setSelectedHospital: (id: number | null) => void;
};

const useHospitalStore = create<HospitalStore>((set) => ({
	selectedHospital: null,
	setSelectedHospital: (id) => set({ selectedHospital: id }),
}));

export function useHospital() {
	const { user } = useAuth();
	const queryClient = useQueryClient();
	const { selectedHospital, setSelectedHospital } = useHospitalStore();

	// Fetch user's hospitals
	const userRole = user?.role || '';
	const userId = user?.id || 0;

	const hospitalQuery = useQuery({
		queryKey: ['hospitals', userRole, userId],
		queryFn: async () => {
			try {
				let endpoint = '';
				if (userRole === 'doctor') {
					endpoint = `/api/doctor/hospitals?doctorId=${userId}`;
				} else if (userRole === 'patient') {
					endpoint = `/api/patient/hospitals`;
				}

				if (!endpoint) return [];

				console.log(endpoint);

				const response = await fetch(endpoint);
				console.log(response);
				if (!response.ok) {
					console.log('error');
					throw new Error('Failed to fetch hospitals');
				}

				return response.json();
			} catch (error) {
				console.error('Error fetching hospitals:', error);
				// Fallback data in case of error
				if (userRole === 'hospital') {
					return [
						{
							id: userId,
							name: 'General Hospital',
							type: 'public',
							municipality: 'Central Municipality',
							location: '123 Main Street',
						},
					];
				} else if (userRole === 'doctor') {
					return [
						{
							id: 1,
							name: 'General Hospital',
							type: 'public',
							municipality: 'Central Municipality',
							location: '123 Main Street',
						},
						{
							id: 2,
							name: 'Community Hospital',
							type: 'public',
							municipality: 'North Municipality',
							location: '456 Park Avenue',
						},
					];
				} else if (userRole === 'patient') {
					return [
						{
							id: 1,
							name: 'General Hospital',
							type: 'public',
							municipality: 'Central Municipality',
							location: '123 Main Street',
						},
					];
				}
				return [];
			}
		},
		enabled: !!user,
	});

	// Set the first hospital as selected if none is selected yet
	useEffect(() => {
		if (
			hospitalQuery.isSuccess &&
			Array.isArray(hospitalQuery.data) &&
			hospitalQuery.data.length > 0 &&
			(!selectedHospital || userRole === 'hospital')
		) {
			// For hospital users, always select their own hospital ID (which is their user ID)
			if (userRole === 'hospital') {
				setSelectedHospital(userId);
			} else {
				setSelectedHospital(hospitalQuery.data[0].id);
			}
		}
	}, [
		hospitalQuery.data,
		hospitalQuery.isSuccess,
		selectedHospital,
		setSelectedHospital,
		userRole,
		userId,
	]);

	// When user changes selected hospital, invalidate queries that depend on hospital context
	useEffect(() => {
		if (selectedHospital) {
			// Invalidate queries that depend on hospital context
			queryClient.invalidateQueries({
				queryKey: ['appointments'],
			});
			queryClient.invalidateQueries({
				queryKey: ['patients'],
			});
			queryClient.invalidateQueries({
				queryKey: ['doctors'],
			});
			queryClient.invalidateQueries({
				queryKey: ['medicalRecords'],
			});
			queryClient.invalidateQueries({
				queryKey: ['prescriptions'],
			});
			queryClient.invalidateQueries({
				queryKey: ['parameters'],
			});
			queryClient.invalidateQueries({
				queryKey: ['reminders'],
			});
		}
	}, [selectedHospital, queryClient]);

	return {
		selectedHospital,
		setSelectedHospital,
		hospitals: hospitalQuery.data || [],
		isLoading: hospitalQuery.isLoading,
		isError: hospitalQuery.isError,
	};
}
