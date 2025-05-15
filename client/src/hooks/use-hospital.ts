import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Hospital {
  id: number;
  name: string;
  type: 'public' | 'private';
  municipality: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  departments?: string[];
  services?: string[];
}

interface HospitalState {
  hospitals: Hospital[];
  selectedHospital: Hospital | null;
  loadingHospitals: boolean;
  error: string | null;
  setHospitals: (hospitals: Hospital[]) => void;
  setSelectedHospital: (hospital: Hospital | null) => void;
  setLoadingHospitals: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useHospitalStore = create<HospitalState>()(
  persist(
    (set) => ({
      hospitals: [],
      selectedHospital: null,
      loadingHospitals: false,
      error: null,
      setHospitals: (hospitals) => set({ hospitals }),
      setSelectedHospital: (hospital) => set({ selectedHospital: hospital }),
      setLoadingHospitals: (loading) => set({ loadingHospitals: loading }),
      setError: (error) => set({ error }),
    }),
    {
      name: 'hospital-storage',
    }
  )
);

export const useHospital = () => {
  const {
    hospitals, 
    selectedHospital, 
    loadingHospitals, 
    error,
    setHospitals,
    setSelectedHospital,
    setLoadingHospitals,
    setError
  } = useHospitalStore();

  const fetchHospitals = async (userId: number, userRole: 'doctor' | 'patient') => {
    setLoadingHospitals(true);
    setError(null);

    try {
      const endpoint = userRole === 'doctor'
        ? `/api/doctor/hospitals`
        : `/api/patient/hospitals`;
        
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        throw new Error('Failed to fetch hospitals');
      }
      
      const data = await response.json();
      setHospitals(data);
      
      // Set the first hospital as selected by default if none is selected
      if (!selectedHospital && data.length > 0) {
        setSelectedHospital(data[0]);
      }
    } catch (err) {
      console.error('Error fetching hospitals:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoadingHospitals(false);
    }
  };

  return {
    hospitals,
    selectedHospital,
    loadingHospitals,
    error,
    fetchHospitals,
    setSelectedHospital,
  };
};