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
  messages,
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
  type InsertHospitalPatient,
  type Message,
  type InsertMessage,
} from "@shared/schema";
import { supabase } from "client/utils/supabaseClient";

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
  addDoctorToHospital(
    hospitalDoctor: InsertHospitalDoctor
  ): Promise<HospitalDoctor>;
  removeDoctorFromHospital(hospitalId: number, doctorId: number): Promise<void>;
  getHospitalPatients(hospitalId: number): Promise<any[]>; // Returns patient details
  addPatientToHospital(
    hospitalPatient: InsertHospitalPatient
  ): Promise<HospitalPatient>;
  removePatientFromHospital(
    hospitalId: number,
    patientId: number
  ): Promise<void>;
  getDoctorHospitals(doctorId: number): Promise<Hospital[]>;
  getPatientHospitals(patientId: number): Promise<Hospital[]>;
  getHospitalDepartments(hospitalId: number): Promise<string[]>; // Returns list of departments for a hospital

  // Doctor methods
  getDoctorStats(doctorId: number): Promise<any>;
  getRecentPatients(doctorId: number): Promise<any[]>;
  getAllPatients(): Promise<any[]>;
  getPatients(tab: string, page: number, search: string): Promise<any[]>;
  getDoctorTodayAppointments(doctorId: number): Promise<any[]>;
  getDoctorAppointments(
    doctorId: number,
    tab: string,
    date?: string
  ): Promise<any[]>;
  getDoctorMedicalRecords(
    doctorId: number,
    tab: string,
    page: number,
    search: string
  ): Promise<any[]>;
  getDoctorPrescriptions(
    doctorId: number,
    tab: string,
    page: number,
    search: string
  ): Promise<any[]>;

  // Medical report methods
  createMedicalReport(report: InsertMedicalReport): Promise<MedicalReport>;

  // Medical order methods
  createMedicalOrder(order: InsertMedicalOrder): Promise<MedicalOrder>;

  // Prescription methods
  createPrescription(prescription: InsertPrescription): Promise<Prescription>;

  // Appointment methods
  getAppointment(id: number): Promise<Appointment | undefined>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  updateAppointmentStatus(
    appointmentId: number,
    status: string,
    updatedBy: number
  ): Promise<Appointment>;

  // Patient methods
  getPatientStats(patientId: number, hospitalId?: number): Promise<any>;
  getPatientUpcomingAppointments(
    patientId: number,
    hospitalId?: number
  ): Promise<any[]>;
  getAvailableDoctors(hospitalId?: number): Promise<any[]>;
  getPatientAppointments(
    patientId: number,
    tab: string,
    date?: string,
    hospitalId?: number
  ): Promise<any[]>;
  getPatientParameters(patientId: number, hospitalId?: number): Promise<any[]>;
  getPatientRecentParameters(
    patientId: number,
    hospitalId?: number
  ): Promise<any[]>;
  createParameter(parameter: InsertParameter): Promise<Parameter>;
  getPatientMedicalRecords(
    patientId: number,
    tab: string,
    page: number,
    search: string,
    hospitalId?: number
  ): Promise<any[]>;
  getPatientMedications(
    patientId: number,
    tab: string,
    page: number,
    search: string,
    hospitalId?: number
  ): Promise<any[]>;
  getPatientReminders(patientId: number, hospitalId?: number): Promise<any[]>;
  getPatientFilteredReminders(
    patientId: number,
    tab: string,
    page: number,
    search: string,
    hospitalId?: number
  ): Promise<any[]>;
  createReminder(reminder: InsertReminder): Promise<Reminder>;
  completeReminder(reminderId: number, userId: number): Promise<Reminder>;

  // Message methods
  getUserMessages(
    userId: number,
    tab: string,
    page: number,
    search: string
  ): Promise<any[]>; // Get inbox messages for a user
  getUserSentMessages(
    userId: number,
    page: number,
    search: string
  ): Promise<any[]>; // Get sent messages
  getMessageThread(parentMessageId: number): Promise<any[]>; // Get message thread
  getMessage(messageId: number): Promise<Message | undefined>; // Get a specific message
  createMessage(message: InsertMessage): Promise<Message>; // Create a new message
  updateMessageStatus(messageId: number, status: string): Promise<Message>; // Update message status (read, archived)
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
  private messages: Map<number, Message>; // Messages between users

  private currentUserId: number;
  private currentMedicalReportId: number;
  private currentMedicalOrderId: number;
  private currentPrescriptionId: number;
  private currentParameterId: number;
  private currentAppointmentId: number;
  private currentReminderId: number;
  private currentHospitalId: number;
  private currentMessageId: number;

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
    this.messages = new Map();

    this.currentUserId = 1;
    this.currentMedicalReportId = 1;
    this.currentMedicalOrderId = 1;
    this.currentPrescriptionId = 1;
    this.currentParameterId = 1;
    this.currentAppointmentId = 1;
    this.currentReminderId = 1;
    this.currentHospitalId = 1;
    this.currentMessageId = 1;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find((user) => user.email === email);
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
    const totalPatients = Array.from(this.users.values()).filter(
      (user) => user.role === "patient"
    ).length;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const appointmentsToday = Array.from(this.appointments.values()).filter(
      (appointment) =>
        appointment.doctorId === doctorId &&
        new Date(appointment.date) >= todayStart &&
        new Date(appointment.date) <= todayEnd
    ).length;

    const pendingReports = Array.from(this.medicalReports.values()).filter(
      (report) => report.doctorId === doctorId
    ).length;

    const prescriptionsIssued = Array.from(this.prescriptions.values()).filter(
      (prescription) => prescription.doctorId === doctorId
    ).length;

    return {
      totalPatients,
      appointmentsToday,
      pendingReports,
      prescriptionsIssued,
    };
  }

  async getRecentPatients(doctorId: number): Promise<any[]> {
    // Get patient IDs from appointments with this doctor
    const patientIds = new Set(
      Array.from(this.appointments.values())
        .filter((appointment) => appointment.doctorId === doctorId)
        .map((appointment) => appointment.patientId)
    );

    // Get patients with these IDs
    const patients = Array.from(patientIds)
      .map((patientId) => {
        const user = this.users.get(patientId);
        if (!user || user.role !== "patient") return null;

        // Get the most recent appointment for this patient with this doctor
        const latestAppointment = Array.from(this.appointments.values())
          .filter((a) => a.patientId === patientId && a.doctorId === doctorId)
          .sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          )[0];

        // Set a random status for demo purposes
        const statuses = ["stable", "critical", "follow-up"];
        const randomStatus =
          statuses[Math.floor(Math.random() * statuses.length)];

        return {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          age: 30 + Math.floor(Math.random() * 50), // Random age for demo
          gender: Math.random() > 0.5 ? "Male" : "Female", // Random gender for demo
          status: randomStatus,
          lastVisit: latestAppointment
            ? new Date(latestAppointment.date).toLocaleDateString()
            : "N/A",
        };
      })
      .filter((p) => p !== null) as any[];

    // Return up to 3 recent patients
    return patients.slice(0, 3);
  }

  async getAllPatients(): Promise<any[]> {
    return Array.from(this.users.values())
      .filter((user) => user.role === "patient")
      .map((user) => ({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        // Additional fields for demo
        age: 30 + Math.floor(Math.random() * 50),
        gender: Math.random() > 0.5 ? "Male" : "Female",
      }));
  }

  async getPatients(tab: string, page: number, search: string): Promise<any[]> {
    let patients = Array.from(this.users.values()).filter(
      (user) => user.role === "patient"
    );

    // Apply search filter if provided
    if (search) {
      const searchLower = search.toLowerCase();
      patients = patients.filter(
        (patient) =>
          patient.firstName.toLowerCase().includes(searchLower) ||
          patient.lastName.toLowerCase().includes(searchLower) ||
          patient.email.toLowerCase().includes(searchLower)
      );
    }

    // Apply tab filter
    const statuses = ["stable", "critical", "active", "follow-up"];

    // Map patients to include additional info
    const patientsWithDetails = patients.map((patient) => {
      const randomStatus =
        statuses[Math.floor(Math.random() * statuses.length)];

      return {
        id: patient.id,
        firstName: patient.firstName,
        lastName: patient.lastName,
        email: patient.email,
        age: 30 + Math.floor(Math.random() * 50),
        gender: Math.random() > 0.5 ? "Male" : "Female",
        status: randomStatus,
        lastVisit: new Date(
          Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000
        ).toLocaleDateString(),
      };
    });

    // Filter by tab
    let filteredPatients = patientsWithDetails;
    if (tab === "active") {
      filteredPatients = patientsWithDetails.filter(
        (p) => p.status === "active"
      );
    } else if (tab === "critical") {
      filteredPatients = patientsWithDetails.filter(
        (p) => p.status === "critical"
      );
    }

    // Apply pagination
    const pageSize = 10;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    return filteredPatients.slice(startIndex, endIndex);
  }

  async getDoctorTodayAppointments(
    doctorId: number,
    hospitalId?: number
  ): Promise<any[]> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    let todayAppointments = Array.from(this.appointments.values()).filter(
      (appointment) =>
        appointment.doctorId === doctorId &&
        new Date(appointment.date) >= todayStart &&
        new Date(appointment.date) <= todayEnd
    );

    // Filter by hospital if specified
    if (hospitalId) {
      todayAppointments = todayAppointments.filter(
        (a) => a.hospitalId === hospitalId
      );
    }

    // Sort by time
    todayAppointments = todayAppointments.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Fetch and prepare related data for each appointment
    return Promise.all(
      todayAppointments.map(async (appointment) => {
        const patient = this.users.get(appointment.patientId);
        const hospital = await this.getHospital(appointment.hospitalId);

        return {
          ...appointment,
          patient: patient
            ? {
                id: patient.id,
                firstName: patient.firstName,
                lastName: patient.lastName,
                dateOfBirth: patient.dateOfBirth,
                phone: patient.phone,
              }
            : undefined,
          hospital: hospital
            ? {
                id: hospital.id,
                name: hospital.name,
                type: hospital.type,
                municipality: hospital.municipality,
                address: hospital.address,
              }
            : undefined,
        };
      })
    );
  }

  async getDoctorAppointments(
    doctorId: number,
    tab: string,
    date?: string,
    hospitalId?: number
  ): Promise<any[]> {
    let appointments = Array.from(this.appointments.values()).filter(
      (appointment) => appointment.doctorId === doctorId
    );

    // Filter by hospital if specified
    if (hospitalId) {
      appointments = appointments.filter((a) => a.hospitalId === hospitalId);
    }

    // Filter by tab
    if (tab === "upcoming") {
      appointments = appointments.filter(
        (a) =>
          new Date(a.date).getTime() >= new Date().getTime() &&
          (a.status === "pending" || a.status === "approved")
      );
    } else if (tab === "completed") {
      appointments = appointments.filter((a) => a.status === "completed");
    } else if (tab === "cancelled") {
      appointments = appointments.filter((a) => a.status === "cancelled");
    } else if (tab === "pending") {
      appointments = appointments.filter((a) => a.status === "pending");
    } else if (tab === "rejected") {
      appointments = appointments.filter((a) => a.status === "rejected");
    }

    // Filter by date if provided
    if (date) {
      const filterDate = new Date(date);
      filterDate.setHours(0, 0, 0, 0);
      const filterDateEnd = new Date(date);
      filterDateEnd.setHours(23, 59, 59, 999);

      appointments = appointments.filter((a) => {
        const appointmentDate = new Date(a.date);
        return (
          appointmentDate >= filterDate && appointmentDate <= filterDateEnd
        );
      });
    }

    // Sort by date
    appointments.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Fetch and prepare related data for each appointment
    return Promise.all(
      appointments.map(async (appointment) => {
        const patient = this.users.get(appointment.patientId);
        const hospital = await this.getHospital(appointment.hospitalId);

        return {
          ...appointment,
          patient: patient
            ? {
                id: patient.id,
                firstName: patient.firstName,
                lastName: patient.lastName,
                dateOfBirth: patient.dateOfBirth,
                phone: patient.phone,
              }
            : undefined,
          hospital: hospital
            ? {
                id: hospital.id,
                name: hospital.name,
                type: hospital.type,
                municipality: hospital.municipality,
              }
            : undefined,
        };
      })
    );
  }

  async getDoctorMedicalRecords(
    doctorId: number,
    tab: string,
    page: number,
    search: string
  ): Promise<any[]> {
    // Combine medical reports and orders
    const reports = Array.from(this.medicalReports.values())
      .filter((report) => report.doctorId === doctorId)
      .map((report) => ({ ...report, type: "report" }));

    const orders = Array.from(this.medicalOrders.values())
      .filter((order) => order.doctorId === doctorId)
      .map((order) => ({ ...order, type: "order" }));

    let records = [...reports, ...orders];

    // Apply search filter if provided
    if (search) {
      const searchLower = search.toLowerCase();
      records = records.filter((record) =>
        record.title.toLowerCase().includes(searchLower)
      );
    }

    // Apply tab filter
    if (tab === "reports") {
      records = records.filter((record) => record.type === "report");
    } else if (tab === "orders") {
      records = records.filter((record) => record.type === "order");
    }

    // Sort by creation date (newest first)
    records.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Apply pagination
    const pageSize = 10;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    // Enrich with patient information
    return records.slice(startIndex, endIndex).map((record) => {
      const patient = this.users.get(record.patientId);

      return {
        ...record,
        patient: patient
          ? {
              firstName: patient.firstName,
              lastName: patient.lastName,
            }
          : undefined,
      };
    });
  }

  async getDoctorPrescriptions(
    doctorId: number,
    tab: string,
    page: number,
    search: string
  ): Promise<any[]> {
    let prescriptions = Array.from(this.prescriptions.values()).filter(
      (prescription) => prescription.doctorId === doctorId
    );

    // Apply search filter if provided
    if (search) {
      const searchLower = search.toLowerCase();
      prescriptions = prescriptions.filter((prescription) =>
        prescription.medication.toLowerCase().includes(searchLower)
      );
    }

    // Apply tab filter
    if (tab === "active") {
      prescriptions = prescriptions.filter((p) => p.status === "active");
    } else if (tab === "completed") {
      prescriptions = prescriptions.filter((p) => p.status === "completed");
    }

    // Sort by start date (newest first)
    prescriptions.sort(
      (a, b) =>
        new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    );

    // Apply pagination
    const pageSize = 10;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    // Enrich with patient information
    return prescriptions.slice(startIndex, endIndex).map((prescription) => {
      const patient = this.users.get(prescription.patientId);

      return {
        ...prescription,
        patient: patient
          ? {
              firstName: patient.firstName,
              lastName: patient.lastName,
            }
          : undefined,
      };
    });
  }

  // Medical report methods
  async createMedicalReport(
    insertReport: InsertMedicalReport
  ): Promise<MedicalReport> {
    const id = this.currentMedicalReportId++;
    const createdAt = new Date();
    const report: MedicalReport = { ...insertReport, id, createdAt };
    this.medicalReports.set(id, report);
    return report;
  }

  // Medical order methods
  async createMedicalOrder(
    insertOrder: InsertMedicalOrder
  ): Promise<MedicalOrder> {
    const id = this.currentMedicalOrderId++;
    const createdAt = new Date();
    const order: MedicalOrder = { ...insertOrder, id, createdAt };
    this.medicalOrders.set(id, order);
    return order;
  }

  // Prescription methods
  async createPrescription(
    insertPrescription: InsertPrescription
  ): Promise<Prescription> {
    const id = this.currentPrescriptionId++;
    const createdAt = new Date();
    const prescription: Prescription = { ...insertPrescription, id, createdAt };
    this.prescriptions.set(id, prescription);
    return prescription;
  }

  // Patient methods
  async getPatientStats(patientId: number): Promise<any> {
    const upcomingAppointments = Array.from(this.appointments.values()).filter(
      (appointment) =>
        appointment.patientId === patientId &&
        new Date(appointment.date).getTime() >= new Date().getTime() &&
        (appointment.status === "pending" || appointment.status === "approved")
    ).length;

    const activeMedications = Array.from(this.prescriptions.values()).filter(
      (prescription) =>
        prescription.patientId === patientId && prescription.status === "active"
    ).length;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const remindersToday = Array.from(this.reminders.values()).filter(
      (reminder) =>
        reminder.userId === patientId &&
        !reminder.completed &&
        new Date(reminder.dueDate) >= today &&
        new Date(reminder.dueDate) < tomorrow
    ).length;

    const newReports = Array.from(this.medicalReports.values()).filter(
      (report) =>
        report.patientId === patientId &&
        // Consider reports from last 7 days as "new"
        new Date(report.createdAt).getTime() >=
          new Date().getTime() - 7 * 24 * 60 * 60 * 1000
    ).length;

    return {
      upcomingAppointments,
      activeMedications,
      remindersToday,
      newReports,
    };
  }

  async getPatientUpcomingAppointments(patientId: number): Promise<any[]> {
    const upcomingAppointments = Array.from(this.appointments.values())
      .filter(
        (appointment) =>
          appointment.patientId === patientId &&
          new Date(appointment.date).getTime() >= new Date().getTime() &&
          (appointment.status === "pending" ||
            appointment.status === "approved")
      )
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Fetch and prepare related data for each appointment
    return Promise.all(
      upcomingAppointments.map(async (appointment) => {
        const doctor = this.users.get(appointment.doctorId);
        const hospital = await this.getHospital(appointment.hospitalId);

        return {
          ...appointment,
          doctor: doctor
            ? {
                id: doctor.id,
                firstName: doctor.firstName,
                lastName: doctor.lastName,
                specialty: doctor.specialty,
              }
            : undefined,
          hospital: hospital
            ? {
                id: hospital.id,
                name: hospital.name,
                type: hospital.type,
                municipality: hospital.municipality,
              }
            : undefined,
        };
      })
    );
  }

  async getAvailableDoctors(hospitalId?: number): Promise<any[]> {
    let doctors = Array.from(this.users.values()).filter(
      (user) => user.role === "doctor"
    );

    // If hospital ID is provided, filter doctors by that hospital
    if (hospitalId) {
      const hospitalDoctorIds = Array.from(this.hospitalDoctors.values())
        .filter((relation) => relation.hospitalId === hospitalId)
        .map((relation) => relation.doctorId);

      doctors = doctors.filter((doctor) =>
        hospitalDoctorIds.includes(doctor.id)
      );
    }

    // Map to return format with doctor details and hospital info
    return Promise.all(
      doctors.map(async (doctor) => {
        // If hospital filter was applied, get just that hospital
        // Otherwise get all doctor's hospitals to show their primary affiliation
        const hospitals = hospitalId
          ? [await this.getHospital(hospitalId)]
          : await this.getDoctorHospitals(doctor.id);

        const primaryHospital = hospitals.length > 0 ? hospitals[0] : null;

        return {
          id: doctor.id,
          firstName: doctor.firstName,
          lastName: doctor.lastName,
          specialty:
            doctor.specialty ||
            ["Cardiology", "Neurology", "General Practice", "Dermatology"][
              Math.floor(Math.random() * 4)
            ],
          hospital: primaryHospital
            ? {
                id: primaryHospital.id,
                name: primaryHospital.name,
                type: primaryHospital.type,
                municipality: primaryHospital.municipality,
              }
            : null,
        };
      })
    );
  }

  async getPatientAppointments(
    patientId: number,
    tab: string,
    date?: string,
    hospitalId?: number
  ): Promise<any[]> {
    let appointments = Array.from(this.appointments.values()).filter(
      (appointment) => appointment.patientId === patientId
    );

    // Filter by hospital if specified
    if (hospitalId) {
      appointments = appointments.filter((a) => a.hospitalId === hospitalId);
    }

    // Filter by tab
    if (tab === "upcoming") {
      appointments = appointments.filter(
        (a) =>
          new Date(a.date).getTime() >= new Date().getTime() &&
          (a.status === "pending" || a.status === "approved")
      );
    } else if (tab === "completed") {
      appointments = appointments.filter((a) => a.status === "completed");
    } else if (tab === "cancelled") {
      appointments = appointments.filter((a) => a.status === "cancelled");
    } else if (tab === "pending") {
      appointments = appointments.filter((a) => a.status === "pending");
    } else if (tab === "rejected") {
      appointments = appointments.filter((a) => a.status === "rejected");
    }

    // Filter by date if provided
    if (date) {
      const filterDate = new Date(date);
      filterDate.setHours(0, 0, 0, 0);
      const filterDateEnd = new Date(date);
      filterDateEnd.setHours(23, 59, 59, 999);

      appointments = appointments.filter((a) => {
        const appointmentDate = new Date(a.date);
        return (
          appointmentDate >= filterDate && appointmentDate <= filterDateEnd
        );
      });
    }

    // Sort by date
    appointments.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Fetch and prepare related data for each appointment
    return Promise.all(
      appointments.map(async (appointment) => {
        const doctor = this.users.get(appointment.doctorId);
        const hospital = await this.getHospital(appointment.hospitalId);

        return {
          ...appointment,
          doctor: doctor
            ? {
                id: doctor.id,
                firstName: doctor.firstName,
                lastName: doctor.lastName,
                specialty: doctor.specialty,
              }
            : undefined,
          hospital: hospital
            ? {
                id: hospital.id,
                name: hospital.name,
                type: hospital.type,
                municipality: hospital.municipality,
              }
            : undefined,
        };
      })
    );
  }

  async createAppointment(
    insertAppointment: InsertAppointment
  ): Promise<Appointment> {
    const id = this.currentAppointmentId++;
    const createdAt = new Date();

    // Validate hospital exists
    const hospital = await this.getHospital(insertAppointment.hospitalId);
    if (!hospital) {
      throw new Error("Hospital not found");
    }

    // Validate doctor exists
    const doctor = await this.getUser(insertAppointment.doctorId);
    if (!doctor || doctor.role !== "doctor") {
      throw new Error("Doctor not found or invalid");
    }

    // Validate patient exists
    const patient = await this.getUser(insertAppointment.patientId);
    if (!patient || patient.role !== "patient") {
      throw new Error("Patient not found or invalid");
    }

    // Check if doctor is associated with the hospital
    const doctorHospitals = await this.getDoctorHospitals(
      insertAppointment.doctorId
    );
    if (!doctorHospitals.some((h) => h.id === insertAppointment.hospitalId)) {
      throw new Error("Doctor is not associated with this hospital");
    }

    const appointment: Appointment = {
      ...insertAppointment,
      id,
      createdAt,
      status: insertAppointment.status || "pending", // Default to pending if not specified
    };

    this.appointments.set(id, appointment);
    return appointment;
  }

  async getPatientParameters(
    patientId: number,
    hospitalId?: number
  ): Promise<any[]> {
    return Array.from(this.parameters.values())
      .filter((parameter) => {
        // Base filter - must match patient
        const patientMatch = parameter.patientId === patientId;

        // Hospital filter (if specified)
        if (hospitalId) {
          // Include parameters with matching hospitalId or null/undefined hospitalId
          return (
            patientMatch &&
            (parameter.hospitalId === hospitalId || !parameter.hospitalId)
          );
        }

        return patientMatch;
      })
      .sort(
        (a, b) =>
          new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
      );
  }

  async getPatientRecentParameters(
    patientId: number,
    hospitalId?: number
  ): Promise<any[]> {
    // Group parameters by type
    const parametersByType = new Map<string, Parameter[]>();

    Array.from(this.parameters.values())
      .filter((parameter) => {
        // Base filter - must match patient
        const patientMatch = parameter.patientId === patientId;

        // Hospital filter (if specified)
        if (hospitalId) {
          // Include parameters with matching hospitalId or null/undefined hospitalId
          return (
            patientMatch &&
            (parameter.hospitalId === hospitalId || !parameter.hospitalId)
          );
        }

        return patientMatch;
      })
      .forEach((parameter) => {
        if (!parametersByType.has(parameter.type)) {
          parametersByType.set(parameter.type, []);
        }
        parametersByType.get(parameter.type)!.push(parameter);
      });

    // Get most recent parameter of each type
    const recentParameters: Parameter[] = [];

    parametersByType.forEach((parameters) => {
      // Sort by recordedAt (newest first)
      parameters.sort(
        (a, b) =>
          new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
      );

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

  async getPatientMedicalRecords(
    patientId: number,
    tab: string,
    page: number,
    search: string,
    hospitalId?: number
  ): Promise<any[]> {
    // Get hospital-doctor relationships to filter records by doctors in specified hospital
    let doctorIdsInHospital: number[] = [];

    if (hospitalId) {
      // Find all doctors working at this hospital
      Array.from(this.hospitalDoctors.values())
        .filter((relation) => relation.hospitalId === hospitalId)
        .forEach((relation) => doctorIdsInHospital.push(relation.doctorId));
    }

    // Combine medical reports and orders
    const reports = Array.from(this.medicalReports.values())
      .filter((report) => {
        const matchesPatient = report.patientId === patientId;

        // If hospital filter is applied, only include reports from doctors at that hospital
        if (hospitalId) {
          return (
            matchesPatient && doctorIdsInHospital.includes(report.doctorId)
          );
        }

        return matchesPatient;
      })
      .map((report) => ({ ...report, type: "report" }));

    const orders = Array.from(this.medicalOrders.values())
      .filter((order) => {
        const matchesPatient = order.patientId === patientId;

        // If hospital filter is applied, only include orders from doctors at that hospital
        if (hospitalId) {
          return matchesPatient && doctorIdsInHospital.includes(order.doctorId);
        }

        return matchesPatient;
      })
      .map((order) => ({ ...order, type: "order" }));

    let records = [...reports, ...orders];

    // Apply search filter if provided
    if (search) {
      const searchLower = search.toLowerCase();
      records = records.filter((record) =>
        record.title.toLowerCase().includes(searchLower)
      );
    }

    // Apply tab filter
    if (tab === "reports") {
      records = records.filter((record) => record.type === "report");
    } else if (tab === "orders") {
      records = records.filter((record) => record.type === "order");
    }

    // Sort by creation date (newest first)
    records.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Apply pagination
    const pageSize = 10;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    // Enrich with doctor information
    return records.slice(startIndex, endIndex).map((record) => {
      const doctor = this.users.get(record.doctorId);

      return {
        ...record,
        doctor: doctor
          ? {
              id: doctor.id,
              firstName: doctor.firstName,
              lastName: doctor.lastName,
            }
          : undefined,
      };
    });
  }

  async getPatientMedications(
    patientId: number,
    tab: string,
    page: number,
    search: string,
    hospitalId?: number
  ): Promise<any[]> {
    // Get hospital-doctor relationships to filter records by doctors in specified hospital
    let doctorIdsInHospital: number[] = [];

    if (hospitalId) {
      // Find all doctors working at this hospital
      Array.from(this.hospitalDoctors.values())
        .filter((relation) => relation.hospitalId === hospitalId)
        .forEach((relation) => doctorIdsInHospital.push(relation.doctorId));
    }

    let medications = Array.from(this.prescriptions.values()).filter(
      (prescription) => {
        const matchesPatient = prescription.patientId === patientId;

        // If hospital filter is applied, only include prescriptions from doctors at that hospital
        if (hospitalId) {
          return (
            matchesPatient &&
            doctorIdsInHospital.includes(prescription.doctorId)
          );
        }

        return matchesPatient;
      }
    );

    // Apply search filter if provided
    if (search) {
      const searchLower = search.toLowerCase();
      medications = medications.filter((medication) =>
        medication.medication.toLowerCase().includes(searchLower)
      );
    }

    // Apply tab filter
    if (tab === "active") {
      medications = medications.filter((m) => m.status === "active");
    } else if (tab === "completed") {
      medications = medications.filter((m) => m.status === "completed");
    }

    // Sort by start date (newest first)
    medications.sort(
      (a, b) =>
        new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    );

    // Apply pagination
    const pageSize = 10;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    // Enrich with doctor information
    return medications.slice(startIndex, endIndex).map((medication) => {
      const doctor = this.users.get(medication.doctorId);

      return {
        ...medication,
        doctor: doctor
          ? {
              id: doctor.id,
              firstName: doctor.firstName,
              lastName: doctor.lastName,
            }
          : undefined,
      };
    });
  }

  async getPatientReminders(
    patientId: number,
    hospitalId?: number
  ): Promise<any[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    nextWeek.setHours(23, 59, 59, 999);

    // Get hospital-specific doctor appointments that have reminders
    let remindersFromAppointments: Reminder[] = [];
    if (hospitalId) {
      // First get appointments for this patient at this hospital
      const appointments = Array.from(this.appointments.values()).filter(
        (appointment) =>
          appointment.patientId === patientId &&
          appointment.hospitalId === hospitalId
      );

      // Then find any reminders related to appointment followups
      // Here we're connecting based on titles that may contain the word "followup"
      // In a real app, there would be a direct relationship between reminders and appointments
      if (appointments.length > 0) {
        const appointmentReminders = Array.from(this.reminders.values()).filter(
          (reminder) =>
            reminder.userId === patientId &&
            !reminder.completed &&
            appointments.some(
              (apt) =>
                reminder.title.toLowerCase().includes("followup") &&
                reminder.title.toLowerCase().includes(apt.title.toLowerCase())
            ) &&
            new Date(reminder.dueDate) >= today &&
            new Date(reminder.dueDate) <= nextWeek
        );

        remindersFromAppointments = appointmentReminders;
      }
    }

    // Get regular reminders
    const regularReminders = Array.from(this.reminders.values()).filter(
      (reminder) =>
        reminder.userId === patientId &&
        !reminder.completed &&
        new Date(reminder.dueDate) >= today &&
        new Date(reminder.dueDate) <= nextWeek &&
        // Apply hospital filter if needed
        (!hospitalId ||
          reminder.hospitalId === hospitalId ||
          // Include non-hospital specific reminders that aren't followups
          (!reminder.hospitalId &&
            !reminder.title.toLowerCase().includes("followup")))
    );

    // Combine and sort all reminders
    const combinedReminders = hospitalId
      ? [...remindersFromAppointments, ...regularReminders]
      : regularReminders;

    return combinedReminders.sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    );
  }

  async getPatientFilteredReminders(
    patientId: number,
    tab: string,
    page: number,
    search: string,
    hospitalId?: number
  ): Promise<any[]> {
    // Get hospital-specific doctor appointments that have reminders
    let hospitalAppointments: Appointment[] = [];
    if (hospitalId) {
      hospitalAppointments = Array.from(this.appointments.values()).filter(
        (appointment) =>
          appointment.patientId === patientId &&
          appointment.hospitalId === hospitalId
      );
    }

    let reminders = Array.from(this.reminders.values()).filter((reminder) => {
      const matchesPatient = reminder.userId === patientId;

      // If hospital filter is applied, filter by hospitalId or appointment relation
      if (hospitalId) {
        // Check if reminder has the matching hospitalId directly
        const hasMatchingHospitalId = reminder.hospitalId === hospitalId;

        // Check if reminder is related to a hospital appointment (for followups)
        const isHospitalRelated =
          reminder.title.toLowerCase().includes("followup") &&
          hospitalAppointments.some((apt) =>
            reminder.title.toLowerCase().includes(apt.title.toLowerCase())
          );

        // Include hospital-specific reminders or appointment-related reminders
        return matchesPatient && (hasMatchingHospitalId || isHospitalRelated);
      }

      return matchesPatient;
    });

    // Apply search filter if provided
    if (search) {
      const searchLower = search.toLowerCase();
      reminders = reminders.filter(
        (reminder) =>
          reminder.title.toLowerCase().includes(searchLower) ||
          (reminder.description &&
            reminder.description.toLowerCase().includes(searchLower))
      );
    }

    // Apply tab filter
    if (tab === "active") {
      reminders = reminders.filter((r) => !r.completed);
    } else if (tab === "completed") {
      reminders = reminders.filter((r) => r.completed);
    }

    // Sort by due date (closest first)
    reminders.sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    );

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
      completed: false, // Default to not completed
    };
    this.reminders.set(id, reminder);
    return reminder;
  }

  async completeReminder(
    reminderId: number,
    userId: number
  ): Promise<Reminder> {
    const reminder = this.reminders.get(reminderId);

    if (!reminder) {
      throw new Error("Reminder not found");
    }

    if (reminder.userId !== userId) {
      throw new Error("Unauthorized");
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
      createdAt,
    };

    this.hospitals.set(id, newHospital);
    return newHospital;
  }

  async getAllHospitals(): Promise<Hospital[]> {
    const { data, error } = await supabase.from("hospitals").select();

    if (error) {
      throw error;
    }

    return data;
  }

  async getHospitalsByMunicipality(municipality: string): Promise<Hospital[]> {}

  async getHospitalDoctors(hospitalId: number): Promise<any[]> {
    const hospital = await this.getHospital(hospitalId);
    if (!hospital) {
      throw new Error("Hospital not found");
    }

    const doctorIds = Array.from(this.hospitalDoctors.values())
      .filter((relation) => relation.hospitalId === hospitalId)
      .map((relation) => relation.doctorId);

    const doctors = await Promise.all(
      doctorIds.map(async (doctorId) => {
        const doctor = await this.getUser(doctorId);
        return doctor;
      })
    );

    return doctors.filter((doctor) => doctor !== undefined);
  }

  async addDoctorToHospital(
    hospitalDoctor: InsertHospitalDoctor
  ): Promise<HospitalDoctor> {
    const { hospitalId, doctorId } = hospitalDoctor;

    // Validate hospital exists
    const hospital = await this.getHospital(hospitalId);
    if (!hospital) {
      throw new Error("Hospital not found");
    }

    // Validate doctor exists and is a doctor
    const doctor = await this.getUser(doctorId);
    if (!doctor || doctor.role !== "doctor") {
      throw new Error("Doctor not found or user is not a doctor");
    }

    const key = `${hospitalId}:${doctorId}`;
    const relation: HospitalDoctor = {
      ...hospitalDoctor,
      createdAt: new Date(),
    };

    this.hospitalDoctors.set(key, relation);
    return relation;
  }

  async removeDoctorFromHospital(
    hospitalId: number,
    doctorId: number
  ): Promise<void> {
    const key = `${hospitalId}:${doctorId}`;
    if (!this.hospitalDoctors.has(key)) {
      throw new Error("Doctor is not associated with this hospital");
    }

    this.hospitalDoctors.delete(key);
  }

  async getHospitalPatients(hospitalId: number): Promise<any[]> {
    const hospital = await this.getHospital(hospitalId);
    if (!hospital) {
      throw new Error("Hospital not found");
    }

    const patientIds = Array.from(this.hospitalPatients.values())
      .filter((relation) => relation.hospitalId === hospitalId)
      .map((relation) => relation.patientId);

    const patients = await Promise.all(
      patientIds.map(async (patientId) => {
        const patient = await this.getUser(patientId);
        return patient;
      })
    );

    return patients.filter((patient) => patient !== undefined);
  }

  async addPatientToHospital(
    hospitalPatient: InsertHospitalPatient
  ): Promise<HospitalPatient> {
    const { hospitalId, patientId } = hospitalPatient;

    // Validate hospital exists
    const hospital = await this.getHospital(hospitalId);
    if (!hospital) {
      throw new Error("Hospital not found");
    }

    // Validate patient exists and is a patient
    const patient = await this.getUser(patientId);
    if (!patient || patient.role !== "patient") {
      throw new Error("Patient not found or user is not a patient");
    }

    const key = `${hospitalId}:${patientId}`;
    const relation: HospitalPatient = {
      ...hospitalPatient,
      createdAt: new Date(),
    };

    this.hospitalPatients.set(key, relation);
    return relation;
  }

  async removePatientFromHospital(
    hospitalId: number,
    patientId: number
  ): Promise<void> {
    const key = `${hospitalId}:${patientId}`;
    if (!this.hospitalPatients.has(key)) {
      throw new Error("Patient is not associated with this hospital");
    }

    this.hospitalPatients.delete(key);
  }

  async getDoctorHospitals(doctorId: number): Promise<Hospital[]> {
    const hospitalIds = Array.from(this.hospitalDoctors.values())
      .filter((relation) => relation.doctorId === doctorId)
      .map((relation) => relation.hospitalId);

    const hospitals = await Promise.all(
      hospitalIds.map(async (hospitalId) => {
        const hospital = await this.getHospital(hospitalId);
        return hospital;
      })
    );

    return hospitals.filter(
      (hospital): hospital is Hospital => hospital !== undefined
    );
  }

  async getPatientHospitals(patientId: number): Promise<Hospital[]> {
    const hospitalIds = Array.from(this.hospitalPatients.values())
      .filter((relation) => relation.patientId === patientId)
      .map((relation) => relation.hospitalId);

    const hospitals = await Promise.all(
      hospitalIds.map(async (hospitalId) => {
        const hospital = await this.getHospital(hospitalId);
        return hospital;
      })
    );

    return hospitals.filter(
      (hospital): hospital is Hospital => hospital !== undefined
    );
  }

  async getHospitalDepartments(hospitalId: number): Promise<string[]> {
    const hospital = await this.getHospital(hospitalId);
    return hospital?.departments || [];
  }

  // Message methods
  async getUserMessages(
    userId: number,
    tab: string,
    page: number,
    search: string
  ): Promise<any[]> {
    // Get all messages where the user is the recipient
    const messages = [...this.messages.values()].filter(
      (message) =>
        message.recipientId === userId &&
        (tab === "all" || message.status === tab) &&
        (!search ||
          message.subject.toLowerCase().includes(search.toLowerCase()) ||
          message.content.toLowerCase().includes(search.toLowerCase()))
    );

    // Sort by date, newest first
    messages.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Get sender details for each message
    const messagesWithSenders = await Promise.all(
      messages.map(async (message) => {
        const sender = await this.getUser(message.senderId);
        return {
          ...message,
          sender: {
            id: sender?.id,
            name: `${sender?.firstName} ${sender?.lastName}`,
            role: sender?.role,
          },
        };
      })
    );

    // Paginate results
    const pageSize = 10;
    const startIndex = (page - 1) * pageSize;
    return messagesWithSenders.slice(startIndex, startIndex + pageSize);
  }

  async getUserSentMessages(
    userId: number,
    page: number,
    search: string
  ): Promise<any[]> {
    // Get all messages where the user is the sender
    const messages = [...this.messages.values()].filter(
      (message) =>
        message.senderId === userId &&
        (!search ||
          message.subject.toLowerCase().includes(search.toLowerCase()) ||
          message.content.toLowerCase().includes(search.toLowerCase()))
    );

    // Sort by date, newest first
    messages.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Get recipient details for each message
    const messagesWithRecipients = await Promise.all(
      messages.map(async (message) => {
        const recipient = await this.getUser(message.recipientId);
        return {
          ...message,
          recipient: {
            id: recipient?.id,
            name: `${recipient?.firstName} ${recipient?.lastName}`,
            role: recipient?.role,
          },
        };
      })
    );

    // Paginate results
    const pageSize = 10;
    const startIndex = (page - 1) * pageSize;
    return messagesWithRecipients.slice(startIndex, startIndex + pageSize);
  }

  async getMessageThread(parentMessageId: number): Promise<any[]> {
    // Get the parent message
    const parentMessage = this.messages.get(parentMessageId);
    if (!parentMessage) {
      return [];
    }

    // Get all replies to this message
    const replies = [...this.messages.values()].filter(
      (message) => message.parentId === parentMessageId
    );

    // Sort by date, oldest first
    const thread = [parentMessage, ...replies].sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
    );

    // Get user details for each message
    return Promise.all(
      thread.map(async (message) => {
        const sender = await this.getUser(message.senderId);
        const recipient = await this.getUser(message.recipientId);
        return {
          ...message,
          sender: {
            id: sender?.id,
            name: `${sender?.firstName} ${sender?.lastName}`,
            role: sender?.role,
          },
          recipient: {
            id: recipient?.id,
            name: `${recipient?.firstName} ${recipient?.lastName}`,
            role: recipient?.role,
          },
        };
      })
    );
  }

  async getMessage(messageId: number): Promise<Message | undefined> {
    return this.messages.get(messageId);
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.currentMessageId++;
    const createdAt = new Date();

    const message: Message = {
      ...insertMessage,
      id,
      createdAt,
    };

    this.messages.set(id, message);
    return message;
  }

  async updateMessageStatus(
    messageId: number,
    status: string
  ): Promise<Message> {
    const message = this.messages.get(messageId);
    if (!message) {
      throw new Error(`Message with ID ${messageId} not found`);
    }

    const updatedMessage: Message = {
      ...message,
      status: status as "unread" | "read" | "archived",
    };

    this.messages.set(messageId, updatedMessage);
    return updatedMessage;
  }

  // Appointment methods
  async getAppointment(id: number): Promise<Appointment | undefined> {
    return this.appointments.get(id);
  }

  async updateAppointmentStatus(
    appointmentId: number,
    status: string,
    updatedBy: number
  ): Promise<Appointment> {
    const appointment = await this.getAppointment(appointmentId);
    if (!appointment) {
      throw new Error("Appointment not found");
    }

    // Check if the person updating the appointment is either the doctor or the patient
    if (
      appointment.doctorId !== updatedBy &&
      appointment.patientId !== updatedBy
    ) {
      throw new Error("Not authorized to update this appointment");
    }

    const updatedAppointment: Appointment = {
      ...appointment,
      status: status as any, // Type casting for now, will be fixed with proper enum
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
    address: "123 Medical Dr, New York, NY 10001",
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
    municipality: "New York",
  });

  const hospitalUser = await storage.createUser({
    email: "hospital@example.com",
    password: "password123",
    firstName: "General",
    lastName: "Hospital",
    role: "hospital",
    phone: "212-555-1000",
    address: "123 Main Street, New York, NY 10001",
    municipality: "New York",
  });

  // Create sample hospitals
  const generalHospital = await storage.createHospital({
    name: "General Hospital",
    type: "public",
    municipality: "New York",
    location: "40.7128,-74.0060", // Latitude, longitude for New York
    address: "123 Main Street, New York, NY 10001",
    phone: "212-555-1000",
    email: "info@generalhospital.org",
    website: "https://www.generalhospital.org",
    capacity: 500,
    departments: [
      "Emergency",
      "Cardiology",
      "Neurology",
      "Pediatrics",
      "Oncology",
      "Surgery",
      "Internal Medicine",
    ],
    services: [
      "Emergency Care",
      "Medical Imaging",
      "Laboratory Services",
      "Rehabilitation",
      "Mental Health",
    ],
    adminId: hospitalUser.id,
  });

  const specialtyClinic = await storage.createHospital({
    name: "Specialty Medical Center",
    type: "private",
    municipality: "New York",
    location: "40.7306,-73.9352",
    address: "456 Park Avenue, New York, NY 10022",
    phone: "212-555-2000",
    email: "contact@specialtymedical.com",
    website: "https://www.specialtymedical.com",
    capacity: 200,
    departments: [
      "Orthopedics",
      "Dermatology",
      "Ophthalmology",
      "ENT",
      "Urology",
    ],
    services: [
      "Specialized Surgery",
      "Diagnostic Services",
      "Telemedicine",
      "Physical Therapy",
      "Day Procedures",
    ],
  });

  // Create a third hospital
  const communityHealth = await storage.createHospital({
    name: "Community Health Center",
    type: "public",
    municipality: "Brooklyn",
    location: "40.6782,-73.9442",
    address: "789 Community Blvd, Brooklyn, NY 11201",
    phone: "718-555-3000",
    email: "help@communityhealthcenter.org",
    website: "https://www.communityhealthcenter.org",
    capacity: 150,
    departments: [
      "Family Medicine",
      "Pediatrics",
      "OB/GYN",
      "Mental Health",
      "Community Care",
    ],
    services: [
      "Preventive Care",
      "Wellness Programs",
      "Vaccinations",
      "Health Education",
      "Social Services",
    ],
  });

  // Associate doctor with hospitals
  await storage.addDoctorToHospital({
    hospitalId: generalHospital.id,
    doctorId: doctorUser.id,
    assignedBy: null, // System assignment for demo
  });

  await storage.addDoctorToHospital({
    hospitalId: specialtyClinic.id,
    doctorId: doctorUser.id,
    assignedBy: null,
  });

  await storage.addDoctorToHospital({
    hospitalId: communityHealth.id,
    doctorId: doctorUser.id,
    assignedBy: null,
  });

  // Associate patient with hospitals
  await storage.addPatientToHospital({
    hospitalId: generalHospital.id,
    patientId: patientUser.id,
  });

  await storage.addPatientToHospital({
    hospitalId: communityHealth.id,
    patientId: patientUser.id,
  });

  // Create health parameters for patient
  await storage.createParameter({
    patientId: patientUser.id,
    type: "Blood Pressure",
    value: "120/80",
    unit: "mmHg",
    recordedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
  });

  await storage.createParameter({
    patientId: patientUser.id,
    type: "Heart Rate",
    value: "72",
    unit: "bpm",
    recordedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  });

  await storage.createParameter({
    patientId: patientUser.id,
    type: "Temperature",
    value: "98.6",
    unit: "°F",
    recordedAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), // 2 days ago
  });

  await storage.createParameter({
    patientId: patientUser.id,
    type: "Blood Glucose",
    value: "90",
    unit: "mg/dL",
    recordedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
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
    createdBy: patientUser.id,
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
    createdBy: doctorUser.id,
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
    createdBy: patientUser.id,
  });

  // Create medical report
  await storage.createMedicalReport({
    patientId: patientUser.id,
    doctorId: doctorUser.id,
    title: "Annual Physical Examination",
    content:
      "Patient appears healthy. Vitals within normal range. Recommended regular exercise and balanced diet.",
    reportType: "Physical Examination",
    status: "completed",
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
    isActive: true,
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
    category: "medication",
  });

  // Create mock messages for inbox/outbox demonstration
  // Message 1: Doctor to Patient
  const doctorToPatientMsg = await storage.createMessage({
    senderId: doctorUser.id,
    recipientId: patientUser.id,
    subject: "Your Recent Lab Results",
    content:
      "Hello, I've reviewed your recent lab results and everything looks good. Keep up with your current treatment plan and let me know if you have any questions.",
    status: "unread",
  });

  // Message 2: Patient to Doctor
  const patientToDoctorMsg = await storage.createMessage({
    senderId: patientUser.id,
    recipientId: doctorUser.id,
    subject: "Question about medication",
    content:
      "Hi Dr. Smith, I've been experiencing mild dizziness after taking the new medication. Should I be concerned?",
    status: "unread",
  });

  // Message 3: Doctor to Patient - Response in thread
  await storage.createMessage({
    senderId: doctorUser.id,
    recipientId: patientUser.id,
    subject: "Re: Question about medication",
    content:
      "Thank you for letting me know. Dizziness can be a side effect, but if it's persistent or severe, we might need to adjust your dosage. Try taking the medication with food and make sure you're staying hydrated. Let's monitor this for a few more days.",
    status: "unread",
    parentId: patientToDoctorMsg.id,
  });

  // Message 4: Hospital to Doctor
  await storage.createMessage({
    senderId: hospitalUser.id,
    recipientId: doctorUser.id,
    subject: "Department Meeting Schedule",
    content:
      "Dear Dr. Smith, this is a reminder about the upcoming department meeting on Friday at 2 PM. Please confirm your attendance.",
    status: "unread",
  });

  // Message 5: Hospital to Patient
  await storage.createMessage({
    senderId: hospitalUser.id,
    recipientId: patientUser.id,
    subject: "Upcoming Appointment Reminder",
    content:
      "This is a friendly reminder about your upcoming appointment at General Hospital on " +
      new Date(Date.now() + 86400000 * 3).toLocaleDateString() +
      ". Please arrive 15 minutes early to complete any necessary paperwork.",
    status: "unread",
  });

  console.log("Mock data setup completed successfully");
};
