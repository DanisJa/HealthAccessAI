import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useHospital } from '@/hooks/use-hospital';
import { DashboardLayout } from '@/components/layouts/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, LineChart, ResponsiveContainer, XAxis, YAxis, Bar, Tooltip, Line, CartesianGrid, Legend } from 'recharts';
import { Loader2, CalendarDays, UserRound, ClipboardList, Pill, Users, Clock, RefreshCw } from 'lucide-react';
import { format, subDays, subMonths, isSameDay, parseISO, isWithinInterval, startOfMonth, endOfMonth } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

// Sample data for charts
const generateAppointmentData = (range: 'week' | 'month' | 'year') => {
  const today = new Date();
  let data = [];
  
  if (range === 'week') {
    // Past 7 days
    for (let i = 6; i >= 0; i--) {
      const date = subDays(today, i);
      data.push({
        date: format(date, 'MMM dd'),
        completed: Math.floor(Math.random() * 8),
        scheduled: Math.floor(Math.random() * 5) + 1,
        cancelled: Math.floor(Math.random() * 3),
      });
    }
  } else if (range === 'month') {
    // Past 30 days aggregated by week
    for (let i = 3; i >= 0; i--) {
      const date = subDays(today, i * 7);
      data.push({
        date: `Week ${4-i}`,
        completed: Math.floor(Math.random() * 25) + 5,
        scheduled: Math.floor(Math.random() * 15) + 5,
        cancelled: Math.floor(Math.random() * 10),
      });
    }
  } else {
    // Past 12 months
    for (let i = 11; i >= 0; i--) {
      const date = subMonths(today, i);
      data.push({
        date: format(date, 'MMM'),
        completed: Math.floor(Math.random() * 80) + 20,
        scheduled: Math.floor(Math.random() * 40) + 10,
        cancelled: Math.floor(Math.random() * 25),
      });
    }
  }
  
  return data;
};

const generatePatientMetricsData = (range: 'week' | 'month' | 'year') => {
  const today = new Date();
  let data = [];
  
  if (range === 'week') {
    // Past 7 days
    for (let i = 6; i >= 0; i--) {
      const date = subDays(today, i);
      data.push({
        date: format(date, 'MMM dd'),
        newPatients: Math.floor(Math.random() * 3),
        followUps: Math.floor(Math.random() * 5) + 1,
      });
    }
  } else if (range === 'month') {
    // Past 4 weeks
    for (let i = 3; i >= 0; i--) {
      const date = subDays(today, i * 7);
      data.push({
        date: `Week ${4-i}`,
        newPatients: Math.floor(Math.random() * 8) + 2,
        followUps: Math.floor(Math.random() * 15) + 5,
      });
    }
  } else {
    // Past 12 months
    for (let i = 11; i >= 0; i--) {
      const date = subMonths(today, i);
      data.push({
        date: format(date, 'MMM'),
        newPatients: Math.floor(Math.random() * 20) + 5,
        followUps: Math.floor(Math.random() * 40) + 15,
      });
    }
  }
  
  return data;
};

const generateTimeSpentData = (range: 'week' | 'month' | 'year') => {
  const today = new Date();
  let data = [];
  
  if (range === 'week') {
    // Past 7 days
    for (let i = 6; i >= 0; i--) {
      const date = subDays(today, i);
      data.push({
        date: format(date, 'MMM dd'),
        avgTimePerPatient: Math.floor(Math.random() * 15) + 10, // minutes
      });
    }
  } else if (range === 'month') {
    // Past 4 weeks
    for (let i = 3; i >= 0; i--) {
      const date = subDays(today, i * 7);
      data.push({
        date: `Week ${4-i}`,
        avgTimePerPatient: Math.floor(Math.random() * 15) + 10, // minutes
      });
    }
  } else {
    // Past 12 months
    for (let i = 11; i >= 0; i--) {
      const date = subMonths(today, i);
      data.push({
        date: format(date, 'MMM'),
        avgTimePerPatient: Math.floor(Math.random() * 15) + 10, // minutes
      });
    }
  }
  
  return data;
};

