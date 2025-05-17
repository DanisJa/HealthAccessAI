import { Express, Request, Response } from 'express';
import OpenAI from 'openai';
import { isAuthenticated } from './auth';
import dotenv from 'dotenv';
dotenv.config(); // Must be early, before accessing process.env

// Initialize OpenAI API client (v4+ syntax)
const openai = new OpenAI({
	apiKey: process.env.OPENAI_KEY,
});

export function setupChatbot(app: Express) {
	app.post(
		'/api/chatbot',
		isAuthenticated,
		async (req: Request, res: Response) => {
			try {
				const { message, role } = req.body;
				if (!message) {
					return res.status(400).json({ message: 'Message is required' });
				}

				// Choose prompt and temperature by role
				let systemPrompt: string;
				let temperature: number;
				if (role === 'patient') {
					systemPrompt =
						'You are a compassionate medical assistant. Respond to patient inquiries in clear, simple language, without medical jargon. Provide empathetic and supportive answers.';
					temperature = 0.7;
				} else if (role === 'doctor') {
					systemPrompt =
						'You are an expert medical assistant for healthcare professionals. Provide concise, technical responses with supporting medical reasoning and references when appropriate.';
					temperature = 0.3;
				} else {
					return res.json({
						message: "I'm your health assistant. How can I help you today?",
					});
				}

				const messages = [
					{ role: 'system', content: systemPrompt },
					{ role: 'user', content: message },
				];

				// Call OpenAI API
				const completion = await openai.chat.completions.create({
					model: 'gpt-4o-mini',
					messages: messages[0].content,
				});

				const responseText =
					completion.choices?.[0]?.message?.content?.trim() ?? '';
				res.json({ message: responseText });
			} catch (error) {
				console.error('Chatbot error:', error);
				res.status(500).json({ message: 'Failed to process chatbot request' });
			}
		}
	);
}
