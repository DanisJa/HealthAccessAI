import React, { useEffect } from 'react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useHospital } from '@/hooks/use-hospital';
import { useAuth } from '@/hooks/use-auth';
import { Building2, Loader2 } from 'lucide-react';

interface HospitalSelectorProps {
  onChange?: (hospitalId: number) => void;
  className?: string;
}

export function HospitalSelector({ onChange, className = '' }: HospitalSelectorProps) {
  const { hospitals, selectedHospital, loadingHospitals, setSelectedHospital, fetchHospitals } = useHospital();
  const { user } = useAuth();

  useEffect(() => {
    if (user?.id && user?.role) {
      fetchHospitals(user.id, user.role as 'doctor' | 'patient');
    }
  }, [user, fetchHospitals]);

  const handleHospitalChange = (value: string) => {
    const hospitalId = parseInt(value, 10);
    const hospital = hospitals.find(h => h.id === hospitalId) || null;
    
    if (hospital) {
      setSelectedHospital(hospital);
      onChange?.(hospitalId);
    }
  };

  if (loadingHospitals) {
    return (
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading hospitals...</span>
      </div>
    );
  }

  if (!hospitals || hospitals.length === 0) {
    return (
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <Building2 className="h-4 w-4" />
        <span>No hospitals available</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Building2 className="h-4 w-4 text-muted-foreground" />
      <Select
        value={selectedHospital?.id.toString()}
        onValueChange={handleHospitalChange}
      >
        <SelectTrigger className="w-[220px]">
          <SelectValue placeholder="Select a hospital" />
        </SelectTrigger>
        <SelectContent>
          {hospitals.map((hospital) => (
            <SelectItem key={hospital.id} value={hospital.id.toString()}>
              {hospital.name} ({hospital.type})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}