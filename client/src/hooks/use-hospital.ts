import { create } from "zustand";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export interface Hospital {
  id: number;
  name: string;
  type: string;
  municipality: string;
  location: string;
}

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

  const userRole = user?.role || "";
  const userId = user?.id || 0;

  const hospitalQuery = useQuery<Hospital[]>({
    queryKey: ["hospitals", userRole, userId],
    enabled: !!user,
    queryFn: async () => {
      let endpoint = "";
      if (userRole === "doctor") {
        endpoint = `/api/doctor/hospitals?doctorId=${userId}`;
      } else if (userRole === "patient") {
        endpoint = `/api/patient/hospitals`;
      }
      if (!endpoint) return [];

      const response = await fetch(endpoint, { credentials: "include" });
      if (!response.ok) {
        console.error("Failed to fetch hospitals:", response.statusText);
        throw new Error("Failed to fetch hospitals");
      }

      // doctor_hospitals_view returns fields: hospital_id, hospital_name, type, municipality, location
      const raw = (await response.json()) as Array<{
        hospital_id: number;
        hospital_name: string;
        type: string;
        municipality: string;
        location: string;
      }>;

      // Map raw view to our interface
      return raw.map((r) => ({
        id: r.hospital_id,
        name: r.hospital_name,
        type: r.type,
        municipality: r.municipality,
        location: r.location,
      }));
    },
  });

  // Auto-select first hospital once loaded
  useEffect(() => {
    if (
      hospitalQuery.isSuccess &&
      hospitalQuery.data &&
      hospitalQuery.data.length > 0 &&
      selectedHospital === null
    ) {
      setSelectedHospital(hospitalQuery.data[0].id);
    }
  }, [
    hospitalQuery.data,
    hospitalQuery.isSuccess,
    selectedHospital,
    setSelectedHospital,
  ]);

  // Invalidate dependent queries on change
  useEffect(() => {
    if (selectedHospital !== null) {
      queryClient.invalidateQueries(["recentPatients"]);
      queryClient.invalidateQueries(["todayAppointments"]);
      queryClient.invalidateQueries(["patientParameters"]);
    }
  }, [selectedHospital, queryClient]);

  return {
    hospitals: hospitalQuery.data || [],
    selectedHospital,
    setSelectedHospital,
    isLoading: hospitalQuery.isLoading,
    isError: hospitalQuery.isError,
  };
}
