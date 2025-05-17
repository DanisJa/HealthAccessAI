import { Express, Request, Response } from 'express';
import { isAuthenticated } from './auth';

const openaiApiKey = process.env.VITE_OPENAI_KEY || 'demo-key';

// Setup chatbot routes
export function setupChatbot(app: Express) {
	// Create chatbot endpoint
	app.post(
		'/api/chatbot',
		isAuthenticated,
		async (req: Request, res: Response) => {
			try {
				const { message, role } = req.body;

				if (!message) {
					return res.status(400).json({ message: 'Message is required' });
				}

				// Generate response based on user role
				let response;
				if (role === 'patient') {
					response = await openai.generatePatientResponse(message);
				} else if (role === 'doctor') {
					response = await openai.generateDoctorResponse(message);
				} else {
					response = "I'm your health assistant. How can I help you today?";
				}

				res.json({ message: response });
			} catch (error) {
				console.error('Chatbot error:', error);
				res.status(500).json({ message: 'Failed to process chatbot request' });
			}
		}
	);
}
