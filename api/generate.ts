import { GoogleGenAI } from '@google/genai';

// The server securely accesses the environment variable. 
// The browser will NEVER see this.
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default async function handler(req: any, res: any) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // We receive the model and contents from your frontend
    const { model, contents } = req.body;
    
    // Call the Gemini API securely from the server
    const response = await ai.models.generateContent({
      model,
      contents
    });

    // Send the generated image data back to the frontend
    res.status(200).json(response);
    
  } catch (error: any) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate content' });
  }
}