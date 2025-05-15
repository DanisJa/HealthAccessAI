import { useState } from "react";
import { useLocation } from "wouter";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getInitials, getStatusColor } from "@/lib/utils";

interface Patient {
  id: number;
  firstName: string;
  lastName: string;
  age: number;
  gender: string;
  status: string;
  lastVisit: string;
  avatarUrl?: string;
}

interface PatientListProps {
  patients: Patient[];
}

export function PatientList({ patients }: PatientListProps) {
  const [_, navigate] = useLocation();

  const getStatusBadge = (status: string) => {
    return (
      <Badge className={getStatusColor(status)}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle>Recent Patients</CardTitle>
          <Button variant="link" size="sm" onClick={() => navigate("/doctor/patients")}>View all</Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Visit</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {patients.length > 0 ? (
                patients.map((patient) => (
                  <TableRow key={patient.id}>
                    <TableCell>
                      <div className="flex items-center">
                        <Avatar className="h-8 w-8 mr-3">
                          <AvatarImage src={patient.avatarUrl} />
                          <AvatarFallback>
                            {getInitials(patient.firstName, patient.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {patient.firstName} {patient.lastName}
                          </div>
                          <div className="text-xs text-neutral-dark">
                            {patient.age}y, {patient.gender}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(patient.status)}</TableCell>
                    <TableCell>{patient.lastVisit}</TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="link" 
                        size="sm" 
                        onClick={() => navigate(`/doctor/patients/${patient.id}`)}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-4">
                    No patients found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
