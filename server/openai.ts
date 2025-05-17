import { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import axios from 'axios';
dotenv.config(); // Ensure environment variables are loaded early

console.log(process.env.OPENAI_KEY);

export function setupChatbot(app: Express) {
	app.post('/api/chatbot', async (req: Request, res: Response) => {
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

			// Prepare request to OpenAI API
			const response = await axios.post(
				'https://api.openai.com/v1/chat/completions',
				{
					model: 'gpt-4o',
					messages: [
						{ role: 'system', content: systemPrompt },
						{ role: 'user', content: message },
					],
					temperature,
				},
				{
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${process.env.OPENAI_KEY}`,
					},
				}
			);

			const responseText =
				response.data.choices?.[0]?.message?.content?.trim() || '';
			res.json({ message: responseText });
		} catch (error) {
			console.error('Chatbot error:', error);
			res.status(500).json({ message: 'Failed to process chatbot request' });
		}
	});
}
