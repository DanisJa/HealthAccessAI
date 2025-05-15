import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";

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

interface HospitalDetailsCardProps {
  hospital: Hospital;
}

export default function HospitalDetailsCard({ hospital }: HospitalDetailsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle>Hospital Details</CardTitle>
          <CardDescription>
            Information about your hospital
          </CardDescription>
        </div>
        <Button variant="outline" size="icon" className="h-8 w-8">
          <Edit className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Name</p>
              <p>{hospital.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Type</p>
              <p className="capitalize">{hospital.type}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Municipality</p>
              <p>{hospital.municipality}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <p>{hospital.email || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Phone</p>
              <p>{hospital.phone || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Address</p>
              <p>{hospital.address || 'Not specified'}</p>
            </div>
          </div>
          
          {hospital.departments && hospital.departments.length > 0 && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Departments</p>
              <div className="flex flex-wrap gap-1">
                {hospital.departments.map((dept, i) => (
                  <span key={i} className="px-2 py-1 text-xs rounded-full bg-primary/10 text-primary">
                    {dept}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {hospital.services && hospital.services.length > 0 && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Services</p>
              <div className="flex flex-wrap gap-1">
                {hospital.services.map((service, i) => (
                  <span key={i} className="px-2 py-1 text-xs rounded-full bg-secondary/10 text-secondary">
                    {service}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}