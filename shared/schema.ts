import {
  pgTable,
  text,
  serial,
  integer,
  timestamp,
  boolean,
  pgEnum,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Define user roles enum
export const roleEnum = pgEnum("role", ["patient", "doctor", "hospital"]);

// Define hospital types enum
export const hospitalTypeEnum = pgEnum("hospital_type", ["public", "private"]);

// Users table
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  role: roleEnum("role").notNull().default("patient"),
  municipality: text("municipality"), // For patients - determines which public hospitals they can access
  address: text("address"),
  phone: text("phone"),
  dateOfBirth: timestamp("date_of_birth"),
  specialty: text("specialty"), // For doctors
  createdAt: timestamp("created_at").defaultNow(),
});

// Medical reports table
export const medicalReports = pgTable("medical_reports", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id")
    .notNull()
    .references(() => users.id),
  doctorId: integer("doctor_id")
    .notNull()
    .references(() => users.id),
  title: text("title").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Medical orders table
export const medicalOrders = pgTable("medical_orders", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id")
    .notNull()
    .references(() => users.id),
  doctorId: integer("doctor_id")
    .notNull()
    .references(() => users.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Prescriptions table
export const prescriptions = pgTable("prescriptions", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id")
    .notNull()
    .references(() => users.id),
  doctorId: integer("doctor_id")
    .notNull()
    .references(() => users.id),
  medication: text("medication").notNull(),
  dosage: text("dosage").notNull(),
  frequency: text("frequency").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  instructions: text("instructions"),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Health parameters table
export const parameters = pgTable("parameters", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id")
    .notNull()
    .references(() => users.id),
  hospitalId: integer("hospital_id").references(() => hospitals.id), // Optional reference to hospital
  type: text("type").notNull(), // e.g. 'blood_pressure', 'weight', 'heart_rate', etc.
  value: text("value").notNull(), // Store as text to accommodate various formats
  unit: text("unit").notNull(),
  recordedAt: timestamp("recorded_at").defaultNow(),
  notes: text("notes"),
});

// Define appointment status enum
export const appointmentStatusEnum = pgEnum("appointment_status", [
  "pending",
  "approved",
  "rejected",
  "completed",
  "cancelled",
]);

// Appointments table
export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id")
    .notNull()
    .references(() => users.id),
  doctorId: text("doctor_id")
    .notNull()
    .references(() => users.id),
  hospitalId: integer("hospital_id")
    .notNull()
    .references(() => hospitals.id),
  date: timestamp("date").notNull(),
  duration: integer("duration").notNull().default(30), // Duration in minutes
  title: text("title").notNull(),
  description: text("description"),
  status: appointmentStatusEnum("status").notNull().default("pending"),
  createdBy: text("created_by")
    .notNull()
    .references(() => users.id), // Can be patient or doctor
  type: text("type"), // e.g. 'In-person', 'Video', 'Phone'
  createdAt: timestamp("created_at").defaultNow(),
});

// Reminders table
export const reminders = pgTable("reminders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  hospitalId: integer("hospital_id").references(() => hospitals.id), // Optional reference to hospital
  type: text("type").notNull(), // e.g. 'medication', 'appointment', etc.
  title: text("title").notNull(),
  description: text("description"),
  dueDate: timestamp("due_date").notNull(),
  recurring: boolean("recurring").default(false),
  frequency: text("frequency"), // e.g. 'daily', 'weekly', etc.
  completed: boolean("completed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Define message status enum
export const messageStatusEnum = pgEnum("message_status", [
  "unread",
  "read",
  "archived",
]);

// Messages table
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id")
    .notNull()
    .references(() => users.id),
  receiverId: integer("receiver_id")
    .notNull()
    .references(() => users.id),
  subject: text("subject").notNull(),
  content: text("content").notNull(),
  status: messageStatusEnum("status").notNull().default("unread"),
  hospitalId: integer("hospital_id").references(() => hospitals.id), // Optional reference to hospital
  attachmentUrl: text("attachment_url"), // URL to attachment if any
  parentMessageId: integer("parent_message_id").references(() => messages.id), // For threading conversations
  createdAt: timestamp("created_at").defaultNow(),
});

// Hospitals table
export const hospitals = pgTable("hospitals", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: hospitalTypeEnum("type").notNull(),
  municipality: text("municipality").notNull(),
  location: text("location").notNull(), // Can store latitude,longitude or address
  address: text("address"),
  phone: text("phone"),
  email: text("email"),
  website: text("website"),
  capacity: integer("capacity"), // Number of beds
  departments: text("departments")
    .array()
    .default([
      "Emergency",
      "Surgery",
      "Cardiology",
      "Neurology",
      "Pediatrics",
      "Obstetrics",
      "Gynecology",
      "Orthopedics",
      "Radiology",
      "Laboratory",
      "Pharmacy",
    ]), // List of departments
  services: text("services").array(), // List of services provided
  adminId: integer("admin_id").references(() => users.id), // Reference to hospital admin user (role='hospital')
  createdAt: timestamp("created_at").defaultNow(),
});

