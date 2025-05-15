import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCcw, Trash2, UserMinus } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Doctor {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  specialty: string;
  department?: string;
  status: string;
}

interface DoctorListCardProps {
  doctors: Doctor[];
  isLoading: boolean;
  onRefresh: () => void;
}

export default function DoctorListCard({ doctors, isLoading, onRefresh }: DoctorListCardProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <RefreshCcw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (doctors.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No doctors found. Add doctors to your hospital to get started.
      </div>
    );
  }

  return (
    <div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Specialty/Department</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {doctors.map((doctor) => (
              <TableRow key={doctor.id}>
                <TableCell className="font-medium">
                  Dr. {doctor.firstName} {doctor.lastName}
                </TableCell>
                <TableCell>{doctor.email}</TableCell>
                <TableCell>{doctor.department || doctor.specialty || 'Not specified'}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      doctor.status === 'active' ? 'default' :
                      doctor.status === 'pending' ? 'outline' :
                      'secondary'
                    }
                  >
                    {doctor.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                    <UserMinus className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="mt-4 flex justify-end">
        <Button variant="outline" size="sm" onClick={onRefresh} className="flex items-center gap-2">
          <RefreshCcw className="h-4 w-4" />
          Refresh
        </Button>
      </div>
    </div>
  );
}