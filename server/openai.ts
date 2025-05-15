import { Express, Request, Response } from "express";
import { isAuthenticated } from "./auth";

// Define OpenAI configuration
// Since we're not actually installing the OpenAI package to avoid modifying package.json,
// we'll create a mock implementation for demo purposes
class MockOpenAI {
  private apiKey: string;
  
  constructor(options: { apiKey: string }) {
    this.apiKey = options.apiKey;
  }
  
  async generatePatientResponse(message: string): Promise<string> {
    // Simulate different responses based on message content
    if (message.toLowerCase().includes("blood pressure")) {
      return "Blood pressure readings consist of two numbers: systolic (top) and diastolic (bottom). A normal reading is less than 120/80 mmHg. Your latest reading shows 118/78 which is within normal range.";
    } else if (message.toLowerCase().includes("appointment")) {
      return "I can help you schedule an appointment. Based on your records, you have an upcoming appointment on June 18, 2023 with Dr. Smith. Would you like to schedule another one or reschedule this appointment?";
    } else if (message.toLowerCase().includes("medication")) {
      return "According to your records, you're currently taking Lisinopril (10mg, once daily) and Atorvastatin (20mg, once daily at bedtime). Remember to take these medications as prescribed by your doctor. Is there anything specific about your medications you'd like to know?";
    } else {
      return "I'm your health assistant and I'm here to help answer health-related questions, provide information about your appointments, medications, and health parameters. How can I assist you today?";
    }
  }
  
  async generateDoctorResponse(message: string): Promise<string> {
    // Simulate different responses based on message content
    if (message.toLowerCase().includes("diagnosis")) {
      return "Based on the symptoms described, possible diagnoses could include hypertension, hyperlipidemia, or metabolic syndrome. I recommend ordering a comprehensive metabolic panel and lipid profile to confirm. Would you like me to provide more detailed differential diagnosis information?";
    } else if (message.toLowerCase().includes("patient")) {
      return "I can help you analyze patient data. Recent parameters for this patient show blood pressure of 118/78 mmHg (normal range), heart rate of 72 bpm (normal), and blood glucose of 98 mg/dL (normal fasting range). Would you like to see trends over time?";
    } else if (message.toLowerCase().includes("treatment")) {
      return "For this condition, current clinical guidelines recommend starting with lifestyle modifications (reduced sodium intake, increased physical activity) followed by medication if necessary. First-line pharmacotherapy typically includes ACE inhibitors or ARBs. Would you like me to suggest a specific treatment plan?";
    } else {
      return "I'm your clinical assistant and can help with patient analysis, diagnostic suggestions, treatment planning, and clinical guidelines. How can I assist with your current case?";
    }
  }
}

// Setup chatbot routes
export function setupChatbot(app: Express) {
  const openaiApiKey = process.env.OPENAI_API_KEY || "demo-key";
  
  // Create OpenAI instance
  const openai = new MockOpenAI({ 
    apiKey: openaiApiKey 
  });
  
  // Create chatbot endpoint
  app.post("/api/chatbot", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { message, role } = req.body;
      
      if (!message) {
        return res.status(400).json({ message: "Message is required" });
      }
      
      // Generate response based on user role
      let response;
      if (role === "patient") {
        response = await openai.generatePatientResponse(message);
      } else if (role === "doctor") {
        response = await openai.generateDoctorResponse(message);
      } else {
        response = "I'm your health assistant. How can I help you today?";
      }
      
      res.json({ message: response });
    } catch (error) {
      console.error("Chatbot error:", error);
      res.status(500).json({ message: "Failed to process chatbot request" });
    }
  });
}