// Hospital-Doctor relationship (many-to-many)
export const hospitalDoctors = pgTable("hospital_doctors", {
  hospitalId: integer("hospital_id")
    .notNull()
    .references(() => hospitals.id),
  doctorId: integer("doctor_id")
    .notNull()
    .references(() => users.id),
  assignedBy: integer("assigned_by")
    .notNull()
    .references(() => users.id), // User (hospital admin) who assigned this doctor
  status: text("status").notNull().default("active"), // Can be 'active', 'pending', 'inactive'
  department: text("department"), // Department the doctor works in at this hospital
  specialtyAtHospital: text("specialty_at_hospital"), // Can be different from the doctor's general specialty
  schedule: text("schedule"), // Doctor's schedule at this hospital
  createdAt: timestamp("created_at").defaultNow(),
});

// Hospital-Patient relationship (many-to-many)
export const hospitalPatients = pgTable("hospital_patients", {
  hospitalId: integer("hospital_id")
    .notNull()
    .references(() => hospitals.id),
  patientId: integer("patient_id")
    .notNull()
    .references(() => users.id),
  registeredBy: integer("registered_by").references(() => users.id), // User who registered this patient at this hospital
  primaryDoctor: integer("primary_doctor").references(() => users.id), // Primary doctor for this patient at this hospital
  status: text("status").notNull().default("active"), // Can be 'active', 'inactive', 'archived'
  notes: text("notes"), // Special notes for this patient at this hospital
  createdAt: timestamp("created_at").defaultNow(),
});

// Define schemas for insertions
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertMedicalReportSchema = createInsertSchema(
  medicalReports
).omit({
  id: true,
  createdAt: true,
});

export const insertMedicalOrderSchema = createInsertSchema(medicalOrders).omit({
  id: true,
  createdAt: true,
});

export const insertPrescriptionSchema = createInsertSchema(prescriptions).omit({
  id: true,
  createdAt: true,
});

export const insertParameterSchema = createInsertSchema(parameters).omit({
  id: true,
  recordedAt: true,
});

export const insertAppointmentSchema = createInsertSchema(appointments).omit({
  id: true,
  createdAt: true,
});

export const insertReminderSchema = createInsertSchema(reminders).omit({
  id: true,
  createdAt: true,
});

export const insertHospitalSchema = createInsertSchema(hospitals).omit({
  id: true,
  createdAt: true,
});

export const insertHospitalDoctorSchema = createInsertSchema(
  hospitalDoctors
).omit({
  createdAt: true,
});

export const insertHospitalPatientSchema = createInsertSchema(
  hospitalPatients
).omit({
  createdAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

// Define types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type MedicalReport = typeof medicalReports.$inferSelect;
export type InsertMedicalReport = z.infer<typeof insertMedicalReportSchema>;

export type MedicalOrder = typeof medicalOrders.$inferSelect;
export type InsertMedicalOrder = z.infer<typeof insertMedicalOrderSchema>;

export type Prescription = typeof prescriptions.$inferSelect;
export type InsertPrescription = z.infer<typeof insertPrescriptionSchema>;

export type Parameter = typeof parameters.$inferSelect;
export type InsertParameter = z.infer<typeof insertParameterSchema>;

export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;

export type Reminder = typeof reminders.$inferSelect;
export type InsertReminder = z.infer<typeof insertReminderSchema>;

export type Hospital = typeof hospitals.$inferSelect;
export type InsertHospital = z.infer<typeof insertHospitalSchema>;

export type HospitalDoctor = typeof hospitalDoctors.$inferSelect;
export type InsertHospitalDoctor = z.infer<typeof insertHospitalDoctorSchema>;

export type HospitalPatient = typeof hospitalPatients.$inferSelect;
export type InsertHospitalPatient = z.infer<typeof insertHospitalPatientSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const registerSchema = insertUserSchema
  .extend({
    confirmPassword: z.string().min(6),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
