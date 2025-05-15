import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage, setupMockData } from "./storage";
import { setupAuth } from "./auth";
import { setupChatbot } from "./openai";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import {
  loginSchema,
  registerSchema,
  insertMedicalReportSchema,
  insertMedicalOrderSchema,
  insertPrescriptionSchema,
  insertParameterSchema,
  insertAppointmentSchema,
  insertReminderSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize authentication
  setupAuth(app);
  
  // Setup chatbot routes
  setupChatbot(app);
  
  // Authentication Routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const data = registerSchema.parse(req.body);
      
      if (data.password !== data.confirmPassword) {
        return res.status(400).json({ message: "Passwords do not match" });
      }
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(data.email);
      if (existingUser) {
        return res.status(409).json({ message: "User with this email already exists" });
      }
      
      // Create user
      const user = await storage.createUser({
        email: data.email,
        password: data.password, // In real implementation, this should be hashed
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role
      });
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to register user" });
    }
  });
  
  app.post("/api/auth/login", async (req, res) => {
    try {
      const data = loginSchema.parse(req.body);
      
      // Find user by email
      const user = await storage.getUserByEmail(data.email);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      
      // In a real implementation, you would check the password hash
      if (user.password !== data.password) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      
      // Set user in session
      if (req.session) {
        req.session.userId = user.id;
      }
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to log in" });
    }
  });
  
  app.post("/api/auth/logout", (req, res) => {
    req.session?.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to log out" });
      }
      res.clearCookie("connect.sid");
      res.status(200).json({ message: "Logged out successfully" });
    });
  });
  
  app.get("/api/auth/me", async (req, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        req.session.destroy(() => {});
        return res.status(401).json({ message: "User not found" });
      }
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user information" });
    }
  });
  
  // Doctor Routes
  
  // Get doctor dashboard stats
  app.get("/api/doctor/stats", async (req, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user || user.role !== "doctor") {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const stats = await storage.getDoctorStats(user.id);
      res.status(200).json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to get doctor stats" });
    }
  });
  
  // Get recent patients for doctor
  app.get("/api/doctor/patients/recent", async (req, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user || user.role !== "doctor") {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const patients = await storage.getRecentPatients(user.id);
      res.status(200).json(patients);
    } catch (error) {
      res.status(500).json({ message: "Failed to get recent patients" });
    }
  });
  
  // Get all patients for doctor
  app.get("/api/doctor/patients/all", async (req, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user || user.role !== "doctor") {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const patients = await storage.getAllPatients();
      res.status(200).json(patients);
    } catch (error) {
      res.status(500).json({ message: "Failed to get all patients" });
    }
  });
  
  // Get patients with filters for doctor
  app.get("/api/doctor/patients", async (req, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user || user.role !== "doctor") {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const { tab = "all", page = 1, search = "" } = req.query;
      const patients = await storage.getPatients(tab as string, parseInt(page as string), search as string);
      res.status(200).json(patients);
    } catch (error) {
      res.status(500).json({ message: "Failed to get patients" });
    }
  });
  
  // Get patient parameters for doctor
  app.get("/api/doctor/patients/parameters", async (req, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user || user.role !== "doctor") {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const { patientId } = req.query;
      if (!patientId) {
        return res.status(400).json({ message: "Patient ID is required" });
      }
      
      const parameters = await storage.getPatientParameters(parseInt(patientId as string));
      res.status(200).json(parameters);
    } catch (error) {
      res.status(500).json({ message: "Failed to get patient parameters" });
    }
  });
  
  // Get today's appointments for doctor
  app.get("/api/doctor/appointments/today", async (req, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user || user.role !== "doctor") {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const appointments = await storage.getDoctorTodayAppointments(user.id);
      res.status(200).json(appointments);
    } catch (error) {
      res.status(500).json({ message: "Failed to get today's appointments" });
    }
  });
  
  // Get appointments with filters for doctor
  app.get("/api/doctor/appointments", async (req, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user || user.role !== "doctor") {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const { tab = "upcoming", date } = req.query;
      const appointments = await storage.getDoctorAppointments(user.id, tab as string, date as string);
      res.status(200).json(appointments);
    } catch (error) {
      res.status(500).json({ message: "Failed to get appointments" });
    }
  });
  
  // Create medical report
  app.post("/api/doctor/medical-reports", async (req, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user || user.role !== "doctor") {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const data = insertMedicalReportSchema.parse(req.body);
      const report = await storage.createMedicalReport({
        ...data,
        doctorId: user.id
      });
      
      res.status(201).json(report);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to create medical report" });
    }
  });
  
  // Get medical records with filters for doctor
  app.get("/api/doctor/medical-records", async (req, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user || user.role !== "doctor") {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const { tab = "all", page = 1, search = "" } = req.query;
      const records = await storage.getDoctorMedicalRecords(user.id, tab as string, parseInt(page as string), search as string);
      res.status(200).json(records);
    } catch (error) {
      res.status(500).json({ message: "Failed to get medical records" });
    }
  });
  
  // Create medical order
  app.post("/api/doctor/medical-orders", async (req, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user || user.role !== "doctor") {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const data = insertMedicalOrderSchema.parse(req.body);
      const order = await storage.createMedicalOrder({
        ...data,
        doctorId: user.id
      });
      
      res.status(201).json(order);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to create medical order" });
    }
  });
  
  // Create prescription
  app.post("/api/doctor/prescriptions", async (req, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user || user.role !== "doctor") {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const data = insertPrescriptionSchema.parse(req.body);
      const prescription = await storage.createPrescription({
        ...data,
        doctorId: user.id
      });
      
      res.status(201).json(prescription);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to create prescription" });
    }
  });
  
  // Get prescriptions with filters for doctor
  app.get("/api/doctor/prescriptions", async (req, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user || user.role !== "doctor") {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const { tab = "active", page = 1, search = "" } = req.query;
      const prescriptions = await storage.getDoctorPrescriptions(user.id, tab as string, parseInt(page as string), search as string);
      res.status(200).json(prescriptions);
    } catch (error) {
      res.status(500).json({ message: "Failed to get prescriptions" });
    }
  });
  
  // Patient Routes
  
  // Get patient dashboard stats
  app.get("/api/patient/stats", async (req, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user || user.role !== "patient") {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const stats = await storage.getPatientStats(user.id);
      res.status(200).json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to get patient stats" });
    }
  });
  
  // Get upcoming appointments for patient
  app.get("/api/patient/appointments/upcoming", async (req, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user || user.role !== "patient") {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const appointments = await storage.getPatientUpcomingAppointments(user.id);
      res.status(200).json(appointments);
    } catch (error) {
      res.status(500).json({ message: "Failed to get upcoming appointments" });
    }
  });
  
  // Get available doctors for patient appointments
  app.get("/api/patient/doctors", async (req, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user || user.role !== "patient") {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const doctors = await storage.getAvailableDoctors();
      res.status(200).json(doctors);
    } catch (error) {
      res.status(500).json({ message: "Failed to get available doctors" });
    }
  });
  
  // Get appointments with filters for patient
  app.get("/api/patient/appointments", async (req, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user || user.role !== "patient") {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const { tab = "upcoming", date } = req.query;
      const appointments = await storage.getPatientAppointments(user.id, tab as string, date as string);
      res.status(200).json(appointments);
    } catch (error) {
      res.status(500).json({ message: "Failed to get appointments" });
    }
  });
  
  // Create appointment for patient
  app.post("/api/patient/appointments", async (req, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user || user.role !== "patient") {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const data = insertAppointmentSchema.parse(req.body);
      const appointment = await storage.createAppointment({
        ...data,
        patientId: user.id
      });
      
      res.status(201).json(appointment);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to create appointment" });
    }
  });
  
  // Get patient's health parameters
  app.get("/api/patient/parameters", async (req, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user || user.role !== "patient") {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const parameters = await storage.getPatientParameters(user.id);
      res.status(200).json(parameters);
    } catch (error) {
      res.status(500).json({ message: "Failed to get health parameters" });
    }
  });
  
  // Get patient's recent health parameters
  app.get("/api/patient/parameters/recent", async (req, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user || user.role !== "patient") {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const parameters = await storage.getPatientRecentParameters(user.id);
      res.status(200).json(parameters);
    } catch (error) {
      res.status(500).json({ message: "Failed to get recent health parameters" });
    }
  });
  
  // Add health parameter for patient
  app.post("/api/patient/parameters", async (req, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user || user.role !== "patient") {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const data = insertParameterSchema.parse(req.body);
      const parameter = await storage.createParameter({
        ...data,
        patientId: user.id
      });
      
      res.status(201).json(parameter);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to create health parameter" });
    }
  });
  
  // Get medical records for patient
  app.get("/api/patient/medical-records", async (req, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user || user.role !== "patient") {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const { tab = "all", page = 1, search = "" } = req.query;
      const records = await storage.getPatientMedicalRecords(user.id, tab as string, parseInt(page as string), search as string);
      res.status(200).json(records);
    } catch (error) {
      res.status(500).json({ message: "Failed to get medical records" });
    }
  });
  
  // Get medications for patient
  app.get("/api/patient/medications", async (req, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user || user.role !== "patient") {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const { tab = "active", page = 1, search = "" } = req.query;
      const medications = await storage.getPatientMedications(user.id, tab as string, parseInt(page as string), search as string);
      res.status(200).json(medications);
    } catch (error) {
      res.status(500).json({ message: "Failed to get medications" });
    }
  });
  
  // Get reminders for patient
  app.get("/api/patient/reminders", async (req, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user || user.role !== "patient") {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const reminders = await storage.getPatientReminders(user.id);
      res.status(200).json(reminders);
    } catch (error) {
      res.status(500).json({ message: "Failed to get reminders" });
    }
  });
  
  // Get filtered reminders for patient
  app.get("/api/patient/reminders", async (req, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user || user.role !== "patient") {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const { tab = "active", page = 1, search = "" } = req.query;
      const reminders = await storage.getPatientFilteredReminders(user.id, tab as string, parseInt(page as string), search as string);
      res.status(200).json(reminders);
    } catch (error) {
      res.status(500).json({ message: "Failed to get reminders" });
    }
  });
  
  // Create reminder for patient
  app.post("/api/patient/reminders", async (req, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user || user.role !== "patient") {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const data = insertReminderSchema.parse(req.body);
      const reminder = await storage.createReminder({
        ...data,
        userId: user.id
      });
      
      res.status(201).json(reminder);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to create reminder" });
    }
  });
  
  // Mark reminder as completed
  app.patch("/api/patient/reminders/:id/complete", async (req, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user || user.role !== "patient") {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const reminderId = parseInt(req.params.id);
      if (isNaN(reminderId)) {
        return res.status(400).json({ message: "Invalid reminder ID" });
      }
      
      const reminder = await storage.completeReminder(reminderId, user.id);
      res.status(200).json(reminder);
    } catch (error) {
      res.status(500).json({ message: "Failed to complete reminder" });
    }
  });
  
  // Setup mock data
  await setupMockData(storage);

  const httpServer = createServer(app);

  return httpServer;
}
