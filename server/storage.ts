import { 
  users, 
  medicalReports, 
  medicalOrders, 
  prescriptions, 
  parameters, 
  appointments, 
  reminders,
  hospitals,
  hospitalDoctors,
  hospitalPatients,
  type User, 
  type InsertUser, 
  type MedicalReport, 
  type InsertMedicalReport, 
  type MedicalOrder, 
  type InsertMedicalOrder,
  type Prescription,
  type InsertPrescription,
  type Parameter,
  type InsertParameter,
  type Appointment,
  type InsertAppointment,
  type Reminder,
  type InsertReminder,
  type Hospital,
  type InsertHospital,
  type HospitalDoctor,
  type InsertHospitalDoctor,
  type HospitalPatient,
  type InsertHospitalPatient
} from "@shared/schema";

// Define the extended storage interface with all needed CRUD methods
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Hospital methods
  getHospital(id: number): Promise<Hospital | undefined>;
  createHospital(hospital: InsertHospital): Promise<Hospital>;
  getAllHospitals(): Promise<Hospital[]>;
  getHospitalsByMunicipality(municipality: string): Promise<Hospital[]>;
  getHospitalDoctors(hospitalId: number): Promise<any[]>; // Returns doctor details
  addDoctorToHospital(hospitalDoctor: InsertHospitalDoctor): Promise<HospitalDoctor>;
  removeDoctorFromHospital(hospitalId: number, doctorId: number): Promise<void>;
  getHospitalPatients(hospitalId: number): Promise<any[]>; // Returns patient details
  addPatientToHospital(hospitalPatient: InsertHospitalPatient): Promise<HospitalPatient>;
  removePatientFromHospital(hospitalId: number, patientId: number): Promise<void>;
  getDoctorHospitals(doctorId: number): Promise<Hospital[]>;
  getPatientHospitals(patientId: number): Promise<Hospital[]>;
  
  // Doctor methods
  getDoctorStats(doctorId: number): Promise<any>;
  getRecentPatients(doctorId: number): Promise<any[]>;
  getAllPatients(): Promise<any[]>;
  getPatients(tab: string, page: number, search: string): Promise<any[]>;
  getDoctorTodayAppointments(doctorId: number): Promise<any[]>;
  getDoctorAppointments(doctorId: number, tab: string, date?: string): Promise<any[]>;
  getDoctorMedicalRecords(doctorId: number, tab: string, page: number, search: string): Promise<any[]>;
  getDoctorPrescriptions(doctorId: number, tab: string, page: number, search: string): Promise<any[]>;
  
  // Medical report methods
  createMedicalReport(report: InsertMedicalReport): Promise<MedicalReport>;
  
  // Medical order methods
  createMedicalOrder(order: InsertMedicalOrder): Promise<MedicalOrder>;
  
  // Prescription methods
  createPrescription(prescription: InsertPrescription): Promise<Prescription>;
  
  // Appointment methods
  getAppointment(id: number): Promise<Appointment | undefined>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  updateAppointmentStatus(appointmentId: number, status: string, updatedBy: number): Promise<Appointment>;
  
  // Patient methods
  getPatientStats(patientId: number): Promise<any>;
  getPatientUpcomingAppointments(patientId: number): Promise<any[]>;
  getAvailableDoctors(hospitalId?: number): Promise<any[]>;
  getPatientAppointments(patientId: number, tab: string, date?: string): Promise<any[]>;
  getPatientParameters(patientId: number): Promise<any[]>;
  getPatientRecentParameters(patientId: number): Promise<any[]>;
  createParameter(parameter: InsertParameter): Promise<Parameter>;
  getPatientMedicalRecords(patientId: number, tab: string, page: number, search: string): Promise<any[]>;
  getPatientMedications(patientId: number, tab: string, page: number, search: string): Promise<any[]>;
  getPatientReminders(patientId: number): Promise<any[]>;
  getPatientFilteredReminders(patientId: number, tab: string, page: number, search: string): Promise<any[]>;
  createReminder(reminder: InsertReminder): Promise<Reminder>;
  completeReminder(reminderId: number, userId: number): Promise<Reminder>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private medicalReports: Map<number, MedicalReport>;
  private medicalOrders: Map<number, MedicalOrder>;
  private prescriptions: Map<number, Prescription>;
  private parameters: Map<number, Parameter>;
  private appointments: Map<number, Appointment>;
  private reminders: Map<number, Reminder>;
  private hospitals: Map<number, Hospital>;
  private hospitalDoctors: Map<string, HospitalDoctor>; // Key is hospitalId:doctorId
  private hospitalPatients: Map<string, HospitalPatient>; // Key is hospitalId:patientId
  
  private currentUserId: number;
  private currentMedicalReportId: number;
  private currentMedicalOrderId: number;
  private currentPrescriptionId: number;
  private currentParameterId: number;
  private currentAppointmentId: number;
  private currentReminderId: number;
  private currentHospitalId: number;

  constructor() {
    this.users = new Map();
    this.medicalReports = new Map();
    this.medicalOrders = new Map();
    this.prescriptions = new Map();
    this.parameters = new Map();
    this.appointments = new Map();
    this.reminders = new Map();
    this.hospitals = new Map();
    this.hospitalDoctors = new Map();
    this.hospitalPatients = new Map();
    
    this.currentUserId = 1;
    this.currentMedicalReportId = 1;
    this.currentMedicalOrderId = 1;
    this.currentPrescriptionId = 1;
    this.currentParameterId = 1;
    this.currentAppointmentId = 1;
    this.currentReminderId = 1;
    this.currentHospitalId = 1;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const createdAt = new Date();
    const user: User = { ...insertUser, id, createdAt };
    this.users.set(id, user);
    return user;
  }
  
  // Doctor methods
  async getDoctorStats(doctorId: number): Promise<any> {
    const totalPatients = Array.from(this.users.values()).filter(user => user.role === 'patient').length;
    
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    
    const appointmentsToday = Array.from(this.appointments.values()).filter(appointment => 
      appointment.doctorId === doctorId && 
      new Date(appointment.date) >= todayStart && 
      new Date(appointment.date) <= todayEnd
    ).length;
    
    const pendingReports = Array.from(this.medicalReports.values()).filter(report => 
      report.doctorId === doctorId
    ).length;
    
    const prescriptionsIssued = Array.from(this.prescriptions.values()).filter(prescription => 
      prescription.doctorId === doctorId
    ).length;
    
    return {
      totalPatients,
      appointmentsToday,
      pendingReports,
      prescriptionsIssued
    };
  }
  
  async getRecentPatients(doctorId: number): Promise<any[]> {
    // Get patient IDs from appointments with this doctor
    const patientIds = new Set(
      Array.from(this.appointments.values())
        .filter(appointment => appointment.doctorId === doctorId)
        .map(appointment => appointment.patientId)
    );
    
    // Get patients with these IDs
    const patients = Array.from(patientIds)
      .map(patientId => {
        const user = this.users.get(patientId);
        if (!user || user.role !== 'patient') return null;
        
        // Get the most recent appointment for this patient with this doctor
        const latestAppointment = Array.from(this.appointments.values())
          .filter(a => a.patientId === patientId && a.doctorId === doctorId)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
        
        // Set a random status for demo purposes
        const statuses = ['stable', 'critical', 'follow-up'];
        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
        
        return {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          age: 30 + Math.floor(Math.random() * 50), // Random age for demo
          gender: Math.random() > 0.5 ? 'Male' : 'Female', // Random gender for demo
          status: randomStatus,
          lastVisit: latestAppointment ? new Date(latestAppointment.date).toLocaleDateString() : 'N/A'
        };
      })
      .filter(p => p !== null) as any[];
    
    // Return up to 3 recent patients
    return patients.slice(0, 3);
  }
  
  async getAllPatients(): Promise<any[]> {
    return Array.from(this.users.values())
      .filter(user => user.role === 'patient')
      .map(user => ({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        // Additional fields for demo
        age: 30 + Math.floor(Math.random() * 50),
        gender: Math.random() > 0.5 ? 'Male' : 'Female'
      }));
  }
  
  async getPatients(tab: string, page: number, search: string): Promise<any[]> {
    let patients = Array.from(this.users.values())
      .filter(user => user.role === 'patient');
    
    // Apply search filter if provided
    if (search) {
      const searchLower = search.toLowerCase();
      patients = patients.filter(patient => 
        patient.firstName.toLowerCase().includes(searchLower) ||
        patient.lastName.toLowerCase().includes(searchLower) ||
        patient.email.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply tab filter
    const statuses = ['stable', 'critical', 'active', 'follow-up'];
    
    // Map patients to include additional info
    const patientsWithDetails = patients.map(patient => {
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
      
      return {
        id: patient.id,
        firstName: patient.firstName,
        lastName: patient.lastName,
        email: patient.email,
        age: 30 + Math.floor(Math.random() * 50),
        gender: Math.random() > 0.5 ? 'Male' : 'Female',
        status: randomStatus,
        lastVisit: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toLocaleDateString()
      };
    });
    
    // Filter by tab
    let filteredPatients = patientsWithDetails;
    if (tab === 'active') {
      filteredPatients = patientsWithDetails.filter(p => p.status === 'active');
    } else if (tab === 'critical') {
      filteredPatients = patientsWithDetails.filter(p => p.status === 'critical');
    }
    
    // Apply pagination
    const pageSize = 10;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    
    return filteredPatients.slice(startIndex, endIndex);
  }
  
  async getDoctorTodayAppointments(doctorId: number): Promise<any[]> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    
    const todayAppointments = Array.from(this.appointments.values())
      .filter(appointment => 
        appointment.doctorId === doctorId && 
        new Date(appointment.date) >= todayStart && 
        new Date(appointment.date) <= todayEnd
      )
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Fetch and prepare related data for each appointment
    return Promise.all(todayAppointments.map(async appointment => {
      const patient = this.users.get(appointment.patientId);
      const hospital = await this.getHospital(appointment.hospitalId);
      
      return {
        ...appointment,
        patient: patient ? {
          id: patient.id,
          firstName: patient.firstName,
          lastName: patient.lastName,
          dateOfBirth: patient.dateOfBirth,
          phone: patient.phone
        } : undefined,
        hospital: hospital ? {
          id: hospital.id,
          name: hospital.name,
          type: hospital.type,
          municipality: hospital.municipality,
          address: hospital.address
        } : undefined
      };
    }));
  }
  
  async getDoctorAppointments(doctorId: number, tab: string, date?: string): Promise<any[]> {
    let appointments = Array.from(this.appointments.values())
      .filter(appointment => appointment.doctorId === doctorId);
    
    // Filter by tab
    if (tab === 'upcoming') {
      appointments = appointments.filter(a => 
        new Date(a.date).getTime() >= new Date().getTime() && 
        (a.status === 'pending' || a.status === 'approved')
      );
    } else if (tab === 'completed') {
      appointments = appointments.filter(a => a.status === 'completed');
    } else if (tab === 'cancelled') {
      appointments = appointments.filter(a => a.status === 'cancelled');
    } else if (tab === 'pending') {
      appointments = appointments.filter(a => a.status === 'pending');
    } else if (tab === 'rejected') {
      appointments = appointments.filter(a => a.status === 'rejected');
    }
    
    // Filter by date if provided
    if (date) {
      const filterDate = new Date(date);
      filterDate.setHours(0, 0, 0, 0);
      const filterDateEnd = new Date(date);
      filterDateEnd.setHours(23, 59, 59, 999);
      
      appointments = appointments.filter(a => {
        const appointmentDate = new Date(a.date);
        return appointmentDate >= filterDate && appointmentDate <= filterDateEnd;
      });
    }
    
    // Sort by date
    appointments.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Fetch and prepare related data for each appointment
    return Promise.all(appointments.map(async appointment => {
      const patient = this.users.get(appointment.patientId);
      const hospital = await this.getHospital(appointment.hospitalId);
      
      return {
        ...appointment,
        patient: patient ? {
          id: patient.id,
          firstName: patient.firstName,
          lastName: patient.lastName,
          dateOfBirth: patient.dateOfBirth,
          phone: patient.phone
        } : undefined,
        hospital: hospital ? {
          id: hospital.id,
          name: hospital.name,
          type: hospital.type,
          municipality: hospital.municipality
        } : undefined
      };
    }));
  }
  
  async getDoctorMedicalRecords(doctorId: number, tab: string, page: number, search: string): Promise<any[]> {
    // Combine medical reports and orders
    const reports = Array.from(this.medicalReports.values())
      .filter(report => report.doctorId === doctorId)
      .map(report => ({ ...report, type: 'report' }));
    
    const orders = Array.from(this.medicalOrders.values())
      .filter(order => order.doctorId === doctorId)
      .map(order => ({ ...order, type: 'order' }));
    
    let records = [...reports, ...orders];
    
    // Apply search filter if provided
    if (search) {
      const searchLower = search.toLowerCase();
      records = records.filter(record => 
        record.title.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply tab filter
    if (tab === 'reports') {
      records = records.filter(record => record.type === 'report');
    } else if (tab === 'orders') {
      records = records.filter(record => record.type === 'order');
    }
    
    // Sort by creation date (newest first)
    records.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    // Apply pagination
    const pageSize = 10;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    
    // Enrich with patient information
    return records.slice(startIndex, endIndex).map(record => {
      const patient = this.users.get(record.patientId);
      
      return {
        ...record,
        patient: patient ? {
          firstName: patient.firstName,
          lastName: patient.lastName
        } : undefined
      };
    });
  }
  
  async getDoctorPrescriptions(doctorId: number, tab: string, page: number, search: string): Promise<any[]> {
    let prescriptions = Array.from(this.prescriptions.values())
      .filter(prescription => prescription.doctorId === doctorId);
    
    // Apply search filter if provided
    if (search) {
      const searchLower = search.toLowerCase();
      prescriptions = prescriptions.filter(prescription => 
        prescription.medication.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply tab filter
    if (tab === 'active') {
      prescriptions = prescriptions.filter(p => p.status === 'active');
    } else if (tab === 'completed') {
      prescriptions = prescriptions.filter(p => p.status === 'completed');
    }
    
    // Sort by start date (newest first)
    prescriptions.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
    
    // Apply pagination
    const pageSize = 10;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    
    // Enrich with patient information
    return prescriptions.slice(startIndex, endIndex).map(prescription => {
      const patient = this.users.get(prescription.patientId);
      
      return {
        ...prescription,
        patient: patient ? {
          firstName: patient.firstName,
          lastName: patient.lastName
        } : undefined
      };
    });
  }
  
  // Medical report methods
  async createMedicalReport(insertReport: InsertMedicalReport): Promise<MedicalReport> {
    const id = this.currentMedicalReportId++;
    const createdAt = new Date();
    const report: MedicalReport = { ...insertReport, id, createdAt };
    this.medicalReports.set(id, report);
    return report;
  }
  
  // Medical order methods
  async createMedicalOrder(insertOrder: InsertMedicalOrder): Promise<MedicalOrder> {
    const id = this.currentMedicalOrderId++;
    const createdAt = new Date();
    const order: MedicalOrder = { ...insertOrder, id, createdAt };
    this.medicalOrders.set(id, order);
    return order;
  }
  
  // Prescription methods
  async createPrescription(insertPrescription: InsertPrescription): Promise<Prescription> {
    const id = this.currentPrescriptionId++;
    const createdAt = new Date();
    const prescription: Prescription = { ...insertPrescription, id, createdAt };
    this.prescriptions.set(id, prescription);
    return prescription;
  }
  
  // Patient methods
  async getPatientStats(patientId: number): Promise<any> {
    const upcomingAppointments = Array.from(this.appointments.values())
      .filter(appointment => 
        appointment.patientId === patientId && 
        new Date(appointment.date).getTime() >= new Date().getTime() &&
        (appointment.status === 'pending' || appointment.status === 'approved')
      ).length;
    
    const activeMedications = Array.from(this.prescriptions.values())
      .filter(prescription => 
        prescription.patientId === patientId && 
        prescription.status === 'active'
      ).length;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const remindersToday = Array.from(this.reminders.values())
      .filter(reminder => 
        reminder.userId === patientId && 
        !reminder.completed &&
        new Date(reminder.dueDate) >= today && 
        new Date(reminder.dueDate) < tomorrow
      ).length;
    
    const newReports = Array.from(this.medicalReports.values())
      .filter(report => 
        report.patientId === patientId &&
        // Consider reports from last 7 days as "new"
        new Date(report.createdAt).getTime() >= new Date().getTime() - 7 * 24 * 60 * 60 * 1000
      ).length;
    
    return {
      upcomingAppointments,
      activeMedications,
      remindersToday,
      newReports
    };
  }
  
  async getPatientUpcomingAppointments(patientId: number): Promise<any[]> {
    const upcomingAppointments = Array.from(this.appointments.values())
      .filter(appointment => 
        appointment.patientId === patientId && 
        new Date(appointment.date).getTime() >= new Date().getTime() &&
        (appointment.status === 'pending' || appointment.status === 'approved')
      )
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Fetch and prepare related data for each appointment
    return Promise.all(upcomingAppointments.map(async appointment => {
      const doctor = this.users.get(appointment.doctorId);
      const hospital = await this.getHospital(appointment.hospitalId);
      
      return {
        ...appointment,
        doctor: doctor ? {
          id: doctor.id,
          firstName: doctor.firstName,
          lastName: doctor.lastName,
          specialty: doctor.specialty
        } : undefined,
        hospital: hospital ? {
          id: hospital.id,
          name: hospital.name,
          type: hospital.type,
          municipality: hospital.municipality
        } : undefined
      };
    }));
  }
  
  async getAvailableDoctors(): Promise<any[]> {
    return Array.from(this.users.values())
      .filter(user => user.role === 'doctor')
      .map(doctor => ({
        id: doctor.id,
        firstName: doctor.firstName,
        lastName: doctor.lastName,
        // Add random specialty for demo purposes
        specialty: ['Cardiology', 'Neurology', 'General Practice', 'Dermatology'][Math.floor(Math.random() * 4)]
      }));
  }
  
  async getPatientAppointments(patientId: number, tab: string, date?: string): Promise<any[]> {
    let appointments = Array.from(this.appointments.values())
      .filter(appointment => appointment.patientId === patientId);
    
    // Filter by tab
    if (tab === 'upcoming') {
      appointments = appointments.filter(a => 
        new Date(a.date).getTime() >= new Date().getTime() && 
        (a.status === 'pending' || a.status === 'approved')
      );
    } else if (tab === 'completed') {
      appointments = appointments.filter(a => a.status === 'completed');
    } else if (tab === 'cancelled') {
      appointments = appointments.filter(a => a.status === 'cancelled');
    } else if (tab === 'pending') {
      appointments = appointments.filter(a => a.status === 'pending');
    } else if (tab === 'rejected') {
      appointments = appointments.filter(a => a.status === 'rejected');
    }
    
    // Filter by date if provided
    if (date) {
      const filterDate = new Date(date);
      filterDate.setHours(0, 0, 0, 0);
      const filterDateEnd = new Date(date);
      filterDateEnd.setHours(23, 59, 59, 999);
      
      appointments = appointments.filter(a => {
        const appointmentDate = new Date(a.date);
        return appointmentDate >= filterDate && appointmentDate <= filterDateEnd;
      });
    }
    
    // Sort by date
    appointments.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Fetch and prepare related data for each appointment
    return Promise.all(appointments.map(async appointment => {
      const doctor = this.users.get(appointment.doctorId);
      const hospital = await this.getHospital(appointment.hospitalId);
      
      return {
        ...appointment,
        doctor: doctor ? {
          id: doctor.id,
          firstName: doctor.firstName,
          lastName: doctor.lastName,
          specialty: doctor.specialty
        } : undefined,
        hospital: hospital ? {
          id: hospital.id,
          name: hospital.name,
          type: hospital.type,
          municipality: hospital.municipality
        } : undefined
      };
    }));
  }
  
  async createAppointment(insertAppointment: InsertAppointment): Promise<Appointment> {
    const id = this.currentAppointmentId++;
    const createdAt = new Date();
    
    // Validate hospital exists
    const hospital = await this.getHospital(insertAppointment.hospitalId);
    if (!hospital) {
      throw new Error('Hospital not found');
    }
    
    // Validate doctor exists
    const doctor = await this.getUser(insertAppointment.doctorId);
    if (!doctor || doctor.role !== 'doctor') {
      throw new Error('Doctor not found or invalid');
    }
    
    // Validate patient exists
    const patient = await this.getUser(insertAppointment.patientId);
    if (!patient || patient.role !== 'patient') {
      throw new Error('Patient not found or invalid');
    }
    
    // Check if doctor is associated with the hospital
    const doctorHospitals = await this.getDoctorHospitals(insertAppointment.doctorId);
    if (!doctorHospitals.some(h => h.id === insertAppointment.hospitalId)) {
      throw new Error('Doctor is not associated with this hospital');
    }
    
    const appointment: Appointment = { 
      ...insertAppointment, 
      id, 
      createdAt,
      status: insertAppointment.status || 'pending' // Default to pending if not specified
    };
    
    this.appointments.set(id, appointment);
    return appointment;
  }
  
  async getPatientParameters(patientId: number): Promise<any[]> {
    return Array.from(this.parameters.values())
      .filter(parameter => parameter.patientId === patientId)
      .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());
  }
  
  async getPatientRecentParameters(patientId: number): Promise<any[]> {
    // Group parameters by type
    const parametersByType = new Map<string, Parameter[]>();
    
    Array.from(this.parameters.values())
      .filter(parameter => parameter.patientId === patientId)
      .forEach(parameter => {
        if (!parametersByType.has(parameter.type)) {
          parametersByType.set(parameter.type, []);
        }
        parametersByType.get(parameter.type)!.push(parameter);
      });
    
    // Get most recent parameter of each type
    const recentParameters: Parameter[] = [];
    
    parametersByType.forEach(parameters => {
      // Sort by recordedAt (newest first)
      parameters.sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());
      
      // Add the most recent parameter
      if (parameters.length > 0) {
        recentParameters.push(parameters[0]);
      }
    });
    
    return recentParameters;
  }
  
  async createParameter(insertParameter: InsertParameter): Promise<Parameter> {
    const id = this.currentParameterId++;
    const recordedAt = new Date();
    const parameter: Parameter = { ...insertParameter, id, recordedAt };
    this.parameters.set(id, parameter);
    return parameter;
  }
  
  async getPatientMedicalRecords(patientId: number, tab: string, page: number, search: string): Promise<any[]> {
    // Combine medical reports and orders
    const reports = Array.from(this.medicalReports.values())
      .filter(report => report.patientId === patientId)
      .map(report => ({ ...report, type: 'report' }));
    
    const orders = Array.from(this.medicalOrders.values())
      .filter(order => order.patientId === patientId)
      .map(order => ({ ...order, type: 'order' }));
    
    let records = [...reports, ...orders];
    
    // Apply search filter if provided
    if (search) {
      const searchLower = search.toLowerCase();
      records = records.filter(record => 
        record.title.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply tab filter
    if (tab === 'reports') {
      records = records.filter(record => record.type === 'report');
    } else if (tab === 'orders') {
      records = records.filter(record => record.type === 'order');
    }
    
    // Sort by creation date (newest first)
    records.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    // Apply pagination
    const pageSize = 10;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    
    // Enrich with doctor information
    return records.slice(startIndex, endIndex).map(record => {
      const doctor = this.users.get(record.doctorId);
      
      return {
        ...record,
        doctor: doctor ? {
          id: doctor.id,
          firstName: doctor.firstName,
          lastName: doctor.lastName
        } : undefined
      };
    });
  }
  
  async getPatientMedications(patientId: number, tab: string, page: number, search: string): Promise<any[]> {
    let medications = Array.from(this.prescriptions.values())
      .filter(prescription => prescription.patientId === patientId);
    
    // Apply search filter if provided
    if (search) {
      const searchLower = search.toLowerCase();
      medications = medications.filter(medication => 
        medication.medication.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply tab filter
    if (tab === 'active') {
      medications = medications.filter(m => m.status === 'active');
    } else if (tab === 'completed') {
      medications = medications.filter(m => m.status === 'completed');
    }
    
    // Sort by start date (newest first)
    medications.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
    
    // Apply pagination
    const pageSize = 10;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    
    // Enrich with doctor information
    return medications.slice(startIndex, endIndex).map(medication => {
      const doctor = this.users.get(medication.doctorId);
      
      return {
        ...medication,
        doctor: doctor ? {
          id: doctor.id,
          firstName: doctor.firstName,
          lastName: doctor.lastName
        } : undefined
      };
    });
  }
  
  async getPatientReminders(patientId: number): Promise<any[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    nextWeek.setHours(23, 59, 59, 999);
    
    const reminders = Array.from(this.reminders.values())
      .filter(reminder => 
        reminder.userId === patientId && 
        !reminder.completed &&
        new Date(reminder.dueDate) >= today && 
        new Date(reminder.dueDate) <= nextWeek
      )
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    
    return reminders;
  }
  
  async getPatientFilteredReminders(patientId: number, tab: string, page: number, search: string): Promise<any[]> {
    let reminders = Array.from(this.reminders.values())
      .filter(reminder => reminder.userId === patientId);
    
    // Apply search filter if provided
    if (search) {
      const searchLower = search.toLowerCase();
      reminders = reminders.filter(reminder => 
        reminder.title.toLowerCase().includes(searchLower) ||
        (reminder.description && reminder.description.toLowerCase().includes(searchLower))
      );
    }
    
    // Apply tab filter
    if (tab === 'active') {
      reminders = reminders.filter(r => !r.completed);
    } else if (tab === 'completed') {
      reminders = reminders.filter(r => r.completed);
    }
    
    // Sort by due date (closest first)
    reminders.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    
    // Apply pagination
    const pageSize = 10;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    
    return reminders.slice(startIndex, endIndex);
  }
  
  async createReminder(insertReminder: InsertReminder): Promise<Reminder> {
    const id = this.currentReminderId++;
    const createdAt = new Date();
    const reminder: Reminder = { 
      ...insertReminder, 
      id, 
      createdAt,
      completed: false // Default to not completed
    };
    this.reminders.set(id, reminder);
    return reminder;
  }
  
  async completeReminder(reminderId: number, userId: number): Promise<Reminder> {
    const reminder = this.reminders.get(reminderId);
    
    if (!reminder) {
      throw new Error('Reminder not found');
    }
    
    if (reminder.userId !== userId) {
      throw new Error('Unauthorized');
    }
    
    const updatedReminder = { ...reminder, completed: true };
    this.reminders.set(reminderId, updatedReminder);
    
    return updatedReminder;
  }
  
  // Hospital methods
  async getHospital(id: number): Promise<Hospital | undefined> {
    return this.hospitals.get(id);
  }
  
  async createHospital(hospital: InsertHospital): Promise<Hospital> {
    const id = this.currentHospitalId++;
    const createdAt = new Date();
    
    const newHospital: Hospital = {
      ...hospital,
      id,
      createdAt
    };
    
    this.hospitals.set(id, newHospital);
    return newHospital;
  }
  
  async getAllHospitals(): Promise<Hospital[]> {
    return Array.from(this.hospitals.values());
  }
  
  async getHospitalsByMunicipality(municipality: string): Promise<Hospital[]> {
    return Array.from(this.hospitals.values())
      .filter(hospital => hospital.municipality === municipality);
  }
  
  async getHospitalDoctors(hospitalId: number): Promise<any[]> {
    const hospital = await this.getHospital(hospitalId);
    if (!hospital) {
      throw new Error('Hospital not found');
    }
    
    const doctorIds = Array.from(this.hospitalDoctors.values())
      .filter(relation => relation.hospitalId === hospitalId)
      .map(relation => relation.doctorId);
    
    const doctors = await Promise.all(
      doctorIds.map(async (doctorId) => {
        const doctor = await this.getUser(doctorId);
        return doctor;
      })
    );
    
    return doctors.filter(doctor => doctor !== undefined);
  }
  
  async addDoctorToHospital(hospitalDoctor: InsertHospitalDoctor): Promise<HospitalDoctor> {
    const { hospitalId, doctorId } = hospitalDoctor;
    
    // Validate hospital exists
    const hospital = await this.getHospital(hospitalId);
    if (!hospital) {
      throw new Error('Hospital not found');
    }
    
    // Validate doctor exists and is a doctor
    const doctor = await this.getUser(doctorId);
    if (!doctor || doctor.role !== 'doctor') {
      throw new Error('Doctor not found or user is not a doctor');
    }
    
    const key = `${hospitalId}:${doctorId}`;
    const relation: HospitalDoctor = {
      ...hospitalDoctor,
      createdAt: new Date()
    };
    
    this.hospitalDoctors.set(key, relation);
    return relation;
  }
  
  async removeDoctorFromHospital(hospitalId: number, doctorId: number): Promise<void> {
    const key = `${hospitalId}:${doctorId}`;
    if (!this.hospitalDoctors.has(key)) {
      throw new Error('Doctor is not associated with this hospital');
    }
    
    this.hospitalDoctors.delete(key);
  }
  
  async getHospitalPatients(hospitalId: number): Promise<any[]> {
    const hospital = await this.getHospital(hospitalId);
    if (!hospital) {
      throw new Error('Hospital not found');
    }
    
    const patientIds = Array.from(this.hospitalPatients.values())
      .filter(relation => relation.hospitalId === hospitalId)
      .map(relation => relation.patientId);
    
    const patients = await Promise.all(
      patientIds.map(async (patientId) => {
        const patient = await this.getUser(patientId);
        return patient;
      })
    );
    
    return patients.filter(patient => patient !== undefined);
  }
  
  async addPatientToHospital(hospitalPatient: InsertHospitalPatient): Promise<HospitalPatient> {
    const { hospitalId, patientId } = hospitalPatient;
    
    // Validate hospital exists
    const hospital = await this.getHospital(hospitalId);
    if (!hospital) {
      throw new Error('Hospital not found');
    }
    
    // Validate patient exists and is a patient
    const patient = await this.getUser(patientId);
    if (!patient || patient.role !== 'patient') {
      throw new Error('Patient not found or user is not a patient');
    }
    
    const key = `${hospitalId}:${patientId}`;
    const relation: HospitalPatient = {
      ...hospitalPatient,
      createdAt: new Date()
    };
    
    this.hospitalPatients.set(key, relation);
    return relation;
  }
  
  async removePatientFromHospital(hospitalId: number, patientId: number): Promise<void> {
    const key = `${hospitalId}:${patientId}`;
    if (!this.hospitalPatients.has(key)) {
      throw new Error('Patient is not associated with this hospital');
    }
    
    this.hospitalPatients.delete(key);
  }
  
  async getDoctorHospitals(doctorId: number): Promise<Hospital[]> {
    const hospitalIds = Array.from(this.hospitalDoctors.values())
      .filter(relation => relation.doctorId === doctorId)
      .map(relation => relation.hospitalId);
    
    const hospitals = await Promise.all(
      hospitalIds.map(async (hospitalId) => {
        const hospital = await this.getHospital(hospitalId);
        return hospital;
      })
    );
    
    return hospitals.filter((hospital): hospital is Hospital => hospital !== undefined);
  }
  
  async getPatientHospitals(patientId: number): Promise<Hospital[]> {
    const hospitalIds = Array.from(this.hospitalPatients.values())
      .filter(relation => relation.patientId === patientId)
      .map(relation => relation.hospitalId);
    
    const hospitals = await Promise.all(
      hospitalIds.map(async (hospitalId) => {
        const hospital = await this.getHospital(hospitalId);
        return hospital;
      })
    );
    
    return hospitals.filter((hospital): hospital is Hospital => hospital !== undefined);
  }
  
  // Appointment methods
  async getAppointment(id: number): Promise<Appointment | undefined> {
    return this.appointments.get(id);
  }
  
  async updateAppointmentStatus(appointmentId: number, status: string, updatedBy: number): Promise<Appointment> {
    const appointment = await this.getAppointment(appointmentId);
    if (!appointment) {
      throw new Error('Appointment not found');
    }
    
    // Check if the person updating the appointment is either the doctor or the patient
    if (appointment.doctorId !== updatedBy && appointment.patientId !== updatedBy) {
      throw new Error('Not authorized to update this appointment');
    }
    
    const updatedAppointment: Appointment = {
      ...appointment,
      status: status as any // Type casting for now, will be fixed with proper enum
    };
    
    this.appointments.set(appointmentId, updatedAppointment);
    return updatedAppointment;
  }
}

export const storage = new MemStorage();

// Define mock data setup function for demo purposes
export const setupMockData = async (storage: IStorage) => {
  // Create demo users
  const doctorUser = await storage.createUser({
    email: "doctor@example.com",
    password: "password123",
    firstName: "John",
    lastName: "Smith",
    role: "doctor",
    specialty: "General Practitioner",
    phone: "555-123-4567",
    address: "123 Medical Dr, New York, NY 10001"
  });

  const patientUser = await storage.createUser({
    email: "patient@example.com",
    password: "password123",
    firstName: "Sarah",
    lastName: "Johnson",
    role: "patient",
    dateOfBirth: new Date("1985-06-15").toISOString(),
    phone: "555-987-6543",
    address: "456 Health St, New York, NY 10002",
    municipality: "New York"
  });
  
  // Create sample hospitals
  const generalHospital = await storage.createHospital({
    name: "General Hospital",
    type: "public",
    municipality: "New York",
    location: "40.7128,-74.0060" // Latitude, longitude for New York
  });
  
  const specialtyClinic = await storage.createHospital({
    name: "Specialty Medical Center",
    type: "private",
    municipality: "New York",
    location: "40.7306,-73.9352"
  });
  
  // Associate doctor with hospitals
  await storage.addDoctorToHospital({
    hospitalId: generalHospital.id,
    doctorId: doctorUser.id,
    assignedBy: null // System assignment for demo
  });
  
  await storage.addDoctorToHospital({
    hospitalId: specialtyClinic.id,
    doctorId: doctorUser.id,
    assignedBy: null
  });
  
  // Associate patient with hospital
  await storage.addPatientToHospital({
    hospitalId: generalHospital.id,
    patientId: patientUser.id
  });

  // Create health parameters for patient
  await storage.createParameter({
    patientId: patientUser.id,
    type: "Blood Pressure",
    value: "120/80",
    unit: "mmHg",
    recordedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // Yesterday
  });

  await storage.createParameter({
    patientId: patientUser.id,
    type: "Heart Rate",
    value: "72",
    unit: "bpm",
    recordedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  });

  await storage.createParameter({
    patientId: patientUser.id,
    type: "Temperature",
    value: "98.6",
    unit: "°F",
    recordedAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString() // 2 days ago
  });

  await storage.createParameter({
    patientId: patientUser.id,
    type: "Blood Glucose",
    value: "90",
    unit: "mg/dL",
    recordedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString() // 12 hours ago
  });

  // Create appointments
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);

  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  nextWeek.setHours(14, 30, 0, 0);

  await storage.createAppointment({
    patientId: patientUser.id,
    doctorId: doctorUser.id,
    hospitalId: generalHospital.id,
    date: tomorrow.toISOString(),
    duration: 30,
    title: "Regular Checkup",
    status: "approved",
    type: "In-person",
    description: "Annual physical examination",
    createdBy: patientUser.id
  });

  await storage.createAppointment({
    patientId: patientUser.id,
    doctorId: doctorUser.id,
    hospitalId: specialtyClinic.id,
    date: nextWeek.toISOString(),
    duration: 45,
    title: "Follow-up Consultation",
    status: "pending",
    type: "Video",
    description: "Discussion of test results",
    createdBy: doctorUser.id
  });
  
  // Create a past appointment that's completed
  const lastWeek = new Date();
  lastWeek.setDate(lastWeek.getDate() - 7);
  lastWeek.setHours(11, 0, 0, 0);
  
  await storage.createAppointment({
    patientId: patientUser.id,
    doctorId: doctorUser.id,
    hospitalId: generalHospital.id,
    date: lastWeek.toISOString(),
    duration: 30,
    title: "Initial Consultation",
    status: "completed",
    type: "In-person",
    description: "First visit for symptoms assessment",
    createdBy: patientUser.id
  });

  // Create medical report
  await storage.createMedicalReport({
    patientId: patientUser.id,
    doctorId: doctorUser.id,
    title: "Annual Physical Examination",
    content: "Patient appears healthy. Vitals within normal range. Recommended regular exercise and balanced diet.",
    reportType: "Physical Examination",
    status: "completed"
  });

  // Create prescription
  await storage.createPrescription({
    patientId: patientUser.id,
    doctorId: doctorUser.id,
    medication: "Vitamin D",
    dosage: "1000 IU",
    frequency: "Once daily",
    duration: "3 months",
    instructions: "Take with food in the morning",
    isActive: true
  });

  // Create reminder for patient
  const today = new Date();
  today.setHours(today.getHours() + 2);

  await storage.createReminder({
    userId: patientUser.id,
    title: "Take Vitamin D",
    description: "With breakfast",
    dueDate: today.toISOString(),
    priority: "medium",
    category: "medication"
  });

  console.log("Mock data setup completed successfully");
};
