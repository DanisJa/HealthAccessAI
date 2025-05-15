import { create } from 'zustand';
import { useAuth } from '@/hooks/use-auth';
import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

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
      let endpoint = '';
      
      if (userRole === 'hospital') {
        endpoint = `/api/hospital?id=${userId}`;
      } else if (userRole === 'doctor') {
        endpoint = `/api/doctor/hospitals`;
      } else if (userRole === 'patient') {
        endpoint = `/api/patient/hospitals`;
      }
      
      if (!endpoint) return [];
      
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error('Failed to fetch hospitals');
      }
      return response.json();
    },
    enabled: !!user,
  });
  
  // Set the first hospital as selected if none is selected yet
  useEffect(() => {
    if (
      hospitalQuery.isSuccess &&
      Array.isArray(hospitalQuery.data) &&
      hospitalQuery.data.length > 0 &&
      !selectedHospital
    ) {
      setSelectedHospital(hospitalQuery.data[0].id);
    }
  }, [hospitalQuery.data, hospitalQuery.isSuccess, selectedHospital, setSelectedHospital]);
  
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