// Sample top diagnoses data
const topDiagnoses = [
  { condition: 'Hypertension', count: 24, change: '+12%' },
  { condition: 'Diabetes Type 2', count: 18, change: '+5%' },
  { condition: 'Respiratory Infection', count: 15, change: '-3%' },
  { condition: 'Anxiety Disorder', count: 12, change: '+8%' },
  { condition: 'Lower Back Pain', count: 10, change: '+2%' },
];

// Sample recent activity
const recentActivity = [
  { id: 1, type: 'appointment', description: 'Completed appointment with Sarah Johnson', date: subDays(new Date(), 1) },
  { id: 2, type: 'record', description: 'Created medical record for Michael Chen', date: subDays(new Date(), 2) },
  { id: 3, type: 'prescription', description: 'Issued prescription for Emma Wilson', date: subDays(new Date(), 2) },
  { id: 4, type: 'appointment', description: 'Scheduled follow-up with David Lee', date: subDays(new Date(), 3) },
  { id: 5, type: 'record', description: 'Updated medical history for James Smith', date: subDays(new Date(), 4) },
];

export default function DoctorAnalytics() {
  const { user } = useAuth();
  const { selectedHospital } = useHospital();
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('week');
  const [appointmentData, setAppointmentData] = useState<any[]>([]);
  const [patientMetricsData, setPatientMetricsData] = useState<any[]>([]);
  const [timeSpentData, setTimeSpentData] = useState<any[]>([]);
  
  // Update data when time range changes
  useEffect(() => {
    setAppointmentData(generateAppointmentData(timeRange));
    setPatientMetricsData(generatePatientMetricsData(timeRange));
    setTimeSpentData(generateTimeSpentData(timeRange));
  }, [timeRange]);
  
  const { data: patients, isLoading: isPatientsLoading } = useQuery({
    queryKey: ['/api/doctor/patients/all', selectedHospital?.id],
    enabled: !!user,
  });
  
  const { data: appointments, isLoading: isAppointmentsLoading } = useQuery({
    queryKey: ['/api/doctor/today-appointments', selectedHospital?.id],
    queryFn: async () => {
      const url = selectedHospital 
        ? `/api/doctor/today-appointments?hospitalId=${selectedHospital.id}`
        : '/api/doctor/today-appointments';
      const response = await fetch(url);
      if (!response.ok) {
        return [];
      }
      return response.json();
    },
    enabled: !!user,
  });
  
  const { data: prescriptions, isLoading: isPrescriptionsLoading } = useQuery({
    queryKey: ['/api/doctor/prescriptions', selectedHospital?.id],
    enabled: !!user,
  });
  
  const { data: medicalRecords, isLoading: isMedicalRecordsLoading } = useQuery({
    queryKey: ['/api/doctor/medical-records', selectedHospital?.id],
    enabled: !!user,
  });
  
  const isLoading = isPatientsLoading || isAppointmentsLoading || isPrescriptionsLoading || isMedicalRecordsLoading;
  
  // Calculate metrics from real data
  const totalPatients = patients?.length || 0;
  const completedAppointments = appointments?.filter((a: any) => a.status === 'completed')?.length || 0;
  const pendingAppointments = appointments?.filter((a: any) => a.status === 'pending')?.length || 0;
  const totalRecords = medicalRecords?.length || 0;
  const totalPrescriptions = prescriptions?.length || 0;
  
  // Calculate average time per patient
  const avgTimePerPatient = appointments?.length ? 
    Math.round(appointments.reduce((sum: number, a: any) => sum + (a.duration || 30), 0) / appointments.length) : 
    0;
  
  // Filter activities for selected time range
  const getFilteredActivities = () => {
    const today = new Date();
    let startDate: Date;
    
    if (timeRange === 'week') {
      startDate = subDays(today, 7);
    } else if (timeRange === 'month') {
      startDate = subDays(today, 30);
    } else {
      startDate = subDays(today, 365);
    }
    
    return recentActivity.filter(activity => 
      isWithinInterval(activity.date, { start: startDate, end: today })
    );
  };

  const getActivityIcon = (type: string) => {
    switch(type) {
      case 'appointment':
        return <CalendarDays className="h-4 w-4 text-blue-500" />;
      case 'record':
        return <ClipboardList className="h-4 w-4 text-green-500" />;
      case 'prescription':
        return <Pill className="h-4 w-4 text-purple-500" />;
      default:
        return <Loader2 className="h-4 w-4" />;
    }
  };
  
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Analytics Dashboard</h1>
            <p className="text-muted-foreground">
              Insights and performance metrics for your practice
              {selectedHospital && typeof selectedHospital === 'object' && selectedHospital.name && 
                ` at ${selectedHospital.name}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={timeRange} onValueChange={(value: 'week' | 'month' | 'year') => setTimeRange(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Past Week</SelectItem>
                <SelectItem value="month">Past Month</SelectItem>
                <SelectItem value="year">Past Year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Key metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Patients</CardDescription>
              <CardTitle className="text-3xl">{totalPatients}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm">
                <Users className="mr-1 h-4 w-4 text-primary" />
                <span className="text-muted-foreground">Active patients</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Appointments</CardDescription>
              <CardTitle className="text-3xl">{completedAppointments}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm">
                <CalendarDays className="mr-1 h-4 w-4 text-primary" />
                <span className="text-muted-foreground">{pendingAppointments} pending</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Medical Records</CardDescription>
              <CardTitle className="text-3xl">{totalRecords}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm">
                <ClipboardList className="mr-1 h-4 w-4 text-primary" />
                <span className="text-muted-foreground">Total records</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Prescriptions</CardDescription>
              <CardTitle className="text-3xl">{totalPrescriptions}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm">
                <Pill className="mr-1 h-4 w-4 text-primary" />
                <span className="text-muted-foreground">Issued</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Avg. Time</CardDescription>
              <CardTitle className="text-3xl">{avgTimePerPatient} min</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm">
                <Clock className="mr-1 h-4 w-4 text-primary" />
                <span className="text-muted-foreground">Per patient</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Appointment Trends</CardTitle>
              <CardDescription>
                {timeRange === 'week' ? 'Past 7 days' : 
                 timeRange === 'month' ? 'Past 4 weeks' : 'Past 12 months'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={appointmentData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="completed" name="Completed" stackId="a" fill="#4ade80" />
                    <Bar dataKey="scheduled" name="Scheduled" stackId="a" fill="#60a5fa" />
                    <Bar dataKey="cancelled" name="Cancelled" stackId="a" fill="#f87171" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Patient Metrics</CardTitle>
              <CardDescription>New patients vs. follow-ups</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={patientMetricsData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="newPatients" name="New Patients" stroke="#2563eb" activeDot={{ r: 8 }} />
                    <Line type="monotone" dataKey="followUps" name="Follow-ups" stroke="#7c3aed" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Time spent per patient */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Time Per Patient</CardTitle>
              <CardDescription>Average minutes spent</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timeSpentData} margin={{ top: 20, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="avgTimePerPatient" name="Minutes" stroke="#f97316" activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          {/* Top diagnoses */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Top Diagnoses</CardTitle>
              <CardDescription>Most common conditions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topDiagnoses.map((diagnosis, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <div className="flex items-center">
                      <span className="text-muted-foreground mr-3">{index + 1}</span>
                      <span>{diagnosis.condition}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium mr-2">{diagnosis.count}</span>
                      <Badge variant={diagnosis.change.startsWith('+') ? 'outline' : 'secondary'} className={`${diagnosis.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                        {diagnosis.change}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          {/* Recent activity */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your latest actions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getFilteredActivities().slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex items-start">
                    <div className="mr-2 mt-0.5">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div>
                      <p className="text-sm">{activity.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(activity.date, 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}