import { pgTable, text, serial, integer, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Define user roles enum
export const roleEnum = pgEnum('role', ['patient', 'doctor']);

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  role: roleEnum("role").notNull().default('patient'),
  createdAt: timestamp("created_at").defaultNow(),
});

// Medical reports table
export const medicalReports = pgTable("medical_reports", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull().references(() => users.id),
  doctorId: integer("doctor_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Medical orders table
export const medicalOrders = pgTable("medical_orders", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull().references(() => users.id),
  doctorId: integer("doctor_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  status: text("status").notNull().default('active'),
  createdAt: timestamp("created_at").defaultNow(),
});

// Prescriptions table
export const prescriptions = pgTable("prescriptions", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull().references(() => users.id),
  doctorId: integer("doctor_id").notNull().references(() => users.id),
  medication: text("medication").notNull(),
  dosage: text("dosage").notNull(),
  frequency: text("frequency").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  instructions: text("instructions"),
  status: text("status").notNull().default('active'),
  createdAt: timestamp("created_at").defaultNow(),
});

// Health parameters table
export const parameters = pgTable("parameters", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull().references(() => users.id),
  type: text("type").notNull(), // e.g. 'blood_pressure', 'weight', 'heart_rate', etc.
  value: text("value").notNull(), // Store as text to accommodate various formats
  unit: text("unit").notNull(),
  recordedAt: timestamp("recorded_at").defaultNow(),
  notes: text("notes"),
});

// Appointments table
export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull().references(() => users.id),
  doctorId: integer("doctor_id").notNull().references(() => users.id),
  date: timestamp("date").notNull(),
  duration: integer("duration").notNull().default(30), // Duration in minutes
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default('scheduled'),
  createdAt: timestamp("created_at").defaultNow(),
});

// Reminders table
export const reminders = pgTable("reminders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  type: text("type").notNull(), // e.g. 'medication', 'appointment', etc.
  title: text("title").notNull(),
  description: text("description"),
  dueDate: timestamp("due_date").notNull(),
  recurring: boolean("recurring").default(false),
  frequency: text("frequency"), // e.g. 'daily', 'weekly', etc.
  completed: boolean("completed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Define schemas for insertions
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertMedicalReportSchema = createInsertSchema(medicalReports).omit({
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

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const registerSchema = insertUserSchema.extend({
  confirmPassword: z.string().min(6),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
