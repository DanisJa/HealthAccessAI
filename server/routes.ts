import type { Express } from 'express';
import { createServer, type Server } from 'http';
import { storage, setupMockData } from './storage';
import { setupAuth } from './auth';
import { setupChatbot } from './openai';
import { ZodError } from 'zod';
import { fromZodError } from 'zod-validation-error';
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
} from '@shared/schema';

import { supabase } from '@/../utils/supabaseClient';

export async function registerRoutes(app: Express): Promise<Server> {
	// Initialize authentication
	setupAuth(app);

	// Setup chatbot routes
	setupChatbot(app);

	// Authentication Routes
	app.post('/api/auth/register', async (req, res) => {
		let { data, error } = await supabase.auth.signUp({
			email: req.body.email,
			password: req.body.password,
		});

		if (error) {
			return res.status(400).json({ message: error.message });
		}

		res.status(201).json(data);
	});

	app.post('/api/auth/login', async (req, res) => {
		let { data, error } = await supabase.auth.signInWithPassword({
			email: req.body.email,
			password: req.body.password,
		});

		if (error) {
			return res.status(400).json({ message: error.message });
		}

		console.log('Login data:', data);

		res.status(201).json(data);
	});

	app.post('/api/auth/logout', async (req, res) => {
		const { error } = await supabase.auth.signOut();

		if (error) {
			return res.status(400).json({ message: error.message });
		}

		req.session.destroy(() => {
			res.status(200).json({ message: 'Logged out successfully' });
		});
	});

	app.get('/api/auth/me', async (req, res) => {
		const { data, error } = await supabase.auth.getUser();

		if (error) {
			return res.status(400).json({ message: error.message });
		}

		const { data: user } = await supabase
			.from('users')
			.select('*')
			.eq('id', data.user.id)
			.single();

		return res.status(200).json(user);
	});

	// Doctor Routes
	app.get('/api/doctor/hospitals', async (req, res) => {
		const doctorId = req.query.doctorId;

		if (!doctorId) {
			res.status(400).json({ message: 'Bad request, need doctor ID.' });
		}

		console.log(doctorId);

		const { data, error } = await supabase
			.from('doctor_hospitals_view')
			.select()
			.eq('doctor_id', doctorId);

		console.log(data, error);

		if (error) {
			res.status(500).json({ error: error });
			return;
		}

		res.status(200).json(data);
	});

	// Get doctor dashboard stats
	app.get('/api/doctor/stats', async (req, res) => {
		if (!req.session?.userId) {
			return res.status(401).json({ message: 'Not authenticated' });
		}

		try {
			const user = await storage.getUser(req.session.userId);
			if (!user || user.role !== 'doctor') {
				return res.status(403).json({ message: 'Forbidden' });
			}

			const stats = await storage.getDoctorStats(user.id);
			res.status(200).json(stats);
		} catch (error) {
			res.status(500).json({ message: 'Failed to get doctor stats' });
		}
	});

	// Get recent patients for doctor
	app.get('/api/doctor/patients/recent', async (req, res) => {
		if (!req.session?.userId) {
			return res.status(401).json({ message: 'Not authenticated' });
		}

		try {
			const user = await storage.getUser(req.session.userId);
			if (!user || user.role !== 'doctor') {
				return res.status(403).json({ message: 'Forbidden' });
			}

			const patients = await storage.getRecentPatients(user.id);
			res.status(200).json(patients);
		} catch (error) {
			res.status(500).json({ message: 'Failed to get recent patients' });
		}
	});

	// Get all patients for doctor
	app.get('/api/doctor/patients/all', async (req, res) => {
		if (!req.session?.userId) {
			return res.status(401).json({ message: 'Not authenticated' });
		}

		try {
			const user = await storage.getUser(req.session.userId);
			if (!user || user.role !== 'doctor') {
				return res.status(403).json({ message: 'Forbidden' });
			}

			const patients = await storage.getAllPatients();
			res.status(200).json(patients);
		} catch (error) {
			res.status(500).json({ message: 'Failed to get all patients' });
		}
	});

	// Get patients with filters for doctor
	app.get('/api/doctor/patients', async (req, res) => {
		if (!req.session?.userId) {
			return res.status(401).json({ message: 'Not authenticated' });
		}

		try {
			const user = await storage.getUser(req.session.userId);
			if (!user || user.role !== 'doctor') {
				return res.status(403).json({ message: 'Forbidden' });
			}

			const { tab = 'all', page = 1, search = '' } = req.query;
			const patients = await storage.getPatients(
				tab as string,
				parseInt(page as string),
				search as string
			);
			res.status(200).json(patients);
		} catch (error) {
			res.status(500).json({ message: 'Failed to get patients' });
		}
	});

	// Get patient parameters for doctor
	app.get('/api/doctor/patients/parameters', async (req, res) => {
		if (!req.session?.userId) {
			return res.status(401).json({ message: 'Not authenticated' });
		}

		try {
			const user = await storage.getUser(req.session.userId);
			if (!user || user.role !== 'doctor') {
				return res.status(403).json({ message: 'Forbidden' });
			}

			const { patientId } = req.query;
			if (!patientId) {
				return res.status(400).json({ message: 'Patient ID is required' });
			}

			const parameters = await storage.getPatientParameters(
				parseInt(patientId as string)
			);
			res.status(200).json(parameters);
		} catch (error) {
			res.status(500).json({ message: 'Failed to get patient parameters' });
		}
	});

	// Get today's appointments for doctor
	app.get('/api/doctor/appointments/today', async (req, res) => {
		if (!req.session?.userId) {
			return res.status(401).json({ message: 'Not authenticated' });
		}

		try {
			const user = await storage.getUser(req.session.userId);
			if (!user || user.role !== 'doctor') {
				return res.status(403).json({ message: 'Forbidden' });
			}

			const { hospitalId } = req.query;
			const hospitalIdParam = hospitalId
				? parseInt(hospitalId as string)
				: undefined;

			const appointments = await storage.getDoctorTodayAppointments(
				user.id,
				hospitalIdParam
			);
			res.status(200).json(appointments);
		} catch (error) {
			res.status(500).json({ message: "Failed to get today's appointments" });
		}
	});

	// Get appointments with filters for doctor
	app.get('/api/doctor/appointments', async (req, res) => {
		if (!req.session?.userId) {
			return res.status(401).json({ message: 'Not authenticated' });
		}

		try {
			const user = await storage.getUser(req.session.userId);
			if (!user || user.role !== 'doctor') {
				return res.status(403).json({ message: 'Forbidden' });
			}

			const { tab = 'upcoming', date, hospitalId } = req.query;
			const hospitalIdParam = hospitalId
				? parseInt(hospitalId as string)
				: undefined;

			const appointments = await storage.getDoctorAppointments(
				user.id,
				tab as string,
				date as string,
				hospitalIdParam
			);
			res.status(200).json(appointments);
		} catch (error) {
			res.status(500).json({ message: 'Failed to get appointments' });
		}
	});

	// Create medical report
	app.post('/api/doctor/medical-reports', async (req, res) => {
		if (!req.session?.userId) {
			return res.status(401).json({ message: 'Not authenticated' });
		}

		try {
			const user = await storage.getUser(req.session.userId);
			if (!user || user.role !== 'doctor') {
				return res.status(403).json({ message: 'Forbidden' });
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
			res.status(500).json({ message: 'Failed to create medical report' });
		}
	});

	// Get medical records with filters for doctor
	app.get('/api/doctor/medical-records', async (req, res) => {
		if (!req.session?.userId) {
			return res.status(401).json({ message: 'Not authenticated' });
		}

		try {
			const user = await storage.getUser(req.session.userId);
			if (!user || user.role !== 'doctor') {
				return res.status(403).json({ message: 'Forbidden' });
			}

			const { tab = 'all', page = 1, search = '' } = req.query;
			const records = await storage.getDoctorMedicalRecords(
				user.id,
				tab as string,
				parseInt(page as string),
				search as string
			);
			res.status(200).json(records);
		} catch (error) {
			res.status(500).json({ message: 'Failed to get medical records' });
		}
	});

	// Create medical order
	app.post('/api/doctor/medical-orders', async (req, res) => {
		if (!req.session?.userId) {
			return res.status(401).json({ message: 'Not authenticated' });
		}

		try {
			const user = await storage.getUser(req.session.userId);
			if (!user || user.role !== 'doctor') {
				return res.status(403).json({ message: 'Forbidden' });
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
			res.status(500).json({ message: 'Failed to create medical order' });
		}
	});

	// Create prescription
	app.post('/api/doctor/prescriptions', async (req, res) => {
		if (!req.session?.userId) {
			return res.status(401).json({ message: 'Not authenticated' });
		}

		try {
			const user = await storage.getUser(req.session.userId);
			if (!user || user.role !== 'doctor') {
				return res.status(403).json({ message: 'Forbidden' });
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
			res.status(500).json({ message: 'Failed to create prescription' });
		}
	});

	// Get prescriptions with filters for doctor
	app.get('/api/doctor/prescriptions', async (req, res) => {
		if (!req.session?.userId) {
			return res.status(401).json({ message: 'Not authenticated' });
		}

		try {
			const user = await storage.getUser(req.session.userId);
			if (!user || user.role !== 'doctor') {
				return res.status(403).json({ message: 'Forbidden' });
			}

			const { tab = 'active', page = 1, search = '' } = req.query;
			const prescriptions = await storage.getDoctorPrescriptions(
				user.id,
				tab as string,
				parseInt(page as string),
				search as string
			);
			res.status(200).json(prescriptions);
		} catch (error) {
			res.status(500).json({ message: 'Failed to get prescriptions' });
		}
	});

	// Get all hospitals
	app.get('/api/hospitals', async (req, res) => {
		if (!req.body.id) {
			res.status(400).json({ message: 'Bad request.' });
		}

		try {
			const { data, error } = await supabase
				.from('doctor_hospitals_view')
				.select()
				.eq('doctor_id', req.body.id);
			if (error) {
				throw new Error(error.message);
			}

			res.status(200).json({ data });
		} catch (error) {
			res.status(500).json({ message: error });
		}
	});

	// Mark reminder as completed
	app.patch('/api/patient/reminders/:id/complete', async (req, res) => {
		if (!req.session?.userId) {
			return res.status(401).json({ message: 'Not authenticated' });
		}

		try {
			const user = await storage.getUser(req.session.userId);
			if (!user || user.role !== 'patient') {
				return res.status(403).json({ message: 'Forbidden' });
			}

			const reminderId = parseInt(req.params.id);
			if (isNaN(reminderId)) {
				return res.status(400).json({ message: 'Invalid reminder ID' });
			}

			const reminder = await storage.completeReminder(reminderId, user.id);
			res.status(200).json(reminder);
		} catch (error) {
			res.status(500).json({ message: 'Failed to complete reminder' });
		}
	});

	// Message endpoints
	// Get inbox messages
	app.get('/api/messages/inbox', async (req, res) => {
		if (!req.session?.userId) {
			return res.status(401).json({ message: 'Not authenticated' });
		}

		try {
			const { tab = 'unread', page = 1, search = '' } = req.query;

			const messages = await storage.getUserMessages(
				req.session.userId,
				tab as string,
				parseInt(page as string),
				search as string
			);

			res.status(200).json(messages);
		} catch (error) {
			res.status(500).json({ message: 'Failed to fetch inbox messages' });
		}
	});

	// Get sent messages
	app.get('/api/messages/sent', async (req, res) => {
		if (!req.session?.userId) {
			return res.status(401).json({ message: 'Not authenticated' });
		}

		try {
			const { page = 1, search = '' } = req.query;

			const messages = await storage.getUserSentMessages(
				req.session.userId,
				parseInt(page as string),
				search as string
			);

			res.status(200).json(messages);
		} catch (error) {
			res.status(500).json({ message: 'Failed to fetch sent messages' });
		}
	});

	// Get message thread
	app.get('/api/messages/thread/:id', async (req, res) => {
		if (!req.session?.userId) {
			return res.status(401).json({ message: 'Not authenticated' });
		}

		try {
			const messageId = parseInt(req.params.id);
			if (isNaN(messageId)) {
				return res.status(400).json({ message: 'Invalid message ID' });
			}

			// Check if the user has access to this message
			const message = await storage.getMessage(messageId);
			if (!message) {
				return res.status(404).json({ message: 'Message not found' });
			}

			// Only allow access if the user is either the sender or recipient
			if (
				message.senderId !== req.session.userId &&
				message.recipientId !== req.session.userId
			) {
				return res.status(403).json({ message: 'Access denied' });
			}

			const thread = await storage.getMessageThread(messageId);
			res.status(200).json(thread);
		} catch (error) {
			res.status(500).json({ message: 'Failed to fetch message thread' });
		}
	});

	// Create new message
	app.post('/api/messages', async (req, res) => {
		if (!req.session?.userId) {
			return res.status(401).json({ message: 'Not authenticated' });
		}

		try {
			const data = insertMessageSchema.parse({
				...req.body,
				senderId: req.session.userId,
				status: 'unread', // Always set status to unread for new messages
			});

			// Check if recipient exists
			const recipient = await storage.getUser(data.recipientId);
			if (!recipient) {
				return res.status(400).json({ message: 'Recipient not found' });
			}

			const message = await storage.createMessage(data);
			res.status(201).json(message);
		} catch (error) {
			if (error instanceof ZodError) {
				const validationError = fromZodError(error);
				return res.status(400).json({ message: validationError.message });
			}
			res.status(500).json({ message: 'Failed to create message' });
		}
	});

	// Update message status (mark as read, archive, etc.)
	app.patch('/api/messages/:id/status', async (req, res) => {
		if (!req.session?.userId) {
			return res.status(401).json({ message: 'Not authenticated' });
		}

		try {
			const messageId = parseInt(req.params.id);
			if (isNaN(messageId)) {
				return res.status(400).json({ message: 'Invalid message ID' });
			}

			const { status } = req.body;
			if (!status || !['unread', 'read', 'archived'].includes(status)) {
				return res.status(400).json({ message: 'Invalid status' });
			}

			// Check if the user has access to this message
			const message = await storage.getMessage(messageId);
			if (!message) {
				return res.status(404).json({ message: 'Message not found' });
			}

			// Only allow recipient to update status
			if (message.recipientId !== req.session.userId) {
				return res.status(403).json({ message: 'Access denied' });
			}

			const updatedMessage = await storage.updateMessageStatus(
				messageId,
				status
			);
			res.status(200).json(updatedMessage);
		} catch (error) {
			res.status(500).json({ message: 'Failed to update message status' });
		}
	});

	// Setup mock data
	await setupMockData(storage);

	const httpServer = createServer(app);

	return httpServer;
}
