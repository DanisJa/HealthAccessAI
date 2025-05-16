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
  insertReminderSchema,
  insertMessageSchema,
} from "@shared/schema";

import { supabase } from "@/../utils/supabaseClient";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize authentication
  setupAuth(app);

  // Setup chatbot routes
  setupChatbot(app);

  // Authentication Routes
  app.post("/api/auth/register", async (req, res) => {
    let { data, error } = await supabase.auth.signUp({
      email: req.body.email,
      password: req.body.password,
    });

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    res.status(201).json(data);
  });

  app.post("/api/auth/login", async (req, res) => {
    let { data, error } = await supabase.auth.signInWithPassword({
      email: req.body.email,
      password: req.body.password,
    });

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    res.status(201).json(data);
  });

  app.post("/api/auth/logout", async (req, res) => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    req.session.destroy(() => {
      res.status(200).json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    const { data: user } = await supabase
      .from("users")
      .select("*")
      .eq("id", data.user.id)
      .single();

    return res.status(200).json(user);
  });

  // Doctor Routes
  app.get("/api/doctor/hospitals", async (req, res) => {
    const doctorId = req.query.doctorId;

    if (!doctorId) {
      res.status(400).json({ message: "Bad request, need doctor ID." });
    }

    const { data, error } = await supabase
      .from("doctor_hospitals_view")
      .select()
      .eq("doctor_id", doctorId);

    if (error) {
      res.status(500).json({ error: error });
      return;
    }

    res.status(200).json(data);
  });

  app.get("/api/doctor/patients", async (req, res) => {
    const { doctorId, hopsitalId } = req.query;

    const { data, error } = await supabase
      .from("doctor_patients_view")
      .select();

    console.log("Error: ", error);
    console.log("Data: ", data);

    if (error) throw new Error(error.message);

    res.status(200).json(data);
  });

  // Get doctor dashboard stats
  app.get("/api/doctor/stats", async (req, res) => {
    const doctorId = req.query.doctorId;

    const { data, error } = await supabase
      .from("doctor_stats_view")
      .select()
      .eq("doctor_id", doctorId);

    if (error) {
      res.status(500).json({ error: error });
      return;
    }

    res.status(200).json(data);
  });

  // Get recent patients for doctor
  app.get("/api/doctor/patients/recent", async (req, res) => {
    // 1) Auth check
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const doctorId = req.session.userId;

    try {
      // 2) Verify role = doctor
      const { data: user, error: userErr } = await supabase
        .from("users")
        .select("role")
        .eq("id", doctorId)
        .single();
      if (userErr) throw userErr;
      if (user.role !== "doctor") {
        return res.status(403).json({ message: "Forbidden" });
      }

      // 3) Fetch 10 most recent patients
      const { data, error: patErr } = await supabase
        .from("hospital_patients")
        .select(
          `
        status,
        created_at,
        patient:users!hospital_patients_patient_id_fkey(
          id,
          first_name,
          last_name,
          date_of_birth,
      
        )
      `
        )
        .eq("primary_doctor_id", doctorId)
        .order("created_at", { ascending: false })
        .limit(10);
      if (patErr) throw patErr;

      // 4) Map to your front-end shape
      const patients = data.map((p: any) => ({
        id: p.patient.id,
        firstName: p.patient.first_name,
        lastName: p.patient.last_name,
        age:
          new Date().getFullYear() -
          new Date(p.patient.date_of_birth).getFullYear(),
        gender: p.patient.gender,
        status: p.status,
        lastVisit: p.created_at,
        avatarUrl: p.patient.avatar_url,
      }));

      return res.status(200).json(patients);
    } catch (err) {
      console.error("GET /api/doctor/patients/recent error:", err);
      return res.status(500).json({ message: "Failed to get recent patients" });
    }
  });

  // Get all patients for doctor
  app.get("/api/doctor/patients/all", async (req, res) => {
    // 1) Must be logged in
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const doctorId = req.session.userId;

    try {
      // 2) Confirm role = doctor
      const { data: user, error: userErr } = await supabase
        .from("users")
        .select("role")
        .eq("id", doctorId)
        .single();
      if (userErr) throw userErr;
      if (user.role !== "doctor") {
        return res.status(403).json({ message: "Forbidden" });
      }

      // 3) Fetch all patients for this doctor
      const { data, error: pErr } = await supabase
        .from("hospital_patients")
        .select(
          `status,
         created_at,
         patient:users!hospital_patients_patient_id_fkey(
           id,
           first_name,
           last_name,
           date_of_birth,
           gender,
           avatar_url
         )`
        )
        .eq("primary_doctor_id", doctorId);
      if (pErr) throw pErr;

      // 4) Map to DTO
      const patients = data.map((p: any) => ({
        id: p.patient.id,
        firstName: p.patient.first_name,
        lastName: p.patient.last_name,
        age:
          new Date().getFullYear() -
          new Date(p.patient.date_of_birth).getFullYear(),
        gender: p.patient.gender,
        status: p.status,
        lastVisit: p.created_at,
        avatarUrl: p.patient.avatar_url,
      }));

      return res.status(200).json(patients);
    } catch (err) {
      console.error("GET /api/doctor/patients/all error:", err);
      return res.status(500).json({ message: "Failed to get all patients" });
    }
  });

  // Get patients with filters for doctor
  app.get("/api/doctor/patients", async (req, res) => {
    // 1) Auth
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const doctorId = req.session.userId;

    try {
      // 2) Role check
      const { data: user, error: userErr } = await supabase
        .from("users")
        .select("role")
        .eq("id", doctorId)
        .single();
      if (userErr) throw userErr;
      if (user.role !== "doctor") {
        return res.status(403).json({ message: "Forbidden" });
      }

      // 3) Build query
      const { tab = "all", page = "1", search = "" } = req.query;
      let query = supabase
        .from("hospital_patients")
        .select(
          `
        status,
        created_at,
        patient:users!hospital_patients_patient_id_fkey(
          id,
          first_name,
          last_name,
          date_of_birth,
          gender,
          avatar_url
        )
      `
        )
        .eq("primary_doctor_id", doctorId);

      // 3a) Tab filter (e.g., recent)
      if (tab === "recent") {
        query = query.order("created_at", { ascending: false }).limit(10);
      }

      // 3b) Search by first or last name
      if (search) {
        // supabase .or syntax: field.ilike.%value%
        query = query.or(
          `patient.first_name.ilike.%${search}%,patient.last_name.ilike.%${search}%`
        );
      }

      // 3c) Pagination
      const pageNum = parseInt(page as string, 10) || 1;
      const pageSize = 20;
      const from = (pageNum - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      // 4) Execute
      const { data, error: pErr } = await query;
      if (pErr) throw pErr;

      // 5) Map to DTO
      const patients = data.map((p: any) => ({
        id: p.patient.id,
        firstName: p.patient.first_name,
        lastName: p.patient.last_name,
        age:
          new Date().getFullYear() -
          new Date(p.patient.date_of_birth).getFullYear(),
        gender: p.patient.gender,
        status: p.status,
        lastVisit: p.created_at,
        avatarUrl: p.patient.avatar_url,
      }));

      return res.status(200).json(patients);
    } catch (err) {
      console.error("GET /api/doctor/patients error:", err);
      return res.status(500).json({ message: "Failed to get patients" });
    }
  });

  app.get("/api/doctor/patients/parameters", async (req, res) => {
    // 1) Auth check
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const doctorId = req.session.userId;

    try {
      // 2) Role validation
      const { data: user, error: userErr } = await supabase
        .from("users")
        .select("role")
        .eq("id", doctorId)
        .single();
      if (userErr) throw userErr;
      if (user.role !== "doctor") {
        return res.status(403).json({ message: "Forbidden" });
      }

      // 3) Validate patientId param
      const patientId = req.query.patientId as string;
      if (!patientId) {
        return res.status(400).json({ message: "Patient ID is required" });
      }

      // 4) Fetch all parameters for this patient
      const { data, error: paramErr } = await supabase
        .from("parameters")
        .select(
          `
        id,
        type,
        value,
        unit,
        recorded_at,
        notes
      `
        )
        .eq("patient_id", patientId)
        .order("recorded_at", { ascending: false });
      if (paramErr) throw paramErr;

      // 5) Return raw list (you can map fields here if your front-end expects different keys)
      return res.status(200).json(data);
    } catch (err) {
      console.error("GET /api/doctor/patients/parameters error:", err);
      return res
        .status(500)
        .json({ message: "Failed to get patient parameters" });
    }
  });

  app.get("/api/doctor/appointments/today", async (req, res) => {
    // 1) Auth check
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const doctorId = req.session.userId;

    try {
      // 2) Role check
      const { data: user, error: userErr } = await supabase
        .from("users")
        .select("role")
        .eq("id", doctorId)
        .single();
      if (userErr) throw userErr;
      if (user.role !== "doctor") {
        return res.status(403).json({ message: "Forbidden" });
      }

      // 3) Parse optional hospital filter
      const hospitalIdStr = req.query.hospitalId as string | undefined;
      const hospitalId = hospitalIdStr
        ? parseInt(hospitalIdStr, 10)
        : undefined;

      // 4) Build date range for today
      const today = new Date().toISOString().split("T")[0];
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];

      // 5) Query appointments
      let query = supabase
        .from("appointments")
        .select("*")
        .eq("doctor_id", doctorId)
        .gte("date", today)
        .lt("date", tomorrow);

      if (hospitalId) {
        query = query.eq("hospital_id", hospitalId);
      }

      const { data, error: apptErr } = await query;
      if (apptErr) throw apptErr;

      // 6) Return results
      return res.status(200).json(data);
    } catch (err) {
      console.error("GET /api/doctor/appointments/today error:", err);
      return res
        .status(500)
        .json({ message: "Failed to get today's appointments" });
    }
  });

  // Get appointments with filters for doctor
  app.get("/api/doctor/appointments", async (req, res) => {
    // 1) Auth check
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const doctorId = req.session.userId;

    try {
      // 2) Role check
      const { data: user, error: userErr } = await supabase
        .from("users")
        .select("role")
        .eq("id", doctorId)
        .single();
      if (userErr) throw userErr;
      if (user.role !== "doctor") {
        return res.status(403).json({ message: "Forbidden" });
      }

      // 3) Parse query params
      const { tab = "upcoming", date, hospitalId } = req.query;
      const hospitalIdNum = hospitalId
        ? parseInt(hospitalId as string, 10)
        : undefined;

      // 4) Build base query
      let query = supabase
        .from("appointments")
        .select(
          "id, hospital_id, date, duration, title, description, status, patient_id, doctor_id"
        )
        .eq("doctor_id", doctorId);

      // 4a) Filter by hospital if provided
      if (hospitalIdNum) {
        query = query.eq("hospital_id", hospitalIdNum);
      }

      // 4b) Tab filter: upcoming vs past vs all
      const today = new Date().toISOString().split("T")[0];
      if (tab === "upcoming") {
        query = query.gte("date", today);
      } else if (tab === "past") {
        query = query.lt("date", today);
      }
      // if tab==='all', no date filter

      // 4c) Exact date filter
      if (date) {
        query = query.eq("date", date as string);
      }

      // Optional: you could add pagination here with .range()

      // 5) Execute
      const { data, error: apptErr } = await query.order("date", {
        ascending: true,
      });
      if (apptErr) throw apptErr;

      // 6) Return
      return res.status(200).json(data);
    } catch (err) {
      console.error("GET /api/doctor/appointments error:", err);
      return res.status(500).json({ message: "Failed to get appointments" });
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
        doctorId: user.id,
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
      const records = await storage.getDoctorMedicalRecords(
        user.id,
        tab as string,
        parseInt(page as string),
        search as string
      );
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
        doctorId: user.id,
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
        doctorId: user.id,
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
      const prescriptions = await storage.getDoctorPrescriptions(
        user.id,
        tab as string,
        parseInt(page as string),
        search as string
      );
      res.status(200).json(prescriptions);
    } catch (error) {
      res.status(500).json({ message: "Failed to get prescriptions" });
    }
  });

  // Get all hospitals
  app.get("/api/hospitals", async (req, res) => {
    if (!req.body.id) {
      res.status(400).json({ message: "Bad request." });
    }

    try {
      const { data, error } = await supabase
        .from("doctor_hospitals_view")
        .select()
        .eq("doctor_id", req.body.id);
      if (error) {
        throw new Error(error.message);
      }

      res.status(200).json({ data });
    } catch (error) {
      res.status(500).json({ message: error });
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

  // Message endpoints
  // Get inbox messages
  app.get("/api/messages/inbox", async (req, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const { tab = "unread", page = 1, search = "" } = req.query;

      const messages = await storage.getUserMessages(
        req.session.userId,
        tab as string,
        parseInt(page as string),
        search as string
      );

      res.status(200).json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch inbox messages" });
    }
  });

  // Get sent messages
  app.get("/api/messages/sent", async (req, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const { page = 1, search = "" } = req.query;

      const messages = await storage.getUserSentMessages(
        req.session.userId,
        parseInt(page as string),
        search as string
      );

      res.status(200).json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sent messages" });
    }
  });

  // Get message thread
  app.get("/api/messages/thread/:id", async (req, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const messageId = parseInt(req.params.id);
      if (isNaN(messageId)) {
        return res.status(400).json({ message: "Invalid message ID" });
      }

      // Check if the user has access to this message
      const message = await storage.getMessage(messageId);
      if (!message) {
        return res.status(404).json({ message: "Message not found" });
      }

      // Only allow access if the user is either the sender or recipient
      if (
        message.senderId !== req.session.userId &&
        message.recipientId !== req.session.userId
      ) {
        return res.status(403).json({ message: "Access denied" });
      }

      const thread = await storage.getMessageThread(messageId);
      res.status(200).json(thread);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch message thread" });
    }
  });

  // Create new message
  app.post("/api/messages", async (req, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const data = insertMessageSchema.parse({
        ...req.body,
        senderId: req.session.userId,
        status: "unread", // Always set status to unread for new messages
      });

      // Check if recipient exists
      const recipient = await storage.getUser(data.recipientId);
      if (!recipient) {
        return res.status(400).json({ message: "Recipient not found" });
      }

      const message = await storage.createMessage(data);
      res.status(201).json(message);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to create message" });
    }
  });

  // Update message status (mark as read, archive, etc.)
  app.patch("/api/messages/:id/status", async (req, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const messageId = parseInt(req.params.id);
      if (isNaN(messageId)) {
        return res.status(400).json({ message: "Invalid message ID" });
      }

      const { status } = req.body;
      if (!status || !["unread", "read", "archived"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      // Check if the user has access to this message
      const message = await storage.getMessage(messageId);
      if (!message) {
        return res.status(404).json({ message: "Message not found" });
      }

      // Only allow recipient to update status
      if (message.recipientId !== req.session.userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const updatedMessage = await storage.updateMessageStatus(
        messageId,
        status
      );
      res.status(200).json(updatedMessage);
    } catch (error) {
      res.status(500).json({ message: "Failed to update message status" });
    }
  });

  // Setup mock data
  await setupMockData(storage);

  const httpServer = createServer(app);

  return httpServer;
}
